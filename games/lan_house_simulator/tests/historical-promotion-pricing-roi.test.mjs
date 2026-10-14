import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseGames,contractSupplier,stockItem,wholesaleCost,expandShop,setHourlyPrice} from "../dist/js/sim/economy.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {buyComputer,shopPrice} from "../dist/js/sim/shop.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {promotionCost,launchPromotion,isPromotionActive,PROMOTION_COST,HISTORICAL_PROMOTION_COST_1998} from "../dist/js/sim/promotion.js";
import {priceIndex,allowableHourlyPrice} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const DAYS=180,SEEDS=[23,137],INITIAL=850,RESERVE=550;
const round=n=>Math.round(n*100)/100;
const ok=(result,label)=>assert.equal(result.ok,true,label+": "+result.message);

function upkeep(s){
 for(let i=0;i<pcCount(s);i++)
  if(s.pcWindowsLicenses?.[i]!==true&&s.cash>=250+RESERVE)
   ok(licenseWindows(s,i,"win98"),"Windows PC "+i);
 if((s.pcWindowsLicenses??[]).slice(0,pcCount(s)).every(Boolean)&&
    s.supplierTier!==2&&s.cash>=180+RESERVE)
  ok(contractSupplier(s),"supplier");
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))
   ok(stockItem(s,item),"stock "+item);
 for(let i=0;i<pcCount(s);i++){
  const occupied=s.customers.some(c=>c.pcIndex===i&&
   ["to_pc","sitting","using","standing"].includes(c.stage));
  if(pcWear(s,i)>=75&&!occupied&&!s.repairJobs?.some(j=>j.pc===i)&&s.cash>=110)
   ok(startRepair(s,i),"repair "+i);
 }
 if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=70)
  ok(requestCleaning(s),"clean");
}
function expandIfAffordable(s,day){
 if(day<=75||pcCount(s)>=5)return 0;
 let cost=0;
 if(s.expansionLevel<1&&s.cash>=650+RESERVE){
  const old=s.expenses;
  ok(expandShop(s),"add room");
  cost+=s.expenses-old;
 }
 if(s.expansionLevel>=1&&pcCount(s)<5&&s.cash>=shopPrice(s,"computer")+RESERVE){
  const old=s.expenses;
  ok(buyComputer(s),"add PC");
  cost+=s.expenses-old;
 }
 return cost;
}
/** Only LAST MONTH observed KPIs may guide this non-oracular manager.
 * No new gameplay AI or pricing rule is installed by this audit. */
function priceNextMonth(s){
 const capacity=s.lastMonthPcCapacityMinutes??0;
 if(capacity<=0)return s.pricePerHour;
 const use=(s.lastMonthPcUsedMinutes??0)/capacity;
 const profit=(s.lastMonthRevenue??0)-(s.lastMonthExpenses??0);
 const cap=allowableHourlyPrice(s);
 if(use>=.25||profit<0)return Math.min(cap,round(s.pricePerHour+.25));
 if(use<.10&&profit>0)return Math.max(2,round(s.pricePerHour-.25));
 return s.pricePerHour;
}
function simulate(seed,size,policy){
 let s=createGame(seed,"historical");
 assert.equal(s.cash,INITIAL);
 ok(licenseGames(s),"game licenses");
 ok(hireContentProgrammer(s),"filter");
 const monthly=policy.includes("monthly"),promo=policy.includes("promo");
 ok(setHourlyPrice(s,policy.includes("300")?3:2.5),"starting rate");
 let promoCount=0,promoSpend=0,extraPcsSpend=0,lowest=s.cash;
 const months=[];let previousServed=0,previousSales=0;
 for(let day=1;day<=DAYS;day++){
  // At the first minute of day 31, previous-month data are available.
  if(monthly&&day>1&&(day-1)%30===0){
   const next=priceNextMonth(s);
   if(next!==s.pricePerHour)ok(setHourlyPrice(s,next),"monthly decision");
  }
  extraPcsSpend+=size===5?expandIfAffordable(s,day):0;
  upkeep(s);
  if(promo&&(day-1)%30===0&&s.cash>=promotionCost(s)+RESERVE){
   const before=s.expenses;
   ok(launchPromotion(s),"paid promotion");
   promoSpend+=s.expenses-before;
   promoCount++;
  }
  for(let part=0;part<6;part++)stepGame(s,120);
  lowest=Math.min(lowest,s.cash);
  if(day%30===0){
   assert.ok(Math.abs(s.cash-(INITIAL+s.revenue-s.expenses))<.001,"cash balance");
   assert.ok(isValidSave(s));
   assert.ok(s.pricePerHour<=allowableHourlyPrice(s));
   assert.ok(s.reputation>=10&&s.reputation<=100);
   const used=s.lastMonthPcUsedMinutes??0,cap=s.lastMonthPcCapacityMinutes??0;
   assert.ok(cap>0&&used>=0&&used<=cap);
   months.push({month:day/30,pcs:pcCount(s),price:s.pricePerHour,
    occupancy:round(100*used/cap),net:round(s.lastMonthRevenue-s.lastMonthExpenses),
    revenue:round(s.lastMonthRevenue),expenses:round(s.lastMonthExpenses),
    clients:s.served-previousServed,sales:s.purchases-previousSales});
   previousServed=s.served;previousSales=s.purchases;
  }
  if(day===90){
   const recovered=parseImportedSave(serializeSave(s));
   for(const key of ["cash","revenue","expenses","rng","pricePerHour","totalMinutes","promotionDay","served","purchases"])
    assert.equal(recovered[key],s[key],"roundtrip "+key);
   assert.deepEqual(recovered.stationLedger,s.stationLedger);
   s=recovered;
  }
 }
 assert.equal(months.length,6);
 assert.ok(s.served>100);
 assert.ok(!promo||promoCount>0);
 return {seed,size,policy,promotions:promoCount,
  promoSpend:round(promoSpend),extraPcsSpend:round(extraPcsSpend),
  actualPcs:pcCount(s),net:round(s.cash-INITIAL),
  revenue:round(s.revenue),expenses:round(s.expenses),cash:round(s.cash),
  clients:s.served,sales:s.purchases,lost:s.lostCustomers,
  reputation:round(s.reputation),minCash:round(lowest),months};
}

