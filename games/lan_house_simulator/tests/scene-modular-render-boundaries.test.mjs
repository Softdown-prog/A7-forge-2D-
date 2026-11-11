import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {SceneRenderer} from "../dist/js/render/scene.js";
import {drawAnnexPcCandidates} from "../dist/js/render/scene/annexPcOverlay.js";
import {drawDoorCandidates,drawWallPreview} from "../dist/js/render/scene/wallOverlay.js";
import {drawPlacementCandidates,drawRelocationCandidates} from "../dist/js/render/scene/furnitureOverlay.js";
import {drawPurchasedFurniture,drawExtraPosters,drawExtraFurniture} from "../dist/js/render/scene/furnitureArt.js";
import {drawEntryMarker} from "../dist/js/render/scene/entryMarker.js";
import {drawRoomSign} from "../dist/js/render/scene/roomSign.js";
import {drawRoomStatus} from "../dist/js/render/scene/roomStatus.js";
import {cameraForGame} from "../dist/js/render/isometric.js";

function canvasRecorder(){
 const log=[],gradient=()=>({addColorStop:(...xs)=>log.push(["color-stop",...xs])});
 const ctx=new Proxy({},{
  get(target,key){
   if(key in target)return target[key];
   if(key==="createLinearGradient"||key==="createRadialGradient")return (...xs)=>{log.push([key,...xs]);return gradient();};
   return (...xs)=>log.push([key,...xs]);
  },
  set(target,key,value){target[key]=value;log.push(["set",key,value]);return true;}
 });
 return {ctx,log};
}
function samePainting(direct,viaScene){
 const a=canvasRecorder(),b=canvasRecorder(),renderer=new SceneRenderer(b.ctx);
 direct(a.ctx);
 viaScene(renderer);
 assert.deepEqual(b.log,a.log,"SceneRenderer keeps the specialized painter's exact draw calls");
 for(const operation of a.log)for(const value of operation.slice(1))
  if(typeof value==="number")assert.ok(Number.isFinite(value),"non-finite paint coordinate");
}

test("public scene placement previews delegate without changing canvas commands",()=>{
 const state=createGame();
 samePainting(ctx=>drawAnnexPcCandidates(ctx,state,null),renderer=>renderer.drawAnnexPcCandidates(state,null));
 samePainting(ctx=>drawPlacementCandidates(ctx,state,"plant",null),renderer=>renderer.drawPlacementCandidates(state,"plant",null));
 samePainting(ctx=>drawRelocationCandidates(ctx,state,null,null),renderer=>renderer.drawRelocationCandidates(state,null,null));
 samePainting(ctx=>drawDoorCandidates(ctx,state,null),renderer=>renderer.drawDoorCandidates(state,null));
 samePainting(ctx=>drawWallPreview(ctx,state,null,false),renderer=>renderer.drawWallPreview(state,null,false));
});

test("shared furniture and room signage paint independently from SceneRenderer",()=>{
 const state=createGame(),camera=cameraForGame(state);
 state.furniture={poster:1,plant:1,table:1};
 state.furniturePlacements=[];
 for(const paint of [
  ctx=>drawPurchasedFurniture(ctx,camera,"plant",1,2),
  ctx=>drawPurchasedFurniture(ctx,camera,"table",2,2,1),
  ctx=>drawExtraPosters(ctx,camera,state),
  ctx=>drawExtraFurniture(ctx,camera,state),
  ctx=>drawEntryMarker(ctx,camera,state),
  ctx=>drawRoomSign(ctx,camera,8),
  ctx=>drawRoomStatus(ctx,state)
 ]){
  const {ctx,log}=canvasRecorder();
  paint(ctx);
  assert.ok(log.length>0,"specialized drawing module must emit canvas commands");
 }
});

test("scene renderer retains orchestration but not inlined furniture or branding",()=>{
 const scene=readFileSync(new URL("../src/render/scene.ts",import.meta.url),"utf8");
 for(const oldName of ["private renderPurchasedFurniture(","private doorMarker(","private sign(","private hudInside(","private slotAnchor("])
  assert.equal(scene.includes(oldName),false,oldName+" should be owned by its own module");
 for(const call of ["drawPurchasedFurniture(","drawRoomStatus(","drawAnnexPcCandidates(","drawWallPreview("])
  assert.ok(scene.includes(call),call+" remains wired");
 const background=readFileSync(new URL("../src/render/scene/background.ts",import.meta.url),"utf8");
 assert.match(background,/drawExtraPosters\\(/,"extra posters are now part of the cached background paint");
});
