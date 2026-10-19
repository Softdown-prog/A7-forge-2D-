import type {Customer,CustomerPreference,GameState,Item} from "./types.js";
import {selectPurchase} from "./needs.js";

/** Apenas pacotes oferecidos ao jogador; nunca inventa minutos avulsos. */
export const VISITOR_PACKAGES=[240,180,120,90,60,45,30] as const;
export function sessionPlan(c:Customer,wanted:number,remaining:number,quote:(minutes:number)=>number):number|null{
 if(!Number.isFinite(remaining)||remaining<30)return null;
 const requested=Number.isFinite(wanted)&&wanted>=30?wanted:30;
 const available=VISITOR_PACKAGES.filter(minutes=>minutes<=Math.min(requested,remaining));
 // Um contrato legado de duração incomum continua valendo quando cabe no horário.
 if(!c.budgetAware){
  if(requested<=remaining)return requested;
  return VISITOR_PACKAGES.find(m=>m<=remaining)??null;
 }
 const money=c.wallet;
 if(!Number.isFinite(money)||money===undefined||money<0)return null;
 return available.find(minutes=>{
  const price=quote(minutes);
  return Number.isFinite(price)&&price>=0&&price<=money+1e-6;
 })??null;
}
export function shouldConsiderConsole(c:Customer,availablePc:number|undefined):boolean{
 // Preferência antiga preservada, mas oferecer console como alternativa real
 // se nenhum PC puder receber o cliente (lotação, pane, energia ou layout).
 return c.preference==="gaming"||c.preference==="economy"||
  (!c.gpuGamer&&c.id%5===0)||availablePc===undefined;
}
export function emergencyRetailChoice(s:GameState,c:Customer):Item|null{
 // Sem máquina disponível: uma pessoa com sede/fome pode comprar, mas só
 // quando precisa, tem dinheiro e existe estoque. Sem renda inventada.
 return selectPurchase(c,s.inventory,s);
}
export function debitVisitorBudget(c:Customer,paid:number):void{
 if(c.budgetAware&&Number.isFinite(c.wallet)&&c.wallet!==undefined){
  c.wallet=Math.round(Math.max(0,c.wallet-paid)*100)/100;
 }
}

/** Distribuição estável por ID e semente inicial. Nenhum sorteio a mais
 * e nenhum cálculo no requestAnimationFrame; só no nascimento do cliente. */
export function visitorPreference(id:number,seed=0):CustomerPreference{
 const profiles:readonly CustomerPreference[]=["economy","comfort","gaming","quick"];
 return profiles[((Math.imul(id,1664525)+(seed>>>0))>>>0)%profiles.length]!;
}
/** Atalhos de tempo alteram desejo, nunca criam um preço ou sessão inexistente. */
export function preferredSessionLength(c:Customer,wanted:number):number{
 if(c.preference==="quick")return Math.min(wanted,30);
 if(c.preference==="economy")return Math.min(wanted,45);
 return wanted;
}
export function maxServiceWait(c:Customer):number{
 return c.preference==="quick"?8:c.vip?19:25;
}
/** Escolher entre duas opções JÁ acessíveis e precificadas.
 * A opção econômica compara reais por minuto, sem confundir sessões curtas
 * com preços mais baixos. O gamer prioriza seu título GPU quando pode jogar. */
export function prefersConsole(
 c:Customer,pcMinutes:number|null,consoleMinutes:number|null,
 pcQuote:(minutes:number)=>number,consoleQuote:(minutes:number)=>number
):boolean{
 if(consoleMinutes===null)return false;
 if(pcMinutes===null)return true;
 if(c.preference==="gaming")return !c.gpuGamer;
 if(c.preference==="comfort"||c.preference==="quick")return false;
 if(c.preference==="economy"){
  const pcRate=pcQuote(pcMinutes)/pcMinutes;
  const consoleRate=consoleQuote(consoleMinutes)/consoleMinutes;
  return Number.isFinite(consoleRate)&&(!Number.isFinite(pcRate)||consoleRate+1e-6<pcRate);
 }
 // Saves sem perfil continuam respeitando a preferência antiga pelo console.
 return true;
}
