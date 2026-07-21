'use strict';

const RULESET_VERSION = 'battery-lifecycle-safety-2026-07-18';

function validateTelemetry(input = {}) {
  const errors = [];
  if (typeof input.pack_id !== 'string' || !input.pack_id.trim()) errors.push('pack_id is required');
  if (typeof input.source_event_id !== 'string' || !input.source_event_id.trim()) errors.push('source_event_id is required');
  if (!input.observed_at || Number.isNaN(Date.parse(input.observed_at))) errors.push('observed_at must be an ISO timestamp');
  if (!input.provenance || typeof input.provenance.source !== 'string') errors.push('provenance.source is required');
  for (const [key, min, max] of [['soh_pct', 0, 100], ['temperature_max_c', -80, 150], ['voltage_delta_v', 0, 20]]) {
    const value = Number(input.telemetry?.[key]);
    if (!Number.isFinite(value) || value < min || value > max) errors.push(`telemetry.${key} must be between ${min} and ${max}`);
  }
  if (!input.model || typeof input.model.name !== 'string' || typeof input.model.version !== 'string') errors.push('model name and version are required');
  return errors;
}

function assessLifecycle(input) {
  const soh = Number(input.telemetry.soh_pct);
  const temp = Number(input.telemetry.temperature_max_c);
  const delta = Number(input.telemetry.voltage_delta_v);
  let severity = 'low';
  if (temp >= 60 || delta >= 0.5) severity = 'critical';
  else if (temp >= 50 || delta >= 0.3 || soh < 60) severity = 'high';
  else if (temp >= 42 || delta >= 0.15 || soh < 80) severity = 'medium';

  const safetyHold = severity === 'critical' || severity === 'high';
  let disposition = 'continue_monitored_service';
  if (soh < 60) disposition = 'recycling_evaluation';
  else if (soh < 80) disposition = 'second_life_evaluation';
  if (safetyHold) disposition = 'quarantine_review';

  return {
    ruleset_version: RULESET_VERSION,
    model: input.model,
    severity,
    safety_hold: safetyHold,
    proposed_disposition: disposition,
    requires_operator_approval: true,
    automatic_dispatch: false,
    evidence: { soh_pct: soh, temperature_max_c: temp, voltage_delta_v: delta, chemistry: input.chemistry || null, duty_cycle: input.duty_cycle || null },
  };
}

module.exports = { RULESET_VERSION, validateTelemetry, assessLifecycle };
