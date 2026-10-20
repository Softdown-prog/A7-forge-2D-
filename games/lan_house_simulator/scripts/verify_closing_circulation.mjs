// Realistic crowded day with physical departures across 22:00, plus a
// mid-traffic export/import replay. Uses actual engine, geometry and saves.
// Does NOT modify game state outside the usual simulation APIs.
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {stepGame,isValidSave,entrance,EXIT_REACH_DISTANCE,
 CLOSING_START_MINUTE} from "../dist/js/sim/engine.js";
import {canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {CUSTOMER_COLLISION_RADIUS} from "../dist/js/sim/checkoutQueue.js";
import {serializeSave,parseImportedSave,snapshotGameState} from "../dist/js/sim/saveTransfer.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {circulationScenario} from "./circulation_scenario.mjs";

const output=resolve(process.argv[2]??"out/mobile-stability/closing");
await mkdir(output,{recursive:true});
const state=circulationScenario(1998);
const opening={cash:state.cash,revenue:state.revenue,expenses:state.expenses};
const started=performance.now();
const seenExits=new Set(),closingIds=new Set(),departedAfterClosing=new Set();
const daily=[],stalls=new Map(),leftAtClosing=new Map();
let maxStall=0,peak=state.customers.length,maxLeavingMinutes=0,
 collisionChecks=0,saveBytes=0,checkpointDeterministic=false;
const snapshot=s=>JSON.parse(JSON.stringify(snapshotGameState(s)));

for(let minute=1;minute<=DAY_MINUTES+120;minute++){
 const previous=new Map(state.customers.map(c=>[c.id,{x:c.x,y:c.y,stage:c.stage}]));
 stepGame(state,1);
 assert.equal(state.totalMinutes,minute,"one real game minute per audit step");
 assert.equal(isValidSave(state),true,"valid live save at minute "+minute);
 assert.ok(Math.abs(state.cash-(opening.cash+state.revenue-opening.revenue-
  (state.expenses-opening.expenses)))<1e-5,"cash invariant at "+minute);
 peak=Math.max(peak,state.customers.length);

 const active=new Set(state.customers.map(c=>c.id));
 for(const [id,last] of previous)if(!active.has(id)){
  seenExits.add(id);
  assert.equal(last.stage,"leaving","only departing visitors may disappear");
  assert.ok(Math.hypot(last.x-entrance(state).x,last.y-entrance(state).y)<=
   EXIT_REACH_DISTANCE+.39,"visitor may only disappear at physical exit");
  if(closingIds.has(id))departedAfterClosing.add(id);
 }
 for(let i=0;i<state.customers.length;i++){
  const c=state.customers[i],last=previous.get(c.id);
  if(last){
   assert.ok(Math.hypot(c.x-last.x,c.y-last.y)<=.55,
    "no teleport for customer "+c.id+" at minute "+minute);
   assert.equal(canTraverseLocalStep(state,last,c),true,
    "no closed wall crossing by "+c.id+" at minute "+minute);
  }
  for(let j=i+1;j<state.customers.length;j++){
   const o=state.customers[j],distance=Math.hypot(c.x-o.x,c.y-o.y);
   assert.ok(distance>=CUSTOMER_COLLISION_RADIUS-1e-6,
    "overlapping customers "+c.id+"/"+o.id+" at minute "+minute);
   collisionChecks++;
  }
  if(c.stage!=="leaving"){leftAtClosing.delete(c.id);continue;}
  const record=leftAtClosing.get(c.id)??minute;
  leftAtClosing.set(c.id,record);
  maxLeavingMinutes=Math.max(maxLeavingMinutes,minute-record);
  maxStall=Math.max(maxStall,c.stalledMinutes??0);
  stalls.set(c.id,Math.max(stalls.get(c.id)??0,c.stalledMinutes??0));
 }
 if(minute===CLOSING_START_MINUTE){
  for(const c of state.customers)closingIds.add(c.id);
 }
 // Checkpoint while routes, reservations and retail queues are still alive.
 if(minute===360){
  const serial=serializeSave(state);saveBytes=Buffer.byteLength(serial,"utf8");
  const restored=parseImportedSave(serial);
  assert.equal(isValidSave(restored),true);
  assert.deepEqual(snapshot(restored),snapshot(state),"export/import roundtrip");
  for(let tick=1;tick<=45;tick++){
   const shadow=structuredClone(state);
   stepGame(restored,1);
   stepGame(shadow,tick);
   // At every checkpoint the restored game must match an uninterrupted
   // simulation, with all transient presentation effects ignored.
   assert.deepEqual(snapshot(restored),snapshot(shadow),
    "save replay changed economy, route or RNG at minute "+(minute+tick));
  }
  checkpointDeterministic=true;
 }
 if(minute===CLOSING_START_MINUTE||minute===DAY_MINUTES||minute===DAY_MINUTES+120){
  daily.push({minute,customers:state.customers.length,
   leaving:state.customers.filter(c=>c.stage==="leaving").length,
   served:state.served,retailSales:state.purchases,exited:seenExits.size});
 }
}
const remain=[...closingIds].filter(id=>state.customers.some(c=>c.id===id));
assert.deepEqual(remain,[],"customers at 21:00 must exit before the next 12:00");
assert.ok(closingIds.size>=1,"the test must observe closing with customers inside");
assert.ok(seenExits.size>=15,"the expanded layout must actually discharge visitors");
assert.ok(state.served>=12,"PC occupancy must still lead to real completed sessions");
assert.ok(checkpointDeterministic&&saveBytes>0);
const report={seed:1998,minutes:DAY_MINUTES+120,peakCustomers:peak,
 served:state.served,retailSales:state.purchases,exited:seenExits.size,
 closingVisitors:closingIds.size,departedAfterClosing:departedAfterClosing.size,
 closingRemaining:remain,maxLeavingMinutes,maxStall,collisionChecks,
 saveBytes,checkpointDeterministic,elapsedMs:+(performance.now()-started).toFixed(2),
 milestones:daily};
await writeFile(resolve(output,"closing_circulation.json"),JSON.stringify(report,null,2)+"\n");
console.log("LHS_CLOSING_CIRCULATION "+JSON.stringify(report));
