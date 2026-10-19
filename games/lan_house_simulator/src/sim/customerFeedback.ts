import type {Customer,GameState} from "./types.js";
import {DAY_MINUTES} from "./types.js";

export type FeedbackReason="preco"|"equipamentos"|"jogos"|"espera"|"internet"|"atendimento";
export type FeedbackKind="sessao"|"desistencia"|"conexao";
export interface CustomerFeedback {
 minute:number;
 customerId:number;
 reason:FeedbackReason;
 kind:FeedbackKind;
 /** Variação real, já após os limites da reputação. */
 delta:number;
 preference?:NonNullable<Customer["preference"]>;
}
export const CUSTOMER_FEEDBACK_LIMIT=24;
export const FEEDBACK_REASONS:Record<FeedbackReason,string>={
 preco:"Preço",equipamentos:"Equipamentos",jogos:"Jogos",
 espera:"Espera",internet:"Conexão",atendimento:"Atendimento"
};
/** Classifica o principal motivo observado, sem presumir que toda avaliação
 * decorre do perfil do visitante. */
export function sessionFeedbackReason(c:Customer,options:{
 price:number;hardwareBonus:number;consoleSession:boolean
}):FeedbackReason{
 if(c.offlineWait>0)return "internet";
 if(c.preference==="quick"&&c.waitingMinutes>5)return "espera";
 if(c.preference==="gaming"&&c.preferredGpuGame&&!c.gpuGameCharged&&!options.consoleSession)
  return "jogos";
 if(c.preference==="comfort"&&!options.consoleSession&&options.hardwareBonus<.10)
  return "equipamentos";
 if(c.preference==="economy"&&options.price>12)return "preco";
 if(c.waitingMinutes>5)return "espera";
 if(c.preference==="gaming")return "jogos";
 if(c.preference==="comfort"&&!options.consoleSession)return "equipamentos";
 if(c.preference==="economy")return "preco";
 if(options.price>18)return "preco";
 return "atendimento";
}
export function recordCustomerFeedback(
 s:GameState,c:Pick<Customer,"id"|"preference">,reason:FeedbackReason,kind:FeedbackKind,
 before:number
):void{
 const delta=Math.round((s.reputation-before)*10000)/10000;
 if(!Number.isFinite(delta)||Math.abs(delta)<.0001)return;
 const record:CustomerFeedback={
  minute:s.totalMinutes,customerId:c.id,reason,kind,delta,
  ...(c.preference?{preference:c.preference}:{})
 };
 s.customerFeedback=[record,...(s.customerFeedback??[])].slice(0,CUSTOMER_FEEDBACK_LIMIT);
}
export function validCustomerFeedback(value:unknown,totalMinutes:number):boolean{
 if(value===undefined)return true;
 if(!Array.isArray(value)||value.length>CUSTOMER_FEEDBACK_LIMIT)return false;
 let previous=Infinity;
 return value.every((record:CustomerFeedback)=>{
  if(!record||typeof record!=="object"||Array.isArray(record)||
   !Number.isInteger(record.minute)||record.minute<0||record.minute>totalMinutes||
   record.minute>previous||!Number.isInteger(record.customerId)||record.customerId<0||
   !Object.prototype.hasOwnProperty.call(FEEDBACK_REASONS,record.reason)||
   !["sessao","desistencia","conexao"].includes(record.kind)||
   !Number.isFinite(record.delta)||Math.abs(record.delta)<.0001||
   Math.abs(record.delta)>1.1001||
   (record.preference!==undefined&&!["economy","comfort","gaming","quick"].includes(record.preference)))
    return false;
  previous=record.minute;return true;
 });
}
export function summarizeFeedback(s:Pick<GameState,"customerFeedback"|"totalMinutes">){
 const records=(s.customerFeedback??[]).filter(e=>e.minute>=s.totalMinutes-30*DAY_MINUTES);
 let positive=0,negative=0,totalDelta=0;
 const reasons=new Map<FeedbackReason,{positive:number;negative:number;delta:number}>();
 for(const entry of records){
  if(entry.delta>0)positive++;else negative++;
  totalDelta+=entry.delta;
  const value=reasons.get(entry.reason)??{positive:0,negative:0,delta:0};
  if(entry.delta>0)value.positive++;else value.negative++;
  value.delta+=entry.delta;reasons.set(entry.reason,value);
 }
 return {records,positive,negative,totalDelta:Math.round(totalDelta*10000)/10000,
  reasons:[...reasons].sort((a,b)=>Math.abs(b[1].delta)-Math.abs(a[1].delta))};
}
