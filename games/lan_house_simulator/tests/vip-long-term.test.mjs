import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,pcCount,pcWear} from "../dist/js/sim/engine.js";
import {vipArrivalEligible,vipReputationAdjustment,serviceReputationImpact} from "../dist/js/sim/vip.js";
import {licenseGames,setHourlyPrice,wholesaleCost,stockItem} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {hireContentProgrammer} from "../dist/js/sim/notices.js";
import {startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("tarifas abusivas geram avaliações negativas mesmo sem fila ou falha",async()=>{
 const {customerSatisfactionDelta}=await import("../dist/js/sim/economy.js");
 assert.ok(customerSatisfactionDelta(12,0,0)>0);
 assert.ok(customerSatisfactionDelta(18,0,0)>0);
 assert.ok(customerSatisfactionDelta(26,0,0)<0);
 assert.ok(customerSatisfactionDelta(26,0,0)<customerSatisfactionDelta(20,0,0));
});
test("preços até 18 mantêm a demanda original; excesso acima de 18 tem penalidade progressiva",async()=>{
 const {demandFactor}=await import("../dist/js/sim/economy.js");
 const former=(price)=>Math.max(.22,Math.min(1.65,1.2-(price-12)*.045));
 for(const price of [4,12,16,18])assert.ok(Math.abs(demandFactor(price,75,true,false)-former(price))<1e-10);
 assert.ok(demandFactor(26,75,true,false)<former(26)*.7);
 assert.ok(demandFactor(26,75,true,false)>demandFactor(40,75,true,false));
 assert.ok(demandFactor(26,75,true,false)>0);
});
test("reputação ganha menos perto do teto, mas avaliações negativas não são diluídas",()=>{
 const normal=serviceReputationImpact(75,12,0,.22);
 const high=serviceReputationImpact(94,12,0,.22);
 assert.equal(normal,.22);
 assert.ok(high>0&&high<normal*.3);
 assert.equal(serviceReputationImpact(98,12,0,.22),0);
 assert.equal(serviceReputationImpact(98,12,0,-.4),-.4);
 assert.equal(serviceReputationImpact(75,26,0,.22),.22);
 assert.equal(serviceReputationImpact(95,26,0,.22),0);
 assert.ok(serviceReputationImpact(94,26,.3,.22)>serviceReputationImpact(94,26,0,.22));
});
test("VIP exige preço compatível com a máquina e conserva tolerância aos atrasos",()=>{
 const c={vip:true,waitingMinutes:2,offlineWait:0};
 const fair=vipReputationAdjustment(c,0,12);
 const overpriced=vipReputationAdjustment(c,0,28);
 const premiumPc=vipReputationAdjustment(c,.25,28);
 assert.ok(overpriced<fair);
 assert.ok(premiumPc>overpriced,"hardware melhor justifica parte do preço");
 assert.ok(vipReputationAdjustment({...c,waitingMinutes:22},0,12)<fair);
 assert.ok(vipReputationAdjustment({...c,offlineWait:12},0,12)<fair);
 assert.equal(vipReputationAdjustment({...c,vip:false},0,28),0);
 const s=createGame();const rng=s.rng,revenue=s.revenue;
 for(let id=1;id<200;id++)vipArrivalEligible(s,id);
 assert.equal(s.rng,rng);assert.equal(s.revenue,revenue);
});
function campaign(hourly,seed,days=720){
 const s=createGame(seed),initial=12000;
 s.cash=initial;
 assert.equal(setHourlyPrice(s,hourly).ok,true);
 assert.equal(licenseGames(s).ok,true);
 assert.equal(hireContentProgrammer(s).ok,true);
 for(let pc=0;pc<pcCount(s);pc++)assert.equal(licenseWindows(s,pc,"win98").ok,true);
 let vipSamples=0,peopleSamples=0;
 const quarters=[];
 for(let day=1;day<=days;day++){
  for(const item of ["soda","candy","snacks"]){
   if(s.inventory[item]<6&&s.cash>=wholesaleCost(s,item))assert.equal(stockItem(s,item).ok,true);
  }
  for(let pc=0;pc<pcCount(s);pc++){
   if(pcWear(s,pc)>=70&&!s.repairJobs?.some(j=>j.pc===pc)&&
      !s.customers.some(c=>c.pcIndex===pc&&["to_pc","sitting","using","standing"].includes(c.stage)))
     startRepair(s,pc);
  }
  if((s.binFill??[]).some(v=>v>=75)&&!s.cleaningJob&&s.cash>=55)requestCleaning(s);
  for(let period=0;period<6;period++){
   stepGame(s,120);
   peopleSamples+=s.customers.length;
   vipSamples+=s.customers.filter(c=>c.vip).length;
  }
  if(day%30===0){
   assert.equal(s.cash,initial+s.revenue-s.expenses,"caixa dia "+day);
   assert.ok(s.reputation>=10&&s.reputation<=98.000001,"teto sustentável dia "+day);
   assert.ok(s.customers.length<=14);
   assert.ok(Number.isFinite(s.energyAccrued));
  }
  if(day%180===0)quarters.push({day,cash:s.cash,reputation:+s.reputation.toFixed(2),served:s.served,lost:s.lostCustomers});
 }
 return {hourly,seed,served:s.served,lost:s.lostCustomers,rep:+s.reputation.toFixed(2),
  cash:s.cash,revenue:s.revenue,expenses:s.expenses,
  vipShare:+(100*vipSamples/Math.max(1,peopleSamples)).toFixed(2),quarters};
}
test("dois anos de campanhas reais: preço justo conserva procura e reputação melhor que cobrança premium",()=>{
 // Duas campanhas de 720 dias, idênticas exceto preço/hora; a simulação
 // executa minuto a minuto pelo motor real e paga licenças, estoque e serviços.
 const fair=campaign(12,1933),premium=campaign(26,1933);
 console.log("VIP_TWO_YEARS "+JSON.stringify({fair,premium}));
 assert.ok(fair.served>premium.served,"preço alto deve reduzir atendimentos");
 assert.ok(fair.rep>premium.rep,"tarifa premium sem máquinas melhores não deve produzir prestígio maior");
 assert.ok(fair.cash>premium.cash,"preço excessivo não deve ser a estratégia mais rentável no teste de 2 anos");
 assert.ok(fair.vipShare>=premium.vipShare);
 assert.ok(fair.served>0&&premium.served>0);
});
test("perfil VIP e reputação preservam saves antigos sem campos adicionais",()=>{
 const s=createGame();s.customers=[{id:1,x:1,y:1,target:{x:1,y:1},stage:"using",costume:"regular",pcIndex:0,usedMinutes:1,waitingMinutes:0,offlineWait:0,happy:true,vip:true}];
 const loaded=parseImportedSave(serializeSave(s));
 assert.equal(loaded.customers[0].vip,true);
 delete s.customers[0].vip;
 assert.equal(parseImportedSave(serializeSave(s)).customers[0].vip,undefined);
});
