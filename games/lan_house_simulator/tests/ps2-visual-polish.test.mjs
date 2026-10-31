import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PS2_GAME_CATALOG} from "../dist/js/sim/ps2.js";
import {PS2_SCREEN,ps2ActorGrip,ps2ControllerAnchor,drawPs2Station} from "../dist/js/render/ps2Art.js";
import {actorRequiresLiveGamepadRig} from "../dist/js/render/actorSprites.js";
import {drawPs2MiniGame} from "../dist/js/render/ps2MiniGames.js";
import {iso} from "../dist/js/render/isometric.js";

test("real PS2 screen occupies most of its cabinet at salon zoom, without extra canvas layers",()=>{
 assert.ok(PS2_SCREEN.left>.13&&PS2_SCREEN.right<.75);
 assert.ok(PS2_SCREEN.right-PS2_SCREEN.left>=.52);
 assert.ok(PS2_SCREEN.top<=68&&PS2_SCREEN.bottom>=33);
 assert.ok(PS2_SCREEN.top-PS2_SCREEN.bottom>=26);
 const cam={zoom:.86,originX:500,originY:200},x=3,y=2;
 const left=iso({x:x+PS2_SCREEN.left,y:y+PS2_SCREEN.front},cam,PS2_SCREEN.top);
 const right=iso({x:x+PS2_SCREEN.right,y:y+PS2_SCREEN.front},cam,PS2_SCREEN.top);
 const bottom=iso({x:x+PS2_SCREEN.left,y:y+PS2_SCREEN.front},cam,PS2_SCREEN.bottom);
 assert.ok(right.x-left.x>=29,"screen should be readable at default salon zoom");
 assert.ok(bottom.y-left.y>=23,"characters and road have enough vertical pixels");
});
test("PS2 controllers use the correct mirrored grip for both seats; PS1 still uses cached rig",()=>{
 const station={x:3.2,y:2.2};
 for(const seat of [{x:3.47,y:2.97},{x:4.05,y:2.97}]){
  const forward=ps2ActorGrip(seat,station,"back-right");
  const mirrored=ps2ActorGrip(seat,station,"back-left");
  assert.ok(Number.isFinite(forward.x)&&Number.isFinite(forward.y));
  assert.ok(Math.abs(forward.x)>1,"grip must be different for different stations");
  assert.equal(mirrored.x,-forward.x);
  assert.equal(mirrored.y,forward.y);
  assert.deepEqual(ps2ActorGrip(seat,station,"front-right"),forward);
  assert.deepEqual(ps2ActorGrip(seat,station,"front-left"),mirrored);
  assert.ok(ps2ControllerAnchor(seat,station).height>=24);
 }
 assert.equal(actorRequiresLiveGamepadRig({gamepad:true,modernGamepad:true,gamepadGrip:{x:1,y:-22}}),true);
 assert.equal(actorRequiresLiveGamepadRig({gamepad:true,modernGamepad:false,gamepadGrip:{x:1,y:-22}}),false);
 assert.equal(actorRequiresLiveGamepadRig({gamepad:false,modernGamepad:true,gamepadGrip:{x:1,y:-22}}),false);
 assert.equal(actorRequiresLiveGamepadRig({gamepad:true,modernGamepad:true}),false);
});
test("PS2 five game scenes retain distinct, high-contrast visible animated elements",()=>{
 const unique=new Set();
 for(const game of PS2_GAME_CATALOG){
  const boxes=[];
  drawPs2MiniGame((x,y,w,h,color)=>boxes.push({x,y,w,h,color}),game.id,1.8);
  assert.ok(boxes.length>12,game.id);
  assert.ok(boxes.every(b=>b.x>=0&&b.y>=0&&b.w>0&&b.h>0&&b.x+b.w<=1.00001&&b.y+b.h<=1.00001));
  const colors=new Set(boxes.map(b=>b.color));
  assert.ok(colors.size>=7,game.id+" should have multiple distinct colors");
  const bright=boxes.filter(b=>{
   const m=/^#([0-9a-f]{6})$/i.exec(b.color);
   if(!m)return false;
   const n=parseInt(m[1],16);
   return ((n>>16)&255)*.2126+((n>>8)&255)*.7152+(n&255)*.0722>155;
  });
  assert.ok(bright.some(b=>b.w*b.h>=.003),game.id+" must have a visible bright focal point");
  const after=[];drawPs2MiniGame((...args)=>after.push(args),game.id,3.6);
  assert.notDeepEqual(boxes.map(b=>[b.x,b.y,b.w,b.h,b.color]),after,game.id+" must animate");
  unique.add(boxes.map(b=>b.color).join(","));
 }
 assert.equal(unique.size,5);
});
test("PS2 art remains procedural Canvas 2D and renders its real screen at idle / in use",()=>{
 const traces=[];
 const ctx=new Proxy({},{
  get(t,k){if(k in t)return t[k];return (...args)=>traces.push([k,...args]);},
  set(t,k,v){t[k]=v;return true;}
 });
 const cam={zoom:.86,originX:500,originY:200},point={x:3,y:2};
 drawPs2Station(ctx,cam,point,0,false,0,null,false,false);
 const idlePolygons=traces.filter(t=>t[0]==="fill").length;
 drawPs2Station(ctx,cam,point,0,true,1.8,"cidade-em-fuga",true,false);
 assert.ok(traces.filter(t=>t[0]==="fill").length>idlePolygons);
 assert.ok(traces.some(t=>t[0]==="lineTo"));
 assert.ok(traces.some(t=>t[0]==="fillText"&&t[1]==="PS2"));
 const art=readFileSync(new URL("../src/render/ps2Art.ts",import.meta.url),"utf8");
 assert.doesNotMatch(art,/\b(fetch|new Image|drawImage|WebGLRenderingContext)\b/);
});
