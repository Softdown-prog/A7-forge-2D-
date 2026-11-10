import type {Customer,GameState} from "../../../sim/types.js";
import {computerSeat} from "../../../sim/route.js";
import {pcPosition} from "../../../sim/engine.js";
import {customerConsole,customerConsoleSeat} from "../../../sim/consoleLayout.js";
import {ps2StationPoint} from "../../../sim/ps2.js";
import {cosmeticAvailable,headsetOnSession} from "../../../sim/premiumCosmetics.js";
import {yearFromMinutes} from "../../../sim/historicalEconomy.js";
import type {MotionCustomer} from "../../motion.js";
import {iso,objectCamera,type Projection} from "../../isometric.js";
import {drawSeatedKeyboardOverlay} from "../../retroComputer.js";
import {actorStyleFor,type ActorPose} from "../../actorArt.js";
import {drawActorSprite as drawActor} from "../../actorSprites.js";
import {movementDirection,screenViewForMotion} from "../../direction.js";
import {drawPs2Controller,ps2ActorGrip} from "../../ps2Art.js";
import {drawPs1Controller} from "../../ps1Art.js";
import type {NightMatchReaction} from "../../nightMatchMarkers.js";

  export function drawSceneCustomer(ctx:CanvasRenderingContext2D,camera:Projection,c:Customer,t:number,seated:boolean,s:GameState,
    reaction?:NightMatchReaction):void {
    let x=c.x,y=c.y;
    const motion=(c as MotionCustomer).renderMotion;
    const moving=c.stage==="arriving" || c.stage==="to_pc" ||
      c.stage==="shopping" || c.stage==="leaving";
    let pose:ActorPose=moving&&(motion?motion.moving:Math.hypot(c.target.x-c.x,c.target.y-c.y)>.0001)?"walking":"idle";
    let transition=1;
    if(seated && customerConsole(c)){
      const seat=customerConsoleSeat(s,c);
      if(seat){x=seat.x;y=seat.y;pose=c.stage==="standing"?"standing-up":"sitting";
       transition=c.stage==="sitting"?Math.min(1,(c.poseMinutes??0)/3):
        c.stage==="standing"?Math.min(1,(c.poseMinutes??0)/3):1;}
    }else if(seated && c.pcIndex!==null){
      const p=pcPosition(c.pcIndex,s);
      const seat=computerSeat(p);x=seat.x;y=seat.y;
      pose=c.stage==="standing"?"standing-up":"sitting";
      transition=c.stage==="sitting"?Math.min(1,(c.poseMinutes??0)/3):
        c.stage==="standing"?Math.min(1,(c.poseMinutes??0)/3):1;
    }
    const direction=seated&&customerConsole(c)?"north":
      seated&&c.pcIndex!==null?(["north","east","south","west"] as const)[pcPosition(c.pcIndex,s).rotation??0]:
      // SceneMotion resolves the direction of the *visible* interpolated step.
      // The next waypoint can already be around a corner: do not turn early.
      moving?(c.facing??movementDirection({x:c.x,y:c.y},c.target)):(c.facing??"south");
    const ps2Point=c.ps2StationIndex!==undefined?ps2StationPoint(s,c.ps2StationIndex):null;
    const consoleView=seated&&ps2Point?screenViewForMotion(ps2Point.x+.44-x,ps2Point.y+.395-y,"north"):undefined;
    // Seat-specific PS2 grip must mirror with the actor, not with the TV.
    const grip=seated&&ps2Point?ps2ActorGrip({x,y},ps2Point,consoleView):undefined;
    const drawPad=()=>drawPs2Controller(ctx,camera,{x,y},t+.29*c.id,c.ps2SeatIndex??0,
       ps2Point??undefined,actorStyleFor(c.costume,c.id).skin);
    // A controller in front of a back-facing torso must be occluded by the body.
    const padBehind=consoleView?.startsWith("back");
    if(seated&&ps2Point&&c.stage==="using"&&padBehind)drawPad();
    drawActor(ctx,camera,{
      x,y,kind:c.costume,id:c.id,time:t+0.29*c.id,
      pose,direction,transition,walkDistance:motion?.distance,
      reaction:reaction?.kind,
      // Face the current interpolated world step in SCREEN space (2:1 isometric).
      screenView:seated?consoleView:motion?.view??screenViewForMotion(
        pose==="walking"?c.target.x-c.x:0,
        pose==="walking"?c.target.y-c.y:0,direction),
      gamepad:seated&&customerConsole(c)!==null&&c.stage==="using",
      modernGamepad:c.ps2StationIndex!==undefined,gamepadGrip:grip,
      consoleSeat:seated&&customerConsole(c)!==null,
      premiumHeadset:seated&&c.pcIndex!==null&&!customerConsole(c)&&
       cosmeticAvailable("headset-rgb-neon",yearFromMinutes(s.totalMinutes))&&
       headsetOnSession(c.id,c.pcIndex)
    });
    if(seated&&ps2Point&&c.stage==="using"&&!padBehind)drawPad();
    if(seated&&c.ps1StationIndex!==undefined&&c.stage==="using")
      drawPs1Controller(ctx,camera,{x,y},t,c.ps1SeatIndex??0);
    if(seated && c.pcIndex!==null){
      const style=actorStyleFor(c.costume,c.id);
      const weight=reaction?0:c.stage==="using"?1:
        c.stage==="sitting"?transition:
        c.stage==="standing"?1-transition:0;
      drawSeatedKeyboardOverlay(ctx,objectCamera(camera,pcPosition(c.pcIndex,s),1.1,.7,pcPosition(c.pcIndex,s).rotation),pcPosition(c.pcIndex,s),t,
        style.skin,style.shirt,weight);
    }
    if(c.vip){
      const marker=iso({x,y},camera,100);
      ctx.save();ctx.font="bold "+Math.max(10,12*camera.zoom)+"px system-ui,sans-serif";
      ctx.textAlign="center";ctx.lineWidth=2*camera.zoom;ctx.strokeStyle="#273448";
      ctx.strokeText("★ VIP",marker.x,marker.y);ctx.fillStyle="#f5ca64";ctx.fillText("★ VIP",marker.x,marker.y);ctx.restore();
    }
    if(c.stage==="waiting"){
      const p=iso({x,y},camera,95);
      ctx.save();
      ctx.font="900 "+Math.max(20,23*camera.zoom)+"px system-ui,sans-serif";
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.lineJoin="round";ctx.lineWidth=4*camera.zoom;
      ctx.strokeStyle="#222535";ctx.strokeText("?",p.x,p.y);
      ctx.fillStyle="#FF4848";ctx.fillText("?",p.x,p.y);
      ctx.restore();
    }
  }
