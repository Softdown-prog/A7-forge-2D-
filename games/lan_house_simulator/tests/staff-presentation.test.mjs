import assert from "node:assert/strict";
import test from "node:test";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {dispatchHiredStaff,tickServices,startRepair,requestCleaning} from "../dist/js/sim/services.js";
import {staffActivity,workPhaseLabel,workProgress} from "../dist/js/sim/staffPresentation.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

const starting=()=>{const s=createGame(39,"historical");s.cash=3000;s.pcPoweredOff=[true,true,true];return s;};

test("contratado ocioso e serviço avulso são diferenciados sem gerar salário",()=>{
 const s=starting(),cash=s.cash;
 assert.match(staffActivity(s,"cleaner").label,/Sem contrato/);
 assert.match(staffActivity(s,"technician").label,/Sem contrato/);
 assert.deepEqual([staffActivity(s,"cleaner").phase,staffActivity(s,"technician").phase],["idle","idle"]);
 hireEmployee(s,"cleaner");hireEmployee(s,"technician");
 assert.match(staffActivity(s,"cleaner").label,/aguardando necessidade/);
 assert.equal(staffActivity(s,"cleaner").percent,null);
 assert.equal(s.employeePayrollAccrued??0,0);
 assert.equal(s.cash,cash);
});
test("limpeza informa deslocamento, trabalho, porcentagem e saída sem incrementar folha",()=>{
 const s=starting();hireEmployee(s,"cleaner");s.binFill=[80,0];
 dispatchHiredStaff(s);
 assert.equal(staffActivity(s,"cleaner").phase,"arriving");
 assert.equal(staffActivity(s,"cleaner").label,"A caminho");
 assert.equal(s.employeePayrollAccrued,7);
 const before=s.employeePayrollAccrued;
 // Percorre as rotas reais, incluindo mudança de lixeira ao terminar a primeira.
 let worked=false,left=false;
 for(let minute=0;minute<500;minute++){
  tickServices(s);
  const status=staffActivity(s,"cleaner");
  if(status.phase==="working"){
   worked=true;
   assert.match(status.label,/Limpando · \d+%/);
   assert.ok(status.percent>=0&&status.percent<=100);
  }
  if(status.phase==="leaving"){left=true;assert.match(status.label,/Saindo/);}
  if(!s.cleaningJob)break;
 }
 assert.equal(worked,true);assert.equal(left,true);
 assert.equal(s.cleaningJob,undefined);
 assert.equal(staffActivity(s,"cleaner").phase,"idle");
 assert.ok(s.eventLog.some(t=>t.includes("iniciou a limpeza")));
 assert.ok(s.eventLog.some(t=>t.includes("deixou o salão limpo")));
 assert.equal(s.employeePayrollAccrued,before);
 assert.equal(isValidSave(s),true);
});
test("técnico indica PC correto e mantém progressão sem duplicar salário",()=>{
 const s=starting();hireEmployee(s,"technician");s.pcWear=[100,0,0];
 dispatchHiredStaff(s);
 assert.match(staffActivity(s,"technician").label,/A caminho · PC 1/);
 assert.equal(staffActivity(s,"technician").activeJobs,1);
 const original=s.employeePayrollAccrued;let working=false,leaving=false;
 for(let i=0;i<550;i++){
  tickServices(s);const st=staffActivity(s,"technician");
  if(st.phase==="working"){working=true;assert.match(st.label,/Reparando · PC 1 · \d+%/);}
  if(st.phase==="leaving"){leaving=true;assert.match(st.label,/Saindo · PC 1/);}
  if(!s.repairJobs?.length)break;
 }
 assert.equal(working,true);assert.equal(leaving,true);
 assert.equal(s.pcWear[0],0);assert.equal(s.employeePayrollAccrued,original);
 assert.equal(staffActivity(s,"technician").phase,"idle");
 assert.ok(s.eventLog.some(t=>t.includes("iniciou o reparo")));
 assert.equal(isValidSave(s),true);
});
test("prioridade para tarefa em execução e suporte a dois técnicos avulsos simultâneos",()=>{
 const s=starting();s.pcWear=[100,100,0];
 assert.equal(startRepair(s,0).ok,true);
 assert.equal(startRepair(s,1).ok,true);
 const active=s.repairJobs;assert.equal(active.length,2);
 active[0].phase="leaving";active[1].phase="working";active[1].progress=13;
 const st=staffActivity(s,"technician");
 assert.equal(st.phase,"working");
 assert.equal(st.activeJobs,2);
 assert.match(st.label,/Reparando · PC 2 · 54% · \+1 atendimento/);
 assert.equal(workProgress(active[0]),null);
 assert.equal(workPhaseLabel("technician",active[0]),"Saindo");
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("novo indicador e efeitos gráficos são de leitura, não mudam o estado nem o RNG",()=>{
 const s=starting();s.binFill=[80,0];hireEmployee(s,"cleaner");requestCleaning(s);
 const before=serializeSave(s),rng=s.rng,cash=s.cash,paid=s.employeePayrollAccrued;
 for(let i=0;i<90;i++){
  staffActivity(s,"cleaner");staffActivity(s,"technician");
  workProgress(s.cleaningJob);workPhaseLabel("cleaner",s.cleaningJob);
 }
 assert.equal(serializeSave(s),before);
 assert.equal(s.rng,rng);assert.equal(s.cash,cash);assert.equal(s.employeePayrollAccrued,paid);
});
