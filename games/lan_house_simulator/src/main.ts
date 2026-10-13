import { serializeSave, parseImportedSave } from "./sim/saveTransfer.js";
import {SHOP_CATALOG,shopPrice,buyComputer,buyFurniture,type FurnitureKind} from "./sim/shop.js";
import { createGame, dayNumber, displayTime, online, pcCount, stepGame, isValidSave, applyResult } from "./sim/engine.js";
import { contractSupplier, expandShop, licenseGames, repairInternet, setHourlyPrice, stockItem, supplierLevel, wholesaleCost, upgradeInternet, repairComputer, monthlyBills, productPrice, setProductPrice, upgradeComputer } from "./sim/economy.js";
import { GAME_SAVE_KEY, type GameState, type Item } from "./sim/types.js";
import { SceneRenderer } from "./render/scene.js";
import { cameraForRoom, iso } from "./render/isometric.js";
import { roomWidth, pcWear, pcBroken } from "./sim/engine.js";
import { makeNineSlice } from "./ui/nineSlice.js";
import { playCandyDispense } from "./audio/vendingSfx.js";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const admin = document.querySelector<HTMLElement>("#admin");
const shop=document.querySelector<HTMLElement>("#shop");
const shopCatalog=document.querySelector<HTMLElement>("#shop-catalog");
const events = document.querySelector<HTMLElement>("#events");
const status = document.querySelector<HTMLElement>("#status");
const controls = document.querySelector<HTMLElement>("#open-admin");
if (!canvas || !admin || !events || !status || !controls) throw new Error("DOM do jogo incompleto");
const view = canvas.getContext("2d");
if (!view) throw new Error("Canvas 2D indisponível");
const renderer = new SceneRenderer(view);
document.documentElement.style.setProperty("--nine-slice", 'url("' + makeNineSlice() + '")');

