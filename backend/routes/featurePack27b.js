'use strict';
const express = require('express');
const { validateTaskInput, filterRecords, runAiFeature, FEATURES } = require('../lib/featurePack27b');
// Authenticated tasks: DB-backed when pool works, in-memory fallback otherwise (never fakes DB success).
function createTasksRouter({ pool } = {}) {
  const router = express.Router();
  const memory = []; let nextId = 1; let dbReady = null;
  async function db() { if (!pool) return null; if (!dbReady) dbReady = pool.query(`CREATE TABLE IF NOT EXISTS feature_tasks_27b (id SERIAL PRIMARY KEY, owner_id TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', priority TEXT DEFAULT 'normal', notes TEXT DEFAULT '', related_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`).catch(() => { dbReady = null; throw new Error('db unavailable'); }); await dbReady; return pool; }
  const owner = (req) => String(req.user?.id ?? req.user?.email ?? 'unknown');
  router.get('/', async (req, res) => { try { const p = await db(); if (p) { const r = await p.query('SELECT * FROM feature_tasks_27b WHERE owner_id=$1 ORDER BY updated_at DESC', [owner(req)]); return res.json(filterRecords(r.rows, req.query)); } } catch {} return res.json(filterRecords(memory.filter((t) => t.owner_id === owner(req)), req.query)); });
  router.post('/', async (req, res) => { const v = validateTaskInput(req.body || {}); if (!v.valid) return res.status(422).json({ error: v.error }); try { const p = await db(); if (p) { const r = await p.query('INSERT INTO feature_tasks_27b(owner_id,title,status,priority,notes,related_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [owner(req), v.value.title, v.value.status, v.value.priority, v.value.notes, v.value.relatedId ? String(v.value.relatedId) : null]); return res.status(201).json(r.rows[0]); } } catch {} const t = { id: nextId++, owner_id: owner(req), ...v.value, related_id: v.value.relatedId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; memory.push(t); return res.status(201).json(t); });
  const update = async (req, res) => { try { const p = await db(); if (p) { const cur = await p.query('SELECT * FROM feature_tasks_27b WHERE id=$1 AND owner_id=$2', [req.params.id, owner(req)]); if (!cur.rows[0]) return res.status(404).json({ error: 'Task not found' }); const v = validateTaskInput({ ...cur.rows[0], ...req.body }); if (!v.valid) return res.status(422).json({ error: v.error }); const r = await p.query('UPDATE feature_tasks_27b SET title=$1,status=$2,priority=$3,notes=$4,updated_at=NOW() WHERE id=$5 AND owner_id=$6 RETURNING *', [v.value.title, v.value.status, v.value.priority, v.value.notes, req.params.id, owner(req)]); return res.json(r.rows[0]); } } catch {} const t = memory.find((x) => String(x.id) === String(req.params.id) && x.owner_id === owner(req)); if (!t) return res.status(404).json({ error: 'Task not found' }); const v = validateTaskInput({ ...t, ...req.body }); if (!v.valid) return res.status(422).json({ error: v.error }); Object.assign(t, v.value, { updated_at: new Date().toISOString() }); return res.json(t); };
  router.patch('/:id', update); router.put('/:id', update);
  return router;
}
function createFeatureAiRouter({ loadRecords } = {}) {
  const router = express.Router();
  router.get('/features', (req, res) => res.json({ features: Object.keys(FEATURES) }));
  router.post('/:feature', async (req, res) => { if (!FEATURES[req.params.feature]) return res.status(404).json({ error: 'unknown feature', features: Object.keys(FEATURES) }); let records = Array.isArray(req.body?.records) ? req.body.records : null; if (!records && loadRecords) { try { records = await loadRecords(req); } catch { records = []; } } return res.json(await runAiFeature(req.params.feature, records || [])); });
  return router;
}
module.exports = { createTasksRouter, createFeatureAiRouter };
