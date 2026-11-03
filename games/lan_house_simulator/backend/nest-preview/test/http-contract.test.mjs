import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewApp} from '../dist/bootstrap.js';

let app;
let base;
const allowed='https://lhs.example.test';
before(async()=>{
 process.env.ALLOWED_ORIGINS=allowed;
 app=await createPreviewApp();
 await app.listen(0,'127.0.0.1');
 const address=app.getHttpServer().address();
 assert.ok(address&&typeof address==='object');
 base='http://127.0.0.1:'+address.port;
});
after(async()=>{
 await app?.close();
 delete process.env.ALLOWED_ORIGINS;
});

test('health has the security baseline and unique safe trace',async()=>{
 const response=await fetch(base+'/__nest_probe/health');
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),
  {ok:true,service:'lhs-nest-preview',production:false});
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 assert.equal(response.headers.get('x-powered-by'),null);
 assert.equal(response.headers.get('access-control-allow-origin'),null);
 assert.match(response.headers.get('x-lhs-trace-id')??'',/^[a-f0-9-]{36}$/);
});

test('CORS only reflects exact origins from the allowlist',async()=>{
 const yes=await fetch(base+'/__nest_probe/health',{headers:{origin:allowed}});
 assert.equal(yes.status,200);
 assert.equal(yes.headers.get('access-control-allow-origin'),allowed);
 assert.equal(yes.headers.get('vary'),'Origin');
 const no=await fetch(base+'/__nest_probe/health',
  {headers:{origin:'https://evil.example.test'}});
 assert.equal(no.status,403);
 assert.deepEqual(await no.json(),{error:'Origem não autorizada.'});
 assert.equal(no.headers.get('access-control-allow-origin'),null);
 assert.equal(no.headers.get('cache-control'),'no-store');
});

test('OPTIONS preflight exits early without invoking the controller',async()=>{
 const response=await fetch(base+'/__nest_probe/health',{method:'OPTIONS',
  headers:{origin:allowed,'access-control-request-method':'GET'}});
 assert.equal(response.status,204);
 assert.equal(response.headers.get('access-control-allow-origin'),allowed);
 assert.equal(response.headers.get('access-control-allow-methods'),'GET, POST, OPTIONS');
});

test('Firebase, saves, orders and webhook routes do not exist in preview',async()=>{
 for(const [method,path] of [
  ['GET','/v1/config'],['GET','/v1/account'],['GET','/v1/saves/main'],
  ['POST','/v1/orders'],['GET','/v1/orders'],['POST','/webhooks/mercadopago']
 ]){
  const response=await fetch(base+path,{method});
  assert.equal(response.status,404,method+' '+path+' must not be available');
 }
});

test('auth preview is fail-closed by default, without Firebase SDK or credentials',async()=>{
 const missing=await fetch(base+'/__nest_probe/auth');
 assert.equal(missing.status,401);
 assert.deepEqual(await missing.json(),{error:'Entre na conta para usar a nuvem.'});
 const noVerifier=await fetch(base+'/__nest_probe/auth',{headers:{Authorization:'Bearer token'}});
 assert.equal(noVerifier.status,401);
 assert.deepEqual(await noVerifier.json(),{error:'Sessão inválida ou expirada.'});
 const gate=await fetch(base+'/__nest_probe/verified',{headers:{Authorization:'Bearer token'}});
 assert.equal(gate.status,401);
});

