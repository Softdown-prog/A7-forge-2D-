import test from "node:test";
import assert from "node:assert/strict";
import {workerMotion} from "../dist/js/render/workerMotion.js";
import {createGame} from "../dist/js/sim/engine.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {dispatchHiredStaff} from "../dist/js/sim/services.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("animações alteram mãos e ferramenta no tempo, mas mantêm pés ancorados no mundo",()=>{
 for(const role of ["sweeping","repairing"]){
  const frames=[0,.16,.3,.6,.9,1.25].map(t=>workerMotion(role,t));
  assert.deepEqual(frames[0],workerMotion(role,0),"mesma receita deve renderizar a mesma pose");
  assert.ok(new Set(frames.map(f=>f.nearHand.x.toFixed(2)+"/"+f.nearHand.y.toFixed(2))).size>=4);
  assert.ok(new Set(frames.map(f=>f.toolTip.x.toFixed(2)+"/"+f.toolTip.y.toFixed(2))).size>=4);
  for(const frame of frames){
   assert.ok(Number.isFinite(frame.pulse)&&Math.abs(frame.pulse)<=1);
   for(const key of ["nearHand","farHand","toolTip"]){
    assert.ok(Number.isFinite(frame[key].x)&&Number.isFinite(frame[key].y));
    assert.ok(frame[key].y<3&&frame[key].y>-50,"ferramenta não invade a cabeça nem salta do chão");
   }
  }
 }
});
test("amplitudes da vassoura são maiores que as da chave de fenda",()=>{
 const times=Array.from({length:120},(_,i)=>i/40);
 const sweep=times.map(t=>workerMotion("sweeping",t).toolTip.x);
 const repair=times.map(t=>workerMotion("repairing",t).toolTip.x);
 assert.ok(Math.max(...sweep)-Math.min(...sweep)>20);
 assert.ok(Math.max(...repair)-Math.min(...repair)<6);
});
test("animação é apenas visual e não gera nova diária, RNG nem mutação de save",()=>{
 const s=createGame(99,"historical");
 s.cash=3000;s.binFill=[80,0];s.pcWear=[100,0,0];
 hireEmployee(s,"cleaner");hireEmployee(s,"technician");dispatchHiredStaff(s);
 const saved=serializeSave(s),before=JSON.parse(saved).state,rng=s.rng,payroll=s.employeePayrollAccrued;
 for(let i=0;i<2000;i++){
  workerMotion("sweeping",i/30);workerMotion("repairing",i/30);
 }
 assert.deepEqual(JSON.parse(serializeSave(s)).state,before);
 assert.equal(s.rng,rng);assert.equal(s.employeePayrollAccrued,payroll);
 assert.ok(parseImportedSave(saved));
});

import {SceneMotion} from "../dist/js/render/motion.js";
import {screenViewForMotion} from "../dist/js/render/direction.js";
import {startRepair,requestCleaning,tickServices} from "../dist/js/sim/services.js";
import {walkPhase} from "../dist/js/render/walkCycle.js";

test("funcionários caminham conforme deslocamento real, com direção isométrica e interpolação",()=>{
 const s=createGame(85,"historical");s.cash=4000;s.pcPoweredOff=[true,true,true];
 s.pcWear=[100,0,0];s.binFill=[90,0];
 assert.equal(startRepair(s,0).ok,true);
 assert.equal(requestCleaning(s).ok,true);
 const motion=new SceneMotion();
 motion.capture(s);
 const origin=structuredClone(s),save=serializeSave(s);
 tickServices(s);
 for(const [oldJob,currentJob,sampledJob] of [
  [origin.repairJobs[0],s.repairJobs[0],motion.sample(s,.5).repairJobs[0]],
  [origin.cleaningJob,s.cleaningJob,motion.sample(s,.5).cleaningJob]
 ]){
  assert.ok(sampledJob.renderMotion.moving,"deve caminhar apenas se realmente avançou");
  const dx=currentJob.x-oldJob.x,dy=currentJob.y-oldJob.y;
  const moved=Math.hypot(dx,dy);
  assert.ok(moved>.001&&moved<.8);
  assert.equal(sampledJob.renderMotion.view,screenViewForMotion(dx,dy));
  assert.ok(Math.abs(sampledJob.x-(oldJob.x+dx*.5))<1e-7);
  assert.ok(Math.abs(sampledJob.y-(oldJob.y+dy*.5))<1e-7);
  const length=Math.hypot((dx-dy)*64,(dx+dy)*32);
  assert.ok(Math.abs(sampledJob.renderMotion.distance-length*.5)<1e-7);
  assert.ok(Math.abs(walkPhase(sampledJob.renderMotion.distance)-
   walkPhase(length*.5))<1e-7);
 }
 assert.ok(save);
 const first=motion.sample(s,.4),again=motion.sample(s,.4);
 assert.deepEqual(first.repairJobs[0].renderMotion,again.repairJobs[0].renderMotion);
 assert.deepEqual(first.cleaningJob.renderMotion,again.cleaningJob.renderMotion);
 motion.capture(s);
 const stationary=motion.sample(s,.75);
 assert.equal(stationary.repairJobs[0].renderMotion.moving,false);
 assert.equal(stationary.cleaningJob.renderMotion.moving,false);
 assert.ok(stationary.repairJobs[0].renderMotion.distance>0);
 assert.ok(stationary.cleaningJob.renderMotion.distance>0);
 assert.ok(Number.isFinite(s.cash));
 assert.equal(parseImportedSave(serializeSave(s)).repairJobs?.[0]?.renderMotion,undefined);
});

test("serviços em andamento mantêm gestos, sem falsos passos ou deslocamento por paredes",()=>{
 const s=createGame(24,"historical");s.cash=3000;s.pcPoweredOff=[true,true,true];
 s.pcWear=[100,0,0];s.binFill=[85,0];
 assert.equal(startRepair(s,0).ok,true);
 assert.equal(requestCleaning(s).ok,true);
 const motion=new SceneMotion();motion.capture(s);
 const old=structuredClone(s);
 for(const j of s.repairJobs)Object.assign(j,{phase:"working",moving:false,progress:3});
 Object.assign(s.cleaningJob,{phase:"working",moving:false,progress:4});
 const drawn=motion.sample(s,1);
 assert.equal(drawn.repairJobs[0].phase,"working");
 assert.equal(drawn.cleaningJob.phase,"working");
 assert.equal(drawn.repairJobs[0].renderMotion.moving,false);
 assert.equal(drawn.cleaningJob.renderMotion.moving,false);
 assert.deepEqual([drawn.repairJobs[0].x,drawn.repairJobs[0].y],[old.repairJobs[0].x,old.repairJobs[0].y]);
 assert.equal(s.repairJobs[0].renderMotion,undefined,"estado real não deve conter dados de renderização");
 const jumped=structuredClone(s);
 jumped.repairJobs[0].phase="leaving";
 jumped.repairJobs[0].x+=2;
 assert.equal(motion.sample(jumped,.5).repairJobs[0].renderMotion.moving,false,
  "deslocamentos inválidos não podem animar passos");
 motion.reset();
 assert.equal(motion.sample(s,.5).cleaningJob.renderMotion.distance,0);
 assert.equal(motion.sample(s,.5).repairJobs[0].renderMotion.distance,0);
});
