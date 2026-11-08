/** Time-of-day lighting for the salon. Derived only from the simulation clock
 * (10:00 opens, 22:00 closes); never from the wall clock, weather or RNG.
 * Weather stays a HUD/economy matter, per the room visualisation contract. */
import {DAY_MINUTES} from "../sim/types.js";
import type {GameState} from "../sim/types.js";
import {roomBounds,type RoomBounds} from "../sim/room.js";
import {iso,type Projection} from "./isometric.js";
import {lerpHex,withAlpha} from "./color.js";

export type DaylightPhase="day"|"golden"|"dusk"|"night";
export interface Daylight{
 /** Hour of the simulated day, 10 … 22. */
 hour:number;
 /** 1 at full daylight, 0 once the street is dark. */
 daylight:number;
 /** Warm bias of the late afternoon, 0 … 1. */
 warmth:number;
 /** 1 − daylight, kept separate for readability of the painters. */
 night:number;
 phase:DaylightPhase;
}
const smooth=(t:number)=>{const k=Math.max(0,Math.min(1,t));return k*k*(3-2*k);};
/** Lighting curve for a simulation minute. Deterministic and cheap. */
export function daylightAt(totalMinutes:number):Daylight{
 const safe=Number.isFinite(totalMinutes)?Math.max(0,totalMinutes):0;
 const minute=((safe%DAY_MINUTES)+DAY_MINUTES)%DAY_MINUTES;
 const hour=10+minute/60;
 // Full light until 16:30, dark by 19:40; golden light peaks around 17:45.
 const daylight=1-smooth((hour-16.5)/(19.67-16.5));
 const warmth=Math.exp(-(((hour-17.75)/1.05)**2))*.95;
 const night=1-daylight;
 const phase:DaylightPhase=hour<16.5?"day":hour<18.3?"golden":hour<19.67?"dusk":"night";
 return {hour,daylight,warmth,night,phase};
}
/** Window glass seen from inside: sky-coloured by day, warm at sunset and a
 * dark reflective pane at night. No exterior landscape is ever drawn. */
export function windowGlass(light:Daylight):{top:string;bottom:string;sheen:number}{
 const dayTop="#9cc4d6",dayBottom="#d2e5e3",goldTop="#e6a964",goldBottom="#f5d7a2";
 const nightTop="#1a2a44",nightBottom="#0f1a2c";
 const warmTop=lerpHex(dayTop,goldTop,light.warmth),warmBottom=lerpHex(dayBottom,goldBottom,light.warmth);
 return {top:lerpHex(warmTop,nightTop,light.night),bottom:lerpHex(warmBottom,nightBottom,light.night),
  sheen:.16+.22*light.night};
}
/** Wall-mounted lamp positions used by the background and the lighting pass. */
export function lampPositions(bounds:RoomBounds):number[]{
 const w=bounds.maxX;
 return [1.7,3.9,Math.max(5.4,w-1.2)].filter(x=>x>bounds.minX+.4&&x<w-.3);
}
/** Window positions (x along the north wall, 1.2 wide) shared with the walls. */
export const WINDOW_POSITIONS:readonly number[]=[2.15,4.45];

function ellipseGradient(ctx:CanvasRenderingContext2D,cx:number,cy:number,rx:number,ry:number,inner:string,outer:string):void{
 ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);
 const g=ctx.createRadialGradient(0,0,0,0,0,1);
 g.addColorStop(0,inner);g.addColorStop(1,outer);
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
/** Floor light from the lamps, daylight shafts under the windows and the night
 * tint. Painted over the depth-sorted objects and before the in-canvas HUD. */
