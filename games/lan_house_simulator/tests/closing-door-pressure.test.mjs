import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,entrance,isValidSave,EXIT_REACH_DISTANCE} from "../dist/js/sim/engine.js";
import {counterQueueSlot,CUSTOMER_COLLISION_RADIUS} from "../dist/js/sim/checkoutQueue.js";
import {computerSeat} from "../dist/js/sim/route.js";
import {pcPosition} from "../dist/js/sim/simulationState.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {sendHome} from "../dist/js/sim/customerFlow.js";
import {serializeSave,parseImportedSave,snapshotGameState} from "../dist/js/sim/saveTransfer.js";

const visitor=(id,x,y,stage,extra={})=>({
 id,x,y,stage,target:{x,y},route:[],pcIndex:null,
 costume:"regular",usedMinutes:0,waitingMinutes:0,offlineWait:0,
 happy:true,sessionMinutes:240,wallet:40,
 needs:{thirst:30,hunger:20,energy:75},...extra
});
function heavyClose(seed){
 const s=createGame(seed);
 s.totalMinutes=659; // 20h59; início do encerramento às 21h
 s.reputation=10;s.pricePerHour=40;s.nextCustomerId=100;
 s.customers=[
  ...Array.from({length:5},(_,i)=>{
   const p=counterQueueSlot(i,s);
   return visitor(i+1,p.x,p.y,"waiting",{queueIndex:i});
  }),
  ...Array.from({length:4},(_,i)=>
   visitor(i+6,3.3+i*.62,4.4,"shopping",
    {desiredItem:["soda","snacks","candy","soda"][i]})),
  ...Array.from({length:3},(_,i)=>{
   const p=computerSeat(pcPosition(i,s));
   return visitor(i+10,p.x,p.y,"using",{pcIndex:i});
  }),
  visitor(13,7.1,5.35,"arriving",{queueIndex:5}),
  visitor(14,7.5,4.80,"leaving",{target:entrance(s)})
 ];
 assert.equal(s.customers.length,14);
 for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++){
  const a=s.customers[i],b=s.customers[j];
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=CUSTOMER_COLLISION_RADIUS,
   "posições iniciais não podem se sobrepor");
 }
 assert.equal(isValidSave(s),true);
 return s;
}
function checkStep(s,removed,at){
 const old=new Map(s.customers.map(c=>[c.id,{x:c.x,y:c.y,ref:c}]));
 stepGame(s,1);
 const door=entrance(s);
 for(const [id,p] of old){
  const c=p.ref,moved=Math.hypot(c.x-p.x,c.y-p.y);
  assert.ok(moved<=.55,"NPC "+id+" não pode teleportar no minuto "+at+": "+moved);
  assert.ok(canTraverseLocalStep(s,p,c),"NPC "+id+" não atravessa parede");
  if(!s.customers.some(other=>other.id===id)){
   removed.add(id);
   assert.equal(c.stage,"leaving","somente NPC em saída pode desaparecer");
   assert.ok(Math.hypot(c.x-door.x,c.y-door.y)<=EXIT_REACH_DISTANCE,
    "NPC "+id+" deve atravessar fisicamente a soleira");
  }
 }
 for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++){
  const a=s.customers[i],b=s.customers[j];
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=CUSTOMER_COLLISION_RADIUS-1e-6,
   "colisão entre "+a.id+" e "+b.id+" no minuto "+at);
 }
}
for(const seed of [128,729]){
 test("14 NPCs no fechamento com filas, compras, 3 PCs e porta: seed "+seed,()=>{
  const s=heavyClose(seed),original=JSON.stringify(s),removed=new Set();
  const cash=s.cash,spent=s.expenses,earned=s.revenue,sales=s.purchases,served=s.served;
  let resumed;
  for(let minute=660;minute<720;minute++){
   checkStep(s,removed,minute);
   if(minute===675)resumed=parseImportedSave(serializeSave(s));
   else if(minute>675)stepGame(resumed,1);
   if(minute>=690)assert.ok(s.customers.every(c=>c.stage==="leaving"),
    "nenhum atendimento ativo depois das 21h30");
  }
  assert.equal(removed.size,14,"14 clientes devem cruzar a porta antes de 22h");
  assert.equal(s.customers.length,0,"não reter NPCs nem filas");
  assert.equal(s.totalMinutes,719);
  assert.equal(s.cash,cash);
  assert.equal(s.expenses,spent);
  assert.equal(s.revenue,earned);
  assert.equal(s.purchases,sales);
  assert.equal(s.served,served,"sem cobrar sessões fictícias");
  assert.equal(isValidSave(s),true);
  assert.deepEqual(JSON.parse(JSON.stringify(snapshotGameState(resumed))),
   JSON.parse(JSON.stringify(snapshotGameState(s))),
   "recuperar save intermediário não muda ordem de saída");
  assert.notEqual(JSON.stringify(s),original);
 });
}
test("fallback de saída nunca mantém alvo de compras quando a navegação fica isolada",()=>{
 const s=createGame(44),c=visitor(1,2.5,2.5,"shopping",
  {desiredItem:"soda",target:{x:3.2,y:4.5},route:[{x:3.5,y:4.5}]});
 // Parede contínua: impedir que o cálculo estático encontre rota até a porta.
 s.interiorWalls=Array.from({length:6},(_,y)=>({axis:"y",x:4,y}));
 s.customers=[c];
 sendHome(s,c);
 assert.equal(c.stage,"leaving");
 assert.deepEqual(c.target,entrance(s),"saída substitui destino antigo");
 assert.deepEqual(c.route,[]);
 assert.equal(c.nextCrowdRetryMinute,s.totalMinutes);
 assert.equal(s.purchases,0);
 assert.equal(isValidSave(s),true);
});
