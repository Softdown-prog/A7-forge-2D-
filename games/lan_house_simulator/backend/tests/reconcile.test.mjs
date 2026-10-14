import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Storage} from '@google-cloud/storage';
import {reconcileSaves} from '../reconcile-saves.mjs';

const now=Date.parse('2026-10-14T18:00:00Z');
const old=new Date(now-48*60*60*1000).toISOString();
const recent=new Date(now-60_000).toISOString();
const object=(n,metadata={})=>({name:`users/owner/slots/main/00000000-0000-4000-8000-${String(n).padStart(12,'0')}.json`,metadata:{timeCreated:old,updated:old,generation:'12345678901234567',...metadata}});
function setup(files,read=()=>undefined,deleteError){
 const deletes=[],queries=[];let reads=0;
 const bucket={
  async getFiles(query){queries.push(query);const start=Number(query.pageToken||0),end=start+query.maxResults;return [files.slice(start,end),end<files.length?{pageToken:String(end)}:null];},
  file(name,options){return {async delete(){deletes.push({name,options});if(deleteError)throw deleteError;}};}
 };
 const db={collection(name){assert.equal(name,'accounts');return {doc(uid){assert.equal(uid,'owner');return {collection(name){assert.equal(name,'slots');return {doc(name){assert.equal(name,'main');return {async get(){const data=await read(++reads);return {exists:data!==undefined,data:()=>data};}};}};}};}};}};
 return {bucket,db,deletes,queries};
}
test('protects main, backup, recent, replaced and unknown objects; dry-run does not delete',async()=>{
 const main=object(1),backup=object(2),orphan=object(3);
 const fixture=setup([main,backup,orphan,object(4,{timeCreated:recent}),object(5,{updated:recent}),{...object(6),name:'users/owner/unknown.json'},object(7,{generation:undefined})],()=>({main:{object:main.name},backup:{object:backup.name}}));
 const result=await reconcileSaves({...fixture,now});
 assert.deepEqual({candidates:result.candidates,referenced:result.referenced,recent:result.recent,unsafe:result.unsafe,deleted:result.deleted},{candidates:1,referenced:2,recent:2,unsafe:2,deleted:0});
 assert.deepEqual(fixture.deletes,[]);
});
test('apply rechecks pointers for every object and preserves generation as a string',async()=>{
 const first=object(1),second=object(2);
 const fixture=setup([first,second],n=>n===1?undefined:{main:{object:second.name}});
 const result=await reconcileSaves({...fixture,now,apply:true});
 assert.equal(result.deleted,1);assert.equal(result.referenced,1);
 assert.deepEqual(fixture.deletes,[{name:first.name,options:{preconditionOpts:{ifGenerationMatch:'12345678901234567'}}}]);
});
test('metadata errors abort; malformed pointers fail closed',async()=>{
 const denied=setup([object(1)],()=>{throw Error('denied');});
 await assert.rejects(reconcileSaves({...denied,now,apply:true}),/denied/);assert.equal(denied.deletes.length,0);
 for(const slot of [{},{main:{object:42}},{main:{object:''}},{main:{object:object(2).name},backup:{}},{main:{object:object(2).name.replace('/owner/','/other/')}}]){
  const fixture=setup([object(1)],()=>slot);const result=await reconcileSaves({...fixture,now,apply:true});assert.equal(result.unsafe,1);assert.equal(fixture.deletes.length,0);
 }
});
test('pagination is bounded and returns a continuation token',async()=>{
 const fixture=setup(Array.from({length:140},(_,n)=>object(n)));
 const result=await reconcileSaves({...fixture,now,maxObjects:110});
 assert.equal(result.scanned,110);assert.equal(result.nextPageToken,'110');
 assert.deepEqual(fixture.queries.map(q=>q.maxResults),[100,10]);
 const next=await reconcileSaves({...fixture,now,maxObjects:110,pageToken:result.nextPageToken});assert.equal(next.scanned,30);assert.equal(next.nextPageToken,null);
});
test('concurrent replacement or removal is skipped; other deletion failures abort',async()=>{
 for(const code of [404,412]){const fixture=setup([object(1)],undefined,{code});const result=await reconcileSaves({...fixture,now,apply:true});assert.equal(result.deleted,0);assert.equal(result.changed,1);}
 const fixture=setup([object(1)],undefined,{code:403});await assert.rejects(reconcileSaves({...fixture,now,apply:true}));
});
test('minimum age is strictly greater than 24h and bounds cannot be disabled',async()=>{
 const fixture=setup([object(1,{timeCreated:new Date(now-24*60*60*1000).toISOString()})]);assert.equal((await reconcileSaves({...fixture,now,apply:true})).recent,1);
 for(const maxObjects of [0,-1,Infinity,5001])await assert.rejects(reconcileSaves({...fixture,now,maxObjects}));
});
test('Storage SDK sends the exact generation precondition on the deletion request',async t=>{
 let received;
 const server=createServer((req,res)=>{received={method:req.method,url:new URL(req.url,'http://test')};res.writeHead(204);res.end();});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const storage=new Storage({projectId:'lhs-test',apiEndpoint:`http://127.0.0.1:${server.address().port}`,useAuthWithCustomEndpoint:false,retryOptions:{autoRetry:false}});
 const sdkBucket=storage.bucket('lhs-test-private');
 const fixture=setup([object(1)]);
 fixture.bucket.file=sdkBucket.file.bind(sdkBucket);
 assert.equal((await reconcileSaves({...fixture,now,apply:true})).deleted,1);
 assert.equal(received.method,'DELETE');
 assert.equal(received.url.searchParams.get('ifGenerationMatch'),'12345678901234567');
});
