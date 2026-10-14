import assert from "node:assert/strict";
import test from "node:test";
import { createGame, stepGame, canCustomerOccupy } from "../dist/js/sim/engine.js";
import { counterQueueSlot, counterQueueCustomers, queueSlotsAreSeparated,
  MAX_COUNTER_QUEUE, CUSTOMER_COLLISION_RADIUS } from "../dist/js/sim/checkoutQueue.js";

function visitor(id,stage="waiting",location=counterQueueSlot(id-1)){
  return {id,stage,x:location.x,y:location.y,target:{...location},route:[],
    costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
}
test("lugares da fila são separados, do caixa ao corredor",()=>{
  assert.equal(queueSlotsAreSeparated(),true);
  for(let i=1;i<MAX_COUNTER_QUEUE;i++){
    const a=counterQueueSlot(i-1),b=counterQueueSlot(i);
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=CUSTOMER_COLLISION_RADIUS+0.18);
  }
  assert.deepEqual(counterQueueSlot(0),{x:1.55,y:2.56});
});
test("caixa atende pela ordem, nunca todos de uma vez",()=>{
  const s=createGame(20);
  s.customers=[visitor(2,"waiting",counterQueueSlot(1)),visitor(1,"waiting",counterQueueSlot(0))];
  stepGame(s,1);
  assert.equal(s.served,1);
  assert.equal(s.customers.find(c=>c.id===1).stage,"to_pc");
  assert.equal(s.customers.find(c=>c.id===2).pcIndex,null);
  assert.equal(s.revenue,9);
  assert.ok(s.counterBusyUntil>s.totalMinutes);
  assert.equal(counterQueueCustomers(s)[0]?.id,2);
  stepGame(s,1);
  assert.equal(s.served,1,"o atendimento do caixa não deve ser simultâneo");
});
test("fila se reorganiza quando o caixa libera um lugar",()=>{
  const s=createGame(21);
  s.customers=[visitor(1),visitor(2),visitor(3)];
  stepGame(s,1);
  assert.equal(s.served,1);
  stepGame(s,1);
  const second=s.customers.find(c=>c.id===2);
  const third=s.customers.find(c=>c.id===3);
  assert.equal(second.queueIndex,0);
  assert.equal(third.queueIndex,1);
  assert.deepEqual(second.target,counterQueueSlot(0));
  assert.deepEqual(third.target,counterQueueSlot(1));
  assert.ok(Math.hypot(second.x-third.x,second.y-third.y)>=CUSTOMER_COLLISION_RADIUS-1e-5);
});
test("colisão bloqueia atravessar outro personagem",()=>{
  const s=createGame();
  const a=visitor(1,"arriving",{x:3,y:4});
  const b=visitor(2,"waiting",{x:3.3,y:4});
  s.customers=[a,b];
  assert.equal(canCustomerOccupy(s,a,{x:3.2,y:4}),false);
  assert.equal(canCustomerOccupy(s,a,{x:2.8,y:4}),true);
});
test("contrato de fila funciona em saves legados",async()=>{
  const {serializeSave,parseImportedSave}=await import("../dist/js/sim/saveTransfer.js");
  const s=createGame();
  assert.equal(s.counterBusyUntil,undefined);
  assert.equal(parseImportedSave(serializeSave(s)).counterBusyUntil,undefined);
  const s2=createGame();
  s2.customers=[visitor(1),visitor(2)];
  stepGame(s2,1);
  assert.equal(parseImportedSave(serializeSave(s2)).counterBusyUntil,s2.counterBusyUntil);
});
test("cliente na fila não gera receita antes de pagar",()=>{
  const s=createGame(13);
  s.customers=[visitor(1),visitor(2),visitor(3)];
  stepGame(s,1);
  assert.equal(s.paymentEffects.length,1);
  assert.equal(s.revenue,9);
  assert.ok(s.customers.slice(1).every(c=>c.pcIndex===null));
});
