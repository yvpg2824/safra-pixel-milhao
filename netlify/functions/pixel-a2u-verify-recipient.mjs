// Testnet-only Pi UID lookup. No seed, private key or server API key required.
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default async function handler(req) {
 if(req.method!=='POST') return reply(405,{error:'method_not_allowed'});
 if(process.env.PIXEL_A2U_NETWORK!=='testnet') return reply(503,{error:'testnet_not_configured'});
 try{
  if(req.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return reply(415,{error:'json_required'});
  const raw=await req.text();
  if(raw.length>4096)return reply(413,{error:'too_large'});
  const input=JSON.parse(raw);
  if(typeof input?.accessToken!=='string'||input.accessToken.length<16||input.accessToken.length>3000)return reply(400,{error:'invalid_token'});
  const response=await fetch('https://api.minepi.com/v2/me',{headers:{Authorization:'Bearer '+input.accessToken},signal:AbortSignal.timeout(9000)});
  if(!response.ok)return reply(401,{error:'pi_auth_unverified'});
  const user=await response.json();
  if(typeof user?.uid!=='string'||!user.uid)return reply(502,{error:'uid_missing'});
  return reply(200,{uid:user.uid,username:typeof user.username==='string'?user.username:null,network:'Pi Testnet',paymentSent:false});
 }catch{return reply(503,{error:'verification_unavailable'})}
}
export const config={path:'/api/pixel/a2u/verify-recipient'};