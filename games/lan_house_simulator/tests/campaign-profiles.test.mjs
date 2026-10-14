import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,pcCount,pcWear} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {expandShop,upgradeComputer,upgradeInternet,licenseGames,contractSupplier,stockItem,wholesaleCost} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {chooseDecision,decisionOptions} from "../dist/js/sim/decisions.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";

const SEEDS=[23,137,72421],DAYS=45,START_CAPITAL=16000;
/** Comparacao no mesmo ano (2009), com capital inicial declarado. Compras usam
 * exclusivamente as APIs reais do jogo; capital inicial nao entra em receita. */
function setup(size,seed){
 const s=createGame(seed);
 s.totalMinutes=11*360*DAY_MINUTES;
 s.cash=START_CAPITAL;
 const action=(result)=>assert.equal(result.ok,true,result.message);
 action(licenseGames(s));action(hireContentProgrammer(s));action(contractSupplier(s));
 const extra={pequena:0,media:2,grande:4}[size];
 for(let i=0;i<extra/2;i++)action(expandShop(s));
 for(let i=0;i<extra;i++)action(buyComputer(s));
 for(let i=0;i<pcCount(s);i++)action(licenseWindows(s,i,"win98"));
 if(size!=="pequena"){
  action(upgradeInternet(s));
  for(let i=0;i<Math.min(2,pcCount(s));i++)action(upgradeComputer(s,i));
 }
 if(size==="grande"){
  action(upgradeInternet(s));
  for(let i=0;i<pcCount(s);i++) {
   if((s.pcTiers?.[i]??1)<2)action(upgradeComputer(s,i));
   if(i<3)action(upgradeComputer(s,i));
  }
  for(let i=0;i<3;i++)action(buyGpu(s,i,"gpu09"));
 }
 assert.equal(pcCount(s),3+extra);
 assert.equal(s.cash,START_CAPITAL-s.expenses);
 return {s,setupExpenses:s.expenses};
}
function manage(s){
 for(const item of ["soda","candy","snacks"]){
  if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))stockItem(s,item);
 }
 for(let i=0;i<pcCount(s);i++){
  if(pcWear(s,i)>=80&&!s.repairJobs?.some(j=>j.pc===i)&&
      !s.customers.some(c=>c.pcIndex===i&&["using","to_pc","sitting","standing"].includes(c.stage))){
   startRepair(s,i);
  }
 }
 if((s.binFill??[]).some(x=>x>=75)&&!s.cleaningJob&&s.cash>=55)requestCleaning(s);
 for(const n of s.notices??[]){
  if(n.resolved||!decisionOptions(n.id).length)continue;
  const options=decisionOptions(n.id);
  // Financeiramente prudente: nao fabricar receitas, usa as acoes do jogo.
  const choice=n.id==="school-booking"?"school-accept":
    n.id==="gaming-tournament"?"tournament-small":
    n.id==="supplier-offer"&&s.inventory.soda<20?"supplier-accept":
    n.id==="equipment-fault"&&s.pcWear?.some(w=>w>25)?"fault-basic":
    options.at(-1).id;
  const selected=options.find(o=>o.id===choice);
  if(selected&&s.cash>=selected.cost)assert.equal(chooseDecision(s,n.id,choice).ok,true);
 }
}
function runProfile(size,seed){
 const {s,setupExpenses}=setup(size,seed);
 let used=0,capacity=0,readings=0, vipSamples=0,arrivingSamples=0,waitingSamples=0,toPcSamples=0,leavingSamples=0,totalPeople=0;
 const intervals=[];
 for(let day=1;day<=DAYS;day++){
  manage(s);
  for(let minute=0;minute<DAY_MINUTES;minute++){
   stepGame(s,1);
   if(minute%10===0){
    const occupied=s.customers.filter(c=>c.stage==="using").length;
    assert.ok(occupied<=pcCount(s),"ocupacao nao excede assentos");
    used+=occupied;capacity+=pcCount(s);readings++;
    vipSamples+=s.customers.filter(c=>c.vip&&c.stage==="using").length;
    arrivingSamples+=s.customers.filter(c=>c.stage==="arriving").length;
    waitingSamples+=s.customers.filter(c=>c.stage==="waiting").length;
    toPcSamples+=s.customers.filter(c=>c.stage==="to_pc").length;
    leavingSamples+=s.customers.filter(c=>c.stage==="leaving").length;
    totalPeople+=s.customers.length;
   }
  }
  assert.equal(s.cash,START_CAPITAL+s.revenue-s.expenses,"conservacao do caixa");
  assert.ok(s.reputation>=10&&s.reputation<=100);
  assert.ok(Number.isFinite(s.cash)&&Number.isFinite(s.energyAccrued));
  if(day%15===0)intervals.push({day,cash:Math.round(s.cash),reputation:+s.reputation.toFixed(1),served:s.served,lost:s.lostCustomers,operatingMargin:Math.round(s.revenue-(s.expenses-setupExpenses))});
 }
 return {size,seed,pcs:pcCount(s),setupExpenses,
  revenue:s.revenue,operatingExpenses:s.expenses-setupExpenses,
  operatingMargin:s.revenue-(s.expenses-setupExpenses),cash:s.cash,
  occupancy:+(100*used/capacity).toFixed(2),vipSeatPercent:+(100*vipSamples/Math.max(1,used)).toFixed(2),
  served:s.served,lost:s.lostCustomers,reputation:+s.reputation.toFixed(1),
  avgArriving:+(arrivingSamples/readings).toFixed(2),avgWaiting:+(waitingSamples/readings).toFixed(2),avgToPc:+(toPcSamples/readings).toFixed(2),avgLeaving:+(leavingSamples/readings).toFixed(2),avgPeople:+(totalPeople/readings).toFixed(2),
  repairs:s.pcWear?.filter(w=>w>=80).length??0,intervals};
}
test("campanhas pequena/media/grande 2009: 3 sementes, 45 dias, compras e manutencao reais",()=>{
 const rows=[];
 for(const size of ["pequena","media","grande"])for(const seed of SEEDS)rows.push(runProfile(size,seed));
 assert.equal(rows.length,9);
 assert.ok(rows.every(r=>r.served>0));
 assert.ok(rows.every(r=>r.occupancy>=0&&r.occupancy<=100));
 assert.ok(rows.every(r=>r.operatingExpenses>0));
 for(const size of ["pequena","media","grande"]){
  const group=rows.filter(r=>r.size===size);
  const mean=(field)=>+(group.reduce((sum,r)=>sum+r[field],0)/group.length).toFixed(2);
  console.log("BALANCE_PROFILE "+JSON.stringify({size,pcs:group[0].pcs,investment:group[0].setupExpenses,margin:mean("operatingMargin"),revenue:mean("revenue"),expenses:mean("operatingExpenses"),occupancy:mean("occupancy"),served:mean("served"),lost:mean("lost"),reputation:mean("reputation"),arriving:mean("avgArriving"),waiting:mean("avgWaiting"),toPc:mean("avgToPc"),leaving:mean("avgLeaving"),people:mean("avgPeople"),vipShare:mean("vipSeatPercent"),cash:mean("cash"),intervals:group.map(x=>({seed:x.seed,history:x.intervals}))}));
 }
});
