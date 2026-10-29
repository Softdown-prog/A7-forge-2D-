/** Applies a PS1 shop offer without running purchases or importing the motor. */
import type {Ps1ShopOffer} from "../application/ps1ShopOfferPort.js";

export function renderPs1ShopOfferButton(
 button:Pick<HTMLButtonElement,"disabled"|"textContent">,
 offer:Ps1ShopOffer
):void {
 button.disabled=offer.disabled;
 button.textContent=offer.text;
}
