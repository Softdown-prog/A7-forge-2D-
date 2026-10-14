import {withStationOff} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,pcCount,pcWear,chooseAvailablePc} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames,contractSupplier,upgradeComputer,upgradeInternet,expandShop,stockItem,wholesaleCost,setHourlyPrice,hardwareSatisfactionBonus} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {gameYear,licenseWindows} from "../dist/js/sim/era.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {COUNTER_QUEUE} from "../dist/js/sim/route.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

// Auditoria dos anos 2011/2013 com a MESMA disposição e conexão em cada par.
// Usa o motor minuto a minuto; nenhum cliente, receita ou reputação é fabricado.
const DAYS=120,INITIAL=26000,SEEDS=[23,137,72421],PRICES=[18,22,24];
function setup(year,price,seed,modern){
 const s=createGame(seed);
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=INITIAL;
 const act=r=>assert.equal(r.ok,true,r.message);
 act(setHourlyPrice(s,price));act(licenseGames(s));act(hireContentProgrammer(s));act(contractSupplier(s));
 act(expandShop(s));act(buyComputer(s));act(buyComputer(s));
 act(upgradeInternet(s));act(upgradeInternet(s));
 for(let i=0;i<pcCount(s);i++)act(withStationOff(s,i,()=>licenseWindows(s,i,"win98")));
 if(modern){
  // Placas atuais em PCs ao FUNDO: exercita alocação VIP sem mexer no layout.
  for(const i of [3,4]){
   act(withStationOff(s,i,()=>upgradeComputer(s,i)));act(withStationOff(s,i,()=>upgradeComputer(s,i)));
   act(withStationOff(s,i,()=>buyGpu(s,i,year===2011?"gpu11":"gpu13")));
  }
 }
 assert.equal(gameYear(s),year);
 assert.equal(s.cash,INITIAL-s.expenses);
 return {s,installation:s.expenses};
}
function sample(year,price,seed,modern,days=DAYS){
 const {s,installation}=setup(year,price,seed,modern);
 let vipAtNew=0,vipUsing=0,using=0,capacity=0,vipSeen=0,allSeen=0;
 for(let day=1;day<=days;day++){
  for(const item of ["soda","candy","snacks"]){
   if(s.inventory[item]<5&&s.cash>=wholesaleCost(s,item))stockItem(s,item);
  }
  for(let i=0;i<pcCount(s);i++){
   if(pcWear(s,i)>=75&&!s.repairJobs?.some(j=>j.pc===i)&&
      !s.customers.some(c=>c.pcIndex===i&&["to_pc","using","sitting","standing"].includes(c.stage)))
      startRepair(s,i);
  }
  if((s.binFill??[]).some(n=>n>=75)&&!s.cleaningJob&&s.cash>=55)requestCleaning(s);
  for(let part=0;part<6;part++){
   stepGame(s,120);
   if(part===3){
    const users=s.customers.filter(c=>c.stage==="using");
    using+=users.length;capacity+=pcCount(s);
    vipUsing+=users.filter(c=>c.vip).length;
    vipAtNew+=users.filter(c=>c.vip&&c.pcIndex>=3).length;
    vipSeen+=s.customers.filter(c=>c.vip).length;
    allSeen+=s.customers.length;
   }
  }
  if(day%30===0){
   assert.equal(s.cash,INITIAL+s.revenue-s.expenses,"conservação no dia "+day);
   assert.ok(s.reputation>=10&&s.reputation<=100,"reputação válida");
   assert.ok(s.customers.length<=14,"sem ultrapassar lotação");
   assert.ok(Number.isFinite(s.energyAccrued));
  }
 }
 return {year,price,seed,modern,gpu:modern?(year===2011?"gpu11":"gpu13"):"nenhuma",
  installation,served:s.served,lost:s.lostCustomers,
  reputation:+s.reputation.toFixed(2),revenue:s.revenue,
  operatingExpenses:s.expenses-installation,
  operatingMargin:s.revenue-(s.expenses-installation),
  netResult:s.cash-INITIAL,
  occupancy:+(100*using/Math.max(1,capacity)).toFixed(1),
  vipPercent:+(100*vipSeen/Math.max(1,allSeen)).toFixed(1),
  vipOnRearPcsPercent:+(100*vipAtNew/Math.max(1,vipUsing)).toFixed(1)};
}
test("2011 e 2013: três sementes, três preços e investimento real em GPUs",()=>{
 const rows=[];
 for(const year of [2011,2013])for(const seed of SEEDS)for(const price of PRICES)
  for(const modern of [false,true])rows.push(sample(year,price,seed,modern));
 assert.equal(rows.length,36);
 for(const row of rows){
  assert.ok(row.served>0,"sessões reais: "+JSON.stringify(row));
  assert.ok(row.revenue>0&&row.operatingExpenses>0);
  assert.ok(row.occupancy>=0&&row.occupancy<=100);
  assert.ok(row.vipOnRearPcsPercent>=0&&row.vipOnRearPcsPercent<=100);
 }
 for(const year of [2011,2013])for(const seed of SEEDS){
  const cheap=rows.find(x=>x.year===year&&x.seed===seed&&x.price===18&&!x.modern);
  const costly=rows.find(x=>x.year===year&&x.seed===seed&&x.price===24&&!x.modern);
  assert.ok(cheap.served>costly.served,"tarifa alta ainda reduz sessões");
  for(const price of PRICES){
   const base=rows.find(x=>x.year===year&&x.seed===seed&&x.price===price&&!x.modern);
   const upgraded=rows.find(x=>x.year===year&&x.seed===seed&&x.price===price&&x.modern);
   assert.equal(base.installation<upgraded.installation,true);
   assert.equal(base.gpu,"nenhuma");
  }
 }
 for(const row of rows)console.log("MODERN_PRICE_AUDIT "+JSON.stringify(row));
 const groups=[];
 for(const year of [2011,2013])for(const price of PRICES)for(const modern of [false,true]){
  const selection=rows.filter(x=>x.year===year&&x.price===price&&x.modern===modern);
  const mean=k=>+(selection.reduce((sum,x)=>sum+x[k],0)/selection.length).toFixed(2);
  groups.push({year,price,modern,meanServed:mean("served"),meanNet:mean("netResult"),
   meanReputation:mean("reputation"),meanVipOnRearPcs:mean("vipOnRearPcsPercent"),
   minNet:Math.min(...selection.map(x=>x.netResult)),maxNet:Math.max(...selection.map(x=>x.netResult))});
 }
 console.log("MODERN_PRICE_SUMMARY "+JSON.stringify(groups));
});
test("2013: GPUs modernas recuperam o investimento após doze meses?",()=>{
 const trials=[];
 for(const seed of SEEDS)for(const modern of [false,true])
  trials.push(sample(2013,24,seed,modern,360));
 assert.equal(trials.length,6);
 for(const seed of SEEDS){
  const base=trials.find(x=>x.seed===seed&&!x.modern);
  const improved=trials.find(x=>x.seed===seed&&x.modern);
  assert.equal(base.year,2013);assert.equal(improved.year,2013);
  assert.ok(improved.installation>base.installation);
  assert.ok(Number.isFinite(base.netResult)&&Number.isFinite(improved.netResult));
  assert.ok(improved.served>base.served,"PC moderno deve preservar ganho de atendimentos após 360 dias");
  assert.ok(improved.netResult>base.netResult,"receita adicional deve pagar os GPUs após um ano no cenário R$ 24/h");
 }
 console.log("MODERN_ANNUAL "+JSON.stringify(trials));
 const average=modern=>{
  const subset=trials.filter(x=>x.modern===modern);
  const calc=field=>+(subset.reduce((sum,x)=>sum+x[field],0)/subset.length).toFixed(2);
  return {modern,net:calc("netResult"),served:calc("served"),
   reputation:calc("reputation"),vipOnRearPcs:calc("vipOnRearPcsPercent")};
 };
 console.log("MODERN_ANNUAL_SUMMARY "+JSON.stringify([average(false),average(true)]));
});
test("cliente VIP encontra hardware 2013 na estação distante e escolha não altera estado",()=>{
 const {s}=setup(2013,24,1933,true);
 const c={id:901,x:COUNTER_QUEUE.x,y:COUNTER_QUEUE.y,stage:"waiting",
  target:{...COUNTER_QUEUE},route:[],costume:"regular",vip:true,
  pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
 const before=JSON.stringify(s);
 const chosen=chooseAvailablePc(s,c);
 assert.ok(chosen===3||chosen===4,"deve priorizar uma GPU nova alcançável");
 assert.ok(hardwareSatisfactionBonus(s,chosen)>hardwareSatisfactionBonus(s,0));
 assert.equal(JSON.stringify(s),before);
 const loaded=parseImportedSave(serializeSave(s));
 assert.equal(chooseAvailablePc(loaded,c),chosen,"save preserva escolha determinística");
});
