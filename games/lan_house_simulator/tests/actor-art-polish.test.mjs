import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {drawActor,edgeFor,actorStyleFor,actorHitbox} from "../dist/js/render/actorArt.js";
import {parseHex} from "../dist/js/render/color.js";

const KINDS=["regular","female","female-bob","female-ponytail","owner","clown","vampire","stitched-monster","rabbit","mouse-mascot","cleaner","technician","postman"];
const POSES=["idle","walking","sitting","standing-up","printing","copying","sweeping","repairing","delivering","receiving"];
const VIEWS=[undefined,"front","back","profile-left","profile-right","front-left","front-right","back-left","back-right"];
const luma=hex=>{const [r,g,b]=parseHex(hex);return r*.2126+g*.7152+b*.0722;};

/** Recording context: logs every call and property write so two draws can be compared. */
function recorder(){
 const log=[],gradient=()=>({addColorStop:(...a)=>log.push(["stop",...a])});
 const state={};
 const ctx=new Proxy(state,{
  get(t,k){
   if(k==="createRadialGradient"||k==="createLinearGradient")return (...a)=>{log.push([k,...a.map(v=>+v.toFixed(4))]);return gradient();};
   if(k==="measureText")return ()=>({width:10});
   if(k in t)return t[k];
   return (...a)=>log.push([k,...a.map(v=>typeof v==="number"?+v.toFixed(4):v)]);
  },
  set(t,k,v){t[k]=v;if(typeof v==="string"||typeof v==="number")log.push(["set",k,v]);return true;}
 });
 return {ctx,log};
}

