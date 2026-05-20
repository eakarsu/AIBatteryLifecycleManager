const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [
      packs, cells, modules, chargers, sites, customers, leases, secondLife, warranty,
      telemetry, curves, sohReports, dispatch, recycling, certs, maint, alarms, audit,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='in_service') AS in_service, COUNT(*) FILTER (WHERE status='retired') AS retired, COALESCE(SUM(capacity_kwh),0) AS total_kwh FROM battery_packs"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='nominal') AS nominal, COUNT(*) FILTER (WHERE status='warning') AS warning, COUNT(*) FILTER (WHERE status='fault') AS fault FROM cells"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='in_service') AS in_service, COUNT(*) FILTER (WHERE status='swapped') AS swapped FROM modules"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='online') AS online, COUNT(*) FILTER (WHERE status='offline') AS offline FROM chargers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COALESCE(SUM(capacity_kwh),0) AS total_kwh FROM sites"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active FROM customers"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='expired') AS expired FROM leases"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='routed') AS routed, COUNT(*) FILTER (WHERE status='evaluation') AS evaluation FROM second_life_units"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE status='approved') AS approved FROM warranty_claims"),
      pool.query("SELECT COUNT(*) AS total FROM telemetry"),
      pool.query("SELECT COUNT(*) AS total FROM degradation_curves"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='final') AS final FROM soh_reports"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COUNT(*) FILTER (WHERE status='executed') AS executed FROM dispatch_schedules"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='scheduled') AS scheduled, COALESCE(SUM(value_usd),0) AS total_value FROM recycling_orders"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='valid') AS valid, COUNT(*) FILTER (WHERE status='expired') AS expired FROM certifications"),
      pool.query("SELECT COUNT(*) AS total FROM maintenance_logs"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='open') AS open, COUNT(*) FILTER (WHERE severity='critical') AS critical FROM alarms"),
      pool.query("SELECT COUNT(*) AS total FROM audit_log"),
    ]);
    res.json({
      battery_packs:      packs.rows[0],
      cells:              cells.rows[0],
      modules:            modules.rows[0],
      chargers:           chargers.rows[0],
      sites:              sites.rows[0],
      customers:          customers.rows[0],
      leases:             leases.rows[0],
      second_life_units:  secondLife.rows[0],
      warranty_claims:    warranty.rows[0],
      telemetry:          telemetry.rows[0],
      degradation_curves: curves.rows[0],
      soh_reports:        sohReports.rows[0],
      dispatch_schedules: dispatch.rows[0],
      recycling_orders:   recycling.rows[0],
      certifications:     certs.rows[0],
      maintenance_logs:   maint.rows[0],
      alarms:             alarms.rows[0],
      audit_log:          audit.rows[0],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
