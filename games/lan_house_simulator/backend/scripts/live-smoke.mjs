import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {createGame} from '../../dist/js/sim/engine.js';
import {serializeSave} from '../../dist/js/sim/saveTransfer.js';
const project='loyal-road-395203',database='lhs-game',bucket='loyal-road-395203-lhs-saves';
const base=process.env.LHS_TEST_API_URL,apiKey=process.env.LHS_TEST_API_KEY,access=process.env.LHS_TEST_ACCESS_TOKEN;
if(!base||!apiKey||!access)throw Error('Configure LHS_TEST_API_URL, LHS_TEST_API_KEY e LHS_TEST_ACCESS_TOKEN em memória.');
const adminHeaders={Authorization:`Bearer ${access}`,'x-goog-user-project':project,'Content-Type':'application/json'};
const users=[],objects=new Set();let cleanupErrors=0;
const documents=`https://firestore.googleapis.com/v1/projects/${project}/databases/${database}/documents`;
async function request(url,options={}){return fetch(url,{...options,signal:AbortSignal.timeout(45_000)});}
async function admin(url,method='POST',body){const r=await request(url,{method,headers:adminHeaders,...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(`Admin request failed: HTTP ${r.status} ${new URL(url).pathname}`);return r.status===204?{}:r.json();}
async function createUser(verified=true){
 const uid='lhs-smoke-'+randomUUID(),email=uid+'@example.invalid',password=randomBytes(32).toString('base64url');
 await admin(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts?key=${apiKey}`,'POST',{localId:uid,email,password,emailVerified:verified,displayName:'LHS temporary integration test'});users.push(uid);
 const response=await request(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});assert.equal(response.status,200,'test user login');const result=await response.json();return {uid,token:result.idToken};
}
async function api(user,path,body){const response=await request(base+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${user.token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();return {status:response.status,...result};}
function track(uid,result){if(result.revision)objects.add(`users/${uid}/slots/main/${result.revision}.json`);}
try {
 assert.equal((await request(base+'/v1/config')).status,200);assert.equal((await request(base+'/v1/account')).status,401);
 const owner=await createUser(),other=await createUser(),unverified=await createUser(false);
 assert.equal((await api(unverified,'/v1/account')).status,403,'unverified emails rejected');
 assert.equal((await api(owner,'/v1/account')).cookiesBalance,0);assert.equal((await api(other,'/v1/account')).cookiesBalance,0);
 assert.equal((await api(owner,'/v1/saves/main')).save,null);
 const state=createGame(72421,'historical'),first=JSON.parse(serializeSave(state));
 const saved1=await api(owner,'/v1/saves/main',{expectedRevision:null,save:first});assert.equal(saved1.status,200,'first save');track(owner.uid,saved1);
 assert.equal((await api(other,'/v1/saves/main')).save,null,'UID isolation');
 const own2=await api(other,'/v1/saves/main',{expectedRevision:null,save:first,uid:owner.uid});assert.equal(own2.status,200);track(other.uid,own2);
 assert.equal((await api(owner,'/v1/saves/main')).revision,saved1.revision,'caller cannot choose another UID');
 state.cash+=123;const second=JSON.parse(serializeSave(state));
 const saved2=await api(owner,'/v1/saves/main',{expectedRevision:saved1.revision,save:second});assert.equal(saved2.status,200);track(owner.uid,saved2);
 assert.equal((await api(owner,'/v1/saves/main?backup=true')).save.state.cash,first.state.cash,'rotating backup');
 assert.equal((await api(owner,'/v1/saves/main',{expectedRevision:saved1.revision,save:first})).status,409,'stale revision blocked');
 const concurrent=await Promise.all([api(owner,'/v1/saves/main',{expectedRevision:saved2.revision,save:first}),api(owner,'/v1/saves/main',{expectedRevision:saved2.revision,save:second})]);
 assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409],'one concurrent save wins');for(const item of concurrent)track(owner.uid,item);
 const current=await api(owner,'/v1/saves/main');assert.equal(current.status,200);assert.equal((await api(owner,'/v1/saves/main?backup=true')).save.state.cash,second.state.cash);
 assert.equal((await api(owner,'/v1/saves/main',{expectedRevision:current.revision,save:{format:'forged'}})).status,400,'invalid format rejected');
 assert.equal((await api(owner,'/v1/saves/main',{save:first})).status,400,'missing revision rejected');
 const forged=structuredClone(first);forged.state.cookiesBalance=999999;
 const savedForged=await api(owner,'/v1/saves/main',{expectedRevision:current.revision,save:forged});assert.equal(savedForged.status,200);track(owner.uid,savedForged);
 assert.equal((await api(owner,'/v1/account')).cookiesBalance,0,'save cannot grant premium currency');
 assert.equal((await api(owner,'/v1/orders',{packageId:'not-approved'})).status,503,'payments disabled');
 const slot=await admin(`${documents}/accounts/${owner.uid}/slots/main`,'GET');assert.equal(Object.hasOwn(slot.fields,'save'),false,'Firestore only stores metadata');
 const object=slot.fields.main.mapValue.fields.object.stringValue;objects.add(object);
 assert.ok(object.startsWith(`users/${owner.uid}/slots/main/`));
 assert.equal((await request(`https://storage.googleapis.com/${bucket}/${object}`)).status,403,'GCS object private');
 assert.equal((await request(`${documents}/accounts/${owner.uid}`,{headers:{Authorization:`Bearer ${owner.token}`}})).status,403,'direct Firestore client access denied');
 console.log(JSON.stringify({result:'PASS',checks:['auth','verified-email','uid-isolation','manual-save','load','backup','concurrent-conflict','schema','no-premium-from-save','private-gcs','firestore-client-denied','payments-disabled']}));
} finally {
 for(const uid of users){
  if(!/^lhs-smoke-[a-f0-9-]+$/.test(uid))throw Error('Unsafe cleanup UID');
  // List only this run\'s temporary user prefix, including objects from timed-out writes.
  const listing=await request(`https://storage.googleapis.com/storage/v1/b/${bucket}/o?prefix=${encodeURIComponent(`users/${uid}/slots/main/`)}`,{headers:adminHeaders}).catch(()=>null);
  if(listing?.ok)for(const item of (await listing.json()).items||[])objects.add(item.name);
 }
 for(const object of objects){if(!users.some(uid=>object.startsWith(`users/${uid}/slots/main/`)))throw Error('Unsafe cleanup object');const r=await request(`https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(object)}`,{method:'DELETE',headers:adminHeaders}).catch(()=>null);if(r&&!r.ok&&r.status!==404)cleanupErrors++;}
 for(const uid of users){
  for(const path of [`accounts/${uid}/slots/main`,`accounts/${uid}`,`rateLimits/${uid}`]){const r=await request(`${documents}/${path}`,{method:'DELETE',headers:adminHeaders}).catch(()=>null);if(!r||(!r.ok&&r.status!==404))cleanupErrors++;}
  try{await admin(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:delete`,'POST',{localId:uid});}catch{cleanupErrors++;}
 }
 console.log(JSON.stringify({cleanup:cleanupErrors?'REQUIRES_ATTENTION':'PASS',temporaryUsers:users.length}));if(cleanupErrors)process.exitCode=1;
}
