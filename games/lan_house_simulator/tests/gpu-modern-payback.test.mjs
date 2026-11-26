import assert from "node:assert/strict";
import test from "node:test";
import {createGame,pcCount,pcWear,stepGame} from "../dist/js/sim/engine.js";
import {contractSupplier,licenseGames,setHourlyPrice,stockItem,upgradeInternet,wholesaleCost} from "../dist/js/sim/economy.js";
import {buyGpu,gpuSpec,installedGpu} from "../dist/js/sim/gpu.js";
import {GPU_GAME_CATALOG,gpuGamePlayableOnPc,licenseGpuGame} from "../dist/js/sim/gpuGames.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {allowableHourlyPrice,yearFromMinutes} from "../dist/js/sim/historicalEconomy.js";
import {DAYS_PER_YEAR,GAME_FIRST_YEAR} from "../dist/js/sim/mailCalendar.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {requestCleaning,startRepair} from "../dist/js/sim/services.js";
import {stationAccountingSummary} from "../dist/js/sim/stationAccounting.js";
import {stationHasCustomer} from "../dist/js/sim/stationPower.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseAndCompleteWindows,withStationOff} from "./station-power-fixture.mjs";

const EXCHANGES=[
 {previous:"gpu23",replacement:"gpu25"},
 {previous:"gpu25",replacement:"gpu28"},
 {previous:"gpu28",replacement:"gpu30"}
];
const SEEDS=[23,137];
const PRICE_POLICIES=["three-quarters","ceiling"];
const CAPITAL=100_000;
const DAYS=330;
const STATION=0;
const money=value=>Math.round(value*100)/100;
const accept=result=>assert.equal(result.ok,true,result.message);

function prepare(exchange,seed,policy){
 const {year,cost}=gpuSpec(exchange.replacement);
 const state=createGame(seed,"historical");
 const firstDay=(year-GAME_FIRST_YEAR)*DAYS_PER_YEAR;
 state.totalMinutes=firstDay*DAY_MINUTES;
 state.cash=CAPITAL;
 accept(licenseGames(state));
 accept(hireContentProgrammer(state));
 accept(contractSupplier(state));
 accept(upgradeInternet(state));
 accept(upgradeInternet(state));
 for(let pc=0;pc<pcCount(state);pc++){
  accept(withStationOff(state,pc,()=>buyPlatform(state,pc,"platform24")));
  accept(withStationOff(state,pc,()=>licenseAndCompleteWindows(state,pc,"win11")));
  accept(withStationOff(state,pc,()=>buyGpu(state,pc,exchange.previous)));
 }
 for(const game of GPU_GAME_CATALOG)accept(licenseGpuGame(state,game.id));
 const ceiling=allowableHourlyPrice(state);
 const price=policy==="ceiling"?ceiling:Math.floor(3*ceiling)/4;
 accept(setHourlyPrice(state,price));

 // Começar do mesmo estado pago, com os mesmos jogos e a mesma semente.
 const upgraded=structuredClone(state);
 accept(withStationOff(upgraded,STATION,()=>buyGpu(upgraded,STATION,exchange.replacement)));
 assert.equal(installedGpu(upgraded,STATION),exchange.replacement);
 assert.equal(money(state.cash-upgraded.cash),cost);
 assert.equal(money(upgraded.expenses-state.expenses),cost);
 assert.deepEqual({...upgraded,cash:state.cash,expenses:state.expenses,pcGpus:state.pcGpus},state);
 for(const game of GPU_GAME_CATALOG)for(let pc=0;pc<pcCount(state);pc++){
  assert.equal(gpuGamePlayableOnPc(state,pc,game.id),true);
  assert.equal(gpuGamePlayableOnPc(upgraded,pc,game.id),true);
 }
 return {hold:state,upgraded,firstDay,year,price,cost};
}

function upkeep(state){
 for(const item of ["soda","candy","snacks"]){
  if(state.inventory[item]<5&&state.cash>=wholesaleCost(state,item))accept(stockItem(state,item));
 }
 for(let pc=0;pc<pcCount(state);pc++){
  if(pcWear(state,pc)>=75&&!stationHasCustomer(state,pc)&&
     !state.repairJobs?.some(job=>job.pc===pc)&&state.cash>=100)accept(startRepair(state,pc));
 }
 if((state.binFill??[]).some(fill=>fill>=75)&&!state.cleaningJob&&state.cash>=55)
  accept(requestCleaning(state));
}

