import {createHash,randomUUID} from 'node:crypto';
import {fault,id,paymentCredit} from './domain.mjs';

export function validCheckout(value){
 let url;try{url=new URL(value);}catch{throw fault(502,'Checkout inválido.');}
 if(url.protocol!=='https:'||url.username||url.password||!['www.mercadopago.com.br','www.mercadopago.com','sandbox.mercadopago.com.br','sandbox.mercadopago.com'].includes(url.hostname))throw fault(502,'Checkout inválido.');return url.href;
}
export function preferenceBody(order,{apiUrl,siteUrl,now=Date.now()}){
 const back=new URL('/donate/',siteUrl);back.searchParams.set('order',order.id);
 return {items:[{id:order.packageId,title:`LHS — apoio ao desenvolvimento + ${order.cookies} Cookies`,description:'Créditos vinculados à conta para futuros cosméticos especiais do LHS.',category_id:'digital_goods',quantity:1,currency_id:'BRL',unit_price:order.priceCents/100}],external_reference:order.id,notification_url:new URL('/webhooks/mercadopago',apiUrl).href,metadata:{lhs_order:order.id},back_urls:{success:back.href,pending:back.href,failure:back.href},auto_return:'approved',expires:true,expiration_date_from:new Date(now).toISOString(),expiration_date_to:new Date(now+86_400_000).toISOString()};
}
export function createPayments({db,FieldValue,mp,packages,sandbox,apiUrl,siteUrl,sellerId,applicationId,sellerIsTest=false,now=Date.now}){
 if(!sandbox&&sellerIsTest)throw Error('Uma conta de teste não pode receber pagamentos de produção.');
 // Official test sellers use live credentials and their payments can be live_mode=true.
 // Trust this exception only after /users/me identifies that exact seller as test_user.
 const expectedLiveMode=!sandbox||sellerIsTest;
 const mode=sandbox?'sandbox':'production',balanceField=sandbox?'cookiesBalanceSandbox':'cookiesBalance';
 const summary=order=>({id:order.id,priceCents:order.priceCents,cookies:order.cookies,status:order.status,mode:order.mode});
 async function createOrder(uid,packageId,key){
  id(packageId);id(key);const pack=Object.hasOwn(packages,packageId)?packages[packageId]:null;if(!pack)throw fault(400,'Pacote indisponível.');
  const orderId=createHash('sha256').update(`${mode}:${uid}:${key}`).digest('hex'),ref=db.collection('orders').doc(orderId),claim=randomUUID();
  const recent=db.collection('accounts').doc(uid).collection('orders').doc(orderId);
  const order=await db.runTransaction(async tx=>{const prior=await tx.get(ref),existing=prior.data();
   if(existing){
    if(existing.packageId!==packageId||existing.uid!==uid||existing.mode!==mode)throw fault(409,'Chave já usada para outro apoio.');
    if(existing.expiresAt<=now())throw fault(410,'Este apoio expirou. Escolha novamente o valor para continuar.');
    if(existing.checkoutUrl)return existing;
    if(existing.creatingUntil>now())throw fault(409,'Seu pagamento está sendo preparado. Aguarde e tente novamente.');
    tx.update(ref,{claim,creatingUntil:now()+60_000});return existing;
   }
   const created={id:orderId,uid,packageId,...pack,mode,status:'created',sellerId:String(sellerId),expiresAt:now()+86_400_000,createdAt:FieldValue.serverTimestamp()};
   tx.create(ref,{...created,claim,creatingUntil:now()+60_000});tx.create(recent,summary(created));tx.update(recent,{createdAt:FieldValue.serverTimestamp()});return created;
  });
  if(order.checkoutUrl)return {id:order.id,url:order.checkoutUrl};
  // A single active creator per order prevents double-click/concurrent preferences.
  // The same key always refers to this immutable server-priced order.
  try{
   const preference=await mp('/checkout/preferences',{method:'POST',headers:{'X-Idempotency-Key':orderId},body:JSON.stringify(preferenceBody(order,{apiUrl,siteUrl,now:now()}))});
   const url=validCheckout(sandbox&&!sellerIsTest?preference.sandbox_init_point:preference.init_point);
   await db.runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current.claim!==claim)throw fault(409,'Seu pagamento está sendo conferido. Tente novamente.');tx.update(ref,{checkoutUrl:url,preferenceId:preference.id,creatingUntil:0});});return {id:orderId,url};
  }catch(error){await db.runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current?.claim===claim)tx.update(ref,{creatingUntil:0});}).catch(()=>{});throw error;}
 }
 async function applyPayment(payment){
  const paymentId=id(String(payment.id));if(!/^\d+$/.test(paymentId)||payment.live_mode!==expectedLiveMode||String(payment.collector_id)!==String(sellerId))throw fault(400,'Ambiente ou recebedor incompatível.');
  if(payment.application_id&&String(payment.application_id)!==String(applicationId))throw fault(400,'Aplicação incompatível.');
  const ref=db.collection('orders').doc(id(payment.external_reference)),event=db.collection('payments').doc(`${mode}-${paymentId}`);
  await db.runTransaction(async tx=>{
   const [o,prior]=await tx.getAll(ref,event);if(!o.exists)throw fault(404,'Pedido não encontrado.');const order=o.data();
   if(order.mode!==mode||String(order.sellerId)!==String(sellerId))throw fault(400,'Ambiente do pedido incompatível.');
   if(prior.exists&&prior.data().orderId!==order.id)throw fault(400,'Pagamento associado a outro pedido.');
   const desired=paymentCredit(payment,order),timestamp=Date.parse(payment.date_last_updated);if(!Number.isFinite(timestamp))throw fault(400,'Data inválida.');
   if(prior.exists&&prior.data().updated>=timestamp)return;
   if(order.paymentId&&order.paymentId!==paymentId){if(desired>0)throw fault(409,'Pedido já pago; pagamento adicional requer reconciliação.');return;}
   const account=db.collection('accounts').doc(order.uid),a=await tx.get(account),previous=prior.data()?.credited||0,credited=desired??previous,delta=credited-previous;
   if(delta){tx.set(account,{[balanceField]:(a.data()?.[balanceField]||0)+delta},{merge:true});tx.create(account.collection('ledger').doc(`${mode}-${paymentId}-${timestamp}`),{delta,mode,type:delta>0?'payment':'reversal',paymentId,orderId:order.id,at:FieldValue.serverTimestamp()});}
   tx.set(event,{orderId:order.id,credited,updated:timestamp,status:payment.status,mode});tx.update(ref,{status:payment.status,...(desired!==null?{paymentId}:{})});
   tx.set(account.collection('orders').doc(order.id),{...summary(order),status:payment.status},{merge:true});
  });
 }
 async function readOrder(uid,orderId,{reconcile=true}={}){
  const ref=db.collection('orders').doc(id(orderId)),order=(await ref.get()).data();if(!order||order.uid!==uid||order.mode!==mode)throw fault(404,'Apoio não encontrado.');
  // Authenticated fallback to the provider also handles a delayed/lost webhook.
  if(reconcile){
   const result=await mp(`/v1/payments/search?external_reference=${encodeURIComponent(order.id)}&sort=date_last_updated&criteria=desc&limit=20`);
   for(const payment of [...(result.results||[])].reverse())await applyPayment(payment);
  }
  return summary((await ref.get()).data());
 }
 async function listOrders(uid){
  const snapshot=await db.collection('accounts').doc(uid).collection('orders').orderBy('createdAt','desc').limit(20).get();
  return snapshot.docs.map(d=>summary(d.data())).filter(o=>o.mode===mode).slice(0,10);
 }
 return {createOrder,applyPayment,readOrder,listOrders};
}
