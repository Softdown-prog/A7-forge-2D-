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
 const before=serializeSave(s),rng=s.rng,payroll=s.employeePayrollAccrued;
 for(let i=0;i<2000;i++){
  workerMotion("sweeping",i/30);workerMotion("repairing",i/30);
 }
 assert.equal(serializeSave(s),before);
 assert.equal(s.rng,rng);assert.equal(s.employeePayrollAccrued,payroll);
 assert.ok(parseImportedSave(before));
});
