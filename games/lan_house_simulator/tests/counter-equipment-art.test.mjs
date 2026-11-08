import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {drawCounter} from "../dist/js/render/counterArt.js";
import {drawCounterPrinter} from "../dist/js/render/printerArt.js";
import {drawCounterDiscCopier} from "../dist/js/render/discCopierArt.js";
import {iso,objectCamera} from "../dist/js/render/isometric.js";

/** Recording context: logs every call and property write; gradients accept stops. */
function recorder(){
 const log=[],state={};
 const gradient=()=>({addColorStop:(...a)=>log.push(["stop",...a])});
 const ctx=new Proxy(state,{
  get(t,k){
   if(k==="createLinearGradient"||k==="createRadialGradient"||k==="createConicGradient")return (...a)=>{log.push([k,...a.map(v=>+v.toFixed(4))]);return gradient();};
   if(k==="measureText")return ()=>({width:10});
   if(k in t)return t[k];
   return (...a)=>log.push([k,...a.map(v=>typeof v==="number"?+v.toFixed(4):v)]);
  },
  set(t,k,v){t[k]=v;if(typeof v==="string"||typeof v==="number")log.push(["set",k,v]);return true;}
 });
 return {ctx,log};
}
const counter={x:.9,y:1.42};
const scene=(rotation,zoom,active)=>{
 const {ctx,log}=recorder(),cam=objectCamera({originX:500,originY:300,zoom},counter,1.75,.72,rotation);
 drawCounter(ctx,cam,counter,false);
 drawCounterPrinter(ctx,cam,counter,active,1.3,false);
 drawCounterDiscCopier(ctx,cam,counter,active,1.1,false);
 return log;
};
test("counter, printer and disc copier draw in every rotation, zoom and state with finite coordinates",()=>{
 for(const rotation of [0,1,2,3])for(const zoom of [.45,.86,1.75,2.4])for(const active of [false,true]){
  const log=scene(rotation,zoom,active);
  assert.ok(log.length>200,"a detailed drawing for "+[rotation,zoom,active]);
  for(const entry of log)for(const v of entry.slice(1))if(typeof v==="number")assert.ok(Number.isFinite(v),"finite value in "+entry[0]+" "+[rotation,zoom,active]);
 }
});
test("drawing is deterministic: identical input gives identical calls",()=>{
 for(const rotation of [0,2])assert.deepEqual(scene(rotation,.86,true),scene(rotation,.86,true));
});
test("working state adds moving parts on top of the same static body",()=>{
 for(const rotation of [0,3]){
  const idle=scene(rotation,1.75,false),busy=scene(rotation,1.75,true);
  assert.ok(busy.length>idle.length,"active frame paints extra shapes (paper, sweep, tray and disc)");
 }
});
test("printer and copier stay inside their cached raster in every rotation (nothing is cut when blitted)",()=>{
 // Their rasters reserve 160 scene units left/right of the counter anchor, 210 above and 90 below (× zoom).
 const zoom=.86;
 for(const rotation of [0,1,2,3])for(const draw of [drawCounterPrinter,drawCounterDiscCopier]){
  const cam=objectCamera({originX:500,originY:300,zoom},counter,1.75,.72,rotation);
  const anchor=iso(counter,cam),{ctx,log}=recorder();
  draw(ctx,cam,counter,true,1,false);
  const xs=[],ys=[];
  for(const e of log)if(e[0]==="moveTo"||e[0]==="lineTo"){xs.push(e[1]-anchor.x);ys.push(e[2]-anchor.y);}
  assert.ok(xs.length>20,draw.name+" paints polygons");
  assert.ok(Math.min(...xs)>-160*zoom&&Math.max(...xs)<160*zoom,draw.name+" x inside the raster, rotation "+rotation+": "+[Math.min(...xs),Math.max(...xs)]);
  assert.ok(Math.min(...ys)>-210*zoom&&Math.max(...ys)<90*zoom,draw.name+" y inside the raster, rotation "+rotation+": "+[Math.min(...ys),Math.max(...ys)]);
 }
});
test("procedural only: no images, no randomness, no wall clock, no blend modes or blur in the counter equipment",()=>{
 for(const file of ["counterArt","printerArt","discCopierArt","planeArt"]){
  const code=readFileSync(new URL("../src/render/"+file+".ts",import.meta.url),"utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,"");
  assert.ok(!/Math\.random|Date\.now|performance\.now|new Image|drawImage\(|shadowBlur|globalCompositeOperation|"lighter"|"multiply"/.test(code),file+" stays procedural and cheap");
 }
});
