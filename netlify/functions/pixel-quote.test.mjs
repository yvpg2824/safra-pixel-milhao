import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from './pixel-quote.mjs';
function req(body){return new Request('https://example.net/api/pixel/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
test('quote is server-priced and never enables payments',async()=>{
 const oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 try{const res=await handler(req({x:94,y:112,size:1,amountPi:1}));const data=await res.json();assert.equal(res.status,200);assert.equal(data.quote.amountPi,20);assert.equal(data.availabilityVerified,false);assert.equal(data.paymentEnabled,false);assert.equal(data.reserved,false)}finally{if(oldUrl!==undefined)process.env.SUPABASE_URL=oldUrl;if(oldKey!==undefined)process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey}
});
test('reserved diamond and invalid area are rejected',async()=>{for(const b of [{x:500,y:500,size:1},{x:1,y:500,size:100},{x:0,y:0,size:3}]){const res=await handler(req(b));assert.equal(res.status,422)}});
