// Integração real de 35 dias: PCs, PS1, duas profissões, clientes, estoque
// individual, entregas pré-pagas e save. Sem mocks de vendas nem avanço de RNG.
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {DAYS_PER_YEAR} from "../dist/js/sim/mailCalendar.js";
import {orderMerchandise,merchandiseStock,availableProducts,quoteOrder} from "../dist/js/sim/merchandise.js";
import {buyPs1Station,buyPs1Disc,ps1PlacementSlots} from "../dist/js/sim/ps1.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {expandDirection} from "../dist/js/sim/room.js";
import {installAnnexComputer} from "../dist/js/sim/stations.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {circulationScenario} from "./circulation_scenario.mjs";

const out=resolve(process.argv[2]??"out/integrated-engine");
await mkdir(out,{recursive:true});
const ok=r=>assert.equal(r.ok,true,r.message);
const cents=n=>Math.round(n*100)/100;
const quantile=(values,p)=>{
 const sorted=[...values].sort((a,b)=>a-b);
 return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]??0;
};

function checkCash(s,opening){
 assert.equal(cents(s.cash),cents(opening+s.revenue-s.expenses),
  "Cash must reflect only paid receipts and expenses, including staff and stock");
 assert.equal(isValidSave(s),true,"Integrated simulation must produce an importable save");
}
const campaign=createGame(2002,"historical");
// Test capital, deliberately separate from the default starter balance.
campaign.cash=26000;
campaign.totalMinutes=4*DAYS_PER_YEAR*DAY_MINUTES;
campaign.licensedGames=true;
campaign.contentFilterInstalled=true;
campaign.pcWindowsLicenses=[true,true,true];
const opening=campaign.cash;
ok(expandDirection(campaign,"north"));
ok(expandDirection(campaign,"east"));
ok(installAnnexComputer(campaign,"pc-north-1"));
ok(hireEmployee(campaign,"cleaner"));
ok(hireEmployee(campaign,"technician"));
const ps1Slot=ps1PlacementSlots(campaign)[0];
assert.ok(ps1Slot,"PS1 needs a physical free slot");
ok(buyPs1Station(campaign,ps1Slot.id));
ok(buyPs1Disc(campaign,"turbo-circuito"));
// Force genuinely needed contracted work without inventing a service charge.
campaign.binFill=[80,80];campaign.pcWear[0]=100;
let s=campaign,placedUnits=0,delayedPlaced=0,deliveriesSeen=0;
const stockAtStart=availableProducts(s).reduce((n,p)=>n+merchandiseStock(s,p.id),0);
function purchase(id,supplier,packs=1){
 const p=availableProducts(s).find(p=>p.id===id);
 assert.ok(p,"Product must be available in its historical year: "+id);
 ok(orderMerchandise(s,id,supplier,packs));
 placedUnits+=p.pack*packs;
 if(supplier==="economy")delayedPlaced++;
}
purchase("water","economy",3);
purchase("gum","basic");
purchase("chocolate","quality");
purchase("pacoca","basic");
purchase("juice","basic");
const remainingSamples=[];
const reports=[];
for(let day=0;day<35;day++){
 // The day-7 backup intentionally contains a prepaid, not-yet-delivered order.
 if(day===7){
  purchase("water","economy",3);
  const pending=s.merchandise.orders.length,priorCash=s.cash,priorExpenses=s.expenses;
  assert.ok(pending>0,"At least one delayed order should survive reload");
  const restored=parseImportedSave(serializeSave(s));
  assert.equal(restored.merchandise.orders.length,pending);
  assert.equal(restored.cash,priorCash);assert.equal(restored.expenses,priorExpenses);
  assert.equal(restored.rng,s.rng,"Save must preserve the visitor RNG");
  s=restored;
 }
 for(const p of availableProducts(s)){
  if(merchandiseStock(s,p.id)>=3||
     s.merchandise?.orders.some(o=>o.product===p.id))continue;
  const supplier=day%4===0?"economy":day%4===1?"quality":"basic",packs=supplier==="economy"?3:1;
  if(s.cash>=quoteOrder(s,p.id,supplier,packs)+1500)purchase(p.id,supplier,packs);
 }
 const initialPurchases=s.purchases;
 const pendingBefore=new Set((s.merchandise?.orders??[]).map(o=>o.id));
 for(let minute=0;minute<DAY_MINUTES;minute+=60){
  const start=performance.now();
  stepGame(s,60);
  remainingSamples.push(performance.now()-start);
  assert.ok(Number.isFinite(s.cash)&&Number.isFinite(s.revenue)&&Number.isFinite(s.expenses));
 }
 const pendingAfter=new Set((s.merchandise?.orders??[]).map(o=>o.id));
 deliveriesSeen += [...pendingBefore].filter(id=>!pendingAfter.has(id)).length;
 checkCash(s,opening);
 reports.push({day:day+1,served:s.served,retailSales:s.purchases,
  dailyRetailSales:s.purchases-initialPurchases,customers:s.customers.length,
  inventoryOrders:s.merchandise?.orders.length??0,cash:cents(s.cash)});
}
assert.ok(s.served>30,"Actual customers should complete sessions across the 35-day game");
assert.ok(s.purchases>10,"Actual customers should buy individual products");
assert.ok((s.ps1Sessions??0)>0,"Purchased PS1 with a CD should serve real customers");
assert.ok(s.employeeWorkedDays?.cleaner||s.employeeWorkedDays?.technician||s.lastPaidMonthlyBill,
 "Contracted staff and monthly billing must be represented in the same game");