test("selective outlines are a deterministic, darker tint of the fill they enclose",()=>{
 for(const fill of ["#358C94","#F4C949","#F8ECE9","#374A69","#BE6B57"]){
  const edge=edgeFor(fill);
  assert.match(edge,/^#[0-9a-f]{6}$/);
  assert.ok(luma(edge)<luma(fill),fill+" outline must be darker than its fill");
  assert.equal(edgeFor(fill),edge,"memoized and stable");
 }
 assert.notEqual(edgeFor("#F4C949"),edgeFor("#358C94"),"outline keeps the hue of what it encloses");
 assert.equal(edgeFor("rgba(255,255,255,.2)"),"#283449","translucent overlays keep the shared ink");
 assert.equal(edgeFor("transparent"),"#283449");
});
test("a light fill keeps a readable outline against the floor tones",()=>{
 const floor=luma("#c9c5a9");
 for(const fill of ["#F8ECE9","#FFF2EE","#F4E6DF","#EFB68F"])assert.ok(luma(edgeFor(fill))<floor-70,fill);
});
test("every costume, pose and screen view draws without throwing, with finite coordinates",()=>{
 for(const kind of KINDS)for(const pose of POSES)for(const screenView of VIEWS){
  const {ctx,log}=recorder();
  drawActor(ctx,{originX:100,originY:140,zoom:1.3},{x:0,y:0,kind,id:3,time:1.7,pose,screenView,walkDistance:pose==="walking"?11:undefined,transition:1,direction:"south",reaction:undefined});
  for(const entry of log)for(const v of entry.slice(1))if(typeof v==="number")assert.ok(Number.isFinite(v),kind+" "+pose+" "+screenView+" "+entry[0]);
  assert.ok(log.length>60,kind+" must paint a full figure");
 }
});
test("drawing is deterministic: identical input gives identical calls, as the sprite cache requires",()=>{
 for(const kind of KINDS){
  const a=recorder(),b=recorder(),actor={x:0,y:0,kind,id:7,time:2.4,pose:"walking",screenView:"front-left",walkDistance:13,direction:"south"};
  drawActor(a.ctx,{originX:80,originY:130,zoom:1},actor);drawActor(b.ctx,{originX:80,originY:130,zoom:1},{...actor});
  assert.deepEqual(a.log,b.log,kind);
 }
 const source=readFileSync(new URL("../src/render/actorArt.ts",import.meta.url),"utf8");
 assert.doesNotMatch(source,/Math\.random|Date\.now|performance\.now/,"no frame-dependent randomness in the rig");
 assert.doesNotMatch(source,/\b(fetch|new Image|drawImage|WebGLRenderingContext)\b/,"art stays procedural vector");
});
test("faces show sclera, iris and a glint for people, and glossy beads for the animal costumes",()=>{
 const fills=kind=>{const {ctx,log}=recorder();drawActor(ctx,{originX:100,originY:140,zoom:1},{x:0,y:0,kind,id:1,time:1,pose:"idle",screenView:"front",direction:"south"});return log.filter(e=>e[0]==="set"&&e[1]==="fillStyle").map(e=>String(e[2]).toLowerCase());};
 const person=fills("regular"),rabbit=fills("rabbit");
 assert.ok(person.includes("#f6eee2"),"people have a sclera");
 assert.ok(person.includes("#101826"),"and a pupil");
 assert.ok(!rabbit.includes("#f6eee2"),"the rabbit keeps a bead eye");
 assert.ok(rabbit.includes("#1f2a3c"));
});
test("palette, identity and the clickable owner area are unchanged by the visual pass",()=>{
 assert.deepEqual(actorStyleFor("owner",0),{shirt:"#428f79",dark:"#234f48",highlight:"#93c4a0",pants:"#344c54",hair:"#49342c",skin:"#E4AE86",trim:"#e5c18a"});
 assert.equal(actorStyleFor("regular",5).shirt,actorStyleFor("regular",1).shirt,"casual palettes still repeat every four ids");
 assert.deepEqual(actorHitbox({originX:500,originY:200,zoom:.86},3,2),actorHitbox({originX:500,originY:200,zoom:.86},3,2));
 const hit=actorHitbox({originX:0,originY:0,zoom:1},0,0);
 assert.deepEqual([hit.width,hit.height],[50,89]);
});

const callsFor=(kind,id,extra={})=>{const {ctx,log}=recorder();drawActor(ctx,{originX:100,originY:140,zoom:1},{x:0,y:0,kind,id,time:1,pose:"idle",direction:"south",...extra});return JSON.stringify(log);};
test("the four regular customers differ in hair and chest detail, and repeat every four ids",()=>{
 for(const direction of ["south","east","north","west"]){
  const looks=[0,1,2,3].map(id=>callsFor("regular",id,{direction}));
  assert.equal(new Set(looks).size,4,"four distinct drawings for "+direction);
  assert.equal(callsFor("regular",4,{direction}),looks[0],"id 4 is id 0 again");
  assert.equal(callsFor("regular",7,{direction}),looks[3],"id 7 is id 3 again");
 }
});
test("only regular customers get per-id extras; costumes keep one look per kind",()=>{
 for(const kind of ["clown","rabbit","vampire","owner","postman","cleaner"])
  assert.equal(callsFor(kind,1),callsFor(kind,2),kind+" is the same for any id");
});
test("the back of a person's head shows ears and hair strands, animal heads keep their plain back",()=>{
 const backEars=kind=>{const {ctx,log}=recorder();drawActor(ctx,{originX:100,originY:140,zoom:1},{x:0,y:0,kind,id:0,time:1,pose:"idle",direction:"north"});
  return log.filter(e=>e[0]==="ellipse"&&e[3]===2.3&&e[4]===3.8).length;};
 assert.equal(backEars("regular"),2,"two ears seen from behind");
 for(const kind of ["rabbit","mouse-mascot","clown","female-bob"])assert.equal(backEars(kind),0,kind+" keeps its plain back");
});
test("profile faces keep the mouth inside the chin and draw an open-path nose",()=>{
 const {ctx,log}=recorder();
 drawActor(ctx,{originX:100,originY:140,zoom:1},{x:0,y:0,kind:"regular",id:0,time:1,pose:"idle",direction:"east"});
 assert.ok(log.some(e=>e[0]==="bezierCurveTo"),"curved nose and mouth");
 assert.ok(!log.some(e=>e[0]==="lineTo"&&e[1]===15&&e[2]===-62),"the old beak triangle is gone");
});

test("in three-quarter views both eyes keep a visible iris (the far eye is narrower, never a black dot)",()=>{
 for(const screenView of ["front-left","front-right"])for(const kind of ["regular","owner","clown","vampire"]){
  const {ctx,log}=recorder();
  drawActor(ctx,{originX:100,originY:140,zoom:1},{x:0,y:0,kind,id:0,time:1,pose:"walking",direction:"south",screenView});
  const iris=kind==="vampire"?"#a23a52":kind==="clown"?"#3a7090":"#3d4d68";
  const radii=[];
  // ell() issues the ellipse first and then sets its fill colour.
  log.forEach((e,i)=>{if(e[0]==="set"&&e[1]==="fillStyle"&&e[2]===iris&&log[i-1]?.[0]==="ellipse")radii.push(log[i-1][3]);});
  assert.equal(radii.length,2,kind+" "+screenView+": two irises");
  assert.ok(Math.min(...radii)>=1,kind+" "+screenView+": far iris is at least 1 unit wide, got "+radii);
  assert.ok(Math.min(...radii)/Math.max(...radii)>.55,kind+" "+screenView+": the two eyes stay comparable");
 }
});
