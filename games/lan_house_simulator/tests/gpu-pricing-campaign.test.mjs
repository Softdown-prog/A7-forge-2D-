// Estudo não-invasivo: tarifas dentro do limite por ano e qualidade dos PCs.
// Duas sementes, 3 anos, 1/2 PCs equipados, 3 políticas, com e sem licença.
// Executa sempre o motor real; não altera jogo, preços ou RNG fora do teste.
import test from "node:test";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {createGame,stepGame,pcCount,pcWear,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames,setHourlyPrice,stockItem,wholesaleCost} from "../dist/js/sim/economy.js";
import {allowableHourlyPrice,annualHourlyCeiling,yearFromMinutes} from "../dist/js/sim/historicalEconomy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {GPU_GAME_CATALOG,licenseGpuGame,gpuGamePlayableOnPc} from "../dist/js/sim/gpuGames.js";
import {gpuDemandReport,gpuLicenseCoverage} from "../dist/js/sim/gpuDemand.js";
import {requestCleaning,startRepair} from "../dist/js/sim/services.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {withStationOff} from "./station-power-fixture.mjs";

const DAYS=process.env.LHS_GPU_PRICING_AUDIT==="1"?90:8;
const SEEDS=[23,137],PC_CHOICES=[1,2],POLICIES=["reference","intermediate","maximum"];
const CAPITAL=100_000;
const PLANS=[
 {year:2005,id:"neon-rush",platform:"platform05",gpu:"gpu05",windows:"winxp"},
 {year:2009,id:"circuito-competitivo",platform:"platform08",gpu:"gpu09",windows:"win7"},
 {year:2013,id:"arena-do-futuro",platform:"platform12",gpu:"gpu13",windows:"win7"}
];
const money=(n)=>Math.round(n*100)/100;
const ok=(r,where)=>assert.equal(r.ok,true,where+": "+r.message);
function tariff(s,policy){
 const ceiling=allowableHourlyPrice(s),reference=Math.min(ceiling,2.5);
 if(policy==="reference")return reference;
 if(policy==="intermediate")return Math.floor((reference+ceiling)*2+1e-7)/4;
 return ceiling;
}
function initialize(plan,seed,compatiblePcs,policy,licensed){
 const s=createGame(seed,"historical");
 s.totalMinutes=(plan.year-1998)*360*DAY_MINUTES;
 s.cash=CAPITAL;
 ok(licenseGames(s),"Catálogo básico");
 for(let pc=0;pc<compatiblePcs;pc++){
  ok(withStationOff(s,pc,()=>buyPlatform(s,pc,plan.platform)),"Plataforma PC "+pc);
  ok(withStationOff(s,pc,()=>buyGpu(s,pc,plan.gpu)),"GPU PC "+pc);
  ok(withStationOff(s,pc,()=>licenseWindows(s,pc,plan.windows)),"Windows PC "+pc);
 }
 if(licensed)ok(licenseGpuGame(s,plan.id),"Licença avançada");
 const legalCap=allowableHourlyPrice(s),rate=tariff(s,policy);
 assert.ok(rate<=legalCap&&rate>=.5);
 assert.ok(Math.abs(rate*4-Math.round(rate*4))<1e-7);
 ok(setHourlyPrice(s,rate),"Tarifa legal");
 assert.equal(s.pricePerHour,rate);
 for(let pc=0;pc<compatiblePcs;pc++)
  assert.equal(gpuGamePlayableOnPc(s,pc,plan.id),licensed);
 return {s,legalCap,rate};
}
function operate(s){
 for(const product of ["soda","candy","snacks"])
  if(s.inventory[product]<5&&s.cash>=wholesaleCost(s,product))
   stockItem(s,product);
 for(let pc=0;pc<pcCount(s);pc++){
  if(pcWear(s,pc)<70||s.repairJobs?.some(j=>j.pc===pc))continue;
  if(s.customers.some(c=>c.pcIndex===pc&&["to_pc","sitting","using","standing"].includes(c.stage)))continue;
  startRepair(s,pc);
 }
 if((s.binFill??[]).some(n=>n>=70)&&!s.cleaningJob)requestCleaning(s);
}
function simulate(plan,seed,compatiblePcs,policy,licensed){
 const {s,legalCap,rate}=initialize(plan,seed,compatiblePcs,policy,licensed);
 const initialExpenses=s.expenses;
 let busy=0,capacity=0;
 for(let day=0;day<DAYS;day++){
  operate(s);
  for(let block=0;block<6;block++){
   stepGame(s,120);
   if(block===3){busy+=s.customers.filter(c=>c.stage==="using").length;capacity+=pcCount(s);}
  }
 }
 assert.ok(isValidSave(s),"Estado final valido");
 assert.ok(Math.abs(s.cash-(CAPITAL+s.revenue-s.expenses))<.02,"Conservação contábil");
 const recovered=parseImportedSave(serializeSave(s));
 assert.equal(recovered.pricePerHour,s.pricePerHour);
 assert.deepEqual(recovered.gpuGameDemand,s.gpuGameDemand);
 assert.equal(yearFromMinutes(s.totalMinutes),plan.year);
 assert.ok(s.pricePerHour<=allowableHourlyPrice(s));
 const observation=gpuDemandReport(s).find(r=>r.id===plan.id);
 const coverage=gpuLicenseCoverage(s,plan.id);
 if(licensed){
  assert.ok(coverage);
  assert.equal(observation.premiumRevenue,coverage.premiumRevenue);
 }else{
  assert.equal(coverage,undefined);
  assert.equal(observation.premiumRevenue,0);
  assert.equal(observation.played,0);
 }
 return {year:plan.year,title:plan.id,seed,compatiblePcs,policy,licensed,
  requestedRate:rate,appliedRate:s.pricePerHour,legalCap,
  annualCeiling:annualHourlyCeiling(plan.year),
  served:s.served,lost:s.lostCustomers,requests:observation.requested,
  played:observation.played,basic:observation.basic,unresolved:observation.withoutSession,
  premiumRevenue:observation.premiumRevenue,
  licenseCost:licensed?GPU_GAME_CATALOG.find(g=>g.id===plan.id).cost:0,
  coveragePct:coverage?.coveragePercent??null,
  revenue:money(s.revenue),expenses:money(s.expenses),net:money(s.cash-CAPITAL),
  initialExpenses,occupancyPct:Math.round(1000*busy/Math.max(1,capacity))/10};
}
test("tarifas válidas respeitam teto histórico e a qualidade das estações",()=>{
 for(const plan of PLANS)for(const compatiblePcs of PC_CHOICES){
  const sample=initialize(plan,23,compatiblePcs,"reference",false);
  const prices=POLICIES.map(x=>tariff(sample.s,x));
  assert.ok(prices[0]<=prices[1]&&prices[1]<=prices[2]);
  assert.equal(prices[2],allowableHourlyPrice(sample.s));
  assert.ok(prices.every(x=>x>=.5&&x<=prices[2]));
 }
});
test("campanhas pareadas isolam efeito da tarifa e do licenciamento, com saves íntegros",()=>{
 const scenarios=[],comparisons=[];
 for(const plan of PLANS)for(const pcs of PC_CHOICES)for(const seed of SEEDS)
  for(const policy of POLICIES){
   const without=simulate(plan,seed,pcs,policy,false);
   const withLicense=simulate(plan,seed,pcs,policy,true);
   assert.equal(without.appliedRate,withLicense.appliedRate);
   assert.equal(without.initialExpenses+withLicense.licenseCost,withLicense.initialExpenses);
   assert.equal(without.premiumRevenue,0);
   assert.ok(withLicense.requests>=withLicense.played+withLicense.basic);
   scenarios.push(without,withLicense);
   comparisons.push({year:plan.year,pcs,seed,policy,price:withLicense.appliedRate,
    legalCap:withLicense.legalCap,licenseCost:withLicense.licenseCost,
    premiumRevenue:withLicense.premiumRevenue,
    licensedNetMinusUnlicensed:money(withLicense.net-without.net),
    visitorsDifference:withLicense.served-without.served,
    lostDifference:withLicense.lost-without.lost,
    premiumSessions:withLicense.played,coveragePct:withLicense.coveragePct});
  }
 assert.equal(scenarios.length,72);
 const summary=[];
 for(const plan of PLANS)for(const pcs of PC_CHOICES)for(const policy of POLICIES){
  const rows=comparisons.filter(r=>r.year===plan.year&&r.pcs===pcs&&r.policy===policy);
  const avg=key=>money(rows.reduce((sum,r)=>sum+r[key],0)/rows.length);
  summary.push({year:plan.year,pcs,policy,price:rows[0].price,
   legalCap:rows[0].legalCap,meanPremiumRevenue:avg("premiumRevenue"),
   meanNetDifference:avg("licensedNetMinusUnlicensed"),
   meanPremiumSessions:avg("premiumSessions"),meanCoveragePct:avg("coveragePct"),
   meanServedDifference:avg("visitorsDifference")});
 }
 assert.equal(summary.length,18);
 for(const s of summary)console.log("GPU_PRICE_SUMMARY "+JSON.stringify(s));
 if(process.env.LHS_GPU_PRICING_AUDIT==="1"){
  const dir=new URL("../out/audits/",import.meta.url);
  mkdirSync(dir,{recursive:true});
  writeFileSync(new URL("gpu-price-comparison-90day.json",dir),
   JSON.stringify({periodDays:DAYS,capital:CAPITAL,seeds:SEEDS,policies:POLICIES,
    method:"3 price variants chosen legally after equipping stations; same equipment and RNG seed in paired license cases; initial capital is laboratory funding, not real starting capital.",
    limitations:"Tariff differences can change foot traffic and reputation; 90-day coverage is not total profit. Different policies can resolve to the same legal tariff.",
    summary,comparisons,scenarios},null,2)+"\n");
  console.log("GPU_PRICE_REPORT out/audits/gpu-price-comparison-90day.json");
 }
});
