import type {ActorContext,ActorRender} from "../actorArt.js";
import type {ActorRigState} from "./rigState.js";
import {walkAxis} from "../walkCycle.js";
import {limb,ell,segment} from "./rigPrimitives.js";

/** Shared arm-and-hand pose pass, preserving depth order controlled by actorArt. */
  export function drawActorArm(ctx:ActorContext,a:ActorRender,side:number,rig:ActorRigState):void{
  const {style,pose,profileWalk,screenRig,sideways,quarter,walking,phase,headShift,step,seated,celebrating,disappointed,work,gamepadActive,typing,screenView,ownerIdleRate}=rig;
    const printing=a.kind==="owner"&&pose==="printing";
    const copying=a.kind==="owner"&&pose==="copying";
    const receiving=a.kind==="owner"&&pose==="receiving";
    const serving=a.kind==="owner"&&(pose==="idle"||printing||copying||receiving);
    const handing=a.kind==="postman"&&pose==="delivering";
    const gesture=copying?Math.sin(a.time*7.5+side)*1.8:printing?Math.sin(a.time*10+side)*2.7:serving?Math.sin(a.time*ownerIdleRate)*.45:0;
    const angledWalk=profileWalk||screenRig;
    const shoulderX=side*(sideways?8:quarter?10:15);
    const axis=screenRig?walkAxis(screenView!):{x:1,y:0};
    const armSwing=walking?-Math.cos(phase+(side===1?0:Math.PI))*7:0;
    const ax=angledWalk?shoulderX:side*(sideways?10:15), ay=-47+headShift+(screenRig&&quarter?-side*axis.y*3:0);
    const wave=step*5*-side*(1-seated);
    // In profile the shoulders remain narrow, and the arms counter-swing the legs.
    const elbowX=celebrating?side*20:
      angledWalk?shoulderX+side*1.5+armSwing*axis.x*.5:
      work?(side===1?21:-17)+work.pulse*1.7:
      side*(copying?23:printing?21:serving?19:handing&&side===1?23:18-seated*2)+wave;
    const elbowY=celebrating?-52+headShift+Math.sin(a.time*6+side)*1.5:
      angledWalk?-36+headShift+armSwing*axis.y*.5:
      work?(side===1?-38:-34):((serving?-39:handing&&side===1?-44:-36)+headShift+seated*3);
    const movingHand=work?(side===1?work.nearHand:work.farHand):null;
    const handX=gamepadActive&&a.modernGamepad?(a.gamepadGrip?.x??12.8)+side*11.05:celebrating?side*22:
      angledWalk?shoulderX+side*2+armSwing*axis.x:
      movingHand?movingHand.x:receiving&&side===1?19+Math.sin(a.time*4)*.9:handing&&side===1?25+Math.sin(a.time*6)*1.3:copying?side*(14+Math.sin(a.time*7)*2):printing?side*(4+Math.sin(a.time*9)*3):serving?side*8:side*(19-seated*15)+wave*.5+seated*12;
    const handY=gamepadActive&&a.modernGamepad?(a.gamepadGrip?.y??-22.72)+2.72+Math.sin(a.time*7)*.4:celebrating?-72+headShift+Math.sin(a.time*6+side)*2:
      disappointed?-17+headShift:
      angledWalk?-25+headShift+armSwing*axis.y:
      movingHand?movingHand.y:receiving&&side===1?-43+headShift+Math.sin(a.time*4)*1.0:
       handing&&side===1?-43+headShift+Math.sin(a.time*6)*1.2:copying?-33+headShift+gesture:printing?-29+headShift+gesture:serving?-38+headShift+gesture:-24+headShift-seated*6+(gamepadActive?Math.sin(a.time*8+side)*.8:typing*side);
    limb(ctx,ax,ay,elbowX,elbowY,9.2,style.dark);
    limb(ctx,elbowX,elbowY,handX,handY,8.2,style.shirt);
    // Shaded cuff just above the wrist separates sleeve from hand.
    ctx.save();ctx.lineCap="butt";ctx.lineWidth=8.5;ctx.strokeStyle=style.dark;ctx.globalAlpha=.34;
    ctx.beginPath();ctx.moveTo(elbowX+(handX-elbowX)*.74,elbowY+(handY-elbowY)*.74);
    ctx.lineTo(elbowX+(handX-elbowX)*.9,elbowY+(handY-elbowY)*.9);ctx.stroke();ctx.restore();
    // Borda da manga e luz discreta: o braço continua legível de costas.
    ctx.save();ctx.globalAlpha=.46;
    ctx.strokeStyle=style.highlight;ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(elbowX,elbowY+1);
    ctx.lineTo(elbowX+(handX-elbowX)*.32,elbowY+(handY-elbowY)*.32);ctx.stroke();
    ctx.restore();
    // Thumb tucked toward the body, then the palm and two soft finger creases.
    ell(ctx,handX-side*3.4,handY-.7,1.7,2.7,style.skin,"#785C59");
    ell(ctx,handX,handY,4.7,4.6,style.skin,"#785C59");
    ell(ctx,handX-1.1,handY-1,2.3,2.5,"rgba(255,241,208,.22)");
    ctx.save();ctx.strokeStyle="rgba(120,76,72,.45)";ctx.lineWidth=.75;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(handX-side*.2,handY+1.2);ctx.lineTo(handX-side*.2,handY+3.7);
    ctx.moveTo(handX+side*1.7,handY+1);ctx.lineTo(handX+side*1.7,handY+3.3);ctx.stroke();ctx.restore();
    if(serving){segment(ctx,elbowX+(handX-elbowX)*.65,elbowY+(handY-elbowY)*.65,handX-side*3,handY-.3,2.3,style.trim);}
  }
