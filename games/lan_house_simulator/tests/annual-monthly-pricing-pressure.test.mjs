import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear,licenseWindows} from "../dist/js/sim/era.js";
import {
 contractSupplier,expandShop,licenseGames,upgradeInternet,setHourlyPrice,
 stockItem,wholesaleCost,energyCostPerMinute
} from "../dist/js/sim/economy.js";
import {computerOccupancyPercent} from "../dist/js/sim/financialReview.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {launchPromotion} from "../dist/js/sim/promotion.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const SEEDS=[23,137],SIZES=[5,7],POLICIES=["fixed8","fixed12","fixed18","monthly"],DAYS=360;
const START=40000,MONTH_DAYS=30,PROMOTION_INTERVAL=15,PAID_PROMOS=DAYS/PROMOTION_INTERVAL;
const accept=result=>assert.equal(result.ok,true,result.message);

/** All 16 campaigns receive the same budget, contracts, equipment and real,
 * paid promotion schedule; only capacity and the price policy vary. */
function setup(seed,size,policy){
 const s=createGame(seed);
 // Begin on Jan 1, 2011. Twelve complete, 30-day billing months.
 s.totalMinutes=(2011-1998)*360*DAY_MINUTES;
 s.cash=START;
 accept(setHourlyPrice(s,policy==="fixed8"?8:policy==="fixed18"?18:12));
 accept(licenseGames(s));
 accept(hireContentProgrammer(s));
 accept(contractSupplier(s));
 accept(upgradeInternet(s));
 accept(upgradeInternet(s));
 accept(expandShop(s));
 if(size===7)accept(expandShop(s));
 while(pcCount(s)<size)accept(buyComputer(s));
 for(let i=0;i<size;i++)accept(licenseWindows(s,i,"win98"));
 assert.equal(pcCount(s),size);
 assert.equal(gameYear(s),2011);
 assert.equal(s.cash,START-s.expenses);
 return s;
}
function operate(s){
 // Restocking and maintenance use only normal player operations.
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))accept(stockItem(s,item));
 for(let i=0;i<pcCount(s);i++){
  if(pcWear(s,i)<75||s.repairJobs?.some(j=>j.pc===i))continue;
  if(s.customers.some(c=>c.pcIndex===i&&["to_pc","sitting","using","standing"].includes(c.stage)))continue;
  if(s.cash>=100)startRepair(s,i);
 }
 if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=55)
  requestCleaning(s);
}
/** Intentionally simple manager: month N+1 uses only month N's measured
 * occupancy, never RNG, next month's weather or simulated counterfactuals. */
