import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountClient} from '../website/account-client.mjs';
const config={apiUrl:'https://api.example',firebaseApiKey:'public-test-key'};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
function clientWith(handler){const calls=[];return {client:createAccountClient(config,{request:async(url,options)=>{calls.push({url,options});return handler(url,options);}}),calls};}
const loginData={idToken:'temporary-id-token',refreshToken:'temporary-refresh-token',email:'player@example.invalid'};
test('login checks email confirmation and sends passwords only to Firebase',async()=>{
 const {client,calls}=clientWith(url=>url.includes('signInWithPassword')?response(loginData):url.includes('lookup')?response({users:[{email:loginData.email,emailVerified:false}]}):response({cookiesBalance:0}));
 assert.equal((await client.signIn(loginData.email,'test-password')).emailVerified,false);
 await client.api('/v1/account');
 assert.equal(calls[0].url.startsWith('https://identitytoolkit.googleapis.com/'),true);
 assert.equal(calls[2].options.headers.Authorization,'Bearer temporary-id-token');assert.equal(calls[2].options.body,undefined);
 client.signOut();assert.equal(client.hasSession(),false);await assert.rejects(client.api('/v1/account'),error=>error.status===401);
});
test('an expired token is refreshed once before retrying the authorized request',async()=>{
 let attempts=0;
 const {client,calls}=clientWith(url=>{
  if(url.includes('signInWithPassword'))return response(loginData);
  if(url.includes('lookup'))return response({users:[{email:loginData.email,emailVerified:true}]});
  if(url.includes('securetoken'))return response({id_token:'fresh-token',refresh_token:'fresh-refresh'});
  return ++attempts===1?response({error:'Expired'},401):response({cookiesBalance:42});
 });
 await client.signIn(loginData.email,'test-password');assert.equal((await client.api('/v1/account')).cookiesBalance,42);
 assert.equal(calls.filter(c=>c.url.includes('securetoken')).length,1);assert.equal(calls.at(-1).options.headers.Authorization,'Bearer fresh-token');
});
test('save conflicts are exposed and never retried as uploads',async()=>{
 const {client,calls}=clientWith(url=>url.includes('signInWithPassword')?response(loginData):url.includes('lookup')?response({users:[{emailVerified:true}]}):response({error:'Outro dispositivo salvou primeiro.'},409));
 await client.signIn(loginData.email,'test-password');
 await assert.rejects(client.api('/v1/saves/main',{expectedRevision:'old',save:{}}),error=>error.status===409);
 assert.equal(calls.filter(c=>c.url.includes('/v1/saves/')).length,1);
});
test('signout while refresh is in flight cannot restore the session',async()=>{
 let finishRefresh,refreshStarted;const started=new Promise(resolve=>refreshStarted=resolve);
 const {client}=clientWith(url=>{
  if(url.includes('signInWithPassword'))return response(loginData);
  if(url.includes('lookup'))return response({users:[{emailVerified:true}]});
  if(url.includes('securetoken')){refreshStarted();return new Promise(resolve=>finishRefresh=()=>resolve(response({id_token:'late',refresh_token:'late'})));}
  return response({error:'Expired'},401);
 });
 await client.signIn(loginData.email,'test-password');const pending=client.api('/v1/account');await started;client.signOut();finishRefresh();await assert.rejects(pending);assert.equal(client.hasSession(),false);
});
test('a failed verification delivery retains a session so it can be resent',async()=>{
 let sends=0;const {client}=clientWith(url=>url.includes('signUp')?response(loginData):++sends===1?response({error:{message:'TOO_MANY_ATTEMPTS_TRY_LATER'}},400):response({}));
 await assert.rejects(client.signUp(loginData.email,'strong-test-password'));assert.equal(client.hasSession(),true);await client.sendVerification();assert.equal(sends,2);
});
test('password reset does not reveal nonexistent accounts; network failures remain visible',async()=>{
 const {client}=clientWith(()=>response({error:{message:'EMAIL_NOT_FOUND'}},400));await client.resetPassword('absent@example.invalid');
 const offline=createAccountClient(config,{request:()=>{throw Error('offline');}});await assert.rejects(offline.resetPassword(loginData.email),/Sem conexão/);
});
test('configuration cannot send credentials to an insecure backend',()=>{
 for(const apiUrl of ['http://api.example','https://user:pass@api.example','https://api.example/path','https://api.example/?token=x'])assert.throws(()=>createAccountClient({...config,apiUrl}));
});
