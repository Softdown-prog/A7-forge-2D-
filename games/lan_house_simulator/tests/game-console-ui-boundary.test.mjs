import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {createGameLicensingPort} from "../dist/js/application/gameLicensingPort.js";
import {createPs1ActionsPort} from "../dist/js/application/ps1ActionsPort.js";
import {installGameLicensingControls} from "../dist/js/ui/gameLicensingControls.js";
import {installPs1Controls} from "../dist/js/ui/ps1Controls.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {withStationOff} from "./station-power-fixture.mjs";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
const ok=result=>assert.equal(result.ok,true,result.message);

test("licencas historicas passam pela porta e seguem o save recarregado",()=>{
 let state=createGame(90,"historical");
 state.cash=10000;
 const port=createGameLicensingPort(()=>state);
 const before=JSON.stringify(state);
 assert.equal(port.licenseEra("game-inventado").ok,false);
 assert.equal(port.licenseGpu("__proto__").ok,false);
 assert.equal(port.toggleInstallation(-1,"neon-rush").ok,false);
 assert.equal(port.installAvailable("unknown").ok,false);
 assert.equal(port.cancelDownload(100,"neon-rush").ok,false);
 assert.equal(JSON.stringify(state),before);
 ok(licenseGames(state));
 ok(withStationOff(state,0,()=>licenseWindows(state,0,"win98")));
 ok(port.licenseEra("turbo-98"));
 assert.equal(state.licensedEraGames?.includes("turbo-98"),true);
 assert.equal(isValidSave(state),true);
 const old=state;
 state=parseImportedSave(serializeSave(state));
 ok(port.licenseEra("castelo-das-chaves"));
 assert.equal(state.licensedEraGames?.length,2);
 assert.equal(old.licensedEraGames?.length,1);
});

test("jogo de GPU respeita desbloqueios e operacoes de download",()=>{
 const state=createGame(91,"historical");
 state.totalMinutes=(2005-1998)*360*DAY_MINUTES;state.cash=30000;
 const port=createGameLicensingPort(()=>state);
 ok(licenseGames(state));
 ok(withStationOff(state,0,()=>buyPlatform(state,0,"platform05")));
 ok(withStationOff(state,0,()=>buyGpu(state,0,"gpu05")));
 ok(withStationOff(state,0,()=>licenseWindows(state,0,"winxp")));
 ok(port.licenseGpu("neon-rush"));
 assert.equal(port.licenseGpu("neon-rush").ok,false);
 ok(port.toggleInstallation(0,"neon-rush"));
 ok(port.installAvailable("neon-rush"));
 ok(port.cancelDownload(0,"neon-rush"));
 assert.equal(isValidSave(state),true);
 const before=JSON.stringify(state);
 assert.equal(port.toggleInstallation(100,"neon-rush").ok,false);
 assert.equal(port.cancelDownload(0,"unknown").ok,false);
 assert.equal(JSON.stringify(state),before);
});

test("PlayStation compra, troca, manutencao e recarregamento preservam a partida",()=>{
 let state=createGame(92,"historical");
 state.totalMinutes=(2002-1998)*360*DAY_MINUTES;state.cash=5000;
 const port=createPs1ActionsPort(()=>state);
 const before=JSON.stringify(state);
 assert.equal(port.buyDisc("titulo-falso").ok,false);
 assert.equal(port.insertDisc(0,"").ok,false);
 assert.equal(port.secondSeat(-1).ok,false);
 assert.equal(port.repairControls(88).ok,false);
 assert.equal(JSON.stringify(state),before);
 ok(port.buyStation("floor-2"));
 assert.equal(port.stationCount(),1);
 ok(port.buyDisc("gol-de-rua"));
 assert.equal(port.discAt(0),"gol-de-rua");
 ok(port.insertDisc(0,""));
 assert.equal(port.discAt(0),"");
 ok(port.insertDisc(0,"gol-de-rua"));
 ok(port.secondSeat(0));
 state.ps1Stations[0].wear=12;
 ok(port.repairControls(0));
 assert.equal(isValidSave(state),true);
 const old=state;
 state=parseImportedSave(serializeSave(state));
 ok(port.insertDisc(0,""));
 assert.equal(port.discAt(0),"");
 assert.equal(old.ps1Stations[0].discId,"gol-de-rua");
});

