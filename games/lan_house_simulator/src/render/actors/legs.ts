import type {ActorContext,ActorRender} from "../actorArt.js";
import type {ActorRigState} from "./rigState.js";
import {walkingLeg,walkAxis} from "../walkCycle.js";
import {profileWalkingStep,limb,ell,segment} from "./rigPrimitives.js";

/** Lower-body pose pass: independent from faces and upper-body accessories. */
export function drawActorLegs(ctx:ActorContext,a:ActorRender,rig:ActorRigState):void{
 const {style,phase,step,seated,headShift,bob,consoleSeat,screenRig,profileWalk,nearSide,sideways,screenView,walking,quarter,back}=rig;
 const legY=-24+headShift;
 const footY=-4;
 const legOrder=screenRig&&quarter&&!back?[1,-1] as const:[-1,1] as const;
  for(const side of legOrder){
    const swing=step*7*side*(1-seated);
    const rigLeg=screenRig?walkingLeg(phase,side,screenView!,walking):null;
    const profileLeg=rigLeg??(profileWalk?profileWalkingStep(step,side):null);
    const kneeX=profileLeg?.kneeX??side*7+swing*.55+side*seated*10;
    // Side profiles move feet in the facing axis; frontal/seat poses stay intact.
    const kneeY=profileLeg?.kneeY??-13-seated*(consoleSeat?1:8);
    const toeX=profileLeg?.toeX??side*7+swing+side*seated*12;
    const ankleY=(profileLeg?.ankleY??footY-seated*4)+(screenRig?bob:0);
    const legColor=profileLeg&&side!==nearSide?style.dark:style.pants;
    limb(ctx,profileLeg?.hipX??side*6,legY+(rigLeg?.hipY??0),kneeX,kneeY,9.6,legColor);
    limb(ctx,kneeX,kneeY,toeX,ankleY,8.2,legColor);
    // Costura de joelho e volume de tecido: visíveis sem aumentar a silhueta.
    ctx.save();ctx.globalAlpha=.38;
    ctx.strokeStyle=style.highlight;ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(kneeX-1.5,kneeY+1);ctx.lineTo(kneeX+2.1,kneeY+2);ctx.stroke();
    ctx.restore();
    const shoe=a.kind==="rabbit"?"#E5D5D5":a.kind==="postman"?"#151B27":"#283647";
    // Body rises while the supporting shoe stays on the floor.
    const shoeY=ankleY;
    const shoeX=toeX+(screenRig?walkAxis(screenView!).x*2:2);
    ell(ctx,shoeX,shoeY,screenRig&&!sideways?5.3:6.8,3.2,shoe,"#1D2736");
    // Sola clara de baixo contraste, pequena o bastante para não parecer tênis brilhante.
    segment(ctx,shoeX-3,shoeY+1.8,shoeX+3,shoeY+1.9,1.0,
      a.kind==="rabbit"?"#B5A7AC":"#788597");
    ctx.save();ctx.strokeStyle="rgba(205,222,240,.4)";ctx.lineWidth=.9;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(shoeX-2.2,shoeY-1.2);ctx.lineTo(shoeX+2.6,shoeY-1.4);ctx.stroke();ctx.restore();
  }
}
