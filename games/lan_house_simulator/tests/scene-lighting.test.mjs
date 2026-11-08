import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {daylightAt,windowGlass,lampPositions,WINDOW_POSITIONS} from "../dist/js/render/lighting.js";
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
