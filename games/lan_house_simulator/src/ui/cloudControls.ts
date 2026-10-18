import type {GameState} from "../sim/types.js";
import {parseImportedSave,serializeSave} from "../sim/saveTransfer.js";
import {COOKIE_COSMETICS,cosmeticsOwned,setVerifiedCosmetics,toggleVerifiedCosmetic,type CookieCosmeticId} from "../sim/premiumCosmetics.js";
import {vipProductThumbnail} from "./vipProductArt.js";
import {yearFromMinutes} from "../sim/historicalEconomy.js";
import {createAccountClient,type AccountClient,type AccountProfile} from "./accountClient.js";

interface CloudConfig {enabled:boolean;apiUrl:string;firebaseApiKey:string}
interface WalletEntry {id:string;type:string;delta:number;itemId:string|null;at:string|null;mode?:string}
interface Account {
 uid:string;cookiesBalance:number;cookiesSpentTotal:number;
 entitlements:string[];transactions:WalletEntry[];historyLimit?:number
}
interface ServerItem {name?:string;cookies:number;unlockYear?:number}
interface StoreConfig {
 paymentsEnabled:boolean;paymentsMode?:"sandbox"|"production";
 packages?:Record<string,{cookies:number;priceCents:number}>;
 items?:Record<string,ServerItem>
}
type Tab="summary"|"catalog"|"inventory"|"history"|"cloud";
const cookiesText=(amount:number)=>amount.toLocaleString("pt-BR")+" Cookies";
const brl=(cents:number)=>(cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const priceToBrl=(cookies:number)=>brl(cookies*10);
function button(text:string,className="slice"):HTMLButtonElement{
 const el=document.createElement("button");el.type="button";el.className=className;el.textContent=text;return el;
}
function line(text:string,cls=""):HTMLElement{
 const node=document.createElement("p");node.className=cls;node.textContent=text;return node;
}
export function mountCloudControls(
 _anchor:HTMLElement,getState:()=>GameState,restore:(state:GameState)=>void
):void{
 const dialog=document.createElement("dialog");
 dialog.id="player-account";dialog.className="account-dialog";
 dialog.setAttribute("aria-labelledby","account-heading");
 // Os controles são exclusivos deste diálogo; nenhuma informação do servidor
 // é inserida usando innerHTML.
 dialog.innerHTML=`
  <header class="account-header">
   <div><span class="account-eyebrow">SEU PERFIL · SOFTDOWN</span>
    <h2 id="account-heading">Minha Conta</h2>
    <p>Cookies, itens adquiridos e histórico de movimentações.</p>
   </div><button id="account-close" class="slice" type="button" aria-label="Fechar Minha Conta">Fechar ✕</button>
  </header>
  <nav class="account-tabs" aria-label="Seções de Minha Conta">
   <button type="button" data-account-tab="summary">Resumo</button>
   <button type="button" data-account-tab="catalog">Loja Cookies</button>
   <button type="button" data-account-tab="inventory">Meus itens</button>
   <button type="button" data-account-tab="history">Histórico</button>
   <button type="button" data-account-tab="cloud">Nuvem</button>
  </nav>
  <div id="account-alert" class="account-alert" role="status" aria-live="polite"></div>
  <section data-account-page="summary" aria-label="Resumo da conta">
   <div class="account-stats">
    <div><small>Saldo disponível</small><strong id="account-balance">—</strong></div>
    <div><small>Cookies gastos em itens</small><strong id="account-spent">—</strong></div>
    <div><small>Itens adquiridos</small><strong id="account-owned">—</strong></div>
   </div>
   <p id="account-connection" class="account-subtext"></p>
   <div class="account-actions"><button id="account-refresh" class="slice" type="button">Atualizar saldo e itens</button></div>
   <details id="account-login-box" class="account-auth" open>
    <summary>Entrar ou criar conta</summary>
    <p>Conta opcional. Seu jogo local funciona sem cadastro.</p>
    <label>E-mail<input id="account-email" type="email" autocomplete="email" placeholder="seu@email.com"/></label>
    <label>Senha<input id="account-password" type="password" autocomplete="current-password" placeholder="Sua senha"/></label>
    <div class="account-actions">
     <button id="account-signin" type="button">Entrar</button>
     <button id="account-signup" type="button">Criar conta</button>
     <button id="account-recovery" type="button">Recuperar senha</button>
    </div>
   </details>
   <div class="account-actions"><button id="account-logout" type="button">Sair da conta</button></div>
   <div id="account-donate"></div>
   <p class="account-footnote">Cookies são separados dos R$ fictícios da lan house.
   Não podem ser sacados. Os itens são opcionais e não dão vantagem econômica.</p>
  </section>
  <section data-account-page="catalog" aria-label="Loja de Cookies" hidden>
   <p class="account-subtext">Conheça os cosméticos e os preços. Resgates só ficam
    disponíveis com conta verificada, saldo suficiente e catálogo habilitado no servidor.</p>
   <div id="account-catalog" class="account-items"></div>
  </section>
  <section data-account-page="inventory" aria-label="Itens adquiridos" hidden>
   <p class="account-subtext">Equipe ou desequipe os itens que já pertencem à sua conta.</p>
   <div id="account-inventory" class="account-items"></div>
  </section>
  <section data-account-page="history" aria-label="Histórico de Cookies" hidden>
   <p class="account-subtext">Movimentações confirmadas pelo servidor, não pelo arquivo de save.</p>
   <div id="account-transactions" class="account-ledger"></div>
  </section>
  <section data-account-page="cloud" aria-label="Progresso na nuvem" hidden>
   <p class="account-subtext">Salve ou restaure sua partida na conta. Seu save local nunca é apagado automaticamente.</p>
   <div class="account-actions">
    <button id="account-cloud-check" type="button">Consultar nuvem</button>
    <button id="account-cloud-save" type="button">Salvar na nuvem</button>
    <button id="account-cloud-load" type="button">Restaurar partida</button>
    <button id="account-cloud-backup" type="button">Restaurar backup</button>
   </div>
   <p id="account-cloud-state" class="account-subtext"></p>
  </section>
 `;
 document.body.append(dialog);
 const find=<T extends HTMLElement=HTMLElement>(selector:string)=>dialog.querySelector<T>(selector)!;
 const alert=find("#account-alert");
 const balance=find("#account-balance"),spent=find("#account-spent"),owned=find("#account-owned");
 const connection=find("#account-connection"),authBox=find<HTMLDetailsElement>("#account-login-box");
 const email=find<HTMLInputElement>("#account-email"),password=find<HTMLInputElement>("#account-password");
 const catalog=find("#account-catalog"),inventory=find("#account-inventory"),history=find("#account-transactions");
 const donate=find("#account-donate"),cloudState=find("#account-cloud-state");
 let config:CloudConfig|null=null,store:StoreConfig|null=null,client:AccountClient|null=null;
 let account:Account|null=null,revision:string|null|undefined;
 let tab:Tab="summary",loading=false,openOfflineReason="A conexão de conta ainda não está disponível nesta versão.";
 const unequipped=new Set<CookieCosmeticId>();
 const controls=Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
 const cosmeticName=(id:string)=>COOKIE_COSMETICS.find(i=>i.id===id)?.name??"Item "+id;
 const isConfigured=()=>!!(config?.enabled&&config.apiUrl.startsWith("https://")&&config.firebaseApiKey);
 const status=(message:string,kind:"info"|"error"|"success"="info")=>{
  alert.textContent=message;alert.dataset.kind=kind;
 };
 function switchTab(next:Tab){
  tab=next;
  for(const section of Array.from(dialog.querySelectorAll<HTMLElement>("[data-account-page]")))
   section.hidden=section.dataset.accountPage!==next;
  for(const btn of Array.from(dialog.querySelectorAll<HTMLButtonElement>("[data-account-tab]")))
   btn.setAttribute("aria-selected",String(btn.dataset.accountTab===next));
 }
 function setBusy(active:boolean){
  loading=active;
  for(const b of controls)b.disabled=active;
  // Não executa requisições durante cada frame de renderização.
 }
 async function action(fn:()=>Promise<void>){
  if(loading)return;
  setBusy(true);
  try{await fn();}
  catch(e){if((e as {status?:number})?.status===401)clearAccount();status(e instanceof Error?e.message:"Não foi possível concluir. A partida local permanece salva.","error");}
  finally{setBusy(false);render();}
 }
 function clearAccount(){
  client?.signOut();account=null;revision=undefined;
  setVerifiedCosmetics([]);unequipped.clear();
 }
 function synchronizeAccount(next:Account){
  account=next;
  setVerifiedCosmetics(Array.isArray(next.entitlements)?next.entitlements:[]);
  for(const id of unequipped)toggleVerifiedCosmetic(id,false);
  render();
 }
 const refresh=async()=>{
  if(!client?.hasSession())throw Error("Entre na conta para consultar seu saldo.");
  const data=await api("/v1/account") as Account;
  if(!Number.isSafeInteger(data.cookiesBalance)||!Number.isSafeInteger(data.cookiesSpentTotal)||!Array.isArray(data.entitlements)||!Array.isArray(data.transactions))throw Error("Dados da conta indisponíveis. Tente atualizar novamente.");
  synchronizeAccount(data);
  status("Saldo, itens e movimentações atualizados.","success");
 };
 async function connected(profile:AccountProfile){
  if(!profile.emailVerified){account=null;setVerifiedCosmetics([]);throw Error("Confirme seu email para acessar os Cookies. Use Minha conta no site para reenviar a confirmação.");}
  revision=undefined;unequipped.clear();await refresh();authBox.open=false;
 }
 async function api(path:string,body?:object):Promise<unknown>{
  if(!client||!isConfigured())throw Error("Entre na conta primeiro.");
  return client.api(path,body);
 }
 function createCosmeticCard(item:typeof COOKIE_COSMETICS[number],isOwned:boolean){
  const el=document.createElement("article");el.className="account-item";
  const icon=document.createElement("div");
  icon.className="account-item-art";
  icon.dataset.cosmetic=item.id;
  icon.setAttribute("aria-hidden","true");
  const premiumArt=vipProductThumbnail(item.id);
  if(premiumArt){
   const img=document.createElement("img");img.src=premiumArt;
   img.alt="";img.loading="lazy";icon.append(img);
  }else{
   icon.textContent=({"headset-rgb-neon":"🎧","chair-gamer-neon":"💺","keyboard-rainbow-rgb":"⌨",
    "neon-open-sign":"✦","arcade-checker-floor":"▦","exclusive-arcade-posters":"▣"} as Record<string,string>)[item.id]??"✧";
  }
  const info=document.createElement("div");info.className="account-item-info";
  const name=document.createElement("strong");name.textContent=item.name;
  const detail=line(`${item.cookies} Cookies · ${priceToBrl(item.cookies)} · desde ${item.unlockYear}`,"account-item-price");
  const desc=line(item.description,"account-item-description");
  info.append(name,detail,desc);
  const control=document.createElement("div");control.className="account-item-control";
  const usable=yearFromMinutes(getState().totalMinutes)>=item.unlockYear;
  if(isOwned){
   const label=document.createElement("label");label.className="account-toggle";
   const check=document.createElement("input");check.type="checkbox";
   check.checked=!unequipped.has(item.id);
   check.dataset.premiumCosmetic=item.id;
   check.addEventListener("change",()=>{
    if(!toggleVerifiedCosmetic(item.id,check.checked)){
     check.checked=false;return;
    }
    if(check.checked)unequipped.delete(item.id);else unequipped.add(item.id);
    status(check.checked?"Item equipado.":"Item desequipado.");
   });
   label.append(check,document.createTextNode(check.checked?" Equipado":" Desequipado"));
   check.addEventListener("change",()=>{label.lastChild!.textContent=check.checked?" Equipado":" Desequipado";});
   control.append(line(usable?"Adquirido":"Aguardando ano de uso","account-owned-label"),label);
  }else{
   const buy=button("Resgatar · "+item.cookies+" Cookies");
   const server=store?.items?.[item.id];
   const enabled=!!(!loading&&client?.hasSession()&&account&&server?.cookies===item.cookies&&
    account.cookiesBalance>=item.cookies&&isConfigured());
   buy.disabled=!enabled;
   buy.title=!client?.hasSession()?"Entre na conta para resgatar":
    !server?"Catálogo do servidor ainda não está habilitado":
    server.cookies!==item.cookies?"Preço não confirmado pelo servidor":
    account&&account.cookiesBalance<item.cookies?"Cookies insuficientes":"";
   buy.addEventListener("click",()=>void action(async()=>{
    if(!client?.hasSession()||!account||store?.items?.[item.id]?.cookies!==item.cookies)
     throw Error("Este item não está liberado no servidor.");
    if(!window.confirm(`Resgatar ${item.name} por ${item.cookies} Cookies? O desconto é permanente.`))return;
    await api("/v1/items/"+encodeURIComponent(item.id)+"/purchase",{});
    await refresh();switchTab("inventory");
    status("Item resgatado e registrado na sua conta.","success");
   }));
   control.append(buy);
  }
  el.append(icon,info,control);return el;
 }
 function render(){
  balance.textContent=account?cookiesText(account.cookiesBalance):"—";
  spent.textContent=account?cookiesText(account.cookiesSpentTotal):"—";
  owned.textContent=account?String(account.entitlements.filter(id=>COOKIE_COSMETICS.some(i=>i.id===id)).length):"—";
  connection.textContent=client?.hasSession()&&account?"Conta conectada. Saldo e resgates verificados pelo servidor.":
   isConfigured()?"Faça login para ver os seus Cookies. Nenhum saldo é estimado pelo jogo.":openOfflineReason;
  authBox.hidden=!isConfigured();
  find<HTMLButtonElement>("#account-refresh").disabled=!client?.hasSession()||loading;
  find<HTMLButtonElement>("#account-logout").disabled=!client?.hasSession()||loading;
  catalog.replaceChildren();
  const ownedIds=new Set(account?.entitlements??[]);
  for(const item of COOKIE_COSMETICS)catalog.append(createCosmeticCard(item,ownedIds.has(item.id)));
  inventory.replaceChildren();
  const acquired=COOKIE_COSMETICS.filter(item=>ownedIds.has(item.id));
  if(!client?.hasSession())inventory.append(line("Entre na sua conta para consultar os itens adquiridos.","account-empty"));
  else if(!acquired.length)inventory.append(line("Nenhum cosmético adquirido ainda.","account-empty"));
  else for(const item of acquired)inventory.append(createCosmeticCard(item,true));
  history.replaceChildren();
  if(!client?.hasSession())history.append(line("Entre na sua conta para ver seu histórico.","account-empty"));
  else if(!account?.transactions?.length)history.append(line("Nenhuma movimentação registrada.","account-empty"));
  else{
   for(const move of account.transactions){
    const article=document.createElement("article");article.className="account-ledger-row";
    const name=document.createElement("strong");name.textContent=move.type==="item"?
      "Resgate: "+cosmeticName(move.itemId??""):move.delta>0?"Crédito de Cookies":"Ajuste de saldo";
    const meta=document.createElement("small");
    const date=move.at?new Date(move.at):null;
    meta.textContent=(date&&!Number.isNaN(date.getTime())?date.toLocaleString("pt-BR"):"Data indisponível")+
      (move.mode==="sandbox"?" · teste":"");
    const amount=document.createElement("b");amount.textContent=(move.delta>0?"+":"")+move.delta+" Cookies";
    amount.dataset.sign=move.delta<0?"debit":"credit";
    const info=document.createElement("div");info.append(name,meta);
    article.append(info,amount);history.append(article);
   }
   if(account.transactions.length>=(account.historyLimit??40))
    history.append(line("Exibindo somente as movimentações recentes. O total de gastos considera todo o histórico.","account-subtext"));
  }
  renderDonate();
 }
 function renderDonate(){
  donate.replaceChildren();
  const title=document.createElement("strong");title.textContent="Apoiar o desenvolvimento";
  donate.append(title,line("R$ 5 = 50 Cookies · R$ 10 = 100 Cookies. Pagamento único.","account-subtext"));
  if(!store?.paymentsEnabled||!store?.packages){
   donate.append(line("Compra de Cookies ainda não disponível neste ambiente.","account-subtext"));return;
  }
  const link=document.createElement("a");link.href="/donate/";link.target="_top";
  link.className="slice";link.textContent="Adquirir Cookies no Donate";
  donate.append(link,line("Sua conta acompanha a navegação nesta aba. Depois do pagamento, volte e atualize o saldo.","account-subtext"));
 }
 async function cloudRead(backup=false,restoreGame=false){
  if(!client?.hasSession())throw Error("Entre na conta primeiro.");
  const result=await api("/v1/saves/main"+(backup?"?backup=true":"")) as {save?:object;revision:string|null};
  revision=result.revision;
  if(!result.save){cloudState.textContent="Não há save nesta posição da nuvem.";return;}
  if(restoreGame){
   const state=parseImportedSave(JSON.stringify(result.save));
   if(window.confirm(backup?"Restaurar o backup neste navegador?":"Restaurar a partida da nuvem neste navegador?"))
    restore(state);
  }
  cloudState.textContent=restoreGame?"Consulta concluída.":"Save encontrado na nuvem; revisão consultada. Restauração não foi automática.";
 }
 for(const btn of Array.from(dialog.querySelectorAll<HTMLButtonElement>("[data-account-tab]")))
  btn.addEventListener("click",()=>switchTab(btn.dataset.accountTab as Tab));
 find("#account-close").addEventListener("click",()=>dialog.close());
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
 for(const id of ["menu-account","open-account"]){
  document.getElementById(id)?.addEventListener("click",()=>{
   if(!dialog.open)dialog.showModal();switchTab("summary");
   render();if(client?.hasSession())void action(refresh);
  });
 }
 find("#account-refresh").addEventListener("click",()=>void action(refresh));
 find("#account-signin").addEventListener("click",()=>void action(async()=>{
  if(!client)throw Error(openOfflineReason);
  const entered=password.value;password.value="";
  clearAccount();await connected(await client.signIn(email.value.trim(),entered));
 }));
 find("#account-signup").addEventListener("click",()=>window.open("/conta/?modo=cadastro","_top"));
 find("#account-recovery").addEventListener("click",()=>window.open("/conta/?modo=recuperar","_top"));
 find("#account-logout").addEventListener("click",()=>void action(async()=>{
  clearAccount();password.value="";authBox.open=true;
  status("Conta desconectada. Seu progresso local permanece salvo.");
 }));
 find("#account-cloud-check").addEventListener("click",()=>void action(()=>cloudRead(false,false)));
 find("#account-cloud-load").addEventListener("click",()=>void action(()=>cloudRead(false,true)));
 find("#account-cloud-backup").addEventListener("click",()=>void action(()=>cloudRead(true,true)));
 find("#account-cloud-save").addEventListener("click",()=>void action(async()=>{
  if(revision===undefined)throw Error("Consulte a nuvem antes de salvar.");
  const result=await api("/v1/saves/main",{expectedRevision:revision,
   save:JSON.parse(serializeSave(getState()))}) as {revision:string};
  revision=result.revision;
  cloudState.textContent="Save confirmado na nuvem. O save local permanece preservado.";
 }));
 switchTab("summary");
 status("Sua conta é opcional. A partida gratuita funciona normalmente.");
 render();
 void (async()=>{
  try{
   const response=await fetch("./online-config.json",{cache:"no-store"});
   config=await response.json() as CloudConfig;
   if(!isConfigured()){
    openOfflineReason="Minha Conta está pronta, mas a conexão online deste deploy está desativada. O saldo só aparecerá depois da configuração do login.";
    status(openOfflineReason);render();return;
   }
   client=createAccountClient(config!);
   const res=await fetch(config!.apiUrl+"/v1/config",{signal:AbortSignal.timeout(20_000)});
   if(!res.ok)throw Error("Configuração do servidor indisponível.");
   store=await res.json() as StoreConfig;
   if(client.hasSession())await action(async()=>{const profile=await client!.restore();if(profile)await connected(profile);});
   else status("Entre na conta para consultar seus Cookies e cosméticos.");
  }catch{
   openOfflineReason="Não foi possível conectar à conta neste momento. Nenhum saldo foi alterado.";
   status(openOfflineReason,"error");
  }
  render();
 })();
}
