'use strict';
// Wave 27B feature-pack helpers: search/filter, export, tasks validation, deterministic AI fallback.
function filterRecords(rows, query = {}) {
  const q = String(query.q || query.search || '').trim().toLowerCase();
  const status = query.status ? String(query.status) : '';
  return (rows || []).filter((r) => {
    if (status && String(r.status ?? '') !== status) return false;
    if (query.priority !== undefined && String(r.priority ?? '') !== String(query.priority)) return false;
    if (!q) return true;
    return JSON.stringify(r).toLowerCase().includes(q);
  });
}
function toCSV(rows) {
  const list = rows || [];
  const headers = [...new Set(list.flatMap((r) => Object.keys(r || {})))];
  const esc = (v) => { const s = v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [headers.join(','), ...list.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n') + (list.length ? '\n' : '');
}
function sendExport(req, res, rows) {
  const filtered = filterRecords(rows, req.query);
  const format = String(req.query.format || 'json').toLowerCase();
  if (format === 'csv') { res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename="records.csv"'); return res.send(toCSV(filtered)); }
  res.setHeader('Content-Disposition', 'attachment; filename="records.json"'); return res.json(filtered);
}
const TASK_STATUSES = ['open', 'in_progress', 'done', 'blocked'];
function validateTaskInput(body = {}) {
  const title = String(body.title || '').trim();
  if (!title) return { valid: false, error: 'title is required' };
  const status = body.status ? String(body.status) : 'open';
  if (!TASK_STATUSES.includes(status)) return { valid: false, error: 'invalid task status' };
  return { valid: true, value: { title, status, priority: body.priority ? String(body.priority) : 'normal', notes: body.notes ? String(body.notes) : '', relatedId: body.relatedId ?? body.related_id ?? null } };
}
function providerConfigured(env = process.env) {
  const bad = new Set(['', 'your_openrouter_api_key_here', 'your_openrouter_key_here']);
  const or = env.OPENROUTER_API_KEY || ''; const oa = env.OPENAI_API_KEY || '';
  return Boolean((or && !bad.has(or)) || oa);
}
const FEATURES = {};

async function maybeCallProvider(feature, records, env = process.env, fetchImpl = global.fetch) {
  if (!providerConfigured(env)) return null;
  const isOpenRouter = Boolean(env.OPENROUTER_API_KEY);
  const url = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = env.OPENROUTER_MODEL || env.OPENAI_MODEL || (isOpenRouter ? 'anthropic/claude-haiku-4.5' : 'gpt-4o-mini');
  const resp = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY || env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Return valid JSON only with labelled sections preserving numbers, booleans and empty values exactly.' }, { role: 'user', content: `Feature ${feature}. Summarize: ${JSON.stringify(records).slice(0, 6000)}` }], temperature: 0.2 }) });
  if (!resp.ok) throw new Error('provider failed');
  const data = await resp.json(); const text = data.choices?.[0]?.message?.content || '';
  try { return { provider: isOpenRouter ? 'openrouter' : 'openai', model, data: JSON.parse(text.replace(/```json|```/g, '').trim()) }; } catch { return { provider: isOpenRouter ? 'openrouter' : 'openai', model, data: { summary: text } }; }
}
async function runAiFeature(feature, records, env, fetchImpl) {
  const fn = FEATURES[feature];
  if (!fn) return null;
  try { const p = await maybeCallProvider(feature, records, env, fetchImpl); if (p) return { feature, aiGenerated: true, provider: p.provider, model: p.model, sections: p.data.sections || [{ label: 'Summary', value: p.data.summary ?? p.data }] }; } catch (e) { return { ...fn(records || []), providerError: `Provider call failed: ${e.message}` }; }
  return fn(records || []);
}
module.exports = { filterRecords, toCSV, sendExport, validateTaskInput, TASK_STATUSES, providerConfigured, runAiFeature, FEATURES };
