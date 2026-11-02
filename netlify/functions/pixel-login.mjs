import {reply,body,sign} from './pixel-pay-core.mjs';
export default async function handler(req){
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 try{
  const data=await body(req);
  if(typeof data?.accessToken!=='string'||data.accessToken.length<8||data.accessToken.length>3000)return reply(400,{error:'invalid_token'});
  const r=await fetch('https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:data.accessToken}),signal:AbortSignal.timeout(9000)});
  if(!r.ok)return reply(401,{error:'pi_login_failed'});
  const verified=await r.json();
  if(typeof verified?.sessionToken!=='string'||typeof verified?.user?.uid!=='string'||!verified.user.uid)return reply(502,{error:'unexpected_auth_response'});
  return reply(200,{token:sign(verified.user.uid),user:{username:typeof verified.user.username==='string'?verified.user.username:null},expiresIn:3600});
 }catch{return reply(503,{error:'login_unavailable'})}
}
export const config={path:'/api/pixel/login'};