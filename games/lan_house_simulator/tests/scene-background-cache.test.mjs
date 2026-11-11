import test from "node:test";
import assert from "node:assert/strict";
import {RoomBackgroundCache,paintRoomBackground} from "../dist/js/render/scene/background.js";
import {createGame} from "../dist/js/sim/engine.js";
import {cameraForGame} from "../dist/js/render/isometric.js";
import {roomBounds} from "../dist/js/sim/room.js";

function recordingContext(){
 const calls=[];
 const gradient=()=>({addColorStop:(...args)=>calls.push(["stop",...args])});
 const state={globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const ctx=new Proxy(state,{
  get(target,key){
   if(key in target)return target[key];
   if(key==="createLinearGradient"||key==="createRadialGradient")
    return (...args)=>{calls.push([key,...args]);return gradient();};
   return (...args)=>{calls.push([key,...args]);};
  },
  set(target,key,value){target[key]=value;calls.push(["set",key,value]);return true;}
 });
 return {ctx,calls};
}

test("background fallback renders exactly the same canvas commands as the static painter",()=>{
 const s=createGame(),camera=cameraForGame(s),bounds=roomBounds(s);
 const a=recordingContext(),b=recordingContext();
 const before=JSON.stringify(s);
 paintRoomBackground(a.ctx,s,camera,bounds,1000,610);
 const cache=new RoomBackgroundCache();
 cache.draw(b.ctx,s,camera,bounds,1000,610);
 assert.deepEqual(b.calls,a.calls);
 assert.equal(JSON.stringify(s),before,"rendering must not mutate the game");
});

test("background cache reuses its bitmap and invalidates when posters change",()=>{
 const s=createGame(),camera=cameraForGame(s),bounds=roomBounds(s);
 const live=recordingContext(),buffer=recordingContext();
 const canvas={width:0,height:0,getContext:()=>buffer.ctx};
 const previous=Object.getOwnPropertyDescriptor(globalThis,"document");
 let created=0;
 Object.defineProperty(globalThis,"document",{
  configurable:true,value:{createElement(tag){
   assert.equal(tag,"canvas");created++;return canvas;
  }}
 });
 try {
  const cache=new RoomBackgroundCache();
  cache.draw(live.ctx,s,camera,bounds,1000,610);
  const paintedOnce=buffer.calls.length;
  assert.ok(paintedOnce>100,"room background was actually painted");
  assert.deepEqual([canvas.width,canvas.height],[1000,610]);
  cache.draw(live.ctx,s,camera,bounds,1000,610);
  assert.equal(buffer.calls.length,paintedOnce,"same background key must reuse its bitmap");
  s.furniture.poster=(s.furniture.poster??0)+1;
  cache.draw(live.ctx,s,camera,bounds,1000,610);
  assert.ok(buffer.calls.length>paintedOnce,"new poster must invalidate the background");
  assert.equal(created,1,"cache retains a single canvas");
  assert.equal(live.calls.filter(call=>call[0]==="drawImage").length,3);
 } finally {
  if(previous)Object.defineProperty(globalThis,"document",previous);
  else delete globalThis.document;
 }
});
