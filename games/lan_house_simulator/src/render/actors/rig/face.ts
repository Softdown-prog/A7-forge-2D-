import type {ActorContext,ActorKind} from "../../actorArt.js";
import {shadeHex,mixHex} from "../../color.js";
import {ell,edgeFor,shape} from "./geometry.js";

/** Facial details and regular-customer hairstyles. Character-specific art lives in its own file. */
/** Eye with sclera, iris, pupil, lid line and a fixed glint (never animated, so
 * cached frames stay interchangeable). `w`/`h` are the iris radii; animals keep
 * the glossy black bead their rigs always had. */
export function eye(ctx:ActorContext,x:number,y:number,w:number,h:number,kind:ActorKind,look=0):void{
  if(kind==="rabbit"||kind==="mouse-mascot"){
    ell(ctx,x,y,w*1.15,h*1.1,"#1f2a3c");
    ell(ctx,x-w*.38,y-h*.42,w*.42,h*.38,"#F6E7D0");return;
  }
  const iris=kind==="vampire"?"#a23a52":kind==="stitched-monster"?"#c9b43c":kind==="clown"?"#3a7090":"#3d4d68";
  ell(ctx,x,y,w*1.32,h*1.16,"#f6eee2");
  ell(ctx,x+look,y+h*.08,w*.92,h*.94,iris);
  ell(ctx,x+look,y+h*.12,w*.5,h*.54,"#101826");
  ell(ctx,x+look-w*.28,y-h*.34,w*.34,h*.3,"#ffffff");
  ctx.save();ctx.lineCap="round";ctx.lineWidth=.95;ctx.strokeStyle="rgba(28,34,50,.72)";
  ctx.beginPath();ctx.ellipse(x,y,w*1.32,h*1.16,0,Math.PI*1.1,Math.PI*1.9);ctx.stroke();ctx.restore();
}
/** Soft rim of lighter hair along the crown, on the side the light comes from. */
export function hairSheen(ctx:ActorContext,hair:string,lean:number,shift:number,cy=-79.5,rx=8.4,ry=3.9):void{
  ctx.save();ctx.translate(lean,shift);ctx.lineCap="round";
  ctx.strokeStyle=mixHex(hair,255,.5);ctx.globalAlpha=.42;ctx.lineWidth=1.7;
  ctx.beginPath();ctx.ellipse(-1,cy,rx,ry,0,Math.PI*1.12,Math.PI*1.62);ctx.stroke();
  ctx.restore();
}
/** Warm blush on the visible cheek(s); skipped for characters with painted faces. */
export function blush(ctx:ActorContext,kind:ActorKind,spots:readonly [number,number][]):void{
  if(kind==="rabbit"||kind==="mouse-mascot"||kind==="clown"||kind==="vampire"||kind==="stitched-monster")return;
  ctx.save();ctx.fillStyle="rgba(226,108,100,.17)";
  for(const [x,y] of spots){ctx.beginPath();ctx.ellipse(x,y,3.1,1.9,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

/** Discrete character artwork; all three reuse only rig anchors and movement,
 * never a color mask applied over the same costume. */
export function noseBump(ctx:ActorContext,x:number,y:number,len:number,skin:string):void{
  ctx.save();ctx.beginPath();ctx.moveTo(x,y-3.2);
  ctx.bezierCurveTo(x+len*.45,y-2.6,x+len,y-1.2,x+len*.94,y+.35);
  ctx.bezierCurveTo(x+len*.84,y+1.5,x+len*.4,y+1.8,x,y+1.9);
  ctx.fillStyle=skin;ctx.fill();
  ctx.strokeStyle="#8A645F";ctx.lineWidth=1;ctx.lineCap="round";ctx.stroke();
  ell(ctx,x+len*.62,y+.55,.55,.45,"rgba(96,52,52,.55)");
  ell(ctx,x+len*.3,y-1.7,.9,1.1,"rgba(255,244,216,.3)");
  ctx.restore();
}
/** Hair and chest details that tell the four regular customers apart (same palettes). */
export function casualHairExtras(ctx:ActorContext,hair:string,variant:number,lean:number,shift:number,back:boolean,front:boolean):void{
  const edge=edgeFor(hair);
  if(variant===1){
    for(const [x,w,h] of [[-7,3.4,7.5],[-.5,3.8,9],[6,3.2,6.8]] as const)
      shape(ctx,[[x-w+lean,-79+shift],[x+lean+w*.15,-79-h+shift],[x+w+lean,-79+shift]],hair,edge);
  }else if(variant===2){
    if(front)shape(ctx,[[-12+lean,-72+shift],[-6+lean,-75.5+shift],[3+lean,-77+shift],[2+lean,-73.5+shift],[-4+lean,-71.2+shift],[-12+lean,-67+shift]],hair,edge);
    ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle=shadeHex(hair,.7);ctx.lineWidth=.9;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-2+lean,-84+shift);ctx.quadraticCurveTo(-4+lean,-79+shift,-6+lean,-75+shift);ctx.stroke();ctx.restore();
  }else if(variant===3){
    for(const x of [-9,-4.5,0,4.5,9])ell(ctx,x+lean,-83.4+shift+Math.abs(x)*.12,3.5,3.1,hair,edge);
    if(!back)ell(ctx,lean-3,-85.5+shift,4,1.2,"rgba(255,241,208,.16)");
  }
}
