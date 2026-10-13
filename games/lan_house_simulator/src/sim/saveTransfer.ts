import type { GameState } from "./types.js";
import { isValidSave } from "./engine.js";
import { validFurniturePlacements } from "./shop.js";
import {validRoomExtensions} from "./room.js";
export const SAVE_EXPORT_FORMAT="softdown-lan-house-save";
export interface SaveEnvelope { format:typeof SAVE_EXPORT_FORMAT; exportVersion:1; exportedAt:string; state:GameState }
export function serializeSave(state:GameState):string {
 if(!isValidSave(state))throw Error("Estado de jogo inválido.");
 const envelope:SaveEnvelope={format:SAVE_EXPORT_FORMAT,exportVersion:1,exportedAt:new Date().toISOString(),state};
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
 if(!Number.isInteger(state.totalMinutes)||state.totalMinutes<0||state.totalMinutes>1e9 ||
    !Number.isInteger(state.cash)||Math.abs(state.cash)>1e9||
    !Number.isInteger(state.rng)||state.rng<0||
    !Number.isInteger(state.pricePerHour)||state.pricePerHour<4||state.pricePerHour>40||
    !Number.isInteger(state.internetTier)||state.internetTier<1||state.internetTier>3||
    !Number.isInteger(state.expansionLevel)||state.expansionLevel<0||state.expansionLevel>2||
    !Array.isArray(state.customers)||state.customers.length>200||
    !Array.isArray(state.eventLog)||state.eventLog.length>500||
    !state.eventLog.every(x=>typeof x==="string"&&x.length<1000)||
    !Object.values(state.inventory).every(x=>Number.isInteger(x)&&x>=0&&x<1e6)
 )throw Error("A partida contém valores fora dos limites.");
 if(!validRoomExtensions(state))throw Error("Extensões de salão inválidas.");
 if(!validFurniturePlacements(state))throw Error("Posicionamento de móveis inválido.");
 return structuredClone(state);
}
