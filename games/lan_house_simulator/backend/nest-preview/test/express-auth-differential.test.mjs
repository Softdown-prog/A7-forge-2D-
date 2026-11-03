import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {authenticateAccount} from '../../verification-email.mjs';
import {createPreviewApp} from '../dist/bootstrap.js';

/**
 * Differential HTTP tests: execute the ACTUAL exported Express auth middleware
 * and the real isolated NestJS app on separate loopback sockets.
 * Both use deterministic fake token verifiers; no Firebase project is contacted.
 * Only the authentication gate is compared, not the full /v1 business pipeline.
 */
test('canonical Express Firebase authentication and NestJS preview agree on HTTP contracts',async()=>{
 const expressCalls=[];
 const nestCalls=[];
 const fake=calls=>({
  async verifyIdToken(token,checkRevoked){
   calls.push({token,checkRevoked});
   assert.equal(checkRevoked,true);
   if(token==='active')return {uid:'test-uid',email_verified:true};
   if(token==='unverified')return {uid:'test-uid',email_verified:false};
   if(token==='revoked')throw new Error('private Firebase provider detail');
   if(token==='expired')throw new Error('expired private provider detail');
   throw new Error('invalid Firebase token');
  }
 });
 const expressApp=express();
 expressApp.disable('x-powered-by');
 expressApp.get('/test-auth',authenticateAccount(fake(expressCalls)),
  (_request,response)=>response.json({authenticated:true}));
 // The canonical error-response mapping in backend/server.mjs.
 expressApp.use((error,_request,response,_next)=>{
  const status=error.status||500;
  response.status(status).json({
   error:status>=500?'Serviço temporariamente indisponível.':error.message
  });
 });
 const server=await new Promise((resolve,reject)=>{
  const running=expressApp.listen(0,'127.0.0.1');
  running.once('listening',()=>resolve(running));
  running.once('error',reject);
 });
 let nest;
 try{
  nest=await createPreviewApp(fake(nestCalls));
  await nest.listen(0,'127.0.0.1');
  const ea=server.address();
  const na=nest.getHttpServer().address();
  assert.ok(ea&&typeof ea==='object');
  assert.ok(na&&typeof na==='object');
  const expressUrl='http://127.0.0.1:'+ea.port+'/test-auth';
  const nestUrl='http://127.0.0.1:'+na.port+'/__nest_probe/auth';
  const scenarios=[
   ['no Authorization header',undefined,401,'Entre na conta para usar a nuvem.'],
   ['Basic authorization','Basic active',401,'Entre na conta para usar a nuvem.'],
   ['lowercase bearer','bearer active',401,'Entre na conta para usar a nuvem.'],
   ['double space','Bearer  active',401,'Entre na conta para usar a nuvem.'],
   ['missing token','Bearer',401,'Entre na conta para usar a nuvem.'],
   ['expired token','Bearer expired',401,'Sessão inválida ou expirada.'],
   ['revoked token','Bearer revoked',401,'Sessão inválida ou expirada.'],
   ['unverified but valid token','Bearer unverified',200,null],
   ['verified token','Bearer active',200,null]
  ];
  for(const [name,authorization,status,error] of scenarios){
   const options={headers:authorization?{Authorization:authorization}:{}};
   const [actualExpress,actualNest]=await Promise.all([
    fetch(expressUrl,options),fetch(nestUrl,options)
   ]);
   assert.equal(actualExpress.status,status,'Express: '+name);
   assert.equal(actualNest.status,status,'NestJS: '+name);
   const [expressBody,nestBody]=await Promise.all([
    actualExpress.json(),actualNest.json()
   ]);
   const expected=error?{error}:{authenticated:true};
   assert.deepEqual(expressBody,expected,'Express response: '+name);
   assert.deepEqual(nestBody,expected,'NestJS response: '+name);
   assert.equal(actualExpress.headers.get('x-powered-by'),null);
   assert.equal(actualNest.headers.get('x-powered-by'),null);
   assert.doesNotMatch(JSON.stringify([expressBody,nestBody]),
    /test-uid|private Firebase|expired private|Bearer active/);
  }
  assert.deepEqual(expressCalls,nestCalls);
  assert.equal(expressCalls.length,4,'only four valid Bearer headers reach verification');
  assert.ok(expressCalls.every(call=>call.checkRevoked===true));
 }finally{
  await nest?.close();
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
