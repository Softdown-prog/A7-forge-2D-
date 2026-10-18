import express from 'express';
import {randomUUID} from 'node:crypto';
import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {Storage} from '@google-cloud/storage';
import {parseImportedSave,serializeSave} from '../dist/js/sim/saveTransfer.js';
import {MAX_SAVE_BYTES,fault,id,requireRevision,verifyWebhook} from './domain.mjs';
import {DONATE_PACKAGES} from '../donate-packages.mjs';
import {createPayments} from './payments.mjs';

const projectId=process.env.GOOGLE_CLOUD_PROJECT;
initializeApp({credential:applicationDefault(),projectId});
const db=getFirestore(process.env.FIRESTORE_DATABASE_ID||'lhs-game');
const bucket=new Storage({projectId}).bucket(process.env.SAVES_BUCKET);
const auth=getAuth();
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
const origins=new Set((process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean));
const packages=DONATE_PACKAGES;
const catalogue=JSON.parse(process.env.COOKIE_ITEMS_JSON||'{}');
const paymentsEnabled=process.env.PAYMENTS_ENABLED==='true';
const sandbox=process.env.PAYMENTS_MODE!=='production';
if(paymentsEnabled&&(!process.env.MP_ACCESS_TOKEN||!process.env.MP_WEBHOOK_SECRET||!process.env.PUBLIC_API_URL||!process.env.PUBLIC_SITE_URL||!process.env.MP_APPLICATION_ID))throw Error('Configuração de pagamento incompleta.');
for(const p of Object.values(packages))if(!Number.isSafeInteger(p.priceCents)||p.priceCents<=0||!Number.isSafeInteger(p.cookies)||p.cookies<=0)throw Error('Pacote inválido.');
app.use((req,res,next)=>{
 res.set({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 if(req.headers.origin){if(!origins.has(req.headers.origin))return res.status(403).json({error:'Origem não autorizada.'});res.set({'Access-Control-Allow-Origin':req.headers.origin,'Vary':'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type, Idempotency-Key','Access-Control-Allow-Methods':'GET, POST, OPTIONS'});}
 if(req.method==='OPTIONS')return res.sendStatus(204);next();
});
app.use(express.json({limit:MAX_SAVE_BYTES,strict:true}));
app.use((req,res,next)=>{if(req.body===undefined)req.body={};next();});
app.get(['/health','/healthz'],(req,res)=>res.json({ok:true,service:'lhs-backend',paymentsEnabled}));
app.get('/v1/config',(req,res)=>res.json({paymentsEnabled,paymentsMode:sandbox?'sandbox':'production',packages,items:catalogue}));

// UID-wide quota survives multiple instances and cold starts. Public signup is handled by Firebase.
app.use('/v1',async(req,res,next)=>{try{
 const match=/^Bearer (\S+)$/.exec(req.headers.authorization||'');if(!match)throw fault(401,'Entre na conta para usar a nuvem.');
 let token;try{token=await auth.verifyIdToken(match[1],true);}catch{throw fault(401,'Sessão inválida ou expirada.');}
 if(!token.email_verified)throw fault(403,'Confirme seu email antes de usar a nuvem.');
 req.uid=token.uid;req.userRef=db.collection('accounts').doc(token.uid);
 const limit=db.collection('rateLimits').doc(token.uid);const window=Math.floor(Date.now()/60_000);
 await db.runTransaction(async tx=>{const snap=await tx.get(limit);const data=snap.data();const count=data?.window===window?data.count:0;if(count>=30)throw fault(429,'Muitas solicitações. Tente novamente em um minuto.');tx.set(limit,{window,count:count+1,expiresAt:new Date(Date.now()+120_000)});});
 next();
}catch(e){next(e);}});
app.get('/v1/account',async(req,res)=>{
 await db.runTransaction(async tx=>{const a=await tx.get(req.userRef);if(!a.exists)tx.create(req.userRef,{cookiesBalance:0,createdAt:FieldValue.serverTimestamp()});});
 const [a,items]=await Promise.all([req.userRef.get(),req.userRef.collection('items').get()]);
 res.json({uid:req.uid,cookiesBalance:a.data().cookiesBalance||0,entitlements:items.docs.map(d=>d.id)});
});
const slotRef=req=>req.userRef.collection('slots').doc('main');
app.get('/v1/saves/main',async(req,res)=>{
 const meta=(await slotRef(req).get()).data()||{};const selected=req.query.backup==='true'?meta.backup:meta.main;
 if(!selected)return res.json({revision:meta.revision||null,save:null});
 const [data]=await bucket.file(selected.object).download({validation:'crc32c'});
 res.json({revision:meta.revision,updatedAt:selected.updatedAt,save:JSON.parse(data.toString('utf8'))});
});
// Immutable objects + one atomic pointer swap give main/backup CAS across devices.
// Bounded proxy upload validates the same schema as local import before promotion.
app.post('/v1/saves/main',async(req,res)=>{
 if(!Object.hasOwn(req.body,'expectedRevision'))throw fault(400,'Revisão esperada obrigatória.');
 if(!req.body.save||typeof req.body.save!=='object')throw fault(400,'Save obrigatório.');
 const source=JSON.stringify(req.body.save);if(Buffer.byteLength(source)>MAX_SAVE_BYTES)throw fault(413,'Save muito grande.');
 let save;try{save=serializeSave(parseImportedSave(source));}catch{throw fault(400,'Save inválido ou incompatível.');}
 if(Buffer.byteLength(save)>MAX_SAVE_BYTES)throw fault(413,'Save muito grande.');
 const ref=slotRef(req);const before=(await ref.get()).data()||{};requireRevision(before.revision||null,req.body.expectedRevision);
 const revision=randomUUID();const object=`users/${req.uid}/slots/main/${revision}.json`;
 const file=bucket.file(object);await file.save(save,{resumable:false,contentType:'application/json',preconditionOpts:{ifGenerationMatch:0}});
 let discarded;try{await db.runTransaction(async tx=>{const old=(await tx.get(ref)).data()||{};requireRevision(old.revision||null,req.body.expectedRevision);discarded=old.backup?.object;tx.set(ref,{revision,main:{object,updatedAt:new Date().toISOString()},backup:old.main||null});});}
 catch(e){
  // A commit timeout may mean success. Never delete an object referenced by a slot.
  const confirmed=await ref.get().then(s=>s.data()).catch(()=>null);
  if(confirmed?.main?.object===object||confirmed?.backup?.object===object)return res.json({revision,saved:true});
  if(confirmed)await file.delete({ignoreNotFound:true}).catch(()=>{});
  throw e;
 }
 if(discarded)await bucket.file(discarded).delete({ignoreNotFound:true}).catch(()=>console.warn(JSON.stringify({event:'save_cleanup_failed'})));
 res.json({revision,saved:true});
});
app.post('/v1/items/:itemId/purchase',async(req,res)=>{
 const itemId=id(req.params.itemId);const item=catalogue[itemId];if(!item||!Number.isSafeInteger(item.cookies)||item.cookies<=0)throw fault(404,'Item indisponível.');
 const owned=req.userRef.collection('items').doc(itemId);
 await db.runTransaction(async tx=>{const [account,entitlement]=await tx.getAll(req.userRef,owned);if(entitlement.exists)return;const balance=account.data()?.cookiesBalance||0;if(balance<item.cookies)throw fault(409,'Cookies insuficientes.');tx.set(req.userRef,{cookiesBalance:balance-item.cookies},{merge:true});tx.create(owned,{acquiredAt:FieldValue.serverTimestamp()});tx.create(req.userRef.collection('ledger').doc(`item-${itemId}`),{delta:-item.cookies,type:'item',itemId,at:FieldValue.serverTimestamp()});});
 res.json({owned:true,itemId});
});
async function mp(path,options={}){
 const response=await fetch(`https://api.mercadopago.com${path}`,{...options,signal:AbortSignal.timeout(15_000),headers:{Authorization:`Bearer ${process.env.MP_ACCESS_TOKEN}`,'Content-Type':'application/json',...options.headers}});
 if(!response.ok)throw fault(502,'Provedor de pagamento indisponível.');return response.json();
}
let payments;
app.post('/v1/orders',async(req,res)=>{
 if(!paymentsEnabled)throw fault(503,'Doações ainda não disponíveis.');
 if(req.body.acceptedTerms!==true)throw fault(400,'Confirme os termos de Donate antes de continuar.');
 res.json(await payments.createOrder(req.uid,req.body.packageId,req.headers['idempotency-key']));
});
app.get('/v1/orders',async(req,res)=>res.json({orders:paymentsEnabled?await payments.listOrders(req.uid):[]}));
app.get('/v1/orders/:orderId',async(req,res)=>{if(!paymentsEnabled)throw fault(503,'Doações ainda não disponíveis.');res.json(await payments.readOrder(req.uid,req.params.orderId));});
app.post('/webhooks/mercadopago',async(req,res)=>{
 if(!paymentsEnabled)throw fault(503,'Pagamentos desativados.');
 const paymentId=String(req.query['data.id']||'');if(!verifyWebhook(paymentId,req.headers['x-request-id'],req.headers['x-signature'],process.env.MP_WEBHOOK_SECRET))throw fault(401,'Notificação inválida.');
 if(req.body.type&&req.body.type!=='payment')return res.sendStatus(200);
 if(req.body.data?.id&&String(req.body.data.id)!==paymentId)throw fault(400,'Notificação incompatível.');
 const payment=await mp(`/v1/payments/${paymentId}`);if(String(payment.id)!==paymentId)throw fault(400,'Pagamento incompatível.');
 await payments.applyPayment(payment);res.sendStatus(200);
});
app.use((err,req,res,next)=>{const status=err.status||500;if(status>=500)console.error(JSON.stringify({event:'request_failed',status,path:req.path}));res.status(status).json({error:status>=500?'Serviço temporariamente indisponível.':err.message});});
if(paymentsEnabled){const seller=await mp('/users/me');payments=createPayments({db,FieldValue,mp,packages,sandbox,apiUrl:process.env.PUBLIC_API_URL,siteUrl:process.env.PUBLIC_SITE_URL,sellerId:seller.id,applicationId:process.env.MP_APPLICATION_ID,sellerIsTest:seller.tags?.includes('test_user')===true});}
app.listen(Number(process.env.PORT||8080),'0.0.0.0');
