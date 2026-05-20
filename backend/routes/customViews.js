// Custom analytics views for the battery lifecycle UI.
//   GET /api/custom-views/degradation-curves
//     -> [{ pack_id, points: [{ cycle_count, soh_pct }], knee_point }]
//   GET /api/custom-views/cell-voltages?pack_id=PACK-001
//     -> { pack_id, nominal_v, cells: [{ cell_id, position, voltage_v, status }] }

const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Multi-pack SoH degradation curves with a "knee point" at 80% SoH.
router.get('/degradation-curves', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT pack_id, cycle_count, soh_pct, captured_at
      FROM degradation_curves
      WHERE pack_id IS NOT NULL
      ORDER BY pack_id, cycle_count ASC
    `);

    const byPack = new Map();
    for (const row of r.rows) {
      const cycle = Number(row.cycle_count) || 0;
      const soh = Number(row.soh_pct) || 0;
      if (!byPack.has(row.pack_id)) byPack.set(row.pack_id, []);
      byPack.get(row.pack_id).push({ cycle_count: cycle, soh_pct: soh });
    }

    const packs = [];
    for (const [pack_id, points] of byPack.entries()) {
      // Find first point where SoH crosses below 80%.
      let knee = null;
      for (const p of points) {
        if (p.soh_pct <= 80) { knee = p; break; }
      }
      packs.push({
        pack_id,
        sample_count: points.length,
        knee_point: knee,
        points,
      });
    }

    // Stable ordering: most points first, then pack id.
    packs.sort((a, b) => b.sample_count - a.sample_count || String(a.pack_id).localeCompare(String(b.pack_id)));

    res.json({ packs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cell voltage heatmap for a single pack.
router.get('/cell-voltages', async (req, res) => {
  try {
    const NOMINAL_V = 3.6;
    const requested = (req.query.pack_id || '').trim();

    let pack_id = requested;
    if (!pack_id) {
      const p = await pool.query(`
        SELECT pack_id, COUNT(*) AS n
        FROM cells
        WHERE pack_id IS NOT NULL
        GROUP BY pack_id
        ORDER BY n DESC
        LIMIT 1
      `);
      pack_id = p.rows[0]?.pack_id || null;
    }

    const packs = await pool.query(`
      SELECT DISTINCT pack_id
      FROM cells
      WHERE pack_id IS NOT NULL
      ORDER BY pack_id ASC
    `);

    if (!pack_id) {
      return res.json({ pack_id: null, nominal_v: NOMINAL_V, cells: [], available_packs: packs.rows.map((r) => r.pack_id) });
    }

    const r = await pool.query(`
      SELECT id, cell_id, pack_id, position, voltage_v, temperature_c, status
      FROM cells
      WHERE pack_id = $1
      ORDER BY id ASC
    `, [pack_id]);

    const cells = r.rows.map((row) => {
      const v = Number(row.voltage_v) || 0;
      const delta = Math.abs(v - NOMINAL_V);
      let band = 'nominal';
      if (v <= 0) band = 'unknown';
      else if (delta >= 0.25) band = 'imbalanced';
      else if (v < NOMINAL_V - 0.05) band = 'low';
      else if (v > NOMINAL_V + 0.05) band = 'high';
      return {
        id: row.id,
        cell_id: row.cell_id,
        position: row.position,
        voltage_v: v,
        temperature_c: Number(row.temperature_c) || 0,
        status: row.status,
        band,
      };
    });

    res.json({
      pack_id,
      nominal_v: NOMINAL_V,
      available_packs: packs.rows.map((r) => r.pack_id),
      cell_count: cells.length,
      cells,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
