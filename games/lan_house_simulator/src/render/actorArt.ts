import type {Costume} from "../sim/types.js";
import {iso,type Projection} from "./isometric.js";
import type {ActorDirection,ActorScreenView} from "./direction.js";
import {walkPhase,walkingLeg,walkAxis} from "./walkCycle.js";
import {workerMotion} from "./workerMotion.js";
import {actorAppearanceFor,resolvedActorStyle} from "./actors/registry.js";
import {ell,shape,segment,clamp01,limb,torso,casualChestExtras,seatTransitionWeight,profileWalkingStep} from "./actors/rigPrimitives.js";
import {isFemaleCostume} from "./actors/femaleRig.js";
import {drawActorHead} from "./actors/head.js";
export {edgeFor,seatTransitionWeight,profileWalkingStep} from "./actors/rigPrimitives.js";
export {FEMALE_COSTUMES} from "./actors/femaleRig.js";
export type ActorContext=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;

export type ActorPose = "idle" | "walking" | "sitting" | "standing-up" | "printing" | "copying" | "sweeping" | "repairing" | "delivering" | "receiving";
/** Rate (rad/s) of the owner's idle breathing and service gesture. They share one rate so the idle
 * animation is a single loop, which is what lets the sprite cache hold it as 32 frames. */
export const OWNER_IDLE_RATE=1.4;
export type ActorKind = Costume | "owner" | "cleaner" | "technician" | "postman";
export interface ActorStyle{
 shirt:string;dark:string;highlight:string;pants:string;hair:string;skin:string;trim:string;
}
export function actorStyleFor(kind:ActorKind,id:number):ActorStyle{
 return resolvedActorStyle(actorAppearanceFor(kind),id);
}
export interface ActorRender {
  x: number; y: number;
  kind: ActorKind; id: number; time: number;
  pose?: ActorPose;
  facing?: -1 | 1;
  direction?: ActorDirection;
  /** Direction of visible movement projected onto the screen; seats keep legacy rig. */
  screenView?: ActorScreenView;
  /** Distance on the projected floor at zoom 1; independent of wall-clock time. */
  walkDistance?:number;
  transition?: number;
  /** Cliente usando controle de console; anima mãos sem alterar poses de PC. */
  gamepad?: boolean;
  modernGamepad?: boolean;
  gamepadGrip?: {x:number;y:number};
  /** Proporções do agachamento diante da cadeira de videogame. */
  consoleSeat?: boolean;
  /** Só passa true com entitlement verificado no backend; exclusivo de sessão PC. */
  premiumHeadset?: boolean;
  /** Gesto transitório ao concluir a chave real, sem mudar posição no salão. */
  reaction?:"win"|"loss";
  /** Aplicado ao dono somente com direito VIP verificado. */
  premiumCyber?: boolean;
}

