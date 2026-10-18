import {createAccountClient} from './account-client.mjs';
import {createDonateController} from './donate-client.mjs';
const root=document.querySelector('#account-app');
if(root)void mount().catch(()=>{document.querySelector('#account-status').textContent='Conta temporariamente indisponível. Você pode continuar jogando sem login.';});
async function mount(){
 const $=id=>document.getElementById(id),status=$('account-status');
 const config=await fetch('/account-config.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});
 if(!config.enabled){status.textContent='O terminal da conta está em preparação. Cadastro e login ainda não foram liberados. Seu jogo continua disponível sem conta.';return;}
 const client=createAccountClient(config);let mode='login',revision,hasSave=false,busy=false;
 const donate=root.dataset.purpose==='donate';
 const donations=donate?createDonateController(client):null;
 if(donations)void donations.initialize(config.apiUrl);
 function view(name){for(const key of ['auth','verify','dashboard'])$(key+'-view').hidden=key!==name;}
 function setMode(value){
  mode=value;const signup=mode==='signup',reset=mode==='reset';
  $('auth-title').textContent=signup?'Seu salão merece uma conta.':reset?'Vamos recuperar seu acesso.':'Bom ter você de volta.';
  $('auth-copy').textContent=reset?'Informe seu email para receber as instruções de recuperação.':'Use seu email e uma senha pessoal.';
  $('auth-submit').textContent=signup?'Criar minha conta':reset?'Enviar instruções':'Entrar na conta';
  $('password-field').hidden=reset;$('account-password').required=!reset;$('account-password').minLength=signup?8:6;$('account-password').autocomplete=signup?'new-password':'current-password';
  $('signup-notice').hidden=!signup;$('account-terms').required=signup;$('password-hint').hidden=!signup;$('forgot-password').hidden=reset;
  for(const tab of root.querySelectorAll('[data-auth-mode]'))tab.setAttribute('aria-pressed',String(tab.dataset.authMode===mode));
  $('account-password').value='';status.textContent='';
 }
 async function run(action){
  if(busy)return;busy=true;const controls=[...root.querySelectorAll('button,input')],states=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);root.setAttribute('aria-busy','true');status.textContent='Conectando…';
  try{await action();}catch(error){
   status.textContent=error.message||'Não foi possível concluir. Seu progresso local foi preservado.';
   if(error.status===409){revision=undefined;status.textContent+=' Use “Atualizar conta e conferir save” antes de decidir enviar novamente.';}
   if(error.status===401){client.signOut();revision=undefined;view('auth');}
  }finally{controls.forEach((el,i)=>el.disabled=states[i]);if(!donate){$('download-main').disabled=!hasSave;$('upload-save').disabled=revision===undefined;}root.removeAttribute('aria-busy');busy=false;}
 }
 async function update(){
  const [account,save]=await Promise.all([client.api('/v1/account'),donate?Promise.resolve(null):client.api('/v1/saves/main')]);
  $('cookies-balance').textContent=Number(account.cookiesBalance).toLocaleString('pt-BR');
  if(donate){await donations.history();return;}
  revision=save.revision;hasSave=!!save.save;$('save-state').textContent=hasSave?'Salvo na nuvem':'Seu primeiro save';
  $('save-date').textContent=save.updatedAt?'Confirmado em '+new Date(save.updatedAt).toLocaleString('pt-BR'):'Nenhuma partida enviada ainda';
 }
 async function connected(profile){
  $('player-email').textContent=profile.email;
  if(!profile.emailVerified){view('verify');status.textContent='Confirme seu email para acessar o painel.';return;}
  // Only expose the connected dashboard after the backend authorizes this UID.
  await update();view('dashboard');status.textContent='Conta conectada. Seu progresso local foi preservado.';
  donations?.setConnected(true);
 }
 $('auth-fields').disabled=false;status.textContent='Conta opcional. Entre ou crie seu acesso.';
 for(const tab of root.querySelectorAll('[data-auth-mode]'))tab.addEventListener('click',()=>setMode(tab.dataset.authMode));
 $('forgot-password').addEventListener('click',()=>setMode('reset'));
 $('show-password').addEventListener('click',()=>{const visible=$('account-password').type==='password';$('account-password').type=visible?'text':'password';$('show-password').textContent=visible?'Ocultar':'Mostrar';$('show-password').setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');$('show-password').setAttribute('aria-pressed',String(visible));});
 $('auth-form').addEventListener('submit',event=>{event.preventDefault();const email=$('account-email').value.trim(),password=$('account-password').value;$('account-password').value='';void run(async()=>{
  if(mode==='reset'){await client.resetPassword(email);status.textContent='Se a conta existir, enviaremos as instruções por email.';return;}
  if(mode==='signup'){
   try{await connected(await client.signUp(email,password));status.textContent='Conta criada. Abra o email de confirmação para continuar.';}
   catch(error){if(client.hasSession())view('verify');throw error;}
  }else await connected(await client.signIn(email,password));
 });});
 $('check-email').addEventListener('click',()=>void run(async()=>{await client.refresh();await connected(await client.profile());}));
 $('resend-email').addEventListener('click',()=>void run(async()=>{await client.sendVerification();status.textContent='Email de confirmação reenviado. Confira a caixa de spam.';}));
 for(const button of root.querySelectorAll('[data-signout]'))button.addEventListener('click',()=>{client.signOut();donations?.setConnected(false);revision=undefined;hasSave=false;if(!donate){$('save-file').value='';$('save-state').textContent='Consultando…';$('save-date').textContent='';}$('player-email').textContent='';$('cookies-balance').textContent='—';view('auth');setMode('login');status.textContent='Você saiu da conta. Seus saves locais foram preservados.';});
 if(donate)return;
 $('refresh-account').addEventListener('click',()=>void run(async()=>{await update();status.textContent='Conta e save conferidos. Nenhum arquivo foi enviado.';}));
 async function download(backup){
  const result=await client.api('/v1/saves/main'+(backup?'?backup=true':''));
  if(!result.save){status.textContent=backup?'Ainda não há backup recuperável.':'Ainda não há save na nuvem.';return;}
  const {parseImportedSave}=await import('/game/js/sim/saveTransfer.js');parseImportedSave(JSON.stringify(result.save));
  const url=URL.createObjectURL(new Blob([JSON.stringify(result.save)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=backup?'lhs-backup-nuvem.json':'lhs-save-nuvem.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Arquivo preparado para download. Importe-o pelo menu do jogo para continuar a partida.';
 }
 $('download-main').addEventListener('click',()=>void run(()=>download(false)));$('download-backup').addEventListener('click',()=>void run(()=>download(true)));
 $('upload-form').addEventListener('submit',event=>{event.preventDefault();void run(async()=>{
  const file=$('save-file').files?.[0];if(!file)throw Error('Selecione seu arquivo de save.');if(file.size>2_000_000)throw Error('O save deve ter no máximo 2 MB.');if(revision===undefined)throw Error('Confira o save da nuvem antes de enviar.');
  const {parseImportedSave}=await import('/game/js/sim/saveTransfer.js');const text=await file.text();parseImportedSave(text);const save=JSON.parse(text);
  if(!window.confirm(hasSave?'Substituir o save principal da nuvem? A versão anterior ficará no backup. Seu save local não será alterado.':'Enviar este arquivo como seu primeiro save na nuvem?')){status.textContent='Envio cancelado. Nenhum save foi alterado.';return;}
  const result=await client.api('/v1/saves/main',{expectedRevision:revision,save});revision=result.revision;hasSave=true;$('save-file').value='';
  await update();status.textContent='Save confirmado na nuvem. Seu arquivo e o progresso local foram preservados.';
 });});
}
