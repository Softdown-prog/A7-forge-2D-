import {ChangeDetectionStrategy,Component,OnInit,OnDestroy,signal} from '@angular/core';
import {validateAccountConfig} from './account-client';
export const DONATE_PACKAGES=Object.freeze([{id:'donate-5',priceCents:500,cookies:50},{id:'donate-10',priceCents:1000,cookies:100}] as const);
type Availability='loading'|'unavailable'|'backend-active'|'error';
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
 return flags['paymentsEnabled']===true&&flags['paymentsMode']==='production'?'backend-active':'unavailable';
}
@Component({selector:'lhs-donate',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./donate.html'})
export class DonateComponent implements OnInit,OnDestroy{
 readonly packages=DONATE_PACKAGES;
 readonly availability=signal<Availability>('loading');
 private abort=new AbortController();
 private destroyed=false;
 ngOnInit():void{void this.refresh();}
 ngOnDestroy():void{this.destroyed=true;this.abort.abort();}
 async refresh():Promise<void>{
  this.abort.abort();this.abort=new AbortController();
  const signal=this.abort.signal;
  this.availability.set('loading');
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