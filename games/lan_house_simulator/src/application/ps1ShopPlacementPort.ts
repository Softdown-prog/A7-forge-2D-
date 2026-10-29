/** Available PS1 station slots with player-facing names, read from the active save. */
import type {GameState} from "../sim/types.js";
import {ps1PlacementSlots,ps1PlacementLabel} from "../sim/ps1.js";
export interface Ps1ShopPlacementSpot{readonly id:string;readonly label:string}
export interface Ps1ShopPlacementPort{snapshot():readonly Ps1ShopPlacementSpot[]}
export function createPs1ShopPlacementPort(getState:()=>GameState):Ps1ShopPlacementPort{
 return {snapshot:()=>ps1PlacementSlots(getState()).map(slot=>({id:slot.id,label:ps1PlacementLabel(slot)}))};
}
