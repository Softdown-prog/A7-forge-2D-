import {validateObjectPlacements} from "./editableObjects.js";
import type { GameState } from "./types.js";
import { DAY_MINUTES } from "./types.js";
import {GAME_LAST_MINUTE} from "./mailCalendar.js";
import { isValidSave } from "./engine.js";
import { validFurniturePlacements } from "./shop.js";
import {validRoomExtensions} from "./room.js";
import {validInteriorWalls,validInteriorDoors} from "./walls.js";
import {validAnnexComputers} from "./stations.js";
import {MIN_HOURLY_PRICE} from "./historicalEconomy.js";
export const SAVE_EXPORT_FORMAT="softdown-lan-house-save";
export interface SaveEnvelope { format:typeof SAVE_EXPORT_FORMAT; exportVersion:1; exportedAt:string; state:GameState }
/** Exclui filas visuais efêmeras. O estado econômico e das estações
 * permanece idêntico, inclusive em saves antigos importados. */
export function snapshotGameState(state:GameState):GameState {
 const {paymentEffects,saleEffects,keyboardEffects,speechEffects,printEffects,...persisted}=state;
 return persisted;
}
export function serializeSave(state:GameState):string {
 if(!isValidSave(state))throw Error("Estado de jogo inválido.");
 const envelope:SaveEnvelope={format:SAVE_EXPORT_FORMAT,exportVersion:1,exportedAt:new Date().toISOString(),state:snapshotGameState(state)};
 return JSON.stringify(envelope,null,2);
}
export function parseImportedSave(input:string):GameState {
 if(input.length>2_000_000)throw Error("Arquivo de salvamento muito grande.");
 let value:unknown;
 try{value=JSON.parse(input);}catch{throw Error("Arquivo JSON inválido.");}
 if(!value||typeof value!=="object")throw Error("Estrutura do salvamento inválida.");
 const e=value as Partial<SaveEnvelope>;
 if(e.format!==SAVE_EXPORT_FORMAT||e.exportVersion!==1)throw Error("Arquivo incompatível com Lan House Simulator.");
 if(!isValidSave(e.state))throw Error("A partida contém dados inválidos.");
 const state=e.state;
 const historical=state.economyVersion===2;
 // Após milhares de transações, somas em ponto flutuante acumulam
 // resíduos ínfimos (ex.: R$ 94492.13000001055). Aceitar no máximo
 // 0,0001 centavo de diferença, sem permitir frações monetárias reais.
 const validCents=(value:number)=>Number.isFinite(value)&&
  Math.abs(value*100-Math.round(value*100))<1e-4;
 if(!Number.isInteger(state.totalMinutes)||state.totalMinutes<0||state.totalMinutes>1e9 ||
    Math.abs(state.cash)>1e9||(historical?!validCents(state.cash):!Number.isInteger(state.cash))||
    !Number.isInteger(state.rng)||state.rng<0||
    (historical?(!validCents(state.pricePerHour)||state.pricePerHour<MIN_HOURLY_PRICE||
      state.pricePerHour>40):(!Number.isInteger(state.pricePerHour)||
      state.pricePerHour<4||state.pricePerHour>40))||
    !Number.isInteger(state.internetTier)||state.internetTier<1||state.internetTier>3||
    !Number.isInteger(state.expansionLevel)||state.expansionLevel<0||state.expansionLevel>2||
    !Array.isArray(state.customers)||state.customers.length>200||
    !Array.isArray(state.eventLog)||state.eventLog.length>500||
    !state.eventLog.every(x=>typeof x==="string"&&x.length<1000)||
    !Object.values(state.inventory).every(x=>Number.isInteger(x)&&x>=0&&x<1e6)||
    (state.promotionDay!==undefined&&(!Number.isInteger(state.promotionDay)||state.promotionDay<1||state.promotionDay>Math.floor(state.totalMinutes/DAY_MINUTES)+1))
 )throw Error("A partida contém valores fora dos limites.");
 if(!validRoomExtensions(state))throw Error("Extensões de salão inválidas.");
 if(!validateObjectPlacements(state))throw Error("Layout do salão inválido.");
 if(!validFurniturePlacements(state))throw Error("Posicionamento de móveis inválido.");
 if(!validInteriorWalls(state))throw Error("Paredes internas inválidas.");
 if(!validInteriorDoors(state))throw Error("Portas internas inválidas.");
 if(!validAnnexComputers(state))throw Error("Computadores dos anexos inválidos.");
 const restored=structuredClone(state);
 if(restored.totalMinutes>GAME_LAST_MINUTE){restored.totalMinutes=GAME_LAST_MINUTE;restored.leftoverMinutes=0;}
 return restored;
}
