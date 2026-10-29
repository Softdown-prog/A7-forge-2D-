/** Read-only invalidation signature for the shop catalog.
 * Keeps the 17 legacy fields in their exact order for JSON cache comparison.
 * Uses the active game at call time, including after an imported save.
 */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";

export interface ShopCatalogRevisionPort {
 snapshot(category:string|undefined):ReadonlyArray<unknown>;
}
export function createShopCatalogRevisionPort(getState:()=>GameState):ShopCatalogRevisionPort {
 return {snapshot(category){
  const s=getState();
  return [
   category,s.cash,s.discCopier,s.printer,s.ps1Stations,s.ps1Discs,
   gameYear(s),s.expansionLevel,s.installedPcs,s.annexPcs,
   s.roomExtensions,s.furniture,s.furniturePlacements,s.objectPlacements,
   s.removedBuiltPosters,s.interiorWalls,s.interiorDoors
  ];
 }};
}
