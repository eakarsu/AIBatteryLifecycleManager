// Supplier / OEM / MES integration stubs (NONAI-MISSING-3 — NEEDS-CREDS).
// Returns 503 until credentials provisioned.
const express = require('express');
const router = express.Router();

function notConfigured(needs) {
  return (_req, res) =>
    res.status(503).json({
      error: 'Supplier integration not configured',
      needs,
    });
}

router.get('/oem-feed',    notConfigured(['OEM_FEED_API_KEY','OEM_FEED_URL']));
router.post('/oem-feed/sync', notConfigured(['OEM_FEED_API_KEY','OEM_FEED_URL']));

router.get('/cell-vendor-feed', notConfigured(['CELL_VENDOR_API_KEY','CELL_VENDOR_URL']));
router.post('/cell-vendor-feed/sync', notConfigured(['CELL_VENDOR_API_KEY','CELL_VENDOR_URL']));

router.get('/mes-connector', notConfigured(['MES_CONNECTOR_URL','MES_CONNECTOR_TOKEN']));
router.post('/mes-connector/sync', notConfigured(['MES_CONNECTOR_URL','MES_CONNECTOR_TOKEN']));

module.exports = router;
