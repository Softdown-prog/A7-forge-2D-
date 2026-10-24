/** Placar compacto e real no topo do salão. Não interfere no Canvas,
 * no movimento dos NPCs nem no processamento de minutos do motor.
 * Só aparece quando a noite escolhida é um torneio.
 */
import type {GameState} from "../sim/types.js";
import {tournamentStandings} from "../sim/nightTournament.js";
import {knockoutCurrentMatch} from "../sim/nightKnockout.js";
export function installNightTournamentHud(){
 const viewport=document.getElementById("scene-viewport");
 const hud=document.createElement("details");
 hud.id="night-tournament-hud";hud.className="night-tournament-hud";hud.hidden=true;
 const summary=document.createElement("summary");
 summary.textContent="Torneio Setor Zero · aguardando inscrições";
 const rows=document.createElement("ol");rows.className="night-tournament-standings";
 hud.append(summary,rows);
 viewport?.parentElement?.insertBefore(hud,viewport);
 return {
  render:(state:GameState)=>{
   const n=state.nightMeetup,t=n?.tournament;
   hud.hidden=!n||!t;
   if(!n||!t)return;
   const standings=tournamentStandings(t);
   const duel=t.mode==="knockout"?knockoutCurrentMatch(t):undefined;
   const leader=standings[0];
   const label=leader?"líder: jogador "+leader.id+" ("+leader.points+" pts)":"aguardando";
   summary.textContent=t.settled
    ?"🏆 Setor Zero · campeão: "+(t.winnerId??"sem vencedor")+" · prêmio R$ "+(t.prizePaid??0).toFixed(2)
    :duel
     ?"🏆 Setor Zero · "+(duel.stage==="qualifier"?"classificatória":"final")+
       " · "+duel.playerIds.join(" x ")+" · "+duel.points.join("–")+
       " ("+duel.rounds+"/"+(duel.stage==="qualifier"?8:12)+")"
     :t.mode==="knockout"&&t.bracket?.winnerId
      ?"🏆 Setor Zero · final encerrada · jogador "+t.bracket.winnerId+" venceu"
      :"🏆 Setor Zero · "+t.scores.length+"/"+n.seats+" inscritos · "+label;
   rows.replaceChildren(...standings.map((row,i)=>{
    const item=document.createElement("li");
    item.textContent=(i+1)+"º · jogador "+row.id+" · "+row.points+" pontos · "+row.rounds+" rodadas jogadas";
    return item;
   }));
  }
 };
}
