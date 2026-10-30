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
 for(const item of options.items){
  if(shopCategory(item.id)!==options.currentCategory())continue;
  const fields=createShopCatalogCard(item,options.doc);
  const {card,art,category,title,description,button}=fields;
  const offer=options.offer(item.id);
  const placementHint=offer.placementHint;
  renderShopCatalogOfferButton(button,offer);
  if(item.id==="printer"||item.id==="disc-copier"){
   renderShopServiceOffer(button,options.service(item.id));
  }
  if(item.id==="ps1"){
   renderPs1ShopOfferButton(button,options.ps1Offer());
   renderPs1ShopPlacement(card,{art,category,title,description,button},
    options.ps1Slots(),options.selectedPs1Slot(),options.selectPs1Slot,options.doc);
  }else{
   appendStandardShopCatalogCard(fields,placementHint,options.doc);
  }
  if(offer.ownedText!==null)appendShopCatalogOwned(card,offer.ownedText,options.doc);
  options.host.append(card);
 }
 renderPs1ShopDiscCatalog(options.host,options.discs,options.currentCategory()==="consoles",options.doc);
 if(options.ps2&&options.currentCategory()==="consoles")renderPs2ShopCatalog(options.host,options.ps2,options.doc);
}
