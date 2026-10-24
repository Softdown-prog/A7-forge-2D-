/** Administração → Finanças → Primeira sexta.
 * Rascunho gratuito, confirmação sem pagamento adiantado e relatório
 * real da última madrugada; noite física executada em nightMeetup.ts.
 */
import type {GameState,Result} from "../sim/types.js";
import {campaignDate,currentCampaignDay} from "../sim/campaignWeek.js";
import {firstFridayEligibility,draftFridayMeetup,cancelFridayMeetupDraft} from "../sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../sim/nightMeetup.js";
import {selectNightTournament,tournamentStandings} from "../sim/nightTournament.js";
import {knockoutCurrentMatch} from "../sim/nightKnockout.js";
import {summarizeNightTrophies} from "../sim/nightTrophyStats.js";

export function installFridayMeetupPanel(
 admin:HTMLElement,getGame:()=>GameState,onResult:(result:Result)=>void
){
 const section=document.createElement("section");
 section.id="first-meetup-panel";
 section.className="management-event-panel";
 section.setAttribute("aria-label","Primeiro encontro de sexta-feira");
 const heading=document.createElement("h4");heading.textContent="O primeiro encontro entre amigos";
 const description=document.createElement("p");
 description.textContent="Tony pode organizar uma noite especial depois de jogar com a turma durante o expediente. Os amigos chegam às 23h, jogam até 7h e o sábado abre às 10h.";
 const status=document.createElement("p");status.id="first-meetup-status";status.setAttribute("role","status");
 const info=document.createElement("p");info.id="first-meetup-info";
 const actions=document.createElement("div");actions.className="action-row wrap";
 const two=document.createElement("button");two.type="button";two.className="slice";two.id="first-meetup-two";two.textContent="Estudar 2 vagas";
 const three=document.createElement("button");three.type="button";three.className="slice";three.id="first-meetup-three";three.textContent="Estudar 3 vagas";
 const format=document.createElement("button");format.type="button";format.className="slice";format.id="first-meetup-format";format.textContent="Ativar torneio amistoso";
 const ranking=document.createElement("div");ranking.id="first-meetup-ranking";ranking.className="management-empty";
 const gallery=document.createElement("section");gallery.id="first-meetup-trophies";
 gallery.className="night-trophy-gallery";gallery.hidden=true;
 gallery.setAttribute("aria-label","Galeria digital de campeões de Setor Zero");
 const trophyTitle=document.createElement("h5");
 const trophyRecords=document.createElement("p");trophyRecords.className="night-trophy-records";
 trophyRecords.id="first-meetup-trophy-records";
 const trophyChampions=document.createElement("ol");
 trophyChampions.className="night-trophy-champions";
 trophyChampions.setAttribute("aria-label","Ranking histórico dos campeões de Setor Zero");
 const trophyList=document.createElement("ol");trophyList.className="night-trophy-list";
 const trophyMore=document.createElement("button");trophyMore.type="button";
 trophyMore.className="slice";trophyMore.id="first-meetup-trophies-more";trophyMore.hidden=true;
 trophyMore.setAttribute("aria-controls","first-meetup-trophies-list");
 trophyList.id="first-meetup-trophies-list";
 gallery.append(trophyTitle,trophyRecords,trophyChampions,trophyList,trophyMore);
 let showAllTrophies=false,renderedTrophies="";
 const renderTrophies=(state:GameState)=>{
  const trophies=state.nightTournamentTrophies??[];
  gallery.hidden=trophies.length===0;
  const signature=(showAllTrophies?"all":"recent")+"|"+
   trophies.map(t=>t.fridayDay+":"+t.winnerId+":"+t.participants).join("|");
  if(signature===renderedTrophies)return;
  renderedTrophies=signature;
  const stats=summarizeNightTrophies(trophies);
  trophyTitle.textContent="🏆 Galeria digital · "+stats.total+
   (stats.total===1?" conquista":" conquistas");
  trophyRecords.textContent=stats.uniqueChampions+
   (stats.uniqueChampions===1?" campeão diferente":" campeões diferentes")+
   " · "+stats.finalsTwo+" finais com 2 jogadores · "+
   stats.finalsThree+" finais com 3 jogadores";
  trophyChampions.replaceChildren(...stats.champions.slice(0,3).map((record,i)=>{
   const item=document.createElement("li");
   const name=document.createElement("strong");
   name.textContent=(i+1)+"º jogador "+record.winnerId;
   const result=document.createElement("span");
   result.textContent=record.titles+(record.titles===1?" título":" títulos")+
    " · último em "+campaignDate(record.lastFridayDay);
   item.append(name,result);
   return item;
  }));
  const visible=showAllTrophies?trophies:trophies.slice(-4);
  trophyList.replaceChildren(...[...visible].reverse().map(t=>{
   const item=document.createElement("li");item.className="night-trophy-item";
   const symbol=document.createElement("span");symbol.className="night-trophy-symbol";
   symbol.textContent="🏆";symbol.setAttribute("aria-hidden","true");
   const detail=document.createElement("span");detail.className="night-trophy-detail";
   const date=document.createElement("strong");date.textContent="Sexta "+campaignDate(t.fridayDay);
   const champion=document.createElement("span");
   champion.textContent="Campeão: jogador "+t.winnerId+" · "+t.participants+" participantes";
   detail.append(date,champion);item.append(symbol,detail);
   return item;
  }));
  trophyMore.hidden=trophies.length<=4;
  trophyMore.textContent=showAllTrophies?"Mostrar apenas recentes":
   "Ver todas as "+trophies.length+" conquistas";
  trophyMore.setAttribute("aria-expanded",String(showAllTrophies));
 };
 trophyMore.addEventListener("click",()=>{
  showAllTrophies=!showAllTrophies;
  renderTrophies(getGame());
 });
 const confirm=document.createElement("button");confirm.type="button";confirm.className="slice primary";confirm.id="first-meetup-confirm";confirm.textContent="Confirmar encontro de sexta";
 const cancel=document.createElement("button");cancel.type="button";cancel.className="slice";cancel.id="first-meetup-cancel";cancel.textContent="Descartar rascunho";
 const caution=document.createElement("p");caution.className="management-empty";
 caution.textContent="Confirmar não cobra antecipadamente. Cada amigo paga no caixa; o salão fecha ao público às 22h e reabre sábado às 10h.";
 actions.append(two,three,format,confirm,cancel);
 section.append(heading,description,status,info,ranking,gallery,actions,caution);
 admin.querySelector("#section-finance")?.append(section);
 two.addEventListener("click",()=>onResult(draftFridayMeetup(getGame(),2)));
 three.addEventListener("click",()=>onResult(draftFridayMeetup(getGame(),3)));
 format.addEventListener("click",()=>{
  const current=getGame().fridayMeetupDraft?.format;
  onResult(selectNightTournament(getGame(),current==="tournament"?"knockout":
   current==="knockout"?"free":"tournament"));
 });
 confirm.addEventListener("click",()=>onResult(confirmFridayMeetup(getGame())));
 cancel.addEventListener("click",()=>onResult(cancelFridayMeetupDraft(getGame())));
 return {
  render:()=>{
   const s=getGame(),q=firstFridayEligibility(s),draft=s.fridayMeetupDraft;
   status.textContent=s.nightMeetup
    ?"Corujão em andamento — "+s.nightMeetup.paidIds.length+" pagamentos; "+s.nightMeetup.phase+"."
    :draft
     ?(draft.status==="confirmed"?"Encontro CONFIRMADO. ":"Rascunho salvo. ")+
       draft.seats+" vagas · sexta "+campaignDate(draft.fridayDay)
     :s.lastNightMeetup?"Último corujão: "+s.lastNightMeetup.paid+
       " participantes, R$ "+(s.lastNightMeetup.revenue+s.lastNightMeetup.retailRevenue).toFixed(2)+
       " de receita."
     :q.ready?"Tony pode preparar a próxima sexta.":"A oportunidade ainda está amadurecendo.";
   info.textContent="Próxima sexta: "+q.date+" · "+q.pcs.length+
    " PC(s) livre(s) e compatível(is). "+
    (q.reasons.length?q.reasons.join(" "):"Há capacidade para planejar sem ocupar PCs agora.");
   const tournament=s.nightMeetup?.tournament;
   const last=s.lastNightMeetup?.tournament;
   const duel=tournament?.mode==="knockout"?knockoutCurrentMatch(tournament):undefined;
   ranking.textContent=tournament
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
   renderTrophies(s);
   format.textContent=draft?.format==="tournament"?"Ativar eliminatórias":
    draft?.format==="knockout"?"Usar encontro livre":"Ativar torneio por pontos";
   format.disabled=!draft||draft.status!=="draft"||!!s.nightMeetup;
   two.disabled=!!s.nightMeetup||!!draft||!q.ready||q.pcs.length<2;
   three.disabled=!!s.nightMeetup||!!draft||!q.ready||q.pcs.length<3;
   confirm.disabled=!!s.nightMeetup||!draft||draft.status!=="draft"||draft.fridayDay<currentCampaignDay(s);
   cancel.disabled=!!s.nightMeetup||!draft;
  }
 };
}
