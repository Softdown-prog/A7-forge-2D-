import {createHmac,timingSafeEqual} from 'node:crypto';
export const MAX_SAVE_BYTES=2_000_000;
export function fault(status,message){return Object.assign(new Error(message),{status});}
export function id(value){if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(value))throw fault(400,'Identificador inválido.');return value;}
export function requireRevision(actual,expected){if(expected!==actual)throw fault(409,'O save mudou em outro dispositivo. Recarregue antes de salvar.');}
export function verifyWebhook(paymentId,requestId,signature,secret,now=Date.now()){
 const parts=Object.fromEntries(String(signature||'').split(',').map(x=>x.trim().split('=')));
 if(!/^\d+$/.test(parts.ts||'')||!/^\d+$/.test(String(paymentId))||!requestId||!secret)return false;
 const stamp=Number(parts.ts);const millis=stamp>1e12?stamp:stamp*1000;
 if(Math.abs(now-millis)>300_000||!/^[a-f0-9]{64}$/i.test(parts.v1||''))return false;
 const digest=createHmac('sha256',secret).update(`id:${paymentId};request-id:${requestId};ts:${parts.ts};`).digest();
 return timingSafeEqual(digest,Buffer.from(parts.v1,'hex'));
}
export function paymentCredit(payment,order){
 if(payment.currency_id!=='BRL'||Math.round(Number(payment.transaction_amount)*100)!==order.priceCents||payment.external_reference!==order.id)throw fault(400,'Pagamento incompatível com o pedido.');
 if(payment.status==='refunded'||payment.status==='charged_back')return 0;
 if(payment.status!=='approved')return null;
 const refunded=Math.round(Number(payment.transaction_amount_refunded||0)*100);
 if(!Number.isSafeInteger(refunded)||refunded<0||refunded>order.priceCents)throw fault(400,'Estorno inválido.');
 return Math.floor(order.cookies*(order.priceCents-refunded)/order.priceCents);
}
