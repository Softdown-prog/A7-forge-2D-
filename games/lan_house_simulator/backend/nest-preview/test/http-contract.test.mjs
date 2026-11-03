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
 assert.match(no.headers.get('x-lhs-trace-id')??'',/^[a-f0-9-]{36}$/);
});

test('OPTIONS preflight exits early without invoking the controller',async()=>{
 const response=await fetch(base+'/__nest_probe/health',{method:'OPTIONS',
  headers:{origin:allowed,'access-control-request-method':'GET'}});
 assert.equal(response.status,204);
 assert.equal(response.headers.get('access-control-allow-origin'),allowed);
 assert.equal(response.headers.get('access-control-allow-methods'),'GET, POST, OPTIONS');
 assert.match(response.headers.get('x-lhs-trace-id')??'',/^[a-f0-9-]{36}$/);
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
