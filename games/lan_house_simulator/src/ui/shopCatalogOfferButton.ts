/** Applies a precomputed catalog offer; never imports the simulation. */
import type {ShopCatalogOffer} from "../application/shopCatalogOffersPort.js";
export function renderShopCatalogOfferButton(
 button:Pick<HTMLButtonElement,"disabled"|"textContent">,
 offer:ShopCatalogOffer
):void {
 button.disabled=offer.disabled;
 button.textContent=offer.text;
}
