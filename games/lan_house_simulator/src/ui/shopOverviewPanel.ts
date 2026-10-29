/** Only updates existing shop header elements; actions remain wired in main.ts. */
import type {ShopOverviewSnapshot} from "../application/shopOverviewPort.js";
export function renderShopOverview(
 view:ShopOverviewSnapshot,
 doc:Pick<Document,"querySelector"|"getElementById">
):void {
 const organize=doc.querySelector<HTMLButtonElement>("#organize-furniture");
 if(organize){organize.disabled=false;organize.textContent=view.organizeText;}
 const demolish=doc.querySelector<HTMLButtonElement>("#demolish-walls");
 if(demolish){demolish.disabled=view.demolishDisabled;demolish.textContent=view.demolishText;}
 const cash=doc.getElementById("shop-cash");
 if(cash)cash.textContent=view.cashText;
}
