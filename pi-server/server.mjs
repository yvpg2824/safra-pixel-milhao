import http from 'node:http';
const allowed=new Set((process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean));
const port=Number(process.env.PORT||3000);
function respond(res,status,body,origin){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...(allowed.has(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})});res.end(JSON.stringify(body))}
http.createServer(async(req,res)=>{
const origin=req.headers.origin||'';
if(req.method==='GET'&&req.url==='/health')return respond(res,200,{status:'ok',paymentsEnabled:false},origin);
if(req.method!=='POST'||req.url!=='/api/pi/verify')return respond(res,404,{error:'not_found'},origin);
if(!origin||!allowed.has(origin))return respond(res,403,{error:'origin_not_allowed'},origin);
if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')return respond(res,415,{error:'content_type'},origin);
let raw='';try{for await(const chunk of req){raw+=chunk;if(raw.length>4096)return respond(res,413,{error:'too_large'},origin)}}catch{return respond(res,400,{error:'invalid_body'},origin)}
let token;try{token=JSON.parse(raw).accessToken}catch{return respond(res,400,{error:'invalid_json'},origin)}
if(typeof token!=='string'||token.length<8||token.length>3000)return respond(res,400,{error:'invalid_token'},origin);
try{const response=await fetch('https://api.minepi.com/v2/me',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(8000)});
if(!response.ok)return respond(res,401,{error:'pi_token_not_verified'},origin);
const user=await response.json();if(typeof user.uid!=='string')return respond(res,502,{error:'unexpected_pi_response'},origin);
return respond(res,200,{verified:true,user:{uid:user.uid,username:typeof user.username==='string'?user.username:null}},origin)
}catch{return respond(res,502,{error:'pi_unavailable'},origin)}
}).listen(port,()=>console.log('SAFRA Pi identity verifier ready on '+port));
