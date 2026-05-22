const express = require('express');

const router = express.Router();

let rows = [
  {
    id: 1,
    pack_id: 'BESS-PACK-1042',
    quarantine_reason: 'Thermal excursion after fast-charge cycle',
    risk_level: 'high',
    hold_status: 'quarantined',
    reviewer: 'Reliability Ops',
    recommended_action: 'Keep isolated; run cell impedance sweep before warranty release.',
    opened_at: '2026-05-20T14:30',
  },
  {
    id: 2,
    pack_id: 'EV-MOD-8831',
    quarantine_reason: 'Voltage imbalance across module group',
    risk_level: 'medium',
    hold_status: 'under_review',
    reviewer: 'Field Engineering',
    recommended_action: 'Balance cells and retest under 0.5C load.',
    opened_at: '2026-05-21T09:10',
  },
];

const nextId = () => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

router.get('/', (req, res) => res.json(rows));
router.get('/:id', (req, res) => {
  const row = rows.find((item) => item.id === Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});
router.post('/', (req, res) => {
  const row = { id: nextId(), ...req.body };
  rows.unshift(row);
  res.status(201).json(row);
});
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = rows.findIndex((item) => item.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  rows[idx] = { ...rows[idx], ...req.body, id };
  res.json(rows[idx]);
});
router.delete('/:id', (req, res) => {
  rows = rows.filter((item) => item.id !== Number(req.params.id));
  res.json({ message: 'deleted' });
});
router.post('/bulk-import', (req, res) => res.json({ inserted: 0, failed: 0, note: 'CSV import is not enabled for quarantine reviews yet.' }));
router.get('/:id/attachments', (req, res) => res.json([]));
router.post('/:id/attachments', (req, res) => res.status(501).json({ error: 'attachments not enabled for quarantine reviews' }));

module.exports = router;
