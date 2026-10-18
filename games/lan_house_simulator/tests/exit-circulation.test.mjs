import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,entrance,EXIT_REACH_DISTANCE,CLOSING_START_MINUTE} from '../dist/js/sim/engine.js';
import {canTraverseLocalStep} from '../dist/js/sim/navigation.js';
import {CUSTOMER_COLLISION_RADIUS} from '../dist/js/sim/checkoutQueue.js';
import {binSpots} from '../dist/js/sim/services.js';
import {retailQueueSlots} from '../dist/js/sim/retailQueue.js';
import {AISLE_Y} from '../dist/js/sim/route.js';
import {serializeSave,parseImportedSave,snapshotGameState} from '../dist/js/sim/saveTransfer.js';
import {exitNearBinScenario,shoppingCrossingScenario} from '../scripts/corridor_scenarios.mjs';

test('a full product queue retains all 14 places while leaving the exit aisle walkable',()=>{
 const s=createGame(),exit=entrance(s);
 for(const item of ['soda','candy','snacks']){
  const slots=retailQueueSlots(s,item);assert.equal(slots.length,14);
  for(const at of slots.slice(1)){
   assert.ok(Math.abs(at.y-AISLE_Y)>CUSTOMER_COLLISION_RADIUS);
   if(at.y>AISLE_Y&&at.y<exit.y+CUSTOMER_COLLISION_RADIUS)assert.ok(Math.abs(at.x-exit.x)>CUSTOMER_COLLISION_RADIUS);
  }
 }
});

function advanceSafely(s){
 const before=new Map(s.customers.map(c=>[c.id,{ref:c,x:c.x,y:c.y}]));
 const {cash,revenue,expenses}=s;stepGame(s,1);
 for(const [id,old] of before){
  assert.ok(Math.hypot(old.ref.x-old.x,old.ref.y-old.y)<=.55,'no teleport to bypass the obstruction');
  assert.equal(canTraverseLocalStep(s,old,old.ref),true);
  if(!s.customers.some(c=>c.id===id)){
   assert.equal(old.ref.stage,'leaving');
   assert.ok(Math.hypot(old.ref.x-entrance(s).x,old.ref.y-entrance(s).y)<=EXIT_REACH_DISTANCE);
  }
 }
 for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++){
  const a=s.customers[i],b=s.customers[j];
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=CUSTOMER_COLLISION_RADIUS-1e-6,'bodies remain separated');
 }
 assert.ok(Math.abs(s.cash-cash-(s.revenue-revenue)+(s.expenses-expenses))<1e-6,'only real transactions change cash');
}

test('departure trapped beside the front bin exits during normal hours while retail queues remain active',()=>{
 const s=exitNearBinScenario(),c=s.customers.find(c=>c.id===22),bin=binSpots(s)[1];
 assert.equal(c.stage,'leaving');assert.ok(Math.hypot(c.x-bin.x,c.y-bin.y)<.3);
 for(let i=0;i<32&&s.customers.some(c=>c.id===22);i++)advanceSafely(s);
 assert.equal(s.customers.some(c=>c.id===22),false,'clear the corridor without waiting for closing');
 assert.ok(s.totalMinutes<CLOSING_START_MINUTE);
 assert.ok(s.customers.some(c=>c.stage==='shopping'),'the simulation did not clear everyone to release the exit');
});

test('crossing visitor and four snack buyers resume their real routes before closing',()=>{
 const s=shoppingCrossingScenario(),buyers=[12,13,14,16],initialPurchases=s.purchases;
 for(let i=0;i<100&&s.customers.some(c=>buyers.includes(c.id));i++)advanceSafely(s);
 assert.equal(s.customers.some(c=>buyers.includes(c.id)),false);
 assert.ok(s.totalMinutes<CLOSING_START_MINUTE);assert.ok(s.purchases>initialPurchases);
});

test('saving during corridor recovery preserves the exact resumed campaign',()=>{
 const s=exitNearBinScenario();for(let i=0;i<6;i++)advanceSafely(s);
 const resumed=parseImportedSave(serializeSave(s));
 for(let i=0;i<80;i++){stepGame(s,1);stepGame(resumed,1);}
 assert.deepEqual(snapshotGameState(resumed),snapshotGameState(s));
 assert.equal(s.customers.some(c=>c.id===22),false);
});
