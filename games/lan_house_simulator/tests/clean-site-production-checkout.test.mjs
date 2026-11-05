import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {readFileSync} from 'node:fs';
const bundle=buildSync({entryPoints:[new URL('../frontend-angular/src/site-rewrite/production-checkout-contract.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const contract=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const config={paymentsEnabled:true,paymentsMode:'production',packages:{'donate-5':{priceCents:500,cookies:50}}};
const quote=contract.productionQuote(config,'donate-5');
const receipt={id:'a'.repeat(64),url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=synthetic'};
const key='123e4567-e89b-42d3-a456-426614174000';
const clientBuild=buildSync({entryPoints:[new URL('../frontend-angular/src/site-rewrite/account-client.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const {SiteAccountClient}=await import('data:text/javascript;base64,'+Buffer.from(clientBuild.outputFiles[0].text).toString('base64'));
function transportFixture({mode='production',verified=true,status=200}={}){
 const calls=[];
 const accountConfig={enabled:true,apiUrl:'https://api.example.invalid',firebaseApiKey:'synthetic'};
 const storage={getItem:()=>JSON.stringify({...accountConfig,idToken:'synthetic',refreshToken:'synthetic',email:'synthetic@example.invalid',createdAt:1000}),setItem:()=>{},removeItem:()=>{}};
 const transport=async(input,init={})=>{
  const path=new URL(String(input)).pathname;calls.push({path,init});
  if(path==='/v1/config')return Response.json({...config,paymentsMode:mode});
  if(path==='/v1/accounts:lookup')return Response.json({users:[{email:'synthetic@example.invalid',emailVerified:verified}]});
  if(path==='/v1/token')return Response.json({id_token:'renewed',refresh_token:'synthetic'});
  if(path==='/v1/orders')return Response.json(status===200?receipt:{error:'synthetic'},{status});
  throw Error('Unexpected endpoint');
 };
 return {calls,client:new SiteAccountClient(accountConfig,transport,storage,()=>1001)};
}
test('repository enables the reviewed UI and accepts only literal boolean true',()=>{
 const policy=JSON.parse(readFileSync(new URL('../frontend-angular/src/site-rewrite/public/checkout-config.json',import.meta.url),'utf8'));
 assert.equal(contract.productionCheckoutEnabled(policy),true);
 for(const raw of [null,{},true,{productionCheckoutEnabled:'true'},{productionCheckoutEnabled:1}])assert.equal(contract.productionCheckoutEnabled(raw),false);
 assert.equal(contract.productionCheckoutEnabled({productionCheckoutEnabled:true}),true);
});
test('closed gate, absent consent, sandbox and changed prices never create orders',async()=>{
 for(const changes of [{enabled:false},{acceptedTerms:false},{readConfig:async()=>({...config,paymentsMode:'sandbox'})},
  {readConfig:async()=>({...config,packages:{'donate-5':{priceCents:501,cookies:50}}})}]){
  let writes=0;
  await assert.rejects(contract.prepareProductionCheckout({enabled:true,acceptedTerms:true,quote,key,
   readConfig:async()=>config,createOrder:async()=>{writes++;return receipt;},...changes}));
  assert.equal(writes,0);
 }
});
test('explicit production contract sends only package/consent and never credits locally',async()=>{
 const calls=[];
 const result=await contract.prepareProductionCheckout({enabled:true,acceptedTerms:true,quote,key,
  readConfig:async()=>config,createOrder:async(body,key)=>{calls.push({body,key});return receipt;}});
 assert.deepEqual(calls,[{body:{packageId:'donate-5',acceptedTerms:true},key}]);
 assert.deepEqual(result,receipt);assert.equal('credited' in result,false);
});
for(const url of ['https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=x',
 'https://www.mercadopago.com.br.evil.invalid/checkout/v1/redirect?pref_id=x',
 'https://www.mercadopago.com.br/other?pref_id=x','https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=x&pref_id=y'])
 test('production contract rejects '+url,()=>assert.throws(()=>contract.productionOrder({...receipt,url})));
test('production transport defaults closed; backend mode and verified profile are rechecked',async()=>{
 const closed=transportFixture();
 await assert.rejects(closed.client.postProductionOrder({packageId:'donate-5',acceptedTerms:true},key));
 assert.deepEqual(closed.calls,[]);
 for(const options of [{mode:'sandbox'},{verified:false}]){
  const f=transportFixture(options);
  await assert.rejects(f.client.postProductionOrder({packageId:'donate-5',acceptedTerms:true},key,true));
  assert.equal(f.calls.filter(x=>x.path==='/v1/orders').length,0);
 }
});
test('production 401 refresh is bounded to one repeat with the same intent',async()=>{
 const f=transportFixture({status:401});
 await assert.rejects(f.client.postProductionOrder({packageId:'donate-5',acceptedTerms:true},key,true),e=>e.status===401);
 const orders=f.calls.filter(x=>x.path==='/v1/orders');
 assert.equal(orders.length,2);assert.ok(orders.every(x=>JSON.parse(x.init.body).expectedMode==='production'));assert.ok(orders.every(x=>x.init.headers['Idempotency-Key']===key));
 assert.deepEqual(JSON.parse(orders[1].init.body),{packageId:'donate-5',acceptedTerms:true,expectedMode:'production'});
 assert.equal(f.calls.filter(x=>x.path==='/v1/token').length,1);
});
for(const status of [409,410,503])test('production status '+status+' never automatically repeats POST',async()=>{
 const f=transportFixture({status});
 await assert.rejects(f.client.postProductionOrder({packageId:'donate-5',acceptedTerms:true},key,true),e=>e.status===status);
 assert.equal(f.calls.filter(x=>x.path==='/v1/orders').length,1);
});

test('order reconciliation accepts only authenticated GET for an exact order ID',async()=>{
 const id='a'.repeat(64),calls=[];
 const accountConfig={enabled:true,apiUrl:'https://api.example.invalid',firebaseApiKey:'synthetic'};
 const storage={getItem:()=>JSON.stringify({...accountConfig,idToken:'synthetic',refreshToken:'synthetic',email:'synthetic@example.invalid',createdAt:1000}),setItem:()=>{},removeItem:()=>{}};
 const client=new SiteAccountClient(accountConfig,async(url,init)=>{
  calls.push({url,init});return Response.json({id,status:'pending'});
 },storage,()=>1001);
 await client.api('/v1/orders/'+id);
 assert.equal(calls.length,1);
 assert.equal(calls[0].init.method,'GET');
 assert.equal(calls[0].init.headers.Authorization,'Bearer synthetic');
 for(const path of ['/v1/orders/bad','/v1/orders/'+id+'?approved=true','/v1/orders/../account'])
  await assert.rejects(client.api(path));
 await assert.rejects(client.api('/v1/orders/'+id,{}));
 assert.equal(calls.length,1);
});
