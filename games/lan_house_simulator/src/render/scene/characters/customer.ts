import type {Customer,GameState} from "../../../sim/types.js";
import {computerSeat} from "../../../sim/route.js";
import {pcPosition} from "../../../sim/engine.js";
import {customerConsole,customerConsoleSeat} from "../../../sim/consoleLayout.js";
import {ps1StationPoint} from "../../../sim/ps1.js";
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
import {drawPs1Controller,ps1PlayerRig} from "../../ps1Art.js";
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
    const ps1Point=seated&&c.ps1StationIndex!==undefined?ps1StationPoint(s,c.ps1StationIndex):null;
    const seat={x,y},actorTime=t+.29*c.id;
    const ps1Rig=ps1Point?ps1PlayerRig(seat,ps1Point):undefined;
    const consoleView=ps1Rig?.screenView??
      (seated&&ps2Point?screenViewForMotion(ps2Point.x+.44-x,ps2Point.y+.395-y,"north"):undefined);
    const grip=ps1Rig?.gamepadGrip??
      (seated&&ps2Point?ps2ActorGrip(seat,ps2Point,consoleView):undefined);
    const padInUse=seated&&c.stage==="using"&&(ps1Point!==null||ps2Point!==null);
    const drawPad=()=>{
      const skin=actorStyleFor(c.costume,c.id).skin;
      if(ps1Point)drawPs1Controller(ctx,camera,seat,ps1Point,actorTime,c.ps1SeatIndex??0,skin);
      else if(ps2Point)drawPs2Controller(ctx,camera,seat,actorTime,c.ps2SeatIndex??0,ps2Point,skin);
    };
    // A controller in front of a back-facing torso must be occluded by the body.
    const padBehind=ps1Rig?.padBehind??consoleView?.startsWith("back");
    if(padInUse&&padBehind)drawPad();
    drawActor(ctx,camera,{
      x,y,kind:c.costume,id:c.id,time:actorTime,
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
    if(padInUse&&!padBehind)drawPad();
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
