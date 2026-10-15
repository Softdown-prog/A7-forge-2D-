import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {employeeHired,employeeDailyWage,employeeMonthlyWage,hireEmployee,dismissEmployee,accrueEmployeeDay} from "../dist/js/sim/staff.js";
import {addWaste,dispatchHiredStaff,requestCleaning,startRepair} from "../dist/js/sim/services.js";
import {monthlyBills} from "../dist/js/sim/economy.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";

test("um contrato remunera cada dia uma única vez, inclusive ao recontratar",()=>{
 const s=createGame(),cash=s.cash;
 assert.equal(employeeMonthlyWage(s,"cleaner"),210);
 assert.equal(employeeDailyWage(s,"cleaner"),7);
 assert.equal(hireEmployee(s,"cleaner").ok,true);
 assert.equal(employeeHired(s,"cleaner"),true);
 assert.equal(s.cash,cash);
 assert.equal(s.employeePayrollAccrued,7);
 assert.equal(hireEmployee(s,"cleaner").ok,false);
 accrueEmployeeDay(s);
 assert.equal(s.employeePayrollAccrued,7);
 assert.equal(dismissEmployee(s,"cleaner").ok,true);
 assert.equal(dismissEmployee(s,"cleaner").ok,false);
 assert.equal(hireEmployee(s,"cleaner").ok,true);
 assert.equal(s.employeePayrollAccrued,7);
 dismissEmployee(s,"cleaner");
 s.totalMinutes=DAY_MINUTES;
 accrueEmployeeDay(s);
 assert.equal(s.employeePayrollAccrued,7);
 hireEmployee(s,"cleaner");
 assert.equal(s.employeePayrollAccrued,14);
});
test("salários são cobrados uma vez no mês; a diária do dia 31 fica no mês seguinte",()=>{
 const s=createGame();
 hireEmployee(s,"cleaner");hireEmployee(s,"technician");
 assert.equal(s.employeePayrollAccrued,18);
 for(let d=2;d<=30;d++){s.totalMinutes=(d-1)*DAY_MINUTES;accrueEmployeeDay(s);}
 assert.equal(s.employeePayrollAccrued,540);
 const bill=monthlyBills({...s,totalMinutes:30*DAY_MINUTES-1});
 assert.equal(bill-monthlyBills({...s,employeePayrollAccrued:0}),540);
 s.totalMinutes=30*DAY_MINUTES-1;
 const cash=s.cash;
 stepGame(s,1);
 assert.equal(s.cash,cash-bill);
 assert.equal(s.employeePayrollAccrued,18);
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
 assert.deepEqual(loaded.employeeLastAccruedDay,{cleaner:1,technician:1});
 assert.equal(loaded.employeePayrollAccrued,18);
 const old=createGame();assert.equal(isValidSave(old),true);
 assert.equal(employeeHired(old,"cleaner"),false);
 for(const invalid of [{employeePayrollAccrued:-1},{employeePayrollAccrued:NaN},{employeeLastAccruedDay:{cleaner:5}},{employees:{cleaner:"yes"}},{employeePayrollAccrued:1234567890}]){
  assert.equal(isValidSave({...s,...invalid}),false);
 }
});
