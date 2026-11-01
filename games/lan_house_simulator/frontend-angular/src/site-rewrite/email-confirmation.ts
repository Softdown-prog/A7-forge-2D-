import {ChangeDetectionStrategy,Component,HostListener,OnDestroy,OnInit,signal} from '@angular/core';
import {captureConfirmationCode,confirmEmailCode,ConfirmationError} from './email-confirmation-client';

@Component({
 selector:'lhs-email-confirmation',standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./email-confirmation.html'
})
export class EmailConfirmationComponent implements OnInit,OnDestroy {
 readonly ready=signal(false);
 readonly busy=signal(false);
 readonly confirmed=signal(false);
 readonly message=signal('Abra o link recebido no email. Se ele expirou, entre em Minha conta para pedir uma nova confirmação.');
 private code:string|null=null;
 private destroyed=false;
 private abort=new AbortController();
 private epoch=0;
 ngOnInit():void{this.capture();}
 @HostListener('window:hashchange')
 onHashChange():void{this.capture();}
 private capture():void {
  this.abort.abort();this.abort=new AbortController();this.epoch++;
  this.code=null;this.busy.set(false);this.ready.set(false);this.confirmed.set(false);
  this.message.set('Abra o link recebido no email. Se ele expirou, entre em Minha conta para pedir uma nova confirmação.');
  try{this.code=captureConfirmationCode(window.location,window.history);}
  catch{
   this.message.set('Não foi possível proteger este link neste navegador. Reabra o email em outra janela para confirmar com segurança.');
   return;
  }
  this.ready.set(this.code!==null);
  if(this.code)this.message.set('Clique abaixo para confirmar seu email e concluir a criação da sua conta.');
 }
 ngOnDestroy():void{this.destroyed=true;this.epoch++;this.code=null;this.abort.abort();}
 async confirm():Promise<void> {
  if(this.busy()||!this.code||this.destroyed)return;
  const epoch=this.epoch,signal=this.abort.signal,code=this.code;
  this.busy.set(true);this.message.set('Confirmando seu email…');
  try{
   // Never redeem during initialization: link scanners must not consume the code.
   const response=await fetch('/account-config.json',{
    cache:'no-store',credentials:'omit',referrerPolicy:'origin',
    signal:AbortSignal.any([signal,AbortSignal.timeout(15000)])
   });
   if(!response.ok)throw new ConfirmationError('Não foi possível carregar a confirmação. Tente novamente.',true);
   const config:unknown=await response.json();
   if(this.destroyed||epoch!==this.epoch)return;
   await confirmEmailCode(code,config,undefined,signal);
   if(this.destroyed||epoch!==this.epoch)return;
   this.code=null;this.ready.set(false);this.confirmed.set(true);
   this.message.set('Seu email foi confirmado. Entre em Minha conta para acessar o painel. Se ele já estiver aberto em outra aba, use “Já confirmei meu email”.');
  }catch(error){
   if(this.destroyed||epoch!==this.epoch)return;
   this.message.set(error instanceof ConfirmationError?error.message:'Não foi possível confirmar agora. Tente novamente.');
   if(error instanceof ConfirmationError&&!error.retryable){this.code=null;this.ready.set(false);}
  }finally{if(!this.destroyed&&epoch===this.epoch)this.busy.set(false);}
 }
}
