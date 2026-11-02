import {reply,body,uidFrom,quote,db} from './pixel-pay-core.mjs';
export default async function handler(req){
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 if(process.env.PIXEL_PAYMENTS_ENABLED!=='true')return reply(503,{error:'payments_not_enabled'});
 try{
  const uid=uidFrom(req),input=await body(req,512),q=quote(input?.x,input?.y,input?.size);
  if(!q)return reply(422,{error:'invalid_area'});
  // Supabase service role is the only caller authorized to reserve.
  const result=await db('rpc/safra_reserve_pixel',{method:'POST',data:{p_uid:uid,p_x:q.x,p_y:q.y,p_size:q.size,p_zone:q.zone,p_amount:q.amountPi}});
  if(typeof result!=='string')throw Error('invalid_reservation_response');
  return reply(201,{orderId:result,amountPi:q.amountPi,memo:'SAFRA Pixel do Milhao - '+q.size+'x'+q.size,metadata:{kind:'safra_pixel',orderId:result},expiresIn:900});
 }catch(e){return reply(409,{error:'reservation_unavailable'});}
}
export const config={path:'/api/pixel/reserve'};