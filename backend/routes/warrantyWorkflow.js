// Warranty workflow state machine (CUSTOM-MISSING-3).
// Reasonable-default state set: intake -> diagnosis -> approval -> resolution -> closed (or rejected at any stage).
const express = require('express');
const buildCrud = require('./_crudFactory');
const pool = require('../config/database');

const STATES = ['intake','diagnosis','approval','resolution','closed','rejected'];
const TRANSITIONS = {
  intake:     ['diagnosis','rejected'],
  diagnosis:  ['approval','rejected'],
  approval:   ['resolution','rejected'],
  resolution: ['closed','rejected'],
  closed:     [],
  rejected:   [],
};

const crud = buildCrud({
  table: 'warranty_workflow',
  fields: ['workflow_id','claim_id','state','assignee','sla_due_at','notes'],
});

const router = express.Router();

// Expose state machine config for the frontend.
router.get('/state-machine', (_req, res) => {
  res.json({ states: STATES, transitions: TRANSITIONS });
});

// POST /api/warranty-workflow/:id/transition  { to_state, notes }
router.post('/:id/transition', async (req, res) => {
  try {
    const { to_state, notes } = req.body || {};
    if (!STATES.includes(to_state)) {
      return res.status(400).json({ error: `to_state must be one of ${STATES.join(',')}` });
    }
    const cur = await pool.query('SELECT state FROM warranty_workflow WHERE id = $1', [req.params.id]);
    if (!cur.rows.length) return res.status(404).json({ error: 'workflow not found' });
    const from = cur.rows[0].state || 'intake';
    const allowed = TRANSITIONS[from] || [];
    if (!allowed.includes(to_state)) {
      return res.status(400).json({ error: `cannot transition from ${from} to ${to_state}`, allowed });
    }
    const r = await pool.query(
      'UPDATE warranty_workflow SET state = $1, notes = COALESCE($2, notes), updated_at = NOW() WHERE id = $3 RETURNING *',
      [to_state, notes || null, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.use('/', crud);

module.exports = router;
