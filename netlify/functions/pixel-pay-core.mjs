import {createHmac,timingSafeEqual} from 'node:crypto';
const encoder=new TextEncoder();
const secret=()=>process.env.PIXEL_SESSION_SECRET;
export function reply(status,data){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export async function body(req,max=3000){if(req.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw Error('content_type');const raw=await req.text();if(raw.length>max)throw Error('too_large');return JSON.parse(raw)}
export function sign(uid){if(!secret()||secret().length<32)throw Error('session_not_configured');const msg=Buffer.from(JSON.stringify({uid,exp:Date.now()+60*60*1000})).toString('base64url');const sig=createHmac('sha256',secret()).update(msg).digest('base64url');return msg+'.'+sig}
export function uidFrom(req){if(!secret()||secret().length<32)throw Error('session_not_configured');const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');const [msg,sig]=token.split('.');if(!msg||!sig)throw Error('unauthorized');const expected=createHmac('sha256',secret()).update(msg).digest();const actual=Buffer.from(sig,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('unauthorized');const p=JSON.parse(Buffer.from(msg,'base64url').toString());if(typeof p.uid!=='string'||!p.uid||!Number.isFinite(p.exp)||p.exp<Date.now())throw Error('unauthorized');return p.uid}
export function quote(x,y,size){
 const prices={bronze:10,prata:20,ouro:40},allowed=[1,2,5,10,20,50,100];
 if(![x,y,size].every(Number.isInteger)||!allowed.includes(size)||x<0||y<0||x+size>1000||y+size>1000||x%size||y%size)return null;
 const zone=(a,b)=>{const d=Math.max(Math.abs(a-500),Math.abs(b-500));return d<170?'diamante':d<300?'ouro':d<410?'prata':'bronze'};
 const lot=(a,b)=>(b<160&&a<500)||(b>=840&&a>=500)||(a<100&&b>=350&&b<550);
 const z=zone(x+size/2,y+size/2);if(z==='diamante')return null;
 for(let yy=y;yy<y+size;yy++)for(let xx=x;xx<x+size;xx++){if(!lot(xx,yy)||zone(xx+.5,yy+.5)!==z)return null}
 return {x,y,size,zone:z,amountPi:size*size*prices[z]};
}
export async function db(path,{method='GET',data,prefer}={}){
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw Error('database_not_configured');
 const url=new URL('/rest/v1/'+path,base);
 const r=await fetch(url,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error('database_'+r.status);return r.status===204?null:r.json();
}
export async function pi(path,method='GET',data){
 const key=process.env.PI_NETWORK_API_KEY;
 if(!key)throw Error('pi_key_not_configured');
 const r=await fetch('https://api.minepi.com/v2/'+path,{method,headers:{Authorization:'Key '+key,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('pi_'+r.status);return r.json();
}
export async function getOrder(orderId,uid){
 if(typeof orderId!=='string'||!/^[0-9a-f-]{36}$/.test(orderId))throw Error('invalid_order');
 const rows=await db('safra_pixel_orders?select=*&id=eq.'+encodeURIComponent(orderId)+'&pi_uid=eq.'+encodeURIComponent(uid)+'&limit=1');
 if(!rows?.length)throw Error('order_not_found');return rows[0];
}
export function validatePayment(p,o){return p&&p.direction==='user_to_app'&&p.user_uid===o.pi_uid&&Number(p.amount)===Number(o.amount_pi)&&p.metadata?.orderId===o.id&&p.metadata?.kind==='safra_pixel'&&p.status?.cancelled!==true&&p.status?.user_cancelled!==true&&p.network==='Pi Testnet'}
