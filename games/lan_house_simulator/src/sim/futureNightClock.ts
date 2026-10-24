/** Relógio civil do futuro encontro noturno, sem tocar em totalMinutes.
 * O fechamento mensal e os dias de 720 minutos continuam com o motor normal.
 * Contrato PURE: o motor noturno ainda NÃO o executa.
 */
import {campaignDate,weekdayIndex,weekdayName} from "./campaignWeek.js";
export const NIGHT_START_CIVIL_MINUTE=22*60;
export const NIGHT_FIRST_ARRIVAL_OFFSET=60; // 23:00 de sexta (referência de design)
export const NIGHT_MORNING_EXIT_OFFSET=540; // 07:00 de sábado (referência de design)
export const NIGHT_MAX_EXIT_OFFSET=600; // 08:00, margem apenas para dispersão

export function futureNightClock(fridayDay:number,elapsed:number){
 if(!Number.isInteger(fridayDay)||fridayDay<1||weekdayIndex(fridayDay)!==4)
  throw new RangeError("Um encontro oficial só pode começar numa sexta da campanha.");
 if(!Number.isInteger(elapsed)||elapsed<0||elapsed>NIGHT_MAX_EXIT_OFFSET)
  throw new RangeError("Minuto da madrugada inválido.");
 const civil=NIGHT_START_CIVIL_MINUTE+elapsed;
 const dateOffset=Math.floor(civil/1440);
 const calendarDay=fridayDay+dateOffset;
 const minute=civil%1440;
 return {
  fridayDay,calendarDay,elapsed,date:campaignDate(calendarDay),
  weekday:weekdayName(calendarDay),
  time:String(Math.floor(minute/60)).padStart(2,"0")+":"+
   String(minute%60).padStart(2,"0"),
  isSaturday:dateOffset===1
 };
}
