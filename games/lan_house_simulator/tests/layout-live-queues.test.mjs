import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,entrance,isValidSave,EXIT_REACH_DISTANCE} from "../dist/js/sim/engine.js";
import {moveLayoutObject} from "../dist/js/sim/editableObjects.js";
import {buildWall,canBuildWall} from "../dist/js/sim/walls.js";
import {retailQueueSlots,refreshRetailQueues,activeRetailQueuesReachable} from "../dist/js/sim/retailQueue.js";
import {counterQueueSlot,CUSTOMER_COLLISION_RADIUS} from "../dist/js/sim/checkoutQueue.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {serializeSave,parseImportedSave,snapshotGameState} from "../dist/js/sim/saveTransfer.js";

const npc=(id,x,y,stage,other={})=>({
 id,x,y,stage,pcIndex:null,target:{x,y},route:[],costume:"regular",
 happy:true,usedMinutes:0,waitingMinutes:0,offlineWait:0,wallet:40,
 needs:{hunger:50,thirst:50,energy:70},...other
});
function activeQueues(seed=1988){
 const s=createGame(seed);
 s.cash=20000;s.reputation=10;s.pricePerHour=40;
 s.inventory={soda:70,candy:70,snacks:70};s.nextCustomerId=100;
 const register=Array.from({length:4},(_,i)=>{
  const p=counterQueueSlot(i,s);
  return npc(i+1,p.x,p.y,"waiting",{queueIndex:i});
 });
 const products=[
  ...Array.from({length:3},(_,i)=>npc(5+i,3+i*.6,3.4,"shopping",{desiredItem:"soda"})),
  ...Array.from({length:3},(_,i)=>npc(8+i,3+i*.6,4.05,"shopping",{desiredItem:"candy"})),
  ...Array.from({length:3},(_,i)=>npc(11+i,3+i*.6,4.75,"shopping",{desiredItem:"snacks"}))
 ];
 s.customers=[...register,...products,npc(14,6.3,5.35,"leaving",{target:entrance(s)})];
 refreshRetailQueues(s);
 assert.equal(s.customers.length,14);
 assert.equal(activeRetailQueuesReachable(s),true);
 assert.equal(isValidSave(s),true);
 return s;
}
function checkStep(s){
 const prior=new Map(s.customers.map(c=>[c.id,{x:c.x,y:c.y,ref:c}]));
 stepGame(s,1);
 for(const [id,before] of prior){
  const c=before.ref;
  assert.ok(Math.hypot(c.x-before.x,c.y-before.y)<=.55,"sem teleporte: "+id);
  assert.equal(canTraverseLocalStep(s,before,c),true,"sem atravessar parede: "+id);
  if(!s.customers.some(p=>p.id===id)){
   assert.equal(c.stage,"leaving");
   assert.ok(Math.hypot(c.x-entrance(s).x,c.y-entrance(s).y)<=EXIT_REACH_DISTANCE);
  }
 }
 for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++){
  const a=s.customers[i],b=s.customers[j];
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=CUSTOMER_COLLISION_RADIUS-1e-6,
   "clientes não podem atravessar uns aos outros");
 }
}
test("mover refrigerante durante três filas conserva fila e destino de cada produto",()=>{
 const s=activeQueues();
 const candy=s.customers.find(c=>c.id===8),snack=s.customers.find(c=>c.id===11);
 const oldCandy={item:candy.retailQueueItem,index:candy.retailQueueIndex};
 const oldSnack={item:snack.retailQueueItem,index:snack.retailQueueIndex};
 const result=moveLayoutObject(s,"soda",{x:6,y:3},2);
 assert.equal(result.ok,true,result.message);
 assert.deepEqual({item:candy.retailQueueItem,index:candy.retailQueueIndex},oldCandy);
 assert.deepEqual({item:snack.retailQueueItem,index:snack.retailQueueIndex},oldSnack);
 for(const item of ["soda","candy","snacks"]){
  const line=s.customers.filter(c=>c.stage==="shopping"&&c.desiredItem===item).sort((a,b)=>a.id-b.id);
  const slots=retailQueueSlots(s,item);
  for(const [index,c] of line.entries()){
   const destination=c.route.at(-1)??c.target;
   assert.ok(Math.hypot(destination.x-slots[index].x,destination.y-slots[index].y)<.02,
    "comprador "+c.id+" deve manter seu lugar de "+item);
  }
 }
 assert.equal(activeRetailQueuesReachable(s),true);
 assert.equal(isValidSave(s),true);
});
test("obra rejeitada durante fila mantém caixa, compras, posições e save",()=>{
 const s=activeQueues(1989),before=JSON.stringify(s);
 const moving=moveLayoutObject(s,"counter",{x:3,y:3.4},1);
 assert.equal(moving.ok,false);
 assert.equal(JSON.stringify(s),before,"não alterar estado com balcão bloqueado");
 const wall={axis:"y",x:4,y:4};
 if(!canBuildWall(s,wall)){
  assert.equal(buildWall(s,wall).ok,false);
  assert.equal(JSON.stringify(s),before);
 }
 assert.equal(isValidSave(s),true);
});
test("14 clientes continuam vendas e saída reais após editar, salvar e recarregar",()=>{
 const s=activeQueues(1990);
 const moved=moveLayoutObject(s,"soda",{x:6,y:3},2);
 assert.equal(moved.ok,true,moved.message);
 const restored=parseImportedSave(serializeSave(s));
 const money={cash:s.cash,revenue:s.revenue,expenses:s.expenses};
 for(let minute=0;minute<140;minute++){
  checkStep(s);stepGame(restored,1);
  if(minute%25===0)assert.equal(isValidSave(s),true);
 }
 assert.deepEqual(JSON.parse(JSON.stringify(snapshotGameState(restored))),
  JSON.parse(JSON.stringify(snapshotGameState(s))),
  "save reproduz movimento, filas e receita");
 assert.ok(Math.abs((s.cash-money.cash)-(s.revenue-money.revenue)+(s.expenses-money.expenses))<.001);
 assert.equal(s.customers.some(c=>c.id===14),false,"cliente cruzou a porta");
 assert.equal(isValidSave(s),true);
});
