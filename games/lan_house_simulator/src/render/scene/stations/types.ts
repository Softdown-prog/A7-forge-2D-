import type {GameState} from "../../../sim/types.js";
import type {Projection} from "../../isometric.js";

/** Render jobs with pre-existing scene depth; no simulation ownership. */
export interface SceneStationEntry{depth:number;paint:()=>void}
export type ConsoleEntryCollector=(ctx:CanvasRenderingContext2D,camera:Projection,state:GameState,elapsedSeconds:number)=>SceneStationEntry[];
