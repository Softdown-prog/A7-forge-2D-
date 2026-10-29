/** DOM-only counter service purchase button; does not import the simulation. */
import type {ShopServiceOffer} from "../application/shopServiceOffersPort.js";
export function renderShopServiceOffer(
 button:Pick<HTMLButtonElement,"disabled"|"title"|"textContent">,
 offer:ShopServiceOffer
):void{
 button.disabled=offer.disabled;
 button.title=offer.title;
 button.textContent=offer.text;
}
