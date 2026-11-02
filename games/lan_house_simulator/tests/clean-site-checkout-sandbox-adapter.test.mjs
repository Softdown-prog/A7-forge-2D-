import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
const entry=new URL('../frontend-angular/src/site-rewrite/checkout-sandbox-adapter.ts',import.meta.url).pathname;
const result=buildSync({entryPoints:[entry],bundle:true,format:'esm',platform:'node',write:false});
const moduleUrl='data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64');
const {createAuthenticatedSandboxAdapter}=await import(moduleUrl);
const contractEntry=new URL('../frontend-angular/src/site-rewrite/checkout-contract.ts',import.meta.url).pathname;
const contractResult=buildSync({entryPoints:[contractEntry],bundle:true,format:'esm',platform:'node',write:false});
const {simulateSandboxCheckout}=await import('data:text/javascript;base64,'+
 Buffer.from(contractResult.outputFiles[0].text).toString('base64'));
const key='123e4567-e89b-42d3-a456-426614174000';
const order={id:'b'.repeat(64),
 url:'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=synthetic'};
const config={enabled:true,apiUrl:'https://api.example.invalid',firebaseApiKey:'firebase-synthetic'};
const catalogue={paymentsEnabled:true,paymentsMode:'sandbox',packages:{
 'donate-5':{priceCents:500,cookies:50},'donate-10':{priceCents:1000,cookies:100}
}};
function response(data,status=200){return {ok:status>=200&&status<300,status,
 json:async()=>data};}
function fixture({mode='sandbox',verified=true,session=true,orderStatus=200}={}){
 const calls=[];
 const storageValue=JSON.stringify({apiUrl:config.apiUrl,firebaseApiKey:config.firebaseApiKey,
  idToken:'firebase-synthetic-id',refreshToken:'firebase-synthetic-refresh',
  email:'synthetic@example.invalid',createdAt:1000});
 const storage={getItem:()=>session?storageValue:null,
  setItem:()=>{},removeItem:()=>{}};
 const now=()=>1001;
 const transport=async(input,init={})=>{
  const url=new URL(String(input));calls.push({path:url.pathname,method:init.method??'GET',
   headers:init.headers,body:init.body});
  if(url.pathname==='/v1/config')return response({...catalogue,paymentsMode:mode});
  if(url.pathname==='/v1/accounts:lookup')return response({users:[{
   email:'synthetic@example.invalid',emailVerified:verified
  }]});
  if(url.pathname==='/v1/orders')return response(
   orderStatus===200?order:{error:'Pedido não disponível'},orderStatus);
  throw Error('Unexpected request '+url.pathname);
 };
 return {calls,storage,now,transport};
}
test('sandbox request sends only authoritative package, terms, auth and same idempotency key',async()=>{
 const f=fixture();
 const accountModule=await import(moduleUrl);
 // The adapter is constructed with a real SiteAccountClient in the same bundled module.
 const client=accountModule.makeClientForTests(f.transport,f.storage,f.now);
 const adapter=createAuthenticatedSandboxAdapter(client,f.transport);
 const receipt=await simulateSandboxCheckout({
  account:{emailVerified:true},acceptedTerms:true,packageId:'donate-5',
  idempotencyKey:key,adapter
 });
 assert.equal(receipt.orderId,order.id);
 assert.equal(receipt.paymentStatus,'not-confirmed');
 const writes=f.calls.filter(x=>x.path==='/v1/orders');
 assert.equal(writes.length,1);
 assert.equal(writes[0].method,'POST');
 assert.equal(writes[0].headers['Idempotency-Key'],key);
 assert.equal(writes[0].headers['X-LHS-Sandbox-Only'],'true');
 assert.equal(writes[0].headers.Authorization,'Bearer firebase-synthetic-id');
 assert.deepEqual(JSON.parse(writes[0].body),{packageId:'donate-5',acceptedTerms:true});
 assert.equal(Object.hasOwn(JSON.parse(writes[0].body),'priceCents'),false);
});
for(const [name,opts] of [['production',{mode:'production'}],
 ['unverified',{verified:false}],['no session',{session:false}]])
 test('refuse sandbox POST for '+name,async()=>{
  const f=fixture(opts);
  const accountModule=await import(moduleUrl);
  const client=accountModule.makeClientForTests(f.transport,f.storage,f.now);
  const adapter=createAuthenticatedSandboxAdapter(client,f.transport);
  await assert.rejects(simulateSandboxCheckout({
   account:{emailVerified:true},acceptedTerms:true,packageId:'donate-5',
   idempotencyKey:key,adapter
  }));
  assert.equal(f.calls.filter(x=>x.path==='/v1/orders').length,0);
 });
test('invalid idempotency blocks all order POST requests',async()=>{
 const f=fixture();const accountModule=await import(moduleUrl);
 const client=accountModule.makeClientForTests(f.transport,f.storage,f.now);
 const adapter=createAuthenticatedSandboxAdapter(client,f.transport);
 await assert.rejects(simulateSandboxCheckout({
  account:{emailVerified:true},acceptedTerms:true,packageId:'donate-5',
  idempotencyKey:'invalid',adapter
 }));
 assert.equal(f.calls.filter(x=>x.path==='/v1/orders').length,0);
});
test('failed provider response never represents a paid order',async()=>{
 const f=fixture({orderStatus:503});const accountModule=await import(moduleUrl);
 const client=accountModule.makeClientForTests(f.transport,f.storage,f.now);
 await assert.rejects(simulateSandboxCheckout({
  account:{emailVerified:true},acceptedTerms:true,packageId:'donate-5',
  idempotencyKey:key,adapter:createAuthenticatedSandboxAdapter(client,f.transport)
 }));
});
