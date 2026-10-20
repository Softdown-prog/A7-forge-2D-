import type {ActorScreenView} from "./direction.js";

/** One complete cycle travels 40 ground pixels: the supporting foot moves
 * backwards by exactly the anchor's travel over half a cycle (20 pixels). */
export const WALK_CYCLE_DISTANCE=40;
export const walkPhase=(distance:number):number=>distance/WALK_CYCLE_DISTANCE*Math.PI*2;
export function walkAxis(view:ActorScreenView):{x:number;y:number}{
 if(view.startsWith("profile-"))return {x:1,y:0};
 const y=view.startsWith("back")?-1:1;
 if(view==="front"||view==="back")return {x:0,y};
 return {x:2/Math.sqrt(5),y:y/Math.sqrt(5)};
}
export function walkingLeg(phase:number,side:-1|1,view:ActorScreenView,walking=true):
 {hipX:number;hipY:number;kneeX:number;kneeY:number;toeX:number;ankleY:number;lift:number}{
 const axis=walkAxis(view),quarter=view.includes("-")&&!view.startsWith("profile");
 const hipX=side*(view.startsWith("profile")?2.4:quarter?5:6.4);
 const hipY=quarter?-side*axis.y*5:0;
 const cycle=((phase/(Math.PI*2)+(side===1?0:.5))%1+1)%1;
 // Stance is linear; only the airborne return is eased.
 const swing=(cycle-.5)*2;
 const advance=walking?(cycle<.5?10-cycle*40:-10+20*(swing*swing*(3-2*swing))):0;
 const lift=walking&&cycle>=.5?Math.sin(swing*Math.PI)*6:0;
 const toeX=hipX+axis.x*advance,ankleY=-3+hipY+axis.y*advance-lift;
 return {hipX,hipY,kneeX:hipX+axis.x*advance*.5+lift*.35,
  kneeY:-14+hipY+axis.y*advance*.5-lift*.5,toeX,ankleY,lift};
}
