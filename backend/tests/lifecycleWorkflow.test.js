const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTelemetry, assessLifecycle } = require('../domain/lifecycleWorkflow');

test('critical telemetry creates a quarantine draft without dispatch', () => {
  const input = { pack_id: 'PACK-1', source_event_id: 'bms-88', observed_at: '2026-07-18T12:00:00Z', provenance: { source: 'BMS-A' }, chemistry: 'LFP', duty_cycle: 'fleet', telemetry: { soh_pct: 76, temperature_max_c: 62, voltage_delta_v: 0.12 }, model: { name: 'deterministic-thresholds', version: '1.0.0' } };
  assert.deepEqual(validateTelemetry(input), []);
  const result = assessLifecycle(input);
  assert.equal(result.severity, 'critical');
  assert.equal(result.safety_hold, true);
  assert.equal(result.proposed_disposition, 'quarantine_review');
  assert.equal(result.automatic_dispatch, false);
});

test('battery workflow rejects missing provenance and model metadata', () => {
  assert.ok(validateTelemetry({ pack_id: 'x', telemetry: {} }).length >= 5);
});
