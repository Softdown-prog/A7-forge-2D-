import test from "node:test";
import assert from "node:assert/strict";
import * as publicRig from "../dist/js/render/actors/rigPrimitives.js";
import * as geometry from "../dist/js/render/actors/rig/geometry.js";
import * as face from "../dist/js/render/actors/rig/face.js";
import * as torso from "../dist/js/render/actors/rig/torso.js";

test("as peças do rig mantêm todas as exportações públicas originais",()=>{
 const modules=[geometry,face,torso];
 const original=[
  "ell","edgeFor","shape","segment","clamp01","seatTransitionWeight",
  "limb","profileWalkingStep","eye","hairSheen","blush",
  "noseBump","casualHairExtras","torso","casualChestExtras"
 ];
 assert.deepEqual(Object.keys(publicRig).sort(),original.sort());
 for(const mod of modules)for(const [name,fn] of Object.entries(mod)){
  assert.strictEqual(publicRig[name],fn,name+" deve preservar a referência pública");
 }
});

test("os módulos de cabeça, braços e pernas podem ser importados separadamente",async()=>{
 const [{drawActorHead},{drawActorArm},{drawActorLegs},{drawNeonHeadset}]=await Promise.all([
  import("../dist/js/render/actors/head.js"),
  import("../dist/js/render/actors/arms.js"),
  import("../dist/js/render/actors/legs.js"),
  import("../dist/js/render/actors/headset.js")
 ]);
 for(const draw of [drawActorHead,drawActorArm,drawActorLegs,drawNeonHeadset])
  assert.equal(typeof draw,"function");
});
