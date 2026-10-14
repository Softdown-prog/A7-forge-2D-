import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {canTraverseLocalStep,navigableRoute} from "../dist/js/sim/navigation.js";
import {COUNTER_QUEUE} from "../dist/js/sim/route.js";

const fake=(id,stage,x,y,target={x,y})=>({
 id,stage,x,y,target,route:[],costume:"regular",pcIndex:stage==="using"?0:null,
 usedMinutes:0,sessionMinutes:300,waitingMinutes:0,offlineWait:0,happy:true
});
test("subpasso rejeita atravessar divisórias nas duas orientações",()=>{
 const s=createGame();
 s.interiorWalls=[{axis:"y",x:3,y:2},{axis:"x",x:4,y:3}];
 assert.equal(canTraverseLocalStep(s,{x:2.75,y:2.5},{x:3.25,y:2.5}),false);
 assert.equal(canTraverseLocalStep(s,{x:4.5,y:2.75},{x:4.5,y:3.25}),false);
 assert.equal(canTraverseLocalStep(s,{x:2.5,y:2.5},{x:2.5,y:3.2}),true);
 assert.equal(canTraverseLocalStep(s,{x:2.5,y:2.5},{x:100,y:2.5}),false);
});
test("portas permitem cruzar o mesmo segmento sem remover paredes adjacentes",()=>{
 const s=createGame();s.interiorWalls=[{axis:"y",x:3,y:2},{axis:"y",x:3,y:3}];
 const from={x:2.75,y:2.5},to={x:3.25,y:2.5};
 assert.equal(canTraverseLocalStep(s,from,to),false);
 s.interiorDoors=[{axis:"y",x:3,y:2}];
 assert.equal(canTraverseLocalStep(s,from,to),true);
 assert.equal(canTraverseLocalStep(s,{x:2.75,y:3.5},{x:3.25,y:3.5}),false);
 assert.ok(navigableRoute(s,from,to));
});
test("cliente evita outro cliente mesmo quando há uma divisória longe da fila",()=>{
 const s=createGame();
 s.roomExtensions={west:0,east:0,south:0,north:1};
 s.interiorWalls=[{axis:"x",x:1,y:-1}];
 const incoming=fake(1,"arriving",COUNTER_QUEUE.x,3.65,{...COUNTER_QUEUE});
 incoming.queueIndex=0;
 const blocker=fake(2,"using",COUNTER_QUEUE.x,3.15);
 s.customers=[incoming,blocker];
 stepGame(s,1);
 assert.notEqual(incoming.x,COUNTER_QUEUE.x,"desvio deve ser permitido mesmo com outra sala dividida");
 assert.ok(incoming.y<3.65);
 assert.ok(Math.hypot(incoming.x-blocker.x,incoming.y-blocker.y)>.43);
});
test("cliente não atravessa parede ao caminhar rumo a um waypoint obsoleto",()=>{
 const s=createGame();
 s.interiorWalls=[{axis:"y",x:3,y:2}];
 const incoming=fake(7,"to_pc",2.78,2.5,{x:3.4,y:2.5});
 incoming.pcIndex=2;
 s.customers=[incoming];
 stepGame(s,4);
 assert.ok(incoming.x<3,"subpassos devem parar na divisória fechada");
 assert.ok(Math.hypot(incoming.x-2.78,incoming.y-2.5)>0.01,"pode recuar para contornar a divisória");
});
test("salas com três portas, fila cheia e quatro anexos mantêm circulação por seis horas",async()=>{
 const {circulationScenario}=await import("../scripts/circulation_scenario.mjs");
 for(const seed of [20,1998,72421]){
  const s=circulationScenario(seed),used=new Set(),exited=new Set();
  const initialCash=s.cash,initialRevenue=s.revenue,initialExpenses=s.expenses;
  let peak=0;
  for(let minute=0;minute<360;minute++){
   const before=new Map(s.customers.map(c=>[c.id,{x:c.x,y:c.y}]));
   stepGame(s,1);peak=Math.max(peak,s.customers.length);
   for(const id of before.keys())if(!s.customers.some(c=>c.id===id))exited.add(id);
   for(const c of s.customers){
    if(c.stage==="using")used.add(c.pcIndex);
    const p=before.get(c.id);
    if(p)assert.equal(canTraverseLocalStep(s,p,c),true,"deslocamento não atravessa parede fechada");
   }
   for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++){
    const a=s.customers[i],b=s.customers[j];
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=.43-1e-6,"corpos não se sobrepõem, inclusive na entrada");
   }
   assert.equal(s.cash,initialCash+s.revenue-initialRevenue-(s.expenses-initialExpenses));
  }
  assert.deepEqual([...used].sort(),[3,4,5,6]);
  assert.ok(peak>=12,"exercitar alta lotação");
  assert.ok(s.served>=12,"fila deve continuar avançando após as primeiras reservas");
  assert.ok(exited.size>=15,"clientes precisam concluir compras e sair pela porta");
  assert.ok(s.purchases>=5);
 }
});
test("emendas, quinas e fim de subpasso não abrem brechas na divisória",()=>{
 for(const axis of ["x","y"]){
  const s=createGame();
  s.interiorWalls=axis==="y"?[{axis,x:3,y:2},{axis,x:3,y:3}]:
    [{axis,x:2,y:3},{axis,x:3,y:3}];
  const point=(normal,tangent)=>axis==="y"?{x:normal,y:tangent}:{x:tangent,y:normal};
  for(const tangent of [2,2.5,3,3.5,4]){
   assert.equal(canTraverseLocalStep(s,point(2.9,tangent),point(3.1,tangent)),false);
   assert.equal(canTraverseLocalStep(s,point(2.9,tangent),point(3,tangent)),false);
   assert.equal(canTraverseLocalStep(s,point(3.1,tangent),point(3,tangent)),false);
  }
  assert.equal(canTraverseLocalStep(s,point(3,2.5),point(3,3.5)),false);
  // Instalar a porta não abre a emenda com a parede vizinha.
  s.interiorDoors=[s.interiorWalls[0]];
  assert.equal(canTraverseLocalStep(s,point(2.9,2.5),point(3.1,2.5)),true);
  assert.equal(canTraverseLocalStep(s,point(2.9,3),point(3.1,3)),false);
 }
});
test("ajuste final de menos de 0,005 tile também respeita paredes e outros corpos",()=>{
 const s=createGame();s.interiorWalls=[{axis:"y",x:3,y:2}];
 const c=fake(7,"to_pc",2.999,2.5,{x:3.001,y:2.5});c.pcIndex=2;
 s.customers=[c];stepGame(s,1);
 assert.ok(c.x<3);assert.equal(c.stage,"to_pc");
 const clear=createGame();
 const a=fake(7,"to_pc",2,2.5,{x:2.004,y:2.5});a.pcIndex=2;
 const b=fake(8,"using",2.432,2.5);clear.customers=[a,b];
 stepGame(clear,1);
 assert.ok(a.x<=2);assert.equal(a.stage,"to_pc");
});
