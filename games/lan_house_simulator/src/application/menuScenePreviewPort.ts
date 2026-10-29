/** Independent ornamental menu sample. Never mutates or advances the player's active save.
 * Creation belongs to the application layer, not the DOM presentation module.
 */
import {createGame,pcPosition} from "../sim/engine.js";
import {computerSeat} from "../sim/route.js";
import type {GameState} from "../sim/types.js";

export function createMenuScenePreview():GameState {
 const sample=createGame(98);
 sample.customers=[0,1].map(i=>{
  const seat=computerSeat(pcPosition(i,sample));
  return {id:i+1,x:seat.x,y:seat.y,target:seat,route:[],stage:"using",
   costume:"regular",pcIndex:i,facing:"north",usedMinutes:0,
   waitingMinutes:0,offlineWait:0,happy:true};
 });
 return sample;
}
