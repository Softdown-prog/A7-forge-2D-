/** Read-only catalog offers for ordinary shop items, using the active save. */
import type {GameState} from "../sim/types.js";
import {shopPrice,furnitureLimit,availablePlacementSlots,nextComputerPlacementIssue,type FurnitureKind} from "../sim/shop.js";
import {MAX_EXTENSION_LEVEL,type ExtensionDirection} from "../sim/room.js";
import {shopPlacementStatus,shopPurchaseButtonText} from "./shopCatalogGuidance.js";

export interface ShopCatalogOffer {
 readonly disabled:boolean;
 readonly text:string;
 readonly placementHint:string|null;
 readonly ownedText:string|null;
}
export interface ShopCatalogOffersPort {
 snapshot(id:string):ShopCatalogOffer;
}
export function createShopCatalogOffersPort(
 getState:()=>GameState,
 getAvailableAnnexCount:()=>number
):ShopCatalogOffersPort {
 return {snapshot(id){
  const s=getState();
  const isFurniture=id==="poster"||id==="plant"||id==="table";
  const kind=id as FurnitureKind;
  const max=isFurniture?furnitureLimit(s,kind):0;
  const count=s.furniture?.[kind]??0;
  const ext=id.startsWith("extend-")?id.slice(7) as ExtensionDirection:null;
  const slots=max>0?availablePlacementSlots(s,kind).length:0;
  const full=id==="door"?!(s.interiorWalls?.length):
   id==="computer-annex"?!getAvailableAnnexCount():
   ext?(s.roomExtensions?.[ext]??0)>=MAX_EXTENSION_LEVEL:
   id==="expand"?s.expansionLevel>=2:
   id==="computer"?(s.installedPcs??(3+s.expansionLevel*2))>=3+s.expansionLevel*2:
   max>0&&(count>=max||!slots);
  const price=shopPrice(s,id),poor=s.cash<price;
  // A vaga numérica pode estar livre mesmo que móveis ou circulação impeçam a instalação.
  const placementIssue=id==="computer"&&!full?nextComputerPlacementIssue(s):null;
  const hint=shopPlacementStatus(s,id);
  return {
   disabled:full||poor||placementIssue!==null,
   text:full||poor||placementIssue===null?shopPurchaseButtonText(id,full,poor,price,max>0):"Posição do próximo PC bloqueada",
   placementHint:placementIssue?(hint?hint+" ":"")+placementIssue:hint,
   ownedText:max>0?"Instalados: "+count+" · posições livres: "+slots:null
  };
 }};
}
