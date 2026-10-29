/** Read-only bin geometry/status, shared by navigation and service commands. */
import {placedObject} from "./layout.js";
import type {GameState,Point} from "./types.js";

export const BIN_SPOTS:Point[]=[{x:1.1,y:3.1},{x:5.65,y:4.65}];

export function binSpots(s:GameState):Point[]{return BIN_SPOTS.map((p,i)=>placedObject(s,"bin:"+i,p));}

export type BinStatus="empty"|"filling"|"full";

export function binStatus(fill:number):BinStatus{
 return fill>=100?"full":fill>0?"filling":"empty";
}

export function binStates(s:GameState):BinStatus[]{
 return BIN_SPOTS.map((_,i)=>binStatus(s.binFill?.[i]??0));
}
