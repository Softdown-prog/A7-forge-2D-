/** Immutable view of regular shop cards for Angular.
 * The original application ports resolve every price, inventory lock,
 * service quote and placement restriction. No simulation imports here.
 */
import type {ShopCatalogCardItem} from "./shopCatalogCard.js";
import type {ShopCatalogOffer} from "../application/shopCatalogOffersPort.js";
import type {ShopServiceOffer} from "../application/shopServiceOffersPort.js";

export interface AngularShopCardView {
 readonly id:string;
 readonly label:string;
 readonly category:string;
 readonly description:string;
 readonly icon:string;
 readonly artworkSrc:string|null;
 readonly buttonText:string;
 readonly buttonTitle:string;
 readonly disabled:boolean;
 readonly placementHint:string|null;
 readonly ownedText:string|null;
}
export interface AngularShopCatalogView {
 readonly category:string;
 readonly cards:readonly AngularShopCardView[];
 readonly consolesPending:boolean;
}
const allowedIcons=new Set([
 "computer","cart","settings","mail","play","pause","continue","save","upload","close",
 "coins","chart","disc","calendar","sun","rain","network","users","tag","stock","tools",
 "chip","shield","wall","door","expand","move","rotate","plant","poster","table",
 "megaphone","trash","check","cursor","idea","lock","warning","arrow","soda","candy","snacks"
]);
export function shopCardIcon(id:string):string{
 const name=id.includes("computer")?"computer":
  id.startsWith("extend-")||id==="expand"?"expand":id;
 return allowedIcons.has(name)?name:"computer";
}
export function regularShopCardView(
 item:ShopCatalogCardItem,offer:ShopCatalogOffer,
 service:ShopServiceOffer|null,artworkSrc:string|null
):AngularShopCardView{
 return {
  id:item.id,label:item.label,category:item.category,description:item.description,
  icon:shopCardIcon(item.id),artworkSrc,
  buttonText:service?.text??offer.text,
  buttonTitle:service?.title??"",
  disabled:service?.disabled??offer.disabled,
  placementHint:offer.placementHint,ownedText:offer.ownedText
 };
}
/** Existing model publishers can stay dormant while the React UI is live. */
export function publishAngularShopCatalog(
 doc:Document,view:AngularShopCatalogView
):void{
 if(typeof doc.getElementById!=="function"||
   !doc.getElementById("angular-shop-catalog")||
   typeof doc.dispatchEvent!=="function"||
   typeof CustomEvent!=="function")return;
 doc.dispatchEvent(new CustomEvent<AngularShopCatalogView>(
  "lhs:shop-cards-updated",{detail:view}
 ));
}
