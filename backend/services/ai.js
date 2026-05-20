// AI helper service for AIBatteryLifecycleManager
// Reads OPENROUTER_API_KEY and OPENROUTER_MODEL from:
//   1. this project's .env (already loaded by server.js)
//   2. fallback: /Users/erolakarsu/projects/beauty-wellness-ai/.env (canonical source)
// Never overwrites or wipes credentials.

const fs = require('fs');
const path = require('path');

const FALLBACK_ENV = '/Users/erolakarsu/projects/beauty-wellness-ai/.env';

function readFallbackEnv() {
  try {
    if (!fs.existsSync(FALLBACK_ENV)) return {};
    const raw = fs.readFileSync(FALLBACK_ENV, 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[m[1]] = val;
    }
    return out;
  } catch (e) {
    console.warn('[ai] fallback env read failed:', e.message);
    return {};
  }
}

function getOpenRouterCreds() {
  const fb = readFallbackEnv();
  const key = process.env.OPENROUTER_API_KEY || fb.OPENROUTER_API_KEY || '';
  const model = process.env.OPENROUTER_MODEL || fb.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
  return { key, model };
}

const SYSTEM_PROMPT =
  'You are a senior battery lifecycle engineer supporting a unified BESS + EV second-life operations platform. ' +
  'You provide rigorous, engineering-grade reasoning on state-of-health forecasting, thermal risk, warranty workflow, ' +
  'second-life routing, dispatch optimisation and recycling economics. Always return strict JSON in the exact ' +
  'schema requested. Never wrap your JSON in markdown fences. Treat every input as a tabletop / advisory exercise.';

function callOpenRouter(systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const { key, model } = getOpenRouterCreds();
    if (!key) {
      return resolve({ error: 'OPENROUTER_API_KEY not configured' });
    }
    const https = require('https');
    const payload = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'http://localhost:3064',
        'X-Title': 'AI Battery Lifecycle Manager',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            return resolve({ error: parsed.error.message || 'OpenRouter error', raw: body });
          }
          const content = parsed.choices?.[0]?.message?.content || '';
          resolve(content);
        } catch (e) {
          resolve({ error: 'AI response parse failed', raw: body });
        }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(payload);
    req.end();
  });
}

function safeJsonParse(response, fallback) {
  if (response && typeof response === 'object' && response.error) {
    return { ...fallback, error: response.error };
  }
  if (response == null) return { ...fallback, summary: '' };
  if (typeof response === 'object') return response;
  const text = String(response).trim();
  try { return JSON.parse(text); } catch (_) {}
  try {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(text.slice(start, i + 1)); }
      }
    }
  } catch (_) {}
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) return JSON.parse(fenced[1].trim());
  } catch (_) {}
  return { ...fallback, summary: text };
}

