import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {storyVisitorMultiplier as publicStoryVisitorMultiplier} from "../dist/js/sim/storyEvents.js";
import {applyStoryImpact,storyCost,storyVisitorMultiplier} from "../dist/js/sim/stories/economics.js";
import {sourceGraph} from "./helpers/sourceGraph.mjs";

test("story economic consequences are isolated from orchestration and browser layers",()=>{
 const imports=sourceGraph().get("sim/stories/economics.ts")?.imports;
 assert.ok(imports,"expected the economic module to be indexed");
 for(const edge of imports){
  assert.ok(edge.target?.startsWith("sim/"),String(edge.specifier));
  assert.notEqual(edge.target,"sim/storyEvents.ts","effects cannot import their orchestrator");
 }
 assert.strictEqual(publicStoryVisitorMultiplier,storyVisitorMultiplier,"preserve the existing public API");
});

test("story costs and consequences keep legacy save fields and deterministic behavior",()=>{
 const state=createGame(72421,"classic");
 state.totalMinutes=6*DAY_MINUTES;
 state.reputation=50;
 state.pcWear=[10,20,30];
 state.inventory={soda:2,candy:1,snacks:0};
 state.energyAccrued=0;
 const rng=state.rng;
 const cash=state.cash;
 assert.equal(storyCost(state,10),10,"classic mode keeps unchanged cost");
 applyStoryImpact(state,"roof-leak:start",{
  reputation:-4,wear:7,stock:{soda:-4,candy:3},offlineMinutes:35,
  energyBill:10,visitors:0.95,visitorDays:3
 });
 assert.equal(state.reputation,46);
 assert.deepEqual(state.pcWear,[17,27,37]);
 assert.deepEqual(state.inventory,{soda:0,candy:4,snacks:0});
 assert.equal(state.offlineUntil,state.totalMinutes+35);
 assert.equal(state.energyAccrued,10);
 assert.deepEqual(state.storyVisitorEffects,[{id:"roof-leak:start",factor:0.95,untilDay:10}]);
 assert.equal(storyVisitorMultiplier(state),0.95);
 assert.equal(state.rng,rng,"story effects must not consume random numbers");
 assert.equal(state.cash,cash,"the pricing/transaction layer remains separate");
 applyStoryImpact(state,"roof-leak:start",{visitors:1.08,visitorDays:2});
 assert.equal(state.storyVisitorEffects.length,1,"reuse the same serialized effect id");
 assert.equal(storyVisitorMultiplier(state),1.08);
 state.totalMinutes+=3*DAY_MINUTES;
 assert.equal(storyVisitorMultiplier(state),1,"effect expires with the day clock");
});
