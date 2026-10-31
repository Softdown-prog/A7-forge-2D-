/** DOM-only shop catalog composition.
 * Inventory, prices, licensing and placement availability are supplied
 * through live read models, never taken from the game simulation here.
 */
import {createShopCatalogCard,appendStandardShopCatalogCard,appendShopCatalogOwned,type ShopCatalogCardItem} from "./shopCatalogCard.js";
import {renderShopCatalogOfferButton} from "./shopCatalogOfferButton.js";
import {renderShopServiceOffer} from "./shopServiceOfferButton.js";
import {renderPs1ShopOfferButton} from "./ps1ShopOfferButton.js";
import {renderPs1ShopPlacement} from "./ps1ShopPlacementPicker.js";
import {renderPs1ShopDiscCatalog} from "./ps1ShopDiscCatalog.js";
import {renderPs2ShopCatalog} from "./ps2Panels.js";
import {regularShopCardView,publishAngularShopCatalog,
 type AngularShopCardView} from "./shopCatalogAngularProjection.js";
import {projectConsoleShop,publishAngularConsoleShop} from "./shopConsoleAngularProjection.js";
import type {Ps2Port} from "../application/ps2Port.js";
import {shopCategory} from "./shopPanels.js";
import type {ShopCatalogOffer} from "../application/shopCatalogOffersPort.js";
import type {ShopServiceOffer,ShopServiceOfferId} from "../application/shopServiceOffersPort.js";
import type {Ps1ShopOffer} from "../application/ps1ShopOfferPort.js";
import type {Ps1ShopPlacementSpot} from "../application/ps1ShopPlacementPort.js";
import type {Ps1ShopDiscPort} from "../application/ps1ShopDiscPort.js";

export interface ShopCatalogRenderOptions {
 readonly host:HTMLElement;
 readonly doc:Document;
 readonly items:readonly ShopCatalogCardItem[];
 readonly currentCategory:()=>string|undefined;
 readonly renderOverview:()=>void;
 readonly offer:(id:string)=>ShopCatalogOffer;
 readonly service:(id:ShopServiceOfferId)=>ShopServiceOffer;
 readonly ps1Offer:()=>Ps1ShopOffer;
 readonly ps1Slots:()=>readonly Ps1ShopPlacementSpot[];
 readonly selectedPs1Slot:()=>string|null;
 readonly selectPs1Slot:(id:string|null)=>void;
 readonly discs:Ps1ShopDiscPort;
 readonly ps2?:Ps2Port;
}

export function renderShopCatalog(options:ShopCatalogRenderOptions):void {
 options.renderOverview();
 options.host.replaceChildren();
 const angularCards:AngularShopCardView[]=[];
 const currentCategory=options.currentCategory();
 for(const item of options.items){
  if(shopCategory(item.id)!==currentCategory)continue;
  const fields=createShopCatalogCard(item,options.doc);
  const {card,art,category,title,description,button}=fields;
  const offer=options.offer(item.id);
  const placementHint=offer.placementHint;
  renderShopCatalogOfferButton(button,offer);
  const serviceOffer=item.id==="printer"||item.id==="disc-copier"
   ?options.service(item.id):null;
  if(serviceOffer)renderShopServiceOffer(button,serviceOffer);
  if(item.id==="ps1"){
   renderPs1ShopOfferButton(button,options.ps1Offer());
   renderPs1ShopPlacement(card,{art,category,title,description,button},
    options.ps1Slots(),options.selectedPs1Slot(),options.selectPs1Slot,options.doc);
  }else{
   appendStandardShopCatalogCard(fields,placementHint,options.doc);
  }
  if(offer.ownedText!==null)appendShopCatalogOwned(card,offer.ownedText,options.doc);
  options.host.append(card);
  // Only regular cards are ported in this step. PS1/PS2 remain on their
  // procedural Canvas renderers and existing purchase handlers.
  if(item.id!=="ps1"){
   const artworkSrc=art.querySelector<HTMLImageElement>("img")?.getAttribute("src")??null;
   angularCards.push(regularShopCardView(item,offer,serviceOffer,artworkSrc));
  }
 }
 publishAngularShopCatalog(options.doc,{
  category:currentCategory??"equipment",cards:angularCards,
  consolesPending:currentCategory==="consoles"
 });
 renderPs1ShopDiscCatalog(options.host,options.discs,options.currentCategory()==="consoles",options.doc);
 if(options.ps2&&options.currentCategory()==="consoles")renderPs2ShopCatalog(options.host,options.ps2,options.doc);
 if(currentCategory==="consoles"&&options.doc.getElementById("angular-shop-catalog")){
  const ps1Card=options.host.querySelector<HTMLButtonElement>('button[data-buy="ps1"]')?.closest(".shop-card");
  const ps1Artwork=ps1Card?.querySelector<HTMLImageElement>(".shop-art img")?.getAttribute("src")??null;
  const ps2Canvas=options.host.querySelector<HTMLCanvasElement>(".ps2-bench-card canvas");
  const ps2Artwork=ps2Canvas?.toDataURL()??null;
  publishAngularConsoleShop(options.doc,projectConsoleShop(
   options.ps1Offer(),options.ps1Slots(),options.selectedPs1Slot(),
   options.discs.snapshot(),options.ps2?.snapshot()??null,ps1Artwork,ps2Artwork
  ));
 }
 // Only alert presentation controls after the original DOM catalogue is complete.
 options.host.dispatchEvent(new Event("lhs:shop-catalog-updated"));
}
