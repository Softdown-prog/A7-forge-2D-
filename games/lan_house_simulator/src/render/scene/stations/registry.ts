/** Console drawing registry: keep a new generation out of the central scene renderer. */
import type {ConsoleGeneration} from "../../../sim/consoleLayout.js";
import type {GameState} from "../../../sim/types.js";
import type {Projection} from "../../isometric.js";
import {collectPs1Entries} from "./ps1.js";
import {collectPs2Entries} from "./ps2.js";
import type {ConsoleEntryCollector,SceneStationEntry} from "./types.js";

export type ConsoleRegistration=readonly [ConsoleGeneration,ConsoleEntryCollector];
export function createConsoleRegistry(entries:readonly ConsoleRegistration[]):ReadonlyMap<ConsoleGeneration,ConsoleEntryCollector>{
 const handlers=new Map<ConsoleGeneration,ConsoleEntryCollector>();
 for(const [generation,collect] of entries){
  if(handlers.has(generation))throw new Error("Duplicate console painter: "+generation);
  handlers.set(generation,collect);
 }
 return handlers;
}
/** One registration per console generation, in original draw-order. */
export const CONSOLE_PAINTERS=createConsoleRegistry([
 ["ps1",collectPs1Entries],
 ["ps2",collectPs2Entries]
]);

export function collectConsoleEntries(ctx:CanvasRenderingContext2D,camera:Projection,s:GameState,t:number):SceneStationEntry[]{
 const entries:SceneStationEntry[]=[];
 for(const collect of CONSOLE_PAINTERS.values())entries.push(...collect(ctx,camera,s,t));
 return entries;
}
