import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear,licenseWindows} from "../dist/js/sim/era.js";
import {installedGpu,buyGpu,GPU_CATALOG} from "../dist/js/sim/gpu.js";
import {
 contractSupplier,expandShop,licenseGames,upgradeInternet,setHourlyPrice,
 stockItem,wholesaleCost,upgradeComputer
} from "../dist/js/sim/economy.js";
import {computerOccupancyPercent} from "../dist/js/sim/financialReview.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {launchPromotion} from "../dist/js/sim/promotion.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const INITIAL=65000,DAYS=360,SEEDS=[23,137],SIZES=[5,7];
const STRATEGIES=["legacy09","cpuTier3","gpu13","cpuAndGpu13"];
const MONTH=30,SALE_EVERY=15,PRICE=18;
const GPU09_COST=GPU_CATALOG.find(g=>g.id==="gpu09").cost;
const GPU13_COST=GPU_CATALOG.find(g=>g.id==="gpu13").cost;
const CPU_UPGRADE_COST=240+480;
const accept=result=>assert.equal(result.ok,true,result.message);

/** Fully paid base: 2013 shop fitted with 2009-generation GPUs. */
function setup(seed,size,strategy){
 const s=createGame(seed);
 s.totalMinutes=(2013-1998)*360*DAY_MINUTES;
 s.cash=INITIAL;
 accept(setHourlyPrice(s,PRICE));
 accept(licenseGames(s));
 accept(hireContentProgrammer(s));
 accept(contractSupplier(s));
 accept(upgradeInternet(s));
 accept(upgradeInternet(s));
 accept(expandShop(s));
 if(size===7)accept(expandShop(s));
 while(pcCount(s)<size)accept(buyComputer(s));
 for(let i=0;i<size;i++){
  accept(licenseWindows(s,i,"win98"));
  accept(buyGpu(s,i,"gpu09"));
 }
 const baseExpenses=s.expenses;
 if(strategy==="cpuTier3"||strategy==="cpuAndGpu13"){
  for(let i=0;i<size;i++){
   accept(upgradeComputer(s,i));
   accept(upgradeComputer(s,i));
  }
 }
 if(strategy==="gpu13"||strategy==="cpuAndGpu13")
  for(let i=0;i<size;i++)accept(buyGpu(s,i,"gpu13"));
 const incrementalExpenses=s.expenses-baseExpenses;
 assert.equal(incrementalExpenses,
  size*((strategy==="cpuTier3"||strategy==="cpuAndGpu13"?CPU_UPGRADE_COST:0)+
        (strategy==="gpu13"||strategy==="cpuAndGpu13"?GPU13_COST:0)));
 assert.equal(pcCount(s),size);
 assert.equal(gameYear(s),2013);
 assert.equal(s.cash,INITIAL-s.expenses);
 for(let i=0;i<size;i++){
  assert.equal(installedGpu(s,i),strategy==="gpu13"||strategy==="cpuAndGpu13"?"gpu13":"gpu09");
  assert.equal(s.pcTiers[i],strategy==="cpuTier3"||strategy==="cpuAndGpu13"?3:1);
 }
 return {s,baseExpenses,incrementalExpenses};
}
function operate(s){
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))accept(stockItem(s,item));
 for(let i=0;i<pcCount(s);i++){
  if(pcWear(s,i)<75||s.repairJobs?.some(j=>j.pc===i))continue;
  if(s.customers.some(c=>c.pcIndex===i&&["to_pc","sitting","using","standing"].includes(c.stage)))continue;
  if(s.cash>=100)accept(startRepair(s,i));
 }
 if((s.binFill??[]).some(v=>v>=75)&&!s.cleaningJob&&s.cash>=55)
  accept(requestCleaning(s));
}
function run(seed,size,strategy){
 const setupResult=setup(seed,size,strategy);
 let s=setupResult.s;
 let previousRevenue=0,previousExpenses=0;
 let full=0,peak=0,promotions=0;
 const months=[];
 for(let day=1;day<=DAYS;day++){
  if((day-1)%SALE_EVERY===0){accept(launchPromotion(s));promotions++;}
  operate(s);
  for(let part=0;part<6;part++){
   stepGame(s,120);
   const busy=s.customers.filter(c=>c.stage==="using").length;
   peak=Math.max(peak,busy);
   if(busy===pcCount(s))full++;
   if(part===3)operate(s);
  }
  if(day%MONTH===0){
   assert.equal(s.totalMinutes,((2013-1998)*360+day)*DAY_MINUTES);
   assert.equal(s.cash,INITIAL+s.revenue-s.expenses,"conservation "+seed+"/"+size+"/"+strategy+"/"+day);
   assert.equal(s.lastMonthRevenue,s.revenue-previousRevenue);
   assert.equal(s.lastMonthExpenses,s.expenses-previousExpenses);
   assert.equal(s.lastMonthPcCapacityMinutes,MONTH*DAY_MINUTES*size);
   assert.ok(s.energyAccrued>=0&&s.energyAccrued<.01);
   const occupancy=computerOccupancyPercent(s.lastMonthPcUsedMinutes,s.lastMonthPcCapacityMinutes);
   assert.ok(occupancy>=0&&occupancy<=100);
   assert.ok(s.reputation>=10&&s.reputation<=100);
   months.push({month:day/MONTH,year:gameYear(s),
    price:s.pricePerHour,occupancy,
    net:s.lastMonthRevenue-s.lastMonthExpenses});
   previousRevenue=s.revenue;
   previousExpenses=s.expenses;
  }
  if(day===180){
   // A campaign resumes using the actual save schema, not an idealized clone.
   const restored=parseImportedSave(serializeSave(s));
   for(const key of ["totalMinutes","cash","expenses","revenue","served","purchases",
     "rng","pricePerHour","lastMonthPcUsedMinutes","lastMonthPcCapacityMinutes"])
    assert.equal(restored[key],s[key],"save round trip: "+key);
   assert.deepEqual(restored.pcGpus,s.pcGpus);
   assert.deepEqual(restored.pcTiers,s.pcTiers);
   assert.equal(restored.customers.length,s.customers.length);
   s=restored;
  }
 }
 assert.equal(months.length,12);
 assert.deepEqual(months.map(m=>m.year),[...Array(11).fill(2013),2014]);
 assert.equal(promotions,24);
 assert.ok(s.served>20&&s.purchases>20);
 assert.equal(s.cash,INITIAL+s.revenue-s.expenses);
 assert.equal(GPU09_COST,1150);
 assert.equal(GPU13_COST,2250);
 return {seed,size,strategy,price:PRICE,days:DAYS,
  baseExpenses:setupResult.baseExpenses,
  incrementalExpenses:setupResult.incrementalExpenses,
  net:s.cash-INITIAL,revenue:s.revenue,expenses:s.expenses,
  served:s.served,sold:s.purchases,lost:s.lostCustomers,
  reputation:Number(s.reputation.toFixed(2)),
  averageOccupancy:Number((months.reduce((a,m)=>a+m.occupancy,0)/12).toFixed(2)),
  peakBusy:peak,fullOccupancySamples:full,promotions,
  months};
}

