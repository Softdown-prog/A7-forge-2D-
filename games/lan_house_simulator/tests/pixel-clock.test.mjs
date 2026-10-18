import test from "node:test";
import assert from "node:assert/strict";
import {pixelClockDisplay,pixelClockBrightness,drawPixelClock} from "../dist/js/render/pixelClockArt.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {createGame,displayTime} from "../dist/js/sim/engine.js";
import {cosmeticAvailable,setVerifiedCosmetics,toggleVerifiedCosmetic} from "../dist/js/sim/premiumCosmetics.js";
test("LED wall clock matches the LHS clock throughout the day and after rollover",()=>{
 const game=createGame(7);
 for(const minute of [0,1,59,60,659,660,719,720,721,DAY_MINUTES*5+643]){
  game.totalMinutes=minute;
  assert.equal(pixelClockDisplay(minute),displayTime(game));
 }
 assert.equal(pixelClockDisplay(Number.NaN),"--:--");
 assert.equal(pixelClockBrightness(659),"day");
 assert.equal(pixelClockBrightness(660),"closing");
 assert.equal(pixelClockBrightness(720),"day");
});
test("clock requires backend-verified ownership, is togglable and unlocks in 2000",()=>{
 setVerifiedCosmetics([]);
 assert.equal(cosmeticAvailable("pixel-led-clock",2030),false);
 setVerifiedCosmetics(["pixel-led-clock"]);
 assert.equal(cosmeticAvailable("pixel-led-clock",1999),false);
 assert.equal(cosmeticAvailable("pixel-led-clock",2000),true);
 assert.equal(toggleVerifiedCosmetic("pixel-led-clock",false),true);
 assert.equal(cosmeticAvailable("pixel-led-clock",2000),false);
 setVerifiedCosmetics([]);
});
test("clock draws finite bounded geometry and the same frame deterministically",()=>{
 const capture=seconds=>{
  const events=[];
  const canvas=new Proxy({},{
   get:(_obj,key)=> (...args)=>{
    if(key==="transform"||key==="fillRect"){
     assert.ok(args.every(Number.isFinite));
     events.push([key,...args]);
    }
   },set:()=>true
  });
  drawPixelClock(canvas,{zoom:1,originX:100,originY:200},{x:1,y:1},154,seconds);
  assert.ok(events.length>=30);
  assert.ok(events.length<=60);
  return JSON.stringify(events);
 };
 assert.equal(capture(1),capture(1));
 assert.equal(capture(1),capture(2));
});
