import type { GameState } from '../sim/types.js';
import {parseImportedSave,serializeSave} from '../sim/saveTransfer.js';
import {COOKIE_COSMETICS,cosmeticsOwned,setVerifiedCosmetics,toggleVerifiedCosmetic} from '../sim/premiumCosmetics.js';
interface CloudConfig {enabled:boolean;apiUrl:string;firebaseApiKey:string}
interface AuthSession {idToken:string;refreshToken:string;localId:string}
export function mountCloudControls(anchor:HTMLElement,getState:()=>GameState,restore:(state:GameState)=>void):void {
 void setup().catch(()=>{}); // Offline play never depends on online configuration.
 async function setup():Promise<void>{
  const config=await fetch('./online-config.json',{cache:'no-store'}).then(r=>r.json()) as CloudConfig;
  if(!config.enabled)return;
  if(!config.apiUrl.startsWith('https://')||!config.firebaseApiKey)return;
  let session:AuthSession|null=null;let revision:string|null|undefined;
  const panel=document.createElement('section');panel.setAttribute('aria-label','Conta e saves na nuvem');
  const title=document.createElement('p');title.textContent='Conta opcional — seu jogo continua gratuito e salvo neste navegador.';
  const email=document.createElement('input');email.type='email';email.autocomplete='email';email.placeholder='Email';email.setAttribute('aria-label','Email da conta');
  const password=document.createElement('input');password.type='password';password.autocomplete='current-password';password.placeholder='Senha';password.setAttribute('aria-label','Senha da conta');
  const message=document.createElement('p');message.setAttribute('role','status');
  panel.append(title,email,password);anchor.after(panel);
  const cosmeticArea=document.createElement('section');
  cosmeticArea.setAttribute('aria-label','Aparência dos itens Cookies');
  const cosmeticTitle=document.createElement('p');cosmeticTitle.textContent='Itens Cookies da sua conta (cosméticos permanentes)';
  cosmeticArea.append(cosmeticTitle);
  const cosmeticInputs=new Map<string,HTMLInputElement>();
  for(const item of COOKIE_COSMETICS){
    const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px;margin:6px 0';
    const checkbox=document.createElement('input');checkbox.type='checkbox';
    checkbox.disabled=true;checkbox.dataset.premiumCosmetic=item.id;
    checkbox.addEventListener('change',()=>{
      if(!toggleVerifiedCosmetic(item.id,checkbox.checked))checkbox.checked=false;
    });
    label.append(checkbox,document.createTextNode(item.name+' · '+item.cookies+' Cookies'));
    cosmeticInputs.set(item.id,checkbox);cosmeticArea.append(label);
  }
  const cosmeticNote=document.createElement('small');
  cosmeticNote.textContent='Disponível apenas para itens já adquiridos na conta; não altera lucro nem a progressão.';
  cosmeticArea.append(cosmeticNote);
  panel.append(cosmeticArea);
  function syncCosmetics(account:{entitlements?:string[]} | null):void{
    setVerifiedCosmetics(Array.isArray(account?.entitlements)?account.entitlements:[]);
    const owned=new Set(cosmeticsOwned());
    for(const [id,input] of cosmeticInputs){
      input.disabled=!owned.has(id as typeof COOKIE_COSMETICS[number]['id']);
      input.checked=!input.disabled;
    }
  }
  syncCosmetics(null);
  async function identity(method:string,data:object):Promise<AuthSession>{
   const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(config.firebaseApiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20_000)});
   if(!response.ok)throw Error('Não foi possível autenticar. Confira email, senha e verificação do email.');return response.json() as Promise<AuthSession>;
  }
  async function api(path:string,body?:object,retried=false):Promise<any>{
   if(!session)throw Error('Entre na conta primeiro.');
   const response=await fetch(config.apiUrl+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${session.idToken}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30_000)});
   if(response.status===401&&!retried){
    const refreshed=await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.firebaseApiKey)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken}),signal:AbortSignal.timeout(20_000)});
    if(!refreshed.ok){session=null;revision=undefined;syncCosmetics(null);throw Error('Sessão expirada. Entre novamente.');}
    const value=await refreshed.json();session={...session,idToken:value.id_token,refreshToken:value.refresh_token};return api(path,body,true);
   }
   const result=await response.json();if(!response.ok)throw Error(result.error||'A nuvem está indisponível. Seu save local foi preservado.');return result;
  }
  async function load(backup=false):Promise<void>{
   const result=await api('/v1/saves/main'+(backup?'?backup=true':''));
   if(result.save){const state=parseImportedSave(JSON.stringify(result.save));if(window.confirm(backup?'Restaurar o backup da nuvem neste navegador?':'Restaurar a partida da nuvem neste navegador?'))restore(state);}
   revision=result.revision;message.textContent=result.save?'Save da nuvem consultado.':'Nenhum save na nuvem ainda.';
  }
  const buttons:HTMLButtonElement[]=[];
  function action(label:string,run:()=>Promise<void>):void{
   const button=document.createElement('button');button.type='button';button.textContent=label;buttons.push(button);panel.append(button);
   button.addEventListener('click',()=>{buttons.forEach(b=>b.disabled=true);message.textContent='Aguarde…';void run().catch((error:unknown)=>{message.textContent=error instanceof Error?error.message:'Não foi possível concluir. Seu save local foi preservado.';}).finally(()=>buttons.forEach(b=>b.disabled=false));});
  }
  action('Entrar',async()=>{session=await identity('signInWithPassword',{email:email.value,password:password.value,returnSecureToken:true});password.value='';revision=undefined;const account=await api('/v1/account');syncCosmetics(account);message.textContent=`Conta conectada. Cookies: ${account.cookiesBalance}.`;await load();});
  action('Criar conta',async()=>{const created=await identity('signUp',{email:email.value,password:password.value,returnSecureToken:true});password.value='';await identity('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:created.idToken});message.textContent='Conta criada. Confirme o email recebido e depois entre.';});
  action('Recuperar senha',async()=>{await identity('sendOobCode',{requestType:'PASSWORD_RESET',email:email.value});message.textContent='Se a conta existir, você receberá as instruções por email.';});
  action('Salvar na nuvem',async()=>{if(revision===undefined)throw Error('Carregue a nuvem antes de salvar para verificar conflitos.');const result=await api('/v1/saves/main',{expectedRevision:revision,save:JSON.parse(serializeSave(getState()))});revision=result.revision;message.textContent=`Save confirmado na nuvem em ${new Date().toLocaleString()}. O save local foi preservado.`;});
  action('Carregar nuvem',()=>load());action('Recuperar backup',()=>load(true));
  action('Sair da conta',async()=>{session=null;revision=undefined;syncCosmetics(null);password.value='';message.textContent='Conta desconectada. Seu progresso local foi preservado.';});
    action('Atualizar Cookies',async()=>{const account=await api('/v1/account');syncCosmetics(account);message.textContent=`Cookies da conta: ${account.cookiesBalance}.`;});
  const store=await fetch(config.apiUrl+'/v1/config',{signal:AbortSignal.timeout(20_000)}).then(r=>r.json()).catch(()=>null);
  if(store?.paymentsEnabled&&store.packages){
   const select=document.createElement('select');select.setAttribute('aria-label','Pacote de Cookies');
   for(const [packageId,value] of Object.entries(store.packages)){
    const pack=value as {cookies:number;priceCents:number};const option=document.createElement('option');option.value=packageId;option.textContent=`${pack.cookies} Cookies — ${(pack.priceCents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`;select.append(option);
   }
   panel.append(select);let pending:{packageId:string;key:string}|null=null;
   action('Comprar Cookies',async()=>{
    const packageId=select.value;if(!pending||pending.packageId!==packageId)pending={packageId,key:crypto.randomUUID()};
    if(!session)throw Error('Entre na conta para comprar Cookies.');
    const response=await fetch(config.apiUrl+'/v1/orders',{method:'POST',headers:{Authorization:`Bearer ${session.idToken}`,'Content-Type':'application/json','Idempotency-Key':pending.key},body:JSON.stringify({packageId}),signal:AbortSignal.timeout(30_000)});
    const order=await response.json();if(!response.ok)throw Error(order.error||'Não foi possível criar o pedido.');
    const checkout=new URL(order.url);if(checkout.protocol!=='https:'||!/(^|\.)mercadopago\.(com|com\.br)$/.test(checkout.hostname))throw Error('Link de pagamento inválido.');
    message.textContent='Pedido criado. O saldo só muda após confirmação do pagamento. ';
    const link=document.createElement('a');link.href=checkout.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=store.paymentsMode==='sandbox'?'Abrir checkout de teste':'Abrir checkout seguro';message.append(link);pending=null;
   });
  }
  panel.append(message);
 }
}
