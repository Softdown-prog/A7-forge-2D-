import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {daylightAt,windowGlass,lampPositions,WINDOW_POSITIONS,monitorEmission} from "../dist/js/render/lighting.js";
import {monitorScreenQuad} from "../dist/js/render/retroComputer.js";
import {iso} from "../dist/js/render/isometric.js";
import {mixHex,lerpHex,withAlpha,shadeHex,cellNoise,parseHex} from "../dist/js/render/color.js";
import {createGame} from "../dist/js/sim/engine.js";
import {roomBounds} from "../dist/js/sim/room.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

test("daylight follows the simulated hour only: bright at opening, dark at closing",()=>{
 const open=daylightAt(0),noon=daylightAt(120),golden=daylightAt(465),dusk=daylightAt(540),close=daylightAt(700);
 assert.equal(open.hour,10);assert.equal(open.daylight,1);assert.equal(open.night,0);assert.equal(open.phase,"day");
 assert.equal(noon.phase,"day");
 assert.equal(golden.phase,"golden");assert.ok(golden.warmth>.8,"golden hour is warm");
 assert.equal(dusk.phase,"dusk");assert.ok(dusk.daylight>0&&dusk.daylight<1);
 assert.equal(close.phase,"night");assert.ok(close.daylight<.02);assert.ok(close.night>.98);
 let previous=1;
 for(let m=0;m<DAY_MINUTES;m+=5){const d=daylightAt(m);assert.ok(d.daylight<=previous+1e-9,"daylight never comes back during a day");previous=d.daylight;}
 assert.deepEqual(daylightAt(DAY_MINUTES*3+90),daylightAt(90),"wraps per day");
 assert.deepEqual(daylightAt(NaN),daylightAt(0));
});
test("window glass is sky by day, amber at sunset and dark at night; no exterior scene",()=>{
 const day=windowGlass(daylightAt(60)),gold=windowGlass(daylightAt(465)),night=windowGlass(daylightAt(700));
 const lum=hex=>{const [r,g,b]=parseHex(hex);return r*.2126+g*.7152+b*.0722;};
 assert.ok(lum(day.top)>120);assert.ok(lum(night.top)<60);
 const [gr,gg,gb]=parseHex(gold.top);assert.ok(gr>gg&&gg>gb,"sunset glass is warm");
 assert.ok(night.sheen>day.sheen,"lamps reflect more on dark glass");
 const source=readFileSync(new URL("../src/render/lighting.ts",import.meta.url),"utf8");
 assert.doesNotMatch(source,/s\.weather|\.weather\b|Date\.now|Math\.random/,"lighting ignores weather, wall clock and RNG");
});
test("lamps and windows stay inside the salon as it grows",()=>{
 const s=createGame();
 const lamps=lampPositions(roomBounds(s));
 assert.equal(lamps.length,3);
 for(const x of lamps)assert.ok(x>0&&x<roomBounds(s).maxX);
 assert.deepEqual([...WINDOW_POSITIONS],[2.15,4.45]);
});
test("colour helpers are pure and clamp their inputs",()=>{
 assert.equal(mixHex("#000000",255,.5),"#808080");
 assert.equal(lerpHex("#000000","#ffffff",0),"#000000");
 assert.equal(lerpHex("#000000","#ffffff",1),"#ffffff");
 assert.equal(withAlpha("#ff0000",2),"rgba(255,0,0,1.000)");
 assert.equal(shadeHex("#808080",1),"#808080");
 assert.ok(parseHex(shadeHex("#808080",1.2))[0]>128);
 assert.ok(parseHex(shadeHex("#808080",.8))[0]<128);
 assert.equal(cellNoise(3,4),cellNoise(3,4));
 assert.notEqual(cellNoise(3,4),cellNoise(4,3));
 for(let i=0;i<50;i++){const n=cellNoise(i,i*7,2);assert.ok(n>=0&&n<1);}
});

