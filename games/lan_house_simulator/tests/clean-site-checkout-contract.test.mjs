import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
const source=new URL('../frontend-angular/src/site-rewrite/checkout-contract.ts',import.meta.url).pathname;
const bundle=buildSync({entryPoints:[source],bundle:true,format:'esm',platform:'node',write:false});
const checkout=await import('data:text/javascript;base64,'+
 Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const config={paymentsEnabled:true,paymentsMode:'sandbox',packages:{
 'donate-5':{priceCents:500,cookies:50},
 'donate-10':{priceCents:1000,cookies:100}
}};
const order={id:'a'.repeat(64),url:'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=synthetic'};
const key='123e4567-e89b-42d3-a456-426614174000';
function harness(overrides={}){
 const calls=[];
 const adapter={readConfig:async()=>{calls.push({kind:'quote'});return config;},
  createOrder:async(body,idempotencyKey)=>{calls.push({kind:'order',body,idempotencyKey});return order;}};
 return {calls,options:{account:{emailVerified:true},packageId:'donate-5',
  acceptedTerms:true,idempotencyKey:key,adapter,...overrides}};
}
test('synthetic backend confirms amounts; no amount is sent in order POST body',async()=>{
 const h=harness();
 const result=await checkout.simulateSandboxCheckout(h.options);
 assert.deepEqual(h.calls,[{kind:'quote'},{
  kind:'order',body:{packageId:'donate-5',acceptedTerms:true},idempotencyKey:key
 }]);
 assert.equal(result.priceCents,500);
 assert.equal(result.cookies,50);
 assert.equal(result.orderId,order.id);
 assert.equal(result.paymentStatus,'not-confirmed');
 assert.ok(result.checkoutUrl.startsWith('https://sandbox.mercadopago.com.br/'));
 assert.equal(Object.hasOwn(result,'credited'),false);
 assert.equal(Object.hasOwn(result,'balance'),false);
});
for(const [scenario,overrides] of [
 ['no session',{account:null}],
 ['unverified',{account:{emailVerified:false}}],
 ['terms not accepted',{acceptedTerms:false}],
 ['unknown package',{packageId:'donate-100'}],
 ['invalid idempotency',{idempotencyKey:'retry-key'}]
])test('fail closed before making requests: '+scenario,async()=>{
 const h=harness(overrides);
 await assert.rejects(checkout.simulateSandboxCheckout(h.options));
 assert.deepEqual(h.calls,[]);
});
for(const mode of ['production','unavailable','corrupt-amount','corrupt-cookies','missing-package'])
 test('invalid or production quote never initiates a checkout: '+mode,async()=>{
 const h=harness();
 const raw=structuredClone(config);
 if(mode==='production')raw.paymentsMode='production';
 if(mode==='unavailable')raw.paymentsEnabled=false;
 if(mode==='corrupt-amount')raw.packages['donate-5'].priceCents=-10;
 if(mode==='corrupt-cookies')raw.packages['donate-5'].cookies=1.5;
 if(mode==='missing-package')delete raw.packages['donate-5'];
 h.options.adapter.readConfig=async()=>{h.calls.push({kind:'quote'});return raw;};
 await assert.rejects(checkout.simulateSandboxCheckout(h.options));
 assert.deepEqual(h.calls,[{kind:'quote'}]);
});
for(const url of ['http://sandbox.mercadopago.com.br/x',
 'https://www.mercadopago.com.br/checkout','https://evil.invalid/checkout',
 'javascript:alert(1)','https://sandbox.mercadopago.com.br.evil.invalid/',
 'https://me:secret@sandbox.mercadopago.com.br/x',
 'https://sandbox.mercadopago.com.br:8443/x',
 'https://sandbox.mercadopago.com.br/x#secret'])
 test('reject malicious or production checkout target: '+url,()=>{
 assert.throws(()=>checkout.validateSandboxOrder({...order,url}));
});
for(const id of ['123','../other-order','<script>','B'.repeat(64)])
 test('reject invalid order ID '+id.slice(0,12),()=>{
 assert.throws(()=>checkout.validateSandboxOrder({...order,id}));
});
test('network errors do not become paid status or credits',async()=>{
 const h=harness();
 h.options.adapter.createOrder=async()=>{throw Error('Synthetic backend unavailable');};
 await assert.rejects(checkout.simulateSandboxCheckout(h.options));
 assert.deepEqual(h.calls,[{kind:'quote'}]);
});
test('retry uses exact caller-provided idempotency key without double pricing',async()=>{
 const h=harness();
 await checkout.simulateSandboxCheckout(h.options);
 await checkout.simulateSandboxCheckout(h.options);
 assert.equal(h.calls.filter(x=>x.kind==='order').length,2);
 assert.ok(h.calls.filter(x=>x.kind==='order').every(x=>x.idempotencyKey===key));
});
test('no browser networking, navigation, storage or real account code in contract',()=>{
 const fs=awaitImportForbidden;
});
