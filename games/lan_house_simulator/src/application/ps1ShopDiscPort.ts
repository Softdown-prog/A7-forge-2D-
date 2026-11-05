/** Read-only PS1 disc purchase projections, always using the currently loaded save. */
import type {GameState} from "../sim/types.js";
import {gameYear} from "../sim/era.js";
import {PS1_MAX_STATIONS,PS1_UNLOCK_YEAR,PS1_CD_CATALOG,ps1ReleasedDiscs,ps1DiscCopies,ps1DiscPrice} from "../sim/ps1.js";

export interface Ps1ShopDiscRow {
 readonly id:string;
 readonly releaseYear:number;
 readonly title:string;
 readonly genre:string;
 readonly copies:number;
 readonly price:number;
 readonly noStation:boolean;
 readonly full:boolean;
 readonly disabled:boolean;
}
/** Shows the next yearly milestone without exposing unreleased titles or changing saves. */
export function nextPs1DiscReleaseYear(rows:ReadonlyArray<Pick<Ps1ShopDiscRow,"releaseYear">>|null):number|null{
 if(!rows?.length)return null;
 const last=rows[rows.length-1]!.releaseYear;
 return PS1_CD_CATALOG.find(d=>d.releaseYear>last)?.releaseYear??null;
}
export interface Ps1ShopDiscPort {
 snapshot():ReadonlyArray<Ps1ShopDiscRow>|null;
}
export function createPs1ShopDiscPort(getState:()=>GameState):Ps1ShopDiscPort{
 return {snapshot(){
  const game=getState();
  if(game.economyVersion!==2||gameYear(game)<PS1_UNLOCK_YEAR)return null;
  return ps1ReleasedDiscs(gameYear(game)).map(disc=>{
   const copies=ps1DiscCopies(game,disc.id),price=ps1DiscPrice(game,disc.id);
   const noStation=!(game.ps1Stations?.length),full=copies>=PS1_MAX_STATIONS;
   return {
    id:disc.id,title:disc.title,releaseYear:disc.releaseYear,genre:disc.genre,copies,price,noStation,full,
    disabled:noStation||full||game.cash<price
   };
  });
 }};
}
