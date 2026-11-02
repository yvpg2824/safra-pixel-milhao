import { reply, body, uidFrom, getOrder, validatePayment, pi, db } from './pixel-pay-core.mjs';
const enabled=()=>process.env.PIXEL_PAYMENTS_ENABLED==='true'&&process.env.PIXEL_PAYMENT_NETWORK==='testnet';
export default async function handler(req) {
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 if(!enabled())return reply(503,{error:'testnet_payments_disabled'});
 try{
  const uid=uidFrom(req), data=await body(req,700);
  if(typeof data?.paymentId!=='string'||! /^[a-zA-Z0-9_-]{8,200}$/.test(data.paymentId)||typeof data?.txid!=='string'||! /^[a-zA-Z0-9]{32,128}$/.test(data.txid))return reply(400,{error:'invalid_payment'});
  const order=await getOrder(data.orderId,uid);
  if(order.status!=='reserved'||order.payment_id!==data.paymentId)return reply(409,{error:'order_not_approved'});
  const payment=await pi('payments/'+encodeURIComponent(data.paymentId));
  if(!validatePayment(payment,order)||payment.transaction?.txid!==data.txid)return reply(409,{error:'unverified_payment'});
  const completed=await pi('payments/'+encodeURIComponent(data.paymentId)+'/complete','POST',{txid:data.txid});
  if(!validatePayment(completed,order)||completed.status?.completed!==true||completed.transaction?.txid!==data.txid)return reply(502,{error:'payment_completion_unverified'});
  const rows=await db('safra_pixel_orders?id=eq.'+encodeURIComponent(order.id)+'&pi_uid=eq.'+encodeURIComponent(uid)+'&payment_id=eq.'+encodeURIComponent(data.paymentId)+'&status=eq.reserved',{
    method:'PATCH',data:{txid:data.txid,confirmed_at:new Date().toISOString()},prefer:'return=representation'
  });
  if(!Array.isArray(rows)||rows.length!==1)return reply(503,{error:'payment_completed_record_reconciliation_required'});
  return reply(200,{confirmed:true,testnet:true,orderId:order.id,message:'Reserva de teste confirmada. Sem propriedade Mainnet.'});
 }catch{return reply(409,{error:'payment_completion_unavailable'})}
}
export const config={path:'/api/pixel/payment/complete'};
