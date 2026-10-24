import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,entrance,isValidSave,EXIT_REACH_DISTANCE} from "../dist/js/sim/engine.js";
import {moveLayoutObject,editableObjects,objectRect,objectTouchesCustomer} from "../dist/js/sim/editableObjects.js";
import {placeFurniture,relocateFurniture,rotateFurniture,removeFurniture} from "../dist/js/sim/shop.js";
import {retailQueueSlots,refreshRetailQueues,activeRetailQueuesReachable} from "../dist/js/sim/retailQueue.js";
import {counterQueueSlot,CUSTOMER_COLLISION_RADIUS} from "../dist/js/sim/checkoutQueue.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {serializeSave,parseImportedSave,snapshotGameState} from "../dist/js/sim/saveTransfer.js";

const npc=(id,x,y,stage,extra={})=>({
 id,x,y,stage,pcIndex:null,target:{x,y},route:[],costume:"regular",
 happy:true,usedMinutes:0,waitingMinutes:0,offlineWait:0,wallet:40,
 needs:{hunger:50,thirst:50,energy:70},...extra
});
const reload=s=>parseImportedSave(serializeSave(s));
function check(s){
 assert.equal(isValidSave(s),true,"save válido após a edição");
 assert.equal(activeRetailQueuesReachable(s),true,"filas atuais alcançáveis");
 for(const item of ["soda","candy","snacks"]){
  const line=s.customers.filter(c=>c.stage==="shopping"&&(c.desiredItem??"soda")===item).sort((a,b)=>a.id-b.id);
  const slots=retailQueueSlots(s,item);
  assert.ok(slots.length>=line.length);
  for(const [i,c] of line.entries()){
   assert.equal(c.retailQueueItem,item,"produto de cada comprador preservado");
   assert.equal(c.retailQueueIndex,i,"FIFO mantida depois do reload");
   const goal=c.route.at(-1)??c.target;
   assert.ok(Math.hypot(goal.x-slots[i].x,goal.y-slots[i].y)<.02,
    "destino atualizado para o lugar da fila de "+item);
  }
 }
}
function busy(seed){
 const s=createGame(seed);s.cash=20000;s.reputation=10;s.pricePerHour=40;
 s.inventory={soda:70,candy:70,snacks:70};s.nextCustomerId=100;
 const waiting=Array.from({length:4},(_,i)=>{
  const p=counterQueueSlot(i,s);return npc(i+1,p.x,p.y,"waiting",{queueIndex:i});
 });
 const shoppers=[
  ...Array.from({length:3},(_,i)=>npc(i+5,3+i*.6,3.4,"shopping",{desiredItem:"soda"})),
  ...Array.from({length:3},(_,i)=>npc(i+8,3+i*.6,4.05,"shopping",{desiredItem:"candy"})),
  ...Array.from({length:3},(_,i)=>npc(i+11,3+i*.6,4.75,"shopping",{desiredItem:"snacks"}))
 ];
 s.customers=[...waiting,...shoppers,npc(14,6.3,5.35,"leaving",{target:entrance(s)})];
 refreshRetailQueues(s);check(s);return s;
}
function stepAndVerify(s){
 const before=new Map(s.customers.map(c=>[c.id,{x:c.x,y:c.y,ref:c}]));
 stepGame(s,1);
 for(const [id,b] of before){
  const c=b.ref;
  assert.ok(Math.hypot(c.x-b.x,c.y-b.y)<=.55,"sem teleporte: "+id);
  assert.ok(canTraverseLocalStep(s,b,c),"sem atravessar divisórias: "+id);
  if(!s.customers.some(p=>p.id===id)){
   assert.equal(c.stage,"leaving");
   assert.ok(Math.hypot(c.x-entrance(s).x,c.y-entrance(s).y)<=EXIT_REACH_DISTANCE);
  }
 }
 for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++){
  const a=s.customers[i],b=s.customers[j];
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=CUSTOMER_COLLISION_RADIUS-1e-6,
   "colisão entre "+a.id+" e "+b.id);
 }
}
test("móvel reposicionado com cliente no destino é recusado sem alterar o save",()=>{
 const s=createGame(9301);s.cash=20000;
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 const target={...s,furniturePlacements:[{kind:"table",slotId:"floor-4",rotation:0}]};
 const obj=editableObjects(target).find(o=>o.id==="decor:floor-4");
 assert.ok(obj,"mesa colocada no destino de teste");
 const r=objectRect(obj);
 s.customers=[npc(99,r.minX-.2,(r.minY+r.maxY)/2,"leaving",{target:entrance(s)})];
 const before=JSON.stringify(s);
 const denied=relocateFurniture(s,"floor-2","floor-4");
 assert.equal(denied.ok,false,denied.message);
 assert.equal(JSON.stringify(s),before,"não cobrar nem modificar móvel, cliente ou rota");
 s.customers=[];
 assert.equal(relocateFurniture(s,"floor-2","floor-4").ok,true);
 assert.equal(editableObjects(s).some(o=>o.id==="decor:floor-4"),true);
 assert.equal(isValidSave(s),true);
});
test("giro com cliente perto da nova borda é recusado sem alterar a partida",()=>{
 const s=createGame(9303);s.cash=20000;
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 const current=editableObjects(s).find(o=>o.id==="decor:floor-2");
 const rotated={...current,rotation:1};
 let position;
 for(let dy=-.75;dy<=.75&&!position;dy+=.025)for(let dx=-.75;dx<=.75;dx+=.025){
  const p={x:current.x+dx,y:current.y+dy};
  if(!objectTouchesCustomer(current,p)&&objectTouchesCustomer(rotated,p)){
   position=p;break;
  }
 }
 assert.ok(position,"girar altera a área efetiva da mesa");
 s.customers=[npc(33,position.x,position.y,"leaving",{target:entrance(s)})];
 const before=JSON.stringify(s);
 const denied=rotateFurniture(s,"floor-2");
 assert.equal(denied.ok,false,denied.message);
 assert.equal(JSON.stringify(s),before,"sem movimento, cobrança ou alteração de pose");
 s.customers=[];
 assert.equal(rotateFurniture(s,"floor-2").ok,true);
 assert.equal(isValidSave(reload(s)),true);
});
test("girar e realocar mesa quatro vezes é estável entre salvamentos",()=>{
 let s=createGame(9302);s.cash=20000;
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 const afterPurchase={cash:s.cash,expenses:s.expenses,revenue:s.revenue};
 assert.equal(relocateFurniture(s,"floor-2","floor-4").ok,true);
 s=reload(s);
 for(let n=0;n<4;n++){
  const before=s.furniturePlacements.find(p=>p.slotId==="floor-4")?.rotation??0;
  const result=rotateFurniture(s,"floor-4");
  assert.equal(result.ok,true,result.message);
  assert.equal(s.furniturePlacements.find(p=>p.slotId==="floor-4")?.rotation,(before+1)%4);
  assert.deepEqual({cash:s.cash,expenses:s.expenses,revenue:s.revenue},afterPurchase,
   "girar não paga novamente pela mesa");
  s=reload(s);
 }
 assert.equal(relocateFurniture(s,"floor-4","floor-2").ok,true);
 assert.equal(removeFurniture(s,"floor-2").ok,true);
 assert.deepEqual({cash:s.cash,expenses:s.expenses,revenue:s.revenue},afterPurchase);
 assert.equal(s.furniture.table,0);
 assert.equal(isValidSave(reload(s)),true);
});
for(const seed of [1990,1991]){
 test("reorganizar diversas vezes com 14 clientes, salvar e continuar: seed "+seed,()=>{
  let s=busy(seed);
  const initialMoney={cash:s.cash,revenue:s.revenue,expenses:s.expenses};
  const initialProducts=new Map(s.customers.filter(c=>c.stage==="shopping").map(c=>[c.id,c.desiredItem]));
  const attempts=[
   {x:6,y:3,rotation:2},
   {x:6,y:3,rotation:3},
   {x:6,y:3,rotation:2}
  ];
  let accepted=0,rejected=0;
  for(const a of attempts){
   const previous=JSON.stringify(s);
   const result=moveLayoutObject(s,"soda",{x:a.x,y:a.y},a.rotation);
   if(result.ok){
    accepted++;check(s);
   }else{
    rejected++;
    assert.equal(JSON.stringify(s),previous,"não aplicar uma edição bloqueada");
   }
   s=reload(s);
   for(const [id,item] of initialProducts){
    const c=s.customers.find(c=>c.id===id);
    assert.equal(c.desiredItem,item,"save não troca o produto do cliente "+id);
   }
   check(s);
  }
  assert.ok(accepted>=1,"ao menos uma edição real foi aplicada");
  const restored=reload(s);
  for(let minute=0;minute<150;minute++){
   stepAndVerify(s);stepGame(restored,1);
  }
  assert.deepEqual(snapshotGameState(restored),snapshotGameState(s),
   "mesmo RNG, vendas e movimento depois das mudanças sucessivas");
  assert.ok(Math.abs(s.cash-initialMoney.cash-(s.revenue-initialMoney.revenue)+(s.expenses-initialMoney.expenses))<.001);
  assert.equal(s.customers.some(c=>c.id===14),false,"cliente saiu pela porta real");
  assert.equal(isValidSave(s),true);
 });
}
