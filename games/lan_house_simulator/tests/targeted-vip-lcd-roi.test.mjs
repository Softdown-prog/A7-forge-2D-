import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear,licenseWindows} from "../dist/js/sim/era.js";
import {installedGpu,buyGpu} from "../dist/js/sim/gpu.js";
import {installedLcd,buyLcdKit,LCD_CATALOG} from "../dist/js/sim/computerModels.js";
import {
  contractSupplier,expandShop,licenseGames,upgradeInternet,setHourlyPrice,
  stockItem,wholesaleCost,upgradeComputer,energyCostPerMinute,
  hardwareSatisfactionBonus
} from "../dist/js/sim/economy.js";
import {computerOccupancyPercent} from "../dist/js/sim/financialReview.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {launchPromotion} from "../dist/js/sim/promotion.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const SEEDS=[23,137],SIZES=[5,7],DAYS=360,PRICE=22,INITIAL=65000;
const STRATEGIES=["base","oneRearGpu","twoRearGpu","twoFrontGpu","twoRearLcd",
  "allLcd","twoRearBoth"];
const GPU_COST=2250,LCD_COST=LCD_CATALOG.find(k=>k.id==="lcd12").cost;
const accept=result=>assert.equal(result.ok,true,result.message);

function baseShop(seed,size) {
 const s=createGame(seed);
 s.totalMinutes=(2013-1998)*360*DAY_MINUTES;
 s.cash=INITIAL;
 accept(setHourlyPrice(s,PRICE));
 accept(licenseGames(s));accept(hireContentProgrammer(s));accept(contractSupplier(s));
 accept(upgradeInternet(s));accept(upgradeInternet(s));
 accept(expandShop(s));
 if(size===7)accept(expandShop(s));
 while(pcCount(s)<size)accept(buyComputer(s));
 for(let i=0;i<size;i++){
  accept(licenseWindows(s,i,"win98"));
  accept(upgradeComputer(s,i));accept(upgradeComputer(s,i));
  accept(buyGpu(s,i,"gpu09"));
 }
 assert.equal(pcCount(s),size);
 assert.equal(gameYear(s),2013);
 assert.equal(s.cash,INITIAL-s.expenses);
 return s;
}
function targetedIndices(size,strategy){
 if(strategy==="base")return {gpu:[],lcd:[]};
 if(strategy==="oneRearGpu")return {gpu:[3],lcd:[]};
 if(strategy==="twoRearGpu")return {gpu:[3,4],lcd:[]};
 if(strategy==="twoFrontGpu")return {gpu:[0,1],lcd:[]};
 if(strategy==="twoRearLcd")return {gpu:[],lcd:[3,4]};
 if(strategy==="allLcd")return {gpu:[],lcd:Array.from({length:size},(_,i)=>i)};
 if(strategy==="twoRearBoth")return {gpu:[3,4],lcd:[3,4]};
 throw new Error("Unknown policy "+strategy);
}
function buyStrategy(s,size,strategy){
 const indices=targetedIndices(size,strategy);
 const before=s.expenses;
 for(const pc of indices.gpu)accept(buyGpu(s,pc,"gpu13"));
 for(const pc of indices.lcd)accept(buyLcdKit(s,pc,"lcd12"));
 const cost=indices.gpu.length*GPU_COST+indices.lcd.length*LCD_COST;
 assert.equal(s.expenses-before,cost);
 for(let i=0;i<size;i++){
  assert.equal(installedGpu(s,i),indices.gpu.includes(i)?"gpu13":"gpu09");
  assert.equal(installedLcd(s,i),indices.lcd.includes(i)?"lcd12":null);
  assert.equal(s.pcTiers[i],3);
 }
 return {cost,...indices};
}
function operate(s){
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))accept(stockItem(s,item));
 for(let i=0;i<pcCount(s);i++){
  if(pcWear(s,i)<75||s.repairJobs?.some(j=>j.pc===i))continue;
  if(s.customers.some(c=>c.pcIndex===i&&["to_pc","sitting","using","standing"].includes(c.stage)))continue;
  if(s.cash>=100)accept(startRepair(s,i));
 }
 if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=55)
  accept(requestCleaning(s));
}
function campaign(seed,size,strategy){
 let s=baseShop(seed,size);
 const baseExpenses=s.expenses;
 const {cost,gpu,lcd}=buyStrategy(s,size,strategy);
 const startBaselineEnergy=energyCostPerMinute(s,0);
 let previousRevenue=0,previousExpenses=0,promotions=0;
 const months=[],vipUsingByPc=Array.from({length:size},()=>0);
 let vipUsingSamples=0,totalUsingSamples=0,fullSamples=0;
 for(let day=1;day<=DAYS;day++){
  if((day-1)%15===0){accept(launchPromotion(s));promotions++;}
  operate(s);
  for(let slot=0;slot<6;slot++){
   stepGame(s,120);
   const using=s.customers.filter(c=>c.stage==="using");
   totalUsingSamples+=using.length;
   if(using.length===size)fullSamples++;
   for(const customer of using)if(customer.vip){
    vipUsingSamples++;
    if(customer.pcIndex!==null&&customer.pcIndex>=0&&customer.pcIndex<size)
     vipUsingByPc[customer.pcIndex]++;
   }
   if(slot===3)operate(s);
  }
  if(day%30===0){
   assert.equal(s.totalMinutes,((2013-1998)*360+day)*DAY_MINUTES);
   assert.equal(s.cash,INITIAL+s.revenue-s.expenses,
    "cash conservation: "+seed+"/"+size+"/"+strategy+"/"+day);
   assert.equal(s.lastMonthRevenue,s.revenue-previousRevenue);
   assert.equal(s.lastMonthExpenses,s.expenses-previousExpenses);
   assert.equal(s.lastMonthPcCapacityMinutes,30*DAY_MINUTES*size);
   assert.ok(s.energyAccrued>=0&&s.energyAccrued<.01);
   assert.ok(s.customers.length<=14);
   assert.ok(s.reputation>=10&&s.reputation<=100);
   months.push({month:day/30,year:gameYear(s),price:s.pricePerHour,
    occupied:computerOccupancyPercent(s.lastMonthPcUsedMinutes,s.lastMonthPcCapacityMinutes),
    revenue:s.lastMonthRevenue,expenses:s.lastMonthExpenses,
    net:s.lastMonthRevenue-s.lastMonthExpenses});
   previousRevenue=s.revenue;previousExpenses=s.expenses;
  }
  if(day===180){
   const restored=parseImportedSave(serializeSave(s));
   for(const key of ["cash","revenue","expenses","rng","totalMinutes","pricePerHour",
    "served","purchases","lastMonthRevenue","lastMonthExpenses"])
    assert.equal(restored[key],s[key],"save: "+key);
   assert.deepEqual(restored.pcLcdModels,s.pcLcdModels);
   assert.deepEqual(restored.pcGpus,s.pcGpus);
   assert.deepEqual(restored.pcTiers,s.pcTiers);
   assert.equal(restored.customers.length,s.customers.length);
   s=restored;
  }
 }
 assert.equal(promotions,24);
 assert.equal(months.length,12);
 assert.deepEqual(months.map(m=>m.year),[...Array(11).fill(2013),2014]);
 assert.equal(s.pricePerHour,PRICE);
 assert.equal(s.cash,INITIAL+s.revenue-s.expenses);
 assert.ok(s.served>20&&s.purchases>20);
 return {seed,size,strategy,cost,baseExpenses,
  gpuIndices:gpu,lcdIndices:lcd,
  energyIdleAtStart:+startBaselineEnergy.toFixed(7),
  net:s.cash-INITIAL,revenue:s.revenue,expenses:s.expenses,
  served:s.served,sold:s.purchases,lost:s.lostCustomers,
  reputation:+s.reputation.toFixed(2),
  occupancy:+(months.reduce((sum,m)=>sum+m.occupied,0)/12).toFixed(2),
  vipUsingSamples,vipOnTargetSamples:vipUsingByPc[3]+vipUsingByPc[4],
  totalUsingSamples,fullSamples,promotions,months};
}

