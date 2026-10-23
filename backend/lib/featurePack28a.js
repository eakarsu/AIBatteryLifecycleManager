'use strict';
// Wave 28A domain AI over this app's own records. Provider is called only when
// OPENROUTER_API_KEY or OPENAI_API_KEY is configured; otherwise a clearly
// labelled deterministic fallback is returned (aiGenerated:false).
const { providerConfigured } = require('./featurePack27b');

const FEATURES = {
  'fleet-health-summary': function fleetHealthSummary(packs) {
    const rows = Array.isArray(packs) ? packs : [];
    const byStatus = {};
    let totalCapacity = 0; const attention = [];
    for (const p of rows) {
      const s = String(p.status ?? 'unknown'); byStatus[s] = (byStatus[s] || 0) + 1;
      totalCapacity += Number(p.capacity_kwh) || 0;
      if (['warning', 'fault', 'maintenance'].includes(s)) attention.push(p.pack_id ?? p.id ?? null);
    }
    return { feature: 'fleet-health-summary', aiGenerated: false, source: 'deterministic-fallback', note: 'No AI provider result — computed deterministically from battery pack records.', summary: `${rows.length} pack(s) reviewed; ${attention.length} need attention.`, metrics: { total_packs: rows.length, total_capacity_kwh: Math.round(totalCapacity * 100) / 100, needs_attention_count: attention.length, all_operational: attention.length === 0 }, by_status: byStatus, needs_attention_pack_ids: attention };
  },
  'replacement-priority': function replacementPriority(input) {
    const packs = Array.isArray(input) ? input : (input.packs || []);
    const soh = Array.isArray(input) ? [] : (input.sohReports || []);
    const sohByPack = {}; for (const r of soh) { const k = r.pack_id; if (k != null && (sohByPack[k] === undefined || Number(r.soh_pct) < Number(sohByPack[k]))) sohByPack[k] = r.soh_pct; }
    const ranked = packs.map((p) => { const key = p.pack_id ?? p.id; const s = sohByPack[key]; return { pack_id: key ?? null, soh_pct: s === undefined ? null : Number(s), status: p.status ?? null, measured: s !== undefined }; }).sort((a, b) => (a.soh_pct === null ? 999 : a.soh_pct) - (b.soh_pct === null ? 999 : b.soh_pct));
    const unmeasured = ranked.filter((r) => !r.measured).length;
    return { feature: 'replacement-priority', aiGenerated: false, source: 'deterministic-fallback', note: 'No AI provider result — ranked deterministically by lowest recorded SoH.', summary: `${ranked.length} pack(s) ranked; ${unmeasured} without a SoH measurement.`, metrics: { ranked_count: ranked.length, unmeasured_pack_count: unmeasured, lowest_soh_pct: ranked.length && ranked[0].soh_pct !== null ? ranked[0].soh_pct : null }, ranked };
  },
  'second-life-candidates': function secondLifeCandidates(input) {
    const packs = Array.isArray(input) ? input : (input.packs || []);
    const soh = Array.isArray(input) ? [] : (input.sohReports || []);
    const sohByPack = {}; for (const r of soh) { if (r.pack_id != null) sohByPack[r.pack_id] = r.soh_pct; }
    const candidates = []; let retired = 0;
    for (const p of packs) { if (p.status === 'retired') retired += 1; const s = Number(sohByPack[p.pack_id]); if (Number.isFinite(s) && s >= 60 && s < 80 && p.status !== 'fault') candidates.push({ pack_id: p.pack_id ?? null, soh_pct: s, chemistry: p.chemistry ?? null }); }
    return { feature: 'second-life-candidates', aiGenerated: false, source: 'deterministic-fallback', note: 'No AI provider result — SoH 60–80% and non-fault packs listed deterministically; human engineering review required.', summary: `${candidates.length} second-life candidate(s) from ${packs.length} pack(s).`, metrics: { candidate_count: candidates.length, retired_count: retired, has_candidates: candidates.length > 0 }, candidates };
  },
};

async function maybeCallProvider(feature, records, env, fetchImpl) {
  if (!providerConfigured(env)) return null;
  const isOpenRouter = Boolean(env.OPENROUTER_API_KEY);
  const url = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = env.OPENROUTER_MODEL || env.OPENAI_MODEL || (isOpenRouter ? 'anthropic/claude-haiku-4.5' : 'gpt-4o-mini');
  const resp = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY || env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Return valid JSON only with labelled sections preserving numbers, booleans and empty values exactly. Use only the supplied records.' }, { role: 'user', content: `Feature ${feature}. Analyse these records: ${JSON.stringify(records).slice(0, 6000)}` }], temperature: 0.2 }) });
  if (!resp.ok) throw new Error('provider failed');
  const data = await resp.json(); const text = data.choices?.[0]?.message?.content || '';
  try { return { provider: isOpenRouter ? 'openrouter' : 'openai', model, data: JSON.parse(text.replace(/```json|```/g, '').trim()) }; } catch { return { provider: isOpenRouter ? 'openrouter' : 'openai', model, data: { summary: text } }; }
}

async function runFeaturePackAi(feature, records, env = process.env, fetchImpl = global.fetch) {
  const fn = FEATURES[feature];
  if (!fn) return null;
  try {
    const p = await maybeCallProvider(feature, records || [], env, fetchImpl);
    if (p) return { feature, aiGenerated: true, source: 'provider', provider: p.provider, model: p.model, result: p.data };
  } catch (e) {
    return { ...fn(records || []), providerError: `Provider call failed: ${e.message}` };
  }
  return fn(records || []);
}
module.exports = { FEATURES, runFeaturePackAi, providerConfigured };
