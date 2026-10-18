import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {actorStyleFor,FEMALE_COSTUMES} from "../dist/js/render/actorArt.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("three real female outfits and hairstyles replace ID-based tint masks",()=>{
 assert.deepEqual(FEMALE_COSTUMES,["female","female-bob","female-ponytail"]);
 const shirts=new Set(),hair=new Set();
 for(const kind of FEMALE_COSTUMES){
  const first=actorStyleFor(kind,1);
  assert.notDeepEqual(first,actorStyleFor("regular",1));
  for(const id of [2,9,27,152,501])assert.deepEqual(actorStyleFor(kind,id),first,
   "the artwork is a fixed outfit, not a recolor based on customer ID");
  shirts.add(first.shirt);hair.add(first.hair);
 }
 assert.equal(shirts.size,3);
 assert.equal(hair.size,3);
});
test("legacy female customer remains valid in saves and new models use the same lifecycle",()=>{
 const s=createGame(13);s.reputation=100;s.pricePerHour=4;
 let found=false;
 for(let i=0;i<650&&!found;i++){
  stepGame(s,1);
  found=s.customers.some(c=>FEMALE_COSTUMES.includes(c.costume));
 }
 assert.ok(found,"at least one woman must be a normal arriving customer");
 const before=parseImportedSave(serializeSave(s));
 assert.ok(before.customers.some(c=>FEMALE_COSTUMES.includes(c.costume)));
 for(const kind of FEMALE_COSTUMES){
  const saved={...before,customers:before.customers.map((c,i)=>i===0?{...c,costume:kind}:c)};
  assert.equal(isValidSave(saved),true);
  const restored=parseImportedSave(serializeSave(saved));
  assert.equal(restored.customers[0].costume,kind);
  assert.equal(restored.rng,s.rng);
 }
});
