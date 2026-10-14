import {withStationOff} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear,licenseWindows} from "../dist/js/sim/era.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {buyLcdKit} from "../dist/js/sim/computerModels.js";
import {licenseGames,contractSupplier,upgradeInternet,setHourlyPrice,stockItem,wholesaleCost} from "../dist/js/sim/economy.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {allowableHourlyPrice,annualHourlyCeiling,priceIndex,qualityMultiplier} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

// All gameplay transitions use real engine/API, no fabricated customers, sales,
// equipment, demand, supplies or subsidies after the initial lab endowment.
const YEARS=[1998,2005,2012,2024],SEEDS=[23,137],DAYS=120;
const MONTH=30,INITIAL_BASE=18000;
const ROUND=n=>Math.round(n*100)/100;
const accept=(r,what)=>assert.equal(r.ok,true,what+": "+r.message);
const kit={2005:"platform05",2012:"platform12",2024:"platform24"};
const gpu={2005:"gpu05",2012:"gpu11",2024:"gpu13"};
const lcd={2005:"lcd05",2012:"lcd12",2024:"lcd24"};
const windows={2005:"winxp",2012:"win7",2024:"win11"};

function prepare(year,seed,variant){
 const s=createGame(seed,"historical");
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 // Controlled research funding, declared upfront and matched across arms.
 // NOT representative of the R$ 850 opening budget.
 const initial=Math.round(INITIAL_BASE*priceIndex(year));
 s.cash=initial;
 assert.equal(pcCount(s),3);
 accept(licenseGames(s),"games license");
 accept(hireContentProgrammer(s),"content programmer");
 accept(contractSupplier(s),"supplier partnership");
 if(year>=2002)accept(upgradeInternet(s),"internet radio");
 if(year>=2007)accept(upgradeInternet(s),"internet fiber");
 for(let i=0;i<3;i++){
  if(variant==="modern"){
   accept(withStationOff(s,i,()=>buyPlatform(s,i,kit[year])),"platform "+year+" #"+i);
   accept(withStationOff(s,i,()=>buyGpu(s,i,gpu[year])),"gpu "+year+" #"+i);
   accept(withStationOff(s,i,()=>buyLcdKit(s,i,lcd[year])),"lcd "+year+" #"+i);
   accept(withStationOff(s,i,()=>licenseWindows(s,i,windows[year])),"windows "+year+" #"+i);
  }else accept(withStationOff(s,i,()=>licenseWindows(s,i,"win98")),"legacy windows #"+i);
 }
 const quality=qualityMultiplier(s);
 const permitted=allowableHourlyPrice(s);
 const target=variant==="opening"?2.5:permitted;
 accept(setHourlyPrice(s,target),"allowed hourly price");
 assert.ok(s.pricePerHour<=annualHourlyCeiling(year));
 assert.ok(s.pricePerHour<=allowableHourlyPrice(s));
 assert.equal(s.cash,initial-s.expenses);
 return {s,initial,initialSpend:s.expenses,quality,permitted};
}
function upkeep(s,charges={stock:0,repairs:0,cleaning:0,engine:0}){
 for(const item of ["soda","candy","snacks"]){
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item)){
   const before=s.expenses;
   accept(stockItem(s,item),"stock "+item);
   charges.stock+=s.expenses-before;
  }
 }
 for(let i=0;i<pcCount(s);i++){
  const occupied=s.customers.some(c=>c.pcIndex===i&&["to_pc","sitting","using","standing"].includes(c.stage));
  if(pcWear(s,i)>=75&&!occupied&&!s.repairJobs?.some(job=>job.pc===i)&&s.cash>=100){
   const before=s.expenses;
   accept(startRepair(s,i),"repair "+i);
   charges.repairs+=s.expenses-before;
  }
 }
 if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=55){
  const before=s.expenses;
  accept(requestCleaning(s),"clean");
  charges.cleaning+=s.expenses-before;
 }
}
function campaign(year,seed,variant){
 const setup=prepare(year,seed,variant);
 let s=setup.s;
 let previousRevenue=0,previousExpenses=0,previousServed=0,previousSold=0;
 const months=[];
 let busy=0,capacity=0,minCash=s.cash;
 const charges={stock:0,repairs:0,cleaning:0,engine:0};
 for(let day=1;day<=DAYS;day++){
  upkeep(s,charges);
  for(let part=0;part<6;part++){
   const before=s.expenses;
   stepGame(s,120);
   charges.engine+=s.expenses-before;
   if(part===3){
    busy+=s.customers.filter(c=>c.stage==="using").length;
    capacity+=pcCount(s);
   }
  }
  minCash=Math.min(minCash,s.cash);
  if(day%MONTH===0){
   const diff=Math.abs(s.cash-(setup.initial+s.revenue-s.expenses));
   assert.ok(diff<.001,"money invariant "+JSON.stringify({year,seed,variant,day,diff}));
   assert.equal(s.economyVersion,2);
   assert.equal(s.totalMinutes,((year-1998)*360+day)*DAY_MINUTES);
   assert.ok(Number.isFinite(s.cash)&&Number.isFinite(s.revenue)&&Number.isFinite(s.expenses));
   assert.ok(s.reputation>=10&&s.reputation<=100);
   assert.ok(s.pricePerHour<=allowableHourlyPrice(s));
   assert.ok(isValidSave(s));
   const records={month:day/30,price:s.pricePerHour,year:gameYear(s),
    revenue:ROUND(s.revenue-previousRevenue),expenses:ROUND(s.expenses-previousExpenses),
    served:s.served-previousServed,sold:s.purchases-previousSold,
    occupancy:ROUND(100*(s.lastMonthPcUsedMinutes??0)/(s.lastMonthPcCapacityMinutes||1))};
   assert.ok(records.occupancy>=0&&records.occupancy<=100);
   months.push(records);
   previousRevenue=s.revenue;previousExpenses=s.expenses;
   previousServed=s.served;previousSold=s.purchases;
  }
  if(day===60){
   const recovered=parseImportedSave(serializeSave(s));
   for(const key of ["cash","revenue","expenses","pricePerHour","totalMinutes","rng","served","purchases"])
    assert.equal(recovered[key],s[key],key+" roundtrip");
   assert.deepEqual(recovered.pcComponents,s.pcComponents);
   assert.deepEqual(recovered.pcWindows,s.pcWindows);
   s=recovered;
  }
 }
 assert.equal(months.length,DAYS/30);
 assert.ok(Math.abs(Object.values(charges).reduce((sum,value)=>sum+value,0)+setup.initialSpend-s.expenses)<.001,
   "all outgoing funds attributed");
 return {year,seed,variant,days:DAYS,initialCapital:setup.initial,
  initialSpend:setup.initialSpend,quality:ROUND(setup.quality),
  hourlyPrice:s.pricePerHour,maxAllowed:setup.permitted,
  clients:s.served,products:s.purchases,lost:s.lostCustomers,
  revenue:ROUND(s.revenue),expenses:ROUND(s.expenses),
  operatingNet:ROUND(s.revenue-(s.expenses-setup.initialSpend)),
  netAfterInvestment:ROUND(s.cash-setup.initial),
  reputation:ROUND(s.reputation),occupancy:ROUND(100*busy/capacity),
  minCash:ROUND(minCash),
  charges:Object.fromEntries(Object.entries(charges).map(([k,v])=>[k,ROUND(v)])),
  months};
}
const full=process.env.LHS_HISTORICAL_AUDIT==="1";
// Lightweight real-engine gate; comprehensive matrix is opt-in.
test("1998: partida histórica mantém recibos em centavos, saves e conta do primeiro mês",()=>{
 const setup=prepare(1998,23,"opening");
 const s=setup.s;
 for(let i=0;i<30;i++){upkeep(s);for(let part=0;part<6;part++)stepGame(s,120);}
 assert.equal(gameYear(s),1998);
 assert.equal(s.economyVersion,2);
 assert.equal(s.totalMinutes,30*DAY_MINUTES);
 assert.ok(Math.abs(s.cash-(setup.initial+s.revenue-s.expenses))<.001);
 assert.ok(s.pricePerHour<=3);
 assert.equal(parseImportedSave(serializeSave(s)).cash,s.cash);
});
test("1998/2005/2012/2024: matriz real por equipamento e preço, pares de sementes",
 {skip:!full},()=>{
 const rows=[];
 for(const year of YEARS)for(const seed of SEEDS)
  for(const variant of year===1998?["opening","ceiling"]:["vintage","modern"])
   rows.push(campaign(year,seed,variant));
 assert.equal(rows.length,16);
 for(const year of YEARS)for(const seed of SEEDS){
  const pair=rows.filter(r=>r.year===year&&r.seed===seed);
  assert.equal(pair.length,2);
  assert.equal(pair[0].initialCapital,pair[1].initialCapital);
  assert.ok(pair[1].hourlyPrice>=pair[0].hourlyPrice||year===1998);
  if(year>1998)assert.ok(pair[1].initialSpend>pair[0].initialSpend);
  for(const r of pair)assert.ok(Number.isFinite(r.netAfterInvestment)&&
   Math.abs(r.revenue-r.expenses-r.netAfterInvestment)<.01);
 }
 rows.forEach(r=>console.log("LHS_HISTORICAL_CAMPAIGN "+JSON.stringify(r)));
 for(const year of YEARS)for(const variant of year===1998?["opening","ceiling"]:["vintage","modern"]){
  const selected=rows.filter(r=>r.year===year&&r.variant===variant);
  const average=key=>ROUND(selected.reduce((a,r)=>a+r[key],0)/selected.length);
  console.log("LHS_HISTORICAL_SUMMARY "+JSON.stringify({year,variant,
   avgHourlyPrice:average("hourlyPrice"),avgNet:average("netAfterInvestment"),
   avgOperatingNet:average("operatingNet"),avgClients:average("clients"),
   avgProducts:average("products"),avgReputation:average("reputation"),
   avgOccupancy:average("occupancy"),avgInitialSpend:average("initialSpend")}));
 }
});