function resume(state){
 const restored=parseImportedSave(serializeSave(state));
 for(const key of ["totalMinutes","cash","revenue","expenses","rng","served","pricePerHour"])
  assert.equal(restored[key],state[key],key);
 for(const key of ["pcGpus","stationLedger","lastPaidMonthlyBill","licensedGpuGames"])
  assert.deepEqual(restored[key],state[key],key);
 return restored;
}

function run(start,firstDay,days){
 let state=start;
 let energyPaid=0;
 const initialExpenses=state.expenses;
 const price=state.pricePerHour;
 const monthlyCash=[];
 for(let day=1;day<=days;day++){
  upkeep(state);
  for(let elapsed=0;elapsed<DAY_MINUTES;elapsed+=120)stepGame(state,120);
  if(day%30!==0)continue;
  assert.equal(state.totalMinutes,(firstDay+day)*DAY_MINUTES);
  assert.equal(state.lastPaidMonthlyBill?.endDay,firstDay+day);
  energyPaid+=state.lastPaidMonthlyBill.energy;
  assert.ok(Math.abs(state.cash-(CAPITAL+state.revenue-state.expenses))<.001);
  assert.equal(state.pricePerHour,price);
  assert.ok(price<=allowableHourlyPrice(state));
  monthlyCash.push(money(state.cash));
  if(day===Math.floor(days/60)*30)state=resume(state);
 }
 const restored=resume(state);
 const station=stationAccountingSummary(restored,STATION);
 assert.equal(yearFromMinutes(restored.totalMinutes),yearFromMinutes(firstDay*DAY_MINUTES));
 assert.ok(restored.served>0&&station.sessions>0);
 return {cash:restored.cash,energyPaid,revenue:restored.revenue,
  operatingExpenses:restored.expenses-initialExpenses,served:restored.served,
  reputation:restored.reputation,stationSessions:station.sessions,vipSessions:station.vipSessions,monthlyCash};
}

function compare(setup,days){
 const {hold,upgraded,firstDay,cost}=setup;
 const baseline=run(hold,firstDay,days);
 const replacement=run(upgraded,firstDay,days);
 const cashDifference=money(replacement.cash-baseline.cash);
 const revenueDifference=money(replacement.revenue-baseline.revenue);
 const expenseDifference=money(replacement.operatingExpenses-baseline.operatingExpenses);
 const operatingDifference=money(revenueDifference-expenseDifference);
 assert.equal(cashDifference,money(operatingDifference-cost));
 const paybackMonth=replacement.monthlyCash.findIndex((cash,i)=>cash>=baseline.monthlyCash[i])+1;
 return {cashDifference,revenueDifference,expenseDifference,operatingDifference,
  energyDifference:replacement.energyPaid-baseline.energyPaid,
  servedDifference:replacement.served-baseline.served,
  reputationDifference:money(replacement.reputation-baseline.reputation),
  stationSessionsDifference:replacement.stationSessions-baseline.stationSessions,
  vipSessionsDifference:replacement.vipSessions-baseline.vipSessions,
  paybackMonth:paybackMonth||null};
}

test("a troca moderna mantém tarifa, catálogo e montagem no comparativo pareado",()=>{
 const setup=prepare(EXCHANGES[0],SEEDS[0],PRICE_POLICIES[0]);
 compare(setup,30);
});

test("retorno da troca de GPU em 2025, 2028 e 2030",
 {skip:process.env.LHS_GPU_MODERN_AUDIT!=="1"},()=>{
 for(const exchange of EXCHANGES)for(const policy of PRICE_POLICIES){
  const rows=SEEDS.map(seed=>{
   const setup=prepare(exchange,seed,policy);
   const row={...exchange,year:setup.year,price:setup.price,cost:setup.cost,policy,seed,...compare(setup,DAYS)};
   console.log("GPU_MODERN_CAMPAIGN "+JSON.stringify(row));
   return row;
  });
  const [first]=rows;
  const mean=key=>money(rows.reduce((sum,row)=>sum+row[key],0)/rows.length);
  console.log("GPU_MODERN_SUMMARY "+JSON.stringify({...exchange,year:first.year,price:first.price,
   policy,cost:first.cost,days:DAYS,meanCashDifference:mean("cashDifference"),
   meanOperatingDifference:mean("operatingDifference"),meanEnergyDifference:mean("energyDifference"),
   meanServedDifference:mean("servedDifference"),meanReputationDifference:mean("reputationDifference"),
   meanStationSessionsDifference:mean("stationSessionsDifference"),
   meanVipSessionsDifference:mean("vipSessionsDifference"),
   paybackMonths:rows.map(row=>row.paybackMonth)}));
 }
});
