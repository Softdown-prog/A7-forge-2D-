import {withStationOff} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {LCD_CATALOG,buyLcdKit,installedLcd,stationModelName} from "../dist/js/sim/computerModels.js";
import {energyCostPerMinute,hardwareSatisfactionBonus,upgradeComputer} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {availableAnnexComputers,installAnnexComputer} from "../dist/js/sim/stations.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
const year=(s,y)=>s.totalMinutes=(y-1998)*360*DAY_MINUTES;
const modern=()=>{const s=createGame();s.cash=20000;s.pcTiers=[3,3,3];year(s,2024);return s;};
test("cinco gerações LCD chegam só no lançamento, após as três CRT",()=>{
 assert.deepEqual(LCD_CATALOG.map(m=>m.year),[2005,2008,2012,2017,2024]);
 const s=createGame();s.cash=20000;
 assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,false);year(s,2000);assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,true);
 year(s,2003);assert.equal(withStationOff(s,0,()=>upgradeComputer(s,0)).ok,true);
 let lastCost=s.expenses;
 for(const model of LCD_CATALOG){
  year(s,model.year);s.totalMinutes--;const before=structuredClone(s);
  assert.equal(withStationOff(s,0,()=>buyLcdKit(s,0,model.id)).ok,false);assert.deepEqual(s,before);
  s.totalMinutes++;assert.equal(withStationOff(s,0,()=>buyLcdKit(s,0,model.id)).ok,true);
  assert.equal(s.expenses,lastCost+model.cost);lastCost=s.expenses;
  assert.equal(s.cash,20000-s.expenses);assert.equal(installedLcd(s,0),model.id);
 }
});
test("compra individual conserva GPU, Windows, desgaste e PCs vizinhos",()=>{
 const s=modern();s.pcGpus=[null,"gpu13",null];s.pcWindows=["win98","winxp","winvista"];
 s.pcWindowsLicenses=[false,true,true];s.pcWear=[0,75,20];
 const before=structuredClone(s),model=LCD_CATALOG[2];
 assert.equal(withStationOff(s,1,()=>buyLcdKit(s,1,model.id)).ok,true);
 assert.deepEqual(s.pcLcdModels,[null,model.id,null]);
 for(const key of ["pcGpus","pcWindows","pcWindowsLicenses","pcWear","pcTiers"])assert.deepEqual(s[key],before[key]);
 assert.equal(s.cash,before.cash-model.cost);assert.equal(s.expenses,before.expenses+model.cost);
 assert.equal(stationModelName(s,1),model.name);
});
test("falhas de compra são atômicas: índice, modelo, caixa e pré-requisito",()=>{
 for(const [index,id,setup] of [[-1,"lcd05"],[3,"lcd05"],[.5,"lcd05"],[0,"desconhecido"],
  [0,"lcd05",s=>s.cash=579],[0,"lcd05",s=>s.pcTiers[0]=2]]){
  const s=modern();setup?.(s);const before=structuredClone(s);
  assert.equal(withStationOff(s,index,()=>buyLcdKit(s,index,id)).ok,false);assert.deepEqual(s,before);
 }
});
test("não troca estação reservada, em uso ou em reparo",()=>{
 for(const stage of ["to_pc","sitting","using","standing","repair"]){
  const s=modern();if(stage==="repair")s.repairJobs=[{pc:0,progress:1,duration:10}];
  else s.customers=[{id:1,pcIndex:0,stage}];
  const before=structuredClone(s);assert.equal(withStationOff(s,0,()=>buyLcdKit(s,0,"lcd05")).ok,false);assert.deepEqual(s,before);
 }
});
test("pode saltar gerações disponíveis, mas não repetir compra ou regredir",()=>{
 const s=modern();assert.equal(withStationOff(s,2,()=>buyLcdKit(s,2,"lcd24")).ok,true);const before=structuredClone(s);
 for(const model of LCD_CATALOG){assert.equal(withStationOff(s,2,()=>buyLcdKit(s,2,model.id)).ok,false);assert.deepEqual(s,before);}
});
test("LCD acrescenta benefício modesto e reduz energia sem mudar a tarifa",()=>{
 for(const model of LCD_CATALOG){
  const s=modern(),energy=energyCostPerMinute(s,2),bonus=hardwareSatisfactionBonus(s,1);
  assert.equal(withStationOff(s,1,()=>buyLcdKit(s,1,model.id)).ok,true);
  assert.ok(energyCostPerMinute(s,2)<energy);assert.ok(energyCostPerMinute(s,2)>0);
  assert.ok(Math.abs(hardwareSatisfactionBonus(s,1)-bonus-model.bonus)<1e-10);
  assert.equal(s.pricePerHour,12);
 }
});
test("save mantém kits e aceita partidas antigas, rejeitando catálogo inválido",()=>{
 const s=modern();assert.equal(withStationOff(s,1,()=>buyLcdKit(s,1,"lcd17")).ok,true);
 const loaded=parseImportedSave(serializeSave(s));assert.deepEqual(loaded,s);
 const old=createGame();assert.equal(installedLcd(old,0),null);assert.ok(isValidSave(old));
 assert.equal(stationModelName(old,0),"CRT · geração 1");
 for(const invalid of [["lcd99"],[false],"lcd05",Array(201).fill(null)]){
  const bad={...s,pcLcdModels:invalid};assert.equal(isValidSave(bad),false);
  const envelope=JSON.parse(serializeSave(s));envelope.state.pcLcdModels=invalid;
  assert.throws(()=>parseImportedSave(JSON.stringify(envelope)),/inválid/);
 }
});
test("LCD do anexo acompanha reindexação quando se compra um PC original",()=>{
 const s=modern();s.roomExtensions={west:1,east:0,south:0,north:0};
 const slot=availableAnnexComputers(s)[0];assert.ok(slot);
 assert.equal(installAnnexComputer(s,slot.id).ok,true);s.pcTiers[3]=3;
 assert.equal(withStationOff(s,3,()=>buyLcdKit(s,3,"lcd12")).ok,true);s.expansionLevel=1;
 assert.equal(buyComputer(s).ok,true);assert.equal(installedLcd(s,3),null);assert.equal(installedLcd(s,4),"lcd12");
 s.roomExtensions.west=2;const next=availableAnnexComputers(s)[0];assert.ok(next);
 assert.equal(installAnnexComputer(s,next.id).ok,true);assert.equal(installedLcd(s,5),null);
});
test("sessões e conservação financeira continuam após instalação dos cinco kits",()=>{
 for(const model of LCD_CATALOG){
  const s=modern();const initial=s.cash;assert.equal(withStationOff(s,0,()=>buyLcdKit(s,0,model.id)).ok,true);
  stepGame(s,720);
  assert.equal(s.cash,initial+s.revenue-s.expenses);assert.ok(s.served>0);
  assert.ok(Number.isFinite(s.energyAccrued));assert.equal(installedLcd(s,0),model.id);
 }
});
