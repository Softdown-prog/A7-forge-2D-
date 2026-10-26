import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {createStationActionsPort} from "../dist/js/application/stationActionsPort.js";
import {installStationControls} from "../dist/js/ui/stationControls.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("a porta de estações valida indices e catalogos sem mutar a partida",()=>{
 const s=createGame(57,"historical"),port=createStationActionsPort(()=>s);
 assert.equal(port.count(),3);
 for(const [method,args] of [
  ["power",[-1]],["power",[999]],["power",[1.5]],["repair",[NaN]],["upgrade",[999]],
  ["windows",[0,"win999"]],["lcd",[0,"lcd999"]],["gpu",[0,"gpu999"]],
  ["component",[0,"made-up","cpu98"]],["platform",[999,"platform00"]]
 ]){
  const before=JSON.stringify(s),result=port[method](...args);
  assert.equal(result.ok,false,method+" should reject invalid input");
  assert.equal(JSON.stringify(s),before,method+" must not mutate on rejection");
 }
 assert.equal(port.isHardwareTab("platform"),true);
 assert.equal(port.isHardwareTab("cpu"),true);
 assert.equal(port.isHardwareTab("__proto__"),false);
 assert.equal(port.isHardwareKind("ram"),true);
 assert.equal(port.isHardwareKind("delete"),false);
 assert.equal(port.isWindowsEdition("winxp"),true);
 assert.equal(port.isLcdId("lcd05"),true);
 assert.equal(port.isGpuId("gpu05"),true);
});

test("desligar/ligar estação conserva save e usa a nova instancia apos importar",()=>{
 let s=createGame(71,"historical");
 const port=createStationActionsPort(()=>s);
 assert.equal(port.power(0).ok,true);
 assert.equal(s.pcPoweredOff?.[0],true);
 assert.equal(isValidSave(s),true);
 const old=s,loaded=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(loaded),true);
 s=loaded;
 assert.equal(port.power(0).ok,true);
 assert.equal(s.pcPoweredOff?.[0],false);
 assert.equal(old.pcPoweredOff?.[0],true);
});

test("UI delega cliques de hardware, GPU e Windows sem acessar o motor",()=>{
 const originalElement=globalThis.Element,originalButton=globalThis.HTMLButtonElement;
 class FakeElement {closest(){return this;}}
 class FakeButton extends FakeElement {
  constructor(dataset={},disabled=false){super();this.dataset=dataset;this.disabled=disabled;}
 }
 const fakeRoot=()=>{
  let click;
  return {addEventListener:(event,fn)=>{assert.equal(event,"click");click=fn;},
   trigger:dataset=>{assert.ok(click);click({target:new FakeButton(dataset)});}
  };
 };
 globalThis.Element=FakeElement;globalThis.HTMLButtonElement=FakeButton;
 try{
  const maintenance=fakeRoot(),gpuChoices=fakeRoot(),gpuCatalog=fakeRoot(),windowsLicenses=fakeRoot();
  const calls=[],port={
   count:()=>3,isHardwareTab:t=>t==="platform"||t==="cpu",isHardwareKind:t=>t==="cpu",
   isWindowsEdition:id=>id==="winxp",isGpuId:id=>id==="gpu05",isLcdId:id=>id==="lcd05",
   gpu:(i,id)=>{calls.push(["gpu",i,id]);return {ok:true,message:"gpu"};},
   windows:(i,id)=>{calls.push(["windows",i,id]);return {ok:true,message:"windows"};},
   platform:(i,id)=>{calls.push(["platform",i,id]);return {ok:true,message:"platform"};},
   component:(i,k,id)=>{calls.push(["component",i,k,id]);return {ok:true,message:"component"};},
   lcd:(i,id)=>{calls.push(["lcd",i,id]);return {ok:true,message:"lcd"};},
   power:i=>{calls.push(["power",i]);return {ok:true,message:"power"};},
   repair:i=>{calls.push(["repair",i]);return {ok:true,message:"repair"};},
   upgrade:i=>{calls.push(["upgrade",i]);return {ok:true,message:"upgrade"};}
  };
  let station=0,gpu=0,tab="platform",results=0;
  installStationControls({maintenance,gpuChoices,gpuCatalog,windowsLicenses},port,{
   selectedStation:()=>station,selectedGpu:()=>gpu,
   selectStation:i=>{station=i;gpu=i;},
   selectGpu:i=>{gpu=i;station=i;},
   selectHardwareTab:t=>{tab=t;},
   onResult:()=>{results++;}
  });
  gpuChoices.trigger({gpuSelect:"2"});
  gpuCatalog.trigger({gpuBuy:"gpu05"});
  maintenance.trigger({hardwareSelect:"1"});
  maintenance.trigger({hardwareTab:"cpu"});
  maintenance.trigger({hardwarePart:"cpu00",hardwareKind:"cpu"});
  maintenance.trigger({pcPower:"1"});
  maintenance.trigger({pcRepair:"1"});
  maintenance.trigger({pcUpgrade:"1"});
  maintenance.trigger({hardwareKit:"platform00"});
  maintenance.trigger({lcdBuy:"lcd05"});
  windowsLicenses.trigger({winPc:"1",winEdition:"winxp"});
  assert.equal(tab,"cpu");
  assert.deepEqual(calls,[
   ["gpu",2,"gpu05"],["component",1,"cpu","cpu00"],["power",1],
   ["repair",1],["upgrade",1],["platform",1,"platform00"],
   ["lcd",1,"lcd05"],["windows",1,"winxp"]
  ]);
  assert.equal(results,8);
  maintenance.trigger({pcPower:"999"});
  assert.equal(results,9,"porta continua recebendo indices invalidos para rejeitar");
  gpuChoices.trigger({gpuSelect:"777"});
  assert.equal(gpu,1);
 } finally{
  if(originalElement===undefined)delete globalThis.Element;else globalThis.Element=originalElement;
  if(originalButton===undefined)delete globalThis.HTMLButtonElement;else globalThis.HTMLButtonElement=originalButton;
 }
});

test("main nao chama diretamente acoes de hardware; UI nao importa sim",()=>{
 const root=new URL("../src/",import.meta.url);
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/stationControls.ts",root),"utf8");
 const application=readFileSync(new URL("application/stationActionsPort.ts",root),"utf8");
 assert.match(main,/installStationControls\(/);
 assert.match(main,/createStationActionsPort\(\(\)=>game\)/);
 assert.doesNotMatch(main,/\b(buyPart|buyPlatform|buyGpu|buyLcdKit|licenseWindows|toggleStationPower|repairComputer|upgradeComputer)\s*\(/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/render\//);
 assert.doesNotMatch(application,/\bwindow\b|\bdocument\b|\bHTMLElement\b/);
});
