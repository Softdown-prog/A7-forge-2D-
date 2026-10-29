/** Keep live computer controls and keyboard focus stable across panel updates. */
export interface PcMaintenanceRenderActions{
 /** Build the selected page into the detached container, using the current save. */
 build(container:HTMLDivElement):void;
 decorate(container:HTMLDivElement):void;
 reconcile(existing:Element,next:Element):void;
 /** Selected computer after building, when a save or station count has changed. */
 selectedStation():number;
}
export function renderPcMaintenancePanel(
 host:HTMLElement,
 actions:PcMaintenanceRenderActions,
 doc:Pick<Document,"createElement"|"activeElement">=document
):void{
 // Build offscreen to keep the old scroll geometry, focus and preserved details.
 const next=doc.createElement("div");
 const focused=doc.activeElement;
 const focusSelector=focused instanceof HTMLButtonElement&&host.contains(focused)
  ?focused.id?"#"+focused.id:focused.dataset.lcdBuy!==undefined?
   '[data-lcd-buy="'+focused.dataset.lcdBuy+'"]':
   focused.dataset.lcdSelect!==undefined?
   '[data-lcd-select="'+focused.dataset.lcdSelect+'"]':null:null;
 actions.build(next);
 actions.decorate(next);
 actions.reconcile(host,next);
 if(focusSelector&&(!(focused instanceof HTMLButtonElement)||!focused.isConnected||focused.disabled)){
  const restored=host.querySelector<HTMLButtonElement>(focusSelector);
  const fallback=focusSelector.startsWith("#hardware-")?
   host.querySelector<HTMLButtonElement>("#hardware-select-"+actions.selectedStation()):
   host.querySelector<HTMLButtonElement>('.lcd-upgrades [aria-pressed="true"]');
  (restored&&!restored.disabled?restored:fallback)?.focus({preventScroll:true});
 }
}
