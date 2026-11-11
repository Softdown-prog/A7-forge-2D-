import test from "node:test";
import assert from "node:assert/strict";
import {POSTER_KINDS,POSTER_WIDTH,POSTER_HEIGHT,drawPosterPlate,drawWallPoster,purchasedPosterKind} from "../dist/js/render/posterArt.js";

function capture(){
 const calls=[];
 let depth=0;
 const ctx=new Proxy({}, {
  get(_target,name){
   if(name==="calls")return calls;
   if(name==="depth")return depth;
   if(name==="save")return ()=>{depth++;calls.push(["save"]);};
   if(name==="restore")return ()=>{depth--;assert.ok(depth>=0);calls.push(["restore"]);};
   return (...args)=>calls.push([String(name),...args]);
  },
  set(_target,name,value){calls.push(["set",String(name),value]);return true;}
 });
 return ctx;
}

test("all seven poster designs draw unique vector art with their existing titles and balanced Canvas state",()=>{
 assert.deepEqual(POSTER_KINDS,["coaster","tactical","golf","artillery","city","terminal","arcade"]);
 assert.deepEqual([POSTER_WIDTH,POSTER_HEIGHT],[96,112]);
 const titles=["ROLLERCOASTER","COUNTER","PANGYA","GUNBOUND","CITY","LAN HOUSE","JOGOS"];
 const drawings=new Set();
 POSTER_KINDS.forEach((kind,index)=>{
  const ctx=capture();
  drawPosterPlate(ctx,kind);
  assert.equal(ctx.depth,0,kind+" left unbalanced Canvas transforms");
  const labels=ctx.calls.filter(([operation])=>operation==="fillText").map(([,value])=>value);
  assert.ok(labels.includes(titles[index]),kind+" lost its title");
  assert.ok(ctx.calls.filter(([operation])=>operation==="fillRect").length>=5,kind+" lost frame or scene");
  assert.ok(ctx.calls.length>35,kind+" has no complete illustration");
  drawings.add(JSON.stringify(ctx.calls));
 });
 assert.equal(drawings.size,POSTER_KINDS.length,"poster art must remain individually distinct");
});

test("wall projection keeps drawPosterPlate integration, balancing Canvas, and all paid-poster placements",()=>{
 for(const kind of POSTER_KINDS){
  const ctx=capture();
  drawWallPoster(ctx,{originX:360,originY:150,zoom:1},{x:1,y:2,axis:"x",span:1,top:70,height:95},kind);
  assert.equal(ctx.depth,0,kind+" wall transform was not restored");
  assert.ok(ctx.calls.some(([method])=>method==="transform"),kind+" did not project onto the wall");
 }
 assert.deepEqual(Array.from({length:6},(_,i)=>purchasedPosterKind(i)),["city","arcade","coaster","golf","artillery","tactical"]);
});