test("panfletagem em 1998 custa R$ 24 e não altera o custo clássico R$ 120",()=>{
 const s=createGame(12,"historical"),classic=createGame(12);
 assert.equal(HISTORICAL_PROMOTION_COST_1998,24);
 assert.equal(promotionCost(s),24);
 assert.equal(promotionCost(classic),PROMOTION_COST);
 const before={cash:s.cash,revenue:s.revenue,expenses:s.expenses,rng:s.rng,
  customers:s.customers.length,served:s.served};
 ok(launchPromotion(s),"1998");
 assert.equal(s.cash,before.cash-24);
 assert.equal(s.expenses,before.expenses+24);
 assert.equal(s.revenue,before.revenue);
 assert.equal(s.rng,before.rng);
 assert.equal(s.served,before.served);
 assert.equal(s.customers.length,before.customers);
 assert.equal(isPromotionActive(s),true);
 assert.equal(launchPromotion(s).ok,false);
 assert.deepEqual(parseImportedSave(serializeSave(s)).promotionDay,s.promotionDay);
 assert.equal(promotionCost(classic),120);
});
test("panfletagem acompanha IPCA sem criar visitantes ou pagamentos",()=>{
 const s=createGame(42,"historical"),classic=createGame(42);
 s.totalMinutes=26*360*DAY_MINUTES;
 classic.totalMinutes=s.totalMinutes;
 const expected=round(24*priceIndex(2024));
 assert.equal(promotionCost(s),expected);
 assert.equal(promotionCost(classic),120);
 const snapshot=JSON.stringify(s),quoted=promotionCost(s);
 assert.equal(JSON.stringify(s),snapshot);
 assert.ok(quoted>24&&quoted<120);
 s.cash=quoted-.01;
 const before=s.expenses;
 assert.equal(launchPromotion(s).ok,false);
 assert.equal(s.expenses,before);
 s.cash=quoted;
 ok(launchPromotion(s),"2024 exact cash");
 assert.ok(Math.abs(s.cash)<.001);
 assert.ok(Math.abs(s.expenses-before-quoted)<.001);
});
test("interface de divulgação exibe valor cotado, não constante clássica",()=>{
 const file=resolve(dirname(fileURLToPath(import.meta.url)),"..","src","main.ts");
 const ui=readFileSync(file,"utf8");
 assert.ok(ui.includes("promotionCost(game)"));
 assert.ok(ui.includes("promotionButton.disabled=promoting||game.cash<cost"));
 assert.equal(ui.includes("game.cash<PROMOTION_COST"),false);
});
const full=process.env.LHS_PROMOTION_PRICING_AUDIT==="1";
test("18 campanhas de 180 dias: preço, panfletagem e expansão reais",
 {skip:!full},()=>{
 const policies3=["fixed250","fixed300","monthly","fixed250promo","fixed300promo","monthlypromo"];
 const policies5=["fixed250","fixed300","monthlypromo"];
 const rows=[];
 for(const seed of SEEDS){
  for(const policy of policies3)rows.push(simulate(seed,3,policy));
  for(const policy of policies5)rows.push(simulate(seed,5,policy));
 }
 assert.equal(rows.length,18);
 const baseline=new Map(rows.filter(r=>r.size===3&&r.policy==="fixed250").map(r=>[r.seed,r.net]));
 for(const r of rows){
  assert.ok(Number.isFinite(r.net));
  assert.ok(Math.abs(r.revenue-r.expenses-r.net)<.01);
  if(r.size===5)assert.ok(r.actualPcs>=3&&r.actualPcs<=5);
  console.log("LHS_PROMOTION_PRICING_CAMPAIGN "+JSON.stringify({
   ...r,incrementalVs3Fixed:round(r.net-baseline.get(r.seed))}));
 }
 for(const size of [3,5])for(const policy of (size===3?policies3:policies5)){
  const group=rows.filter(r=>r.size===size&&r.policy===policy);
  const mean=key=>round(group.reduce((sum,r)=>sum+r[key],0)/group.length);
  console.log("LHS_PROMOTION_PRICING_SUMMARY "+JSON.stringify({
   size,policy,meanNet:mean("net"),meanRevenue:mean("revenue"),
   meanClients:mean("clients"),meanSales:mean("sales"),meanPromotions:mean("promotions"),
   meanPromoSpend:mean("promoSpend"),meanActualPcs:mean("actualPcs"),
   meanIncrementalVs3Fixed:round(mean("net")-
    rows.filter(r=>r.size===3&&r.policy==="fixed250").reduce((sum,r)=>sum+r.net,0)/2)
  }));
 }
});
