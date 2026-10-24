import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {crowdRoute} from "../dist/js/sim/crowdNavigation.js";
import {canTraverseLocalStep,localStepValidator,navigableRoute} from "../dist/js/sim/navigation.js";
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


test("destino ocupado temporariamente permite esperar perto sem atravessar o bloqueador",()=>{
 const s=createGame(),client={id:1,x:3.25,y:4.48},blocker={id:2,x:5.25,y:4.48};
 s.customers=[client,blocker];
 const destination={x:blocker.x,y:blocker.y};
 const route=crowdRoute(s,client,destination);
 assert.ok(route?.length,"encontrar ponto de espera em vez de desistir");
 assert.deepEqual(route.at(-1),destination,"não substituir destino final por posição improvisada");
 assert.ok(route.length>=2,"preservar ao menos um ponto intermediário livre");
 let previous=client;
 for(const point of route.slice(0,-1)){
  assert.equal(canTraverseLocalStep(s,previous,point),true);
  assert.ok(Math.hypot(point.x-blocker.x,point.y-blocker.y)>=.43,
   "pontos de espera não invadem espaço ocupado");
  previous=point;
 }
 assert.equal(canTraverseLocalStep(s,previous,destination),true);
 s.customers=[client];
 const released=crowdRoute(s,client,destination);
 assert.ok(released?.length,"continuar navegável após saída do bloqueador");
});

test("destino bloqueado por divisória continua inacessível apesar da espera",()=>{
 const s=createGame(),client={id:1,x:3.25,y:3.25},blocker={id:2,x:5.25,y:3.25};
 s.customers=[client,blocker];
 s.interiorWalls=Array.from({length:6},(_,y)=>({axis:"y",x:4,y}));
 assert.equal(crowdRoute(s,client,{x:blocker.x,y:blocker.y}),null,
  "um corpo no objetivo não pode criar um atalho através da parede");
});

test("verificacao de subpassos em lote equivale a regra de colisao com paredes e portas",()=>{
 const layouts=[
  {walls:[],doors:[],north:0},
  {walls:[{axis:"y",x:4,y:2},{axis:"y",x:4,y:3},{axis:"x",x:3,y:4}],doors:[],north:0},
  {walls:[{axis:"y",x:4,y:2},{axis:"y",x:4,y:3},{axis:"x",x:3,y:4}],
   doors:[{axis:"y",x:4,y:2}],north:0},
  {walls:[{axis:"x",x:2,y:-1},{axis:"y",x:4,y:2}],doors:[],north:2}
 ];
 const xs=[.002,.5,2.1,2.99,3,3.01,3.5,3.99,4,4.01,5.5,7.998];
 const ys=[-1.5,.002,.5,1.99,2,2.01,2.5,3,3.5,4,5.998];
 for(const {walls,doors,north} of layouts){
  const s=createGame(911);s.roomExtensions={west:0,east:0,south:0,north};
  s.interiorWalls=walls;s.interiorDoors=doors;
  const batch=localStepValidator(s);
  for(let k=0;k<xs.length*ys.length;k+=3){
   const from={x:xs[k%xs.length],y:ys[k%ys.length]};
   const to={x:xs[(k*7+1)%xs.length],y:ys[(k*5+3)%ys.length]};
   assert.equal(batch(from,to),canTraverseLocalStep(s,from,to),
    "divisoria e limite divergem no layout "+JSON.stringify({walls,doors,north})+
    " entre "+JSON.stringify(from)+" e "+JSON.stringify(to));
  }
  assert.equal(batch({x:3,y:2},{x:NaN,y:3}),false);
  assert.equal(batch({x:Infinity,y:2},{x:3,y:2}),false);
 }
});

test("cada nova busca enxerga portas e paredes alteradas durante a partida",()=>{
 const s=createGame(92),from={x:3.7,y:2.5},to={x:4.3,y:2.5};
 assert.equal(localStepValidator(s)(from,to),true);
 s.interiorWalls=[{axis:"y",x:4,y:2}];
 assert.equal(localStepValidator(s)(from,to),false);
 assert.equal(navigableRoute(s,from,to)!==null,true,"há desvio pelo corredor");
 s.interiorDoors=[{axis:"y",x:4,y:2}];
 assert.equal(localStepValidator(s)(from,to),true);
 s.interiorDoors=[];
 assert.equal(localStepValidator(s)(from,to),false);
 s.interiorWalls=[];
 assert.equal(localStepValidator(s)(from,to),true);
});
