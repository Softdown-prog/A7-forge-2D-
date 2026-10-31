/** Updates the original shop DOM or publishes a read-only Angular view.
 * The native TypeScript controls still own every action and purchase.
 */
import type {ShopOverviewSnapshot} from "../application/shopOverviewPort.js";
const published=new WeakMap<object,string>();

export function renderShopOverview(
 view:ShopOverviewSnapshot,
 doc:Pick<Document,"querySelector"|"getElementById">
):void {
 // An explicit Angular host is the sole owner of its child buttons and text.
 // Never mutate Angular-managed nodes from the legacy DOM writer.
 if(doc.getElementById("angular-shop-overview")){
  if("dispatchEvent" in doc && typeof doc.dispatchEvent==="function" &&
     typeof CustomEvent==="function"){
   const fingerprint=JSON.stringify(view);
   if(published.get(doc)!==fingerprint){
    published.set(doc,fingerprint);
    doc.dispatchEvent(new CustomEvent("lhs:shop-overview-updated",{detail:view}));
   }
  }
  return;
 }
 const organize=doc.querySelector<HTMLButtonElement>("#organize-furniture");
 if(organize){organize.disabled=false;organize.textContent=view.organizeText;}
 const demolish=doc.querySelector<HTMLButtonElement>("#demolish-walls");
 if(demolish){demolish.disabled=view.demolishDisabled;demolish.textContent=view.demolishText;}
 const cash=doc.getElementById("shop-cash");
 if(cash)cash.textContent=view.cashText;
}
