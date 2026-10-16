import type {GameState,Result} from "./types.js";
import {DAY_MINUTES} from "./types.js";
import {isHistorical,priceIndex,yearFromMinutes} from "./historicalEconomy.js";
export type EmployeeRole="cleaner"|"technician";
const ROLES:readonly EmployeeRole[]=["cleaner","technician"];
/** Valores fictícios de balanceamento de 1998, não salários históricos. */
export const EMPLOYEE_MONTHLY_WAGE_1998={cleaner:210,technician:330} as const;
const cents=(n:number)=>Math.round(n*100)/100;
const dayNumber=(s:Pick<GameState,"totalMinutes">)=>Math.floor(s.totalMinutes/DAY_MINUTES)+1;
export function employeeHired(s:Partial<GameState>,role:EmployeeRole):boolean{return s.employees?.[role]===true;}
export function employeeMonthlyWage(s:Pick<GameState,"totalMinutes"|"economyVersion">,role:EmployeeRole):number{
 return cents(EMPLOYEE_MONTHLY_WAGE_1998[role]*(isHistorical(s)?priceIndex(yearFromMinutes(s.totalMinutes)):1));
}
export function employeeDailyWage(s:Pick<GameState,"totalMinutes"|"economyVersion">,role:EmployeeRole):number{
 return cents(employeeMonthlyWage(s,role)/30);
}
/** Um dia só é pago se houve visita de trabalho coberta pelo contrato.
 * Inclui deslocamento para/de um serviço; nunca remunera simples disponibilidade.
 * Jobs antigos sem marcação continuam compatíveis quando o empregado é contratado.
 * O registro do último dia também evita repetir uma diária após save ou recontratação. */
export function accrueEmployeeDay(s:GameState):void{
 const today=dayNumber(s);
 for(const role of ROLES){
  if(!employeeHired(s,role)||s.employeeLastAccruedDay?.[role]===today)continue;
  const jobs=role==="cleaner"?(s.cleaningJob?[s.cleaningJob]:[]):(s.repairJobs??[]);
  if(!jobs.some(job=>job.coveredByContract??true))continue;
  s.employeeLastAccruedDay={...(s.employeeLastAccruedDay??{}),[role]:today};
  s.employeePayrollAccrued=cents((s.employeePayrollAccrued??0)+employeeDailyWage(s,role));
  s.employeeWorkedDays={...(s.employeeWorkedDays??{}),
   [role]:(s.employeeWorkedDays?.[role]??0)+1};
 }
}
export function hireEmployee(s:GameState,role:EmployeeRole):Result{
 if(employeeHired(s,role))return {ok:false,message:"Esse profissional já está contratado."};
 s.employees={...(s.employees??{}),[role]:true};
 return {ok:true,message:(role==="cleaner"?"Faxineiro":"Técnico")+" contratado por mês. R$ "+employeeDailyWage(s,role).toFixed(2)+"/dia efetivamente trabalhado; sem taxa por dia ocioso. Cobrança no fechamento mensal."};
}
export function dismissEmployee(s:GameState,role:EmployeeRole):Result{
 if(!employeeHired(s,role))return {ok:false,message:"Esse profissional não está contratado."};
 s.employees={...(s.employees??{}),[role]:false};
 return {ok:true,message:(role==="cleaner"?"Faxineiro":"Técnico")+" dispensado. As diárias já trabalhadas serão cobradas no fechamento do mês."};
}
export function validEmployeeState(s:Partial<GameState>):boolean{
 if(s.employees!==undefined){
  if(!s.employees||typeof s.employees!=="object"||Array.isArray(s.employees)||
     Object.keys(s.employees).some(k=>!ROLES.includes(k as EmployeeRole))||
     ROLES.some(k=>s.employees?.[k]!==undefined&&typeof s.employees[k]!=="boolean"))return false;
 }
 if(s.employeeLastAccruedDay!==undefined){
  if(!s.employeeLastAccruedDay||typeof s.employeeLastAccruedDay!=="object"||Array.isArray(s.employeeLastAccruedDay)||
     Object.keys(s.employeeLastAccruedDay).some(k=>!ROLES.includes(k as EmployeeRole))||
     !Number.isFinite(s.totalMinutes))return false;
  const today=dayNumber(s as GameState);
  if(ROLES.some(k=>{const n=s.employeeLastAccruedDay?.[k];return n!==undefined&&(!Number.isInteger(n)||n<1||n>today);}))return false;
 }
 const worked=s.employeeWorkedDays;
 if(worked!==undefined){
  if(!worked||typeof worked!=="object"||Array.isArray(worked)||
    Object.keys(worked).some(k=>!ROLES.includes(k as EmployeeRole))||
    ROLES.some(k=>{const n=worked[k];return n!==undefined&&(!Number.isInteger(n)||n<0||n>30);}))return false;
 }
 if(s.cleaningJob?.coveredByContract!==undefined&&typeof s.cleaningJob.coveredByContract!=="boolean")return false;
 if(Array.isArray(s.repairJobs)&&s.repairJobs.some(j=>j?.coveredByContract!==undefined&&typeof j.coveredByContract!=="boolean"))return false;
 const payroll=s.employeePayrollAccrued;
 return payroll===undefined||(Number.isFinite(payroll)&&payroll>=0&&payroll<=1e9&&Math.abs(payroll*100-Math.round(payroll*100))<1e-5);
}
