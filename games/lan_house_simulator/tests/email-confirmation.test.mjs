import test from 'node:test';
import assert from 'node:assert/strict';
import {captureConfirmationCode,confirmVerificationCode} from '../website/email-confirmation.mjs';
const config={enabled:true,firebaseApiKey:'site-public-key'},code='test-code-123456789';
test('personal action code is removed from the address bar before any network request',()=>{
 let replacement;const history={replaceState:(state,title,path)=>replacement=path};
 const result=captureConfirmationCode({pathname:'/conta/confirmar/',search:'?apiKey=ignored&continueUrl=https://untrusted.example',hash:'#codigo='+code},history);
 assert.equal(result,code);assert.equal(replacement,'/conta/confirmar/');
 for(const hash of ['','#codigo=short','#codigo='+code+'&codigo=second-code-12345','#codigo=%3Cscript%3E'])assert.equal(captureConfirmationCode({pathname:'/conta/confirmar/',search:'',hash},history),null);
});
test('confirmation uses the trusted public key and sends the code only in the provider POST body',async()=>{
 let call;assert.deepEqual(await confirmVerificationCode(code,config,{request:async(url,options)=>{call={url,options};return new Response('{}');}}),{confirmed:true});
 assert.equal(call.url,'https://identitytoolkit.googleapis.com/v1/accounts:update?key=site-public-key');assert.doesNotMatch(call.url,/test-code/);
 assert.equal(call.options.method,'POST');assert.equal(call.options.referrerPolicy,'origin');assert.deepEqual(JSON.parse(call.options.body),{oobCode:code});
});
test('expired and used links stop retrying; network or service failures permit retry without leaking provider details',async()=>{
 for(const message of ['EXPIRED_OOB_CODE','INVALID_OOB_CODE','USER_DISABLED'])await assert.rejects(confirmVerificationCode(code,config,{request:async()=>new Response(JSON.stringify({error:{message}}),{status:400})}),error=>error.retryable===false&&!error.message.includes(message));
 await assert.rejects(confirmVerificationCode(code,config,{request:async()=>{throw Error('secret internals');}}),/Confira sua conexão/);
 await assert.rejects(confirmVerificationCode(code,config,{request:async()=>new Response(JSON.stringify({error:{message:'private-error'}}),{status:503})}),error=>error.retryable!==false&&!error.message.includes('private-error'));
});
test('invalid codes never trigger a provider request',async()=>{
 let calls=0;await assert.rejects(confirmVerificationCode('<invalid>',config,{request:async()=>{calls++;}}));assert.equal(calls,0);
});