/** Opening-game stress check: no research funding, no injected visitors,
 * no pre-granted equipment or imported cash. The player has only R$ 850. */
function openingBusiness(seed){
 let s=createGame(seed,"historical"),minCash=s.cash;
 const capital=s.cash,months=[];
 accept(licenseGames(s),"startup games");
 accept(hireContentProgrammer(s),"startup programmer");
 let licensed=0,supplierBought=false;
 for(let day=1;day<=120;day++){
  for(let i=0;i<3;i++){
   if(!(s.pcWindowsLicenses?.[i])&&s.cash>=250)
    accept(withStationOff(s,i,()=>licenseWindows(s,i,"win98")),"startup Windows "+i);
  }
  if(s.pcWindowsLicenses?.every(Boolean)&&s.supplierTier!==2&&s.cash>=350){
   accept(contractSupplier(s),"startup supplier");supplierBought=true;
  }
  upkeep(s);
  for(let part=0;part<6;part++)stepGame(s,120);
  minCash=Math.min(minCash,s.cash);
  if(day%30===0){
   assert.ok(Math.abs(s.cash-(capital+s.revenue-s.expenses))<.001);
   months.push({month:day/30,cash:ROUND(s.cash),served:s.served,sold:s.purchases,
    revenue:ROUND(s.revenue),expenses:ROUND(s.expenses),
    reputation:ROUND(s.reputation),licensed:s.pcWindowsLicenses?.filter(Boolean).length??0});
  }
  if(day===60)s=parseImportedSave(serializeSave(s));
 }
 licensed=s.pcWindowsLicenses?.filter(Boolean).length??0;
 return {seed,capital,days:120,net:ROUND(s.cash-capital),minCash:ROUND(minCash),
  licensedWindows:licensed,supplierBought,clients:s.served,purchases:s.purchases,
  revenue:ROUND(s.revenue),expenses:ROUND(s.expenses),months};
}
test("1998: sobrevivência real com R$ 850, licenças pagas e nenhum subsídio",
 {skip:!full},()=>{
 const rows=SEEDS.map(openingBusiness);
 assert.equal(rows.length,2);
 for(const row of rows){
  assert.equal(row.capital,850);
  assert.ok(row.clients>100);
  assert.ok(row.months.length===4);
  assert.ok(Math.abs(row.revenue-row.expenses-row.net)<.01);
  console.log("LHS_HISTORICAL_STARTUP "+JSON.stringify(row));
 }
});
