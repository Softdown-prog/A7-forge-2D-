import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {shopPrice} from "../dist/js/sim/shop.js";
import {PS1_UNLOCK_YEAR,PS1_MAX_STATIONS,ps1PlacementSlots,buyPs1Station} from "../dist/js/sim/ps1.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createPs1ShopOfferPort} from "../dist/js/application/ps1ShopOfferPort.js";
import {renderPs1ShopOfferButton} from "../dist/js/ui/ps1ShopOfferButton.js";

function inYear(year=2002,mode="historical"){
 const s=createGame(4801,mode);
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=10000;
 return s;
}
const offer=s=>createPs1ShopOfferPort(()=>s).snapshot();

test("consulta da oferta não modifica caixa, RNG, save ou posições",()=>{
 const s=inYear(),before=JSON.stringify(s),v=offer(s);
 assert.equal(v.disabled,false);
 assert.equal(v.text,"Comprar conjunto · R$ "+shopPrice(s,"ps1"));
 assert.equal(JSON.stringify(s),before);
});
test("partida histórica mantém PS1 bloqueado em 1998 e 2001",()=>{
 assert.equal(PS1_UNLOCK_YEAR,2002);
 for(const year of [1998,2001]){
  const v=offer(inYear(year));
  assert.equal(v.disabled,true);
  assert.equal(v.text,"🔒 Disponível em 2002");
 }
});
test("2002 libera a bancada ao preço original",()=>{
 const s=inYear(2002),v=offer(s);
 assert.equal(shopPrice(s,"ps1"),560);
 assert.equal(v.disabled,false);
 assert.equal(v.text,"Comprar conjunto · R$ 560");
});
test("anos seguintes preservam oferta da bancada",()=>{
 const s=inYear(2005);
 assert.equal(offer(s).disabled,false);
 assert.equal(offer(s).text,"Comprar conjunto · R$ 560");
});
test("modo clássico permanece bloqueado mesmo depois de 2002",()=>{
 const v=offer(inYear(2004,"classic"));
 assert.equal(v.disabled,true);
 assert.equal(v.text,"🔒 Disponível em 2002");
});
test("bloqueio por ano tem prioridade sobre falta de caixa",()=>{
 const s=inYear(2001);s.cash=0;
 assert.equal(offer(s).text,"🔒 Disponível em 2002");
});
test("saldo abaixo do preço não libera compra",()=>{
 const s=inYear();s.cash=559;
 const v=offer(s);
 assert.equal(v.disabled,true);
 assert.equal(v.text,"Caixa insuficiente · R$ 560");
});
test("saldo exato permite a compra",()=>{
 const s=inYear();s.cash=560;
 const v=offer(s);
 assert.equal(v.disabled,false);
 assert.equal(v.text,"Comprar conjunto · R$ 560");
});
test("limite de três bancadas conserva prioridade sobre o dinheiro",()=>{
 const s=inYear();s.cash=0;
 s.ps1Stations=Array.from({length:PS1_MAX_STATIONS},(_,i)=>({slotId:"floor-"+(i+1),wear:0}));
 const v=offer(s);
 assert.equal(v.disabled,true);
 assert.equal(v.text,"Sem espaço livre");
});
test("sem posições livres bloqueia o botão antes de conferir dinheiro",()=>{
 const s=inYear(),free=ps1PlacementSlots(s);
 assert.ok(free.length>0);
 s.furniturePlacements=free.map(p=>({kind:"table",slotId:p.id}));
 s.cash=0;
 assert.equal(ps1PlacementSlots(s).length,0);
 const v=offer(s);
 assert.equal(v.disabled,true);
 assert.equal(v.text,"Sem espaço livre");
});
test("após compra real, a oferta acompanha o save e não altera o valor",()=>{
 const s=inYear(),original=ps1PlacementSlots(s)[0].id;
 assert.equal(buyPs1Station(s,original).ok,true);
 const before=JSON.stringify(s),v=offer(s);
 assert.equal(v.disabled,false);
 assert.equal(v.text,"Comprar conjunto · R$ 560");
 assert.equal(JSON.stringify(s),before);
 assert.equal(isValidSave(s),true);
});
test("porta acompanha partida importada, sem prender o save antigo",()=>{
 let s=inYear(),port=createPs1ShopOfferPort(()=>s);
 const old=s,before=JSON.stringify(old);
 s=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(s),true);
 s.cash=0;
 assert.equal(port.snapshot().text,"Caixa insuficiente · R$ 560");
 assert.equal(JSON.stringify(old),before);
});
test("render altera somente texto e estado, preservando dataset de compra",()=>{
 const s=inYear();
 const button={disabled:true,textContent:"Antigo",dataset:{buy:"ps1"},title:""};
 renderPs1ShopOfferButton(button,offer(s));
 assert.equal(button.disabled,false);
 assert.equal(button.textContent,"Comprar conjunto · R$ 560");
 assert.equal(button.dataset.buy,"ps1");
 s.cash=0;
 renderPs1ShopOfferButton(button,offer(s));
 assert.equal(button.disabled,true);
 assert.equal(button.textContent,"Caixa insuficiente · R$ 560");
 assert.equal(button.dataset.buy,"ps1");
});
test("UI sem motor, main sem regras PS1, compra no controlador existente",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/ps1ShopOfferPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/ps1ShopOfferButton.ts",root),"utf8");
 const catalog=readFileSync(new URL("ui/shopCatalogRenderer.ts",root),"utf8");
 const shop=readFileSync(new URL("ui/shopControls.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|buyPs1Station|stepGame|shopPrice/);
 assert.match(sourceModule("application/gamePorts.ts"),/createPs1ShopOfferPort\(getState\)/);
 assert.match(sourceModule("ui/gamePanels.ts"),/ps1Offer:\(\)=>ps1ShopOfferPort\.snapshot\(\)/);
 assert.match(catalog,/renderPs1ShopOfferButton\(button,options\.ps1Offer\(\)\)/);
 assertCompositionAdaptersExclude(/\bPS1_UNLOCK_YEAR\b|\bPS1_MAX_STATIONS\b|\bps1PlacementSlots\b/);
 assert.match(catalog,/renderPs1ShopPlacement\(card,\{art,category,title,description,button\}/);
 assert.match(shop,/port\.purchase\(id,ps1Slot\)/);
});