test('mock Firebase port enforces revoked-token checking and email verification parity',async()=>{
 const calls=[];
 const fake={
  async verifyIdToken(token,checkRevoked){
   calls.push({token,checkRevoked});
   if(token==='active')return {uid:'user-a',email_verified:true};
   if(token==='not-verified')return {uid:'user-b',email_verified:false};
   if(token==='no-email-claim')return {uid:'user-c'};
   if(token==='no-uid')return {uid:''};
   throw new Error('Expired or revoked token: private provider details');
  }
 };
 const isolated=await createPreviewApp(fake);
 await isolated.listen(0,'127.0.0.1');
 const address=isolated.getHttpServer().address();
 assert.ok(address&&typeof address==='object');
 const url='http://127.0.0.1:'+address.port;
 try{
  const before=calls.length;
  for(const authorization of [undefined,'Basic active','bearer active','Bearer  active']){
   const response=await fetch(url+'/__nest_probe/auth',{
    headers:authorization?{Authorization:authorization}:{}
   });
   assert.equal(response.status,401,authorization);
   assert.deepEqual(await response.json(),{error:'Entre na conta para usar a nuvem.'});
  }
  assert.equal(calls.length,before,'Malformed headers never reach Firebase');

  for(const token of ['revoked','no-uid']){
   const response=await fetch(url+'/__nest_probe/auth',
    {headers:{Authorization:'Bearer '+token}});
   assert.equal(response.status,401);
   assert.deepEqual(await response.json(),{error:'Sessão inválida ou expirada.'});
  }
  for(const token of ['not-verified','no-email-claim']){
   const headers={Authorization:'Bearer '+token};
   const baseAuth=await fetch(url+'/__nest_probe/auth',{headers});
   assert.equal(baseAuth.status,200);
   assert.deepEqual(await baseAuth.json(),{authenticated:true});
   const gated=await fetch(url+'/__nest_probe/verified',{headers});
   assert.equal(gated.status,403);
   assert.deepEqual(await gated.json(),{error:'Confirme seu email antes de usar a nuvem.'});
  }
  const granted=await fetch(url+'/__nest_probe/verified',
   {headers:{Authorization:'Bearer active'}});
  assert.equal(granted.status,200);
  assert.deepEqual(await granted.json(),{verified:true});
  assert.ok(calls.length>0);
  assert.ok(calls.every(c=>c.checkRevoked===true),'All Firebase checks must reject revoked IDs');
  assert.doesNotMatch(JSON.stringify(await (await fetch(url+'/__nest_probe/auth',
   {headers:{Authorization:'Bearer active'}})).json()),/user-a|active|uid|email/);
  const originDenied=await fetch(url+'/__nest_probe/verified',
   {headers:{Authorization:'Bearer active',Origin:'https://evil.example.test'}});
  assert.equal(originDenied.status,403);
  assert.deepEqual(await originDenied.json(),{error:'Origem não autorizada.'});
 }finally{await isolated.close();}
});

test('quota endpoint denies by default and respects authentication, email and CORS ordering',async()=>{
 const verifier={
  async verifyIdToken(token,revoked){
   assert.equal(revoked,true);
   if(token==='verified')return {uid:'real-user',email_verified:true};
   if(token==='unverified')return {uid:'real-user',email_verified:false};
   throw new Error('Provider secret: do not leak');
  }
 };
 const app=await createPreviewApp(verifier);
 await app.listen(0,'127.0.0.1');
 const address=app.getHttpServer().address();
 assert.ok(address&&typeof address==='object');
 const endpoint='http://127.0.0.1:'+address.port+'/__nest_probe/limited';
 try{
  const missing=await fetch(endpoint);
  assert.equal(missing.status,401);
  assert.deepEqual(await missing.json(),{error:'Entre na conta para usar a nuvem.'});

  const unverified=await fetch(endpoint,{headers:{Authorization:'Bearer unverified'}});
  assert.equal(unverified.status,403);
  assert.deepEqual(await unverified.json(),
   {error:'Confirme seu email antes de usar a nuvem.'});

  const closed=await fetch(endpoint,{headers:{Authorization:'Bearer verified'}});
  assert.equal(closed.status,503);
  assert.deepEqual(await closed.json(),{error:'Serviço temporariamente indisponível.'});

  const badOrigin=await fetch(endpoint,{headers:{
   Authorization:'Bearer verified',Origin:'https://attacker.invalid'
  }});
  assert.equal(badOrigin.status,403);
  assert.deepEqual(await badOrigin.json(),{error:'Origem não autorizada.'});

  const preflight=await fetch(endpoint,{method:'OPTIONS',headers:{Origin:allowed}});
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('access-control-allow-origin'),allowed);
 }finally{await app.close();}
});

