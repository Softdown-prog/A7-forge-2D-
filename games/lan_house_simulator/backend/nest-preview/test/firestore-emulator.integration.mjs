import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewApp} from '../dist/bootstrap.js';
import {openLocalFirestoreQuota} from '../dist/emulator-firestore.js';

let connection,app,url;
let now=1_800_000_000_000;
const verifier={
 async verifyIdToken(token,revoked){
  assert.equal(revoked,true);
  if(token==='alice')return {uid:'emulator-alice',email_verified:true};
  if(token==='bob')return {uid:'emulator-bob',email_verified:true};
  if(token==='unverified')return {uid:'emulator-unverified',email_verified:false};
  throw new Error('Expired fake token');
 }
};
before(async()=>{
 connection=await openLocalFirestoreQuota(()=>now);
 app=await createPreviewApp(verifier,connection.quota);
 await app.listen(0,'127.0.0.1');
 const address=app.getHttpServer().address();
 assert.ok(address&&typeof address==='object');
 url='http://127.0.0.1:'+address.port+'/__nest_probe/limited';
});
after(async()=>{
 await app?.close();
 await connection?.close();
});
const call=token=>fetch(url,{headers:token?{Authorization:'Bearer '+token}:{}});

test('real Firestore emulator stores the quota and 30/min cutoff with TTL and UID isolation',async()=>{
 for(let i=0;i<30;i++){
  const response=await call('alice');
  assert.equal(response.status,200,'Accepted request '+(i+1));
  assert.deepEqual(await response.json(),{allowed:true});
 }
 const exceeded=await call('alice');
 assert.equal(exceeded.status,429);
 assert.deepEqual(await exceeded.json(),
  {error:'Muitas solicitações. Tente novamente em um minuto.'});
 const a=await connection.firestore.collection('rateLimits').doc('emulator-alice').get();
 assert.equal(a.exists,true);
 assert.equal(a.data()?.count,30);
 assert.equal(a.data()?.window,Math.floor(now/60_000));
 assert.equal(a.data()?.expiresAt.toDate().getTime(),now+120_000);

 assert.equal((await call('bob')).status,200);
 const b=await connection.firestore.collection('rateLimits').doc('emulator-bob').get();
 assert.equal(b.data()?.count,1);
 assert.equal((await call('unverified')).status,403);
 const missing=await connection.firestore.collection('rateLimits')
  .doc('emulator-unverified').get();
 assert.equal(missing.exists,false);
 assert.equal((await call()).status,401);

 now+=60_000;
 assert.equal((await call('alice')).status,200);
 const reset=await connection.firestore.collection('rateLimits').doc('emulator-alice').get();
 assert.equal(reset.data()?.count,1);
 assert.equal(reset.data()?.expiresAt.toDate().getTime(),now+120_000);
});

test('emulator activation does not create accounts, saves or payment endpoints',async()=>{
 const origin=new URL(url).origin;
 for(const [method,path] of [
  ['GET','/v1/account'],['POST','/v1/orders'],['POST','/webhooks/mercadopago']
 ])assert.equal((await fetch(origin+path,{method})).status,404);
});
