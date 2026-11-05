import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,signal} from '@angular/core';
import {AccountError,SiteAccountClient,validateAccountConfig} from './account-client';
import {CheckoutAttempts} from './checkout-attempts';
import {prepareProductionCheckout,productionCheckoutEnabled,productionQuote} from './production-checkout-contract';
import type {ProductionQuote} from './production-checkout-contract';
@Component({selector:'lhs-production-checkout',standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./production-checkout.html'})
export class ProductionCheckoutComponent implements OnInit,OnDestroy{
 readonly enabled=signal(false);
 readonly packages=signal<ReadonlyArray<ProductionQuote>>([]);
 readonly needsAccount=signal(false);
 readonly busy=signal(false);
 readonly quote=signal<ProductionQuote|null>(null);
 readonly accepted=signal(false);
 readonly receipt=signal<{id:string;url:string}|null>(null);
 readonly message=signal('');
 private client:SiteAccountClient|null=null;
 private attempts:CheckoutAttempts|null=null;
 private version=0;
 private discoveryVersion=0;
 private destroyed=false;
 private readonly abort=new AbortController();
 ngOnInit():void{void this.discover();}
 ngOnDestroy():void{this.destroyed=true;this.version++;this.abort.abort();}
 private async json(url:string):Promise<unknown>{
  const response=await fetch(url,{cache:'no-store',credentials:'omit',referrerPolicy:'origin',
   signal:AbortSignal.any([this.abort.signal,AbortSignal.timeout(15000)])});
  if(!response.ok)throw new AccountError('Serviço indisponível.',response.status);
  return await response.json() as unknown;
 }
 private async gate():Promise<boolean>{return productionCheckoutEnabled(await this.json('/checkout-config.json'));}
 async refresh():Promise<void>{
  if(this.busy()||this.destroyed)return;
  this.close();this.enabled.set(false);this.packages.set([]);
  await this.discover();
 }
 private async discover():Promise<void>{
  const version=++this.discoveryVersion;
  try{
   if(!await this.gate())return;
   const config=validateAccountConfig(await this.json('/account-config.json'));
   if(!config.enabled)return;
   const raw=await this.json(config.apiUrl+'/v1/config');
   const packages=['donate-5','donate-10'].map(id=>productionQuote(raw,id));
   if(!this.destroyed&&version===this.discoveryVersion){this.packages.set(packages);this.enabled.set(true);}
  }catch{/* Unavailable or invalid catalog: no payment action. */}
 }
 async review(id:string):Promise<void>{
  if(this.busy()||this.destroyed||!this.enabled())return;
  this.close();const version=this.version;this.busy.set(true);
  try{
   if(!await this.gate())throw Error('Checkout não liberado.');
   const config=validateAccountConfig(await this.json('/account-config.json'));
   const client=new SiteAccountClient(config),profile=await client.restore();
   if(!profile?.emailVerified){this.needsAccount.set(true);throw Error('Entre em Minha conta e confirme seu email.');}
   const quote=productionQuote(await this.json(config.apiUrl+'/v1/config'),id);
   if(this.destroyed||version!==this.version)return;
   let storage:Storage|null=null;try{storage=sessionStorage;}catch{/* POST fails closed. */}
   this.attempts=new CheckoutAttempts(config.apiUrl+'|'+profile.email,storage,'lhs.checkout.production.v1');
   this.client=client;this.quote.set(quote);
  }catch(error){if(!this.destroyed&&version===this.version)this.message.set(error instanceof Error?error.message:'Serviço indisponível.');}
  finally{if(!this.destroyed&&version===this.version)this.busy.set(false);}
 }
 async prepare():Promise<void>{
  const quote=this.quote(),client=this.client,attempts=this.attempts;
  if(this.busy()||this.destroyed||this.receipt()||!quote||!client||!attempts||!this.accepted())return;
  const version=this.version;this.busy.set(true);this.receipt.set(null);this.message.set('');
  try{
   const enabled=await this.gate();
   if(!enabled)throw Error('Checkout não liberado.');
   const key=attempts.keyFor(quote.packageId);
   const receipt=await prepareProductionCheckout({enabled,quote,key,acceptedTerms:this.accepted(),
    readConfig:()=>this.json(client.config.apiUrl+'/v1/config'),
    createOrder:(body,requestKey)=>{
     if(this.destroyed||version!==this.version)throw Error('Revisão encerrada.');
     attempts.next(quote.packageId);
     return client.postProductionOrder(body,requestKey,enabled);
    }});
   if(!this.destroyed&&version===this.version)this.receipt.set(receipt);
  }catch(error){
   if(this.destroyed||version!==this.version)return;
   if(error instanceof AccountError&&error.status===401){
    client.signOut();try{attempts.clear();}catch{/* Keep financial controls closed. */}
    this.close();
   }else if(error instanceof AccountError&&error.status===410){
    try{attempts.expire(quote.packageId);}catch{/* Next order will fail closed. */}
    this.close();
   }
   this.message.set(error instanceof Error?error.message:'Confira seus apoios antes de tentar novamente.');
  }finally{if(!this.destroyed)this.busy.set(false);}
 }
 close():void{
  this.version++;this.client=null;this.attempts=null;this.quote.set(null);
  this.accepted.set(false);this.receipt.set(null);this.message.set('');this.needsAccount.set(false);
 }
}
