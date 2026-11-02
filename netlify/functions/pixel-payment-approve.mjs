import {reply,body,uidFrom,getOrder,validatePayment,pi,db} from './pixel-pay-core.mjs';
const enabled=()=>process.env.PIXEL_PAYMENTS_ENABLED==='true'&&process.env.PIXEL_PAYMENT_NETWORK==='testnet';
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{8,200}$/.test(id);
export default async function handler(req) {
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 if(!enabled())return reply(503,{error:'testnet_payments_disabled'});
 try {
  const uid=uidFrom(req);
  const data=await body(req,700);
  if(!validId(data?.paymentId)||typeof data?.orderId!=='string')return reply(400,{error:'invalid_input'});
  const order=await getOrder(data.orderId,uid);
  if(order.status!=='reserved'||!order.expires_at||Date.parse(order.expires_at)<=Date.now())return reply(409,{error:'reservation_expired'});
  if(order.payment_id&&order.payment_id!==data.paymentId)return reply(409,{error:'different_payment_bound'});
  const payment=await pi('payments/'+encodeURIComponent(data.paymentId));
  if(!validatePayment(payment,order)||payment.status?.completed===true)return reply(409,{error:'payment_mismatch'});
  if(order.payment_id===null){
   const rows=await db('safra_pixel_orders?id=eq.'+encodeURIComponent(order.id)+'&pi_uid=eq.'+encodeURIComponent(uid)+'&status=eq.reserved&payment_id=is.null',{
    method:'PATCH',data:{payment_id:data.paymentId},prefer:'return=representation'
   });
   if(!Array.isArray(rows)||rows.length!==1)return reply(409,{error:'payment_binding_conflict'});
  }
  const approved=await pi('payments/'+encodeURIComponent(data.paymentId)+'/approve','POST',{});
  if(!validatePayment(approved,order))return reply(502,{error:'approval_verification_failed'});
  return reply(200,{approved:true,paymentId:data.paymentId});
 }catch{return reply(409,{error:'payment_approval_unavailable'})}
}
export const config={path:'/api/pixel/payment/approve'};
