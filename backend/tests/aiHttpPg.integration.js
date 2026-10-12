'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { Pool } = require('pg');
const { hashPassword } = require('../lib/passwords');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const database = `battery_fixture_${crypto.randomBytes(6).toString('hex')}`;
const fixturePassword = crypto.randomBytes(18).toString('base64url');
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};
const admin = new Pool({ ...baseConfig, database: 'postgres' });
let fixture;
let provider;
let apiServer;

const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const close = (server) => new Promise((resolve) => server?.close(resolve));
const until = async (predicate, label, timeoutMs = 4000) => {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeoutMs) throw new Error(`Timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
};

async function main() {
  await admin.query(`CREATE DATABASE ${database}`);
  fixture = new Pool({ ...baseConfig, database });
  const migrations = fs.readdirSync(path.join(__dirname, '..', 'migrations'))
    .filter((name) => name.endsWith('.sql')).sort();
  for (const filename of migrations) {
    await fixture.query(fs.readFileSync(path.join(__dirname, '..', 'migrations', filename), 'utf8'));
  }
  const adminUser = await fixture.query(
    'INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,$4) RETURNING id',
    ['demo-admin@fixture.invalid', hashPassword(fixturePassword), 'Fixture Admin', 'admin']
  );
  await fixture.query(
    'INSERT INTO users(email,password,name,role) VALUES($1,$2,$3,$4)',
    ['demo-viewer@fixture.invalid', hashPassword(fixturePassword), 'Fixture Viewer', 'viewer']
  );
  for (let index = 1; index <= 15; index += 1) {
    await fixture.query(
      'INSERT INTO battery_packs(pack_id,vendor,chemistry,capacity_kwh,status) VALUES($1,$2,$3,$4,$5)',
      [`TRAINING-${String(index).padStart(3, '0')}`, 'Fictional Fixture Vendor', 'LFP', index, 'training_draft']
    );
  }

  let requestNumber = 0;
  let cancelledProviderRequest = false;
  provider = http.createServer((req, res) => {
    requestNumber += 1;
    req.on('close', () => { if (requestNumber === 2) cancelledProviderRequest = true; });
    if (requestNumber === 2) {
      setTimeout(() => {
        if (!res.destroyed) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ choices: [{ message: { content: '{"summary":"late fixture"}' } }] }));
        }
      }, 300);
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      id: `fixture-${requestNumber}`,
      choices: [{ message: { content: JSON.stringify({ summary: 'Fictional controlled forecast', projection: [] }) } }],
    }));
  });
  const providerPort = await listen(provider);

  process.env.DB_NAME = database;
  process.env.DEMO_LOGIN_EMAIL = 'demo-admin@fixture.invalid';
  process.env.SEED_DEMO_PASSWORD = fixturePassword;
  process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${providerPort}/api/v1`;
  process.env.OPENROUTER_API_KEY = 'fixture-key-not-a-provider-secret';
  process.env.OPENROUTER_MODEL = 'fixture/battery-model';
  process.env.JWT_SECRET = crypto.randomBytes(24).toString('base64url');

  const app = require('../server');
  const appPool = require('../config/database');
  const apiPort = await listen(apiServer = http.createServer(app));
  const base = `http://127.0.0.1:${apiPort}/api`;

  const demoResponse = await fetch(`${base}/auth/demo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(demoResponse.status, 200);
  const session = await demoResponse.json();
  assert.equal(session.user.id, adminUser.rows[0].id);
  assert.equal(session.user.email, 'demo-admin@fixture.invalid');
  const adminHeaders = { authorization: `Bearer ${session.token}`, 'content-type': 'application/json' };

  const packsResponse = await fetch(`${base}/battery-packs`, { headers: adminHeaders });
  assert.equal(packsResponse.status, 200);
  assert.equal((await packsResponse.json()).length, 15);

  const generated = await fetch(`${base}/ai/degradation-forecast`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ pack_summary: 'FICTIONAL DRAFT: TRAINING-001', horizon_cycles: 10 }),
  });
  assert.equal(generated.status, 200);
  assert.equal((await generated.json()).summary, 'Fictional controlled forecast');

  const adminHistoryResponse = await fetch(`${base}/ai/history?feature=degradation-forecast`, { headers: adminHeaders });
  assert.equal(adminHistoryResponse.status, 200);
  const adminHistory = await adminHistoryResponse.json();
  assert.equal(adminHistory.length, 1);

  const viewerLogin = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo-viewer@fixture.invalid', password: fixturePassword }),
  });
  assert.equal(viewerLogin.status, 200);
  const viewer = await viewerLogin.json();
  const viewerHistory = await fetch(`${base}/ai/history?feature=degradation-forecast`, { headers: { authorization: `Bearer ${viewer.token}` } });
  assert.deepEqual(await viewerHistory.json(), []);

  const controller = new AbortController();
  const cancelled = fetch(`${base}/ai/degradation-forecast`, {
    method: 'POST', headers: adminHeaders, signal: controller.signal,
    body: JSON.stringify({ pack_summary: 'FICTIONAL DRAFT: cancellation fixture', horizon_cycles: 20 }),
  });
  await new Promise((resolve) => setTimeout(resolve, 60));
  controller.abort();
  await assert.rejects(cancelled, (error) => error?.name === 'AbortError');
  await new Promise((resolve) => setTimeout(resolve, 350));
  const rows = await fixture.query('SELECT user_id, count(*)::int AS count FROM ai_results GROUP BY user_id');
  assert.deepEqual(rows.rows, [{ user_id: adminUser.rows[0].id, count: 1 }]);
  assert.equal(cancelledProviderRequest, true);

  await fixture.query(`
    CREATE FUNCTION delay_ai_result_fixture() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.input->>'pack_summary' = 'FICTIONAL DRAFT: SQL cancellation fixture' THEN
        PERFORM pg_sleep(0.8);
      END IF;
      RETURN NEW;
    END $$;
    CREATE TRIGGER delay_ai_result_fixture
      BEFORE INSERT ON ai_results
      FOR EACH ROW EXECUTE FUNCTION delay_ai_result_fixture();
  `);
  const sqlController = new AbortController();
  const sqlCancelled = fetch(`${base}/ai/degradation-forecast`, {
    method: 'POST', headers: adminHeaders, signal: sqlController.signal,
    body: JSON.stringify({ pack_summary: 'FICTIONAL DRAFT: SQL cancellation fixture', horizon_cycles: 30 }),
  });
  await until(async () => Number((await admin.query(
    "SELECT count(*) FROM pg_stat_activity WHERE datname=$1 AND state='active' AND query LIKE 'INSERT INTO ai_results%'",
    [database]
  )).rows[0].count) > 0, 'active ai_results INSERT');
  sqlController.abort();
  await assert.rejects(sqlCancelled, (error) => error?.name === 'AbortError');
  await new Promise((resolve) => setTimeout(resolve, 900));
  const afterSqlCancel = await fixture.query('SELECT count(*)::int AS count FROM ai_results WHERE user_id=$1', [adminUser.rows[0].id]);
  assert.equal(afterSqlCancel.rows[0].count, 1);
  await fixture.query('DROP TRIGGER delay_ai_result_fixture ON ai_results; DROP FUNCTION delay_ai_result_fixture()');

  console.log(JSON.stringify({
    fixture_database: database,
    demo_login: 'PASS',
    persisted_training_records: 15,
    controlled_provider_requests: requestNumber,
    actor_owned_history_rows: 1,
    cross_actor_history_rows: 0,
    cancelled_request_persisted_rows: 0,
    cancelled_sql_insert_persisted_rows: 0,
    paid_provider_calls: 0,
  }));
  await appPool.end();
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}).finally(async () => {
  await close(apiServer);
  await close(provider);
  if (fixture) await fixture.end().catch(() => {});
  await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid <> pg_backend_pid()', [database]).catch(() => {});
  await admin.query(`DROP DATABASE IF EXISTS ${database}`).catch(() => {});
  await admin.end();
});
