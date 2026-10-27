/** LHS session boundary. No DOM or global storage: callers inject the store
 * and the current-game getter. The schema, validation, and backup rules are
 * still owned by sim/localSave and sim/saveTransfer.
 */
import type {GameState} from "../sim/types.js";
import {createGame,dayNumber} from "../sim/engine.js";
import {GAME_LAST_MINUTE} from "../sim/mailCalendar.js";
import {clampPriceToEra} from "../sim/historicalEconomy.js";
import {loadLocalSave,replaceLocalSave,writeLocalSave,type SaveRead,type SaveStore} from "../sim/localSave.js";
import {serializeSave,parseImportedSave} from "../sim/saveTransfer.js";

export interface GameSessionPort {
 startup():SaveRead;
 newGame(seed:number,mode:"classic"|"historical",mailSeed:number):GameState;
 persist():void;
 replace(state:GameState):void;
 parseImport(json:string):GameState;
 exportSnapshot():{filename:string;contents:string};
}
export function createGameSessionPort(
 store:SaveStore,getState:()=>GameState
):GameSessionPort{
 return {
  startup(){
   const loaded=loadLocalSave(store);
   if(loaded.state){
    if(loaded.state.totalMinutes>GAME_LAST_MINUTE){
     loaded.state.totalMinutes=GAME_LAST_MINUTE;
     loaded.state.leftoverMinutes=0;
    }
    clampPriceToEra(loaded.state);
   }
   return loaded;
  },
  newGame(seed,mode,mailSeed){
   const fresh=createGame(seed,mode);
   fresh.mailScheduleSeed=mailSeed>>>0;
   return fresh;
  },
  persist(){writeLocalSave(store,getState());},
  replace(state){replaceLocalSave(store,state);},
  parseImport(json){return parseImportedSave(json);},
  exportSnapshot(){
   const state=getState();
   return {filename:"lan-house-simulator-dia-"+dayNumber(state)+".json",
    contents:serializeSave(state)};
  }
 };
}
