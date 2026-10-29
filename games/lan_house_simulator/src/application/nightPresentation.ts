/** Read-only night notifications shared by Canvas and DOM adapters. */
import { currentCampaignDay,weekdayIndex } from "../sim/campaignWeek.js";
import { NIGHT_MAX_EXIT_OFFSET,NIGHT_MORNING_EXIT_OFFSET } from "../sim/futureNightClock.js";
import type { GameState } from "../sim/types.js";
import { DAY_MINUTES } from "../sim/types.js";


export type NightPrizePresentation={
 fridayDay:number;winnerId:number;amount:number;elapsed:number;ageMinutes:number;
};

export function nightPrizePresentation(s:GameState):NightPrizePresentation|undefined{
 const n=s.nightMeetup,t=n?.tournament;
 if(!n||!t||!t.settled||n.phase!=="leaving"||
    n.elapsed<NIGHT_MORNING_EXIT_OFFSET||n.elapsed>NIGHT_MORNING_EXIT_OFFSET+10||
    t.winnerId===undefined||!n.paidIds.includes(t.winnerId)||
    (t.prizePaid===undefined||!Number.isFinite(t.prizePaid)||t.prizePaid<=0))return undefined;
 return {fridayDay:n.fridayDay,winnerId:t.winnerId,
  amount:t.prizePaid!,elapsed:n.elapsed,ageMinutes:n.elapsed-NIGHT_MORNING_EXIT_OFFSET};
}

export function prizeAmountText(amount:number):string{
 return "R$ "+amount.toFixed(2).replace(".",",");
}


export type NightReopeningPresentation={
 phase:"farewell"|"preparing"|"open"|"service"|"closing";
 title:string;details:string;fridayDay:number;
 remainingGuests:number;minutesUntilOpen:number;progress:number;
 /** Clientes de sábado presentes e clientes usando PCs — números do motor, não simulados. */
 customersNow?:number;atComputers?:number;
};

/** A placa das 10h dura 12 minutos; depois mostra os atendimentos
 * efetivos até meio-dia. Não força chegada e não assume que houve venda.
 */
export function nightReopeningPresentation(s:GameState):NightReopeningPresentation|undefined{
 const n=s.nightMeetup;
 if(n){
  if(n.phase!=="leaving"||n.elapsed<NIGHT_MORNING_EXIT_OFFSET||
      n.elapsed>=NIGHT_MAX_EXIT_OFFSET)return undefined;
  const remainingGuests=s.customers.filter(c=>c.nightMeetupDay===n.fridayDay).length;
  const until=NIGHT_MAX_EXIT_OFFSET-n.elapsed;
  const preparing=until<=30;
  return {
   phase:preparing?"preparing":"farewell",
   title:preparing?"PREPARANDO REABERTURA":"CORUJÃO ENCERRADO · 07H",
   details:preparing
    ?"Sábado, 10h: abertura em "+until+" min · "+remainingGuests+" amigo(s) no salão"
    :"Amigos voltando para casa · "+remainingGuests+" ainda no salão",
   fridayDay:n.fridayDay,remainingGuests,minutesUntilOpen:until,
   progress:(n.elapsed-NIGHT_MORNING_EXIT_OFFSET)/
     (NIGHT_MAX_EXIT_OFFSET-NIGHT_MORNING_EXIT_OFFSET)
  };
 }
 const last=s.lastNightMeetup;
 const minute=s.totalMinutes%DAY_MINUTES;
 if(!last||currentCampaignDay(s)!==last.fridayDay+1||
    weekdayIndex(last.fridayDay+1)!==5)return undefined;
 // Fechamento gradual é o mesmo do motor: 21h até as 22h de sábado.
 // Nada de expulsar personagens ou simular uma saída adicional.
 if(minute>=660){
  const current=s.customers.filter(c=>c.nightMeetupDay===undefined);
  const leaving=current.filter(c=>c.stage==="leaving").length;
  return {
   phase:"closing",title:"SÁBADO · ENCERRAMENTO",
   details:current.length+" cliente(s) no salão · "+leaving+" saindo pela porta",
   fridayDay:last.fridayDay,remainingGuests:current.length,
   minutesUntilOpen:0,progress:(minute-660)/60,
   customersNow:current.length,atComputers:current.filter(c=>c.stage==="using").length
  };
 }
 if(minute>120)return undefined;
 if(minute>12){
  const current=s.customers.filter(c=>c.nightMeetupDay===undefined);
  const atComputers=current.filter(c=>c.stage==="using"||c.stage==="sitting").length;
  return {
   phase:"service",title:"SÁBADO · ATENDIMENTO NORMAL",
   details:current.length+" cliente(s) no salão · "+atComputers+" nos computadores",
   fridayDay:last.fridayDay,remainingGuests:0,minutesUntilOpen:0,progress:1,
   customersNow:current.length,atComputers
  };
 }
 const gross=last.revenue+last.retailRevenue;
 return {
  phase:"open",title:"SÁBADO · 10H · PORTAS ABERTAS",
  details:"Corujão concluído · "+last.paid+" participante(s) · receita R$ "+
   gross.toFixed(2).replace(".",","),
  fridayDay:last.fridayDay,remainingGuests:0,minutesUntilOpen:0,progress:1
 };
}