test("2013-2014: retorno anual de CPU Tier 3 e GPUs de 2013 com 5/7 PCs",()=>{
 const rows=[];
 for(const seed of SEEDS)for(const size of SIZES)for(const strategy of STRATEGIES)
  rows.push(run(seed,size,strategy));
 assert.equal(rows.length,16);
 for(const seed of SEEDS)for(const size of SIZES){
  const group=rows.filter(r=>r.seed===seed&&r.size===size);
  assert.equal(group.length,4);
  assert.equal(new Set(group.map(r=>r.baseExpenses)).size,1);
  assert.equal(new Set(group.map(r=>r.promotions)).size,1);
  const legacy=group.find(r=>r.strategy==="legacy09");
  for(const scenario of group){
   assert.equal(scenario.incrementalExpenses,
    size*((scenario.strategy==="cpuTier3"||scenario.strategy==="cpuAndGpu13"?CPU_UPGRADE_COST:0)+
          (scenario.strategy==="gpu13"||scenario.strategy==="cpuAndGpu13"?GPU13_COST:0)));
   assert.equal(scenario.net,scenario.revenue-scenario.expenses);
   console.log("HARDWARE_ANNUAL_CAMPAIGN "+JSON.stringify({
    ...scenario,incrementalNet:scenario.net-legacy.net}));
  }
 }
 for(const size of SIZES)for(const strategy of STRATEGIES){
  const group=rows.filter(r=>r.size===size&&r.strategy===strategy);
  const baseline=rows.filter(r=>r.size===size&&r.strategy==="legacy09");
  const mean=(items,key)=>Number((items.reduce((sum,item)=>sum+item[key],0)/items.length).toFixed(2));
  console.log("HARDWARE_ANNUAL_SUMMARY "+JSON.stringify({
   size,strategy,avgIncrementalUpgradeCost:mean(group,"incrementalExpenses"),
   avgNet:mean(group,"net"),avgNetVsLegacy:Number((mean(group,"net")-mean(baseline,"net")).toFixed(2)),
   avgServed:mean(group,"served"),avgProductsSold:mean(group,"sold"),
   avgOccupancy:mean(group,"averageOccupancy"),avgReputation:mean(group,"reputation"),
   avgFullSamples:mean(group,"fullOccupancySamples")
  }));
 }
});
