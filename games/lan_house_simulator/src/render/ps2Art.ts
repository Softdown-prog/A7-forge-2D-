import type {Point} from "../sim/types.js";
import type {Ps2GameId} from "../sim/ps2.js";
import {iso,polygon,raisedCuboid,type Projection} from "./isometric.js";
import {drawPs2MiniGame} from "./ps2MiniGames.js";

/** PS2-like original geometric set. No texture, photo, sprite or external asset.
 * Used by the integrated scene and procedural shop preview.
 */
export function drawPs2Station(
 ctx:CanvasRenderingContext2D,cam:Projection,pos:Point,wear:number,
 active:boolean,seconds:number,gameId:Ps2GameId|null=null,twoSeats=false,poweredOff=false
):void{
 const {x,y}=pos,z=cam.zoom,center=iso({x:x+.56,y:y+.54},cam);
 ctx.save();
 ctx.beginPath();ctx.ellipse(center.x,center.y,53*z,16*z,0,0,2*Math.PI);
 ctx.fillStyle="rgba(13,21,31,.30)";ctx.fill();
 // Two metal supports and a darker 2000s furniture surface.
 for(const dx of [.10,.99])for(const dy of [.05,.42])
  raisedCuboid(ctx,cam,x+dx,y+dy,.08,.10,0,25,["#53616a","#28333d","#3b4850"]);
 raisedCuboid(ctx,cam,x,y,1.16,.60,25,8,["#73858d","#394850","#596c74"]);
 // An original TV cabinet, angled toward the chairs.
 raisedCuboid(ctx,cam,x+.13,y+.04,.62,.34,33,35,["#343e49","#151e28","#28333e"]);
 const a=iso({x:x+.20,y:y+.392},cam,64),b=iso({x:x+.68,y:y+.392},cam,64),
  c=iso({x:x+.68,y:y+.392},cam,40),d=iso({x:x+.20,y:y+.392},cam,40);
 polygon(ctx,[a,b,c,d],"#0c1521","#91a7af");
 const screen=(u:number,v:number)=>iso({x:x+.227+.425*u,y:y+.395},cam,61-18*v);
 const pixel=(u:number,v:number,w:number,h:number,color:string)=>{
  polygon(ctx,[screen(u,v),screen(u+w,v),screen(u+w,v+h),screen(u,v+h)],color);
 };
 pixel(0,0,1,1,"#14273b");
 if(active&&gameId&&!poweredOff)drawPs2MiniGame(pixel,gameId,seconds);
 else if(!poweredOff){
  pixel(.14,.22,.72,.06,"#4f7d98");pixel(.25,.40,.5,.06,"#799ba7");
  pixel(.40,.58,.20,.04,"#45667c");
 }
 // Tall, slim black console in an original silhouette; not a copied logo.
 raisedCuboid(ctx,cam,x+.82,y+.14,.18,.29,32,19,["#263341","#101c27","#1b2935"]);
 raisedCuboid(ctx,cam,x+.84,y+.16,.04,.26,51,2,["#536b81","#263f51","#364a5d"]);
 const power=iso({x:x+.98,y:y+.42},cam,51);
 ctx.fillStyle=poweredOff?"#714949":"#82c9af";ctx.beginPath();ctx.arc(power.x,power.y,2.1*z,0,2*Math.PI);ctx.fill();
 const name=iso({x:x+.98,y:y+.51},cam,34);
 ctx.font="bold "+Math.max(8,9*z)+"px system-ui";ctx.textAlign="center";
 ctx.fillStyle="#e5eaf0";ctx.fillText("PS2",name.x,name.y);
 // One or two physical chairs, with separate feet and backrests.
 for(const [offset,width] of (twoSeats?[[.06,.36],[.68,.36]]:[[.24,.68]])){
  for(const dx of [offset+.045,offset+width-.09])
   raisedCuboid(ctx,cam,x+dx,y+.70,.07,.10,0,18,["#323d47","#1c2933","#27323c"]);
  raisedCuboid(ctx,cam,x+offset,y+.62,width,.32,18,7,["#38505c","#1c313d","#2a414d"]);
  raisedCuboid(ctx,cam,x+offset,y+.91,width,.085,21,26,["#2f4653","#192d3a","#253b48"]);
 }
 // Unused controls rest on the front edge of the table, still connected.
 if(!active)for(const n of (twoSeats?[0,1]:[0])){
  const pad=iso({x:x+.43+n*.27,y:y+.54},cam,34),port=iso({x:x+.88+n*.06,y:y+.435},cam,35);
  ctx.strokeStyle="#263441";ctx.lineWidth=Math.max(1,z);ctx.beginPath();ctx.moveTo(port.x,port.y);
  ctx.quadraticCurveTo(pad.x+8*z,pad.y+8*z,pad.x,pad.y);ctx.stroke();
  ctx.fillStyle="#202e3b";ctx.strokeStyle="#8398a8";ctx.beginPath();ctx.ellipse(pad.x,pad.y,8*z,3.5*z,.18,0,2*Math.PI);ctx.fill();ctx.stroke();
  ctx.fillStyle="#b9c8d0";ctx.fillRect(pad.x-4*z,pad.y-z,3*z,z);ctx.fillRect(pad.x-3*z,pad.y-2*z,z,3*z);
  ctx.fillStyle="#a9c8de";ctx.beginPath();ctx.arc(pad.x+4*z,pad.y,.9*z,0,2*Math.PI);ctx.fill();
 }
 if(wear>=100){
  const warn=iso({x:x+.58,y:y+.20},cam,88);
  ctx.font="bold "+Math.max(10,11*z)+"px system-ui";
  ctx.fillStyle="#ffc279";ctx.textAlign="center";ctx.fillText("!",warn.x,warn.y);
 }
 ctx.restore();
}
export function ps2ControllerAnchor(seat:Point,station?:Point):{point:Point;height:number}{
 if(station){
  const dx=station.x+.44-seat.x,dy=station.y+.395-seat.y,length=Math.hypot(dx,dy)||1;
  return {point:{x:seat.x+dx/length*.22,y:seat.y+dy/length*.22},height:27};
 }
 return {point:{x:seat.x+.12,y:seat.y-.08},height:24};
}
export function drawPs2Controller(
 ctx:CanvasRenderingContext2D,cam:Projection,seat:Point,seconds:number,number:0|1=0,station?:Point,skin="#d6ad88"
):void{
 const anchor=ps2ControllerAnchor(seat,station),p=iso(anchor.point,cam,anchor.height);
 const cable=iso(station?{x:station.x+.88+number*.06,y:station.y+.435}:
  {x:seat.x+(number===1?.17:.40),y:seat.y-.35},cam,35),z=cam.zoom*.85;
 ctx.save();
 ctx.strokeStyle="#27323d";ctx.lineWidth=Math.max(1,1.35*z);
 ctx.beginPath();ctx.moveTo(cable.x,cable.y);
 ctx.bezierCurveTo(cable.x+3*z,cable.y+11*z,p.x+11*z,p.y+12*z,p.x+3*z,p.y-2*z);ctx.stroke();
 ctx.translate(p.x,p.y+Math.sin(seconds*7)*.5*z);ctx.rotate(Math.sin(seconds*4)*.03);
 ctx.fillStyle="#1d2935";ctx.strokeStyle="#798fa3";ctx.lineWidth=Math.max(1,1*z);
 for(const side of [-1,1]){
  ctx.beginPath();ctx.ellipse(side*9.6*z,3*z,6*z,6.7*z,side*.22,0,2*Math.PI);ctx.fill();ctx.stroke();
 }
 ctx.beginPath();ctx.ellipse(0,0,12*z,5.7*z,0,0,2*Math.PI);ctx.fill();ctx.stroke();
 ctx.fillStyle="#a8b9c8";
 ctx.fillRect(-8*z,-1.8*z,4*z,1*z);ctx.fillRect(-6.5*z,-3.2*z,1.2*z,4*z);
 for(const side of [-1,1]){
  ctx.beginPath();ctx.arc(side*3.7*z,2.3*z,2*z,0,2*Math.PI);ctx.fill();
 }
 for(const [px,py,color] of [[6,-2,"#c8a5ce"],[8,0,"#d38c91"],
   [4,0,"#8fc7a1"],[6,2,"#9ab8de"]] as const){
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(px*z,py*z,1.1*z,0,2*Math.PI);ctx.fill();
 }
 ctx.fillStyle=skin;
 for(const side of [-1,1]){
  ctx.beginPath();ctx.ellipse(side*13*z,3.2*z,4*z,3.1*z,side*.15,0,2*Math.PI);ctx.fill();
 }
 ctx.restore();
}
