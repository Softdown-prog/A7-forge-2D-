import {isValidSave} from "./engine.js";
import {snapshotGameState} from "./saveTransfer.js";
import {DAY_MINUTES,GAME_SAVE_KEY,type GameState} from "./types.js";
export const GAME_SAVE_BACKUP_KEY=GAME_SAVE_KEY+"-backup";
export interface SaveStore {getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void;}
export interface SaveRead {state:GameState|null;source:"primary"|"backup"|"none";invalidPrimary:boolean;}
function decode(raw:string|null):GameState|null{
 if(!raw||raw.length>2_000_000)return null;
 try {
  const data:unknown=JSON.parse(raw);
  if(!isValidSave(data)||!Number.isInteger(data.totalMinutes)||data.totalMinutes<0||
     !Number.isInteger(data.rng)||data.rng<0)return null;
  return data;
 }catch{return null;}
}
export function loadLocalSave(store:Pick<SaveStore,"getItem">):SaveRead{
 let primary:string|null=null;
 // Mesmo que a leitura da chave principal falhe, o backup pode estar acessível.
 try{primary=store.getItem(GAME_SAVE_KEY);}catch{}
 const state=decode(primary);
 if(state)return {state,source:"primary",invalidPrimary:false};
 let backup:string|null=null;
 try{backup=store.getItem(GAME_SAVE_BACKUP_KEY);}catch{}
 const recovered=decode(backup);
 if(recovered)return {state:recovered,source:"backup",invalidPrimary:primary!==null};
 return {state:null,source:"none",invalidPrimary:primary!==null};
}
function encode(state:GameState):string{
 if(!isValidSave(state)||!Number.isInteger(state.totalMinutes)||state.totalMinutes<0||
    !Number.isInteger(state.rng)||state.rng<0)throw Error("Estado do jogo inválido.");
 const json=JSON.stringify(snapshotGameState(state));
 if(json.length>2_000_000)throw Error("Limite local de 2 MB excedido.");
 return json;
}
/** Guarda uma versão válida anterior; renova a cópia por dia do jogo, não por frame. */
export function writeLocalSave(store:SaveStore,state:GameState):void{
 const payload=encode(state),old=store.getItem(GAME_SAVE_KEY),existing=decode(old);
 if(existing){
  // Falha de leitura do checkpoint não deve bloquear uma gravação principal válida.
  let last:GameState|null=null;
  try{last=decode(store.getItem(GAME_SAVE_BACKUP_KEY));}catch{}
  const oldDay=Math.floor(existing.totalMinutes/DAY_MINUTES);
  const backDay=last?Math.floor(last.totalMinutes/DAY_MINUTES):-1;
  if(!last||oldDay>backDay){
   try{store.setItem(GAME_SAVE_BACKUP_KEY,old!);}
   catch{/* Backup opcional: a cópia principal tem prioridade. */}
  }
 }
 store.setItem(GAME_SAVE_KEY,payload);
}
/** Substituições explícitas nunca recuperam um backup de campanha anterior. */
export function replaceLocalSave(store:SaveStore,state:GameState):void{
 store.setItem(GAME_SAVE_KEY,encode(state));
 try{store.removeItem(GAME_SAVE_BACKUP_KEY);}catch{}
}
