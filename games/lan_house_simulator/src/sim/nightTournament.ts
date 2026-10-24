/** Placar do campeonato amistoso no mesmo salão e na mesma rodada LAN.
 * Não são partidas simuladas fora do LHS: somente minutos com Customer
 * na etapa "using" em PC do grupo geram rodadas e pontos.
 * A pontuação representa desempenho simplificado; não há FPS completo.
 */
import type {GameState,Result} from "./types.js";
import {addLog} from "./simulationState.js";
import {scoreKnockoutMinute,validKnockoutBracket} from "./nightKnockout.js";
import type {NightKnockoutBracket} from "./nightKnockout.js";

export type NightTournamentScore={id:number;points:number;rounds:number};
export type NightTournamentState={
 scores:NightTournamentScore[];
 mode?:"league"|"knockout";bracket?:NightKnockoutBracket;
 settled?:boolean;winnerId?:number;prizePaid?:number;
};
export type NightTournamentResult={
 rankings:NightTournamentScore[];winnerId?:number;prizePaid:number;
 mode?:"league"|"knockout";bracket?:NightKnockoutBracket;
};
const cents=(v:number)=>Math.round(v*100)/100;

export function selectNightTournament(s:GameState,format:"free"|"tournament"|"knockout"):Result{
 const d=s.fridayMeetupDraft;
 if(!d||d.status!=="draft"||s.nightMeetup)
  return {ok:false,message:"Escolha o formato antes de confirmar o encontro."};
 if(format!=="free"&&format!=="tournament"&&format!=="knockout")
  return {ok:false,message:"Formato não reconhecido."};
 d.format=format;
 return {ok:true,message:format==="tournament"
  ?"Torneio por pontos: classificação por rodadas no PC, prêmio de até R$ 40 sem cobrança de inscrição."
  :format==="knockout"
  ?"Eliminatória selecionada: com 2 jogadores, final direta; com 3, classificatória e final com uma vaga automática. Pontos apenas enquanto os adversários estiverem nos PCs."
  :"Encontro livre selecionado, sem classificação ou premiação."};
}
export function registerTournamentPlayer(s:GameState,id:number):void{
 const t=s.nightMeetup?.tournament;
 if(!t||t.scores.some(row=>row.id===id))return;
 t.scores.push({id,points:0,rounds:0});
}
export function tournamentStandings(t:NightTournamentState):NightTournamentScore[]{
 return [...t.scores].map(row=>({...row}))
  .sort((a,b)=>b.points-a.points||b.rounds-a.rounds||a.id-b.id);
}
export function scoreTournamentMinute(s:GameState):void{
 const n=s.nightMeetup,t=n?.tournament;
 if(!n||!t||t.settled||n.phase!=="playing"||n.elapsed>=540||
    n.elapsed%12!==0)return;
 if(t.mode==="knockout"){scoreKnockoutMinute(s);return;}
 for(const row of t.scores){
  const c=s.customers.find(x=>x.id===row.id);
  if(!c||c.stage!=="using"||c.pcIndex===null||!n.pcIndexes.includes(c.pcIndex))
   continue;
  // Cada rodada de 12 minutos só conta quando o jogador está mesmo no PC.
  // Pausas para o refrigerante não geram pontos fictícios.
  const outcome=(Math.imul(row.id,37)+Math.imul(n.elapsed,11)+c.pcIndex*17)>>>0;
  row.rounds++;
  row.points+=1+(outcome%4);
 }
}
export function settleNightTournament(s:GameState):void{
 const n=s.nightMeetup,t=n?.tournament;
 if(!n||!t||t.settled)return;
 t.settled=true;t.prizePaid=0;
 if(n.startedAt===undefined||t.scores.length!==n.seats||
    t.scores.some(row=>row.rounds===0)||
    (t.mode==="knockout"&&!t.bracket?.winnerId)){
  addLog(s,"Campeonato não concluído: sem vencedor ou prêmio, pois a rodada completa não aconteceu.");
  return;
 }
 const standings=tournamentStandings(t),winner=t.mode==="knockout"
  ?t.scores.find(row=>row.id===t.bracket?.winnerId)!
  :standings[0]!;
 const desired=cents(Math.min(40,n.revenue*.2));
 const affordable=cents(Math.max(0,Math.min(s.cash,desired)));
 t.winnerId=winner.id;t.prizePaid=affordable;
 if(affordable>0){
  // Prêmio sai do caixa existente, vira despesa e entra na carteira real do campeão.
  s.cash=cents(s.cash-affordable);
  s.expenses=cents(s.expenses+affordable);
  const c=s.customers.find(x=>x.id===winner.id);
  if(c)c.wallet=cents((c.wallet??0)+affordable);
 }
 addLog(s,"Campeonato Setor Zero: vencedor no PC "+
  ((s.customers.find(c=>c.id===winner.id)?.pcIndex??n.pcIndexes[0]!)+1)+
  ", "+winner.points+" pontos, prêmio de R$ "+affordable.toFixed(2)+".");
}
export function completedTournamentResult(t:NightTournamentState):NightTournamentResult{
 return {rankings:tournamentStandings(t),winnerId:t.winnerId,prizePaid:t.prizePaid??0,
  mode:t.mode,bracket:t.bracket?structuredClone(t.bracket):undefined};
}
const money=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&
 v<=1000000&&Math.abs(v*100-Math.round(v*100))<1e-4;
