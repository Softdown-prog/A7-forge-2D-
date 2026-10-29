/** Read-only PS1 disc purchase projections, always using the currently loaded save. */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";
import {PS1_CD_CATALOG,PS1_MAX_STATIONS,PS1_UNLOCK_YEAR,ps1DiscCopies,ps1DiscPrice} from "../sim/ps1.js";

export interface Ps1ShopDiscRow {
 readonly id:string;
 readonly title:string;
 readonly genre:string;
 readonly copies:number;
 readonly price:number;
 readonly noStation:boolean;
 readonly full:boolean;
 readonly disabled:boolean;
}
export interface Ps1ShopDiscPort {
 snapshot():ReadonlyArray<Ps1ShopDiscRow>|null;
}
export function createPs1ShopDiscPort(getState:()=>GameState):Ps1ShopDiscPort{
 return {snapshot(){
  const game=getState();
  if(game.economyVersion!==2||gameYear(game)<PS1_UNLOCK_YEAR)return null;
  return PS1_CD_CATALOG.map(disc=>{
   const copies=ps1DiscCopies(game,disc.id),price=ps1DiscPrice(game,disc.id);
   const noStation=!(game.ps1Stations?.length),full=copies>=PS1_MAX_STATIONS;
   return {
    id:disc.id,title:disc.title,genre:disc.genre,copies,price,noStation,full,
    disabled:noStation||full||game.cash<price
   };
  });
 }};
}
