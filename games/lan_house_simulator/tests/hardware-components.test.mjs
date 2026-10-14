import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {hardwareFor,buildParts,buildIssues,buyPart,buyPlatform,quotePart,quotePlatform,componentSatisfactionBonus,
 HARDWARE_CATALOG,PLATFORM_KITS,windowsHardwareIssues,requiredPsuWatts} from "../dist/js/sim/hardware.js";
import {licenseWindows,installedWindows,WINDOWS_ERAS} from "../dist/js/sim/era.js";
import {upgradeComputer,energyCostPerMinute,hardwareSatisfactionBonus} from "../dist/js/sim/economy.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {availableAnnexComputers,installAnnexComputer} from "../dist/js/sim/stations.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
const year=(s,y)=>s.totalMinutes=(y-1998)*360*DAY_MINUTES;
const state=(y=2024)=>{const s=createGame();s.cash=50000;year(s,y);return s;};
const act=r=>assert.equal(r.ok,true,r.message);
test("Windows 98 mostra a máquina inicial concreta; leitura não muda o save",()=>{
 const s=createGame(),before=structuredClone(s),p=buildParts(hardwareFor(s,0));
 assert.equal(p.cpu.mhz,350);assert.equal(p.cpu.cores,1);assert.equal(p.ram.ramMb,64);
 assert.equal(p.storage.capacityGb,4);assert.equal(p.motherboard.socket,"Slot 1");assert.equal(p.psu.watts,350);
 assert.equal(installedWindows(s,0),"win98");assert.deepEqual(s,before);
 for(const tier of [1,2,3]){s.pcTiers[0]=tier;assert.deepEqual(hardwareFor(s,0),PLATFORM_KITS[tier-1].components);assert.equal(componentSatisfactionBonus(s,0),(tier-1)*.08);}
});
test("catálogo usa IDs únicos, preços inteiros e kits coerentes com seu ano",()=>{
 assert.equal(new Set(HARDWARE_CATALOG.map(p=>p.id)).size,HARDWARE_CATALOG.length);
 for(const p of HARDWARE_CATALOG){assert.ok(Number.isInteger(p.cost)&&p.cost>0);assert.ok(p.year>=1998);}
 for(const kit of PLATFORM_KITS){assert.deepEqual(buildIssues(kit.components),[]);for(const p of Object.values(buildParts(kit.components)))assert.ok(p.year<=kit.year);}
 assert.deepEqual(PLATFORM_KITS.map(k=>k.year),[1998,2000,2003,2005,2008,2012,2017,2024]);
});
test("cada peça e cada plataforma bloqueiam o minuto anterior ao lançamento",()=>{
 for(const p of HARDWARE_CATALOG.filter(p=>p.year>1998)){
  const s=state(p.year);s.totalMinutes--;const before=structuredClone(s);
  assert.equal(buyPart(s,0,p.kind,p.id).ok,false);assert.deepEqual(s,before);
 }
 for(const k of PLATFORM_KITS.slice(1)){
  const s=state(k.year);s.totalMinutes--;const before=structuredClone(s);
  assert.equal(buyPlatform(s,0,k.id).ok,false);assert.deepEqual(s,before);
 }
});
test("oito gerações pagas renovam só PC 02 e preservam os demais",()=>{
 const s=state(),initial=s.cash;s.pcWear=[10,65,20];s.pcLcdModels=[null,"lcd05",null];s.pcGpus=[null,"gpu05",null];
 s.pcWindows=["win98","winxp","win98"];s.pcWindowsLicenses=[true,true,false];
 const neighbors=[hardwareFor(s,0),hardwareFor(s,2)];
 for(const kit of PLATFORM_KITS.slice(1)){
  year(s,kit.year);const quote=quotePlatform(s,1,kit.id),cash=s.cash,expenses=s.expenses;
  act(buyPlatform(s,1,kit.id));assert.equal(s.cash,cash-quote.cost);assert.equal(s.expenses,expenses+quote.cost);
  assert.deepEqual(hardwareFor(s,1),quote.components);assert.equal(s.cash,initial-s.expenses);
  assert.deepEqual([hardwareFor(s,0),hardwareFor(s,2)],neighbors);
  assert.equal(installedWindows(s,1),"winxp");assert.equal(s.pcWindowsLicenses[1],true);assert.equal(s.pcGpus[1],"gpu05");assert.equal(s.pcLcdModels[1],"lcd05");assert.deepEqual(s.pcWear,[10,65,20]);
 }
});
test("RAM, CPU, HD e fonte podem ser substituídos individualmente",()=>{
 const s=state(2003),original=hardwareFor(s,0);act(buyPart(s,0,"ram","ram256"));
 assert.deepEqual(hardwareFor(s,0),{...original,ram:"ram256"});assert.equal(s.pcComponents[1],null);
 act(buyPart(s,0,"cpu","cpu00"));act(buyPart(s,0,"storage","hd20"));
 const before=energyCostPerMinute(s,1),bonus=hardwareSatisfactionBonus(s,0);
 act(buyPart(s,0,"psu","psu400"));assert.equal(energyCostPerMinute(s,1),before);assert.equal(hardwareSatisfactionBonus(s,0),bonus);
 assert.equal(s.pcComponents[0].ram,"ram256");assert.equal(s.pcComponents[0].cpu,"cpu00");assert.equal(s.pcComponents[0].storage,"hd20");
});
test("trocas incompatíveis, repetidas, inferiores e sem caixa são atômicas",()=>{
 for(const [kind,id] of [["cpu","cpu03"],["ram","ram8d3"],["storage","ssd512"],["motherboard","board17"],["psu","cpu98"],["cpu","desconhecido"]]){
  const s=state(),before=structuredClone(s);assert.equal(buyPart(s,0,kind,id).ok,false);assert.deepEqual(s,before);
 }
 const s=state();act(buyPart(s,0,"ram","ram256"));
 for(const id of ["ram256","ram128","ram64"]){const before=structuredClone(s);assert.equal(buyPart(s,0,"ram",id).ok,false);assert.deepEqual(s,before);}
 s.cash=0;const before=structuredClone(s);assert.equal(buyPart(s,0,"psu","psu400").ok,false);assert.deepEqual(s,before);
 for(const i of [-1,.5,3,NaN]){assert.equal(buyPlatform(s,i,"platform24").ok,false);assert.equal(buyPart(s,i,"ram","ram256").ok,false);assert.deepEqual(s,before);}
});
test("reservas, clientes e técnico bloqueiam peças e Windows nesta estação",()=>{
 for(const stage of ["to_pc","sitting","using","standing","repair"]){
  const s=state();if(stage==="repair")s.repairJobs=[{pc:1,progress:0,duration:15}];else s.customers=[{id:1,stage,pcIndex:1}];
  const before=structuredClone(s);assert.equal(buyPart(s,1,"ram","ram256").ok,false);assert.equal(buyPlatform(s,1,"platform24").ok,false);
  assert.equal(licenseWindows(s,1,"winxp").ok,false);assert.deepEqual(s,before);
  act(buyPart(s,0,"ram","ram256"));
 }
});
test("kit conserva peças melhores e não cobra RAM já possuída",()=>{
 const s=state();act(buyPart(s,0,"ram","ram512s"));act(buyPart(s,0,"storage","hd40"));act(buyPart(s,0,"psu","psu1000"));
 const quote=quotePlatform(s,0,"platform00");assert.equal(quote.cost,240);act(buyPlatform(s,0,"platform00"));
 assert.equal(s.pcComponents[0].ram,"ram512s");assert.equal(s.pcComponents[0].storage,"hd40");assert.equal(s.pcComponents[0].psu,"psu1000");
 act(upgradeComputer(s,0));assert.equal(s.pcComponents[0].ram,"ram512d");assert.equal(s.pcComponents[0].psu,"psu1000");
});
test("migração preserva capacidade de RAM e disco, com preço explícito de memória nova",()=>{
 const s=state(2017);act(buyPlatform(s,0,"platform12"));act(buyPart(s,0,"ram","ram32d3"));
 const before=structuredClone(s);assert.equal(buyPlatform(s,0,"platform17").ok,false);assert.deepEqual(s,before);
 year(s,2019);const quote=quotePlatform(s,0,"platform17");assert.equal(quote.components.ram,"ram32d4");assert.equal(quote.cost,2890+580-380);
 act(buyPlatform(s,0,"platform17"));assert.equal(buildParts(hardwareFor(s,0)).ram.ramMb,32768);
 const disk=state();act(buyPlatform(disk,0,"platform03"));act(buyPart(disk,0,"storage","hd1000"));act(buyPlatform(disk,0,"platform12"));
 assert.equal(disk.pcComponents[0].storage,"hd1000");assert.equal(buildParts(hardwareFor(disk,0)).storage.capacityGb,1000);
});
test("Windows 98 a 11: requisitos, lançamento e licença continuam por PC",()=>{
 const s=state(2001);act(licenseWindows(s,0,"winxp"));assert.equal(installedWindows(s,0),"winxp");assert.equal(installedWindows(s,1),"win98");
 year(s,2007);const before=structuredClone(s);assert.equal(licenseWindows(s,1,"winvista").ok,false);assert.deepEqual(s,before);
 year(s,2021);assert.ok(windowsHardwareIssues(s,1,"win11").length>=3);assert.equal(licenseWindows(s,1,"win11").ok,false);
 act(buyPlatform(s,1,"platform17"));act(licenseWindows(s,1,"win11"));assert.deepEqual(windowsHardwareIssues(s,1,"win11"),[]);
 assert.equal(installedWindows(s,0),"winxp");assert.equal(installedWindows(s,2),"win98");
 assert.equal(s.pcWindowsLicenses[1],true);const again=structuredClone(s);assert.equal(licenseWindows(s,1,"win11").ok,false);assert.deepEqual(s,again);
 assert.deepEqual(WINDOWS_ERAS.map(e=>e.id),["win98","win2000","winxp","winvista","win7","win8","win10","win11"]);
});
test("fonte considera CPU, RAM, disco e GPU com margem; GPU insuficiente não é comprada",()=>{
 const s=state();act(buyPlatform(s,0,"platform24"));s.pcComponents[0].psu="psu350";
 const needed=requiredPsuWatts(hardwareFor(s,0),"gpu13");assert.equal(needed,450);const before=structuredClone(s);
 assert.equal(buyGpu(s,0,"gpu13").ok,false);assert.deepEqual(s,before);
 act(buyPart(s,0,"psu","psu500"));act(buyGpu(s,0,"gpu13"));assert.deepEqual(buildIssues(hardwareFor(s,0),s.pcGpus[0]),[]);
});
test("save mantém fichas e novos Windows e rejeita combinações inválidas",()=>{
 const s=state();act(buyPlatform(s,1,"platform24"));act(licenseWindows(s,1,"win11"));
 assert.deepEqual(parseImportedSave(serializeSave(s)),s);assert.ok(isValidSave(createGame()));
 const badValues=["cpu24",[{cpu:"cpu98"}],[{...s.pcComponents[1],cpu:"cpu98"}],[{...s.pcComponents[1],ram:"ram64"}],[{...s.pcComponents[1],storage:"hd4"}],Array(201).fill(null)];
 for(const pcComponents of badValues){const bad={...s,pcComponents};assert.equal(isValidSave(bad),false);}
 const badGpu=structuredClone(s);badGpu.pcComponents[1].psu="psu350";badGpu.pcGpus[1]="gpu13";assert.equal(isValidSave(badGpu),false);
 const badOs={...s,pcWindows:["win99"]};assert.equal(isValidSave(badOs),false);
 assert.equal(isValidSave({...createGame(),pcWindows:["win11"]}),false);
 assert.equal(isValidSave({...createGame(),pcWindows:"win11"}),false);
 const legacy=state();legacy.pcTiers=[1,2,3];const a=hardwareFor(legacy,2);assert.deepEqual(hardwareFor(parseImportedSave(serializeSave(legacy)),2),a);
});
test("ficha do anexo é deslocada junto com Windows/GPU após comprar PC original",()=>{
 const s=state();s.roomExtensions={west:1,east:0,south:0,north:0};act(installAnnexComputer(s,availableAnnexComputers(s)[0].id));
 act(buyPlatform(s,3,"platform17"));act(licenseWindows(s,3,"win11"));const old=hardwareFor(s,3);
 s.expansionLevel=1;act(buyComputer(s));assert.deepEqual(hardwareFor(s,4),old);assert.equal(installedWindows(s,4),"win11");
 assert.deepEqual(hardwareFor(s,3),PLATFORM_KITS[0].components);assert.equal(installedWindows(s,3),"win98");
 s.roomExtensions.west=2;act(installAnnexComputer(s,availableAnnexComputers(s)[0].id));assert.deepEqual(hardwareFor(s,5),PLATFORM_KITS[0].components);
});
test("configuração moderna participa de uso, energia e contabilidade reais",()=>{
 const s=state();const capital=s.cash;act(buyPlatform(s,1,"platform24"));act(licenseWindows(s,1,"win11"));
 assert.ok(componentSatisfactionBonus(s,1)>componentSatisfactionBonus(s,0));assert.ok(energyCostPerMinute(s,1)>0);
 for(let minute=0;minute<720*3;minute+=120)stepGame(s,120);
 assert.ok(s.served>0);assert.equal(s.cash,capital+s.revenue-s.expenses);
 assert.equal(s.stationLedger.reduce((n,pc)=>n+pc.sessions,0),s.served);assert.ok(s.stationLedger[1].sessions>0);
 assert.equal(installedWindows(s,0),"win98");assert.equal(installedWindows(s,1),"win11");assert.ok(isValidSave(s));
});
