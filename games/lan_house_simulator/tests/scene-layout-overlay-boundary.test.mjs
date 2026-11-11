import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {editableObjects} from "../dist/js/sim/editableObjects.js";
import {SceneRenderer} from "../dist/js/render/scene.js";
import {drawLayoutOverlay} from "../dist/js/render/scene/layoutOverlay.js";

function recorder(){
 const calls=[],state={};
 const ctx=new Proxy(state,{
  get(target,key){return key in target?target[key]:(...args)=>calls.push([key,...args]);},
  set(target,key,value){target[key]=value;calls.push(["set",key,value]);return true;}
 });
 return {ctx,calls};
}

test("editing overlays keep the public scene method and paint the same Canvas commands",()=>{
 const state=createGame();
 const selected=editableObjects(state)[0]?.id??null;
 const original=JSON.stringify(state);
 const direct=recorder(),facade=recorder();
 drawLayoutOverlay(direct.ctx,state,selected,null,1.5);
 new SceneRenderer(facade.ctx).drawLayoutOverlay(state,selected,null,1.5);
 assert.deepEqual(facade.calls,direct.calls);
 assert.ok(direct.calls.length>0);
 assert.equal(JSON.stringify(state),original,"edit-mode paint is read-only");
});

test("the editable layout painter is independent of the main scene implementation",async()=>{
 const {readFileSync}=await import("node:fs");
 const layer=readFileSync(new URL("../src/render/scene/layoutOverlay.ts",import.meta.url),"utf8");
 const scene=readFileSync(new URL("../src/render/scene.ts",import.meta.url),"utf8");
 assert.doesNotMatch(layer,/from\s+["']\.\.\/scene\.js/);
 assert.match(scene,/drawLayoutOverlay\(this\.ctx,s,selected,draft,time\)/);
});