export function drawActor(ctx:ActorContext,camera:Projection,a:ActorRender):void {
  const base=iso({x:a.x,y:a.y},camera);
  const z=camera.zoom,cyber=a.kind==="owner"&&!!a.premiumCyber;
 const appearance=actorAppearanceFor(a.kind);
 const baseStyle=resolvedActorStyle(appearance,a.id);
  const style=cyber?{...baseStyle,shirt:"#293950",dark:"#15243c",
    highlight:"#67e2d8",pants:"#25334a",hair:"#283247",trim:"#e5a1df"}:baseStyle;
  const pose=a.pose??"idle";
  const walking=pose==="walking";
  const work=a.kind==="cleaner"&&pose==="sweeping"?workerMotion("sweeping",a.time):
    a.kind==="technician"&&pose==="repairing"?workerMotion("repairing",a.time):null;
  const transition=clamp01(a.transition??1);
  // A cabeça mantém exatamente as mesmas feições, materiais e cores em todas as poses.
  const eased=seatTransitionWeight(transition);
  const seated=pose==="sitting"?eased:pose==="standing-up"?1-eased:0;
  const celebrating=a.reaction==="win"&&seated>.95;
  const disappointed=a.reaction==="loss"&&seated>.95;
  const gamepadActive=!!a.gamepad&&pose==="sitting"&&seated>.99;
  const consoleSeat=!!a.consoleSeat&&(pose==="sitting"||pose==="standing-up");
  const phase=a.walkDistance===undefined?a.time*7.7+a.id*.27:walkPhase(a.walkDistance);
  const step=walking?Math.sin(phase):0;
  const ownerBreath=a.kind==="owner"&&(pose==="idle"||pose==="printing"||pose==="copying")?Math.sin(a.time*OWNER_IDLE_RATE)*.6:0;
  const bob=walking?(1-Math.cos(phase*2))*.45:
    celebrating?(1+Math.sin(a.time*6))*.9:0;
  // O quadril acompanha o assento elevado (25px); a cabeça baixa só levemente.
  // Antes, o corpo afundava 18px e parecia agachado no chão.
  const settle=(pose==="sitting"||pose==="standing-up")?Math.sin(Math.PI*transition)*1.5:0;
  const headShift=seated*(consoleSeat?10:3)+settle+(disappointed?3:0);
  const lean=walking?Math.sin(phase*2)*.35:work?work.pulse*.65:
    seated*2+(disappointed?1.5:0);
  const typing=seated>0.95&&!gamepadActive?Math.sin(a.time*5.2+a.id*.37)*1.5:0;
  const direction=a.direction??"south",screenView=a.screenView;
  const back=screenView?(screenView==="back"||screenView.startsWith("back-")):direction==="north";
  const sideways=screenView?screenView.startsWith("profile-"):direction==="east"||direction==="west";
  const quarter=!!screenView&&!sideways&&screenView!=="front"&&screenView!=="back";
  // Regular customers share four palettes by id%4; hair and shirt detail follow the same
  // index, so a sprite frame keyed by palette is still valid for every id that maps to it.
  const variant=a.kind==="regular"?(Math.abs(Math.trunc(a.id))||0)%4:0;
  const flip=screenView?(screenView.endsWith("-left")?-1:1):
    direction==="west"?-1:direction==="east"?1:(a.facing??1);
 const detail={ctx,style,headShift,lean,back,sideways,quarter,pose,time:a.time,cyber};
 ctx.save();
  ctx.translate(base.x,base.y-bob*z);
  ctx.scale(z*flip,z);
  ctx.lineJoin="round";
  ctx.lineCap="round";

  // Ground anchor: o corpo oscila na caminhada, a sombra permanece no piso.
  // A escala de câmera é aplicada depois; bob é em unidades locais do ator.
  ctx.save();ctx.translate(0,bob);
  // Soft contact shadow: dense under the feet, feathered at the rim.
  ctx.save();ctx.scale(15.5,5.1);
  const shade=ctx.createRadialGradient(0,0,0,0,0,1);
  shade.addColorStop(0,"rgba(25,31,46,0.36)");shade.addColorStop(.55,"rgba(25,31,46,0.22)");shade.addColorStop(1,"rgba(25,31,46,0)");
  ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
  ell(ctx,0,1.2,9.4,2.5,"rgba(24,31,45,0.12)");
  ctx.restore();
  // Respiração quase imperceptível; pés e sombra permanecem ancorados.
  if(ownerBreath)ctx.translate(0,-ownerBreath);

  // Silhuetas de costas, perfil e frente são distintas: não apenas um flip.
  // Capa e acessórios que ficam atrás do corpo.
 appearance.drawBackHair?.(detail);
 appearance.drawBack?.(detail);

  // Passos com movimentos opostos nas pernas. Ao sentar, a coxa dobra para a frente.
  const legY=-24+headShift;
  const footY=-4;
  const screenRig=!!screenView&&seated===0&&(pose==="walking"||pose==="idle");
  const profileWalk=!screenView&&sideways&&walking&&seated===0;
  const nearSide=quarter&&!back?-1:1;
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

  // Braços de duas seções: na cadeira, as mãos se aproximam do teclado.
  const arm=(side:number):void=>{
    const printing=a.kind==="owner"&&pose==="printing";
    const copying=a.kind==="owner"&&pose==="copying";
    const receiving=a.kind==="owner"&&pose==="receiving";
    const serving=a.kind==="owner"&&(pose==="idle"||printing||copying||receiving);
    const handing=a.kind==="postman"&&pose==="delivering";
    const gesture=copying?Math.sin(a.time*7.5+side)*1.8:printing?Math.sin(a.time*10+side)*2.7:serving?Math.sin(a.time*OWNER_IDLE_RATE)*.45:0;
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
  };
  arm(-nearSide);if(!sideways&&!quarter)arm(nearSide);

 if(isFemaleCostume(a.kind))appearance.drawBody?.(detail);
  else{
    torso(ctx,style,headShift,sideways,quarter);
    segment(ctx,-11,-24+headShift,10,-24+headShift,2,style.dark);
    if(!back&&!sideways&&!quarter&&a.kind!=="owner")ell(ctx,0,-24+headShift,1.9,1.35,style.trim);
    if(!back&&!sideways&&!quarter)shape(ctx,[[0,-51+headShift],[5,-48+headShift],[3,-37+headShift],
      [-1,-30+headShift],[-3,-38+headShift]],style.highlight,"#34616B");
    if(!back&&!sideways&&!quarter){
      shape(ctx,[[-8,-50+headShift],[0,-46+headShift],[6,-51+headShift],
        [3,-53+headShift],[-5,-53+headShift]],style.trim);
      ell(ctx,0,-33+headShift,1.5,1.5,"#EFD9AC");
    }
    if(variant)casualChestExtras(ctx,style,variant,headShift,back,sideways,quarter);
  }

 appearance.drawOutfit?.(detail);

  // The near arm overlaps the profile's chest: actual depth, not an X squash.
  if(sideways||quarter)arm(nearSide);
  else if(a.kind==="owner"&&!back){arm(-1);arm(1);}
 appearance.drawAfterArms?.(detail);
  drawActorHead(ctx,a,detail,seated,consoleSeat,variant,appearance);
  ctx.restore();
}


/** Área clicável acompanha a cabeça/ombros do dono, sem depender do frame de animação. */
export function actorHitbox(camera:Projection,x:number,y:number):
  {x:number;y:number;width:number;height:number}{
  const p=iso({x,y},camera);
  const z=camera.zoom;
  return {x:p.x-25*z,y:p.y-86*z,width:50*z,height:89*z};
}
