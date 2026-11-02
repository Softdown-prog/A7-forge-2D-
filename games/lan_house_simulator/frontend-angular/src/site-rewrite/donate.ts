import {ChangeDetectionStrategy,Component,OnInit,OnDestroy,signal} from '@angular/core';
import {AccountError,SiteAccountClient,validateAccountConfig} from './account-client';
import {approvedPackageId,simulateSandboxCheckout,validateSandboxQuote} from './checkout-contract';
import {createAuthenticatedSandboxAdapter} from './checkout-sandbox-adapter';
import type {ApprovedQuote,DonationPackageId} from './checkout-contract';
export const DONATE_PACKAGES=Object.freeze([{id:'donate-5',priceCents:500,cookies:50},{id:'donate-10',priceCents:1000,cookies:100}] as const);
type Availability='loading'|'unavailable'|'backend-active'|'sandbox-ready'|'error';
type ReviewState='idle'|'loading'|'login-required'|'verify-required'|'ready'|'preparing'|'prepared'|'prepare-error'|'confirmed'|'error';
/** Read-only capability discovery. This preview must never issue checkout orders. */
export async function paymentAvailability(raw:unknown,request:typeof fetch=(input,init)=>fetch(input,init),signal?:AbortSignal):Promise<Availability>{
 const config=validateAccountConfig(raw);
 if(!config.enabled)return 'unavailable';
 const response=await request(new URL('/v1/config',config.apiUrl),{
  cache:'no-store',method:'GET',credentials:'omit',referrerPolicy:'origin',
  signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Error('Consulta indisponível');
 const data:unknown=await response.json();
 if(!data||typeof data!=='object')throw Error('Resposta inválida');
 const flags=data as Record<string,unknown>;
 if(flags['paymentsEnabled']!==true)return 'unavailable';
 if(flags['paymentsMode']==='production')return 'backend-active';
 return flags['paymentsMode']==='sandbox'?'sandbox-ready':'unavailable';
}
@Component({selector:'lhs-donate',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./donate.html'})
export class DonateComponent implements OnInit,OnDestroy{
 readonly packages=DONATE_PACKAGES;
 readonly availability=signal<Availability>('loading');
 readonly reviewState=signal<ReviewState>('idle');
 readonly reviewQuote=signal<ApprovedQuote|null>(null);
 readonly termsAccepted=signal(false);
 readonly sandboxOrderId=signal<string|null>(null);
 private reviewClient:SiteAccountClient|null=null;
 private reviewVersion=0;
 /** Reuse a key after uncertain network failures; never double-submit with fresh UUID. */
 private readonly orderKeys=new Map<DonationPackageId,string>();
 private abort=new AbortController();
 private destroyed=false;
 ngOnInit():void{void this.refresh();}
 ngOnDestroy():void{this.destroyed=true;this.reviewVersion++;this.reviewClient=null;this.abort.abort();}
 /** Reviews a sandbox-only server quote; never creates payment orders or opens checkout. */
 async reviewPackage(rawPackageId:string):Promise<void>{
  if(this.destroyed||this.availability()!=='sandbox-ready'||(this.reviewState()==='loading'||this.reviewState()==='preparing'))return;
  const version=++this.reviewVersion;
  this.reviewClient=null;
  this.sandboxOrderId.set(null);
  this.reviewQuote.set(null);this.termsAccepted.set(false);
  this.reviewState.set('loading');
  try{
   const packageId=approvedPackageId(rawPackageId);
   const response=await fetch('/account-config.json',{
    method:'GET',cache:'no-store',credentials:'omit',referrerPolicy:'origin',
    signal:AbortSignal.any([this.abort.signal,AbortSignal.timeout(15000)])
   });
   if(!response.ok)throw Error('Configuração indisponível.');
   const config=validateAccountConfig(await response.json() as unknown);
   if(!config.enabled){if(!this.destroyed)this.reviewState.set('error');return;}
   const client=new SiteAccountClient(config);
   if(!client.hasSession){if(!this.destroyed)this.reviewState.set('login-required');return;}
   const profile=await client.restore();
   if(this.destroyed||this.abort.signal.aborted||version!==this.reviewVersion)return;
   if(!profile){this.reviewState.set('login-required');return;}
   if(!profile.emailVerified){this.reviewState.set('verify-required');return;}
   const quoteResponse=await fetch(new URL('/v1/config',config.apiUrl),{
    method:'GET',cache:'no-store',credentials:'omit',referrerPolicy:'origin',
    signal:AbortSignal.any([this.abort.signal,AbortSignal.timeout(15000)])
   });
   if(!quoteResponse.ok)throw Error('Pacotes temporariamente indisponíveis.');
   const quote=validateSandboxQuote(await quoteResponse.json() as unknown,packageId);
   if(this.destroyed||this.abort.signal.aborted||version!==this.reviewVersion)return;
   this.reviewClient=client;
   this.reviewQuote.set(quote);
   this.reviewState.set('ready');
  }catch(error){
   if(this.destroyed||this.abort.signal.aborted||version!==this.reviewVersion)return;
   this.reviewClient=null;
   this.reviewState.set(error instanceof AccountError&&error.status===401?
    'login-required':'error');
  }
 }
 toggleReviewTerms(event:Event):void{
  if(this.reviewState()!=='ready')return;
  if(event.target instanceof HTMLInputElement)this.termsAccepted.set(event.target.checked);
 }
 /** Explicitly prepares an idempotent SANDBOX order, but never opens checkout. */
 async prepareSandboxOrder():Promise<void>{
  const quote=this.reviewQuote(),client=this.reviewClient;
  if(this.destroyed||this.availability()!=='sandbox-ready'||
   (this.reviewState()!=='ready'&&this.reviewState()!=='prepare-error')||
   !quote||!client||!this.termsAccepted())return;
  const version=this.reviewVersion;
  const key=this.orderKeys.get(quote.packageId)??crypto.randomUUID();
  this.orderKeys.set(quote.packageId,key);
  this.sandboxOrderId.set(null);
  this.reviewState.set('preparing');
  try{
   const adapter=createAuthenticatedSandboxAdapter(client);
   const receipt=await simulateSandboxCheckout({
    account:{emailVerified:true},packageId:quote.packageId,
    acceptedTerms:true,idempotencyKey:key,
    adapter:{
     async readConfig():Promise<unknown>{
      const fresh=await adapter.readConfig();
      const latest=validateSandboxQuote(fresh,quote.packageId);
      if(latest.priceCents!==quote.priceCents||latest.cookies!==quote.cookies)
       throw new AccountError('Os valores mudaram. Reveja seu apoio antes de continuar.',409);
      return fresh;
     },
     createOrder:(body,requestKey)=>adapter.createOrder(body,requestKey)
    }
   });
   if(this.destroyed||this.reviewVersion!==version)return;
   this.sandboxOrderId.set(receipt.orderId.slice(0,12));
   this.reviewState.set('prepared');
  }catch(error){
   if(this.destroyed||this.reviewVersion!==version)return;
   if(error instanceof AccountError&&error.status===410)this.orderKeys.delete(quote.packageId);
   this.reviewState.set('prepare-error');
  }
 }
 confirmReview():void{
  if(this.reviewState()!=='ready'||!this.reviewQuote()||!this.termsAccepted())return;
  // This is deliberately a local UI transition: no API write, no checkout, no Cookies.
  this.reviewState.set('confirmed');
 }
 cancelReview():void{
  if(this.reviewState()==='loading'||this.reviewState()==='preparing')return;
  this.reviewVersion++;
  this.reviewClient=null;this.reviewQuote.set(null);
  this.sandboxOrderId.set(null);
  this.termsAccepted.set(false);this.reviewState.set('idle');
 }
 async refresh():Promise<void>{
  this.abort.abort();this.abort=new AbortController();
  const signal=this.abort.signal;
  this.availability.set('loading');
  this.reviewVersion++;this.reviewClient=null;
  this.reviewQuote.set(null);this.sandboxOrderId.set(null);
  this.termsAccepted.set(false);this.reviewState.set('idle');
  try{
   const response=await fetch('/account-config.json',{
    cache:'no-store',credentials:'omit',referrerPolicy:'origin',
    signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])
   });
   if(!response.ok)throw Error('Configuração indisponível');
   const state=await paymentAvailability(await response.json() as unknown,undefined,signal);
   if(!this.destroyed&&!signal.aborted)this.availability.set(state);
  }catch{if(!this.destroyed&&!signal.aborted)this.availability.set('error');}
 }
}