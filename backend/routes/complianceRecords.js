// Regulatory compliance tracker (EU Battery Regulation, UN 38.3, IEC 62619, UL 1973).
// CRUD via factory + a deterministic scoring endpoint over the matrix.
const express = require('express');
const buildCrud = require('./_crudFactory');
const pool = require('../config/database');

const crud = buildCrud({
  table: 'compliance_records',
  fields: ['record_id','asset_id','regulation','jurisdiction','due_date','evidence_url','status','notes'],
});

const router = express.Router();

// GET /api/compliance-records/score?asset_id=<id>
// Returns a rule-based score: %compliant minus overdue penalty.
router.get('/score', async (req, res) => {
  try {
    const assetId = (req.query.asset_id || '').toString();
    const params = [];
    let where = '';
    if (assetId) { params.push(assetId); where = 'WHERE asset_id = $1'; }
    const r = await pool.query(`SELECT status, due_date FROM compliance_records ${where}`, params);
    const rows = r.rows;
    const total = rows.length;
    const compliant = rows.filter((x) => x.status === 'compliant').length;
    const pending = rows.filter((x) => x.status === 'pending').length;
    const failed = rows.filter((x) => x.status === 'failed' || x.status === 'expired').length;
    const today = new Date();
    const overdue = rows.filter((x) => x.due_date && new Date(x.due_date) < today && x.status !== 'compliant').length;
    const base = total > 0 ? (compliant / total) * 100 : 0;
    const penalty = total > 0 ? (overdue / total) * 30 : 0;
    const score = Math.max(0, Math.round(base - penalty));
    let rating = 'F';
    if (score >= 90) rating = 'A';
    else if (score >= 75) rating = 'B';
    else if (score >= 60) rating = 'C';
    else if (score >= 40) rating = 'D';
    res.json({
      asset_id: assetId || null,
      total, compliant, pending, failed, overdue,
      score, rating,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.use('/', crud);

module.exports = router;