function readSave(): GameState {
  try {
    const data = localStorage.getItem(GAME_SAVE_KEY);
    if (data) {
      const decoded: unknown = JSON.parse(data);
      if (isValidSave(decoded)) return decoded;
    }
  } catch { /* Navegação privada, save antigo ou JSON inválido. */ }
  return createGame();
}
let game = readSave();
const startScreen=document.querySelector<HTMLElement>("#start-screen");
const gameApp=document.querySelector<HTMLElement>("#game-app");
const continueButton=document.querySelector<HTMLButtonElement>("#menu-continue");
const settingsPanel=document.querySelector<HTMLElement>("#menu-settings");
const soundToggle=document.querySelector<HTMLInputElement>("#option-sound");
if(!startScreen||!gameApp||!continueButton||!settingsPanel||!soundToggle)throw new Error("Menu inicial incompleto");
let isPlaying=false;
let hasSavedGame=false;
try{hasSavedGame=localStorage.getItem(GAME_SAVE_KEY)!==null;}catch{}
let soundEnabled=true;
try{soundEnabled=localStorage.getItem("lhs.sound")!=="off";}catch{}
soundToggle.checked=soundEnabled;
continueButton.disabled=!hasSavedGame;
const importFile=document.querySelector<HTMLInputElement>("#save-import-file");
const saveMessage=document.querySelector<HTMLElement>("#save-message");
const exportButton=document.querySelector<HTMLButtonElement>("#save-export");
if(!importFile||!saveMessage||!exportButton)throw Error("Controles de save ausentes");
exportButton.disabled=!hasSavedGame;
function announceSave(message:string):void{saveMessage!.textContent=message;}
document.getElementById("save-export")?.addEventListener("click",()=>{
 if(!hasSavedGame){announceSave("Nenhuma partida disponível para exportar.");return;}
 try{
  const blob=new Blob([serializeSave(game)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=url;
  link.download="lan-house-simulator-dia-"+dayNumber(game)+".json";
  document.body.append(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  announceSave("Arquivo JSON exportado. Guarde-o em local seguro.");
 }catch{announceSave("Não foi possível exportar esta partida.");}
});
document.getElementById("save-import")?.addEventListener("click",()=>importFile!.click());
importFile.addEventListener("change",async()=>{
 const file=importFile!.files?.[0];importFile!.value="";
 if(!file)return;
 if(file.size>2_000_000){announceSave("O arquivo excede o limite de 2 MB.");return;}
 try{
  const state=parseImportedSave(await file.text());
  if(!window.confirm("Importar esta partida? O progresso salvo neste navegador será substituído."))return;
  // Persistir ANTES de atualizar o estado visível; falha de armazenamento preserva a partida atual.
  localStorage.setItem(GAME_SAVE_KEY,JSON.stringify(state));
  game=state;hasSavedGame=true;
  previousServed=game.served;previousPurchases=game.purchases;
  paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;
  continueButton!.disabled=false;exportButton!.disabled=false;
  announceSave("Partida importada com sucesso. Clique em Continuar.");
 }catch(e){announceSave(e instanceof Error?e.message:"Não foi possível importar o arquivo.");}
});
function showMenu():void{
 isPlaying=false;startScreen!.hidden=false;gameApp!.hidden=true;
 continueButton!.disabled=!hasSavedGame;exportButton!.disabled=!hasSavedGame;adminOpen=false;shopOpen=false;
}
function beginPlay():void{
 isPlaying=true;startScreen!.hidden=true;gameApp!.hidden=false;
 renderUI();
}
document.getElementById("menu-new")?.addEventListener("click",()=>{
 if(hasSavedGame&&!window.confirm("Criar uma nova partida e substituir o progresso salvo?"))return;
 game=createGame();paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;
 previousServed=0;previousPurchases=0;save();beginPlay();
});
continueButton.addEventListener("click",()=>{if(hasSavedGame)beginPlay();});
document.getElementById("menu-options")?.addEventListener("click",()=>{
 settingsPanel!.hidden=!settingsPanel!.hidden;
 document.getElementById("menu-options")?.setAttribute("aria-expanded",String(!settingsPanel!.hidden));
});
soundToggle.addEventListener("change",()=>{soundEnabled=soundToggle!.checked;try{localStorage.setItem("lhs.sound",soundEnabled?"on":"off");}catch{}});
document.getElementById("open-menu")?.addEventListener("click",showMenu);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isPlaying)showMenu();});
let shopOpen=false;
let adminOpen = false;
let activeAdminTab="prices";
let previousServed = game.served;
let previousPurchases = game.purchases;
let sfxContext:AudioContext|null=null;
function audioContext():AudioContext|null{
  try{return sfxContext??=new AudioContext();}catch{return null;}
}
// Autoplay é bloqueado até o jogador tocar/clicar. Nenhum som é obrigatório para jogar.
window.addEventListener("pointerdown",()=>{void audioContext()?.resume().catch(()=>{});},{once:true});
const paymentPopups:Array<{amount:number;x:number;y:number;age:number}>=[];
const salePopups:Array<{amount:number;x:number;y:number;age:number}>=[];
const speechPopups:Array<{text:string;x:number;y:number;kind:"complaint"|"praise";age:number}>=[];
function paintPayments(dt:number):void {
  const camera=cameraForRoom(roomWidth(game));
  for(let i=paymentPopups.length-1;i>=0;i--){
    const effect=paymentPopups[i]!;
    effect.age+=dt;
    if(effect.age>=1.35){paymentPopups.splice(i,1);continue;}
    const at=iso({x:effect.x,y:effect.y},camera,94);
    const alpha=Math.min(1,(1.35-effect.age)/0.4);
    view!.save();view!.globalAlpha=alpha;
    view!.textAlign="center";view!.lineWidth=3.2;
    view!.font="bold 20px system-ui,sans-serif";
    const label="+R$ "+effect.amount;
    const height=effect.age*43;
    view!.strokeStyle="#103622";view!.fillStyle="#70F0A6";
    view!.strokeText(label,at.x,at.y-height);
    view!.fillText(label,at.x,at.y-height);
    view!.restore();
  }
}

function paintSales(dt:number):void {
 const camera=cameraForRoom(roomWidth(game));
 for(let i=salePopups.length-1;i>=0;i--){
  const effect=salePopups[i]!;
  effect.age+=dt;
  if(effect.age>=1.35){salePopups.splice(i,1);continue;}
  const at=iso({x:effect.x,y:effect.y},camera,110);
  view!.save();
  view!.globalAlpha=Math.min(1,(1.35-effect.age)/0.4);
  view!.textAlign="center";view!.lineWidth=3;
  view!.font="bold 17px system-ui,sans-serif";
  view!.strokeStyle="#103622";view!.fillStyle="#70F0A6";
  const label="+R$ "+effect.amount,y=at.y-effect.age*38;
  view!.strokeText(label,at.x,y);view!.fillText(label,at.x,y);
  view!.restore();
 }
}

