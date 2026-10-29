/** Placar compacto e real no topo do salão. Não interfere no Canvas,
 * no movimento dos NPCs nem no processamento de minutos do motor.
 * Só aparece quando a noite escolhida é um torneio.
 */
import type { NightTournamentHudView } from "../application/nightTournamentHudPort.js";
export function installNightTournamentHud(){
 const viewport=document.getElementById("scene-viewport");
 const hud=document.createElement("details");
 hud.id="night-tournament-hud";hud.className="night-tournament-hud";hud.hidden=true;
 const summary=document.createElement("summary");
 summary.textContent="Torneio Setor Zero · aguardando inscrições";
 const matches=document.createElement("ol");matches.className="night-knockout-bracket";
 matches.setAttribute("aria-label","Chave de confrontos de Setor Zero");
 const rows=document.createElement("ol");rows.className="night-tournament-standings";
 rows.setAttribute("aria-label","Placar de pontos de Setor Zero");
 hud.append(summary,matches,rows);
 const prizeNotice=document.createElement("p");
 prizeNotice.id="night-prize-announcement";prizeNotice.className="night-prize-announcement";
 prizeNotice.setAttribute("role","status");prizeNotice.setAttribute("aria-live","polite");
 prizeNotice.hidden=true;
 viewport?.parentElement?.insertBefore(hud,viewport);
 hud.insertAdjacentElement("afterend",prizeNotice);
 const reopening=document.createElement("p");
 reopening.id="night-reopening-announcement";reopening.className="night-reopening-announcement";
 reopening.setAttribute("aria-live","off");reopening.hidden=true;
 prizeNotice.insertAdjacentElement("afterend",reopening);
 return {
  render:(view:NightTournamentHudView)=>{
   reopening.hidden=!view.transition;reopening.dataset.phase=view.transition?.phase??"";
   const transitionLabel=view.transition?.label??"";
   if(reopening.textContent!==transitionLabel)reopening.textContent=transitionLabel;
   prizeNotice.hidden=!view.paymentLabel;
   if(prizeNotice.textContent!==view.paymentLabel)prizeNotice.textContent=view.paymentLabel;
   hud.hidden=!view.visible;if(!view.visible)return;
   matches.hidden=!view.knockout;
   const matchSignature=JSON.stringify([view.knockout,view.matches]);
   if(matches.dataset.revision!==matchSignature){
    matches.dataset.revision=matchSignature;
    matches.replaceChildren(...view.matches.map(label=>{const item=document.createElement("li");item.textContent=label;return item;}));
    if(view.knockout&&view.matches.length===0)matches.textContent="Aguardando os participantes sentarem.";
   }
   if(summary.textContent!==view.summary)summary.textContent=view.summary;
   const signature=JSON.stringify(view.standings);
   if(rows.dataset.revision!==signature){rows.dataset.revision=signature;rows.replaceChildren(...view.standings.map(label=>{const item=document.createElement("li");item.textContent=label;return item;}));}
  }
 };
}
