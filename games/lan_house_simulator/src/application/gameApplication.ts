/** Owns the active campaign. Replacement is persisted before notifying any adapter. */
import type { SaveStore } from "../sim/localSave.js";
import type { GameState } from "../sim/types.js";
import { createAccountGamePort } from "./accountGamePort.js";
import { createGameFramePort,type RuntimeAudio } from "./gameFramePort.js";
import { createGamePorts } from "./gamePorts.js";
import { createGameSessionPort } from "./gameSessionPort.js";
import type { LayoutEditorCamera } from "./layoutEditorPort.js";
export type CampaignMode="classic"|"historical";
export type SessionReplacement="import"|"cloud"|CampaignMode;
export interface GameApplicationOptions {store:SaveStore;mailSeed:(seed:number)=>number;audio:RuntimeAudio;cameraForState:(state:GameState)=>LayoutEditorCamera}
export function createGameApplication(options:GameApplicationOptions){
 let game:GameState;
 const sessionPort=createGameSessionPort(options.store,()=>game);
 const startup=sessionPort.startup();
 const newGame=(mode:CampaignMode)=>sessionPort.newGame(72421,mode,options.mailSeed(72421));
 game=startup.state??newGame("historical");
 const getState=()=>game;
 const frame=createGameFramePort(getState,options.audio);
 const listeners=new Set<(reason:SessionReplacement)=>void>();
 function replace(state:GameState,reason:SessionReplacement){
  sessionPort.replace(state); // A storage failure must keep every old getter and UI untouched.
  game=state;frame.reset();
  for(const listener of listeners)listener(reason);
 }
 const session={
  startup:{source:startup.source,invalidPrimary:startup.invalidPrimary},
  persist:()=>sessionPort.persist(),exportSnapshot:()=>sessionPort.exportSnapshot(),
  prepareImport(json:string){const state=sessionPort.parseImport(json);return ()=>replace(state,"import");},
  newCampaign:(mode:CampaignMode)=>replace(newGame(mode),mode),
  onReplaced(listener:(reason:SessionReplacement)=>void){listeners.add(listener);return ()=>listeners.delete(listener);},
  beginPlay:()=>frame.beginPlay()
 };
 return {ports:createGamePorts(getState,options.cameraForState),frame,session,
  account:createAccountGamePort(getState,state=>replace(state,"cloud")),
  /** Only the Canvas adapter receives this source; it is not part of GamePorts. */
  renderSource:getState};
}
export type GameApplication=ReturnType<typeof createGameApplication>;
export type RuntimeSessionPort=GameApplication["session"];
