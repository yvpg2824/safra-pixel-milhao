import { reply, pi } from './pixel-pay-core.mjs';
import { createHash, timingSafeEqual } from 'node:crypto';

// Read-only admin diagnostic. No blockchain signatures and no payment creation.
function authorized(req) {
  const configured = process.env.PIXEL_A2U_ADMIN_TOKEN || '';
  const supplied = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (configured.length < 32 || supplied.length !== configured.length) return false;
  const left = createHash('sha256').update(configured).digest();
  const right = createHash('sha256').update(supplied).digest();
  return timingSafeEqual(left, right);
}

export default async function handler(req) {
  if (req.method !== 'GET') return reply(405, { error: 'method_not_allowed' });
  if (!authorized(req)) return reply(401, { error: 'unauthorized' });
  if (process.env.PIXEL_A2U_NETWORK !== 'testnet') return reply(403, { error: 'testnet_only' });
  if (!process.env.PI_NETWORK_API_KEY) return reply(503, { error: 'pi_key_not_configured' });
  try {
    const data = await pi('payments/incomplete_server_payments');
    const payments = Array.isArray(data?.incomplete_server_payments) ? data.incomplete_server_payments : [];
    return reply(200, {
      network: 'testnet',
      paymentsCreatedByThisEndpoint: 0,
      incompleteA2U: payments.map(p => ({
        identifier: p.identifier,
        network: p.network,
        direction: p.direction,
        status: p.status
      }))
    });
  } catch {
    return reply(502, { error: 'pi_a2u_preflight_unavailable' });
  }
}
export const config = { path: '/api/pixel/admin/a2u-preflight' };
