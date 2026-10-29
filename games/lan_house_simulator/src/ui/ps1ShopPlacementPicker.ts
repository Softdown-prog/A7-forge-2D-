/** Hidden purchase select and player-facing PS1 arrows, without business logic. */
import type {Ps1ShopPlacementSpot} from "../application/ps1ShopPlacementPort.js";
export interface Ps1ShopPlacementCard{
 readonly art:Element;readonly category:Element;readonly title:Element;
 readonly description:Element;readonly button:Element;
}
export function renderPs1ShopPlacement(
 card:Element,fields:Ps1ShopPlacementCard,free:readonly Ps1ShopPlacementSpot[],
 selectedId:string|null,onSelect:(id:string|null)=>void,doc:Pick<Document,"createElement">
):void{
 const placement=doc.createElement("select");placement.id="ps1-placement";placement.hidden=true;
 let chosen=free.some(x=>x.id===selectedId)?selectedId:free[0]?.id??null;
 for(const slot of free){
  const option=doc.createElement("option");option.value=slot.id;option.textContent=slot.label;
  placement.append(option);
 }
 placement.value=chosen??"";
 const locationSelector=doc.createElement("div");locationSelector.className="ps1-location-selector";
 const locationName=doc.createElement("output");locationName.id="ps1-location-name";
 locationName.className="ps1-location-name";locationName.setAttribute("aria-live","polite");
 const previous=doc.createElement("button");previous.type="button";previous.className="slice ps1-location-arrow";
 previous.textContent="◀";previous.setAttribute("aria-label","Escolher o local anterior para a bancada");
 const next=doc.createElement("button");next.type="button";next.className="slice ps1-location-arrow";
 next.textContent="▶";next.setAttribute("aria-label","Escolher o próximo local para a bancada");
 const update=(delta:number):void=>{
  if(!free.length)return;
  const index=Math.max(0,free.findIndex(x=>x.id===chosen));
  const slot=free[(index+delta+free.length)%free.length]!;
  chosen=slot.id;onSelect(chosen);placement.value=slot.id;locationName.textContent=slot.label;
 };
 previous.disabled=free.length<2;next.disabled=free.length<2;
 previous.addEventListener("click",()=>update(-1));
 next.addEventListener("click",()=>update(1));
 if(free.length)update(0);else onSelect(null);
 locationSelector.append(previous,locationName,next);
 const help=doc.createElement("small");help.className="ps1-placement-help";
 help.textContent="Escolha um local no salão: norte é o fundo, sul é a entrada, oeste é a esquerda e leste é a direita.";
 card.append(fields.art,fields.category,fields.title,fields.description,placement,locationSelector,help,fields.button);
}
