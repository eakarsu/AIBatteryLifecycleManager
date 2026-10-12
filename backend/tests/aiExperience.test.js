'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function loadAI() {
  const path = require.resolve('../services/ai');
  delete require.cache[path];
  return require(path);
}

test('controlled OpenRouter fixture returns structured output without a paid call', async (t) => {
  let received;
  const provider = http.createServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      received = { url: req.url, authorization: req.headers.authorization, body: JSON.parse(body) };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        id: 'fixture-request-1',
        choices: [{ message: { content: JSON.stringify({ summary: 'Controlled fixture result', projection: [] }) } }],
      }));
    });
  });
  const port = await listen(provider);
  t.after(() => close(provider));
  t.mock.method(console, 'warn', () => {});

  const previous = {
    base: process.env.OPENROUTER_BASE_URL,
    key: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
  };
  t.after(() => {
    if (previous.base === undefined) delete process.env.OPENROUTER_BASE_URL; else process.env.OPENROUTER_BASE_URL = previous.base;
    if (previous.key === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = previous.key;
    if (previous.model === undefined) delete process.env.OPENROUTER_MODEL; else process.env.OPENROUTER_MODEL = previous.model;
  });
  process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${port}/api/v1`;
  process.env.OPENROUTER_API_KEY = 'fixture-key-not-a-provider-secret';
  process.env.OPENROUTER_MODEL = 'fixture/battery-model';

  const ai = loadAI();
  const output = await ai.degradationForecast({ pack_id: 'TRAINING-PACK' }, { cycles: 12 });
  assert.equal(output.summary, 'Controlled fixture result');
  assert.equal(received.url, '/api/v1/chat/completions');
  assert.equal(received.authorization, 'Bearer fixture-key-not-a-provider-secret');
  assert.equal(received.body.model, 'fixture/battery-model');
  assert.match(received.body.messages[0].content, /tabletop \/ advisory exercise/i);
});

test('AbortSignal closes the controlled provider request', async (t) => {
  let providerClosed = false;
  let providerReceived = false;
  const provider = http.createServer((req, res) => {
    providerReceived = true;
    req.on('close', () => { providerClosed = true; });
    setTimeout(() => {
      if (!res.destroyed) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { content: '{"summary":"too late"}' } }] }));
      }
    }, 250);
  });
  const port = await listen(provider);
  t.after(() => close(provider));
  const previous = { base: process.env.OPENROUTER_BASE_URL, key: process.env.OPENROUTER_API_KEY };
  t.after(() => {
    if (previous.base === undefined) delete process.env.OPENROUTER_BASE_URL; else process.env.OPENROUTER_BASE_URL = previous.base;
    if (previous.key === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = previous.key;
  });
  process.env.OPENROUTER_BASE_URL = `http://127.0.0.1:${port}/api/v1`;
  process.env.OPENROUTER_API_KEY = 'fixture-key-not-a-provider-secret';

  const ai = loadAI();
  const controller = new AbortController();
  const pending = ai.thermalRisk({ context_summary: 'Fictional test only' }, { signal: controller.signal });
  await new Promise((resolve) => setTimeout(resolve, 30));
  controller.abort();
  await assert.rejects(pending, (error) => error?.name === 'AbortError');
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(providerReceived, true);
  assert.equal(providerClosed, true);
});
