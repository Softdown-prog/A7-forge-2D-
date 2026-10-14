import {withStationOff} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseWindows,gameYear} from "../dist/js/sim/era.js";
import {buyPart,buyPlatform,hardwareFor,quotePart,quotePlatform,buildIssues} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseGames,contractSupplier,upgradeInternet,setHourlyPrice,stockItem,wholesaleCost} from "../dist/js/sim/economy.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {allowableHourlyPrice,annualHourlyCeiling,priceIndex,qualityMultiplier} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const SEEDS=[23,137],YEARS=[2005,2012],STRATEGIES=["legacy","partial","one-kit","all-kits","all-kits-gpu"];
const DAYS=240,OPENING_CAPITAL_1998=16000;
const round=n=>Math.round(n*100)/100;
const requireOk=(result,label)=>assert.equal(result.ok,true,label+": "+result.message);
const catalog={
 2005:{kit:"platform05",windows:"winxp",gpu:"gpu05"},
 2012:{kit:"platform12",windows:"win7",gpu:"gpu11"}
};
function annualMinutes(year){return (year-1998)*360*DAY_MINUTES;}
function fullPrice(s){
 const ceiling=allowableHourlyPrice(s);
 // API only accepts quarter-real steps, exactly as the game.
 requireOk(setHourlyPrice(s,ceiling),"hourly tariff "+ceiling);
 return ceiling;
}
function prep(year,seed,strategy){
 const s=createGame(seed,"historical");
 const initial=Math.round(OPENING_CAPITAL_1998*priceIndex(year));
 s.totalMinutes=annualMinutes(year);
 s.cash=initial;
 assert.equal(pcCount(s),3);
 requireOk(licenseGames(s),"legal games");
 requireOk(hireContentProgrammer(s),"filter");
 requireOk(contractSupplier(s),"wholesale");
 if(year>=2002)requireOk(upgradeInternet(s),"radio");
 if(year>=2007)requireOk(upgradeInternet(s),"fiber");
 const parts={cpu:"cpu00",ram:"ram256",storage:"hd20"};
 for(let i=0;i<3;i++){
  if(strategy==="partial"){
   for(const [kind,id] of Object.entries(parts))
    requireOk(withStationOff(s,i,()=>buyPart(s,i,kind,id)),"partial "+kind+" PC "+i);
   requireOk(withStationOff(s,i,()=>licenseWindows(s,i,"winxp")),"XP partial "+i);
  }else if(strategy==="one-kit"&&i===0||strategy==="all-kits"||strategy==="all-kits-gpu"){
   requireOk(withStationOff(s,i,()=>buyPlatform(s,i,catalog[year].kit)),"full kit PC "+i);
   if(strategy==="all-kits-gpu")
    requireOk(withStationOff(s,i,()=>buyGpu(s,i,catalog[year].gpu)),"graphics PC "+i);
   requireOk(withStationOff(s,i,()=>licenseWindows(s,i,catalog[year].windows)),"modern Windows PC "+i);
  }else requireOk(withStationOff(s,i,()=>licenseWindows(s,i,"win98")),"legacy Windows PC "+i);
  assert.equal(buildIssues(hardwareFor(s,i),s.pcGpus?.[i])[0],undefined);
 }
 const initialSpend=s.expenses;
 const rate=fullPrice(s);
 const quality=qualityMultiplier(s);
 const stationNames=s.pcComponents?.map(x=>x?.cpu??"cpu98")??["cpu98","cpu98","cpu98"];
 assert.ok(isValidSave(s));
 return {s,initial,initialSpend,rate,quality,stationNames};
}
function upkeep(s){
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))
   requireOk(stockItem(s,item),"restock "+item);
 for(let pc=0;pc<pcCount(s);pc++){
  const occupied=s.customers.some(c=>c.pcIndex===pc&&
    ["to_pc","sitting","using","standing"].includes(c.stage));
  if(pcWear(s,pc)>=75&&!occupied&&!s.repairJobs?.some(job=>job.pc===pc)&&s.cash>=120)
   requireOk(startRepair(s,pc),"repair "+pc);
 }
 if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=100)
  requireOk(requestCleaning(s),"cleaning");
}
function campaign(year,seed,strategy,days=DAYS){
 const setup=prep(year,seed,strategy);
 let s=setup.s;
 const months=[];
 let used=0,capacity=0,previousServed=0,previousSales=0,minCash=s.cash;
 for(let day=1;day<=days;day++){
  upkeep(s);
  for(let i=0;i<6;i++){
   stepGame(s,120);
   if(i===3){used+=s.customers.filter(c=>c.stage==="using").length;capacity+=pcCount(s);}
  }
  minCash=Math.min(minCash,s.cash);
  if(day%30===0){
   assert.ok(Math.abs(s.cash-(setup.initial+s.revenue-s.expenses))<.001,"money invariant "+year+" "+strategy+" "+day);
   assert.equal(s.economyVersion,2);
   assert.equal(s.totalMinutes,annualMinutes(year)+day*DAY_MINUTES);
   assert.ok(isValidSave(s),"save valid "+year+" "+strategy);
   assert.ok(s.pricePerHour<=allowableHourlyPrice(s));
   const realCapacity=s.lastMonthPcCapacityMinutes??0;
   const minutes=s.lastMonthPcUsedMinutes??0;
   assert.ok(realCapacity>0&&minutes>=0&&minutes<=realCapacity);
   months.push({month:day/30,year:gameYear(s),rate:s.pricePerHour,
    net:round(s.lastMonthRevenue-s.lastMonthExpenses),clients:s.served-previousServed,
    sales:s.purchases-previousSales,occupancy:round(minutes/realCapacity*100)});
   previousServed=s.served;previousSales=s.purchases;
  }
  if(day===120){
   const restored=parseImportedSave(serializeSave(s));
   for(const key of ["cash","revenue","expenses","rng","pricePerHour","totalMinutes","served","purchases"])
    assert.equal(restored[key],s[key],"save preserved "+key);
   assert.deepEqual(restored.pcComponents,s.pcComponents);
   assert.deepEqual(restored.pcWindows,s.pcWindows);
   assert.deepEqual(restored.pcGpus,s.pcGpus);
   assert.deepEqual(restored.stationLedger,s.stationLedger);
   s=restored;
  }
 }
 assert.ok(s.served>100);
 return {year,seed,strategy,days,startingCapital:setup.initial,
  initialSpend:round(setup.initialSpend),rate:setup.rate,quality:round(setup.quality),
  pcs:setup.stationNames,clients:s.served,sales:s.purchases,lost:s.lostCustomers,
  revenue:round(s.revenue),expenses:round(s.expenses),
  operatingNet:round(s.revenue-(s.expenses-setup.initialSpend)),
  netAfterPurchases:round(s.cash-setup.initial),
  reputation:round(s.reputation),occupancy:round(100*used/capacity),
  minCash:round(minCash),months};
}
test("2005: upgrade gradual real respeita socket, RAM, disco, Windows e custo",()=>{
 const game=createGame(101,"historical");
 game.totalMinutes=annualMinutes(2005);
 game.cash=9000;
 assert.equal(withStationOff(game,0,()=>quotePart(game,0,"cpu","cpu05")).ok,false,
  "CPU Socket 478 não instala isoladamente na placa Slot 1");
 assert.equal(withStationOff(game,0,()=>quotePart(game,0,"ram","ram1d")).ok,false,
  "DDR não instala isoladamente na placa SDRAM");
 assert.equal(withStationOff(game,0,()=>quotePart(game,0,"ram","ram256")).ok,true);
 const old=game.cash;
 requireOk(withStationOff(game,0,()=>buyPart(game,0,"cpu","cpu00")),"CPU Slot 1");
 requireOk(withStationOff(game,0,()=>buyPart(game,0,"ram","ram256")),"SDRAM");
 requireOk(withStationOff(game,0,()=>buyPart(game,0,"storage","hd20")),"IDE");
 requireOk(withStationOff(game,0,()=>licenseWindows(game,0,"winxp")),"XP");
 assert.equal(game.cash,old-180-100-120-260);
 assert.equal(hardwareFor(game,0).cpu,"cpu00");
 assert.equal(withStationOff(game,0,()=>quotePlatform(game,0,"platform05")).ok,true);
 assert.ok(allowableHourlyPrice(game)<=annualHourlyCeiling(2005));
 assert.ok(isValidSave(game));
});
test("2012: kit completo + GPU mantém peças e salva sem alterar economia clássica",()=>{
 const s=createGame(19,"historical"),classic=createGame(19);
 s.totalMinutes=annualMinutes(2012);s.cash=30000;
 requireOk(withStationOff(s,0,()=>buyPlatform(s,0,"platform12")),"platform 2012");
 requireOk(withStationOff(s,0,()=>buyGpu(s,0,"gpu11")),"GPU 2011");
 requireOk(withStationOff(s,0,()=>licenseWindows(s,0,"win7")),"Windows 7");
 assert.equal(hardwareFor(s,0).storage,"ssd512");
 assert.equal(hardwareFor(s,0).motherboard,"board12");
 assert.equal(parseImportedSave(serializeSave(s)).pcGpus[0],"gpu11");
 assert.equal(classic.economyVersion,undefined);
 assert.equal(classic.pricePerHour,12);
 assert.equal(classic.cash,850);
 assert.ok(isValidSave(s));
});
const full=process.env.LHS_STAGED_HARDWARE_AUDIT==="1";
test("2005 e 2012: 20 campanhas reais de 240 dias com investimentos por PC",
 {skip:!full},()=>{
 const rows=[];
 for(const year of YEARS)for(const seed of SEEDS)for(const strategy of STRATEGIES)
  rows.push(campaign(year,seed,strategy));
 assert.equal(rows.length,20);
 for(const year of YEARS)for(const seed of SEEDS){
  const group=rows.filter(r=>r.year===year&&r.seed===seed);
  assert.equal(group.length,5);
  const initial=group[0].startingCapital;
  assert.ok(group.every(r=>r.startingCapital===initial));
  const control=group.find(r=>r.strategy==="legacy");
  for(const r of group){
   assert.ok(Math.abs(r.netAfterPurchases-(r.revenue-r.expenses))<.02);
   assert.ok(r.rate<=annualHourlyCeiling(year));
   console.log("LHS_STAGED_HARDWARE_CAMPAIGN "+JSON.stringify({
    ...r,incrementalVsLegacy:round(r.netAfterPurchases-control.netAfterPurchases)}));
  }
 }
 for(const year of YEARS)for(const strategy of STRATEGIES){
  const group=rows.filter(r=>r.year===year&&r.strategy===strategy);
  const controls=rows.filter(r=>r.year===year&&r.strategy==="legacy");
  const mean=field=>round(group.reduce((sum,r)=>sum+r[field],0)/group.length);
  const reference=round(controls.reduce((sum,r)=>sum+r.netAfterPurchases,0)/controls.length);
  console.log("LHS_STAGED_HARDWARE_SUMMARY "+JSON.stringify({
   year,strategy,meanPrice:mean("rate"),meanQuality:mean("quality"),
   meanInitialSpend:mean("initialSpend"),meanNet:mean("netAfterPurchases"),
   incrementalVsLegacy:round(mean("netAfterPurchases")-reference),
   meanOperatingNet:mean("operatingNet"),meanClients:mean("clients"),
   meanReputation:mean("reputation"),meanOccupancy:mean("occupancy")}));
 }
});
