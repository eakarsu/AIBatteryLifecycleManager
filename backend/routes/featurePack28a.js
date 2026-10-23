'use strict';
const express = require('express');
const { FEATURES, runFeaturePackAi } = require('../lib/featurePack28a');
// Records are loaded from this app's own tables per feature.
function createFeaturePackAiRouter({ pool, loaders } = {}) {
  const router = express.Router();
  router.get('/features', (req, res) => res.json({ features: Object.keys(FEATURES) }));
  router.post('/:feature', async (req, res) => {
    if (!FEATURES[req.params.feature]) return res.status(404).json({ error: 'unknown feature', features: Object.keys(FEATURES) });
    let records = Array.isArray(req.body?.records) || (req.body?.records && typeof req.body.records === 'object') ? req.body.records : null;
    if (records === null && pool && loaders && loaders[req.params.feature]) {
      try { records = await loaders[req.params.feature](pool); } catch { records = []; }
    }
    return res.json(await runFeaturePackAi(req.params.feature, records || []));
  });
  return router;
}
module.exports = { createFeaturePackAiRouter };
