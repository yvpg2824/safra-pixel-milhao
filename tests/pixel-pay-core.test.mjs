import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quote,sign,uidFrom,validatePayment} from '../netlify/functions/pixel-pay-core.mjs';
test('trusted prices and zones',()=>{
 assert.deepEqual(quote(94,112,1),{x:94,y:112,size:1,zone:'prata',amountPi:20});
 assert.equal(quote(500,500,1),null);
 assert.equal(quote(0,0,3),null);
});
test('signed session rejects tampering and expired credentials',()=>{
 process.env.PIXEL_SESSION_SECRET='test-only-long-hmac-key-not-a-real-secret-000';
 const token=sign('uid_123');
 assert.equal(uidFrom(new Request('https://local.test',{headers:{authorization:'Bearer '+token}})),'uid_123');
 assert.throws(()=>uidFrom(new Request('https://local.test',{headers:{authorization:'Bearer '+token+'x'}})));
});
test('payment validation rejects mismatched identity, amount, metadata and direction',()=>{
 const order={id:'123',pi_uid:'uid_123',amount_pi:20};
 const p={direction:'user_to_app',user_uid:'uid_123',amount:20,metadata:{orderId:'123',kind:'safra_pixel'},network:'Pi Testnet',status:{}};
 assert.equal(validatePayment(p,order),true);
 assert.equal(validatePayment({...p,amount:10},order),false);
 assert.equal(validatePayment({...p,user_uid:'other'},order),false);
 assert.equal(validatePayment({...p,direction:'app_to_user'},order),false);
 assert.equal(validatePayment({...p,metadata:{orderId:'wrong',kind:'safra_pixel'}},order),false);
});
