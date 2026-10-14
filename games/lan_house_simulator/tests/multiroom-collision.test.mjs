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
 assert.ok(incoming.x>2.78);
});