function nextMonthPrice(oldPrice,occupancy){
 if(occupancy>=55)return Math.min(18,oldPrice+2);
 if(occupancy<38)return Math.max(8,oldPrice-2);
 return oldPrice;
}
function simulate(seed,size,policy){
 let s=setup(seed,size,policy);
 const setupExpenses=s.expenses;
 let priorRevenue=0,priorExpenses=0,priorPurchases=0,priorServed=0;
 let totalPromos=0,maxBusy=0,fullyOccupiedSamples=0,samples=0;
 const months=[];
 for(let day=1;day<=DAYS;day++){
  if(day>1&&(day-1)%MONTH_DAYS===0&&policy==="monthly"){
   const occupancy=computerOccupancyPercent(s.lastMonthPcUsedMinutes,s.lastMonthPcCapacityMinutes);
   assert.ok(s.lastMonthPcCapacityMinutes>0,"real monthly capacity must be recorded");
   accept(setHourlyPrice(s,nextMonthPrice(s.pricePerHour,occupancy)));
  }
  if((day-1)%PROMOTION_INTERVAL===0){
   accept(launchPromotion(s));
   totalPromos++;
  }
  operate(s);
  for(let part=0;part<6;part++){
   // The engine hard-caps each call at 120 min; this advances all 720
   // real simulation minutes in the business day, with all customer routes.
   stepGame(s,120);
   const busy=s.customers.filter(c=>c.stage==="using").length;
   maxBusy=Math.max(maxBusy,busy);
   if(busy===pcCount(s))fullyOccupiedSamples++;
   samples++;
   if(part===3)operate(s);
  }
  if(day%MONTH_DAYS===0){
   assert.equal(s.cash,START+s.revenue-s.expenses,"cash conservation "+seed+"/"+size+"/"+policy+"/"+day);
   assert.equal(s.totalMinutes,((2011-1998)*360+day)*DAY_MINUTES);
   assert.equal(s.lastMonthPcCapacityMinutes,MONTH_DAYS*DAY_MINUTES*size);
   const occupancy=computerOccupancyPercent(s.lastMonthPcUsedMinutes,s.lastMonthPcCapacityMinutes);
   assert.ok(occupancy>=0&&occupancy<=100);
   assert.equal(s.lastMonthRevenue,s.revenue-priorRevenue);
   assert.equal(s.lastMonthExpenses,s.expenses-priorExpenses);
   assert.ok(s.energyAccrued>=0&&s.energyAccrued<.01);
   assert.ok(s.reputation>=10&&s.reputation<=100);
   assert.ok(s.customers.length<=14);
   months.push({month:day/MONTH_DAYS,year:gameYear(s),price:s.pricePerHour,
    occupancy,revenue:s.lastMonthRevenue,expenses:s.lastMonthExpenses,
    net:s.lastMonthRevenue-s.lastMonthExpenses,
    served:s.served-priorServed,sold:s.purchases-priorPurchases,
    lost:s.lostCustomers});
   priorRevenue=s.revenue;
   priorExpenses=s.expenses;
   priorPurchases=s.purchases;
   priorServed=s.served;
  }
  if(day===180){
   // Resume a long-running campaign in place: the remaining 180 days must
   // continue from a real exported save rather than reconstructed customers.
   const before=s,restored=parseImportedSave(serializeSave(before));
   for(const key of ["cash","revenue","expenses","pricePerHour","totalMinutes",
     "rng","purchases","served","lastMonthRevenue","lastMonthExpenses",
     "lastMonthPcUsedMinutes","lastMonthPcCapacityMinutes"])
    assert.equal(restored[key],before[key],"save preserves "+key);
   assert.equal(restored.customers.length,before.customers.length);
   s=restored;
  }
 }
 assert.equal(totalPromos,PAID_PROMOS);
 assert.equal(months.length,12);
 assert.deepEqual(months.map(m=>m.year),[...Array(11).fill(2011),2012]);
 assert.equal(gameYear(s),2012);
 assert.equal(s.cash,START+s.revenue-s.expenses);
 assert.equal(s.revenue-s.expenses,s.cash-START);
 assert.ok(s.served>20&&s.purchases>20);
 if(policy==="monthly"){
  assert.ok(months.every(m=>m.price>=8&&m.price<=18&&(m.price-8)%2===0));
  assert.equal(months[0].price,12);
  for(let i=1;i<months.length;i++)
   assert.equal(months[i].price,nextMonthPrice(months[i-1].price,months[i-1].occupancy),
    "monthly policy can use only last month's measured occupancy");
 }else assert.ok(months.every(m=>m.price===Number(policy.slice(5))));
 const tariff2011=energyCostPerMinute({...s,totalMinutes:(2011-1998)*360*DAY_MINUTES},0);
 const tariff2012=energyCostPerMinute({...s,totalMinutes:(2012-1998)*360*DAY_MINUTES},0);
 assert.ok(Math.abs(tariff2012/tariff2011-1.03)<1e-9,"energy tariff increases by 3% at year change");
 return {seed,size,policy,net:s.cash-START,setupExpenses,
  served:s.served,sold:s.purchases,lost:s.lostCustomers,
  revenue:s.revenue,expenses:s.expenses,
  reputation:Number(s.reputation.toFixed(2)),
  meanOccupancy:Number((months.reduce((a,m)=>a+m.occupancy,0)/12).toFixed(1)),
  peakBusy:maxBusy,fullyOccupiedSamples,occupancySamples:samples,
  promotions:totalPromos,months};
}
// Tests that simulate >4 million minutes run on demand, not on every PR.
const fullAnnualAudit=process.env.npm_lifecycle_event==="audit:annual" ||
  process.env.LHS_ANNUAL_AUDIT==="1";
test("360 dias: tarifa fixa ou mensal, 5/7 PCs, demanda promocional e save aos 180 dias",
 {skip:!fullAnnualAudit},()=>{
 const rows=[];
 for(const seed of SEEDS)for(const size of SIZES)for(const policy of POLICIES)
  rows.push(simulate(seed,size,policy));
 assert.equal(rows.length,16);
 for(const seed of SEEDS)for(const size of SIZES){
  const group=rows.filter(r=>r.seed===seed&&r.size===size);
  assert.equal(group.length,4);
  assert.equal(new Set(group.map(r=>r.setupExpenses)).size,1);
  assert.equal(new Set(group.map(r=>r.promotions)).size,1);
 }
 for(const row of rows)console.log("ANNUAL_PRICE_CAMPAIGN "+JSON.stringify(row));
 for(const size of SIZES)for(const policy of POLICIES){
  const group=rows.filter(r=>r.size===size&&r.policy===policy);
  const mean=key=>Number((group.reduce((a,r)=>a+r[key],0)/group.length).toFixed(2));
  console.log("ANNUAL_PRICE_SUMMARY "+JSON.stringify({
   size,policy,avgNet:mean("net"),avgServed:mean("served"),
   avgProductSales:mean("sold"),avgLost:mean("lost"),
   avgOccupancy:mean("meanOccupancy"),avgPeakBusy:mean("peakBusy"),
   avgFullSamples:mean("fullyOccupiedSamples"),avgReputation:mean("reputation")
  }));
 }
});
