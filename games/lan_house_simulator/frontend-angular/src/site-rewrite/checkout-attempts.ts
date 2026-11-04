/** Persist uncertain sandbox intents across reloads, scoped to API and account.
 * This only bounds UI retries. Server idempotency remains authoritative. */
import {validateIdempotencyKey,approvedPackageId} from './checkout-contract';
import type {DonationPackageId} from './checkout-contract';
const STORAGE_KEY='lhs.checkout.sandbox.v1';
export const MAX_CHECKOUT_ATTEMPTS=3;
type Attempt={key:string;attempts:number};
type AttemptStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export class CheckoutAttempts{
 private readonly intents=new Map<DonationPackageId,Attempt>();
 private get keyName():string{return this.storageKey+':'+encodeURIComponent(this.scope);}
 constructor(private readonly scope:string,private readonly storage:AttemptStorage|null,
  private readonly storageKey=STORAGE_KEY){
  if(!storage)return;
  try{
   const raw:unknown=JSON.parse(storage.getItem(this.keyName)??'null');
   if(!raw||typeof raw!=='object')return;
   const data=raw as Record<string,unknown>;
   if(data['scope']!==scope||!Array.isArray(data['intents']))return;
   for(const rawIntent of data['intents']){
    if(!rawIntent||typeof rawIntent!=='object')throw Error('Invalid intent');
    const intent=rawIntent as Record<string,unknown>;
    const packageId=approvedPackageId(String(intent['packageId']));
    const key=validateIdempotencyKey(String(intent['key']));
    const attempts=intent['attempts'];
    if(typeof attempts!=='number'||!Number.isInteger(attempts)||attempts<0||attempts>MAX_CHECKOUT_ATTEMPTS)throw Error('Invalid count');
    this.intents.set(packageId,{key,attempts});
   }
  }catch{throw Error('Não foi possível recuperar o pedido pendente. Confira seus apoios antes de tentar novamente.');}
 }
 keyFor(packageId:DonationPackageId,uuid:()=>string=()=>crypto.randomUUID()):string{
  const existing=this.intents.get(packageId);
  if(existing)return existing.key;
  const key=validateIdempotencyKey(uuid());
  this.intents.set(packageId,{key,attempts:0});this.persist();return key;
 }
 next(packageId:DonationPackageId,uuid:()=>string=()=>crypto.randomUUID()):string{
  const previous=this.intents.get(packageId);
  if(previous&&previous.attempts>=MAX_CHECKOUT_ATTEMPTS)
   throw Error('Limite de tentativas atingido. Confira seus apoios ou procure o suporte.');
  const key=this.keyFor(packageId,uuid);
  this.intents.set(packageId,{key,attempts:(previous?.attempts??0)+1});
  // Refuse POST if the intent cannot survive a reload after a network timeout.
  this.persist();return key;
 }
 expire(packageId:DonationPackageId):void{this.intents.delete(packageId);this.persist();}
 clear():void{this.intents.clear();this.storage?.removeItem(this.keyName);}
 private persist():void{
  if(!this.storage)throw Error('O navegador não permitiu guardar a referência segura do pedido.');
  this.storage.setItem(this.keyName,JSON.stringify({scope:this.scope,
   intents:[...this.intents].map(([packageId,intent])=>({packageId,...intent}))}));
 }
}
