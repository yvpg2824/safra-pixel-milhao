// Testnet-only indicative quote. No reservation, payment or database write.
// Recalculate all geometry and pricing server-side; never trust frontend price.
const prices={bronze:10,prata:20,ouro:40};
const allowed=new Set([1,2,5,10,20,50,100]);
function zone(x,y){const d=Math.max(Math.abs(x-500),Math.abs(y-500));return d<170?'diamante':d<300?'ouro':d<410?'prata':'bronze'}
function lot(x,y){return(y<160&&x<500)||(y>=840&&x>=500)||(x<100&&y>=350&&y<550)}
function validate(x,y,size){
 if(![x,y,size].every(Number.isInteger)||!allowed.has(size)||x<0||y<0||x+size>1000||y+size>1000||x%size||y%size) return null;
 const z=zone(x+size/2,y+size/2);
 if(z==='diamante')return null;
 // Scan all pixels because zones can change within a block.
 for(let yy=y;yy<y+size;yy++)for(let xx=x;xx<x+size;xx++){
  if(!lot(xx,yy)||zone(xx+.5,yy+.5)!==z)return null;
 }
 return {x,y,size,zone:z,amountPi:size*size*prices[z]};
}
export default async function handler(req){
 const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};
 const send=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method!=='POST')return send(405,{error:'method_not_allowed'});
 if(req.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return send(415,{error:'content_type'});
 let data;
 try{const raw=await req.text();if(raw.length>512)return send(413,{error:'too_large'});data=JSON.parse(raw)}catch{return send(400,{error:'invalid_json'})}
 const q=validate(data?.x,data?.y,data?.size);
 if(!q)return send(422,{error:'invalid_or_unavailable_area'});
 return send(200,{quote:q,kind:'indicative_preview',availabilityVerified:false,reserved:false,paymentEnabled:false,message:'Cotação demonstrativa: preço calculado no servidor, disponibilidade no banco ainda não consultada.'});
}
export const config={path:'/api/pixel/quote'};
