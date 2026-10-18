import {createHash} from 'node:crypto';
import {fault} from './domain.mjs';
import {brandedVerificationLink,verificationEmailTemplate} from './verification-email-template.mjs';

// The recipient comes exclusively from Firebase, never from the request body.
// Quotas are reserved atomically before contacting either external provider.
export function createVerificationEmail({auth,db,apiKey,siteUrl,from='LHS <contas@lhs.analysepro.com>',replyTo='softloady@gmail.com',dailyLimit=100,request=fetch,now=Date.now}){
 const site=new URL(siteUrl);
 if(site.protocol!=='https:'||site.username||site.password||site.search||site.hash||site.pathname!=='/')throw Error('URL de confirmação inválida.');
 if(!apiKey||!Number.isSafeInteger(dailyLimit)||dailyLimit<1)throw Error('Configuração de email inválida.');
 return async uid=>{
  const user=await auth.getUser(uid);
  if(user.disabled||!user.email||!user.providerData.some(p=>p.providerId==='password'))throw fault(403,'Esta conta não permite confirmação por email.');
  if(user.emailVerified)return {alreadyVerified:true};
  const stamp=now(),day=Math.floor(stamp/86_400_000),hour=Math.floor(stamp/3_600_000);
  const emailHash=createHash('sha256').update(user.email.toLowerCase()).digest('hex');
  const recipient=db.collection('rateLimits').doc('verify-'+emailHash);
  const global=db.collection('rateLimits').doc('verification-email-global');
  await db.runTransaction(async tx=>{
   const [recipientSnap,globalSnap]=await tx.getAll(recipient,global);
   const r=recipientSnap.data()||{},g=globalSnap.data()||{};
   const hourly=r.hour===hour?r.hourly:0,daily=r.day===day?r.daily:0,total=g.day===day?g.daily:0;
   if((r.lastAttempt!==undefined&&stamp-r.lastAttempt<60_000)||hourly>=3||daily>=6)throw fault(429,'Aguarde antes de reenviar a confirmação. Confira também a caixa de spam.');
   if(total>=dailyLimit)throw fault(503,'Envio de confirmação temporariamente indisponível. Tente novamente mais tarde.');
   const expiresAt=new Date(stamp+172_800_000);
   tx.set(recipient,{hour,hourly:hourly+1,day,daily:daily+1,lastAttempt:stamp,expiresAt});
   tx.set(global,{day,daily:total+1,expiresAt});
  });
  // Never persist or return the action link, provider response or email address.
  const firebaseLink=await auth.generateEmailVerificationLink(user.email,{url:new URL('/conta/',site).href,handleCodeInApp:false});
  const link=brandedVerificationLink(firebaseLink,site);
  const {subject,text,html}=verificationEmailTemplate(link,site);
  let response;
  try{response=await request('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10_000),headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`lhs-verify/${emailHash}/${stamp}`},body:JSON.stringify({from,to:[user.email],reply_to:replyTo,subject,text,html})});}
  catch{throw fault(502,'Não foi possível enviar a confirmação. Aguarde um minuto e tente reenviar.');}
  if(!response.ok)throw fault(502,'Não foi possível enviar a confirmação. Aguarde um minuto e tente reenviar.');
  return {sent:true};
 };
}

export function authenticateAccount(auth){return async(req,res,next)=>{try{
 const match=/^Bearer (\S+)$/.exec(req.headers.authorization||'');
 if(!match)throw fault(401,'Entre na conta para usar a nuvem.');
 try{req.authToken=await auth.verifyIdToken(match[1],true);}catch{throw fault(401,'Sessão inválida ou expirada.');}
 req.uid=req.authToken.uid;next();
}catch(error){next(error);}};}
