/** Night planning and report projections. Queries and commands always use the active campaign. */
import { campaignDate,currentCampaignDay } from "../sim/campaignWeek.js";
import { cancelFridayMeetupDraft,draftFridayMeetup,firstFridayEligibility } from "../sim/fridayMeetup.js";
import { knockoutCurrentMatch } from "../sim/nightKnockout.js";
import { confirmFridayMeetup } from "../sim/nightMeetup.js";
import { selectNightTournament,tournamentStandings } from "../sim/nightTournament.js";
import { summarizeNightTrophies } from "../sim/nightTrophyStats.js";
import type { GameState,Result } from "../sim/types.js";

function trophySnapshot(state:GameState){
 const trophies=state.nightTournamentTrophies??[],stats=summarizeNightTrophies(trophies);
 return {signature:trophies.map(t=>t.fridayDay+":"+t.winnerId+":"+t.participants).join("|"),total:trophies.length,
  title:"🏆 Galeria digital · "+stats.total+(stats.total===1?" conquista":" conquistas"),
  records:stats.uniqueChampions+(stats.uniqueChampions===1?" campeão diferente":" campeões diferentes")+" · "+stats.finalsTwo+(stats.finalsTwo===1?" final":" finais")+" com 2 jogadores · "+stats.finalsThree+(stats.finalsThree===1?" final":" finais")+" com 3 jogadores",
  champions:stats.champions.slice(0,3).map((record,i)=>({name:(i+1)+"º jogador "+record.winnerId,result:record.titles+(record.titles===1?" título":" títulos")+" · último em "+campaignDate(record.lastFridayDay)})),
  items:trophies.map(t=>({date:"Sexta "+campaignDate(t.fridayDay),champion:"Campeão: jogador "+t.winnerId+" · "+t.participants+" participantes"}))};
}
export function createFridayMeetupPort(getState:()=>GameState){
 return {
  draft:(seats:2|3):Result=>draftFridayMeetup(getState(),seats),
  cycleFormat():Result{const current=getState().fridayMeetupDraft?.format;return selectNightTournament(getState(),current==="tournament"?"knockout":current==="knockout"?"free":"tournament");},
  confirm:():Result=>confirmFridayMeetup(getState()),
  cancel:():Result=>cancelFridayMeetupDraft(getState()),
  snapshot(){
   const s=getState(),q=firstFridayEligibility(s),draft=s.fridayMeetupDraft;
   const status=s.nightMeetup
    ?"Corujão em andamento — "+s.nightMeetup.paidIds.length+" pagamentos; "+s.nightMeetup.phase+"."
    :draft
     ?(draft.status==="confirmed"?"Encontro CONFIRMADO. ":"Rascunho salvo. ")+
       draft.seats+" vagas · sexta "+campaignDate(draft.fridayDay)
     :s.lastNightMeetup?"Último corujão: "+s.lastNightMeetup.paid+
       " participantes, R$ "+(s.lastNightMeetup.revenue+s.lastNightMeetup.retailRevenue).toFixed(2)+
       " de receita."
     :q.ready?"Tony pode preparar a próxima sexta.":"A oportunidade ainda está amadurecendo.";
   const info="Próxima sexta: "+q.date+" · "+q.pcs.length+
    " PC(s) livre(s) e compatível(is). "+
    (q.reasons.length?q.reasons.join(" "):"Há capacidade para planejar sem ocupar PCs agora.");
   const tournament=s.nightMeetup?.tournament;
   const last=s.lastNightMeetup?.tournament;
   const duel=tournament?.mode==="knockout"?knockoutCurrentMatch(tournament):undefined;
   const ranking=tournament
    ?(tournament.mode==="knockout"?"Eliminatória":"Torneio por pontos")+" · "+
      tournament.scores.length+"/"+(s.nightMeetup?.seats??0)+" inscritos · "+
      (duel
       ?(duel.stage==="qualifier"?"Classificatória":"Final")+" · "+
         duel.playerIds.join(" x ")+" · placar "+duel.points.join("–")+
         " · "+duel.rounds+"/"+(duel.stage==="qualifier"?8:12)+" rodadas"
       :tournament.mode==="knockout"&&tournament.bracket?.winnerId
        ?"Final encerrada · campeão jogador "+tournament.bracket.winnerId
        :tournamentStandings(tournament).map((x,i)=>(i+1)+"º jogador "+x.id+
          " — "+x.points+" pts ("+x.rounds+" rodadas)").join(" · ")||
          "aguardando pagamentos")
    :last
     ?(last.mode==="knockout"?"Última eliminatória":"Último torneio")+" · "+last.rankings.map((x,i)=>(i+1)+"º jogador "+x.id+" — "+x.points+" pontos").join(" · ")+
      (last.bracket?.matches?.length?" · confrontos: "+last.bracket.matches.map(m=>
        (m.stage==="qualifier"?"Classificatória":"Final")+" "+m.playerIds.join(" x ")+
        " ("+m.points.join("–")+")").join(" · "):"")+
      " · campeão: "+(last.winnerId??"sem vencedor")+" · prêmio R$ "+last.prizePaid.toFixed(2)
     :draft?.format==="knockout"
      ?"Eliminatórias: 2 amigos disputam uma final; com 3, dois disputam uma classificatória e o terceiro aguarda a final. Só vale ponto jogando nos PCs."
      :draft?.format==="tournament"
       ?"Torneio por pontos: placar por rodadas reais. Prêmio máximo R$ 40 ao campeão."
       :"Encontro livre. Também é possível escolher torneio por pontos ou eliminatórias.";

   const formatLabel=draft?.format==="tournament"?"Ativar eliminatórias":
    draft?.format==="knockout"?"Usar encontro livre":"Ativar torneio por pontos";
   const formatDisabled=!draft||draft.status!=="draft"||!!s.nightMeetup;
   const twoDisabled=!!s.nightMeetup||!!draft||!q.ready||q.pcs.length<2;
   const threeDisabled=!!s.nightMeetup||!!draft||!q.ready||q.pcs.length<3;
   const confirmDisabled=!!s.nightMeetup||!draft||draft.status!=="draft"||draft.fridayDay<currentCampaignDay(s);
   const cancelDisabled=!!s.nightMeetup||!draft;
   return {status,info,ranking,formatLabel,formatDisabled,twoDisabled,threeDisabled,confirmDisabled,cancelDisabled,trophies:trophySnapshot(s)};
  }
 };
}
export type FridayMeetupPort=ReturnType<typeof createFridayMeetupPort>;
export type FridayMeetupSnapshot=ReturnType<FridayMeetupPort["snapshot"]>;