test("eventos de GPU, jogos por era e console mantem seletores e prioridades",()=>{
 const previous={Element:globalThis.Element,HTMLButtonElement:globalThis.HTMLButtonElement,HTMLSelectElement:globalThis.HTMLSelectElement};
 class FakeElement{
  constructor(dataset={}){this.dataset=dataset;this.disabled=false;this.value="";}
  closest(selector){
   if(!selector.includes("button"))return null;
   const names=[...selector.matchAll(/data-([a-z0-9-]+)/g)].map(m=>m[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase()));
   return !names.length||names.some(name=>this.dataset[name]!==undefined)?this:null;
  }
 }
 class FakeButton extends FakeElement{}
 class FakeSelect extends FakeElement{}
 const root=()=>{
  const callbacks={};
  return {addEventListener:(name,cb)=>{callbacks[name]=cb;},send:(name,target)=>{assert.ok(callbacks[name]);callbacks[name]({target});}};
 };
 globalThis.Element=FakeElement;globalThis.HTMLButtonElement=FakeButton;globalThis.HTMLSelectElement=FakeSelect;
 try{
  const eraGames=root(),gpuGames=root(),stations=root(),shopCatalog=root();
  const calls=[],notes=[];
  const games={
   licenseEra:id=>{calls.push(["era",id]);return {ok:true,message:id};},
   licenseGpu:id=>{calls.push(["license",id]);return {ok:true,message:id};},
   toggleInstallation:(pc,id)=>{calls.push(["toggle",pc,id]);return {ok:true,message:id};},
   installAvailable:id=>{calls.push(["all",id]);return {ok:true,message:id};},
   cancelDownload:(pc,id)=>{calls.push(["cancel",pc,id]);return {ok:true,message:id};}
  };
  installGameLicensingControls({eraGames,gpuGames},games,r=>notes.push(["games",r.message]));
  eraGames.send("click",new FakeButton({eraGameBuy:"turbo-98"}));
  gpuGames.send("click",new FakeButton({gpuGameCancel:"neon-rush",gpuGamePc:"1",gpuGameBuy:"neon-rush"}));
  gpuGames.send("click",new FakeButton({gpuGameInstallAll:"neon-rush"}));
  gpuGames.send("click",new FakeButton({gpuGameInstall:"neon-rush",gpuGamePc:"0"}));
  gpuGames.send("click",new FakeButton({gpuGameBuy:"neon-rush"}));
  const disabled=new FakeButton({gpuGameBuy:"neon-rush"});disabled.disabled=true;
  gpuGames.send("click",disabled);
  assert.deepEqual(calls,[["era","turbo-98"],["cancel",1,"neon-rush"],["all","neon-rush"],["toggle",0,"neon-rush"],["license","neon-rush"]]);
  const ps1={
   stationCount:()=>1,discAt:()=> "gol-de-rua",
   insertDisc:(pc,id)=>{calls.push(["disc",pc,id]);return {ok:false,message:"ocupado"};},
   buyDisc:id=>{calls.push(["cd",id]);return {ok:true,message:id};},
   secondSeat:pc=>{calls.push(["seat",pc]);return {ok:true,message:"seat"};},
   repairControls:pc=>{calls.push(["repair",pc]);return {ok:true,message:"repair"};}
  };
  installPs1Controls({stations,shopCatalog},ps1,(r,policy)=>notes.push([r.message,policy]));
  shopCatalog.send("click",new FakeButton({buyPs1Disc:"gol-de-rua"}));
  const selector=new FakeSelect({ps1Slot:"0"});selector.value="turbo-circuito";
  stations.send("change",selector);
  assert.equal(selector.value,"gol-de-rua","rejeicao restaura CD anterior");
  stations.send("click",new FakeButton({ps1SecondSeat:"0"}));
  stations.send("click",new FakeButton({ps1Repair:"0"}));
  assert.deepEqual(calls.slice(5),[["cd","gol-de-rua"],["disc",0,"turbo-circuito"],["seat",0],["repair",0]]);
  assert.deepEqual(notes.slice(5).map(x=>x[1]),["always","success","success","success"]);
 }finally{
  for(const [name,value] of Object.entries(previous)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});

test("componentes migrados não importam motor e main compõe os dois adaptadores",()=>{
 const root=new URL("../src/",import.meta.url);
 for(const file of ["ui/gameLicensingControls.ts","ui/ps1Controls.ts"]){
  const src=readFileSync(new URL(file,root),"utf8");
  assert.doesNotMatch(src,/from\s*["']\.\.\/sim\//);
  assert.doesNotMatch(src,/from\s*["']\.\.\/render\//);
 }
 for(const file of ["application/gameLicensingPort.ts","application/ps1ActionsPort.ts"]){
  const src=readFileSync(new URL(file,root),"utf8");
  assert.doesNotMatch(src,/\bdocument\b|\bwindow\b|\bHTMLElement\b/);
 }
 assert.match(sourceModule("ui/runtimeControls.ts"),/installGameLicensingControls\(/);
 assert.match(sourceModule("ui/runtimeControls.ts"),/installPs1Controls\(/);
 assert.match(sourceModule("application/gamePorts.ts"),/createGameLicensingPort\(getState\)/);
 assert.match(sourceModule("application/gamePorts.ts"),/createPs1ActionsPort\(getState\)/);
 assertCompositionAdaptersExclude(/\b(licenseEraGame|licenseGpuGame|buyPs1Disc|setPs1StationDisc|buyPs1SecondSeat|repairPs1Controls)\s*\(/);
});
