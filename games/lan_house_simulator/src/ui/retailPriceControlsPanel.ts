/** Build an offscreen quick-price panel and reconcile with the existing DOM. */
import type {RetailQuickRow} from "../application/retailPriceStatusPort.js";

export function renderRetailPriceControls(
 host:Element,
 rows:ReadonlyArray<RetailQuickRow>,
 iconMarkup:(id:string)=>string,
 doc:Pick<Document,"createElement">,
 syncPanelChildren:(current:Element,next:Element)=>void
):void {
 const nextRetail=doc.createElement("div");
 for(const row of rows){
  const line=doc.createElement("div");
  line.className="price-control";
  const name=doc.createElement("span");
  name.textContent=row.label;
  name.insertAdjacentHTML("afterbegin",iconMarkup(row.id));
  const actions=doc.createElement("div");
  actions.className="price-actions";
  for(const delta of [-1,1]){
   const button=doc.createElement("button");
   button.type="button";
   button.dataset.item=row.id;
   button.dataset.delta=String(delta);
   button.textContent=delta<0?"−":"+";
   button.setAttribute("aria-label",(delta<0?"Reduzir ":"Aumentar ")+row.label);
   button.disabled=delta<0?row.decreaseDisabled:row.increaseDisabled;
   if(delta===1){
    const amount=doc.createElement("strong");
    amount.textContent=row.priceText;
    actions.append(amount);
   }
   actions.append(button);
  }
  line.append(name,actions);
  nextRetail.append(line);
 }
 const catalogLink=doc.createElement("button");
 catalogLink.type="button";
 catalogLink.id="retail-full-catalog";
 catalogLink.className="slice";
 catalogLink.textContent="Ver todas as mercadorias e margens no Estoque";
 nextRetail.append(catalogLink);
 syncPanelChildren(host,nextRetail);
}
