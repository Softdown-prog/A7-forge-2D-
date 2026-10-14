import test from "node:test";
import assert from "node:assert/strict";
import {createGame,chooseAvailablePc,stepGame,pcWear} from "../dist/js/sim/engine.js";
import {upgradeComputer,hardwareSatisfactionBonus} from "../dist/js/sim/economy.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {COUNTER_QUEUE} from "../dist/js/sim/route.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function waiting(id=7,vip=false){
 return {id,x:COUNTER_QUEUE.x,y:COUNTER_QUEUE.y,stage:"waiting",
 target:{...COUNTER_QUEUE},route:[],costume:"regular",vip,pcIndex:null,
 usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
}
test("sem upgrades, mantém a escolha do PC mais próximo sem cobrar ou alterar RNG",()=>{
 const s=createGame(17),c=waiting(),before={cash:s.cash,revenue:s.revenue,rng:s.rng};
 assert.equal(chooseAvailablePc(s,c),0);
 assert.equal(chooseAvailablePc(s,c),0);
 assert.deepEqual({cash:s.cash,revenue:s.revenue,rng:s.rng},before);
});
test("desgaste parcial não manda clientes para máquinas distantes sem upgrade",()=>{
 const s=createGame(),c=waiting();
 s.pcWear=[88,0,0];
 assert.equal(chooseAvailablePc(s,c),0);
 s.pcWear[0]=100;
 assert.equal(chooseAvailablePc(s,c),1);
});
test("VIP prefere PC 3 atualizado, mesmo que esteja mais distante",()=>{
 const s=createGame();s.cash=10000;s.totalMinutes=5*360*DAY_MINUTES;
 const c=waiting(7,true);
 assert.equal(chooseAvailablePc(s,c),0);
 assert.equal(upgradeComputer(s,2).ok,true);
 assert.equal(chooseAvailablePc(s,c),2);
 assert.ok(hardwareSatisfactionBonus(s,2)>hardwareSatisfactionBonus(s,0));
 const afterPurchase=s.cash,expenses=s.expenses,revenue=s.revenue;
 s.customers.push(c);
 stepGame(s,1);
 assert.equal(c.pcIndex,2,"a escolha tem de valer no atendimento real");
 assert.equal(c.stage,"to_pc");
 assert.equal(s.revenue,revenue+Math.round(s.pricePerHour*(c.sessionMinutes??45)/60));
 assert.equal(s.cash,afterPurchase+s.revenue-revenue);
 assert.equal(s.expenses,expenses);
});
test("GPU melhor em outro PC participa da escolha; preferências VIP permanecem determinísticas",()=>{
 const s=createGame();s.cash=10000;s.totalMinutes=11*360*DAY_MINUTES;
 assert.equal(buyGpu(s,2,"gpu09").ok,true);
 const normal=waiting(8),vip=waiting(9,true);
 assert.equal(chooseAvailablePc(s,normal),0,"cliente comum escolhe a estação próxima");
 assert.equal(chooseAvailablePc(s,vip),2,"VIP escolhe a melhor placa");
 const snapshot=parseImportedSave(serializeSave(s));
 assert.equal(chooseAvailablePc(snapshot,vip),2);
});
test("não atribui PC reservado, quebrado ou em reparo",()=>{
 const s=createGame();
 s.pcWear=[100,0,0];
 s.customers=[{...waiting(1),stage:"using",pcIndex:1}];
 assert.equal(chooseAvailablePc(s,waiting(2)),2);
 s.repairJobs=[{pc:2,x:7.5,y:5.35,phase:"arriving",progress:0,duration:24}];
 assert.equal(chooseAvailablePc(s,waiting(3)),undefined);
 assert.equal(pcWear(s,0),100);
});
test("sem PC acessível não cobra atendimento e mantém espera",()=>{
 const s=createGame();s.pcWear=[100,100,100];
 const c=waiting();s.customers.push(c);
 const before={cash:s.cash,revenue:s.revenue,served:s.served};
 stepGame(s,1);
 assert.equal(c.pcIndex,null);
 assert.equal(c.stage,"waiting");
 assert.ok(c.waitingMinutes>=1);
 assert.deepEqual({cash:s.cash,revenue:s.revenue,served:s.served},before);
});
