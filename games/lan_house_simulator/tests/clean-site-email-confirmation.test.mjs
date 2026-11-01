import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {readFileSync} from 'node:fs';
const bundled=buildSync({entryPoints:[new URL('../frontend-angular/src/site-rewrite/email-confirmation-client.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const {captureConfirmationCode,confirmEmailCode}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const code='synthetic-email-code-12345678';
const config={enabled:true,apiUrl:'https://api.example.invalid',firebaseApiKey:'trusted-site-key'};
function capture(query='',hash=''){
 const url=new URL('https://site.example.invalid/conta/confirmar/'+query+hash);
 let replacement;
 const value=captureConfirmationCode(url,{replaceState(_state,_title,path){replacement=path;url.href=new URL(path,url).href;}});
 return {value,replacement,url};
}
test('capture snapshots a live Location and scrubs hash/query before async work',()=>{
 const r=capture('?continueUrl=https://attacker.invalid&apiKey=untrusted','#codigo='+code);
 assert.equal(r.value,code);assert.equal(r.replacement,'/conta/confirmar/');assert.equal(r.url.hash,'');assert.equal(r.url.search,'');
});
test('standard Firebase verifyEmail action ignores link key and redirect',()=>{
 assert.equal(capture('?mode=verifyEmail&oobCode='+code+'&apiKey=ignored&continueUrl=https://attacker.invalid').value,code);
});
for(const [query,hash] of [['',''],['','#codigo=short'],['','#codigo='+code+'&codigo='+code],['?mode=resetPassword&oobCode='+code,''],['?mode=verifyEmail&mode=verifyEmail&oobCode='+code,''],['?mode=verifyEmail&oobCode='+code+'&oobCode='+code,''],['?mode=verifyEmail&oobCode='+code,'#codigo='+code],['','#codigo=%3Cscript%3E'],['','#codigo='+'a'.repeat(1025)]])test('ambiguous, invalid and non-verification links cannot redeem',()=>assert.equal(capture(query,hash).value,null));
test('history failure propagates to the UI to refuse unsafe processing',()=>{
 assert.throws(()=>captureConfirmationCode({pathname:'/conta/confirmar/',hash:'#codigo='+code,search:''},{replaceState(){throw Error('denied');}}));
});
test('trusted provider only, POST body code, no credentials or redirects',async()=>{
 let call;
 await confirmEmailCode(code,config,async(url,init)=>{call={url,init};return new Response('{}');});
 assert.equal(call.url,'https://identitytoolkit.googleapis.com/v1/accounts:update?key=trusted-site-key');
 assert.equal(call.init.method,'POST');assert.equal(call.init.credentials,'omit');assert.equal(call.init.referrerPolicy,'origin');
 assert.deepEqual(JSON.parse(call.init.body),{oobCode:code});assert.ok(call.init.signal instanceof AbortSignal);
 assert.ok(!call.url.includes(code));assert.equal(call.init.headers.Authorization,undefined);
});
for(const reason of ['EXPIRED_OOB_CODE','INVALID_OOB_CODE','USER_DISABLED'])test(`permanent error ${reason} is safe and not retryable`,async()=>{
 await assert.rejects(confirmEmailCode(code,config,async()=>new Response(JSON.stringify({error:{message:reason}}),{status:400})),e=>e.retryable===false&&!e.message.includes(reason));
});
for(const kind of ['network','server','malformed'])test(`transient ${kind} preserves retry without leaking provider errors`,async()=>{
 await assert.rejects(confirmEmailCode(code,config,async()=>{
  if(kind==='network')throw Error('secret provider diagnostics');
  return new Response(kind==='server'?JSON.stringify({error:{message:'secret provider diagnostics'}}):'not-json',{status:503});
 }),e=>e.retryable===true&&!e.message.includes('secret'));
});
for(const raw of [{enabled:false},null,{enabled:true,apiUrl:'https://user:password@api.example',firebaseApiKey:'key'}])test('disabled or invalid configuration never calls Firebase',async()=>{
 let called=false;await assert.rejects(confirmEmailCode(code,raw,async()=>{called=true;}));assert.equal(called,false);
});
test('invalid code never calls provider; caller abort is composed',async()=>{
 let called=false;await assert.rejects(confirmEmailCode('short',config,async()=>{called=true;}));assert.equal(called,false);
 const controller=new AbortController();controller.abort();
 await assert.rejects(confirmEmailCode(code,config,async(_url,init)=>{assert.equal(init.signal.aborted,true);throw Error('aborted');},controller.signal),e=>e.retryable===true);
});
test('Angular owns the confirmation route, without legacy DOM owner or token storage',()=>{
 const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
 const owner=read('../frontend-angular/src/site-rewrite/email-confirmation.ts');
 const view=read('../frontend-angular/src/site-rewrite/email-confirmation.html');
 assert.match(read('../frontend-angular/src/site-rewrite/site-app.html'),/<lhs-email-confirmation>/);
 assert.match(view,/role="status"/);assert.match(view,/\[disabled\]="busy\(\)"/);
 assert.doesNotMatch(owner,/innerHTML|querySelector|sessionStorage|localStorage|website\/|console\./);
});
