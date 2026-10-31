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
 if(c.linuxEnthusiast)return false;
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

/** Avaliação limitada por perfil, calculada uma única vez quando a sessão
 * termina. A avaliação global, as regras de VIP e o teto sustentável de
 * reputação continuam sob o motor. Sem RNG, campos de save ou custo por frame. */
export interface PreferenceSessionExperience{
 hourlyPrice:number;
 hardwareBonus:number;
 consoleSession:boolean;
}
export function preferenceSatisfactionAdjustment(
 c:Customer,experience:PreferenceSessionExperience
):number{
 const {hourlyPrice,hardwareBonus,consoleSession}=experience;
 if(!Number.isFinite(hourlyPrice)||!Number.isFinite(hardwareBonus))return 0;
 const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
 switch(c.preference){
  case "economy":
   // Preço normalizado à referência da economia clássica/ano-base:
   // barato recompensa; tarifa premium penaliza progressivamente.
   return clamp(.07-Math.max(0,hourlyPrice-8)*.012,-.18,.07);
  case "comfort":
   // Quem só encontrou um console não recebe uma penalidade artificial
   // por hardware de computador inexistente.
   return consoleSession?0:clamp((hardwareBonus-.10)*.70,-.09,.09);
  case "gaming":
   if(consoleSession)return c.gpuGamer?0:.07;
   // O cliente que pediu jogo GPU específico avalia o que foi de fato
   // contratado. Uma máquina bonita, mas sem o jogo, não o satisfaz.
   if(c.preferredGpuGame)return c.gpuGameCharged===true?.08:-.12;
   return c.gpuGameCharged===true?.06:0;
  case "quick":
   return clamp(.055-Math.max(0,c.waitingMinutes-3)*.02,-.18,.055);
  default:return 0; // Cliente de save antigo.
 }
}
/** Diálogos mostram a razão da avaliação apenas quando há evidência do
 * comportamento. Evita elogio/queixa aleatória incoerente com a sessão. */
export function preferenceSessionComment(
 c:Customer,adjustment:number,positive:boolean
):string|null{
 if(positive){
  if(adjustment<.05)return null;
  switch(c.preference){
   case "economy":return "Preço justo, vou voltar!";
   case "comfort":return "Computador confortável e rápido!";
   case "gaming":return "Gostei demais de jogar aqui!";
   case "quick":return "Fui atendido rapidinho!";
   default:return null;
  }
 }
 if(adjustment>-.055)return null;
 switch(c.preference){
  case "economy":return "Esse preço pesou no bolso!";
  case "comfort":return "Precisam melhorar esses computadores!";
  case "gaming":return "Não consegui jogar o que eu queria!";
  case "quick":return "Demorou demais para me atender!";
  default:return null;
 }
}
