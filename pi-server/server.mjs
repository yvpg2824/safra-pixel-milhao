import http from 'node:http';

const origins = new Set((process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean));
const port = Number(process.env.PORT || 3000);
const rate = new Map();
const LIMIT = 20; // requests per minute per IP
const WINDOW_MS = 60_000;

function json(res, status, data, origin = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(origins.has(origin) ? {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
    } : {}),
  };
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  if (req.url === '/health' && req.method === 'GET') {
    return json(res, 200, { status: 'ok', paymentsEnabled: false });
  }
  if (req.url !== '/api/pi/verify') {
    return json(res, 404, { error: 'not_found' });
  }
  if (!origins.has(origin)) {
    return json(res, 403, { error: 'origin_not_allowed' });
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    });
    return res.end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' }, origin);
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    return json(res, 415, { error: 'content_type' }, origin);
  }
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const item = rate.get(ip);
  const current = !item || now - item.start >= WINDOW_MS
    ? { start: now, hits: 1 }
    : { start: item.start, hits: item.hits + 1 };
  rate.set(ip, current);
  if (current.hits > LIMIT) return json(res, 429, { error: 'rate_limit' }, origin);
  // Best-effort cleanup. Production multi-instance deployments need shared rate limiting.
  if (rate.size > 10000) rate.clear();
  let raw = '';
  try {
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 4096) return json(res, 413, { error: 'too_large' }, origin);
    }
  } catch {
    return json(res, 400, { error: 'invalid_body' }, origin);
  }
  let token;
  try { token = JSON.parse(raw).accessToken; }
  catch { return json(res, 400, { error: 'invalid_json' }, origin); }
  if (typeof token !== 'string' || token.length < 8 || token.length > 3000) {
    return json(res, 400, { error: 'invalid_token' }, origin);
  }
  try {
    const response = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return json(res, 401, { error: 'pi_token_not_verified' }, origin);
    const user = await response.json();
    if (typeof user.uid !== 'string' || !user.uid) {
      return json(res, 502, { error: 'unexpected_pi_response' }, origin);
    }
    // Verification is NOT a user session and does not authorize transactions.
    return json(res, 200, {
      verified: true,
      user: { uid: user.uid, username: typeof user.username === 'string' ? user.username : null },
    }, origin);
  } catch {
    return json(res, 502, { error: 'pi_service_unavailable' }, origin);
  }
}).listen(port, '0.0.0.0', () => {
  console.log('SAFRA Pi verifier listening on ' + port);
});
