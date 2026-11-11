import type {Point} from "../../sim/types.js";
import {iso,type Projection} from "../isometric.js";
import {path,plane,round} from "./primitives.js";

export function drawOfficeChair(c:CanvasRenderingContext2D,cam:Projection,p:Point,occupied:boolean):void{
 const z=cam.zoom,at=(x:number,y:number,h:number)=>iso({x:p.x+x,y:p.y+y},cam,h);
 const cx=.35,cy=.87,base=at(cx,cy,4),seat=at(cx,cy,25);
 // Five caster spokes, upholstered thickness and curved backrest.
 for(const [dx,dy] of [[-.25,0],[.25,0],[0,-.23],[0,.23],[.18,.18]]){
  const foot=at(cx+dx!,cy+dy!,2);path(c,[base,foot],"#354b4b",2.5*z);
  c.fillStyle="#263d3e";c.beginPath();c.ellipse(foot.x,foot.y,2.9*z,2*z,0,0,Math.PI*2);c.fill();
 }
 path(c,[base,seat],"#506964",3.8*z);
 const by=cy+.19;
 plane(c,cam,p.x+cx-.26,p.y+by,.52,28,27,()=>{
  round(c,0,0,96,100,15,"#3c615d","#2d4949");
  round(c,6,5,84,78,12,"#719086");round(c,12,11,72,65,10,"#577b71");
  path(c,[{x:16,y:72},{x:18,y:16},{x:75,y:16}],"#8ca294",2);
 });
 c.fillStyle="#355e56";c.beginPath();c.ellipse(seat.x,seat.y+2*z,19*z,9*z,0,0,Math.PI*2);c.fill();
 c.fillStyle="#77978a";c.beginPath();c.ellipse(seat.x,seat.y,19*z,8*z,0,0,Math.PI*2);c.fill();
 c.strokeStyle="#395d55";c.lineWidth=1.2*z;c.stroke();
 if(!occupied)for(const side of [-1,1]){
  const support=at(cx+side*.25,cy-.04,18),arm=at(cx+side*.25,cy-.04,30);
  path(c,[support,arm],"#3d5a56",2*z);c.fillStyle="#486f64";c.beginPath();c.ellipse(arm.x,arm.y,5*z,3*z,0,0,Math.PI*2);c.fill();
 }
}