const validScore=(v:NightTournamentScore):boolean=>!!v&&Number.isInteger(v.id)&&v.id>0&&
 Number.isInteger(v.points)&&v.points>=0&&v.points<=5000&&
 Number.isInteger(v.rounds)&&v.rounds>=0&&v.rounds<=50;
export function validTournamentState(t:NightTournamentState|undefined,
 ids:number[],paid:number[],seats:number,elapsed:number):boolean{
 if(t===undefined)return true;
 if(!t||!Array.isArray(t.scores)||t.scores.length>seats||
    t.scores.some(x=>!validScore(x)||!ids.includes(x.id)||!paid.includes(x.id))||
    new Set(t.scores.map(x=>x.id)).size!==t.scores.length||
    (t.settled!==undefined&&typeof t.settled!=="boolean")||
    (t.winnerId!==undefined&&(!Number.isInteger(t.winnerId)||!t.scores.some(x=>x.id===t.winnerId)))||
    (t.prizePaid!==undefined&&(!money(t.prizePaid)||t.prizePaid>40))||
    (t.settled===true&&elapsed<540)||
    (t.settled!==true&&(t.winnerId!==undefined||t.prizePaid!==undefined))||
    (t.winnerId===undefined&&(t.prizePaid??0)>0)||
    (t.winnerId!==undefined&&(t.mode==="knockout"?t.bracket?.winnerId!==t.winnerId:
      tournamentStandings(t)[0]?.id!==t.winnerId))||
    !validKnockoutBracket(t,seats,t.bracket!==undefined,elapsed))return false;
 return true;
}
export function validTournamentResult(result:NightTournamentResult|undefined,seats:number):boolean{
 if(result===undefined)return true;
 if(!result||!Array.isArray(result.rankings)||result.rankings.length>seats||
    result.rankings.some(x=>!validScore(x))||
    new Set(result.rankings.map(x=>x.id)).size!==result.rankings.length||
    !money(result.prizePaid)||result.prizePaid>40||
    (result.winnerId!==undefined&&!result.rankings.some(x=>x.id===result.winnerId))||
    (result.winnerId===undefined&&result.prizePaid!==0)||
    (result.winnerId!==undefined&&(result.mode==="knockout"?
      result.bracket?.winnerId!==result.winnerId:
      tournamentStandings({scores:result.rankings})[0]?.id!==result.winnerId))||
    !validKnockoutBracket({scores:result.rankings,mode:result.mode,bracket:result.bracket,
      settled:true,winnerId:result.winnerId,prizePaid:result.prizePaid},seats,
      result.bracket!==undefined,540))return false;
 return true;
}
