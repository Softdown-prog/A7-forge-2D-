import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,pcPosition,isValidSave} from "../dist/js/sim/engine.js";
import {startRepair,requestCleaning,dispatchHiredStaff,tickServices} from "../dist/js/sim/services.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {workerRoute} from "../dist/js/sim/workerNavigation.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const enclosedBin=()=>{
 const s=createGame(123,"historical");s.cash=4000;s.pcPoweredOff=[true,true,true];
 // Cerco da lixeira #1: corredor da entrada e segunda lixeira continuam livres.
 s.interiorWalls=[
  {axis:"x",x:1,y:3},{axis:"x",x:1,y:4},
  {axis:"y",x:1,y:3},{axis:"y",x:2,y:3}
 ];
 return s;
};
test("visita avulsa inacessível é recusada ANTES da cobrança ou do RNG",()=>{
 const s=enclosedBin();s.binFill=[80,0];
 const cash=s.cash,expenses=s.expenses,rng=s.rng;
 const response=requestCleaning(s);
 assert.equal(response.ok,false);
 assert.match(response.message,/passagem|reorganize/);
 assert.equal(s.cleaningJob,undefined);
 assert.equal(s.cash,cash);assert.equal(s.expenses,expenses);assert.equal(s.rng,rng);
 assert.equal(s.employeePayrollAccrued??0,0);
});
test("contratado inacessível não gera diária nem visita fantasma; pode ser atendido depois de abrir passagem",()=>{
 const s=enclosedBin();s.binFill=[80,0];hireEmployee(s,"cleaner");
 dispatchHiredStaff(s);
 assert.equal(s.cleaningJob,undefined);
 assert.equal(s.employeeWorkedDays?.cleaner??0,0);
 assert.equal(s.employeePayrollAccrued??0,0);
 // Abre a face leste do cômodo; o restante do serviço volta a funcionar.
 s.interiorWalls=s.interiorWalls.filter(w=>!(w.axis==="y"&&w.x===2&&w.y===3));
 dispatchHiredStaff(s);
 assert.equal(s.cleaningJob?.binIndex,0);
 assert.equal(s.employeePayrollAccrued,7);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("limpa a lixeira alcançável sem atravessar a divisória para buscar a outra",()=>{
 const s=enclosedBin();s.binFill=[80,20];
 assert.equal(requestCleaning(s).ok,true);
 assert.equal(s.cleaningJob.binIndex,1);
 const paid=s.cash;
 for(let i=0;i<230&&s.cleaningJob;i++)tickServices(s);
 assert.equal(s.cleaningJob,undefined,"o funcionário deve conseguir deixar o salão");
 assert.equal(s.binFill[1],0);
 assert.equal(s.binFill[0],80,"não pode recolher lixo através da parede");
 assert.equal(s.cash,paid,"não deve gerar taxa repetida no segundo atendimento");
 assert.ok(s.eventLog.some(e=>/sem passagem/.test(e)));
});
test("reparo bloqueado recusa o atendimento sem custo nem estação fantasma",()=>{
 const s=createGame(123);s.cash=4000;s.pcWear=[100,0,0];
 // PC #1 está isolado: ponto de reparo dentro do cômodo.
 s.interiorWalls=[
  {axis:"x",x:2,y:1},{axis:"x",x:2,y:2},
  {axis:"y",x:2,y:1},{axis:"y",x:3,y:1}
 ];
 const response=startRepair(s,0);
 assert.equal(response.ok,false);
 assert.match(response.message,/passagem/);
 assert.equal(s.repairJobs?.length??0,0);
 assert.equal(s.cash,4000);
 assert.equal(s.employeePayrollAccrued??0,0);
 hireEmployee(s,"technician");
 dispatchHiredStaff(s);
 assert.equal(s.repairJobs?.length??0,0);
 assert.equal(s.employeePayrollAccrued??0,0);
});
test("salões sem divisórias preservam atendimentos de faxineiro e técnico",()=>{
 const s=createGame(12);s.cash=2000;s.binFill=[80,0];s.pcWear=[100,0,0];
 assert.ok(workerRoute(s,{x:7.5,y:5.35},{x:1.1,y:3.1}));
 assert.equal(requestCleaning(s).ok,true);
 assert.equal(startRepair(s,0).ok,true);
 assert.ok(s.cleaningJob);assert.equal(s.repairJobs.length,1);
});
