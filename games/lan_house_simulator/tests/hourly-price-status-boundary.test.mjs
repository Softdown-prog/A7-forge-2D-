import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {gameYear} from "../dist/js/sim/era.js";
import {allowableHourlyPrice,annualHourlyCeiling,sessionPrice,SESSION_PACKAGES,priceIndex,ipcaLastYear} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createHourlyPriceStatusPort} from "../dist/js/application/hourlyPriceStatusPort.js";
import {renderHourlyPriceStatus,renderSessionPackages} from "../dist/js/ui/hourlyPriceStatusPanel.js";
const currency=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

test("modo histórico mantém tetos, tarifa e IPCA sem efeitos colaterais",()=>{
 const game=createGame(9921,"historical"),before=JSON.stringify(game);
 const view=createHourlyPriceStatusPort(()=>game).snapshot(),year=gameYear(game);
 assert.equal(view.historical,true);
 assert.equal(view.priceLabel,currency(game.pricePerHour)+"/h");
 assert.equal(view.yearCeiling,year+" · teto nominal da época "+currency(annualHourlyCeiling(year))+"/h");
 assert.equal(view.equipmentCeiling,"Máquinas e Windows instalados: até "+currency(allowableHourlyPrice(game))+"/h. Modernizar pode liberar uma tarifa maior.");
 assert.match(view.inflation,/IPCA anual aplicado/);
 assert.match(view.inflation,new RegExp(((priceIndex(year)-1)*100).toFixed(1)+"%"));
 assert.equal(view.packages.length,SESSION_PACKAGES.length);
 for(let i=0;i<SESSION_PACKAGES.length;i++){
  const min=SESSION_PACKAGES[i];
  assert.equal(view.packages[i],(min<60?min+" minutos":Number(min/60).toLocaleString("pt-BR")+" h")+
   " — "+currency(sessionPrice(game.pricePerHour,min)));
 }
 assert.equal(JSON.stringify(game),before);
});

test("modo clássico preserva quarteto de pacotes e não exibe migração já feita",()=>{
 const game=createGame(9922,"classic"),port=createHourlyPriceStatusPort(()=>game);
 const view=port.snapshot();
 assert.equal(view.historical,false);
 assert.equal(view.yearCeiling,"Modo clássico: tarifa histórica disponível apenas em novas partidas.");
 assert.equal(view.equipmentCeiling,"Esta partida conserva a economia anterior e seus preços.");
 assert.match(view.inflation,/Partida clássica/);
 assert.deepEqual(view.packages,[30,45,60,90].map(min=>
  (min<60?min+" minutos":Number(min/60).toLocaleString("pt-BR")+" h")+" — "+currency(sessionPrice(game.pricePerHour,min))));
});

test("botões preservam limites inferior e superior do motor",()=>{
 const classic=createGame(9923,"classic"),port=createHourlyPriceStatusPort(()=>classic);
 classic.pricePerHour=4;
 assert.equal(port.snapshot().decreaseDisabled,true);
 classic.pricePerHour=40;
 assert.equal(port.snapshot().increaseDisabled,true);
 const historical=createGame(9924,"historical"),historicalPort=createHourlyPriceStatusPort(()=>historical);
 historical.pricePerHour=.5;
 assert.equal(historicalPort.snapshot().decreaseDisabled,true);
 historical.pricePerHour=1;
 assert.equal(historicalPort.snapshot().decreaseDisabled,false);
 assert.equal(historicalPort.snapshot().increaseDisabled,historical.pricePerHour+.5>allowableHourlyPrice(historical));
});

test("virada do ano atualiza IPCA sem tocar no relógio ou no caixa",()=>{
 const game=createGame(9925,"historical"),port=createHourlyPriceStatusPort(()=>game);
 game.totalMinutes=360*720;
 const before=JSON.stringify(game),year=gameYear(game),lastYear=ipcaLastYear(year);
 assert.match(port.snapshot().yearCeiling,new RegExp(String(year)));
 if(lastYear!==null)assert.match(port.snapshot().inflation,new RegExp(lastYear.toFixed(2).replace(".","\\.")+"%"));
 assert.equal(JSON.stringify(game),before);
});

test("a mesma porta lê o save importado sem reter a partida anterior",()=>{
 let game=createGame(9926,"classic"),prior=game,old=JSON.stringify(game);
 const port=createHourlyPriceStatusPort(()=>game);
 game=parseImportedSave(serializeSave(game));
 game.pricePerHour=14;
 assert.equal(port.snapshot().priceLabel,currency(14)+"/h");
 assert.equal(JSON.stringify(prior),old);
 assert.equal(isValidSave(game),true);
});

test("componentes mantêm os controles existentes e recriam só as linhas do pacote quando solicitados",()=>{
 const prev=globalThis.HTMLButtonElement;
 class Button {constructor(){this.hidden=false;this.disabled=false;this.handlers=["click"];}}
 globalThis.HTMLButtonElement=Button;
 try{
  const buttons=new Map(["migrate-historical-pricing","price-down","price-up"].map(id=>[id,new Button()]));
  const doc={getElementById:id=>buttons.get(id)??null,createElement:tag=>({tag,textContent:""})};
  const seen=new Map(),setText=(id,value)=>seen.set(id,value);
  const game=createGame(9927,"historical"),port=createHourlyPriceStatusPort(()=>game);
  renderHourlyPriceStatus(port.snapshot(),setText,doc);
  assert.equal(buttons.get("migrate-historical-pricing").hidden,true);
  assert.equal(buttons.get("price-down").handlers[0],"click");
  assert.ok(seen.has("annual-ipca"));
  const host={rows:[],replaceChildren(){this.rows=[];},append(node){this.rows.push(node);}};
  renderSessionPackages(port.snapshot().packages,host,doc);
  assert.equal(host.rows.length,SESSION_PACKAGES.length);
  assert.ok(host.rows.every(node=>node.tag==="li"));
  const first=host.rows[0].textContent;
  game.pricePerHour+=.5;
  assert.equal(host.rows[0].textContent,first,"sem remonta automática");
  renderSessionPackages(port.snapshot().packages,host,doc);
  assert.notEqual(host.rows[0].textContent,first);
  assert.equal(buttons.get("price-up"),doc.getElementById("price-up"));
 }finally{
  if(prev===undefined)delete globalThis.HTMLButtonElement;
  else globalThis.HTMLButtonElement=prev;
 }
});

test("projeção não importa DOM; UI não conhece motor, e main mantém cache e clamp",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/hourlyPriceStatusPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/hourlyPriceStatusPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const section=readFileSync(new URL("ui/adminPricingSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener|innerHTML/);
 assert.match(main,/clampPriceToEra\(game\)/);
 assert.match(main,/renderAdminPricingSections\(\{/);
 assert.match(section,/renderHourlyPriceStatus\(options.hourly,options.setText,options.doc\)/);
 assert.match(section,/renderSessionPackages\(options.hourly.packages,durations,options.doc\)/);
 assert.match(main,/panelChanged\("durations",adminPanelRevisionsPort\.packages\(\),!liveOnly\)/);
 assert.doesNotMatch(main,/\bannualHourlyCeiling\(/);
 assert.doesNotMatch(main,/\bsessionPrice\(/);
});
