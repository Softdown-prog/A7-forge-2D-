import test from 'node:test';
import assert from 'node:assert/strict';
import {assertLocalFirestoreEmulatorAllowed,openLocalFirestoreQuota}
 from '../dist/emulator-firestore.js';

test('Firestore emulator guard blocks production, remote hosts and live credentials',async()=>{
 const before={...process.env};
 try{
  delete process.env.LHS_NEST_EMULATOR_ENABLED;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  assert.throws(()=>assertLocalFirestoreEmulatorAllowed(),/explicit test opt-in/);
  await assert.rejects(openLocalFirestoreQuota(),/explicit test opt-in/);
  process.env.LHS_NEST_EMULATOR_ENABLED='1';
  for(const host of ['','localhost:8088','0.0.0.0:8088','192.168.0.1:8088',
   'https://127.0.0.1:8088','127.0.0.1:0','127.0.0.1:65536']){
   process.env.FIRESTORE_EMULATOR_HOST=host;
   assert.throws(()=>assertLocalFirestoreEmulatorAllowed(),/local loopback/,host);
  }
  process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8088';
  assert.doesNotThrow(()=>assertLocalFirestoreEmulatorAllowed());
  process.env.GOOGLE_APPLICATION_CREDENTIALS='/secrets/production.json';
  assert.throws(()=>assertLocalFirestoreEmulatorAllowed(),/credentials are forbidden/);
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  process.env.NODE_ENV='production';
  assert.throws(()=>assertLocalFirestoreEmulatorAllowed(),/disabled in production/);
 }finally{
  for(const key of ['LHS_NEST_EMULATOR_ENABLED','FIRESTORE_EMULATOR_HOST',
   'GOOGLE_APPLICATION_CREDENTIALS','NODE_ENV']){
   if(before[key]===undefined)delete process.env[key];
   else process.env[key]=before[key];
  }
 }
});

test('default NestJS app still boots without any Firebase SDK connection',async()=>{
 const {createPreviewApp}=await import('../dist/bootstrap.js');
 const app=await createPreviewApp();
 try{assert.equal(app.getHttpAdapter().getType(),'express');}
 finally{await app.close();}
});
