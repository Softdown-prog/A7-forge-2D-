import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SCENE_WIDTH,SCENE_HEIGHT,sceneBackingScale,fitSceneBackingStore,scenePointFromClient,sceneUnitsPerCssPixel,contextScale,MAX_BACKING_SCALE,MAX_COARSE_BACKING_SCALE} from "../dist/js/render/sceneSurface.js";
import {drawRasterCached,rasterCacheUsable} from "../dist/js/render/rasterCache.js";

test("scene units stay 1000×610 while the backing scale follows CSS size × DPR",()=>{
 assert.equal(SCENE_WIDTH,1000);assert.equal(SCENE_HEIGHT,610);
 assert.equal(sceneBackingScale(1000,1),1);
 assert.equal(sceneBackingScale(1000,2),2);
 assert.equal(sceneBackingScale(1095,2),2.2,"quantized upward to a tenth");
 assert.equal(sceneBackingScale(1001,1),1.1);
 for(const scale of [1.1,1.7,2.2,3])assert.ok(Number.isInteger(Math.round(610*scale*1e6)/1e6),"610 units land on whole device rows at "+scale);
 assert.equal(sceneBackingScale(500,1),1,"never below native resolution");
 assert.equal(sceneBackingScale(3000,3),MAX_BACKING_SCALE,"fine pointers cap at 3×");
 assert.equal(sceneBackingScale(3000,3,true),MAX_COARSE_BACKING_SCALE,"touch devices cap at 2×");
 for(const bad of [0,-1,NaN,Infinity])assert.equal(sceneBackingScale(bad,2),1);
 assert.equal(sceneBackingScale(900,NaN),1);
});
test("fitting the backing store resizes once and maps scene units through the transform",()=>{
 const calls=[],canvas={width:1000,height:610},ctx={setTransform:(...a)=>calls.push(a)};
 assert.equal(fitSceneBackingStore(canvas,ctx,2),true);
 assert.deepEqual([canvas.width,canvas.height],[2000,1220]);
 assert.deepEqual(calls.at(-1),[2,0,0,2,0,0]);
 assert.equal(fitSceneBackingStore(canvas,ctx,2),false,"same scale keeps the bitmap");
 assert.equal(fitSceneBackingStore(canvas,ctx,1),true);
 assert.deepEqual([canvas.width,canvas.height],[1000,610]);
 assert.equal(fitSceneBackingStore({width:1,height:1},{},1),true,"contexts without setTransform are tolerated");
});
test("pointer mapping ignores both CSS zoom and backing resolution",()=>{
 const rect={left:10,top:20,width:500,height:305};
 assert.deepEqual(scenePointFromClient(rect,10,20),{x:0,y:0});
 assert.deepEqual(scenePointFromClient(rect,260,172.5),{x:500,y:305});
 assert.equal(sceneUnitsPerCssPixel(rect),2);
 assert.equal(sceneUnitsPerCssPixel({width:0}),SCENE_WIDTH,"degenerate rects never divide by zero");
});
test("contextScale accepts identity and uniform scales only",()=>{
 assert.equal(contextScale({}),1);
 assert.equal(contextScale({getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})}),1);
 assert.equal(contextScale({getTransform:()=>({a:2.25,b:0,c:0,d:2.25,e:0,f:0})}),2.25);
 assert.equal(contextScale({getTransform:()=>({a:2,b:0,c:0,d:1,e:0,f:0})}),null);
 assert.equal(contextScale({getTransform:()=>({a:1,b:0,c:0,d:1,e:4,f:0})}),null);
 assert.equal(contextScale({getTransform:()=>undefined}),1);
});
test("without a DOM the raster cache paints straight to the target",()=>{
 const target={globalAlpha:1,globalCompositeOperation:"source-over",filter:"none",getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 assert.equal(rasterCacheUsable(target),false);
 const painted=[];
 drawRasterCached(target,"test",{key:"k",anchorX:10,anchorY:10,padX:5,padY:5,width:20,height:20},t=>painted.push(t));
 assert.deepEqual(painted,[target]);
});
test("Canvas consumers measure pointers and clamps in scene units, never in bitmap pixels",()=>{
 const read=file=>readFileSync(new URL("../src/"+file,import.meta.url),"utf8");
 for(const file of ["render/scenePicking.ts","ui/layoutEditor.ts"]){
  const source=read(file);
  assert.doesNotMatch(source,/canvas!?\.width/,file+" must not scale pointers by canvas.width");
  assert.match(source,/sceneSurface\.js/);
 }
 for(const file of ["render/nightMatchMarkers.ts","render/nightPrizePresentation.ts","render/nightReopening.ts","render/scene.ts"]){
  assert.doesNotMatch(read(file),/ctx\.canvas\.width|w=1000/,file);
 }
 assert.match(read("render/gameScene.ts"),/fitSceneBackingStore/);
});
