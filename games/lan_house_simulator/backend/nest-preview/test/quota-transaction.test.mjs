import test from 'node:test';
import assert from 'node:assert/strict';
import {createTransactionalUserQuota,QuotaExceededError} from '../dist/user-quota.js';

test('quota adapters share a fixed-minute transactional store across app instances',async()=>{
 const rows=new Map();
 let active=Promise.resolve();
 const db={
  collection:name=>({doc:uid=>({path:name+'/'+uid})}),
  runTransaction:fn=>{
   const work=active.then(async()=>{
    const writes=[];
    const result=await fn({
     get:async ref=>({data:()=>structuredClone(rows.get(ref.path))}),
     set:(ref,data)=>writes.push([ref.path,data])
    });
    for(const [path,value] of writes)rows.set(path,value);
    return result;
   });
   active=work.catch(()=>{});
   return work;
  }
 };
 let time=1_800_000_000_000;
 const a=createTransactionalUserQuota(db,()=>time);
 const b=createTransactionalUserQuota(db,()=>time);
 const attempts=await Promise.allSettled(
  Array.from({length:31},(_,i)=>(i%2?a:b).reserve('uid-1'))
 );
 assert.equal(attempts.filter(x=>x.status==='fulfilled').length,30);
 const denied=attempts.filter(x=>x.status==='rejected');
 assert.equal(denied.length,1);
 assert.ok(denied[0].reason instanceof QuotaExceededError);
 assert.equal(rows.get('rateLimits/uid-1').count,30);
 assert.equal(rows.get('rateLimits/uid-1').expiresAt.getTime(),time+120_000);

 await b.reserve('uid-2');
 assert.equal(rows.get('rateLimits/uid-2').count,1);
 time+=60_000;
 await a.reserve('uid-1');
 assert.equal(rows.get('rateLimits/uid-1').count,1);
 assert.equal(rows.get('rateLimits/uid-1').window,Math.floor(time/60_000));
});

test('invalid UID, corrupt counter and unavailable storage never allow traffic',async()=>{
 const rows=new Map([['rateLimits/u',{window:30_000,count:-1}]]);
 const db={
  collection:name=>({doc:uid=>({path:name+'/'+uid})}),
  runTransaction:fn=>fn({
   get:async ref=>({data:()=>rows.get(ref.path)}),
   set:()=>{throw new Error('A corrupt transaction should not commit');}
  })
 };
 const quota=createTransactionalUserQuota(db,()=>30_000*60_000);
 await assert.rejects(quota.reserve('u'),/Corrupt quota state/);
 await assert.rejects(quota.reserve(''),/Verified UID required/);
 const badClock=createTransactionalUserQuota(db,()=>Number.NaN);
 await assert.rejects(badClock.reserve('u'),/Invalid quota clock/);
 const offline=createTransactionalUserQuota({
  collection:()=>({doc:()=>({path:'rateLimits/u'})}),
  runTransaction:async()=>{throw new Error('Firestore unavailable');}
 });
 await assert.rejects(offline.reserve('u'),/Firestore unavailable/);
});