function paintSpeech(dt:number):void {
 const camera=cameraForRoom(roomWidth(game));
 for(let i=speechPopups.length-1;i>=0;i--){
  const b=speechPopups[i]!;
  b.age+=dt;if(b.age>=2.6){speechPopups.splice(i,1);continue;}
  const p=iso({x:b.x,y:b.y},camera,146);
  const alpha=Math.min(1,(2.6-b.age)/0.4);
  view!.save();view!.globalAlpha=alpha;view!.font="bold 13px system-ui,sans-serif";
  const width=Math.min(190,view!.measureText(b.text).width+20);
  const x=p.x-width/2,y=p.y-b.age*12-25;
  view!.fillStyle=b.kind==="praise"?"#e3f9e9":"#fff2df";
  view!.strokeStyle=b.kind==="praise"?"#227348":"#9c5238";
  view!.lineWidth=2;
  view!.beginPath();view!.roundRect(x,y,width,27,8);view!.fill();view!.stroke();
  view!.fillStyle="#26302c";view!.textAlign="center";
  view!.fillText(b.text,p.x,y+18,width-12);
  view!.restore();
 }
}
const internetNames = ["Discada", "Via rádio", "Fibra óptica"] as const;
function internetName(): string { return internetNames[game.internetTier-1] ?? "Desconhecida"; }
const soundFiles: Record<string, string> = {
  click: "./assets/audio/mouse_click_002.ogg",
  coin: "./assets/audio/money_income_01.ogg", liquid: "./assets/audio/liquid.wav",
  vending: "./assets/audio/vending.wav"
};
function playOriginalSound(name: keyof typeof soundFiles): void {
  const file=soundFiles[name];
  if (!file || !soundEnabled) return;
  const audio = new Audio(file);
  audio.volume=0.42;
  void audio.play().catch(() => { /* Os WAV autorais ainda não foram enviados. */ });
}
function save(): void {
  if(!isPlaying)return;
  try { localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(game)); hasSavedGame=true; exportButton!.disabled=false; }
  catch { /* Storage cheio/bloqueado: jogo continua em memória. */ }
}
function button(id:string, handler:()=>void):void {
  const el=document.getElementById(id);
  if(el) el.addEventListener("click", () => {
    if(!(el instanceof HTMLButtonElement) || !el.disabled){
      playOriginalSound("click");
      handler();
    }
  });
}
button("open-admin",()=>{adminOpen=!adminOpen;if(adminOpen)shopOpen=false;renderUI();});
button("open-shop",()=>{shopOpen=!shopOpen;if(shopOpen)adminOpen=false;renderUI();});
button("close-shop",()=>{shopOpen=false;renderUI();});
shopCatalog?.addEventListener("click",event=>{
 const target=event.target;
 if(!(target instanceof HTMLButtonElement)||target.disabled||!target.dataset.buy)return;
 const id=target.dataset.buy;
 const result=id==="expand"?expandShop(game):id==="computer"?buyComputer(game):buyFurniture(game,id as FurnitureKind);
 playOriginalSound("click");applyResult(game,result);renderUI();save();
});
button("close-admin",()=>{adminOpen=false;renderUI();});
button("price-down",()=>{applyResult(game,setHourlyPrice(game,game.pricePerHour-2));renderUI();save();});
button("price-up",()=>{applyResult(game,setHourlyPrice(game,game.pricePerHour+2));renderUI();save();});
button("stock-soda",()=>{applyResult(game,stockItem(game,"soda"));renderUI();save();});
button("stock-candy",()=>{applyResult(game,stockItem(game,"candy"));renderUI();save();});
button("stock-snacks",()=>{applyResult(game,stockItem(game,"snacks"));renderUI();save();});
button("supplier-up",()=>{applyResult(game,contractSupplier(game));renderUI();save();});
button("internet-up",()=>{applyResult(game,upgradeInternet(game));renderUI();save();});
button("internet-repair",()=>{applyResult(game,repairInternet(game));renderUI();save();});
button("license",()=>{applyResult(game,licenseGames(game));renderUI();save();});

