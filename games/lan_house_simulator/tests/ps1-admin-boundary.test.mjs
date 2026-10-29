import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {PS1_MAX_STATIONS,ps1PlacementSlots,buyPs1Station,buyPs1Disc,buyPs1SecondSeat} from "../dist/js/sim/ps1.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createPs1AdminPort} from "../dist/js/application/ps1AdminPort.js";
import {renderPs1AdminPanel} from "../dist/js/ui/ps1AdminPanel.js";

function year2002(){
 const state=createGame(945,"historical");
 state.totalMinutes=4*360*DAY_MINUTES;
 state.cash=10000;return state;
}
test("antes de 2002 painel do console bloqueia preços e mostra desbloqueio",()=>{
 const state=createGame(901,"historical");
 const view=createPs1AdminPort(()=>state).snapshot();
 assert.equal(view.consoleReady,false);
 assert.equal(view.stationCount,0);
 assert.equal(view.maxStations,PS1_MAX_STATIONS);
 assert.equal(view.canDecreasePrice,false);
 assert.equal(view.canIncreasePrice,false);
});
test("projeção reflete compra de bancada, CD, preço e segunda cadeira sem mutar a partida",()=>{
 const state=year2002();
 const spot=ps1PlacementSlots(state)[0];
 assert.ok(spot);
 assert.equal(buyPs1Station(state,spot.id).ok,true);
 assert.equal(buyPs1Disc(state,"turbo-circuito").ok,true);
 const port=createPs1AdminPort(()=>state),before=JSON.stringify(state),s=port.snapshot();
 assert.equal(s.consoleReady,true);
 assert.equal(s.stationCount,1);
 assert.equal(s.ownedDiscs,1);
 assert.equal(s.readyStations,1);
 assert.equal(s.stations[0].index,0);
 assert.equal(s.stations[0].discOptions.some(d=>d.id==="turbo-circuito"),true);
 assert.equal(s.stations[0].canRepair,false);
 assert.equal(s.stations[0].canBuySecondSeat,true);
 assert.equal(JSON.stringify(state),before,"consulta é somente leitura");
 assert.equal(buyPs1SecondSeat(state,0).ok,true);
 assert.equal(port.snapshot().stations[0].secondSeat,true);
 assert.equal(port.snapshot().stations[0].canBuySecondSeat,false);
 assert.equal(isValidSave(state),true);
});
test("a porta acompanha a troca de save e os discos permanecem depois de importar",()=>{
 let state=year2002();
 const port=createPs1AdminPort(()=>state);
 const previous=state;
 assert.equal(port.snapshot().stationCount,0);
 assert.equal(buyPs1Station(state,ps1PlacementSlots(state)[0].id).ok,true);
 assert.equal(buyPs1Disc(state,"turbo-circuito").ok,true);
 state=parseImportedSave(serializeSave(state));
 assert.notEqual(state,previous);
 assert.equal(port.snapshot().stationCount,1);
 assert.equal(port.snapshot().ownedDiscs,1);
 assert.equal(port.snapshot().readyStations,1);
 assert.equal(isValidSave(state),true);
});
test("renderização mantém os IDs de controle e não destrói o painel fora da aba",()=>{
 const state=year2002();
 const port=createPs1AdminPort(()=>state);
 const old=globalThis.document;
 const created=tag=>({
  tagName:tag.toUpperCase(),dataset:{},children:[],value:"",textContent:"",
  disabled:false,append(...nodes){this.children.push(...nodes);},
  replaceChildren(...nodes){this.children=[...nodes];}
 });
 const nodes=new Map([
  ["ps1-stations",created("div")],["ps1-price-down",created("button")],["ps1-price-up",created("button")]
 ]);
 globalThis.document={getElementById:id=>nodes.get(id)??null,createElement:created};
 try{
  const text={};
  const ui={showStations:false,setText:(id,value)=>{text[id]=value;},money:n=>"R$ "+n};
  const area=nodes.get("ps1-stations"),preserved=created("p");
  area.append(preserved);
  renderPs1AdminPanel(port,ui);
  assert.deepEqual(area.children,[preserved],"não recria a aba quando oculta");
  assert.match(text["ps1-overview"],/Bancadas instaladas: 0\/3/);
  assert.match(text["ps1-disc-summary"],/primeira bancada/);
  assert.equal(nodes.get("ps1-price-up").disabled,true);
  assert.equal(buyPs1Station(state,ps1PlacementSlots(state)[0].id).ok,true);
  assert.equal(buyPs1Disc(state,"turbo-circuito").ok,true);
  renderPs1AdminPanel(port,{...ui,showStations:true});
  assert.equal(area.children.length,1);
  const card=area.children[0];
  assert.equal(card.className,"ps1-station-summary");
  const [,label,repair,seat]=card.children;
  assert.equal(label.children[0].dataset.ps1Slot,"0");
  assert.equal(repair.dataset.ps1Repair,"0");
  assert.equal(seat.dataset.ps1SecondSeat,"0");
  assert.equal(label.children[0].children.some(x=>x.value==="turbo-circuito"),true);
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
test("UI não conhece simulação; main injeta porta tipada e controles PS1 existentes",()=>{
 const src=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/ps1AdminPanel.ts",src),"utf8");
 const app=readFileSync(new URL("application/ps1AdminPort.ts",src),"utf8");
 const main=readFileSync(new URL("main.ts",src),"utf8");
 const sections=readFileSync(new URL("ui/adminServicesConsoles.ts",src),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.match(main,/createPs1AdminPort\(\(\)=>game\)/);
 assert.match(main,/renderAdminServicesConsoles\(\{/);
 assert.match(sections,/renderPs1AdminPanel\(options.ps1/);
 assert.doesNotMatch(main,/\bps1PlayableDisc\(/);
 assert.match(readFileSync(new URL("ui/ps1Controls.ts",src),"utf8"),/dataset\.ps1Slot/);
});