test('transactional quota uses verified UID and 30 requests per fixed minute under concurrency',async()=>{
 const {createTransactionalUserQuota}=await import('../dist/user-quota.js');
 const rows=new Map();
 let queue=Promise.resolve();
 const store={
  collection(name){
   assert.equal(name,'rateLimits');
   return {doc:uid=>({path:name+'/'+uid})};
  },
  runTransaction(fn){
   const task=queue.then(async()=>{
    const writes=[];
    const result=await fn({
     get:async ref=>({data:()=>structuredClone(rows.get(ref.path))}),
     set:(ref,data)=>writes.push([ref.path,data])
    });
    for(const [path,value] of writes)rows.set(path,value);
    return result;
   });
   queue=task.catch(()=>{});
   return task;
  }
 };
 let now=1_800_000_000_000;
 const quota=createTransactionalUserQuota(store,()=>now);
 const verifier={
  async verifyIdToken(token,revoked){
   assert.equal(revoked,true);
   if(token==='account-a')return {uid:'account-a',email_verified:true};
   if(token==='account-b')return {uid:'account-b',email_verified:true};
   if(token==='unverified')return {uid:'account-c',email_verified:false};
   throw new Error('Expired token');
  }
 };
 const app=await createPreviewApp(verifier,quota);
 await app.listen(0,'127.0.0.1');
 const address=app.getHttpServer().address();
 assert.ok(address&&typeof address==='object');
 const endpoint='http://127.0.0.1:'+address.port+'/__nest_probe/limited';
 try{
  const requests=await Promise.all(Array.from({length:32},()=>fetch(
   endpoint+'?uid=account-b',{headers:{
    Authorization:'Bearer account-a','X-LHS-UID':'account-b'
   }}
  )));
  assert.equal(requests.filter(r=>r.status===200).length,30);
  assert.equal(requests.filter(r=>r.status===429).length,2);
  for(const denied of requests.filter(r=>r.status===429)){
   assert.deepEqual(await denied.json(),
    {error:'Muitas solicitações. Tente novamente em um minuto.'});
  }
  assert.equal(rows.get('rateLimits/account-a').count,30);
  assert.equal(rows.get('rateLimits/account-a').window,Math.floor(now/60_000));
  assert.equal(rows.get('rateLimits/account-a').expiresAt.getTime(),now+120_000);
  assert.equal(rows.has('rateLimits/account-b'),false,'Spoofed query and headers do not change UID');

  const b=await fetch(endpoint,{headers:{Authorization:'Bearer account-b'}});
  assert.equal(b.status,200);
  assert.deepEqual(await b.json(),{allowed:true});
  assert.equal(rows.get('rateLimits/account-b').count,1);

  const unverified=await fetch(endpoint,{headers:{Authorization:'Bearer unverified'}});
  assert.equal(unverified.status,403);
  assert.equal(rows.has('rateLimits/account-c'),false);

  now+=60_000;
  const nextMinute=await fetch(endpoint,{headers:{Authorization:'Bearer account-a'}});
  assert.equal(nextMinute.status,200);
  assert.equal(rows.get('rateLimits/account-a').count,1);
  assert.equal(rows.get('rateLimits/account-a').expiresAt.getTime(),now+120_000);
  assert.equal(rows.size,2);
 }finally{await app.close();}
});

test('quota-store errors fail closed without returning database details',async()=>{
 const {createTransactionalUserQuota}=await import('../dist/user-quota.js');
 const verifier={async verifyIdToken(){return {uid:'u',email_verified:true};}};
 const store={
  collection:()=>({doc:()=>({path:'rateLimits/u'})}),
  runTransaction:async()=>{throw new Error('secret-firestore-connection-string');}
 };
 const app=await createPreviewApp(verifier,createTransactionalUserQuota(store));
 await app.listen(0,'127.0.0.1');
 const address=app.getHttpServer().address();
 assert.ok(address&&typeof address==='object');
 try{
  const response=await fetch('http://127.0.0.1:'+address.port+'/__nest_probe/limited',
   {headers:{Authorization:'Bearer valid'}});
  assert.equal(response.status,503);
  const body=await response.json();
  assert.deepEqual(body,{error:'Serviço temporariamente indisponível.'});
  assert.doesNotMatch(JSON.stringify(body),/secret|firestore|connection/);
 }finally{await app.close();}
});
