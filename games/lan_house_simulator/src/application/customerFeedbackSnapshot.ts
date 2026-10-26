/** Read model for Finance > Opiniões. No browser APIs or state mutations. */
import type {GameState} from "../sim/types.js";
import {FEEDBACK_REASONS,summarizeFeedback} from "../sim/customerFeedback.js";

const signed=(value:number)=>(value>0?"+":"")+value.toFixed(2);
export interface FeedbackSnapshot {
 summary:string;
 reasons:ReadonlyArray<{label:string;stats:string}>;
 recent:ReadonlyArray<{label:string;delta:string;negative:boolean}>;
}
export function customerFeedbackSnapshot(state:GameState):FeedbackSnapshot{
 const {records,positive,negative,totalDelta,reasons}=summarizeFeedback(state);
 return {
  summary:records.length
   ?positive+" elogio(s) com efeito · "+negative+" crítica(s) com efeito · saldo "+
     signed(totalDelta)+" pontos de reputação"
   :"Ainda não há avaliações que tenham alterado a reputação.",
  reasons:reasons.slice(0,5).map(([reason,stats])=>({
   label:FEEDBACK_REASONS[reason],
   stats:stats.positive+" elogio(s) · "+stats.negative+" crítica(s) · "+signed(stats.delta)+" pts"
  })),
  recent:records.slice(0,8).map(entry=>({
   label:"Dia "+(Math.floor(entry.minute/720)+1)+" · "+FEEDBACK_REASONS[entry.reason]+
    (entry.kind==="desistencia"?" · desistência":entry.kind==="conexao"?" · queda de conexão":" · sessão"),
   delta:signed(entry.delta)+" pts",
   negative:entry.delta<0
  }))
 };
}
