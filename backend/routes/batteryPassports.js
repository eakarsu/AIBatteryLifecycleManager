// Battery Passport entity (EU Battery Regulation 2023/1542 aligned).
// CRUD via factory + a read-only "public" lookup by slug.
const express = require('express');
const buildCrud = require('./_crudFactory');
const pool = require('../config/database');

const crud = buildCrud({
  table: 'battery_passports',
  fields: ['passport_id','pack_id','chemistry','manufacturer','manufacture_date','nominal_capacity_kwh','recycled_content_pct','carbon_footprint_kg_co2e','supply_chain','public_url_slug','status'],
});

const router = express.Router();

// Public-style lookup by slug (still behind auth — public surface stub).
// External CIRPASS registry integration deferred (NEEDS-CREDS).
router.get('/public/:slug', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT passport_id, pack_id, chemistry, manufacturer, manufacture_date, nominal_capacity_kwh, recycled_content_pct, carbon_footprint_kg_co2e, supply_chain FROM battery_passports WHERE public_url_slug = $1 AND status = $2',
      [req.params.slug, 'published']
    );
    if (!r.rows.length) return res.status(404).json({ error: 'passport not found or not published' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// EU CIRPASS public registry push — NEEDS-CREDS, returns 503.
router.post('/:id/publish-registry', (req, res) => {
  res.status(503).json({
    error: 'EU CIRPASS public registry integration not configured',
    needs: ['CIRPASS_API_KEY','CIRPASS_REGISTRY_URL'],
  });
});

router.use('/', crud);

module.exports = router;
