import { createGame, dayNumber, displayTime, online, pcCount, stepGame, isValidSave, applyResult } from "./sim/engine.js";
import { contractSupplier, expandShop, licenseGames, repairInternet, setHourlyPrice, stockItem, supplierLevel, wholesaleCost, upgradeInternet, repairComputer, monthlyBills } from "./sim/economy.js";
import { GAME_SAVE_KEY, type GameState } from "./sim/types.js";
import { SceneRenderer } from "./render/scene.js";
import { cameraForRoom, iso } from "./render/isometric.js";
import { roomWidth, pcWear, pcBroken } from "./sim/engine.js";
import { makeNineSlice } from "./ui/nineSlice.js";
import { playCandyDispense } from "./audio/vendingSfx.js";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const admin = document.querySelector<HTMLElement>("#admin");
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
let adminOpen = false;
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
  if (!file) return;
  const audio = new Audio(file);
  audio.volume=0.42;
  void audio.play().catch(() => { /* Os WAV autorais ainda não foram enviados. */ });
}
function save(): void {
  try { localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(game)); }
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
button("open-admin",()=>{adminOpen=!adminOpen; renderUI();});
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
button("expand",()=>{applyResult(game,expandShop(game));renderUI();save();});
// Botões gerados uma única vez; detalhes atualizados em renderUI sem listeners duplicados.
const maintenancePanel=document.createElement("section");
maintenancePanel.id="pc-maintenance";
maintenancePanel.setAttribute("aria-label","Manutenção dos computadores");
admin.appendChild(maintenancePanel);
maintenancePanel.addEventListener("click",event=>{
 const target=event.target;
 if(!(target instanceof HTMLButtonElement)||target.disabled)return;
 const index=Number(target.dataset.pcRepair);
 if(!Number.isInteger(index))return;
 playOriginalSound("click");
 applyResult(game,repairComputer(game,index));renderUI();save();
});
button("reset-game",()=>{
  if(!window.confirm("Recomeçar o sonho da lan house? O progresso salvo será apagado.")) return;
  game=createGame();previousServed=0;previousPurchases=0;paymentPopups.length=0;salePopups.length=0;speechPopups.length=0;save();renderUI();
});
canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width*canvas.width;
  const y=(e.clientY-rect.top)/rect.height*canvas.height;
  if(renderer.hitOwner(x,y)){playOriginalSound("click");adminOpen=!adminOpen;renderUI();}
});
function renderUI():void {
  // TypeScript não propaga a checagem inicial de nulidade para callbacks posteriores.
  if (!status || !admin || !events || !controls) return;
  status.textContent="Dia "+dayNumber(game)+" · "+displayTime(game)+"  |  Caixa R$ "+game.cash.toLocaleString("pt-BR")+
    "  |  Reputação "+game.reputation.toFixed(0)+"  |  Internet "+internetName()+" / "+(online(game)?"online":"OFFLINE")+
    "  |  "+(game.weather==="rain"?"Chuva lá fora":"Tempo firme");
  admin.hidden=!adminOpen;
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
      line.append(label,repair);maintenance.appendChild(line);
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
  stepGame(game,dt*4.0);
  const payments=game.paymentEffects?.splice(0)??[];
  for(const payment of payments){
    paymentPopups.push({...payment,age:0});
    if(paymentPopups.length>12)paymentPopups.shift();
    playOriginalSound("coin");
  }
  if(game.served>previousServed)previousServed=game.served;
  const sales=game.saleEffects?.splice(0)??[];
  for(const sale of sales){
    if(Number.isFinite(sale.amount) && Number.isFinite(sale.x) && Number.isFinite(sale.y)){
      salePopups.push({amount:sale.amount!,x:sale.x!,y:sale.y!,age:0});
      if(salePopups.length>12)salePopups.shift();
    }
    const audio=audioContext();
    if(audio?.state==="running"){
      // Som de lata suspenso após reprovação auditiva; aguarda versão aprovada.
      if(sale.item!=="soda")playCandyDispense(audio);
    }
  }
  if(game.purchases>previousPurchases)previousPurchases=game.purchases;
  for(const speech of game.speechEffects?.splice(0)??[]){
    speechPopups.push({...speech,age:0});
    if(speechPopups.length>8)speechPopups.shift();
  }
  renderer.draw(game,elapsed);
  paintPayments(dt);
  paintSales(dt);
  paintSpeech(dt);
  if(timestamp-lastUI>450){lastUI=timestamp;renderUI();}
  requestAnimationFrame(frame);
}
setInterval(save,8000);
window.addEventListener("beforeunload",save);
renderUI();
requestAnimationFrame(frame);
