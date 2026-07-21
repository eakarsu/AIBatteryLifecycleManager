const express = require('express');
const pool = require('../config/database');
const { requireWriter } = require('../middleware/auth');
const { validateTelemetry, assessLifecycle } = require('../domain/lifecycleWorkflow');

const router = express.Router();

router.post('/assessments', requireWriter, async (req, res) => {
  const errors = validateTelemetry(req.body);
  if (errors.length) return res.status(400).json({ error: 'validation_failed', details: errors });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pack = await client.query('SELECT pack_id, chemistry FROM battery_packs WHERE pack_id=$1', [req.body.pack_id]);
    if (!pack.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'battery_pack_not_found' }); }
    const previous = await client.query('SELECT a.* FROM lifecycle_observations o JOIN lifecycle_assessments a ON a.observation_id=o.id WHERE o.source_event_id=$1', [req.body.source_event_id]);
    if (previous.rows.length) { await client.query('ROLLBACK'); return res.json({ assessment: previous.rows[0], idempotent_replay: true }); }
    const normalized = { ...req.body, chemistry: req.body.chemistry || pack.rows[0].chemistry };
    const decision = assessLifecycle(normalized);
    const observation = await client.query(
      `INSERT INTO lifecycle_observations (pack_id,source_event_id,observed_at,provenance,telemetry,chemistry,duty_cycle,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [normalized.pack_id, normalized.source_event_id, normalized.observed_at, normalized.provenance, normalized.telemetry, normalized.chemistry, normalized.duty_cycle || null, req.user.email]
    );
    const assessment = await client.query(
      `INSERT INTO lifecycle_assessments
       (observation_id,ruleset_version,model_name,model_version,severity,safety_hold,proposed_disposition,decision)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [observation.rows[0].id, decision.ruleset_version, decision.model.name, decision.model.version, decision.severity, decision.safety_hold, decision.proposed_disposition, decision]
    );
    await client.query('COMMIT');
    res.status(201).json({ observation: observation.rows[0], assessment: assessment.rows[0], decision, warning: 'Assessment is advisory. No BMS command, dispatch, transport, or recycling action was executed.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('lifecycle assessment failed:', error);
    res.status(500).json({ error: 'assessment_failed' });
  } finally { client.release(); }
});

router.post('/assessments/:id/approve', requireWriter, async (req, res) => {
  const result = await pool.query(
    `UPDATE lifecycle_assessments SET status='approved', approved_by=$1, approved_at=NOW()
     WHERE id=$2 AND status='draft' RETURNING *`,
    [req.user.email, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'draft_assessment_not_found' });
  res.json({ assessment: result.rows[0], warning: 'Approval records a disposition decision only; physical action remains blocked on external safety procedures.' });
});

module.exports = router;
