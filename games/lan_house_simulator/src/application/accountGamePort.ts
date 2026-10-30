/** The account UI transports opaque saves and cosmetic commands, never a GameState. */
import { yearFromMinutes } from "../sim/historicalEconomy.js";
import { COOKIE_COSMETICS,setVerifiedCosmetics,toggleVerifiedCosmetic,type CookieCosmeticId } from "../sim/premiumCosmetics.js";
import { parseImportedSave,serializeSave } from "../sim/saveTransfer.js";
import type { GameState } from "../sim/types.js";
export type { CookieCosmeticId } from "../sim/premiumCosmetics.js";
export type AccountCosmetic=(typeof COOKIE_COSMETICS)[number];
export interface AccountGamePort {
 readonly catalog:readonly AccountCosmetic[];
 year():number;
 verifyCosmetics(ids:readonly string[]):void;
 toggleCosmetic(id:CookieCosmeticId,enabled:boolean):boolean;
 prepareRestore(json:string):()=>void;
 exportSaveText():string;
}
export function createAccountGamePort(getState:()=>GameState,restore:(state:GameState)=>void):AccountGamePort{
 return {catalog:COOKIE_COSMETICS,year:()=>yearFromMinutes(getState().totalMinutes),
  verifyCosmetics:ids=>setVerifiedCosmetics([...ids]),toggleCosmetic:toggleVerifiedCosmetic,
  prepareRestore(json){const state=parseImportedSave(json);return ()=>restore(state);},
  exportSaveText:()=>serializeSave(getState())};
}
