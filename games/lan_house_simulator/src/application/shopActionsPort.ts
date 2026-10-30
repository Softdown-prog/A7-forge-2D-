/** Business purchase entry point, bound to the latest restored save. */
import type {GameState,Result} from "../sim/types.js";
import {buyComputer,availablePlacementSlots,type FurnitureKind} from "../sim/shop.js";
import {buyPrinter} from "../sim/printService.js";
import {buyDiscCopier} from "../sim/discCopy.js";
import {expandShop} from "../sim/economy.js";
import {expandDirection,type ExtensionDirection} from "../sim/room.js";
import {buyPs2Station} from "../sim/ps2.js";
import {buyPs1Station} from "../sim/ps1.js";

export interface ShopActionsPort {
 canPlace(kind:string):boolean;
 purchase(id:string,ps1SlotId?:string):Result;
}
const furniture=(s:string):s is FurnitureKind=>s==="poster"||s==="plant"||s==="table";
const extension=(s:string):s is ExtensionDirection=>s==="west"||s==="east"||s==="north";
export function createShopActionsPort(getState:()=>GameState):ShopActionsPort{
 return {
  canPlace(kind){return furniture(kind)&&availablePlacementSlots(getState(),kind).length>0;},
  purchase(id,ps1SlotId=""){
   const s=getState();
   switch(id){
    case "expand":return expandShop(s);
    case "computer":return buyComputer(s);
    case "ps1":return buyPs1Station(s,ps1SlotId);
    case "ps2":return buyPs2Station(s,ps1SlotId);
    case "disc-copier":return buyDiscCopier(s);
    case "printer":return buyPrinter(s);
    default: {
     if(id.startsWith("extend-")){
      const direction=id.slice(7);
      if(extension(direction))return expandDirection(s,direction);
     }
     return {ok:false,message:"Compra desconhecida."};
    }
   }
  }
 };
}
