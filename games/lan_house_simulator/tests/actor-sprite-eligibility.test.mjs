import test from "node:test";
import assert from "node:assert/strict";
import {actorSpriteEligible} from "../dist/js/render/actorSprites.js";
import {drawActor,OWNER_IDLE_RATE} from "../dist/js/render/actorArt.js";

function recorder(){
 const log=[],state={};
 const gradient=()=>({addColorStop:(...a)=>log.push(["stop",...a])});
 const ctx=new Proxy(state,{
  get(t,k){
   if(k==="createLinearGradient"||k==="createRadialGradient")return (...a)=>{log.push([k,...a]);return gradient();};
   if(k==="measureText")return ()=>({width:10});
   if(k in t)return t[k];
   return (...a)=>log.push([k,...a]);
  },
  set(t,k,v){t[k]=v;if(typeof v==="string"||typeof v==="number")log.push(["set",k,v]);return true;}
 });
 return {ctx,log};
}
const actor=(kind,extra={})=>({x:0,y:0,kind,id:0,time:1,pose:"idle",direction:"south",...extra});

test("regular customers keep their sprite eligibility",()=>{
 for(const pose of ["idle","walking","sitting"])assert.equal(actorSpriteEligible(actor("regular",{pose}),.86),true,pose);
 assert.equal(actorSpriteEligible(actor("regular",{pose:"sitting",transition:.5}),.86),false,"seat transitions stay live");
 assert.equal(actorSpriteEligible(actor("regular",{reaction:"win"}),.86),false);
 assert.equal(actorSpriteEligible(actor("regular",{premiumHeadset:true}),.86),false);
 assert.equal(actorSpriteEligible(actor("regular"),1.4),false,"zoomed in stays vector");
 assert.equal(actorSpriteEligible(actor("regular",{pose:"printing"}),.86),false);
});
test("the owner is served from frames only while idle; work, deliveries and the cyber costume stay live",()=>{
 assert.equal(actorSpriteEligible(actor("owner"),.86),true,"idle owner");
 for(const pose of ["printing","copying","receiving","delivering","walking","sitting"])
  assert.equal(actorSpriteEligible(actor("owner",{pose}),.86),false,pose);
 assert.equal(actorSpriteEligible(actor("owner",{premiumCyber:true}),.86),false,"cyber costume blinks on its own clock");
 assert.equal(actorSpriteEligible(actor("owner",{reaction:"loss"}),.86),false);
});
test("workers and the postman keep their continuous renderer",()=>{
 for(const kind of ["cleaner","technician","postman"])assert.equal(actorSpriteEligible(actor(kind),.86),false,kind);
});
test("the owner's idle animation is one exact loop: breathing and gesture share a single rate",()=>{
 const draw=time=>{const {ctx,log}=recorder();drawActor(ctx,{originX:100,originY:140,zoom:1},actor("owner",{time}));return log;};
 const same=(a,b)=>a.length===b.length&&a.every((e,i)=>e.length===b[i].length&&e.every((v,j)=>typeof v==="number"?Math.abs(v-b[i][j])<1e-6:v===b[i][j]));
 const period=Math.PI*2/OWNER_IDLE_RATE;
 for(const t of [.3,.7,1.9,3.3])assert.ok(same(draw(t),draw(t+period)),"time "+t+" repeats after one period");
 assert.ok(!same(draw(.3),draw(.3+period/4)),"and it does move inside the loop");
});
