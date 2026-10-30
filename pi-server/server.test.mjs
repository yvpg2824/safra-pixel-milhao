import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 45000 + Math.floor(Math.random() * 1000);
const ORIGIN = 'https://example.org';
const URL = 'http://127.0.0.1:' + PORT;
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('.', import.meta.url),
  env: { ...process.env, PORT: String(PORT), ALLOWED_ORIGINS: ORIGIN },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let ready = false;
child.stdout.on('data', text => { if (String(text).includes('listening')) ready = true; });

async function wait() {
  for (let n=0;n<80;n++) {
    if (ready) return;
    if (child.exitCode !== null) throw new Error('server exited');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('server did not start');
}

test('health, CORS and invalid token behavior', async t => {
  t.after(() => child.kill());
  await wait();
  const health = await fetch(URL + '/health');
  assert.equal(health.status, 200);
  assert.equal((await health.json()).paymentsEnabled, false);
  const denied = await fetch(URL + '/api/pi/verify', { method: 'POST', headers: { Origin: 'https://not-allowed.test', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 403);
  const options = await fetch(URL + '/api/pi/verify', { method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('access-control-allow-origin'), ORIGIN);
  const malformed = await fetch(URL + '/api/pi/verify', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(malformed.status, 400);
});
