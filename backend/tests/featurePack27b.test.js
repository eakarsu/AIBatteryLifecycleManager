'use strict';
const test = require('node:test'); const assert = require('node:assert/strict'); const express = require('express');
const { filterRecords, toCSV, runAiFeature } = require('../lib/featurePack27b');
const { createTasksRouter, createFeatureAiRouter } = require('../routes/featurePack27b');
test('search/filter and CSV preserve 0/false/empty', () => { assert.equal(filterRecords([{ status: 'open', title: 'A 0', n: 0, ok: false }, { status: 'done', title: 'B' }], { q: '0', status: 'open' }).length, 1); assert.match(toCSV([{ a: 0, b: false, c: '' }]), /0,false/); });
test('no AI features added where domain AI already exists', async () => { assert.equal(await runAiFeature('x', []), null); });

test('authenticated tasks list/create/update', async (t) => { const app = express(); app.use(express.json()); app.use((req, res, next) => { req.user = { id: 7 }; next(); }); app.use('/tasks', createTasksRouter({})); const s = await new Promise((r) => { const l = app.listen(0, '127.0.0.1', () => r(l)); }); t.after(() => s.close()); const b = `http://127.0.0.1:${s.address().port}/tasks`; const c = await (await fetch(b, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Follow up' }) })).json(); assert.equal(c.title, 'Follow up'); const u = await (await fetch(b + '/' + c.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'done' }) })).json(); assert.equal(u.status, 'done'); const l = await (await fetch(b + '?status=done')).json(); assert.equal(l.length, 1); });
