// Campanhas pareadas: a mesma GPU, Windows e condições nos dois braços.
// A única diferença inicial é a compra da licença avançada; sem inventar
// clientes/receita. Compara separadamente 1 PC ou 2 PCs equipados.
import test from "node:test";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {createGame,isValidSave,stepGame,pcCount,pcWear} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames,stockItem,wholesaleCost} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {GPU_GAME_CATALOG,licenseGpuGame,gpuGamePlayableOnPc} from "../dist/js/sim/gpuGames.js";
import {gpuDemandReport,gpuLicenseCoverage} from "../dist/js/sim/gpuDemand.js";
import {requestCleaning,startRepair} from "../dist/js/sim/services.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {withStationOff} from "./station-power-fixture.mjs";

const DAYS=process.env.LHS_GPU_LICENSE_AUDIT==="1"?90:8;
const ENDOWMENT=100000;
const candidates=[
 {year:2005,id:"neon-rush",platform:"platform05",gpu:"gpu05",windows:"winxp"},
 {year:2009,id:"circuito-competitivo",platform:"platform08",gpu:"gpu09",windows:"win7"},
 {year:2013,id:"arena-do-futuro",platform:"platform12",gpu:"gpu13",windows:"win7"}
];
const accept=(r,context)=>assert.equal(r.ok,true,context+": "+r.message);
function setup(config,seed,pcs,withLicense){
 const s=createGame(seed,"historical");
 s.totalMinutes=(config.year-1998)*360*DAY_MINUTES;
 s.cash=ENDOWMENT;
 accept(licenseGames(s),"catálogo básico");
 for(let i=0;i<pcs;i++){
  accept(withStationOff(s,i,()=>buyPlatform(s,i,config.platform)),"plataforma PC "+i);
  accept(withStationOff(s,i,()=>buyGpu(s,i,config.gpu)),"GPU PC "+i);
  accept(withStationOff(s,i,()=>licenseWindows(s,i,config.windows)),"Windows PC "+i);
 }
 if(withLicense)accept(licenseGpuGame(s,config.id),"licença do jogo");
 for(let i=0;i<pcs;i++)
  assert.equal(gpuGamePlayableOnPc(s,i,config.id),withLicense);
 return s;
}
function dailyUpkeep(s){
 for(const item of ["soda","candy","snacks"])
  if(s.inventory[item]<5&&s.cash>wholesaleCost(s,item))stockItem(s,item);
 for(let i=0;i<pcCount(s);i++){
  if(pcWear(s,i)<70||s.repairJobs?.some(j=>j.pc===i))continue;
  if(s.customers.some(c=>c.pcIndex===i&&["to_pc","sitting","using","standing"].includes(c.stage)))continue;
  startRepair(s,i);
 }
 if((s.binFill??[]).some(n=>n>=70)&&!s.cleaningJob)requestCleaning(s);
}
function campaign(config,seed,pcs,withLicense){
 const s=setup(config,seed,pcs,withLicense),initialExpenses=s.expenses;
 let busy=0,total=0;
 for(let day=0;day<DAYS;day++){
  dailyUpkeep(s);
  for(let block=0;block<6;block++){
   stepGame(s,120);
   if(block===3){
    busy+=s.customers.filter(c=>c.stage==="using").length;
    total+=pcCount(s);
   }
  }
 }
 assert.ok(isValidSave(s));
 assert.ok(Math.abs(s.cash-(ENDOWMENT+s.revenue-s.expenses))<.02,"caixa conservado");
 let copy;
 try{copy=parseImportedSave(serializeSave(s));}
 catch(error){
  const cents=x=>Math.abs(x*100-Math.round(x*100));
  console.log("GPU_SAVE_DIAGNOSTIC "+JSON.stringify({
   year:config.year,seed,pcs,withLicense,dayCount:DAYS,
   cash:s.cash,cashCentError:cents(s.cash),price:s.pricePerHour,priceCentError:cents(s.pricePerHour),
   revenue:s.revenue,expenses:s.expenses,rng:s.rng,totalMinutes:s.totalMinutes,
   internetTier:s.internetTier,expansionLevel:s.expansionLevel,
   customers:s.customers.length,eventLogCount:s.eventLog.length,
   eventLong:s.eventLog.filter(x=>typeof x!=="string"||x.length>=1000).slice(0,2),
   inventory:s.inventory,promotionDay:s.promotionDay,
   err:String(error)
  }));
  throw error;
 }
 assert.equal(isValidSave(copy),true);
 const observed=gpuDemandReport(s).find(x=>x.id===config.id);
 const coverage=gpuLicenseCoverage(s,config.id);
 if(withLicense){
  assert.ok(coverage);
  assert.equal(coverage.premiumRevenue,observed.premiumRevenue);
  assert.equal(coverage.licenseCost,GPU_GAME_CATALOG.find(g=>g.id===config.id).cost);
 }else{
  assert.equal(coverage,undefined);
  assert.equal(observed.premiumRevenue,0);
  assert.equal(observed.played,0);
 }
 return {year:config.year,title:config.id,seed,pcs,withLicense,days:DAYS,
  served:s.served,requested:observed.requested,played:observed.played,
  basic:observed.basic,unresolved:observed.withoutSession,
  addedRevenue:observed.premiumRevenue,initialExpenses,
  revenue:+s.revenue.toFixed(2),expenses:+s.expenses.toFixed(2),
  cash:+s.cash.toFixed(2),net:+(s.cash-ENDOWMENT).toFixed(2),
  occupancyPct:Math.round(busy/Math.max(1,total)*1000)/10,
  coveragePct:coverage?.coveragePercent??null};
}
test("comparativo controlado 2005/2009/2013: licenças e 1 ou 2 GPUs com transações reais",()=>{
 const results=[];
 const configs=process.env.LHS_GPU_DIAG==="1"?[candidates[0]]:candidates;
 const seeds=process.env.LHS_GPU_DIAG==="1"?[23]:[23,137];
 const pcChoices=process.env.LHS_GPU_DIAG==="1"?[1]:[1,2];
 for(const config of configs)for(const seed of seeds)for(const pcs of pcChoices){
  const no=campaign(config,seed,pcs,false),yes=campaign(config,seed,pcs,true);
  // Despesas podem acumular residuos IEEE-754 menores que um centavo.
  // Comparar os centavos cobrados, nao os bits do numero de ponto flutuante.
  assert.equal(Math.round((yes.initialExpenses-no.initialExpenses)*100)/100,
   GPU_GAME_CATALOG.find(g=>g.id===config.id).cost);
  assert.ok(yes.requested>0&&no.requested>0,"visitantes com demanda real");
  assert.ok(yes.played<=yes.requested);
  assert.ok(yes.addedRevenue>=0);
  assert.ok(no.played===0&&no.addedRevenue===0,"sem licença não vende títulos");
  results.push(no,yes);
 }
 assert.equal(results.length,configs.length*seeds.length*pcChoices.length*2);
 for(const row of results)console.log("GPU_LICENSE_AUDIT "+JSON.stringify(row));
 const summaries=[];
 for(const year of configs.map(x=>x.year))for(const pcs of pcChoices){
  const both=results.filter(r=>r.year===year&&r.pcs===pcs);
  const avg=(licensed,key)=>+(both.filter(r=>r.withLicense===licensed)
   .reduce((sum,r)=>sum+r[key],0)/seeds.length).toFixed(2);
  summaries.push({year,pcs,periodDays:DAYS,meanAddedRevenue:avg(true,"addedRevenue"),
   meanServedWith:avg(true,"served"),meanServedWithout:avg(false,"served"),
   meanNetWith:avg(true,"net"),meanNetWithout:avg(false,"net"),
   meanCoveragePct:avg(true,"coveragePct")});
 }
 for(const row of summaries)console.log("GPU_LICENSE_SUMMARY "+JSON.stringify(row));
 if(process.env.LHS_GPU_LICENSE_AUDIT==="1"&&process.env.LHS_GPU_DIAG!=="1"){
  const dir=new URL("../out/audits/",import.meta.url);
  mkdirSync(dir,{recursive:true});
  const report={name:"Lan House Simulator — GPU licenses, controlled 90-day audit",
   periodDays:DAYS,seeds,years:configs.map(x=>x.year),pcOptions:pcChoices,
   initialCash:ENDOWMENT,openingHourlyPrice:2.5,
   scope:"Game simulation; 3 base PCs, one/two upgraded; paired runs with/without only the requested advanced license.",
   caution:"GPU/Windows/platform, rent, energy and service costs included in net; no real-world profitability claim.",
   scenarios:results,summary:summaries};
  writeFileSync(new URL("gpu-license-90-day.json",dir),JSON.stringify(report,null,2)+"\n");
  console.log("GPU_LICENSE_REPORT saved out/audits/gpu-license-90-day.json");
 }
});