test("compras direcionadas de LCD e GPU custam o valor integral e preservam saves",()=>{
 const s=baseShop(23,5);
 const baselineEnergy=energyCostPerMinute(s,0);
 const oldQuality=hardwareSatisfactionBonus(s,3),oldCash=s.cash,oldExpenses=s.expenses;
 const upgrade=buyStrategy(s,5,"twoRearBoth");
 assert.equal(upgrade.cost,2*(GPU_COST+LCD_COST));
 assert.equal(s.cash,oldCash-upgrade.cost);
 assert.equal(s.expenses,oldExpenses+upgrade.cost);
 assert.ok(hardwareSatisfactionBonus(s,3)>oldQuality);
 const upgradedEnergy=energyCostPerMinute(s,0);
 // This strategy combines GPU power and LCD efficiency: total effect
 // need not be lower than baseline (the GPU may consume more).
 assert.ok(Number.isFinite(baselineEnergy)&&Number.isFinite(upgradedEnergy));
 assert.equal(installedLcd(s,0),null);
 assert.equal(installedGpu(s,0),"gpu09");
 const restored=parseImportedSave(serializeSave(s));
 assert.deepEqual(restored.pcLcdModels,s.pcLcdModels);
 assert.deepEqual(restored.pcGpus,s.pcGpus);
 assert.equal(restored.cash,s.cash);
 assert.equal(restored.expenses,s.expenses);
 assert.equal(s.cash,INITIAL+s.revenue-s.expenses);
});

