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

test('Resend confirmation uses an authenticated backend request without a supplied recipient',async()=>{
 const calls=[];const client=createAccountClient({...config,verificationEmailProvider:'auto'},{request:async(url,options)=>{
  calls.push({url,options});return url.includes('signUp')?response(loginData):url.endsWith('/v1/config')?response({verificationEmailProvider:'resend'}):response({sent:true});
 }});
 await client.signUp(loginData.email,'strong-test-password');
 assert.equal(calls.at(-1).url,'https://api.example/v1/auth/verification-email');assert.equal(calls.at(-1).options.headers.Authorization,'Bearer temporary-id-token');assert.equal(calls.at(-1).options.body,'{}');
 assert.equal(calls.some(c=>c.url.includes('sendOobCode')),false);
});
test('automatic provider selection keeps existing Firebase delivery until Resend is enabled',async()=>{
 const calls=[];const client=createAccountClient({...config,verificationEmailProvider:'auto'},{request:async(url,options)=>{calls.push({url,options});return url.includes('signUp')?response(loginData):url.endsWith('/v1/config')?response({verificationEmailProvider:'firebase'}):response({});}});
 await client.signUp(loginData.email,'strong-test-password');assert.equal(calls.at(-1).url.includes('sendOobCode'),true);
});

function tabStorage(){const values=new Map([['lhs-save-v1','local-save']]);return {values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
test('login survives navigation to Donate and is revalidated before checkout without storing the password',async()=>{
 const storage=tabStorage(),calls=[];const request=async(url,options)=>{
  calls.push({url,options});if(url.includes('signInWithPassword'))return response(loginData);
  if(url.includes('securetoken'))return response({id_token:'restored-token',refresh_token:'rotated-refresh'});
  if(url.includes('lookup'))return response({users:[{email:loginData.email,emailVerified:true}]});
  return response({id:'order',url:'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=test'});
 };
 const account=createAccountClient(config,{request,storage});await account.signIn(loginData.email,'must-not-be-stored');
 assert.doesNotMatch(JSON.stringify([...storage.values]),/must-not-be-stored/);
 const donate=createAccountClient(config,{request,storage});assert.equal(donate.hasSession(),true);assert.equal((await donate.restore()).emailVerified,true);
 await donate.api('/v1/orders',{packageId:'donate-5',acceptedTerms:true});assert.equal(calls.at(-1).options.headers.Authorization,'Bearer restored-token');
 assert.equal(calls.filter(c=>c.url.includes('signInWithPassword')).length,1);
 donate.signOut();assert.equal(createAccountClient(config,{storage}).hasSession(),false);assert.equal(storage.values.get('lhs-save-v1'),'local-save');
});
test('expired, malformed and wrong-project sessions cannot resume',async()=>{
 const storage=tabStorage();let clock=1000;const request=async url=>url.includes('signInWithPassword')?response(loginData):response({users:[{emailVerified:true}]});
 const c=createAccountClient(config,{storage,request,now:()=>clock});await c.signIn(loginData.email,'test');
 const stored=storage.values.get('lhs.account.session.v1');clock+=8*60*60*1000;
 await assert.rejects(c.api('/v1/orders',{}),error=>error.status===401);assert.equal(c.hasSession(),false);
 storage.setItem('lhs.account.session.v1',stored);assert.equal(createAccountClient(config,{storage,now:()=>clock}).hasSession(),false);
 storage.setItem('lhs.account.session.v1',stored);assert.equal(createAccountClient({...config,firebaseApiKey:'another-project'},{storage,now:()=>1000}).hasSession(),false);
 storage.setItem('lhs.account.session.v1','{invalid');assert.equal(createAccountClient(config,{storage}).hasSession(),false);
 assert.equal(storage.values.get('lhs-save-v1'),'local-save');
});
test('revoked saved sessions clear on restore; blocked browser storage still permits login in the current page',async()=>{
 const storage=tabStorage();const request=async url=>url.includes('signInWithPassword')?response(loginData):url.includes('securetoken')?response({error:{message:'INVALID_REFRESH_TOKEN'}},400):response({users:[{emailVerified:true}]});
 await createAccountClient(config,{storage,request}).signIn(loginData.email,'test');const next=createAccountClient(config,{storage,request});await assert.rejects(next.restore(),error=>error.status===401);assert.equal(next.hasSession(),false);assert.equal(storage.values.has('lhs.account.session.v1'),false);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
 const c=createAccountClient(config,{storage:blocked,request});await c.signIn(loginData.email,'test');assert.equal(c.hasSession(),true);c.signOut();assert.equal(c.hasSession(),false);
});
test('signout during saved-session restore cannot persist late refresh credentials',async()=>{
 const storage=tabStorage();let complete;
 const request=async url=>url.includes('signInWithPassword')?response(loginData):url.includes('securetoken')?new Promise(resolve=>complete=()=>resolve(response({id_token:'late-token',refresh_token:'late-refresh'}))):response({users:[{emailVerified:true}]});
 await createAccountClient(config,{storage,request}).signIn(loginData.email,'test');const c=createAccountClient(config,{storage,request});const pending=c.restore();c.signOut();complete();await assert.rejects(pending);assert.equal(c.hasSession(),false);assert.equal(storage.values.has('lhs.account.session.v1'),false);
});