// Controles unificados em abas, sem criar novos painéis sobre o jogo.
const maintenancePanel=document.querySelector<HTMLElement>("#pc-maintenance");
if(!maintenancePanel)throw new Error("Manutenção ausente no painel");
maintenancePanel.addEventListener("click",event=>{
 const target=event.target;
 if(!(target instanceof HTMLButtonElement)||target.disabled)return;
 const index=Number(target.dataset.pcRepair??target.dataset.pcUpgrade);
 if(!Number.isInteger(index))return;
 playOriginalSound("click");
 applyResult(game,target.dataset.pcRepair!==undefined?repairComputer(game,index):upgradeComputer(game,index));
 renderUI();save();
});
const tabs=Array.from(admin.querySelectorAll<HTMLButtonElement>("[data-admin-tab]"));
const adminSections=Array.from(admin.querySelectorAll<HTMLElement>("[data-section]"));
function activateAdminTab(tab:string):void{
 activeAdminTab=tab;
 for(const button of tabs){const active=button.dataset.adminTab===tab;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active));}
 for(const section of adminSections)section.hidden=section.dataset.section!==tab;
}
for(const tab of tabs)tab.addEventListener("click",()=>{activateAdminTab(tab.dataset.adminTab??"prices");});
const retailControls=document.getElementById("retail-price-controls");
retailControls?.addEventListener("click",event=>{
 const target=event.target;
 if(!(target instanceof HTMLButtonElement))return;
 const item=target.dataset.item as Item|undefined;
 const delta=Number(target.dataset.delta);
 if(!item||!["soda","candy","snacks"].includes(item)||![-1,1].includes(delta))return;
 playOriginalSound("click");
 applyResult(game,setProductPrice(game,item,productPrice(game,item)+delta));
 renderUI();save();
});
activateAdminTab(activeAdminTab);
button("reset-game",()=>{
  if(!window.confirm("Recomeçar o sonho da lan house? O progresso salvo será apagado.")) return;
  game=createGame();previousServed=0;previousPurchases=0;paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;save();renderUI();
});
canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width*canvas.width;
  const y=(e.clientY-rect.top)/rect.height*canvas.height;
  if(renderer.hitOwner(x,y)){playOriginalSound("click");adminOpen=!adminOpen;if(adminOpen)shopOpen=false;renderUI();}
});
function renderShop():void{
 if(!shopCatalog)return;
 const cash=document.getElementById("shop-cash");
 if(cash)cash.textContent="Caixa R$ "+game.cash+" · Computadores "+pcCount(game)+"/"+(3+game.expansionLevel*2);
 shopCatalog.replaceChildren();
 for(const item of SHOP_CATALOG){
  const card=document.createElement("article");card.className="shop-card";
  const title=document.createElement("h3");title.textContent=item.label;
  const category=document.createElement("small");category.textContent=item.category;
  const description=document.createElement("p");description.textContent=item.description;
  const button=document.createElement("button");button.type="button";button.dataset.buy=item.id;
  const max=item.id==="poster"?2:item.id==="plant"?2:item.id==="table"?1:0;
  const count=game.furniture?.[item.id as FurnitureKind]??0;
  const full=item.id==="expand"?game.expansionLevel>=2:item.id==="computer"?pcCount(game)>=3+game.expansionLevel*2:max>0&&count>=max;
  const price=shopPrice(game,item.id);
  button.disabled=full||game.cash<price;
  button.textContent=full?"Limite atingido":"Comprar · R$ "+price;
  card.append(category,title,description,button);
  if(max>0){const owned=document.createElement("span");owned.textContent="Instalados: "+count+"/"+max;card.append(owned);}
  shopCatalog.append(card);
 }
}
function renderUI():void {
  // TypeScript não propaga a checagem inicial de nulidade para callbacks posteriores.
  if (!status || !admin || !events || !controls) return;
  status.textContent="Dia "+dayNumber(game)+" · "+displayTime(game)+"  |  Caixa R$ "+game.cash.toLocaleString("pt-BR")+
    "  |  Reputação "+game.reputation.toFixed(0)+"  |  Internet "+internetName()+" / "+(online(game)?"online":"OFFLINE")+
    "  |  "+(game.weather==="rain"?"Chuva lá fora":"Tempo firme");
  admin.hidden=!adminOpen;
  if(shop)shop.hidden=!shopOpen;
  const shopButton=document.querySelector<HTMLButtonElement>("#open-shop");
  if(shopButton)shopButton.setAttribute("aria-expanded",String(shopOpen));
  renderShop();
  activateAdminTab(activeAdminTab);
  const days=dayNumber(game)-1;
  const year=1998+Math.floor(days/360);
  const month=Math.floor((days%360)/30)+1;
  const monthDay=days%30+1;
  const calendar=document.getElementById("calendar-hud");
  if(calendar)calendar.textContent="📅 Dia "+dayNumber(game)+" · "+String(monthDay).padStart(2,"0")+"/"+String(month).padStart(2,"0")+"/"+year+" · "+displayTime(game);
  const weather=document.getElementById("weather-hud");
  if(weather)weather.textContent=game.weather==="rain"?"🌧 Chuva":"☀ Tempo firme";
  const setText=(id:string,value:string):void=>{const node=document.getElementById(id);if(node) node.textContent=value;};
  const money=(n:number):string=>"R$ "+n.toLocaleString("pt-BR");
  const monthlyRent=270+game.expansionLevel*170;
  const monthlyInternet=110+(game.internetTier-1)*85;
  const monthlyEnergy=85+game.expansionLevel*55;
  const monthlyMaintenance=75+game.expansionLevel*35;
  setText("admin-cash",money(game.cash));
  setText("admin-profit",money(game.revenue-game.expenses));
  setText("admin-bills",money(monthlyBills(game)));
  setText("admin-served",String(game.served));
  setText("monthly-breakdown","Custos mensais: aluguel "+money(monthlyRent)+" · internet "+money(monthlyInternet)+" · energia "+money(monthlyEnergy)+" · manutenção "+money(monthlyMaintenance));
  setText("price", "R$ "+game.pricePerHour+"/h");
  if(retailControls){
   retailControls.replaceChildren();
   for(const [item,label] of [["soda","Refrigerante"],["candy","Doce"],["snacks","Salgadinho"]] as const){
    const line=document.createElement("div");line.className="price-control";
    const name=document.createElement("span");name.textContent=label;
    const actions=document.createElement("div");actions.className="price-actions";
    for(const delta of [-1,1]){
      const button=document.createElement("button");button.type="button";button.dataset.item=item;
      button.dataset.delta=String(delta);button.textContent=delta<0?"−":"+";
      button.setAttribute("aria-label",(delta<0?"Reduzir ":"Aumentar ")+label);
      if(delta<0)button.disabled=productPrice(game,item)<=1;
      else button.disabled=productPrice(game,item)>=40;
      if(delta===1){
        const amount=document.createElement("strong");amount.textContent=money(productPrice(game,item));actions.append(amount);
      }
      actions.append(button);
    }
    line.append(name,actions);retailControls.append(line);
   }
  }
  setText("stock", "Bebidas "+game.inventory.soda+" · Doces "+game.inventory.candy+" · Salgadinhos "+game.inventory.snacks);
  setText("supplier-status",supplierLevel(game)===2?"Fornecedor parceiro · 20% de desconto nos novos lotes":"Fornecedor básico · preços de atacado normais");
  const supplierButton=document.querySelector<HTMLButtonElement>("#supplier-up");
  if(supplierButton)supplierButton.disabled=supplierLevel(game)===2;
  setText("stock-soda"," + Bebidas R$ "+wholesaleCost(game,"soda"));
  setText("stock-candy","+ Doces R$ "+wholesaleCost(game,"candy"));
  setText("stock-snacks","+ Salgados R$ "+wholesaleCost(game,"snacks"));
  setText("internet", internetName()+" · Nível "+game.internetTier+(online(game)?" · Online":" · Sem conexão até "+(game.offlineUntil-game.totalMinutes)+" min de jogo"));
  const repair=document.querySelector<HTMLButtonElement>("#internet-repair");
  if(repair){repair.disabled=online(game);repair.textContent="Chamar técnico · R$ "+(75+25*(game.internetTier-1));}
  const broken=Array.from({length:pcCount(game)},(_,i)=>i).filter(i=>pcBroken(game,i)).length;
  setText("pc", pcCount(game)+" computadores · "+game.customers.filter(c=>c.stage==="using").length+" ocupados · "+broken+" em manutenção · início: era Windows 98");
  const maintenance=document.getElementById("pc-maintenance");
  if(maintenance){
    const header=document.createElement("strong");header.textContent="Manutenção por computador";maintenance.replaceChildren(header);
    for(let i=0;i<pcCount(game);i++){
      const wear=pcWear(game,i);
      const line=document.createElement("div");
      const label=document.createElement("span");label.textContent="PC "+(i+1)+" · desgaste "+Math.round(wear)+"%"+(pcBroken(game,i)?" · PARADO":"")+" ";
      const repair=document.createElement("button");repair.type="button";repair.dataset.pcRepair=String(i);
      repair.textContent="Reparar · R$ "+(20+Math.ceil(wear*0.7));repair.disabled=wear<1;
      const upgrade=document.createElement("button");upgrade.type="button";upgrade.dataset.pcUpgrade=String(i);
      const tier=game.pcTiers?.[i]??1;
      upgrade.textContent=tier>=3?"Máximo nível":("Evoluir nível "+(tier+1)+" · R$ "+(tier*240));
      upgrade.disabled=tier>=3||game.cash<tier*240;
      label.textContent+=" · hardware nível "+tier;
      line.append(label,repair,upgrade);maintenance.appendChild(line);
    }
  }
  setText("license-status", game.licensedGames?"Jogos regularizados":"Catálogo sem licença — risco de multa");
  setText("finance", "Entradas R$ "+game.revenue+" · Saídas R$ "+game.expenses+" · Atendimentos "+game.served);
  setText("expansion", "Ampliação "+game.expansionLevel+"/2");
  events.replaceChildren();
  for(const record of game.eventLog.slice(0,6)){
    const li=document.createElement("li");li.textContent=record;events.appendChild(li);
  }
  controls.setAttribute("aria-expanded",String(adminOpen));
}
let lastFrame=0,lastUI=0,elapsed=0;
function frame(timestamp:number):void {
  if(lastFrame===0) lastFrame=timestamp;
  const dt=Math.max(0,Math.min(0.08,(timestamp-lastFrame)/1000));
  lastFrame=timestamp;elapsed+=dt;
  if(isPlaying)stepGame(game,dt*4.0);
  const payments=isPlaying?(game.paymentEffects?.splice(0)??[]):[];
  for(const payment of payments){
    paymentPopups.push({...payment,age:0});
    if(paymentPopups.length>12)paymentPopups.shift();
    playOriginalSound("coin");
  }
  if(game.served>previousServed)previousServed=game.served;
  const sales=isPlaying?(game.saleEffects?.splice(0)??[]):[];
  for(const sale of sales){
    if(Number.isFinite(sale.amount) && Number.isFinite(sale.x) && Number.isFinite(sale.y)){
      salePopups.push({amount:sale.amount!,x:sale.x!,y:sale.y!,age:0});
      if(salePopups.length>12)salePopups.shift();
    }
    const audio=audioContext();
    if(soundEnabled&&audio?.state==="running"){
      // Som de lata suspenso após reprovação auditiva; aguarda versão aprovada.
      if(sale.item!=="soda")playCandyDispense(audio);
    }
  }
  if(game.purchases>previousPurchases)previousPurchases=game.purchases;
  for(const speech of (isPlaying?(game.speechEffects?.splice(0)??[]):[])){
    speechPopups.push({...speech,age:0});
    if(speechPopups.length>8)speechPopups.shift();
  }
  if(isPlaying)renderer.draw(game,elapsed);
  if(isPlaying){paintPayments(dt);paintSales(dt);paintSpeech(dt);}
  if(isPlaying&&timestamp-lastUI>450){lastUI=timestamp;renderUI();}
  requestAnimationFrame(frame);
}
setInterval(save,8000);
window.addEventListener("beforeunload",save);
showMenu();
requestAnimationFrame(frame);
