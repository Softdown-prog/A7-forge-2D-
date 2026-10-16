import assert from "node:assert/strict";
import test from "node:test";
import {createGame} from "../dist/js/sim/engine.js";
import {serviceAccessIssues} from "../dist/js/sim/serviceAccess.js";
import {requestCleaning,startRepair,dispatchHiredStaff} from "../dist/js/sim/services.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const isolated=()=>{
 const s=createGame(512,"historical");
 s.cash=4000;s.pcPoweredOff=[true,true,true];
 s.interiorWalls=[
  {axis:"x",x:1,y:3},{axis:"x",x:1,y:4},
  {axis:"y",x:1,y:3},{axis:"y",x:2,y:3}
 ];
 return s;
};
test("painel identifica lixeira isolada e não acusa a alcançável",()=>{
 const s=isolated();s.binFill=[80,20];
 const issues=serviceAccessIssues(s);
 assert.deepEqual(issues.map(x=>[x.kind,x.index,x.label]),[["bin",0,"Lixeira 1"]]);
 assert.equal(issues[0].point.x,1.1);
 assert.equal(issues[0].point.y,3.1);
 // Visita parcial continua permitida, sem atravessar a parede.
 assert.equal(requestCleaning(s).ok,true);
 assert.equal(s.cleaningJob.binIndex,1);
});
test("erro de acesso some quando abre passagem, sem alterar tempo nem economia",()=>{
 const s=isolated();s.binFill=[90,0];
 const start={cash:s.cash,rng:s.rng,expenses:s.expenses,minutes:s.totalMinutes};
 assert.equal(serviceAccessIssues(s).length,1);
 assert.equal(requestCleaning(s).ok,false);
 assert.equal(s.cash,start.cash);assert.equal(s.expenses,start.expenses);
 s.interiorWalls=s.interiorWalls.filter(w=>!(w.axis==="y"&&w.x===2&&w.y===3));
 assert.deepEqual(serviceAccessIssues(s),[]);
 assert.equal(s.rng,start.rng);assert.equal(s.totalMinutes,start.minutes);
});
test("destino de reparo bloqueado aparece só com desgaste e nenhum técnico atende",()=>{
 const s=createGame(312);s.cash=4000;
 s.interiorWalls=[
  {axis:"x",x:2,y:1},{axis:"x",x:2,y:2},
  {axis:"y",x:2,y:1},{axis:"y",x:3,y:1}
 ];
 assert.deepEqual(serviceAccessIssues(s),[]);
 s.pcWear=[100,0,0];
 const issue=serviceAccessIssues(s);
 assert.deepEqual(issue.map(x=>[x.kind,x.index,x.label]),[["pc",0,"PC 1"]]);
 const cash=s.cash;
 hireEmployee(s,"technician");dispatchHiredStaff(s);
 assert.equal(s.repairJobs?.length??0,0);
 assert.equal(s.cash,cash);assert.equal(s.employeePayrollAccrued??0,0);
 assert.equal(startRepair(s,0).ok,false);
});
test("diagnóstico não usa RNG nem modifica saves, caixa ou salários",()=>{
 const s=isolated();s.binFill=[80,20];s.pcWear=[0,35,0];
 const previous=JSON.parse(serializeSave(s)).state;
 for(let i=0;i<30;i++)serviceAccessIssues(s);
 assert.deepEqual(JSON.parse(serializeSave(s)).state,previous);
 // A geometria forçada acima serve apenas para isolar a lixeira;
 // ela não representa necessariamente uma planta aceita pelo validador geral.
 assert.deepEqual(serviceAccessIssues(JSON.parse(serializeSave(s)).state),serviceAccessIssues(s));
 const normal=createGame(14,"historical");normal.binFill=[80,0];
 assert.deepEqual(serviceAccessIssues(parseImportedSave(serializeSave(normal))),serviceAccessIssues(normal));
});
test("não anuncia bloqueio quando todos os destinos com demanda têm passagem",()=>{
 const s=createGame(12);s.binFill=[80,0];s.pcWear=[100,0,0];
 assert.deepEqual(serviceAccessIssues(s),[]);
});
