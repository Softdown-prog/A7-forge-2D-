import type { AccountCosmetic,AccountGamePort,CookieCosmeticId } from "../application/accountGamePort.js";
import { createAccountClient,type AccountClient,type AccountProfile } from "./accountClient.js";
import {renderCosmeticCard} from "./account/cosmeticCard.js";
import {ensureAccountDialog} from "./account/dialog.js";

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
function line(text:string,cls=""):HTMLElement{
 const node=document.createElement("p");node.className=cls;node.textContent=text;return node;
}
export function mountCloudControls(
 _anchor:HTMLElement,port:AccountGamePort
):void{
 const COOKIE_COSMETICS=port.catalog;
 const dialog=ensureAccountDialog();
 const find=<T extends HTMLElement=HTMLElement>(selector:string)=>dialog.querySelector<T>(selector)!;
 const alert=find("#account-alert");
 const balance=find("#account-balance"),spent=find("#account-spent"),owned=find("#account-owned");
 const connection=find("#account-connection"),authBox=find<HTMLDetailsElement>("#account-login-box");
 const email=find<HTMLInputElement>("#account-email"),password=find<HTMLInputElement>("#account-password");
 const catalog=find("#account-catalog"),inventory=find("#account-inventory"),history=find("#account-transactions");
 const donate=find("#account-donate"),cloudState=find("#account-cloud-state");
 let config:CloudConfig|null=null,store:StoreConfig|null=null,client:AccountClient|null=null;
 let account:Account|null=null,revision:string|null|undefined;
 let loading=false,openOfflineReason="A conexão de conta ainda não está disponível nesta versão.";
 const unequipped=new Set<CookieCosmeticId>();
 const controls=Array.from(dialog.querySelectorAll<HTMLButtonElement>("button"));
 const cosmeticName=(id:string)=>COOKIE_COSMETICS.find(i=>i.id===id)?.name??"Item "+id;
 const isConfigured=()=>!!(config?.enabled&&config.apiUrl.startsWith("https://")&&config.firebaseApiKey);
 const status=(message:string,kind:"info"|"error"|"success"="info")=>{
  alert.textContent=message;alert.dataset.kind=kind;
 };
 function switchTab(next:Tab){
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
  port.verifyCosmetics([]);unequipped.clear();
 }
 function synchronizeAccount(next:Account){
  account=next;
  port.verifyCosmetics(Array.isArray(next.entitlements)?next.entitlements:[]);
  for(const id of unequipped)port.toggleCosmetic(id,false);
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
  if(!profile.emailVerified){account=null;port.verifyCosmetics([]);throw Error("Confirme seu email para acessar os Cookies. Use Minha conta no site para reenviar a confirmação.");}
  revision=undefined;unequipped.clear();await refresh();authBox.open=false;
 }
 async function api(path:string,body?:object):Promise<unknown>{
  if(!client||!isConfigured())throw Error("Entre na conta primeiro.");
  return client.api(path,body);
 }
  function createCosmeticCard(item:AccountCosmetic,isOwned:boolean):HTMLElement{
   return renderCosmeticCard(item,isOwned,{
    year:port.year(),unequipped,loading,hasSession:!!client?.hasSession(),
    balance:account?.cookiesBalance??null,
    serverPrice:store?.items?.[item.id]?.cookies,configured:isConfigured(),
    onToggle:(id,enabled)=>port.toggleCosmetic(id,enabled),onStatus:status,
    onRedeem:redeem
   });
  }
  function redeem(item:AccountCosmetic):void{
   void action(async()=>{
    if(!client?.hasSession()||!account||store?.items?.[item.id]?.cookies!==item.cookies)
     throw Error("Este item não está liberado no servidor.");
    if(!window.confirm(`Resgatar ${item.name} por ${item.cookies} Cookies? O desconto é permanente.`))return;
    await api("/v1/items/"+encodeURIComponent(item.id)+"/purchase",{});
    await refresh();switchTab("inventory");
    status("Item resgatado e registrado na sua conta.","success");
   });
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
   const restore=port.prepareRestore(JSON.stringify(result.save));
   if(window.confirm(backup?"Restaurar o backup neste navegador?":"Restaurar a partida da nuvem neste navegador?"))
    restore();
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
   save:JSON.parse(port.exportSaveText())}) as {revision:string};
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
