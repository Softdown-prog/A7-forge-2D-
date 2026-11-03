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
