import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,entrance,isValidSave} from "../dist/js/sim/engine.js";
import {crowdSideStep} from "../dist/js/sim/crowdNavigation.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {CUSTOMER_COLLISION_RADIUS} from "../dist/js/sim/checkoutQueue.js";
import {serializeSave,parseImportedSave,snapshotGameState} from "../dist/js/sim/saveTransfer.js";
import {doorwayScenario} from "../scripts/doorway_scenario.mjs";

const customer=(id,x,y,stage="to_pc",target={x,y})=>({
 id,x,y,stage,target,route:[],pcIndex:id-1,costume:"regular",usedMinutes:0,
 waitingMinutes:0,offlineWait:0,happy:true
});

test("lateral detour retains the blocked goal and does not cross solid walls",()=>{
 const s=createGame(96),a=customer(1,3.0,3.1,"arriving",{x:5.8,y:3.1});
 const b=customer(2,4.0,3.1,"waiting",{x:4.0,y:3.1});
 s.customers=[a,b];
 const plan=crowdSideStep(s,a,a.target);
 assert.ok(plan?.length,"find an open lateral point instead of teleporting");
 let origin={x:a.x,y:a.y};
 for(const point of plan){
  assert.ok(canTraverseLocalStep(s,origin,point));
  assert.ok(Math.hypot(point.x-b.x,point.y-b.y)>=CUSTOMER_COLLISION_RADIUS-.001);
  origin=point;
 }
 // An enclosed room cannot produce a path through a closed wall.
 s.interiorWalls=Array.from({length:6},(_,y)=>({axis:"y",x:3,y}));
 assert.equal(canTraverseLocalStep(s,{x:2.5,y:3.5},{x:4,y:3.5}),false);
});
test("stall counters are optional in old saves and bounded in new saves",()=>{
 const s=createGame(4),c=customer(1,3.3,4.3);
 s.customers=[c];
 assert.equal(isValidSave(s),true);
 c.stalledMinutes=120;
 assert.equal(isValidSave(s),true);
 const r=parseImportedSave(serializeSave(s));
 assert.equal(r.customers[0].stalledMinutes,120);
 r.customers[0].stalledMinutes=121;
 assert.equal(isValidSave(r),false);
});
test("dense arrivals and departures still respect collisions and recover without teleport",()=>{
 const s=doorwayScenario(),old=s.cash;
 for(let minute=0;minute<95;minute++){
  const previous=new Map(s.customers.map(c=>[c.id,{x:c.x,y:c.y}]));
  stepGame(s,1);
  for(const c of s.customers){
   const p=previous.get(c.id);if(!p)continue;
   assert.ok(Math.hypot(p.x-c.x,p.y-c.y)<=.55,"no teleport across hall");
   assert.ok(canTraverseLocalStep(s,p,c),"no wall crossing");
  }
  for(let i=0;i<s.customers.length;i++)for(let j=i+1;j<s.customers.length;j++)
   assert.ok(Math.hypot(s.customers[i].x-s.customers[j].x,s.customers[i].y-s.customers[j].y)
    >=CUSTOMER_COLLISION_RADIUS-1e-6,"customers must not overlap");
 }
 assert.equal(s.customers.some(c=>c.stage==="leaving"),false);
 assert.ok(Math.abs(s.cash-old-s.revenue+s.expenses)<1e-6);
 const resumed=parseImportedSave(serializeSave(s));
 for(let i=0;i<12;i++){stepGame(s,1);stepGame(resumed,1);}
 // Exportação JSON não preserva propriedades explicitamente undefined (ex.: queueIndex).
 assert.deepEqual(JSON.parse(JSON.stringify(snapshotGameState(resumed))),
  JSON.parse(JSON.stringify(snapshotGameState(s))));
});
