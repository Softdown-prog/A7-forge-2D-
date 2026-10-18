import test from "node:test";
import assert from "node:assert/strict";
import {pcActivityForSession,pcScreenFrame,drawPcScreenActivity} from "../dist/js/render/pcScreenActivities.js";
import {createGame} from "../dist/js/sim/engine.js";
import {serializeSave} from "../dist/js/sim/saveTransfer.js";
const kinds=["game","video","browser","chat","music","editor"];
test("six user activities appear across stations while staying stable per session",()=>{
 const all=new Set();
 for(let id=1;id<250;id++)for(let pc=0;pc<4;pc++){
  const a=pcActivityForSession(id,pc,2022);
  all.add(a);assert.equal(a,pcActivityForSession(id,pc,2022));
 }
 assert.deepEqual([...all].sort(),[...kinds].sort());
});
test("browser and online video respect the year and never consume simulation RNG",()=>{
 for(let id=1;id<=300;id++){
  assert.notEqual(pcActivityForSession(id,0,1998),"video");
  assert.ok(kinds.includes(pcActivityForSession(id,0,2020)));
 }
 const s=createGame(1007,"historical");
 // O envelope de exportação contém exportedAt, que varia a cada chamada.
 // Comparar somente o estado preserva a garantia contra mutação/RNG.
 const before=JSON.parse(serializeSave(s)).state;
 for(let i=0;i<1000;i++)pcActivityForSession(i,i%3,2025);
 const after=JSON.parse(serializeSave(s)).state;
 assert.deepEqual(after,before,"screen choice must not modify or randomize save");
});
test("2.5Hz discretization ensures time stability and no per-frame redraw",()=>{
 assert.equal(pcScreenFrame(0),0);assert.equal(pcScreenFrame(.30),0);
 assert.equal(pcScreenFrame(.399),0);assert.equal(pcScreenFrame(.40),1);
 assert.equal(pcScreenFrame(.79),1);assert.equal(pcScreenFrame(.80),2);
 assert.equal(pcScreenFrame(Number.NaN),0);
});
test("every 2D activity uses bounded rectangles and visibly animates",()=>{
 for(const kind of kinds){
  const sample=frame=>{
   const rectangles=[];
   drawPcScreenActivity((x,y,w,h,color)=>{
    assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1+1e-10&&y+h<=1+1e-10);
    assert.match(color,/^#|^rgba/);
    rectangles.push([x,y,w,h,color]);
   },kind,frame);
   assert.ok(rectangles.length>=14,"empty "+kind);
   assert.ok(rectangles.length<=65,"too much per frame "+kind+": "+rectangles.length);
   return JSON.stringify(rectangles);
  };
  assert.equal(sample(3),sample(3),"deterministic "+kind);
  const frames=[0,4,8,12,15].map(sample);
  assert.ok(new Set(frames).size>1,"no screen movement: "+kind);
 }
});
