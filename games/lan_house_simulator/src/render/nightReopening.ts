/** Transição visual do fim do corujão, lida do motor original.
 * A madrugada continua com totalMinutes congelado na sexta até as 10h;
 * esta apresentação não avança calendário, não altera NPCs nem saves.
 */
import type {GameState} from "../sim/types.js";
import {DAY_MINUTES} from "../sim/types.js";
import {currentCampaignDay,weekdayIndex} from "../sim/campaignWeek.js";
import {NIGHT_MORNING_EXIT_OFFSET,NIGHT_MAX_EXIT_OFFSET} from "../sim/futureNightClock.js";

export type NightReopeningPresentation={
 phase:"farewell"|"preparing"|"open"|"service";
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
    weekdayIndex(last.fridayDay+1)!==5||minute>120)return undefined;
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
/** Placa pequena no salão isométrico, sem objetos nem colisão no mapa. */
export function drawNightReopening(
 ctx:CanvasRenderingContext2D,s:GameState,time:number
):void{
 const state=nightReopeningPresentation(s);
 if(!state)return;
 const opened=state.phase==="open",service=state.phase==="service",width=332,height=80;
 const x=ctx.canvas.width-width-18,y=20;
 const pulse=opened?0.8+0.2*Math.sin(time*2):1;
 ctx.save();
 ctx.fillStyle="rgba(16,31,39,.93)";
 ctx.fillRect(x,y,width,height);
 ctx.lineWidth=1.7;
 ctx.strokeStyle=opened?"#d9d07f":service?"#81c8aa":"#80bacc";
 ctx.strokeRect(x+.9,y+.9,width-1.8,height-1.8);
 ctx.textAlign="left";ctx.textBaseline="middle";
 ctx.globalAlpha=pulse;
 ctx.fillStyle=opened?"#ffeb9a":service?"#a8eac4":"#b7ecdf";
 ctx.font="bold 15px system-ui,sans-serif";
 ctx.fillText(state.title,x+14,y+22,width-25);
 ctx.globalAlpha=1;
 ctx.fillStyle="#f1f6f0";ctx.font="12px system-ui,sans-serif";
 ctx.fillText(state.details,x+14,y+48,width-25);
 ctx.fillStyle="rgba(255,255,255,.14)";
 ctx.fillRect(x+14,y+65,width-28,5);
 ctx.fillStyle=opened?"#f3d377":"#82d7c5";
 ctx.fillRect(x+14,y+65,(width-28)*Math.max(0,Math.min(1,state.progress)),5);
 ctx.restore();
}
