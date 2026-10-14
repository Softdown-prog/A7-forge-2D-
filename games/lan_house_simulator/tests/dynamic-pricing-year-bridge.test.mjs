import {withStationOff} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear,licenseWindows} from "../dist/js/sim/era.js";
import {
  contractSupplier,expandShop,licenseGames,upgradeInternet,setHourlyPrice,
  stockItem,wholesaleCost
} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const INITIAL=30000,SEEDS=[23,137],SIZES=[5,7],DAYS=120;
const POLICIES=["fixed18","fixed22","raise18to22","drop22to18"];
const accept=result=>assert.equal(result.ok,true,result.message);

/** Same real operations in all campaigns. No fabricated visitors, sales or subsidies.
 * A 120-day uninterrupted campaign begins on 2011 day 301 and crosses 2012. */
function setup(seed,pcs,policy){
 const s=createGame(seed);
 s.totalMinutes=((2011-1998)*360+300)*DAY_MINUTES;
 s.cash=INITIAL;
 accept(setHourlyPrice(s,policy==="fixed22"||policy==="drop22to18"?22:18));
 accept(licenseGames(s));
 accept(hireContentProgrammer(s));
 accept(contractSupplier(s));
 accept(upgradeInternet(s));accept(upgradeInternet(s));
 accept(expandShop(s));
 if(pcs===7)accept(expandShop(s));
 while(pcCount(s)<pcs)accept(buyComputer(s));
 for(let i=0;i<pcs;i++)accept(withStationOff(s,i,()=>licenseWindows(s,i,"win98")));
 assert.equal(pcCount(s),pcs);
 assert.equal(gameYear(s),2011);
 assert.equal(s.cash,INITIAL-s.expenses);
 return s;
}
function upkeep(s){
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))accept(stockItem(s,item));
 for(let i=0;i<pcCount(s);i++){
  if(pcWear(s,i)<75||s.repairJobs?.some(j=>j.pc===i))continue;
  if(s.customers.some(c=>c.pcIndex===i&&["to_pc","sitting","using","standing"].includes(c.stage)))continue;
  if(s.cash>=100)startRepair(s,i);
 }
 if((s.binFill??[]).some(value=>value>=75)&&!s.cleaningJob&&s.cash>=55)
  requestCleaning(s);
}
function run(seed,pcs,policy){
 const s=setup(seed,pcs,policy);
 const installationExpense=s.expenses,checkpoints=[];
 let busySamples=0,pcSamples=0,stockSales=0,preYearRevenue=0;
 for(let day=1;day<=DAYS;day++){
  // Switch only after the calendar reaches 2012; the same player API is used.
  if(day===61){
   assert.equal(gameYear(s),2012);
   if(policy==="raise18to22")accept(setHourlyPrice(s,22));
   if(policy==="drop22to18")accept(setHourlyPrice(s,18));
  }
  upkeep(s);
  for(let period=0;period<6;period++){
   stepGame(s,120);
   if(period===3){
    busySamples+=s.customers.filter(c=>c.stage==="using").length;
    pcSamples+=pcCount(s);
   }
  }
  if(day===60)preYearRevenue=s.revenue;
  if(day%30===0){
   assert.equal(s.cash,INITIAL+s.revenue-s.expenses,
     "conservação de caixa: "+policy+" "+pcs+"PC dia "+day);
   assert.ok(s.customers.length<=14);
   assert.ok(s.reputation>=10&&s.reputation<=100);
   assert.ok(Number.isFinite(s.energyAccrued)&&s.energyAccrued>=0);
   checkpoints.push({day,year:gameYear(s),price:s.pricePerHour,
    served:s.served,net:s.cash-INITIAL,spending:s.purchases});
  }
 }
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(restored.cash,s.cash);
 assert.equal(restored.pricePerHour,s.pricePerHour);
 assert.equal(restored.purchases,s.purchases);
 assert.equal(restored.totalMinutes,s.totalMinutes);
 assert.equal(restored.rng,s.rng);
 assert.equal(checkpoints.length,4);
 assert.deepEqual(checkpoints.map(c=>c.year),[2011,2012,2012,2012]);
 assert.equal(checkpoints[0].price,policy==="fixed22"||policy==="drop22to18"?22:18);
 assert.equal(checkpoints[2].price,policy==="fixed22"||policy==="raise18to22"?22:18);
 assert.ok(s.served>10,"o cenário deve usar o motor real de atendimento");
 return {seed,pcs,policy,installationExpense,net:s.cash-INITIAL,
  revenue:s.revenue,expenses:s.expenses,served:s.served,
  productsSold:s.purchases,lost:s.lostCustomers,
  reputation:Number(s.reputation.toFixed(2)),
  occupationPercent:Number((100*busySamples/Math.max(1,pcSamples)).toFixed(1)),
  revenueBefore2012:preYearRevenue,
  revenueAfter2012:s.revenue-preYearRevenue,
  checkpoints};
}

test("reajustes manuais na virada 2011-2012: comparação pareada com 5 e 7 PCs",()=>{
 const rows=[];
 for(const seed of SEEDS)for(const pcs of SIZES)for(const policy of POLICIES)
  rows.push(run(seed,pcs,policy));
 assert.equal(rows.length,16);
 for(const seed of SEEDS)for(const pcs of SIZES){
  const group=rows.filter(r=>r.seed===seed&&r.pcs===pcs);
  assert.equal(group.length,4);
  assert.equal(new Set(group.map(r=>r.installationExpense)).size,1);
  assert.ok(group.every(r=>r.revenue>0&&r.productsSold>0));
  assert.ok(group.every(r=>r.revenue-r.expenses===r.net));
 }
 for(const row of rows)
  console.log("DYNAMIC_YEAR_BRIDGE "+JSON.stringify(row));
 for(const pcs of SIZES)for(const policy of POLICIES){
  const matched=rows.filter(r=>r.pcs===pcs&&r.policy===policy);
  const mean=k=>Number((matched.reduce((sum,r)=>sum+r[k],0)/matched.length).toFixed(2));
  console.log("DYNAMIC_YEAR_SUMMARY "+JSON.stringify({pcs,policy,
    avgNet:mean("net"),avgServed:mean("served"),
    avgProductsSold:mean("productsSold"),avgReputation:mean("reputation"),
    avgOccupancy:mean("occupationPercent"),avgRevenueBefore2012:mean("revenueBefore2012"),
    avgRevenueAfter2012:mean("revenueAfter2012")}));
 }
});
