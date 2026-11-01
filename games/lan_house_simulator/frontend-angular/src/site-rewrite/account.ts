import {ChangeDetectionStrategy,ChangeDetectorRef,Component,OnInit,inject,signal} from '@angular/core';
import {AccountError,SiteAccountClient,validateAccountConfig} from './account-client';
import type {AccountProfile,MainSave} from './account-client';
type View='loading'|'disabled'|'auth'|'verify'|'dashboard';
type Mode='login'|'signup'|'reset';
/** Sole Angular owner of authentication, session, cloud save and account dashboard. */
@Component({
 selector:'lhs-account',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./account.html'
})
export class AccountComponent implements OnInit {
 readonly view=signal<View>('loading');
 readonly mode=signal<Mode>('login');
 readonly busy=signal(false);
 readonly message=signal('Preparando a conta…');
 readonly showPassword=signal(false);
 readonly accountEmail=signal('');
 readonly cookies=signal<number|null>(null);
 readonly remote=signal<MainSave|null>(null);
 readonly filename=signal('');
 private readonly changeDetector=inject(ChangeDetectorRef);
 private client:SiteAccountClient|null=null;
 private uploadedSave:unknown=null;
 private uploadedInput:HTMLInputElement|null=null;
 private destroyed=false;
 ngOnInit():void{
  const query=new URLSearchParams(location.search).get('modo');
  if(query==='cadastro')this.mode.set('signup');
  else if(query==='recuperar')this.mode.set('reset');
  void this.initialize();
 }
 ngOnDestroy():void{this.destroyed=true;}
 private async initialize():Promise<void>{
  try{
   const response=await fetch('/account-config.json',{
    cache:'no-store',signal:AbortSignal.timeout(15000)
   });
   if(!response.ok)throw new AccountError('Não foi possível carregar a conta.');
   const config=validateAccountConfig(await response.json() as unknown);
   if(!config.enabled){this.view.set('disabled');this.message.set(
    'Conta temporariamente indisponível. Você pode continuar jogando sem login.'
   );return;}
   this.client=new SiteAccountClient(config);
   this.view.set('auth');
   this.message.set('Conta opcional. Entre ou crie seu acesso.');
   if(this.client.hasSession){
    await this.execute(async()=>{
     const profile=await this.requireClient().restore();
     if(profile)await this.connected(profile);
    });
   }
  }catch(error){
   this.view.set('disabled');this.message.set(this.failureMessage(error));
  }
 }
 private requireClient():SiteAccountClient{
  if(!this.client)throw new AccountError('Conta indisponível.');
  return this.client;
 }
 private failureMessage(error:unknown):string{
  return error instanceof Error?error.message:'Não foi possível concluir. Seus dados locais foram preservados.';
 }
 private async execute(work:()=>Promise<void>):Promise<void>{
  if(this.busy()||this.destroyed)return;
  this.busy.set(true);this.message.set('Conectando…');
  try{await work();}
  catch(error){
   if(error instanceof AccountError&&error.status===401){
    this.requireClient().signOut();this.clearDashboard();this.view.set('auth');
   }
   if(error instanceof AccountError&&error.status===409){
    this.remote.set(null);
    this.message.set('Outro dispositivo atualizou a nuvem. Confira o save remoto antes de enviar novamente.');
   }else this.message.set(this.failureMessage(error));
  }
  finally{this.busy.set(false);}
 }
 private clearDashboard():void{
  this.accountEmail.set('');this.cookies.set(null);
  this.remote.set(null);this.filename.set('');this.uploadedSave=null;
 }
 setMode(value:Mode):void{
  if(this.busy())return;
  this.mode.set(value);this.showPassword.set(false);this.message.set('');
 }
 togglePassword():void{this.showPassword.update(value=>!value);}
 async submit(event:Event,emailInput:HTMLInputElement,passwordInput:HTMLInputElement,
  consentInput:HTMLInputElement):Promise<void>{
  event.preventDefault();
  if(this.busy())return;
  const email=emailInput.value.trim(),password=passwordInput.value;
  // Password must never enter a signal, account metadata or storage.
  passwordInput.value='';
  if(!email||!emailInput.validity.valid){
   this.message.set('Informe um email válido.');return;
  }
  if(this.mode()!=='reset'&&password.length<(this.mode()==='signup'?8:6)){
   this.message.set('A senha é muito curta.');return;
  }
  if(this.mode()==='signup'&&!consentInput.checked){
   this.message.set('Leia e aceite os termos antes de criar sua conta.');return;
  }
  await this.execute(async()=>{
   if(this.mode()==='reset'){
    await this.requireClient().resetPassword(email);
    this.message.set('Se a conta existir, enviaremos instruções ao email informado.');
    return;
   }
   if(this.mode()==='signup'){
    try{
     await this.connected(await this.requireClient().signUp(email,password));
     this.message.set('Conta criada. Confirme seu email para continuar.');
    }catch(error){
     if(this.requireClient().hasSession)this.view.set('verify');
     throw error;
    }
   }else{
    await this.connected(await this.requireClient().signIn(email,password));
   }
  });
 }
 private async connected(profile:AccountProfile):Promise<void>{
  this.accountEmail.set(profile.email);
  if(!profile.emailVerified){
   this.clearDashboard();this.accountEmail.set(profile.email);
   this.view.set('verify');
   this.message.set('Confirme seu email para liberar os saves.');
   return;
  }
  // Never show the dashboard until the backend has authorized this UID.
  await this.refreshAccount();
  this.view.set('dashboard');
  this.message.set('Conta conectada. Seu save local foi preservado.');
 }
 private async refreshAccount():Promise<void>{
  const client=this.requireClient();
  const [account,save]=await Promise.all([
   client.api('/v1/account'),client.api('/v1/saves/main')
  ]);
  const coins=Number(account['cookiesBalance']);
  if(!Number.isFinite(coins)||coins<0)throw new AccountError('Saldo inválido recebido da API.');
  this.cookies.set(coins);
  const revision=save['revision'],updatedAt=save['updatedAt'];
  if(revision!==null&&typeof revision!=='string')
   throw new AccountError('Versão do save inválida recebida da API.');
  this.remote.set({
   revision,save:save['save']??null,
   updatedAt:typeof updatedAt==='string'?updatedAt:null
  });
 }
 async refresh():Promise<void>{
  await this.execute(async()=>{
   await this.refreshAccount();
   this.message.set('Conta e save conferidos. Nenhum arquivo foi enviado.');
  });
 }
 async verifyAgain():Promise<void>{
  await this.execute(async()=>{
   await this.requireClient().refresh();
   await this.connected(await this.requireClient().profile());
  });
 }
 async resendVerification():Promise<void>{
  await this.execute(async()=>{
   await this.requireClient().sendVerification();
   this.message.set('Email de confirmação reenviado. Confira também o spam.');
  });
 }
 signOut():void{
  if(this.busy())return;
  this.requireClient().signOut();this.clearDashboard();
  this.view.set('auth');this.mode.set('login');
  this.message.set('Você saiu da conta. Seus dados locais foram preservados.');
 }
 selectFile(event:Event):void{
  if(event.target instanceof HTMLInputElement)
   this.filename.set(event.target.files?.[0]?.name??'');
 }
 private async validateSave(text:string):Promise<unknown>{
  if(text.length>2000000)throw new AccountError('O save deve ter no máximo 2 MB.');
  // Reuse the game's domain validator, not the old institutional DOM handlers.
  const modulePath='/game/js/sim/saveTransfer.js';
  const validator=await import(/* @vite-ignore */ modulePath) as {
   parseImportedSave(input:string):unknown
  };
  if(typeof validator.parseImportedSave!=='function')
   throw new AccountError('Validação de save temporariamente indisponível.');
  validator.parseImportedSave(text);
  return JSON.parse(text) as unknown;
 }
 async prepareUpload(event:Event,input:HTMLInputElement,dialog:HTMLDialogElement):Promise<void>{
  event.preventDefault();
  if(this.busy()||!this.remote())return;
  await this.execute(async()=>{
   const file=input.files?.[0];
   if(!file)throw new AccountError('Selecione um arquivo JSON.');
   if(file.size>2000000)throw new AccountError('O save deve ter no máximo 2 MB.');
   const payload=await this.validateSave(await file.text());
   this.uploadedSave=payload;
   this.uploadedInput=input;
   this.changeDetector.detectChanges();
   dialog.returnValue='cancel';
   dialog.showModal();
   this.message.set('Revise a confirmação antes de enviar.');
  });
 }
 async onUploadDialogClose(dialog:HTMLDialogElement):Promise<void>{
  const payload=this.uploadedSave;this.uploadedSave=null;
  const input=this.uploadedInput;this.uploadedInput=null;
  if(dialog.returnValue!=='confirm'||payload===null)return;
  const expectedRevision=this.remote()?.revision;
  if(expectedRevision===undefined){this.message.set('Atualize o save antes de enviar.');return;}
  await this.execute(async()=>{
   await this.requireClient().api('/v1/saves/main',{expectedRevision,save:payload});
   if(input)input.value='';this.filename.set('');
   await this.refreshAccount();
   this.message.set('Save confirmado na nuvem. Seu arquivo e save local foram preservados.');
  });
 }
 async downloadSave(backup:boolean):Promise<void>{
  await this.execute(async()=>{
   const result=await this.requireClient().api('/v1/saves/main'+(backup?'?backup=true':''));
   if(!result['save']){
    this.message.set(backup?'Ainda não existe backup recuperável.':'Ainda não existe save na nuvem.');
    return;
   }
   const raw=JSON.stringify(result['save']);
   await this.validateSave(raw);
   const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
   try{
    const link=document.createElement('a');
    link.href=url;
    link.download=backup?'lhs-backup-nuvem.json':'lhs-save-nuvem.json';
    link.click();
   }finally{setTimeout(()=>URL.revokeObjectURL(url),1500);}
   this.message.set('Arquivo preparado. Importe-o pelo menu do jogo.');
  });
 }
}