// ──────────────────────────────────────────────────────────────
// 1. Degradation forecast — project SoH out N cycles
// ──────────────────────────────────────────────────────────────
async function degradationForecast(pack, horizon = {}) {
  const sys = `${SYSTEM_PROMPT} Forecast battery pack capacity fade. Return strict JSON:
{
  "pack_id": string,
  "current_soh_pct": number,
  "projection": [{ "cycles_from_now": number, "projected_soh_pct": number, "narrative": string }],
  "knee_point_cycle": number,
  "end_of_life_cycle": number,
  "confidence_pct": number,
  "key_drivers": [string],
  "summary": string
}`;
  const usr = `Pack:\n${JSON.stringify(pack, null, 2)}\n\nHorizon:\n${JSON.stringify(horizon, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', projection: [] });
}

// ──────────────────────────────────────────────────────────────
// 2. SoH trend — multi-pack fleet trend
// ──────────────────────────────────────────────────────────────
async function sohTrend(packs = []) {
  const sys = `${SYSTEM_PROMPT} Analyse SoH trends across a fleet. Return strict JSON:
{
  "fleet_size": number,
  "fleet_soh_avg_pct": number,
  "fleet_soh_p10_pct": number,
  "fleet_soh_p90_pct": number,
  "trend_direction": "improving"|"stable"|"declining",
  "outliers": [{ "pack_id": string, "soh_pct": number, "reason": string }],
  "cohort_analysis": [{ "chemistry": string, "avg_soh_pct": number, "sample_size": number }],
  "summary": string
}`;
  const usr = `Packs:\n${JSON.stringify(packs, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', outliers: [] });
}

// ──────────────────────────────────────────────────────────────
// 3. Warranty draft — generate claim draft
// ──────────────────────────────────────────────────────────────
async function warrantyDraft(claim) {
  const sys = `${SYSTEM_PROMPT} Draft a warranty claim package. Return strict JSON:
{
  "claim_id": string,
  "pack_id": string,
  "defect_type": string,
  "evidence_required": [string],
  "covered_by_warranty": boolean,
  "warranty_clause_reference": string,
  "draft_letter": string,
  "recommended_remedy": "repair"|"replace"|"prorated_credit"|"deny",
  "expected_processing_days": number,
  "summary": string
}`;
  const usr = `Claim:\n${JSON.stringify(claim, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', evidence_required: [] });
}

// ──────────────────────────────────────────────────────────────
// 4. Second-life route — recommend repurposing path
// ──────────────────────────────────────────────────────────────
async function secondLifeRoute(unit) {
  const sys = `${SYSTEM_PROMPT} Recommend a second-life route for a retired EV / BESS module. Return strict JSON:
{
  "unit_id": string,
  "source_pack": string,
  "soh_pct": number,
  "recommended_application": string,
  "rationale": string,
  "expected_remaining_cycles": number,
  "resale_value_usd": number,
  "alternates": [{ "application": string, "rationale": string }],
  "go_no_go": "go"|"caution"|"divert_to_recycle",
  "summary": string
}`;
  const usr = `Unit:\n${JSON.stringify(unit, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', alternates: [] });
}

// ──────────────────────────────────────────────────────────────
// 5. Dispatch optimize — optimise BESS dispatch into market
// ──────────────────────────────────────────────────────────────
async function dispatchOptimize(pack, market = {}) {
  const sys = `${SYSTEM_PROMPT} Optimise BESS dispatch into an energy market. Return strict JSON:
{
  "pack_id": string,
  "market": string,
  "schedule": [{ "interval": string, "action": "charge"|"discharge"|"idle", "kw": number, "rationale": string }],
  "expected_revenue_usd": number,
  "expected_cycles_consumed": number,
  "soh_impact_pct": number,
  "constraints_respected": [string],
  "summary": string
}`;
  const usr = `Pack:\n${JSON.stringify(pack, null, 2)}\n\nMarket:\n${JSON.stringify(market, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', schedule: [] });
}

// ──────────────────────────────────────────────────────────────
// 6. Thermal risk — assess thermal runaway / hot-cell risk
// ──────────────────────────────────────────────────────────────
async function thermalRisk(packContext) {
  const sys = `${SYSTEM_PROMPT} Assess thermal risk for a pack under given conditions. Return strict JSON:
{
  "pack_id": string,
  "overall_risk": "low"|"medium"|"high"|"critical",
  "risk_score_pct": number,
  "hot_cells": [{ "cell_id": string, "temperature_c": number, "delta_from_avg_c": number, "concern": string }],
  "drivers": [{ "driver": string, "weight_pct": number, "narrative": string }],
  "mitigations": [{ "action": string, "lead_time_min": number, "priority": "low"|"medium"|"high" }],
  "evacuation_recommended": boolean,
  "summary": string
}`;
  const usr = `Context:\n${JSON.stringify(packContext, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', hot_cells: [] });
}

// ──────────────────────────────────────────────────────────────
// 7. Cell balance suggest — recommend balancing actions
// ──────────────────────────────────────────────────────────────
async function cellBalanceSuggest(packCells = []) {
  const sys = `${SYSTEM_PROMPT} Recommend cell balancing actions. Return strict JSON:
{
  "pack_id": string,
  "imbalance_mv": number,
  "imbalance_severity": "low"|"medium"|"high",
  "actions": [{ "cell_id": string, "action": "bleed"|"swap"|"monitor"|"isolate", "rationale": string }],
  "estimated_minutes_to_balance": number,
  "expected_capacity_recovery_pct": number,
  "summary": string
}`;
  const usr = `Cells:\n${JSON.stringify(packCells, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', actions: [] });
}

// ──────────────────────────────────────────────────────────────
// 8. Executive brief — operational snapshot for management
// ──────────────────────────────────────────────────────────────
async function executiveBrief(snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Produce a leadership brief on the battery fleet. Return strict JSON:
{
  "headline": string,
  "operational_picture": string,
  "fleet_health": { "in_service_pct": number, "warning_pct": number, "fault_pct": number, "narrative": string },
  "top_warranty_exposures": [{ "pack_id": string, "issue": string, "estimated_cost_usd": number }],
  "second_life_opportunities": [{ "unit_id": string, "application": string, "value_usd": number }],
  "top_risks": [{ "risk": string, "severity": "low"|"medium"|"high"|"critical", "owner": string }],
  "decisions_required": [{ "decision": string, "deadline": string, "options": [string], "recommendation": string }],
  "next_24h_outlook": string,
  "summary": string
}`;
  const usr = `Operational snapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response' });
}

// ──────────────────────────────────────────────────────────────
// 9. Recycling quote — black-mass / metal recovery value
// ──────────────────────────────────────────────────────────────
async function recyclingQuote(pack, vendorContext = {}) {
  const sys = `${SYSTEM_PROMPT} Quote a recycling order for a retired pack. Return strict JSON:
{
  "pack_id": string,
  "vendor": string,
  "estimated_mass_kg": number,
  "recovered_metals": [{ "metal": string, "kg": number, "value_usd": number }],
  "gross_value_usd": number,
  "transport_cost_usd": number,
  "processing_fee_usd": number,
  "net_value_usd": number,
  "lead_time_days": number,
  "summary": string
}`;
  const usr = `Pack:\n${JSON.stringify(pack, null, 2)}\n\nVendor context:\n${JSON.stringify(vendorContext, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', recovered_metals: [] });
}

// ──────────────────────────────────────────────────────────────
// 10. Vendor quality score — vendor scorecard
// ──────────────────────────────────────────────────────────────
async function vendorQualityScore(vendorContext) {
  const sys = `${SYSTEM_PROMPT} Score a battery vendor on fleet quality. Return strict JSON:
{
  "vendor": string,
  "overall_score": number,
  "rating": "A"|"B"|"C"|"D"|"F",
  "sub_scores": [{ "dimension": "capacity_retention"|"warranty_rate"|"thermal_events"|"cycle_life"|"on_time_delivery", "score": number, "narrative": string }],
  "strengths": [string],
  "concerns": [string],
  "recommended_action": "expand"|"hold"|"reduce"|"replace",
  "summary": string
}`;
  const usr = `Vendor context:\n${JSON.stringify(vendorContext, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', sub_scores: [] });
}

// ──────────────────────────────────────────────────────────────
// 11. Customer SoH report — generate report for a customer
// ──────────────────────────────────────────────────────────────
async function customerSohReport(customer, packs = []) {
  const sys = `${SYSTEM_PROMPT} Generate a customer-facing SoH report. Return strict JSON:
{
  "customer": string,
  "period": string,
  "total_packs": number,
  "avg_soh_pct": number,
  "pack_summaries": [{ "pack_id": string, "soh_pct": number, "cycles": number, "trend": string }],
  "warranty_status": string,
  "recommendations": [string],
  "next_review_date": string,
  "summary": string
}`;
  const usr = `Customer:\n${JSON.stringify(customer, null, 2)}\n\nPacks:\n${JSON.stringify(packs, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', pack_summaries: [] });
}

// ──────────────────────────────────────────────────────────────
// 12. Fleet health — comprehensive fleet diagnostic
// ──────────────────────────────────────────────────────────────
async function fleetHealth(snapshot = {}) {
  const sys = `${SYSTEM_PROMPT} Build a fleet-level health report. Return strict JSON:
{
  "fleet_size": number,
  "health_score": number,
  "rating": "A"|"B"|"C"|"D"|"F",
  "category_breakdown": [{ "category": string, "count": number, "narrative": string }],
  "critical_packs": [{ "pack_id": string, "issue": string, "action": string }],
  "watch_list": [{ "pack_id": string, "reason": string }],
  "recommendations": [string],
  "summary": string
}`;
  const usr = `Snapshot:\n${JSON.stringify(snapshot, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', critical_packs: [] });
}

// ──────────────────────────────────────────────────────────────
// 13. Anomaly cluster — group anomalies for triage
// ──────────────────────────────────────────────────────────────
async function anomalyCluster(alarms = []) {
  const sys = `${SYSTEM_PROMPT} Cluster alarms / anomalies into root causes. Return strict JSON:
{
  "total_alarms": number,
  "clusters": [{
    "cluster_id": string,
    "size": number,
    "root_cause_hypothesis": string,
    "affected_assets": [string],
    "severity": "low"|"medium"|"high"|"critical",
    "recommended_action": string
  }],
  "noise_alarms": number,
  "summary": string
}`;
  const usr = `Alarms:\n${JSON.stringify(alarms, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', clusters: [] });
}

// ──────────────────────────────────────────────────────────────
// 14. Capacity fade explain — explain root cause of fade
// ──────────────────────────────────────────────────────────────
async function capacityFadeExplain(pack, history = []) {
  const sys = `${SYSTEM_PROMPT} Explain capacity fade drivers for a pack. Return strict JSON:
{
  "pack_id": string,
  "current_soh_pct": number,
  "fade_since_install_pct": number,
  "primary_mechanism": "SEI_growth"|"lithium_plating"|"loss_of_active_material"|"electrolyte_decomposition"|"mechanical_damage"|"thermal_stress",
  "contributing_factors": [{ "factor": string, "weight_pct": number, "narrative": string }],
  "expected_remaining_useful_life_cycles": number,
  "remediations": [string],
  "summary": string
}`;
  const usr = `Pack:\n${JSON.stringify(pack, null, 2)}\n\nHistory:\n${JSON.stringify(history, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', contributing_factors: [] });
}

// ──────────────────────────────────────────────────────────────
// 15. Replacement timeline — when to replace what
// ──────────────────────────────────────────────────────────────
async function replacementTimeline(packs = []) {
  const sys = `${SYSTEM_PROMPT} Build a replacement timeline for a fleet of packs. Return strict JSON:
{
  "horizon_months": number,
  "timeline": [{
    "pack_id": string,
    "expected_replacement_date": string,
    "current_soh_pct": number,
    "trigger": string,
    "estimated_cost_usd": number,
    "second_life_eligible": boolean
  }],
  "total_replacement_cost_usd": number,
  "second_life_recovery_usd": number,
  "summary": string
}`;
  const usr = `Packs:\n${JSON.stringify(packs, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', timeline: [] });
}

// ──────────────────────────────────────────────────────────────
// 16. PPA revenue forecast — site revenue projection
// ──────────────────────────────────────────────────────────────
async function ppaRevenueForecast(site, ppa = {}) {
  const sys = `${SYSTEM_PROMPT} Forecast PPA / tolling revenue for a BESS site. Return strict JSON:
{
  "site_id": string,
  "ppa_type": string,
  "monthly_revenue": [{ "month": string, "revenue_usd": number, "drivers": [string] }],
  "annual_revenue_usd": number,
  "degradation_drag_usd": number,
  "downside_case_usd": number,
  "upside_case_usd": number,
  "key_risks": [string],
  "summary": string
}`;
  const usr = `Site:\n${JSON.stringify(site, null, 2)}\n\nPPA terms:\n${JSON.stringify(ppa, null, 2)}`;
  const r = await callOpenRouter(sys, usr);
  return safeJsonParse(r, { summary: typeof r === 'string' ? r : 'No response', monthly_revenue: [] });
}

module.exports = {
  callOpenRouter,
  safeJsonParse,
  degradationForecast,
  sohTrend,
  warrantyDraft,
  secondLifeRoute,
  dispatchOptimize,
  thermalRisk,
  cellBalanceSuggest,
  executiveBrief,
  recyclingQuote,
  vendorQualityScore,
  customerSohReport,
  fleetHealth,
  anomalyCluster,
  capacityFadeExplain,
  replacementTimeline,
  ppaRevenueForecast,
};
