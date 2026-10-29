/** Preserve delegated click handlers by reconciling child nodes in place. */
import type {DeskPricingPort,DiscPricingView,PrintPricingView} from "../application/deskPricingPort.js";
export function renderDiscPricing(
 host:Element,view:DiscPricingView,setText:(id:string,value:string)=>void,
 iconMarkup:(id:string)=>string,doc:Pick<Document,"createElement">,
 sync:(current:Element,next:Element)=>void
):void{
 const next=doc.createElement("div");
 for(const item of view.rows){
  const row=doc.createElement("div");row.className="price-control";
  const name=doc.createElement("span");name.innerHTML=iconMarkup("disc");
  name.append("Cópia de "+item.kind.toUpperCase());
  const actions=doc.createElement("div");actions.className="price-actions";
  for(const delta of [-1,1]){
   if(delta===1){const amount=doc.createElement("strong");amount.textContent=item.price;actions.append(amount);}
   const button=doc.createElement("button");button.type="button";button.className="slice";
   button.dataset.discKind=item.kind;button.dataset.delta=String(delta);
   button.textContent=delta<0?"−":"+";
   button.setAttribute("aria-label",(delta<0?"Reduzir":"Aumentar")+" preço da cópia de "+item.kind.toUpperCase());
   button.disabled=delta<0?item.decreaseDisabled:item.increaseDisabled;actions.append(button);
  }
  const cost=doc.createElement("small");cost.className="disc-copy-cost";cost.textContent=item.cost;
  row.append(name,actions,cost);next.append(row);
 }
 sync(host,next);
 setText("disc-copy-summary",view.summary);
 setText("disc-copy-capacity",view.capacity);
}
export function renderPrintPricing(
 host:Element,view:PrintPricingView,setText:(id:string,value:string)=>void,
 doc:Pick<Document,"createElement">,sync:(current:Element,next:Element)=>void
):void{
 const next=doc.createElement("div");
 const row=doc.createElement("div");row.className="price-control";
 const label=doc.createElement("span");label.textContent="Preço por página";
 const actions=doc.createElement("div");actions.className="price-actions";
 for(const delta of [-view.step,view.step]){
  if(delta>0){const amount=doc.createElement("strong");amount.textContent=view.price;actions.append(amount);}
  const button=doc.createElement("button");button.type="button";button.className="slice";
  button.dataset.printDelta=String(delta);button.textContent=delta<0?"−":"+";
  button.disabled=delta<0?view.decreaseDisabled:view.increaseDisabled;
  button.setAttribute("aria-label",(delta<0?"Reduzir":"Aumentar")+" preço da impressão");
  actions.append(button);
 }
 const expense=doc.createElement("small");expense.className="disc-copy-cost";expense.textContent=view.cost;
 row.append(label,actions,expense);next.append(row);sync(host,next);
 setText("print-service-summary",view.summary);
 setText("print-service-capacity",view.capacity);
}

/** Show only the installed desk services, without rebuilding hidden price controls. */
export interface DeskServicePanelsOptions {
 readonly pricingTab:boolean;
 readonly isActive:(page:"discs"|"printing")=>boolean;
 readonly discControls:Element|null;
 readonly printControls:Element|null;
 readonly setText:(id:string,value:string)=>void;
 readonly iconMarkup:(id:string)=>string;
 readonly doc:Pick<Document,"getElementById"|"createElement">;
 readonly sync:(current:Element,next:Element)=>void;
}
export function renderDeskServicePanels(port:DeskPricingPort,options:DeskServicePanelsOptions):void{
 const installed=port.installed();
 const discPanel=options.doc.getElementById("disc-copy-panel");
 if(discPanel)discPanel.hidden=!installed.discs;
 if(options.discControls&&installed.discs&&options.pricingTab&&options.isActive("discs")){
  const view=port.discs();
  if(view)renderDiscPricing(options.discControls,view,options.setText,options.iconMarkup,options.doc,options.sync);
 }
 const printPanel=options.doc.getElementById("print-service-panel");
 if(printPanel)printPanel.hidden=!installed.printer;
 if(options.printControls&&installed.printer&&options.pricingTab&&options.isActive("printing")){
  const view=port.printing();
  if(view)renderPrintPricing(options.printControls,view,options.setText,options.doc,options.sync);
 }
}
