/** Administração → Finanças → Primeira sexta.
 * Rascunho gratuito, confirmação sem pagamento adiantado e relatório
 * real da última madrugada; noite física executada em nightMeetup.ts.
 */
import type { ActionResult } from "../application/contracts.js";
import type { FridayMeetupPort,FridayMeetupSnapshot } from "../application/fridayMeetupPort.js";
export function installFridayMeetupPanel(
 admin:HTMLElement,port:FridayMeetupPort,onResult:(result:ActionResult)=>void
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
 const renderTrophies=(trophies:FridayMeetupSnapshot["trophies"])=>{
  gallery.hidden=trophies.total===0;
  const signature=(showAllTrophies?"all":"recent")+"|"+trophies.signature;
  if(signature===renderedTrophies)return;renderedTrophies=signature;
  trophyTitle.textContent=trophies.title;trophyRecords.textContent=trophies.records;
  trophyChampions.replaceChildren(...trophies.champions.map(record=>{
   const item=document.createElement("li"),name=document.createElement("strong"),result=document.createElement("span");
   name.textContent=record.name;result.textContent=record.result;item.append(name,result);return item;
  }));
  const visible=showAllTrophies?trophies.items:trophies.items.slice(-4);
  trophyList.replaceChildren(...[...visible].reverse().map(t=>{
   const item=document.createElement("li");item.className="night-trophy-item";
   const symbol=document.createElement("span");symbol.className="night-trophy-symbol";symbol.textContent="🏆";symbol.setAttribute("aria-hidden","true");
   const detail=document.createElement("span");detail.className="night-trophy-detail";
   const date=document.createElement("strong");date.textContent=t.date;
   const champion=document.createElement("span");champion.textContent=t.champion;
   detail.append(date,champion);item.append(symbol,detail);return item;
  }));
  trophyMore.hidden=trophies.total<=4;trophyMore.textContent=showAllTrophies?"Mostrar apenas recentes":"Ver todas as "+trophies.total+" conquistas";
  trophyMore.setAttribute("aria-expanded",String(showAllTrophies));
 };
 trophyMore.addEventListener("click",()=>{
  showAllTrophies=!showAllTrophies;
  renderTrophies(port.snapshot().trophies);
 });
 const confirm=document.createElement("button");confirm.type="button";confirm.className="slice primary";confirm.id="first-meetup-confirm";confirm.textContent="Confirmar encontro de sexta";
 const cancel=document.createElement("button");cancel.type="button";cancel.className="slice";cancel.id="first-meetup-cancel";cancel.textContent="Descartar rascunho";
 const caution=document.createElement("p");caution.className="management-empty";
 caution.textContent="Confirmar não cobra antecipadamente. Cada amigo paga no caixa; o salão fecha ao público às 22h e reabre sábado às 10h.";
 actions.append(two,three,format,confirm,cancel);
 section.append(heading,description,status,info,ranking,gallery,actions,caution);
 admin.querySelector("#section-finance")?.append(section);
 two.addEventListener("click",()=>onResult(port.draft(2)));
 three.addEventListener("click",()=>onResult(port.draft(3)));
 format.addEventListener("click",()=>onResult(port.cycleFormat()));
 confirm.addEventListener("click",()=>onResult(port.confirm()));
 cancel.addEventListener("click",()=>onResult(port.cancel()));
 return {
  render:()=>{
   const view=port.snapshot();
   status.textContent=view.status;info.textContent=view.info;ranking.textContent=view.ranking;
   renderTrophies(view.trophies);format.textContent=view.formatLabel;
   format.disabled=view.formatDisabled;two.disabled=view.twoDisabled;three.disabled=view.threeDisabled;
   confirm.disabled=view.confirmDisabled;cancel.disabled=view.cancelDisabled;
  }
 };
}
