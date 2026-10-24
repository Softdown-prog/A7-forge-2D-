/** Página enxuta na Administração → Finanças → Primeira sexta.
 * O botão prepara somente o rascunho; deliberadamente não inicia um
 * evento noturno, altera o relógio, retém máquinas nem fabrica clientes.
 */
import type {GameState,Result} from "../sim/types.js";
import {campaignDate,currentCampaignDay} from "../sim/campaignWeek.js";
import {firstFridayEligibility,draftFridayMeetup,cancelFridayMeetupDraft} from "../sim/fridayMeetup.js";
import {confirmFridayMeetup} from "../sim/nightMeetup.js";

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
 const confirm=document.createElement("button");confirm.type="button";confirm.className="slice primary";confirm.id="first-meetup-confirm";confirm.textContent="Confirmar encontro de sexta";
 const cancel=document.createElement("button");cancel.type="button";cancel.className="slice";cancel.id="first-meetup-cancel";cancel.textContent="Descartar rascunho";
 const caution=document.createElement("p");caution.className="management-empty";
 caution.textContent="Confirmar não cobra antecipadamente. Cada amigo paga no caixa; o salão fecha ao público às 22h e reabre sábado às 10h.";
 actions.append(two,three,confirm,cancel);
 section.append(heading,description,status,info,actions,caution);
 admin.querySelector("#section-finance")?.append(section);
 two.addEventListener("click",()=>onResult(draftFridayMeetup(getGame(),2)));
 three.addEventListener("click",()=>onResult(draftFridayMeetup(getGame(),3)));
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
   two.disabled=!!s.nightMeetup||!!draft||!q.ready||q.pcs.length<2;
   three.disabled=!!s.nightMeetup||!!draft||!q.ready||q.pcs.length<3;
   confirm.disabled=!!s.nightMeetup||!draft||draft.status!=="draft"||draft.fridayDay<currentCampaignDay(s);
   cancel.disabled=!!s.nightMeetup||!draft;
  }
 };
}