export function drawSceneLighting(ctx:CanvasRenderingContext2D,camera:Projection,s:GameState,
 elapsed:number,width:number,height:number):void{
 const light=daylightAt(s.totalMinutes),bounds=roomBounds(s),z=camera.zoom,north=bounds.minY;
 ctx.save();
 // Daylight shafts: a soft parallelogram of light on the floor below each window.
 if(light.daylight>.02){
  ctx.globalCompositeOperation="lighter";
  for(const x of WINDOW_POSITIONS){
   if(x+1.2>bounds.maxX)continue;
   const a=iso({x:x+.02,y:north+.02},camera,0),b=iso({x:x+1.18,y:north+.02},camera,0);
   const c=iso({x:x+1.55,y:north+1.75},camera,0),d=iso({x:x+.45,y:north+1.75},camera,0);
   const from=iso({x:x+.6,y:north},camera,0),to=iso({x:x+1,y:north+1.75},camera,0);
   const g=ctx.createLinearGradient(from.x,from.y,to.x,to.y);
   const tone=lerpHex("#fff6dc","#ffc27a",light.warmth);
   g.addColorStop(0,withAlpha(tone,.11*light.daylight));g.addColorStop(1,withAlpha(tone,0));
   ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
  }
  ctx.globalCompositeOperation="source-over";
 }
 // Lamp pools: warm, slightly stronger as the daylight fades.
 const pool=.07+.15*light.night;
 for(const x of lampPositions(bounds)){
  const at=iso({x,y:north+.95},camera,0);
  const flicker=1+Math.sin(elapsed*2.1+x*3.7)*.015;
  ellipseGradient(ctx,at.x,at.y,88*z*flicker,44*z*flicker,withAlpha("#ffe3b0",pool),withAlpha("#ffe3b0",0));
 }
 // Night tint over the whole frame, plus a cooler floor far from the lamps.
 if(light.night>.01){
  ctx.globalCompositeOperation="multiply";
  ctx.fillStyle=withAlpha("#55699a",.40*light.night);
  ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation="source-over";
 }
 // Golden hour warms the room before the lamps take over.
 if(light.warmth>.01&&light.daylight>.05){
  ctx.globalCompositeOperation="soft-light";
  ctx.fillStyle=withAlpha("#ffb86a",.35*light.warmth*light.daylight);
  ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation="source-over";
 }
 ctx.restore();
}
/** Floor-level glow of an active screen. Painted before its station sprite. */
export function drawScreenGlow(ctx:CanvasRenderingContext2D,camera:Projection,x:number,y:number,
 height:number,color:string,strength:number):void{
 if(strength<=0)return;
 const at=iso({x,y},camera,height),z=camera.zoom;
 ctx.save();ctx.globalCompositeOperation="lighter";
 ellipseGradient(ctx,at.x,at.y,36*z,22*z,withAlpha(color,strength),withAlpha(color,0));
 ctx.restore();
}
/** Dark vignette that frames the floating platform without touching the room. */
export function drawVignette(ctx:CanvasRenderingContext2D,width:number,height:number,alpha:number):void{
 ctx.save();ctx.translate(width/2,height/2);ctx.scale(width/2,height/2);
 const g=ctx.createRadialGradient(0,0,.45,0,0,1.15);
 g.addColorStop(0,"rgba(5,12,14,0)");g.addColorStop(1,"rgba(5,12,14,"+alpha.toFixed(3)+")");
 ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
/** Light cone on the back wall below each lamp; part of the cached background. */
export function drawLampHalo(ctx:CanvasRenderingContext2D,camera:Projection,x:number,north:number):void{
 const top=iso({x,y:north},camera,146),base=iso({x,y:north},camera,0),z=camera.zoom;
 const g=ctx.createLinearGradient(top.x,top.y,base.x,base.y);
 g.addColorStop(0,"rgba(255,236,190,.26)");g.addColorStop(.55,"rgba(255,236,190,.07)");g.addColorStop(1,"rgba(255,236,190,0)");
 const l=iso({x:x-.28,y:north},camera,146),r=iso({x:x+.28,y:north},camera,146);
 const bl=iso({x:x-.95,y:north},camera,0),br=iso({x:x+.95,y:north},camera,0);
 ctx.save();ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(l.x,l.y-2*z);ctx.lineTo(r.x,r.y-2*z);ctx.lineTo(br.x,br.y);ctx.lineTo(bl.x,bl.y);ctx.closePath();ctx.fill();ctx.restore();
}
