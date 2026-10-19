import type {GameState} from "../sim/types.js";
import {FEEDBACK_REASONS,summarizeFeedback} from "../sim/customerFeedback.js";
const signed=(n:number)=>(n>0?"+":"")+n.toFixed(2);
/** Render only when the Finance > Opiniões task page is active.
 * No canvas, interval, animation or per-frame list reconstruction. */
export function renderCustomerFeedback(host:HTMLElement,state:GameState):void{
 const {records,positive,negative,totalDelta,reasons}=summarizeFeedback(state);
 const summary=host.querySelector<HTMLElement>("#customer-feedback-summary");
 const reasonsHost=host.querySelector<HTMLElement>("#customer-feedback-reasons");
 const recent=host.querySelector<HTMLOListElement>("#customer-feedback-list");
 if(!summary||!reasonsHost||!recent)return;
 summary.textContent=records.length
  ?positive+" elogio(s) com efeito · "+negative+" crítica(s) com efeito · saldo "+
    signed(totalDelta)+" pontos de reputação"
  :"Ainda não há avaliações que tenham alterado a reputação.";
 reasonsHost.replaceChildren();recent.replaceChildren();
 for(const [reason,stats] of reasons.slice(0,5)){
  const row=document.createElement("div");row.className="customer-feedback-reason";
  const label=document.createElement("span");label.textContent=FEEDBACK_REASONS[reason];
  const count=document.createElement("strong");
  count.textContent=stats.positive+" elogio(s) · "+stats.negative+" crítica(s) · "+signed(stats.delta)+" pts";
  row.append(label,count);reasonsHost.append(row);
 }
 for(const entry of records.slice(0,8)){
  const row=document.createElement("li");row.className=entry.delta<0?"feedback-negative":"feedback-positive";
  const label=document.createElement("span");
  label.textContent="Dia "+(Math.floor(entry.minute/720)+1)+" · "+
   FEEDBACK_REASONS[entry.reason]+
   (entry.kind==="desistencia"?" · desistência":entry.kind==="conexao"?" · queda de conexão":" · sessão");
  const delta=document.createElement("strong");delta.textContent=signed(entry.delta)+" pts";
  row.append(label,delta);recent.append(row);
 }
}