test("per-frame painters keep the draw batch intact: no blend modes or blur in the lighting pass or the HUD plates",()=>{
 // Comments may name the banned calls to explain why they are banned; only code counts.
 const read=file=>readFileSync(new URL("../src/render/"+file,import.meta.url),"utf8").replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"");
 const lighting=read("lighting.ts");
 // The first version used lighter / multiply / soft-light over the whole frame and cost
 // several milliseconds per frame without GPU compositing (about +7 ms at 2x).
 assert.doesNotMatch(lighting,/globalCompositeOperation\s*=\s*["'](?:lighter|multiply|soft-light|screen|overlay)/,"lighting uses source-over only");
 assert.doesNotMatch(lighting,/shadowBlur/,"lighting never blurs");
 const sign=read("scene/roomSign.ts"),hud=read("scene/roomStatus.ts");
 assert.doesNotMatch(sign,/shadowBlur/,"the room sign is painted without blur");
 assert.doesNotMatch(hud,/shadowBlur/,"the room status HUD is painted without blur");
 assert.match(lighting,/LIGHT_STEPS/,"the localized light is cached per quantized hour");
});

test("monitor emission is zero by day and grows smoothly with the evening",()=>{
 for(const strength of [.15,.3]){
  assert.equal(monitorEmission(0,strength).screen,0,"nothing to add in daylight");
  let previous=monitorEmission(0,strength);
  for(let n=.05;n<=1.0001;n+=.05){
   const e=monitorEmission(n,strength);
   assert.ok(e.screen>=previous.screen-1e-9&&e.halo>=previous.halo-1e-9&&e.spill>=previous.spill-1e-9,"never dims as night deepens: "+n.toFixed(2));
   previous=e;
  }
  assert.ok(previous.screen<=.3+1e-9,"the glass lift stays capped so the content remains readable");
 }
 assert.ok(monitorEmission(1,.3).screen>monitorEmission(1,.15).screen,"a busy session shines more than an idle desktop");
 assert.ok(monitorEmission(1,.15).halo>monitorEmission(0,.15).halo,"the halo also grows at night");
 for(const bad of [NaN,Infinity,-1,undefined]){
  const e=monitorEmission(bad,.2);
  for(const v of Object.values(e))assert.ok(Number.isFinite(v)&&v>=0,"inputs are sanitized: "+bad);
 }
 assert.deepEqual(monitorEmission(1,0),{screen:0,halo:0,spill:0},"an unlit screen emits nothing");
});
test("screen quads follow each monitor's glass for the CRT and all five LCD generations",()=>{
 const cam={originX:500,originY:200,zoom:.86},p={x:3,y:1.1};
 for(const lcd of [null,"lcd05","lcd08","lcd12","lcd17","lcd24"]){
  const quad=monitorScreenQuad(cam,p,lcd);
  assert.equal(quad?.length,4,String(lcd));
  for(const q of quad)assert.ok(Number.isFinite(q.x)&&Number.isFinite(q.y));
  const area=Math.abs(quad.reduce((sum,q,i)=>{const n=quad[(i+1)%4];return sum+q.x*n.y-n.x*q.y;},0))/2;
  assert.ok(area>150&&area<2500,String(lcd)+" glass has a plausible on-screen size ("+area.toFixed(0)+" px²)");
  const base=iso(p,cam,0);
  for(const q of quad)assert.ok(Math.abs(q.x-base.x)<80&&q.y<base.y&&base.y-q.y<110,String(lcd)+" stays over its own desk");
  // Drawn as a quad, never mirrored or twisted.
  assert.ok(quad[0].x<quad[1].x&&quad[3].x<quad[2].x&&quad[0].y<quad[3].y&&quad[1].y<quad[2].y,String(lcd)+" keeps its orientation");
 }
 // The CRT quad is exactly the glass rectangle (15..82 by 16..76) of the monitor plane.
 const a=iso({x:3.22,y:1.1-.05+.36+.005},cam,75),b=iso({x:3.22+.46,y:1.1-.05+.36+.005},cam,75),d=iso({x:3.22,y:1.1-.05+.36+.005},cam,36);
 const crt=monitorScreenQuad(cam,p,null);
 assert.ok(Math.abs(crt[0].x-(a.x+(b.x-a.x)*15/96))<1e-9&&Math.abs(crt[0].y-(a.y+(b.y-a.y)*15/96+(d.y-a.y)*16/100))<1e-9);
 assert.ok(Math.abs(crt[2].x-(a.x+(b.x-a.x)*82/96))<1e-9&&Math.abs(crt[2].y-(a.y+(b.y-a.y)*82/96+(d.y-a.y)*76/100))<1e-9);
});
test("a monitor turned away from the camera has no visible glass to light",()=>{
 const p={x:3,y:1.1};
 for(const rotation of [1,2])assert.equal(monitorScreenQuad({originX:500,originY:200,zoom:.86,rotation,pivot:{x:3.55,y:1.45}},p,null),null,"rotation "+rotation);
 for(const rotation of [0,3])assert.equal(monitorScreenQuad({originX:500,originY:200,zoom:.86,rotation,pivot:{x:3.55,y:1.45}},p,"lcd12")?.length,4,"rotation "+rotation);
 assert.equal(monitorScreenQuad({originX:500,originY:200,zoom:.86},p,"lcd-desconhecido"),null,"unknown model");
});
