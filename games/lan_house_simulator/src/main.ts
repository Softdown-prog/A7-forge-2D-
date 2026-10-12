import { createGame, dayNumber, displayTime, online, pcCount, stepGame, isValidSave, applyResult } from "./sim/engine.js";
import { contractSupplier, expandShop, licenseGames, repairInternet, setHourlyPrice, stockItem, supplierLevel, wholesaleCost, upgradeInternet } from "./sim/economy.js";
import { GAME_SAVE_KEY, type GameState } from "./sim/types.js";
import { SceneRenderer } from "./render/scene.js";
import { makeNineSlice } from "./ui/nineSlice.js";

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
const internetNames = ["Discada", "Via rádio", "Fibra óptica"] as const;
function internetName(): string { return internetNames[game.internetTier-1] ?? "Desconhecida"; }
const soundFiles: Record<string, string> = {
  coin: "./assets/audio/coin.wav", liquid: "./assets/audio/liquid.wav",
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
  if(el) el.addEventListener("click", handler);
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
button("reset-game",()=>{
  if(!window.confirm("Recomeçar o sonho da lan house? O progresso salvo será apagado.")) return;
  game=createGame();previousServed=0;previousPurchases=0;save();renderUI();
});
canvas.addEventListener("click",e=>{
  const rect=canvas.getBoundingClientRect();
  const x=(e.clientX-rect.left)/rect.width*canvas.width;
  const y=(e.clientY-rect.top)/rect.height*canvas.height;
  if(renderer.hitOwner(x,y)){adminOpen=!adminOpen;renderUI();}
});
function renderUI():void {
  // TypeScript não propaga a checagem inicial de nulidade para callbacks posteriores.
  if (!status || !admin || !events || !controls) return;
  status.textContent="Dia "+dayNumber(game)+" · "+displayTime(game)+"  |  Caixa R$ "+game.cash.toLocaleString("pt-BR")+
    "  |  Reputação "+game.reputation.toFixed(0)+"  |  Internet "+internetName()+" / "+(online(game)?"online":"OFFLINE")+
    "  |  "+(game.weather==="rain"?"Chuva lá fora":"Tempo firme");
  admin.hidden=!adminOpen;
  const setText=(id:string,value:string):void=>{const node=document.getElementById(id);if(node) node.textContent=value;};
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
  setText("pc", pcCount(game)+" computadores · "+game.customers.filter(c=>c.stage==="using").length+" ocupados · início: era Windows 98");
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
  if(game.served>previousServed){previousServed=game.served;playOriginalSound("coin");}
  if(game.purchases>previousPurchases){previousPurchases=game.purchases;playOriginalSound("vending");}
  renderer.draw(game,elapsed);
  if(timestamp-lastUI>450){lastUI=timestamp;renderUI();}
  requestAnimationFrame(frame);
}
setInterval(save,8000);
window.addEventListener("beforeunload",save);
renderUI();
requestAnimationFrame(frame);
