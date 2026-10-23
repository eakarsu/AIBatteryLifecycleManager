'use strict';
const test = require('node:test'); const assert = require('node:assert/strict');
const { FEATURES, runFeaturePackAi } = require('../lib/featurePack28a');
test('28A features are domain-grounded (2-3)', () => { assert.ok(Object.keys(FEATURES).length >= 2 && Object.keys(FEATURES).length <= 3); });
test('deterministic fallback preserves 0/false/empty without provider', async () => {
  let called = false;
  const out = await runFeaturePackAi('fleet-health-summary', [{ pack_id: 'P-1', status: 'in_service', capacity_kwh: 0 }], {}, async () => { called = true; throw new Error('must not call'); });
  assert.equal(called, false); assert.equal(out.aiGenerated, false); assert.equal(out.metrics.total_capacity_kwh, 0); assert.equal(out.metrics.all_operational, true); assert.deepEqual(out.needs_attention_pack_ids, []);
});
test('fallback counts weak packs and unknown feature is null', async () => {
  const out = await runFeaturePackAi('fleet-health-summary', [{ pack_id: 'P-2', status: 'fault', capacity_kwh: 10 }], {}, global.fetch);
  assert.equal(out.metrics.needs_attention_count, 1); assert.equal(out.metrics.all_operational, false);
  assert.equal(await runFeaturePackAi('nope', [], {}, global.fetch), null);
});
