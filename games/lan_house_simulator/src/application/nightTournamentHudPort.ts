import { knockoutCurrentMatch } from "../sim/nightKnockout.js";
import { tournamentStandings } from "../sim/nightTournament.js";
import type { GameState } from "../sim/types.js";
import { nightPrizePresentation,nightReopeningPresentation,prizeAmountText } from "./nightPresentation.js";
export interface NightTournamentHudView {transition:{phase:string;label:string}|null;paymentLabel:string;visible:boolean;knockout:boolean;matches:string[];summary:string;standings:string[]}
export function createNightTournamentHudPort(getState:()=>GameState){
 return {snapshot():NightTournamentHudView{
  const state=getState(),transition=nightReopeningPresentation(state),payment=nightPrizePresentation(state),n=state.nightMeetup,t=n?.tournament;
  const view:NightTournamentHudView={transition:transition?{phase:transition.phase,label:transition.title+" · "+transition.details}:null,
   paymentLabel:payment?"🏆 7h · Prêmio pago ao jogador "+payment.winnerId+": "+prizeAmountText(payment.amount)+". Registrado no caixa.":"",
   visible:!!n&&!!t,knockout:t?.mode==="knockout",matches:[],summary:"",standings:[]};
  if(!n||!t)return view;
  const standings=tournamentStandings(t);
  if(t.mode==="knockout")view.matches=(t.bracket?.matches??[]).map(game=>{
   const label=game.stage==="qualifier"?"Classificatória":"Final";
   return label+" · jogador "+game.playerIds[0]+" x jogador "+game.playerIds[1]+" · "+game.points.join("–")+" · "+game.rounds+"/"+(game.stage==="qualifier"?8:12)+" rodadas"+(game.winnerId!==undefined?" · vencedor: "+game.winnerId:" · em andamento");
  });
  const duel=t.mode==="knockout"?knockoutCurrentMatch(t):undefined,leader=standings[0],label=leader?"líder: jogador "+leader.id+" ("+leader.points+" pts)":"aguardando";
  view.summary=t.settled?(t.winnerId!==undefined?"🏆 Setor Zero · campeão: jogador "+t.winnerId:"Setor Zero · campeonato não concluído")+" · prêmio R$ "+(t.prizePaid??0).toFixed(2)
   :duel?"Setor Zero · "+(duel.stage==="qualifier"?"classificatória":"final")+" · "+duel.playerIds.join(" x ")+" · "+duel.points.join("–")+" ("+duel.rounds+"/"+(duel.stage==="qualifier"?8:12)+")"
   :t.mode==="knockout"&&t.bracket?.winnerId?"Setor Zero · final encerrada · jogador "+t.bracket.winnerId+" venceu"
   :"Setor Zero · "+t.scores.length+"/"+n.seats+" inscritos · "+label;
  view.standings=standings.map((row,i)=>(i+1)+"º · jogador "+row.id+" · "+row.points+" pontos · "+row.rounds+" rodadas jogadas");
  return view;
 }};
}
