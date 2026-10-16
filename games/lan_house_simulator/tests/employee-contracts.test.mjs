import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {employeeHired,employeeDailyWage,employeeMonthlyWage,hireEmployee,dismissEmployee,accrueEmployeeDay} from "../dist/js/sim/staff.js";
import {addWaste,dispatchHiredStaff,requestCleaning,startRepair} from "../dist/js/sim/services.js";
import {monthlyBills} from "../dist/js/sim/economy.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

test("contratação mensal sem chamados não gera diária, inclusive após recontratação",()=>{
 const s=createGame(),cash=s.cash;
 assert.equal(employeeMonthlyWage(s,"cleaner"),210);
 assert.equal(employeeDailyWage(s,"cleaner"),7);
 assert.equal(hireEmployee(s,"cleaner").ok,true);
 assert.equal(employeeHired(s,"cleaner"),true);
 assert.equal(s.cash,cash);
 assert.equal(s.employeePayrollAccrued??0,0);
 assert.equal(hireEmployee(s,"cleaner").ok,false);
 accrueEmployeeDay(s);
 assert.equal(s.employeePayrollAccrued??0,0);
 assert.equal(dismissEmployee(s,"cleaner").ok,true);
 assert.equal(dismissEmployee(s,"cleaner").ok,false);
 assert.equal(hireEmployee(s,"cleaner").ok,true);
 assert.equal(s.employeePayrollAccrued??0,0);
 s.pcPoweredOff=[true,true,true];
 stepGame(s,3*DAY_MINUTES);
 assert.equal(s.employeePayrollAccrued??0,0);
 assert.equal(s.employeeWorkedDays?.cleaner??0,0);
});
test("chamados reais acumulam diária uma vez; fechamento paga só atendimento e reinicia período",()=>{
 const s=createGame();s.pcPoweredOff=[true,true,true];
 hireEmployee(s,"cleaner");hireEmployee(s,"technician");
 s.totalMinutes=29*DAY_MINUTES;
 s.binFill=[80,0];s.pcWear=[100,0,0];
 dispatchHiredStaff(s);
 assert.equal(s.employeePayrollAccrued,18);
 assert.deepEqual(s.employeeWorkedDays,{cleaner:1,technician:1});
 const wage=monthlyBills({...s,totalMinutes:30*DAY_MINUTES-1})-
  monthlyBills({...s,employeePayrollAccrued:0,totalMinutes:30*DAY_MINUTES-1});
 assert.equal(wage,18);
 const snapshot=s.employeePayrollAccrued;
 dispatchHiredStaff(s);accrueEmployeeDay(s);
 assert.equal(s.employeePayrollAccrued,snapshot);
 // Mantém uma visita contratada atravessando o último dia.
 s.cleaningJob.phase="working";s.repairJobs[0].phase="working";
 s.cleaningJob.progress=0;s.repairJobs[0].progress=0;
 s.totalMinutes=30*DAY_MINUTES-1;s.energyAccrued=0;
 const bill=monthlyBills({...s,totalMinutes:30*DAY_MINUTES-1});
 const cash=s.cash;
 stepGame(s,1);
 assert.equal(s.cash,cash-bill);
 assert.equal(s.employeePayrollAccrued,18,"dia 31 deve entrar na folha do mês novo");
 assert.deepEqual(s.employeeWorkedDays,{cleaner:1,technician:1});
 assert.equal(monthlyBills(s)-monthlyBills({...s,employeePayrollAccrued:0}),18);
});
test("faxineiro contratado limpa lixeira cheia sem taxa por visita",()=>{
 const s=createGame();s.pcPoweredOff=[true,true,true];hireEmployee(s,"cleaner");const cash=s.cash;
 addWaste(s,80);
 stepGame(s,1);
 assert.ok(s.cleaningJob);
 assert.equal(s.cash,cash);
 assert.equal(requestCleaning(s).ok,false);
 for(let i=0;i<300&&s.cleaningJob;i++)stepGame(s,1);
 assert.equal(s.cleaningJob,undefined);
 assert.ok(s.binFill.every(n=>n<5));
 assert.equal(s.cash,cash);
});
test("técnico contratado repara uma máquina por vez sem taxa de chamado",()=>{
 const s=createGame();s.pcPoweredOff=[true,true,true];hireEmployee(s,"technician");const cash=s.cash;
 s.pcWear=[100,100,0];
 dispatchHiredStaff(s);
 assert.equal(s.repairJobs?.length,1);
 assert.equal(s.repairJobs?.[0].pc,0);
 assert.equal(startRepair(s,1).ok,false);
 for(let i=0;i<600&&s.pcWear[1]===100;i++)stepGame(s,1);
 assert.equal(s.pcWear[0],0);
 assert.equal(s.pcWear[1],0);
 assert.equal(s.cash,cash);
});
test("técnico espera cliente sair antes de iniciar reparo",()=>{
 const s=createGame();hireEmployee(s,"technician");
 s.pcWear=[100,0,0];s.customers=[{pcIndex:0,stage:"using"}];
 dispatchHiredStaff(s);
 assert.equal(s.repairJobs?.length??0,0);
 s.customers=[];
 dispatchHiredStaff(s);
 assert.equal(s.repairJobs?.[0].pc,0);
});
test("visitas avulsas permanecem cobradas e não são chamadas automaticamente",()=>{
 const s=createGame(),cash=s.cash;
 addWaste(s,40);dispatchHiredStaff(s);
 assert.equal(s.cleaningJob,undefined);
 assert.equal(requestCleaning(s).ok,true);
 assert.equal(s.cash,cash-55);
 const t=createGame(),before=t.cash;t.pcWear=[40,0,0];
 assert.equal(startRepair(t,0).ok,true);
 assert.equal(t.cash,before-48);
});
test("contratos persistem no save JSON e importações antigas continuam válidas",()=>{
 const s=createGame(4,"historical");
 hireEmployee(s,"cleaner");hireEmployee(s,"technician");
 const loaded=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(loaded),true);
 assert.deepEqual(loaded.employees,{cleaner:true,technician:true});
 assert.equal(loaded.employeeLastAccruedDay,undefined);
 assert.equal(loaded.employeePayrollAccrued,undefined);
 const active=structuredClone(loaded);
 active.binFill=[80,0];dispatchHiredStaff(active);
 assert.deepEqual(active.employeeLastAccruedDay,{cleaner:1});
 assert.deepEqual(active.employeeWorkedDays,{cleaner:1});
 assert.equal(active.employeePayrollAccrued,7);
 const old=createGame();assert.equal(isValidSave(old),true);
 assert.equal(employeeHired(old,"cleaner"),false);
 for(const invalid of [{employeePayrollAccrued:-1},{employeePayrollAccrued:NaN},{employeeLastAccruedDay:{cleaner:5}},{employees:{cleaner:"yes"}},{employeePayrollAccrued:1234567890},
  {employeeWorkedDays:{cleaner:-1}},{employeeWorkedDays:{technician:31}},
  {employeeWorkedDays:{cleaner:1.4}},{employeeWorkedDays:{spy:1}}]){
  assert.equal(isValidSave({...s,...invalid}),false);
 }
});
