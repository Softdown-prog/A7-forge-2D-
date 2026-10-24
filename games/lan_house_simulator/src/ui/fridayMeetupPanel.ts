/** Página enxuta na Administração → Finanças → Primeira sexta.
 * O botão prepara somente o rascunho; deliberadamente não inicia um
 * evento noturno, altera o relógio, retém máquinas nem fabrica clientes.
 */
import type {GameState,Result} from "../sim/types.js";
import {campaignDate,currentCampaignDay} from "../sim/campaignWeek.js";
import {firstFridayEligibility,draftFridayMeetup,cancelFridayMeetupDraft} from "../sim/fridayMeetup.js";

export function installFridayMeetupPanel(
 admin:HTMLElement,getGame:()=>GameState,onResult:(result:Result)=>void
){
 const section=document.createElement("section");
 section.id="first-meetup-panel";
 section.className="management-event-panel";
 section.setAttribute("aria-label","Primeiro encontro de sexta-feira");
 const heading=document.createElement("h4");heading.textContent="O primeiro encontro entre amigos";
 const description=document.createElement("p");
 description.textContent="Depois das partidas diurnas, Tony pode estudar uma sexta especial. O planejamento não inicia nem promete um corujão: o expediente de 22h e as regras de caixa permanecem intactos.";
 const status=document.createElement("p");status.id="first-meetup-status";status.setAttribute("role","status");
 const info=document.createElement("p");info.id="first-meetup-info";
 const actions=document.createElement("div");actions.className="action-row wrap";
 const two=document.createElement("button");two.type="button";two.className="slice";two.id="first-meetup-two";two.textContent="Estudar 2 vagas";
 const three=document.createElement("button");three.type="button";three.className="slice";three.id="first-meetup-three";three.textContent="Estudar 3 vagas";
 const cancel=document.createElement("button");cancel.type="button";cancel.className="slice";cancel.id="first-meetup-cancel";cancel.textContent="Descartar rascunho";
 const caution=document.createElement("p");caution.className="management-empty";
 caution.textContent="Atenção: ainda NÃO há turno noturno jogável. Nenhuma inscrição, reserva ou pagamento será feito nesta etapa.";
 actions.append(two,three,cancel);
 section.append(heading,description,status,info,actions,caution);
 admin.querySelector("#section-finance")?.append(section);
 two.addEventListener("click",()=>onResult(draftFridayMeetup(getGame(),2)));
 three.addEventListener("click",()=>onResult(draftFridayMeetup(getGame(),3)));
 cancel.addEventListener("click",()=>onResult(cancelFridayMeetupDraft(getGame())));
 return {
  render:()=>{
   const s=getGame(),q=firstFridayEligibility(s),draft=s.fridayMeetupDraft;
   status.textContent=draft
    ?(draft.fridayDay<currentCampaignDay(s)?"Rascunho vencido — nenhuma sessão ocorreu. ":"Rascunho salvo. ")+
      draft.seats+" vagas · sexta "+campaignDate(draft.fridayDay)
    :q.ready?"Tony já conhece a procura multiplayer e pode estudar a próxima sexta.":"A oportunidade ainda está amadurecendo.";
   info.textContent="Próxima sexta: "+q.date+" · "+q.pcs.length+
    " PC(s) livre(s) e compatível(is). "+
    (q.reasons.length?q.reasons.join(" "):"Há capacidade para planejar sem ocupar PCs agora.");
   two.disabled=!q.ready||q.pcs.length<2;
   three.disabled=!q.ready||q.pcs.length<3;
   cancel.disabled=!draft;
  }
 };
}