assert.ok(s.lastPaidMonthlyBill,"The 30-day monthly settlement must happen");
assert.ok(delayedPlaced>0&&deliveriesSeen>0,"Prepaid suppliers must deliver over the simulated calendar");
const sold=Object.values(s.merchandise?.products??{}).reduce((n,a)=>n+a.sold,0);
const pending=(s.merchandise?.orders??[]).reduce((n,o)=>n+o.quantity,0);
const remaining=availableProducts(s).reduce((n,p)=>n+merchandiseStock(s,p.id),0);
assert.equal(sold,s.purchases,"Every retail purchase must represent exactly one stocked sale");
assert.equal(stockAtStart+placedUnits,remaining+pending+sold,
 "Every physical unit is either in stock, in transit or sold");
const saved=parseImportedSave(serializeSave(s));
assert.equal(saved.cash,s.cash);
assert.equal(saved.purchases,s.purchases);
assert.equal(saved.merchandise?.orders.length,s.merchandise?.orders.length);
assert.equal(isValidSave(saved),true);

const crowded=circulationScenario(1998);
ok(hireEmployee(crowded,"cleaner"));
ok(hireEmployee(crowded,"technician"));
crowded.binFill=[80,80];
ok(orderMerchandise(crowded,"water","basic",3));
ok(orderMerchandise(crowded,"cookies","basic"));
const routeSamples=[],exited=new Set();
for(let minute=0;minute<360;minute++){
 const ids=new Set(crowded.customers.map(c=>c.id)),start=performance.now();
 stepGame(crowded,1);
 routeSamples.push(performance.now()-start);
 for(const id of ids)if(!crowded.customers.some(c=>c.id===id))exited.add(id);
}
assert.ok(crowded.served>=12&&exited.size>=15,"Crowded expanded rooms must remain traversable");
assert.ok(crowded.purchases>=5,"The long retail line must still produce actual sales");
assert.equal(isValidSave(crowded),true);

const results={
 longCampaign:{days:35,gameYear:2002,served:s.served,ps1Sessions:s.ps1Sessions??0,
  purchases:s.purchases,delayedOrdersPlaced:delayedPlaced,daysWithDelivery:deliveriesSeen,
  staffWorkedDays:s.employeeWorkedDays??{},monthlyBillPaid:!!s.lastPaidMonthlyBill,
  finalCash:cents(s.cash),simulationChunkP95Ms:+quantile(remainingSamples,.95).toFixed(2),
  simulationChunkMaxMs:+Math.max(...remainingSamples).toFixed(2)},
 crowded:{minutes:360,served:crowded.served,exited:exited.size,
  retailSales:crowded.purchases,simulationMinuteP95Ms:+quantile(routeSamples,.95).toFixed(2),
  simulationMinuteMaxMs:+Math.max(...routeSamples).toFixed(2)},
 daily:reports
};
await writeFile(resolve(out,"integrated_engine_35days.json"),JSON.stringify(results,null,2)+"\n");
console.log("INTEGRATED_ENGINE "+JSON.stringify({longCampaign:results.longCampaign,crowded:results.crowded}));