const full=process.env.npm_lifecycle_event==="audit:targeted"||
 process.env.LHS_TARGETED_AUDIT==="1";
test("2013-2014: 28 campanhas pagas de GPUs direcionadas e LCDs no salão",
 {skip:!full},()=>{
 const rows=[];
 for(const seed of SEEDS)for(const size of SIZES)for(const strategy of STRATEGIES)
  rows.push(campaign(seed,size,strategy));
 assert.equal(rows.length,SEEDS.length*SIZES.length*STRATEGIES.length);
 for(const seed of SEEDS)for(const size of SIZES){
  const cohort=rows.filter(r=>r.seed===seed&&r.size===size);
  const baseline=cohort.find(r=>r.strategy==="base");
  assert.equal(cohort.length,STRATEGIES.length);
  assert.equal(new Set(cohort.map(r=>r.baseExpenses)).size,1);
  // A modernização da traseira deve alterar a preferência VIP em uso real;
  // são amostras de ocupação, não contagem de visitantes individuais.
  for(const name of ["twoRearGpu","twoRearLcd","twoRearBoth"]){
   const targeted=cohort.find(r=>r.strategy===name);
   assert.ok(targeted.vipOnTargetSamples>baseline.vipOnTargetSamples*3,
    "VIP deve priorizar estações 4/5 modernizadas: "+name);
  }
  for(const r of cohort){
   const delta=r.net-baseline.net;
   assert.equal(r.net,r.revenue-r.expenses);
   console.log("TARGETED_HARDWARE_CAMPAIGN "+JSON.stringify({...r,netVsBase:delta}));
  }
 }
 for(const size of SIZES)for(const strategy of STRATEGIES){
  const matching=rows.filter(r=>r.size===size&&r.strategy===strategy);
  const base=rows.filter(r=>r.size===size&&r.strategy==="base");
  const avg=(r,key)=>+(r.reduce((sum,x)=>sum+x[key],0)/r.length).toFixed(2);
  console.log("TARGETED_HARDWARE_SUMMARY "+JSON.stringify({
   size,strategy,avgCost:avg(matching,"cost"),
   avgNet:avg(matching,"net"),avgNetVsBase:+(avg(matching,"net")-avg(base,"net")).toFixed(2),
   avgServed:avg(matching,"served"),avgSold:avg(matching,"sold"),
   avgOccupancy:avg(matching,"occupancy"),avgReputation:avg(matching,"reputation"),
   avgVipSamples:avg(matching,"vipUsingSamples"),
   avgVipRearSamples:avg(matching,"vipOnTargetSamples")
  }));
 }
});
