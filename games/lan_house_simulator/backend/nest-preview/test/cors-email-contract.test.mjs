import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPreviewApp} from '../dist/bootstrap.js';

const apiSource=readFileSync(new URL('../../server.mjs',import.meta.url),'utf8');

/**
 * These anchors fail CI when the canonical Express contract changes.
 * The actual HTTP exercise is on the isolated NestJS preview only;
 * backend/server.mjs is intentionally not imported (it boots live cloud clients).
 */
test('canonical Express CORS and verified-email policies remain the comparison baseline',()=>{
 assert.ok(apiSource.includes("const origins=new Set((process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean))"));
 assert.ok(apiSource.includes("if(!origins.has(req.headers.origin))return res.status(403).json({error:'Origem não autorizada.'})"));
 assert.ok(apiSource.includes("'Access-Control-Allow-Headers':'Authorization, Content-Type, Idempotency-Key, X-LHS-Sandbox-Only'"));
 assert.ok(apiSource.includes("'Access-Control-Allow-Methods':'GET, POST, OPTIONS'"));
 assert.ok(apiSource.includes("if(req.method==='OPTIONS')return res.sendStatus(204)"));
 assert.ok(apiSource.includes("if(!req.authToken.email_verified)throw fault(403,'Confirme seu email antes de usar a nuvem.')"));
});

test('CORS and email guards reject before Firebase/quota and preserve exact HTTP headers',async()=>{
 const original=process.env.ALLOWED_ORIGINS;
 const originA='https://lhs.example.test';
 const originB='https://backup.example.test';
 process.env.ALLOWED_ORIGINS=originA+','+originB;
 const verifiedCalls=[];
 const reservations=[];
 const verifier={
  async verifyIdToken(token,checkRevoked){
   verifiedCalls.push({token,checkRevoked});
   assert.equal(checkRevoked,true);
   if(token==='verified')return {uid:'verified-uid',email_verified:true};
   if(token==='unverified')return {uid:'unverified-uid',email_verified:false};
   if(token==='missing-claim')return {uid:'missing-uid'};
   if(token==='wrong-type')return {uid:'wrong-uid',email_verified:'true'};
   throw new Error('PRIVATE firebase error text');
  }
 };
 const quota={
  async reserve(uid){
   reservations.push(uid);
  }
 };
 let app;
 try{
  app=await createPreviewApp(verifier,quota);
  await app.listen(0,'127.0.0.1');
  const address=app.getHttpServer().address();
  assert.ok(address&&typeof address==='object');
  const base='http://127.0.0.1:'+address.port;
  const path='/__nest_probe/limited';
  const authorization='Bearer verified';
  const get=(route,origin,token=authorization,method='GET')=>{
   const headers={};
   if(origin!==undefined)headers.Origin=origin;
   if(token!==undefined)headers.Authorization=token;
   return fetch(base+route,{method,headers});
  };

  // Exact, case-sensitive allowlist: no wildcard, suffix, port or trailing slash.
  for(const origin of [
   'https://evil.example.test','https://lhs.example.test.evil.test',
   'https://lhs.example.test:443','https://lhs.example.test/',
   'HTTPS://lhs.example.test','null','*','https://backup.example.test.evil.test'
  ]){
   const count=verifiedCalls.length;
   const reserveCount=reservations.length;
   const response=await get(path,origin);
   assert.equal(response.status,403,'rejected origin '+origin);
   assert.deepEqual(await response.json(),{error:'Origem não autorizada.'});
   assert.equal(response.headers.get('access-control-allow-origin'),null);
   assert.equal(response.headers.get('cache-control'),'no-store');
   assert.equal(response.headers.get('x-content-type-options'),'nosniff');
   assert.match(response.headers.get('x-lhs-trace-id')??'',/^[a-f0-9-]{36}$/);
   assert.equal(verifiedCalls.length,count,'CORS must block token verification');
   assert.equal(reservations.length,reserveCount,'CORS must block quota');
  }

  for(const origin of [originA,originB]){
   const response=await get(path,origin);
   assert.equal(response.status,200);
   assert.deepEqual(await response.json(),{allowed:true});
   assert.equal(response.headers.get('access-control-allow-origin'),origin);
   assert.equal(response.headers.get('vary'),'Origin');
   assert.equal(response.headers.get('access-control-allow-headers'),
    'Authorization, Content-Type, Idempotency-Key, X-LHS-Sandbox-Only');
   assert.equal(response.headers.get('access-control-allow-methods'),'GET, POST, OPTIONS');
   assert.equal(response.headers.get('access-control-allow-credentials'),null);
  }

  const noOrigin=await get('/__nest_probe/health',undefined,undefined);
  assert.equal(noOrigin.status,200);
  assert.equal(noOrigin.headers.get('access-control-allow-origin'),null);

  // All diagnostic routes terminate preflight before auth and quota.
  for(const route of ['health','auth','verified','limited']){
   const beforeAuth=verifiedCalls.length;
   const beforeQuota=reservations.length;
   const preflight=await get('/__nest_probe/'+route,originA,undefined,'OPTIONS');
   assert.equal(preflight.status,204,'OPTIONS '+route);
   assert.equal(preflight.headers.get('access-control-allow-origin'),originA);
   assert.equal(preflight.headers.get('access-control-allow-methods'),'GET, POST, OPTIONS');
   assert.equal(verifiedCalls.length,beforeAuth);
   assert.equal(reservations.length,beforeQuota);
  }
  const failedPreflight=await get(path,'https://evil.example.test',undefined,'OPTIONS');
  assert.equal(failedPreflight.status,403);
  assert.deepEqual(await failedPreflight.json(),{error:'Origem não autorizada.'});

  // Valid Firebase tokens may authenticate, but only boolean true passes email gate.
  for(const token of ['unverified','missing-claim','wrong-type']){
   const headers='Bearer '+token;
   const initial=await get('/__nest_probe/auth',originA,headers);
   assert.equal(initial.status,200,'auth-only token '+token);
   assert.deepEqual(await initial.json(),{authenticated:true});
   const before=reservations.length;
   for(const route of ['verified','limited']){
    const rejected=await get('/__nest_probe/'+route,originA,headers);
    assert.equal(rejected.status,403,'email gate '+token+' '+route);
    assert.deepEqual(await rejected.json(),
     {error:'Confirme seu email antes de usar a nuvem.'});
    assert.equal(rejected.headers.get('access-control-allow-origin'),originA);
   }
   const head=await get(path,originA,headers,'HEAD');
   assert.equal(head.status,403,'HEAD should not bypass email gate');
   assert.equal(reservations.length,before,'Unverified users cannot reserve quota');
  }

  const approved=await get('/__nest_probe/verified',originA);
  assert.equal(approved.status,200);
  assert.deepEqual(await approved.json(),{verified:true});
  const invalid=await get(path,originA,'Bearer revoked');
  assert.equal(invalid.status,401);
  assert.deepEqual(await invalid.json(),{error:'Sessão inválida ou expirada.'});
  assert.ok(verifiedCalls.every(x=>x.checkRevoked===true));
  assert.deepEqual(reservations,['verified-uid','verified-uid']);
 }finally{
  await app?.close();
  if(original===undefined)delete process.env.ALLOWED_ORIGINS;
  else process.env.ALLOWED_ORIGINS=original;
 }
});
