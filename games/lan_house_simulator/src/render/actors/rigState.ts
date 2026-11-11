import type {ActorPose,ActorRender,ActorStyle} from "../actorArt.js";
import type {WorkerMotion} from "../workerMotion.js";

/** Values fixed for one actor frame; limb artists cannot mutate simulation state. */
export interface ActorRigState {
 style:ActorStyle;
 pose:ActorPose;
 walking:boolean;
 work:WorkerMotion|null;
 phase:number;
 step:number;
 bob:number;
 seated:number;
 celebrating:boolean;
 disappointed:boolean;
 gamepadActive:boolean;
 consoleSeat:boolean;
 headShift:number;
 typing:number;
 screenView:ActorRender["screenView"];
 back:boolean;
 sideways:boolean;
 quarter:boolean;
 profileWalk:boolean;
 screenRig:boolean;
 nearSide:number;
 ownerIdleRate:number;
}
