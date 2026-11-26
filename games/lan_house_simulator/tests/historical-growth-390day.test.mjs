import {withStationOff,licenseAndCompleteWindows} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,pcCount,pcWear,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gameYear} from "../dist/js/sim/era.js";
import {licenseGames,contractSupplier,stockItem,wholesaleCost,expandShop,monthlyBills,setHourlyPrice} from "../dist/js/sim/economy.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {buyComputer,shopPrice} from "../dist/js/sim/shop.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {annualHourlyCeiling,allowableHourlyPrice,priceIndex} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const SEEDS=[23,137],TARGETS=[3,5,7],DAYS=390,START=850;
const TWO_YEARS=750,RESERVE=550;
const REFERENCE_TARIFF=2.5;
const money=n=>Math.round(100*n)/100;
const must=(result,label)=>assert.equal(result.ok,true,label+": "+result.message);

function restoreCampaign(state,checkpoint){
 const restored=parseImportedSave(serializeSave(state));
 for(const key of ["cash","revenue","expenses","rng","totalMinutes","served","purchases","pricePerHour"])
  assert.equal(restored[key],state[key],key+" em "+checkpoint);
 for(const key of ["pcWindowsLicenses","stationLedger","lastPaidMonthlyBill","mailSeenIds","storyRecords"])
  assert.deepEqual(restored[key],state[key],key+" em "+checkpoint);
 return restored;
}

function upkeep(s){
 for(let pc=0;pc<pcCount(s);pc++){
  if(!(s.pcWindowsLicenses?.[pc])&&s.cash>=250+RESERVE)
   must(withStationOff(s,pc,()=>licenseAndCompleteWindows(s,pc,"win98")),"Windows 98 on "+pc);
 }
 if((s.pcWindowsLicenses??[]).slice(0,pcCount(s)).every(Boolean)&&
    s.supplierTier!==2&&s.cash>=180+RESERVE)
  must(contractSupplier(s),"supplier");
 for(const item of ["soda","candy","snacks"]){
  const cost=wholesaleCost(s,item);
  if(s.inventory[item]<5&&s.cash>=cost)
   must(stockItem(s,item),"stock "+item);
 }
 for(let pc=0;pc<pcCount(s);pc++){
  const busy=s.customers.some(c=>c.pcIndex===pc&&
   ["to_pc","sitting","using","standing"].includes(c.stage));
  if(pcWear(s,pc)>=75&&!busy&&!s.repairJobs?.some(j=>j.pc===pc)&&s.cash>=110)
   must(startRepair(s,pc),"repair "+pc);
 }
 if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=70)
  must(requestCleaning(s),"clean");
}

function expandFromEarnings(s,target,day){
 if(target===3||day<=120)return 0;
 const allowed=day<=240?5:target;
 let investment=0;
 if(pcCount(s)>=allowed)return 0;
 const levelNeeded=allowed===7?2:1;
 if(s.expansionLevel<levelNeeded){
  const cost=650+s.expansionLevel*450;
  if(s.cash>=cost+RESERVE){
   const old=s.expenses;
   must(expandShop(s),"expand to "+allowed);
   investment+=s.expenses-old;
  }
 }
 if(s.expansionLevel>=levelNeeded||s.expansionLevel>0){
  const limit=3+2*s.expansionLevel;
  if(pcCount(s)<limit&&pcCount(s)<allowed){
   const price=shopPrice(s,"computer");
   if(s.cash>=price+RESERVE){
    const old=s.expenses;
    must(buyComputer(s),"install PC");
    investment+=s.expenses-old;
   }
  }
 }
 return investment;
}

