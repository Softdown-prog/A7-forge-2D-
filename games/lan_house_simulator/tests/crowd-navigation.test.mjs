import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {crowdRoute} from "../dist/js/sim/crowdNavigation.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {workerRoute} from "../dist/js/sim/workerNavigation.js";

test("desvio de multidão contorna corpos e preserva a porta como passagem",()=>{
 const s=createGame();s.interiorWalls=Array.from({length:6},(_,y)=>({axis:"y",x:4,y}));
 s.interiorWalls=s.interiorWalls.filter(w=>w.y!==4);s.interiorDoors=[{axis:"y",x:4,y:4}];
 const c={id:1,x:3.2,y:3.7},blocker={id:2,x:3.25,y:4.48};s.customers=[c,blocker];
 const path=crowdRoute(s,c,{x:5,y:4.5});assert.ok(path?.length);
 let previous=c;
 for(const p of path){
  assert.equal(canTraverseLocalStep(s,previous,p),true);
  assert.ok(Math.hypot(p.x-blocker.x,p.y-blocker.y)>=.43);
  previous=p;
 }
 s.interiorWalls.push({axis:"y",x:4,y:4});s.interiorDoors=[];
 assert.equal(crowdRoute(s,c,{x:5,y:4.5}),null);
});
test("rota de funcionário também rejeita emendas de uma parede fechada",()=>{
 const s=createGame();s.interiorWalls=Array.from({length:6},(_,y)=>({axis:"y",x:4,y}));
 assert.equal(workerRoute(s,{x:3,y:3},{x:5,y:3}),null);
 s.interiorWalls.splice(4,1);s.interiorDoors=[{axis:"y",x:4,y:4}];
 const path=workerRoute(s,{x:3,y:3},{x:5,y:3});assert.ok(path?.length);
 let previous={x:3,y:3};for(const p of path){assert.equal(canTraverseLocalStep(s,previous,p),true);previous=p;}
});
test("saída lateral do caixa é preservada com divisória distante",()=>{
 const s=createGame(20);s.interiorWalls=[{axis:"x",x:5,y:3}];
 const c={id:1,stage:"waiting",queueIndex:0,x:1.55,y:2.56,target:{x:1.55,y:2.56},
  route:[],costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};
 s.customers=[c];stepGame(s,1);
 assert.equal(c.stage,"to_pc");assert.deepEqual(c.target,{x:2.46,y:2.56});
});
