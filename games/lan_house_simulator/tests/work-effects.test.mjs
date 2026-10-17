import test from "node:test";
import assert from "node:assert/strict";
import {workEffectFrame} from "../dist/js/render/workEffects.js";
import {workerMotion} from "../dist/js/render/workerMotion.js";
import {createGame} from "../dist/js/sim/engine.js";
import {serializeSave} from "../dist/js/sim/saveTransfer.js";

test("poeira acompanha o mesmo ciclo periódico da vassoura",()=>{
 for(const t of [0,.08,.19,.38,.65,1.3]){
  const dust=workEffectFrame("cleaner",t);
  const broom=workerMotion("sweeping",t);
  assert.equal(dust.pulse,broom.pulse);
  assert.equal(dust.drift,broom.pulse*5);
  assert.ok(dust.opacity>=.25&&dust.opacity<=.52);
 }
});
test("brilho acompanha o mesmo ciclo de reparo, sem flashes permanentes",()=>{
 const frames=Array.from({length:100},(_,i)=>workEffectFrame("technician",i/70));
 const pulses=Array.from({length:100},(_,i)=>workerMotion("repairing",i/70).pulse);
 for(let i=0;i<frames.length;i++){
  assert.equal(frames[i].pulse,pulses[i]);
  assert.ok(frames[i].glint>=0&&frames[i].glint<=1.00000001);
 }
 assert.ok(frames.some(f=>f.glint===0));
 assert.ok(frames.some(f=>f.glint>.9));
});
test("quadros de contato são determinísticos, sem criar custo nem RNG",()=>{
 const s=createGame(284);const prior=JSON.parse(serializeSave(s)).state;
 for(let i=0;i<800;i++){
  const time=i/30;
  for(const type of ["technician","cleaner"]){
   const a=workEffectFrame(type,time);
   const b=workEffectFrame(type,time);
   assert.deepEqual(a,b);
   assert.ok(Object.values(a).every(Number.isFinite));
  }
 }
 assert.deepEqual(JSON.parse(serializeSave(s)).state,prior);
});
