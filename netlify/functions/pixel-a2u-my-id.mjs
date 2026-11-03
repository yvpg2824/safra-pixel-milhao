import {reply,uidFrom} from './pixel-pay-core.mjs';

// Read-only Testnet enrollment: returns ONLY the authenticated user's own Pi app UID.
// This does not create or execute any A2U payment.
export default async function handler(req) {
  if(req.method!=='GET') return reply(405,{error:'method_not_allowed'});
  if(process.env.PIXEL_A2U_NETWORK!=='testnet') return reply(503,{error:'testnet_not_configured'});
  try {
    const uid=uidFrom(req);
    return reply(200,{network:'Pi Testnet',uid,description:'App-local UID of authenticated Pioneer',paymentSent:false});
  } catch {
    return reply(401,{error:'login_required'});
  }
}
export const config={path:'/api/pixel/a2u/my-id'};
