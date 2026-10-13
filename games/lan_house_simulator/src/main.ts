import { serializeSave, parseImportedSave } from "./sim/saveTransfer.js";
import {SHOP_CATALOG,shopPrice,buyComputer,placeFurniture,relocateFurniture,furnitureLocations,availablePlacementSlots,FURNITURE_SLOTS,type FurnitureKind,type PlacementSlot} from "./sim/shop.js";
import { createGame, dayNumber, displayTime, online, pcCount, stepGame, isValidSave, applyResult } from "./sim/engine.js";
import { contractSupplier, expandShop, licenseGames, repairInternet, setHourlyPrice, stockItem, supplierLevel, wholesaleCost, upgradeInternet, repairComputer, monthlyBills, productPrice, setProductPrice, upgradeComputer } from "./sim/economy.js";
import { GAME_SAVE_KEY, type GameState, type Item } from "./sim/types.js";
import { SceneRenderer } from "./render/scene.js";
import { cameraForGame, iso } from "./render/isometric.js";
import { roomWidth, pcWear, pcBroken } from "./sim/engine.js";
import { makeNineSlice } from "./ui/nineSlice.js";
import { Soundscape } from "./audio/soundscape.js";

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
const soundscape=new Soundscape(soundEnabled);
soundscape.preload();
// Reuse a single mixer for dynamic controls and keyboard activation alike.
document.addEventListener("pointerdown",()=>soundscape.unlock(),{capture:true});
document.addEventListener("keydown",e=>{
 if(e.key==="Enter"||e.key===" ")soundscape.unlock();
},{capture:true});
document.addEventListener("click",event=>{
 const target=event.target;
 if(!(target instanceof Element))return;
 const control=target.closest("button");
 if(control instanceof HTMLButtonElement&&!control.disabled)soundscape.click();
},{capture:true});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)soundscape.stopKeyboard();
});
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
  game=state;hasSavedGame=true;game.keyboardEffects?.splice(0);
  soundscape.stopKeyboard();
  previousServed=game.served;previousPurchases=game.purchases;
  paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;
  continueButton!.disabled=false;exportButton!.disabled=false;
  announceSave("Partida importada com sucesso. Clique em Continuar.");
 }catch(e){announceSave(e instanceof Error?e.message:"Não foi possível importar o arquivo.");}
});
function showMenu():void{
 soundscape.stopKeyboard();
 isPlaying=false;startScreen!.hidden=false;gameApp!.hidden=true;
 continueButton!.disabled=!hasSavedGame;exportButton!.disabled=!hasSavedGame;adminOpen=false;shopOpen=false;placingKind=null;relocating=false;relocationFrom=null;hoveredPlacement=null;
}
function beginPlay():void{
 game.keyboardEffects?.splice(0); // Do not replay events restored from a save.
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
soundToggle.addEventListener("change",()=>{soundEnabled=soundToggle!.checked;soundscape.setEnabled(soundEnabled);try{localStorage.setItem("lhs.sound",soundEnabled?"on":"off");}catch{}});
document.getElementById("open-menu")?.addEventListener("click",showMenu);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&isPlaying){if(placingKind||relocating)stopPlacement();else showMenu();}});
let shopOpen=false;
let placingKind:FurnitureKind|null=null;
let relocating=false;
let relocationFrom:string|null=null;
let hoveredPlacement:string|null=null;
let placementNotice="";
let adminOpen = false;
let activeAdminTab="prices";
let previousServed = game.served;
let previousPurchases = game.purchases;
// Playback is handled by the shared Soundscape. No repeated HTMLAudioElements.
const paymentPopups:Array<{amount:number;x:number;y:number;age:number}>=[];
const salePopups:Array<{amount:number;x:number;y:number;age:number}>=[];
const speechPopups:Array<{text:string;x:number;y:number;kind:"complaint"|"praise";age:number}>=[];
function paintPayments(dt:number):void {
  const camera=cameraForGame(game);
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
 const camera=cameraForGame(game);
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
 const camera=cameraForGame(game);
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
function save(): void {
  if(!isPlaying)return;
  try { localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(game)); hasSavedGame=true; exportButton!.disabled=false; }
  catch { /* Storage cheio/bloqueado: jogo continua em memória. */ }
}
function button(id:string, handler:()=>void):void {
  const el=document.getElementById(id);
  if(el) el.addEventListener("click", () => {
    if(!(el instanceof HTMLButtonElement) || !el.disabled){
      
      handler();
    }
  });
}
button("open-admin",()=>{adminOpen=!adminOpen;if(adminOpen){shopOpen=false;placingKind=null;relocating=false;relocationFrom=null;hoveredPlacement=null;}renderUI();});
button("open-shop",()=>{shopOpen=!shopOpen;if(shopOpen){adminOpen=false;placingKind=null;relocating=false;relocationFrom=null;hoveredPlacement=null;}renderUI();});
button("close-shop",()=>{shopOpen=false;renderUI();});
button("organize-furniture",()=>{
 if(!furnitureLocations(game).length)return;
 placingKind=null;relocating=true;relocationFrom=null;hoveredPlacement=null;placementNotice="";soundscape.stopKeyboard();
 shopOpen=false;adminOpen=false;renderUI();canvas!.scrollIntoView({block:"center",behavior:"smooth"});
});
shopCatalog?.addEventListener("click",event=>{
 const target=event.target;
 if(!(target instanceof HTMLButtonElement)||target.disabled||!target.dataset.buy)return;
 const id=target.dataset.buy;
 if(id==="poster"||id==="plant"||id==="table"){
   if(!availablePlacementSlots(game,id).length)return;
   placingKind=id;hoveredPlacement=null;placementNotice="";soundscape.stopKeyboard();
   shopOpen=false;adminOpen=false;renderUI();
   canvas.scrollIntoView({block:"center",behavior:"smooth"});
   return;
 }
 const result=id==="expand"?expandShop(game):buyComputer(game);
 applyResult(game,result);renderUI();save();
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
 
 applyResult(game,setProductPrice(game,item,productPrice(game,item)+delta));
 renderUI();save();
});
activateAdminTab(activeAdminTab);
button("reset-game",()=>{
  if(!window.confirm("Recomeçar o sonho da lan house? O progresso salvo será apagado.")) return;
  game=createGame();previousServed=0;previousPurchases=0;paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;save();renderUI();
});
const placementToolbar=document.getElementById("placement-toolbar");
const placementHelp=document.getElementById("placement-help");
const stage=canvas.closest<HTMLElement>(".stage");
const placementNames:Record<FurnitureKind,string>={poster:"pôster",plant:"planta",table:"mesinha"};
function stopPlacement():void{
 placingKind=null;relocating=false;relocationFrom=null;hoveredPlacement=null;placementNotice="";renderUI();
}
document.getElementById("placement-cancel")?.addEventListener("click",stopPlacement);
function getCanvasPoint(e:MouseEvent|PointerEvent):{x:number;y:number}{
 const element=canvas!;
 const bounds=element.getBoundingClientRect();
 return {x:(e.clientX-bounds.left)/bounds.width*element.width,
         y:(e.clientY-bounds.top)/bounds.height*element.height};
}
function pickFurnitureSlot(x:number,y:number):PlacementSlot|null{
 if(!placingKind&&!relocating)return null;
 const moving=furnitureLocations(game).find(p=>p.slotId===relocationFrom);
 const surface=placingKind?(placingKind==="poster"?"wall":"floor"):moving?(moving.kind==="poster"?"wall":"floor"):null;
 const camera=cameraForGame(game);
 let nearest:PlacementSlot|null=null,distance=Infinity;
 for(const slot of FURNITURE_SLOTS){
  if(surface&&slot.surface!==surface)continue;
  if(relocating&&!moving&&!furnitureLocations(game).some(p=>p.slotId===slot.id))continue;
  const at=slot.surface==="wall"?iso({x:slot.x+0.33,y:0.01},camera,137):
      iso({x:slot.x+0.25,y:slot.y+0.20},camera,9);
  const dist=Math.hypot(x-at.x,y-at.y);
  if(dist<distance){distance=dist;nearest=slot;}
 }
 return distance<=Math.max(23,38*camera.zoom)?nearest:null;
}
canvas.addEventListener("pointermove",e=>{
 if(!placingKind&&!relocating)return;
 const at=getCanvasPoint(e);
 hoveredPlacement=pickFurnitureSlot(at.x,at.y)?.id??null;
});
canvas.addEventListener("pointerleave",()=>{hoveredPlacement=null;});
canvas.addEventListener("click",e=>{
  const {x,y}=getCanvasPoint(e);
  if(relocating||placingKind)soundscape.click();
  if(relocating){
    const slot=pickFurnitureSlot(x,y);
    if(!slot){placementNotice="Escolha um móvel ou uma posição sinalizada.";renderUI();return;}
    const owned=furnitureLocations(game).find(p=>p.slotId===slot.id);
    if(!relocationFrom){
      if(!owned){placementNotice="Selecione primeiro o móvel que deseja mover.";renderUI();return;}
      relocationFrom=slot.id;placementNotice="Agora escolha um destino verde para "+placementNames[owned.kind]+".";
      renderUI();return;
    }
    if(slot.id===relocationFrom){relocationFrom=null;placementNotice="Selecione outro móvel para reorganizar.";renderUI();return;}
    if(owned){
      relocationFrom=slot.id;placementNotice="Selecionado: "+placementNames[owned.kind]+". Escolha um destino verde.";
      renderUI();return;
    }
    const result=relocateFurniture(game,relocationFrom,slot.id);
    if(result.ok){applyResult(game,result);stopPlacement();save();}
    else{placementNotice=result.message;renderUI();}
    return;
  }
  if(placingKind){
    const kind=placingKind,slot=pickFurnitureSlot(x,y);
    if(!slot){placementNotice="Clique em uma das posições sinalizadas.";renderUI();return;}
    const result=placeFurniture(game,kind,slot.id);
    if(result.ok){applyResult(game,result);stopPlacement();save();}
    else{placementNotice=result.message;renderUI();}
    return;
  }
  if(renderer.hitOwner(x,y)){soundscape.click();adminOpen=!adminOpen;if(adminOpen)shopOpen=false;renderUI();}
});
function renderShop():void{
 if(!shopCatalog)return;
 const organize=document.querySelector<HTMLButtonElement>("#organize-furniture");
 if(organize){const count=furnitureLocations(game).length;organize.disabled=count===0;organize.textContent=count?"↔ Organizar móveis instalados ("+count+")":"↔ Organizar móveis (nenhum instalado)";}
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
  const full=item.id==="expand"?game.expansionLevel>=2:item.id==="computer"?pcCount(game)>=3+game.expansionLevel*2:max>0&&(count>=max||!availablePlacementSlots(game,item.id as FurnitureKind).length);
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
  if(placementToolbar)placementToolbar.hidden=!(placingKind||relocating);
  if(stage)stage.classList.toggle("placing",Boolean(placingKind||relocating));
  if(placementHelp)placementHelp.textContent=relocating?
    (placementNotice||(relocationFrom?"Escolha um destino verde para o móvel selecionado.":"Toque em um móvel marcado em dourado para selecionar; depois escolha a nova posição. Sem custos.")):
    placingKind?(placementNotice||"Escolha uma posição verde para "+placementNames[placingKind]+". Clique para comprar e instalar; cancelar não cobra nada."):"";
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
  if(isPlaying&&!placingKind&&!relocating)stepGame(game,dt*4.0);
  const payments=isPlaying?(game.paymentEffects?.splice(0)??[]):[];
  for(const payment of payments){
    paymentPopups.push({...payment,age:0});
    if(paymentPopups.length>12)paymentPopups.shift();
    soundscape.income("payment");
  }
  if(game.served>previousServed)previousServed=game.served;
  const sales=isPlaying?(game.saleEffects?.splice(0)??[]):[];
  for(const sale of sales){
    if(Number.isFinite(sale.amount) && Number.isFinite(sale.x) && Number.isFinite(sale.y)){
      salePopups.push({amount:sale.amount!,x:sale.x!,y:sale.y!,age:0});
      if(salePopups.length>12)salePopups.shift();
    }
    // Payment sound is emitted by real confirmed sales, not UI clicks.
    soundscape.income("sale");
    // The rejected soda-can sound stays disabled.
    if(sale.item!=="soda")soundscape.candy();
  }
  // A gentle 3.5-second phrase once a visitor starts a PC session.
  for(const started of (isPlaying?(game.keyboardEffects?.splice(0)??[]):[])){
    if(Number.isInteger(started.customerId)&&Number.isInteger(started.pcIndex))soundscape.keyboard();
  }
  if(game.purchases>previousPurchases)previousPurchases=game.purchases;
  for(const speech of (isPlaying?(game.speechEffects?.splice(0)??[]):[])){
    speechPopups.push({...speech,age:0});
    if(speechPopups.length>8)speechPopups.shift();
  }
  if(isPlaying)renderer.draw(game,elapsed);
  if(isPlaying){paintPayments(dt);paintSales(dt);paintSpeech(dt);}
  if(isPlaying&&placingKind)renderer.drawPlacementCandidates(game,placingKind,hoveredPlacement);
  if(isPlaying&&relocating)renderer.drawRelocationCandidates(game,relocationFrom,hoveredPlacement);
  if(isPlaying&&timestamp-lastUI>450){lastUI=timestamp;renderUI();}
  requestAnimationFrame(frame);
}
setInterval(save,8000);
window.addEventListener("beforeunload",save);
showMenu();
requestAnimationFrame(frame);
