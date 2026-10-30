// Confirma a identidade Pi no servidor, sem criar sessões ou liberar pagamentos.
export default async function handler(request) {
  const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Type':'application/json; charset=utf-8'};
  const send=(status,value)=>new Response(JSON.stringify(value),{status,headers});
  if(request.method!=='POST')return send(405,{error:'method_not_allowed'});
  if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return send(415,{error:'content_type'});
  const length=Number(request.headers.get('content-length')||0);
  if(length>4096)return send(413,{error:'too_large'});
  let body;try{const raw=await request.text();if(raw.length>4096)return send(413,{error:'too_large'});body=JSON.parse(raw)}catch{return send(400,{error:'invalid_json'})}
  const token=body?.accessToken;
  if(typeof token!=='string'||token.length<8||token.length>3000)return send(400,{error:'invalid_token'});
  try{
    const r=await fetch('https://api.minepi.com/v2/me',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});
    if(!r.ok)return send(401,{error:'pi_token_not_verified'});
    const user=await r.json();
    if(typeof user?.uid!=='string'||!user.uid)return send(502,{error:'unexpected_pi_response'});
    return send(200,{verified:true,user:{uid:user.uid,username:typeof user.username==='string'?user.username:null}});
  }catch{return send(502,{error:'pi_service_unavailable'})}
}
export const config={path:'/api/pi/verify'};