function campaign(seed,target,days=DAYS,hourlyPrice=REFERENCE_TARIFF){
 let s=createGame(seed,"historical");
 assert.equal(s.cash,START);
 must(setHourlyPrice(s,hourlyPrice),"set comparison tariff");
 must(licenseGames(s),"licensed games");
 must(hireContentProgrammer(s),"content filter");
 let expansionInvestment=0,lowest=s.cash,yearChangeChecked=false;
 let previousRevenue=0,previousExpenses=0,previousServed=0;
 const months=[];
 for(let day=1;day<=days;day++){
  expansionInvestment+=expandFromEarnings(s,target,day);
  upkeep(s);
  for(let part=0;part<6;part++)stepGame(s,120);
  lowest=Math.min(lowest,s.cash);
  if(day===360){
   assert.equal(gameYear(s),1999);
   assert.equal(s.economyVersion,2);
   assert.ok(priceIndex(1999)>priceIndex(1998));
   assert.ok(annualHourlyCeiling(1999)>=annualHourlyCeiling(1998));
   const sameBills=monthlyBills({...s,energyAccrued:0,totalMinutes:0});
   const newBills=monthlyBills({...s,energyAccrued:0,totalMinutes:s.totalMinutes});
   assert.ok(newBills>sameBills,"1999 IPCA increases annualized fixed costs");
   yearChangeChecked=true;
  }
  if(day===720){
   assert.equal(gameYear(s),2000);
   assert.ok(annualHourlyCeiling(2000)>=annualHourlyCeiling(1999));
  }
  if(day%30===0){
   assert.equal(s.totalMinutes,day*DAY_MINUTES);
   assert.ok(Math.abs(s.cash-(START+s.revenue-s.expenses))<.001,
    "cash conservation at day "+day+" / "+seed+" / "+target);
   assert.ok(isValidSave(s));
   assert.equal(s.pricePerHour,hourlyPrice,"fixed tariff for fair paired comparison");
   assert.ok(s.pricePerHour<=allowableHourlyPrice(s));
   assert.ok(s.reputation>=10&&s.reputation<=100);
   assert.ok(Math.abs(s.lastMonthRevenue-(s.revenue-previousRevenue))<.001);
   // Floating point receipts can have rounding error at accumulated-cent scale.
   assert.ok(Math.abs(s.lastMonthExpenses-(s.expenses-previousExpenses))<1e-6);
   const occupied=s.lastMonthPcCapacityMinutes?
    100*s.lastMonthPcUsedMinutes/s.lastMonthPcCapacityMinutes:0;
   assert.ok(occupied>=0&&occupied<=100);
   months.push({month:day/30,year:gameYear(s),cash:money(s.cash),
    pcs:pcCount(s),revenue:money(s.lastMonthRevenue),
    expenses:money(s.lastMonthExpenses),
    customers:s.served-previousServed,occupancy:money(occupied)});
   previousRevenue=s.revenue;previousExpenses=s.expenses;previousServed=s.served;
  }
  if(day===180||day===365||day===720)s=restoreCampaign(s,"dia "+day);
 }
 assert.equal(yearChangeChecked,true);
 assert.equal(months.length,days/30);
 assert.ok(s.served>100);
 assert.ok(Math.abs(s.cash-(START+s.revenue-s.expenses))<.001);
 return {seed,targetPcs:target,days,actualPcs:pcCount(s),
  expansionInvestment:money(expansionInvestment),customers:s.served,
  purchases:s.purchases,revenue:money(s.revenue),expenses:money(s.expenses),
  net:money(s.cash-START),cash:money(s.cash),lowestCash:money(lowest),
  annualCeiling1998:annualHourlyCeiling(1998),
  annualCeiling1999:annualHourlyCeiling(1999),
  months};
}

test("novo jogo histórico mantém save, caixa e limites após 30 dias",()=>{
 const s=createGame(23,"historical");
 must(licenseGames(s),"games");must(hireContentProgrammer(s),"programmer");
 for(let day=0;day<30;day++){upkeep(s);for(let slice=0;slice<6;slice++)stepGame(s,120);}
 assert.equal(s.totalMinutes,30*DAY_MINUTES);
 assert.ok(Math.abs(s.cash-(START+s.revenue-s.expenses))<.001);
 assert.ok(isValidSave(s));
 assert.deepEqual(parseImportedSave(serializeSave(s)).pcWindowsLicenses,s.pcWindowsLicenses);
});

const full=process.env.LHS_GROWTH_AUDIT==="1";
function compareGrowth(hourlyPrice,logPrefix){
 const rows=[];
 for(const seed of SEEDS)for(const target of TARGETS)
  rows.push(campaign(seed,target,DAYS,hourlyPrice));
 assert.equal(rows.length,6);
 for(const seed of SEEDS){
  const group=rows.filter(r=>r.seed===seed);
  assert.equal(group.length,3);
  const baseline=group.find(r=>r.targetPcs===3);
  assert.equal(baseline.expansionInvestment,0);
  for(const r of group){
   assert.ok(r.actualPcs>=3&&r.actualPcs<=r.targetPcs);
   assert.equal(r.months[11].year,1999);
   assert.equal(r.months[12].year,1999);
   console.log(logPrefix+"_CAMPAIGN "+JSON.stringify({...r,hourlyPrice,incrementalNet:money(r.net-baseline.net)}));
  }
 }
 const netCents=campaigns=>campaigns.reduce((sum,row)=>sum+Math.round(row.net*100),0);
 const baselineNet=netCents(rows.filter(r=>r.targetPcs===3));
 for(const targetPcs of TARGETS){
  const group=rows.filter(r=>r.targetPcs===targetPcs);
  const avg=k=>money(group.reduce((n,r)=>n+r[k],0)/group.length);
  const totalNet=netCents(group);
  console.log(logPrefix+"_SUMMARY "+JSON.stringify({
   hourlyPrice,targetPcs,avgActualPcs:avg("actualPcs"),avgExpansionInvestment:avg("expansionInvestment"),
   avgNet:Math.round(totalNet/group.length)/100,
   avgIncrementalNet:Math.round((totalNet-baselineNet)/group.length)/100,
   avgCustomers:avg("customers"),avgSales:avg("purchases"),
   avgMinimumCash:avg("lowestCash")}));
 }
}
test("crescimento real 1998–1999: 3 vs 5 vs 7 PCs com caixa inicial R$ 850",
 {skip:!full},()=>compareGrowth(REFERENCE_TARIFF,"LHS_GROWTH"));
for(const tariff of [2,3]){
 test("crescimento 1998–1999 com tarifa fixa de R$ "+tariff,
  {skip:!full},()=>compareGrowth(tariff,"LHS_GROWTH_TARIFF"));
}
test("1998–2000: a mesma campanha atravessa duas viradas anuais e salva",
 {skip:!full},()=>{
 const result=campaign(23,3,TWO_YEARS);
 assert.equal(result.days,750);
 assert.equal(result.months.length,25);
 assert.equal(result.months[23].year,2000);
 assert.equal(result.months[24].year,2000);
 console.log("LHS_GROWTH_TWO_YEARS "+JSON.stringify(result));
});
