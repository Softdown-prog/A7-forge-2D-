import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,entrance,EXIT_REACH_DISTANCE} from '../dist/js/sim/engine.js';
import {CUSTOMER_COLLISION_RADIUS} from '../dist/js/sim/checkoutQueue.js';
import {canTraverseLocalStep} from '../dist/js/sim/navigation.js';
import {serializeSave,parseImportedSave,snapshotGameState} from '../dist/js/sim/saveTransfer.js';
import {doorwayScenario} from '../scripts/doorway_scenario.mjs';

test('a soleira bloqueada retoma a fila com PCs livres, sem teleporte, atravessar corpos ou cobrar em dobro',()=>{
 const s=doorwayScenario(),departing=s.customers.filter(c=>c.stage==='leaving').map(c=>c.id);
 const initial=s.cash;let used=false;
 for(let minute=0;minute<100;minute++){
  const before=new Map(s.customers.map(c=>[c.id,{ref:c,x:c.x,y:c.y}]));
  stepGame(s,1);
  for(const [id,old] of before){
   assert.ok(Math.hypot(old.ref.x-old.x,old.ref.y-old.y)<=.55,'cada cliente caminha até o próximo ponto');
   assert.equal(canTraverseLocalStep(s,old,old.ref),true);
   if(!s.customers.some(c=>c.id===id))assert.ok(Math.hypot(old.ref.x-entrance(s).x,old.ref.y-entrance(s).y)<=EXIT_REACH_DISTANCE,'saída apenas na soleira');
  }
  for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++){
   const a=s.customers[i],b=s.customers[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=CUSTOMER_COLLISION_RADIUS-1e-6);
  }
  assert.ok(Math.abs(s.cash-initial-s.revenue+s.expenses)<1e-6);
  used ||= s.customers.some(c=>c.id===17&&c.stage==='using');
 }
 assert.equal(s.customers.some(c=>departing.includes(c.id)),false);
 assert.ok(used,'o primeiro da fila chega ao PC');assert.equal(s.served,1);
});

test('save retomado enquanto o visitante cede passagem preserva a recuperação e a contabilidade',()=>{
 const s=doorwayScenario();stepGame(s,1);
 assert.equal(s.customers.find(c=>c.id===17).doorwayYielding,true);
 const resumed=parseImportedSave(serializeSave(s));
 for(let minute=0;minute<100;minute++){stepGame(s,1);stepGame(resumed,1);}
 assert.deepEqual(snapshotGameState(resumed),snapshotGameState(s));
 assert.equal(resumed.customers.some(c=>c.doorwayYielding),false);
});

test('novas chegadas respeitam quem já está atravessando a saída',()=>{
 let arrivals=0;
 for(let seed=1;seed<=100;seed++){
  const free=createGame(seed,'historical'),busy=createGame(seed,'historical');
  for(const s of [free,busy]){s.totalMinutes=20;s.reputation=95;s.pricePerHour=1;}
  const p={x:7.5,y:4.9};busy.nextCustomerId=10;
  busy.customers=[{id:1,...p,stage:'leaving',target:entrance(busy),route:[],costume:'regular',pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true}];
  stepGame(free,1);stepGame(busy,1);arrivals+=free.customers.length;
  assert.equal(busy.customers.some(c=>c.stage==='arriving'),false);
  assert.equal(busy.nextCustomerId,10);
 }
 assert.ok(arrivals>0,'os seeds exercitam tentativas reais de entrada');
});
