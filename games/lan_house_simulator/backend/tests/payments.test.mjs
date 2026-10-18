import test from 'node:test';
import assert from 'node:assert/strict';
import {createPayments,preferenceBody,validCheckout} from '../payments.mjs';
import {DONATE_PACKAGES} from '../../donate-packages.mjs';

// A serialized transaction fixture with atomic commit and Firestore's read-before-write rule.
function database(){
 const rows=new Map();let queue=Promise.resolve();
 const snap=path=>({exists:rows.has(path),data:()=>structuredClone(rows.get(path))});
 const ref=path=>({path,collection:name=>collection(path+'/'+name),get:async()=>snap(path)});
 const collection=path=>({doc:key=>ref(path+'/'+key),orderBy:()=>({limit:()=>({get:async()=>({docs:[...rows].filter(([key])=>key.startsWith(path+'/')&&!key.slice(path.length+1).includes('/')).map(([key])=>snap(key))})})})});
 const db={collection,runTransaction:fn=>{const result=queue.then(async()=>{const writes=[];const read=async r=>{assert.equal(writes.length,0,'reads must precede writes');return snap(r.path);};const result=await fn({get:read,getAll:(...refs)=>Promise.all(refs.map(read)),create:(r,v)=>writes.push(['create',r.path,v]),update:(r,v)=>writes.push(['update',r.path,v]),set:(r,v,options)=>writes.push([options?.merge?'merge':'set',r.path,v])});const next=new Map(rows);for(const [op,path,value] of writes){if(op==='create')assert.ok(!next.has(path),'duplicate create');if(op==='update')assert.ok(next.has(path),'update missing');next.set(path,['merge','update'].includes(op)?{...next.get(path),...value}:value);}rows.clear();for(const [k,v] of next)rows.set(k,v);return result;});queue=result.catch(()=>{});return result;}};
 return {db,rows};
}
function fixture({sandbox=false,sellerIsTest=false,provider}={}){
 const {db,rows}=database();let calls=0,clock=Date.now();
 const service=createPayments({db,FieldValue:{serverTimestamp:()=>clock},packages:DONATE_PACKAGES,sandbox,sellerIsTest,apiUrl:'https://api.example',siteUrl:'https://site.example',sellerId:'7',applicationId:'8',now:()=>clock,mp:async(path,options)=>{calls++;return provider?provider(path,options):{id:'preference',init_point:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=p',sandbox_init_point:'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=p'};}});
 return {service,rows,calls:()=>calls,advance:ms=>clock+=ms};
}
const payment=(order,changes={})=>({id:123,collector_id:7,application_id:8,live_mode:true,currency_id:'BRL',transaction_amount:5,status:'approved',external_reference:order.id,date_last_updated:'2026-10-17T20:00:00Z',...changes});
test('offers are exactly R$5/50 and R$10/100; preferences fix amount and safe return URLs',()=>{
 assert.deepEqual(DONATE_PACKAGES,{'donate-5':{priceCents:500,cookies:50},'donate-10':{priceCents:1000,cookies:100}});
 const p=preferenceBody({id:'order',packageId:'donate-5',...DONATE_PACKAGES['donate-5']},{apiUrl:'https://api.example',siteUrl:'https://site.example',now:0});
 assert.equal(p.items[0].unit_price,5);assert.equal(p.items[0].quantity,1);assert.equal(p.external_reference,'order');assert.equal(p.back_urls.success,'https://site.example/donate/?order=order');assert.equal(p.notification_url,'https://api.example/webhooks/mercadopago');assert.equal(p.expires,true);
 assert.equal(Object.hasOwn(p,'auto_recurring'),false);assert.equal(Object.hasOwn(p,'preapproval_plan_id'),false);
 for(const url of ['http://www.mercadopago.com.br/x','https://evilmercadopago.com/x','https://www.mercadopago.com.br.evil.com/x','https://user:pass@www.mercadopago.com.br/x'])assert.throws(()=>validCheckout(url));
});
test('concurrent double clicks reuse one preference; amounts, user and mode are server-owned',async()=>{
 const f=fixture();const results=await Promise.allSettled([f.service.createOrder('player','donate-5','key'),f.service.createOrder('player','donate-5','key')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.calls(),1);
 const first=results.find(r=>r.status==='fulfilled').value;assert.deepEqual(await f.service.createOrder('player','donate-5','key'),first);assert.equal(f.calls(),1);
 await assert.rejects(f.service.createOrder('player','donate-10','key'),e=>e.status===409);
 await assert.rejects(f.service.createOrder('player','toString','new-key'),e=>e.status===400);
 await assert.rejects(f.service.readOrder('other',first.id),e=>e.status===404);
 f.advance(86_400_001);await assert.rejects(f.service.createOrder('player','donate-5','key'),e=>e.status===410);
});
test('verified approvals credit once, late pending cannot undo, refunds and chargebacks reverse once',async()=>{
 const f=fixture(),order=await f.service.createOrder('player','donate-5','key');const p=payment(order);
 await Promise.all([f.service.applyPayment(p),f.service.applyPayment(p)]);assert.equal(f.rows.get('accounts/player').cookiesBalance,50);
 await f.service.applyPayment({...p,status:'pending',date_last_updated:'2026-10-17T19:00:00Z'});assert.equal(f.rows.get('accounts/player').cookiesBalance,50);
 await f.service.applyPayment({...p,transaction_amount_refunded:2,date_last_updated:'2026-10-17T21:00:00Z'});assert.equal(f.rows.get('accounts/player').cookiesBalance,30);
 const cb={...p,status:'charged_back',date_last_updated:'2026-10-17T22:00:00Z'};await f.service.applyPayment(cb);await f.service.applyPayment(cb);assert.equal(f.rows.get('accounts/player').cookiesBalance,0);
 assert.equal([...f.rows.keys()].filter(p=>p.includes('/ledger/')).length,3);
});
test('wrong amount, currency, seller, application and environment cannot credit',async()=>{
 const f=fixture(),order=await f.service.createOrder('player','donate-5','key');
 for(const changes of [{transaction_amount:1},{currency_id:'USD'},{collector_id:999},{application_id:999},{live_mode:false},{transaction_amount_refunded:6}])await assert.rejects(f.service.applyPayment(payment(order,changes)),e=>e.status===400);
 assert.equal(f.rows.has('accounts/player'),false);
});
test('sandbox wallet never credits real Cookies and real orders are isolated',async()=>{
 const f=fixture({sandbox:true}),order=await f.service.createOrder('player','donate-5','key');await f.service.applyPayment(payment(order,{live_mode:false}));
 assert.equal(f.rows.get('accounts/player').cookiesBalance,undefined);assert.equal(f.rows.get('accounts/player').cookiesBalanceSandbox,50);
});
test('verified test sellers may use live_mode=true but still only receive sandbox Cookies',async()=>{
 const f=fixture({sandbox:true,sellerIsTest:true}),order=await f.service.createOrder('player','donate-5','key');await f.service.applyPayment(payment(order));
 assert.equal(new URL(order.url).hostname,'www.mercadopago.com.br');
 assert.equal(f.rows.get('accounts/player').cookiesBalance,undefined);assert.equal(f.rows.get('accounts/player').cookiesBalanceSandbox,50);
 await assert.rejects(f.service.applyPayment(payment(order,{collector_id:999})),e=>e.status===400);
});
test('a test seller is refused in production mode',()=>{
 assert.throws(()=>fixture({sellerIsTest:true}),/conta de teste/);
});
test('a second approved payment cannot double-credit an order; pending/rejected never grant Cookies',async()=>{
 const f=fixture(),order=await f.service.createOrder('player','donate-5','key');
 await f.service.applyPayment(payment(order,{status:'pending'}));assert.equal(f.rows.has('accounts/player'),false);
 await f.service.applyPayment(payment(order,{status:'rejected',date_last_updated:'2026-10-17T21:00:00Z'}));assert.equal(f.rows.has('accounts/player'),false);
 await f.service.applyPayment(payment(order,{id:456,date_last_updated:'2026-10-17T22:00:00Z'}));assert.equal(f.rows.get('accounts/player').cookiesBalance,50);
 await assert.rejects(f.service.applyPayment(payment(order,{id:789,date_last_updated:'2026-10-17T23:00:00Z'})),e=>e.status===409);assert.equal(f.rows.get('accounts/player').cookiesBalance,50);
});
test('authenticated reconciliation recovers a lost webhook and history belongs to UID',async()=>{
 let p;const f=fixture({provider:path=>path.startsWith('/checkout')?{id:'p',init_point:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=p'}:{results:[p]}});
 const order=await f.service.createOrder('player','donate-5','key');p=payment(order);assert.equal((await f.service.readOrder('player',order.id)).status,'approved');assert.equal(f.rows.get('accounts/player').cookiesBalance,50);
 assert.equal((await f.service.listOrders('player')).length,1);assert.equal((await f.service.listOrders('other')).length,0);
});
