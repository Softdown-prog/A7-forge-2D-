import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,pcCount,pcWear} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames,contractSupplier,upgradeComputer,upgradeInternet,expandShop,stockItem,wholesaleCost,setHourlyPrice} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";

/** Auditoria determinística, sem receita inventada ou compras de fachada.
 * Preços fixos durante seis meses; manutenção, estoque e contas pelos serviços do jogo.
 * Na comparação 2009, upgrade só altera tier/GPU, não conexão nem tamanho. */
const INITIAL=16000,DAYS=180,SEED=1933;
function runScenario(year,price,upgraded){
 const s=createGame(SEED);
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=INITIAL;
 const doIt=(r)=>assert.equal(r.ok,true,r.message);
 doIt(setHourlyPrice(s,price));doIt(licenseGames(s));doIt(hireContentProgrammer(s));
 doIt(contractSupplier(s));
 if(year===2009){
  doIt(expandShop(s));
  doIt(buyComputer(s));doIt(buyComputer(s));
  doIt(upgradeInternet(s));doIt(upgradeInternet(s));
 }
 for(let i=0;i<pcCount(s);i++)doIt(licenseWindows(s,i,"win98"));
 if(upgraded){
  assert.equal(year,2009);
  for(let i=0;i<3;i++)doIt(upgradeComputer(s,i));
  for(let i=0;i<2;i++)doIt(buyGpu(s,i,"gpu09"));
 }
 const installationCost=s.expenses;
 let vipSamples=0,allSamples=0,occupied=0,available=0;
 for(let day=1;day<=DAYS;day++){
  for(const item of ["soda","candy","snacks"])
   if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))stockItem(s,item);
  for(let i=0;i<pcCount(s);i++){
   if(pcWear(s,i)>=75&&!s.repairJobs?.some(j=>j.pc===i)&&
     !s.customers.some(c=>c.pcIndex===i&&["using","to_pc","sitting","standing"].includes(c.stage)))
     startRepair(s,i);
  }
  if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=55)requestCleaning(s);
  for(let j=0;j<6;j++){
   stepGame(s,120);
   if(j===3){
    vipSamples+=s.customers.filter(c=>c.vip).length;
    allSamples+=s.customers.length;
    occupied+=s.customers.filter(c=>c.stage==="using").length;
    available+=pcCount(s);
   }
  }
  if(day%30===0){
   assert.equal(s.cash,INITIAL+s.revenue-s.expenses,"balanço de caixa após dia "+day);
   assert.ok(s.reputation>=10&&s.reputation<=100);
   assert.ok(s.customers.length<=14);
   assert.ok(Number.isFinite(s.energyAccrued)&&s.energyAccrued>=0);
  }
 }
 const row={year,price,upgraded,pcs:pcCount(s),initialInvestment:installationCost,
  served:s.served,lost:s.lostCustomers,reputation:+s.reputation.toFixed(2),
  revenue:s.revenue,operatingExpenses:s.expenses-installationCost,
  operatingResult:s.revenue-(s.expenses-installationCost),
  netProfit:s.cash-INITIAL,cash:s.cash,
  vipShare:+(100*vipSamples/Math.max(1,allSamples)).toFixed(1),
  sampledPcUse:+(100*occupied/Math.max(1,available)).toFixed(1)};
 return row;
}
test("tarifas 12/18/20/22/24 em 1998 e 18/22/24 em 2009 com hardware básico e premium",()=>{
 const rows=[];
 for(const price of [12,18,20,22,24])rows.push(runScenario(1998,price,false));
 for(const price of [18,22,24])for(const upgraded of [false,true])
  rows.push(runScenario(2009,price,upgraded));
 assert.equal(rows.length,11);
 assert.ok(rows.every(x=>x.served>20&&x.revenue>0));
 assert.ok(rows.every(x=>x.cash===INITIAL+x.netProfit));
 assert.ok(rows.every(x=>x.sampledPcUse>=0&&x.sampledPcUse<=100));
 assert.ok(rows.find(x=>x.year===1998&&x.price===12).served>rows.find(x=>x.year===1998&&x.price===24).served);
 for(const price of [18,22,24]){
  const basic=rows.find(x=>x.year===2009&&x.price===price&&!x.upgraded);
  const premium=rows.find(x=>x.year===2009&&x.price===price&&x.upgraded);
  assert.equal(basic.pcs,premium.pcs);
  assert.ok(premium.initialInvestment>basic.initialInvestment);
 }
 for(const row of rows)console.log("PRICE_CAMPAIGN "+JSON.stringify(row));
});
