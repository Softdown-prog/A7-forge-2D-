import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {buyGpu,installedGpu} from "../dist/js/sim/gpu.js";
import {gameYear,licenseWindows} from "../dist/js/sim/era.js";
import {expandShop,licenseGames,upgradeInternet,upgradeComputer,setHourlyPrice,contractSupplier,stockItem,wholesaleCost} from "../dist/js/sim/economy.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const INITIAL=50000,SEEDS=[23,137],PRICES=[22,24],TOTAL_DAYS=900;
const act=(r)=>assert.equal(r.ok,true,r.message);
function setup(seed,price){
 const s=createGame(seed);s.totalMinutes=(2011-1998)*360*DAY_MINUTES;s.cash=INITIAL;
 act(setHourlyPrice(s,price));act(licenseGames(s));act(hireContentProgrammer(s));act(contractSupplier(s));
 act(expandShop(s));act(buyComputer(s));act(buyComputer(s));
 act(upgradeInternet(s));act(upgradeInternet(s));
 for(let i=0;i<pcCount(s);i++)act(licenseWindows(s,i,"win98"));
 for(const i of [3,4]){
  act(upgradeComputer(s,i));act(upgradeComputer(s,i));act(buyGpu(s,i,"gpu09"));
 }
 assert.equal(gameYear(s),2011);
 assert.equal(s.cash,INITIAL-s.expenses);
 return s;
}
function upkeep(s){
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))stockItem(s,item);
 for(let i=0;i<pcCount(s);i++)
  if(pcWear(s,i)>=75&&!s.repairJobs?.some(j=>j.pc===i)&&
    !s.customers.some(c=>c.pcIndex===i&&["to_pc","using","sitting","standing"].includes(c.stage)))
    startRepair(s,i);
 if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=55)requestCleaning(s);
}
function campaign(seed,price,plan){
 const s=setup(seed,price);
 const initialExpense=s.expenses;
 let upgradeCost=0,used=0,capacity=0,vipUsingModern=0,vipUsing=0;
 const checkpoints=[];
 // From 2011 through mid-2013 continuously, including month/year rollovers.
 for(let day=0;day<TOTAL_DAYS;day++){
  if(day===0&&plan==="staged"){
   const before=s.expenses;for(const i of [3,4])act(buyGpu(s,i,"gpu11"));
   upgradeCost+=s.expenses-before;
  }
  if(day===720&&plan!=="hold"){
   assert.equal(gameYear(s),2013);
   const before=s.expenses;for(const i of [3,4])act(buyGpu(s,i,"gpu13"));
   upgradeCost+=s.expenses-before;
  }
  upkeep(s);
  for(let portion=0;portion<6;portion++){
   stepGame(s,120);
   if(portion===3){
    const users=s.customers.filter(c=>c.stage==="using");
    used+=users.length;capacity+=pcCount(s);
    const vip=users.filter(c=>c.vip);
    vipUsing+=vip.length;
    vipUsingModern+=vip.filter(c=>c.pcIndex===3||c.pcIndex===4).length;
   }
  }
  if((day+1)%180===0){
   assert.equal(s.cash,INITIAL+s.revenue-s.expenses,"conservação: "+plan+" dia "+(day+1));
   assert.ok(s.reputation>=10&&s.reputation<=100);
   assert.ok(s.customers.length<=14);
   assert.ok(Number.isFinite(s.energyAccrued));
   checkpoints.push({day:day+1,year:gameYear(s),served:s.served,net:s.cash-INITIAL,
    rep:+s.reputation.toFixed(2),gpu:installedGpu(s,3)});
  }
 }
 const restored=parseImportedSave(serializeSave(s));
 assert.equal(installedGpu(restored,3),installedGpu(s,3));
 assert.equal(restored.cash,s.cash);
 return {seed,price,plan,initialExpense,upgradeCost,
  served:s.served,lost:s.lostCustomers,reputation:+s.reputation.toFixed(2),
  revenue:s.revenue,expenses:s.expenses,net:s.cash-INITIAL,
  occupancy:+(100*used/Math.max(1,capacity)).toFixed(1),
  vipRearPercent:+(100*vipUsingModern/Math.max(1,vipUsing)).toFixed(1),
  finalGpu:installedGpu(s,3),checkpoints};
}
test("substituição 2009 → 2011 → 2013 contabiliza o valor integral das duas gerações",()=>{
 const s=setup(23,22),before=s.cash,expense=s.expenses;
 assert.equal(installedGpu(s,3),"gpu09");
 act(buyGpu(s,3,"gpu11"));
 assert.equal(s.cash,before-1590);
 assert.equal(s.expenses,expense+1590);
 assert.equal(buyGpu(s,3,"gpu09").ok,false);
 assert.equal(buyGpu(s,3,"gpu13").ok,false,"a GPU 2013 ainda não foi lançada");
 s.totalMinutes+=720*DAY_MINUTES;
 assert.equal(gameYear(s),2013);
 act(buyGpu(s,3,"gpu13"));
 assert.equal(s.cash,before-1590-2250);
 assert.equal(s.expenses,expense+1590+2250);
 assert.equal(installedGpu(s,3),"gpu13");
 assert.equal(buyGpu(s,3,"gpu13").ok,false);
 const saved=parseImportedSave(serializeSave(s));
 assert.equal(installedGpu(saved,3),"gpu13");
});
test("comparação em partidas contínuas: manter GPU09, saltar direto à GPU13 ou atualizar em etapas",()=>{
 const rows=[];
 for(const seed of SEEDS)for(const price of PRICES)for(const plan of ["hold","direct","staged"])
  rows.push(campaign(seed,price,plan));
 assert.equal(rows.length,12);
 for(const seed of SEEDS)for(const price of PRICES){
  const three=rows.filter(r=>r.seed===seed&&r.price===price);
  const [hold,direct,staged]=["hold","direct","staged"].map(k=>three.find(x=>x.plan===k));
  assert.equal(hold.upgradeCost,0);
  assert.equal(direct.upgradeCost,4500);
  assert.equal(staged.upgradeCost,7680);
  assert.equal(hold.finalGpu,"gpu09");
  assert.equal(direct.finalGpu,"gpu13");
  assert.equal(staged.finalGpu,"gpu13");
  assert.equal(staged.checkpoints.length,5);
  assert.deepEqual(hold.checkpoints.map(x=>x.year),[2011,2012,2012,2013,2013]);
  for(const row of three){
   assert.equal(row.initialExpense,hold.initialExpense);
   assert.equal(row.revenue-row.expenses,row.net);
  }
 }
 for(const r of rows)console.log("GPU_GENERATION_PATH "+JSON.stringify(r));
 for(const price of PRICES)for(const plan of ["hold","direct","staged"]){
  const sample=rows.filter(r=>r.price===price&&r.plan===plan);
  const avg=k=>+(sample.reduce((sum,r)=>sum+r[k],0)/sample.length).toFixed(2);
  console.log("GPU_GENERATION_SUMMARY "+JSON.stringify({price,plan,meanNet:avg("net"),
   meanServed:avg("served"),meanRep:avg("reputation"),upgradeCost:avg("upgradeCost"),
   meanVipRear:avg("vipRearPercent")}));
 }
});
