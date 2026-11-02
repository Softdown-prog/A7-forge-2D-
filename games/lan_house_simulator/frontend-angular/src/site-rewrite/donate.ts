import {ChangeDetectionStrategy,Component,OnInit,OnDestroy,signal} from '@angular/core';
import {AccountError,SiteAccountClient,validateAccountConfig} from './account-client';
import {approvedPackageId,validateSandboxQuote} from './checkout-contract';
import type {ApprovedQuote} from './checkout-contract';
export const DONATE_PACKAGES=Object.freeze([{id:'donate-5',priceCents:500,cookies:50},{id:'donate-10',priceCents:1000,cookies:100}] as const);
type Availability='loading'|'unavailable'|'backend-active'|'sandbox-ready'|'error';
type ReviewState='idle'|'loading'|'login-required'|'verify-required'|'ready'|'confirmed'|'error';
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
 private abort=new AbortController();
 private destroyed=false;
 ngOnInit():void{void this.refresh();}
 ngOnDestroy():void{this.destroyed=true;this.abort.abort();}
 /** Reviews a sandbox-only server quote; never creates payment orders or opens checkout. */
 async reviewPackage(rawPackageId:string):Promise<void>{
  if(this.destroyed||this.availability()!=='sandbox-ready'||this.reviewState()==='loading')return;
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
   if(this.destroyed||this.abort.signal.aborted)return;
   if(!profile){this.reviewState.set('login-required');return;}
   if(!profile.emailVerified){this.reviewState.set('verify-required');return;}
   const quoteResponse=await fetch(new URL('/v1/config',config.apiUrl),{
    method:'GET',cache:'no-store',credentials:'omit',referrerPolicy:'origin',
    signal:AbortSignal.any([this.abort.signal,AbortSignal.timeout(15000)])
   });
   if(!quoteResponse.ok)throw Error('Pacotes temporariamente indisponíveis.');
   const quote=validateSandboxQuote(await quoteResponse.json() as unknown,packageId);
   if(this.destroyed||this.abort.signal.aborted)return;
   this.reviewQuote.set(quote);
   this.reviewState.set('ready');
  }catch(error){
   if(this.destroyed||this.abort.signal.aborted)return;
   this.reviewState.set(error instanceof AccountError&&error.status===401?
    'login-required':'error');
  }
 }
 toggleReviewTerms(event:Event):void{
  if(this.reviewState()!=='ready')return;
  if(event.target instanceof HTMLInputElement)this.termsAccepted.set(event.target.checked);
 }
 confirmReview():void{
  if(this.reviewState()!=='ready'||!this.reviewQuote()||!this.termsAccepted())return;
  // This is deliberately a local UI transition: no API write, no checkout, no Cookies.
  this.reviewState.set('confirmed');
 }
 cancelReview():void{
  if(this.reviewState()==='loading')return;
  this.reviewQuote.set(null);this.termsAccepted.set(false);this.reviewState.set('idle');
 }
 async refresh():Promise<void>{
  this.abort.abort();this.abort=new AbortController();
  const signal=this.abort.signal;
  this.availability.set('loading');
  this.cancelReview();
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