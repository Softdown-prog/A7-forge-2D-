import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createVerificationEmail,authenticateAccount} from '../verification-email.mjs';

function fixture({request=async()=>new Response('{}'),dailyLimit=100}={}){
 let clock=1_800_000_000_000,queue=Promise.resolve();const rows=new Map(),calls=[];
 const db={collection:name=>({doc:id=>({path:name+'/'+id})}),runTransaction:fn=>{
  const pending=queue.then(async()=>{const writes=[];const result=await fn({getAll:async(...refs)=>refs.map(r=>({data:()=>rows.get(r.path)})),set:(r,data)=>writes.push([r.path,data])});for(const [key,data] of writes)rows.set(key,data);return result;});queue=pending.catch(()=>{});return pending;
 }};
 const user={uid:'player',email:'owner@example.invalid',emailVerified:false,disabled:false,providerData:[{providerId:'password'}]};
 const auth={getUser:async uid=>{assert.equal(uid,'player');return user;},generateEmailVerificationLink:async(email,settings)=>{assert.equal(email,user.email);assert.equal(settings.url,'https://lhs.example/conta/');return 'https://auth.example/action?oobCode=private-code&mode=verifyEmail';}};
 const send=createVerificationEmail({auth,db,apiKey:'test-secret',siteUrl:'https://lhs.example',dailyLimit,now:()=>clock,request:async(url,options)=>{calls.push({url,options});return request(url,options);}});
 return {send,user,rows,calls,advance:ms=>clock+=ms};
}

test('only the authenticated account receives the message; action codes stay in the email',async()=>{
 const f=fixture();assert.deepEqual(await f.send('player'),{sent:true});
 const {url,options}=f.calls[0],body=JSON.parse(options.body);
 assert.equal(url,'https://api.resend.com/emails');assert.deepEqual(body.to,['owner@example.invalid']);
 assert.equal(body.from,'LHS <contas@analysepro.com>');assert.match(body.html,/Confirmar meu email/);assert.match(body.html,/&amp;mode=verifyEmail/);
 assert.match(body.text,/private-code/);assert.equal(options.headers.Authorization,'Bearer test-secret');
 assert.doesNotMatch(JSON.stringify([...f.rows]),/owner@|private-code|test-secret/);
});
test('concurrent requests, hourly and daily quotas work across instances',async()=>{
 const f=fixture();const attempts=await Promise.allSettled([f.send('player'),f.send('player')]);
 assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.calls.length,1);
 for(let i=0;i<2;i++){f.advance(60_001);await f.send('player');}
 f.advance(60_001);await assert.rejects(f.send('player'),e=>e.status===429);
 f.advance(3_600_000);for(let i=0;i<3;i++){await f.send('player');f.advance(60_001);}
 f.advance(3_600_000);await assert.rejects(f.send('player'),e=>e.status===429);
});
test('the global daily budget prevents uncontrolled signup email costs',async()=>{
 const f=fixture({dailyLimit:1});await f.send('player');f.advance(60_001);f.user.email='another@example.invalid';
 await assert.rejects(f.send('player'),e=>e.status===503);assert.equal(f.calls.length,1);
 f.advance(86_400_000);await f.send('player');assert.equal(f.calls.length,2);
});
test('disabled, missing-email and non-password accounts cannot send; verified accounts need no email',async()=>{
 for(const change of [{disabled:true},{email:undefined},{providerData:[]}]){const f=fixture();Object.assign(f.user,change);await assert.rejects(f.send('player'),e=>e.status===403);assert.equal(f.calls.length,0);}
 const f=fixture();f.user.emailVerified=true;assert.deepEqual(await f.send('player'),{alreadyVerified:true});assert.equal(f.rows.size,0);
});
test('provider failures never leak secrets or succeed silently; retry respects cooldown',async()=>{
 let attempt=0;const f=fixture({request:async()=>{if(++attempt===1)throw Error('private-code test-secret');return new Response('{}');}});
 await assert.rejects(f.send('player'),e=>e.status===502&&!/test-secret|private-code/.test(e.message));
 await assert.rejects(f.send('player'),e=>e.status===429);f.advance(60_001);assert.deepEqual(await f.send('player'),{sent:true});
 const rejected=fixture({request:async()=>new Response('provider internal details',{status:403})});await assert.rejects(rejected.send('player'),e=>e.status===502&&!/internal/.test(e.message));
});
test('authentication rejects missing, expired and revoked tokens before sending',async()=>{
 let called=0;const middleware=authenticateAccount({verifyIdToken:async(token,revoked)=>{assert.equal(revoked,true);if(token!=='valid')throw Error('expired');return {uid:'player',email_verified:false};}});
 for(const authorization of [undefined,'Basic valid','Bearer expired']){
  await middleware({headers:{authorization}},null,error=>{assert.equal(error.status,401);called++;});
 }
 const req={headers:{authorization:'Bearer valid'}};await middleware(req,null,error=>assert.equal(error,undefined));assert.equal(req.uid,'player');assert.equal(req.authToken.email_verified,false);assert.equal(called,3);
});
test('the verification route accepts unverified identity but other account routes remain restricted',async()=>{
 const app=express();let sentTo;app.use(express.json());
 app.use('/v1',authenticateAccount({verifyIdToken:async()=>({uid:'player',email_verified:false})}));
 app.post('/v1/auth/verification-email',(req,res)=>{sentTo=req.uid;res.json({sent:true});});
 app.use('/v1',(req,res,next)=>req.authToken.email_verified?next():res.sendStatus(403));app.get('/v1/account',(req,res)=>res.json({}));
 app.use((error,req,res,next)=>res.sendStatus(error.status||500));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 try{
  const base=`http://127.0.0.1:${server.address().port}`,headers={Authorization:'Bearer valid','Content-Type':'application/json'};
  assert.equal((await fetch(base+'/v1/auth/verification-email',{method:'POST',headers,body:JSON.stringify({email:'attacker@example.invalid',uid:'other'})})).status,200);assert.equal(sentTo,'player');
  assert.equal((await fetch(base+'/v1/account',{headers})).status,403);
  assert.equal((await fetch(base+'/v1/auth/verification-email',{method:'POST'})).status,401);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
