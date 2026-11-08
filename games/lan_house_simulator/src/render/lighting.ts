/** Time-of-day lighting for the salon. Derived only from the simulation clock
 * (10:00 opens, 22:00 closes); never from the wall clock, weather or RNG.
 * Weather stays a HUD/economy matter, per the room visualisation contract. */
import {DAY_MINUTES} from "../sim/types.js";
import type {GameState} from "../sim/types.js";
import {roomBounds,type RoomBounds} from "../sim/room.js";
import {iso,type Projection} from "./isometric.js";
import {contextScale} from "./sceneSurface.js";
import type {Point} from "../sim/types.js";
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
/** A screen glow is a soft coloured ellipse. The radial gradient is the costly part of drawing one, so
 * each (colour, opacity) is rendered once into a tiny canvas and then only scaled onto the scene, which is
 * exactly what a unit radial gradient scaled to the ellipse would paint. Opacity is quantized to 1/64. */
const GLOW_TEXTURE=64,GLOW_LIMIT=96;
const glowTextures=new Map<string,HTMLCanvasElement>();
function glowTexture(color:string,alpha:number):HTMLCanvasElement|null{
 if(typeof document==="undefined")return null;
 const step=Math.max(1,Math.min(64,Math.round(alpha*64))),key=color+"|"+step;
 const known=glowTextures.get(key);
 if(known){glowTextures.delete(key);glowTextures.set(key,known);return known;}
 const canvas=document.createElement("canvas");canvas.width=GLOW_TEXTURE;canvas.height=GLOW_TEXTURE;
 const g=canvas.getContext("2d");if(!g)return null;
 const half=GLOW_TEXTURE/2,gradient=g.createRadialGradient(half,half,0,half,half,half);
 gradient.addColorStop(0,withAlpha(color,step/64));gradient.addColorStop(1,withAlpha(color,0));
 g.fillStyle=gradient;g.fillRect(0,0,GLOW_TEXTURE,GLOW_TEXTURE);
 glowTextures.set(key,canvas);
 if(glowTextures.size>GLOW_LIMIT){const oldest=glowTextures.keys().next().value;if(oldest!==undefined)glowTextures.delete(oldest);}
 return canvas;
}
/** Soft ellipse of one colour fading to nothing: the cached texture when a DOM exists, a live gradient otherwise. */
function glowEllipse(ctx:CanvasRenderingContext2D,cx:number,cy:number,rx:number,ry:number,color:string,alpha:number):void{
 const texture=glowTexture(color,alpha);
 if(texture){ctx.drawImage(texture,cx-rx,cy-ry,rx*2,ry*2);return;}
 ellipseGradient(ctx,cx,cy,rx,ry,withAlpha(color,alpha),withAlpha(color,0));
}
interface LightBox{x:number;y:number;w:number;h:number}
interface LightLayer extends LightBox{key:string;canvas:HTMLCanvasElement}
const layers=new WeakMap<CanvasRenderingContext2D,LightLayer>();
/** Light only changes visibly a few dozen times between opening and closing. */
const LIGHT_STEPS=24;
/** Window shaft parallelograms on the floor, shared by the painter and the box. */
function shafts(camera:Projection,bounds:RoomBounds){
 const north=bounds.minY,out:{poly:Point[];from:Point;to:Point}[]=[];
 for(const x of WINDOW_POSITIONS){
  if(x+1.2>bounds.maxX)continue;
  out.push({poly:[iso({x:x+.02,y:north+.02},camera,0),iso({x:x+1.18,y:north+.02},camera,0),
   iso({x:x+1.55,y:north+1.75},camera,0),iso({x:x+.45,y:north+1.75},camera,0)],
   from:iso({x:x+.6,y:north},camera,0),to:iso({x:x+1,y:north+1.75},camera,0)});
 }
 return out;
}
function lampCenters(camera:Projection,bounds:RoomBounds):Point[]{
 return lampPositions(bounds).map(x=>iso({x,y:bounds.minY+.95},camera,0));
}
/** Scene-space rectangle that contains every shaft and lamp pool, or null. */
function lightBox(camera:Projection,bounds:RoomBounds,light:Daylight,width:number,height:number):LightBox|null{
 const z=camera.zoom;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 const add=(px:number,py:number)=>{x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);};
 if(light.daylight>.02)for(const sh of shafts(camera,bounds))for(const p of sh.poly)add(p.x,p.y);
 for(const c of lampCenters(camera,bounds)){add(c.x-90*z,c.y-46*z);add(c.x+90*z,c.y+46*z);}
 if(!Number.isFinite(x0))return null;
 x0=Math.max(0,Math.floor(x0)-2);y0=Math.max(0,Math.floor(y0)-2);
 x1=Math.min(width,Math.ceil(x1)+2);y1=Math.min(height,Math.ceil(y1)+2);
 return x1>x0&&y1>y0?{x:x0,y:y0,w:x1-x0,h:y1-y0}:null;
}
/** Daylight shafts and lamp pools, in scene units, on a context already mapped to scene space.
 * Plain source-over throughout: alternating blend modes inside the frame forces the
 * browser to flush its draw batch, which was the dominant cost of the first version. */
function paintLightLayer(t:CanvasRenderingContext2D,camera:Projection,bounds:RoomBounds,light:Daylight):void{
 const z=camera.zoom;
 if(light.daylight>.02){
  const tone=lerpHex("#fff6dc","#ffc27a",light.warmth);
  for(const sh of shafts(camera,bounds)){
   const g=t.createLinearGradient(sh.from.x,sh.from.y,sh.to.x,sh.to.y);
   g.addColorStop(0,withAlpha(tone,.11*light.daylight));g.addColorStop(1,withAlpha(tone,0));
   t.fillStyle=g;t.beginPath();t.moveTo(sh.poly[0]!.x,sh.poly[0]!.y);
   for(const p of sh.poly.slice(1))t.lineTo(p.x,p.y);
   t.closePath();t.fill();
  }
 }
 // Lamp pools: warm, slightly stronger as the daylight fades.
 const pool=.07+.15*light.night;
 for(const c of lampCenters(camera,bounds))
  ellipseGradient(t,c.x,c.y,88*z,44*z,withAlpha("#ffe3b0",pool),withAlpha("#ffe3b0",0));
}
/** Floor light from the lamps, daylight shafts under the windows and the evening
 * tint. Painted over the depth-sorted objects and before the in-canvas HUD.
 * The localized light is cached per quantized hour; each frame only blits it and
 * lays one translucent wash over the frame. */
export function drawSceneLighting(ctx:CanvasRenderingContext2D,camera:Projection,s:GameState,
 _elapsed:number,width:number,height:number):void{
 const light=daylightAt(s.totalMinutes),bounds=roomBounds(s);
 const dq=Math.round(light.daylight*LIGHT_STEPS),wq=Math.round(light.warmth*LIGHT_STEPS);
 const stepped:Daylight={...light,daylight:dq/LIGHT_STEPS,night:1-dq/LIGHT_STEPS,warmth:wq/LIGHT_STEPS};
 const scale=contextScale(ctx);
 ctx.save();
 if(scale===null||typeof document==="undefined"){
  paintLightLayer(ctx,camera,bounds,stepped);
 }else{
  const box=lightBox(camera,bounds,stepped,width,height);
  if(box){
   const key=[dq,wq,scale,camera.originX.toFixed(2),camera.originY.toFixed(2),camera.zoom.toFixed(4),
    bounds.minX,bounds.maxX,bounds.minY,bounds.maxY,box.x,box.y,box.w,box.h].join("|");
   let layer=layers.get(ctx);
   if(!layer||layer.key!==key){
    const canvas=layer?.canvas??document.createElement("canvas");
    canvas.width=Math.max(1,Math.ceil(box.w*scale));canvas.height=Math.max(1,Math.ceil(box.h*scale));
    const t=canvas.getContext("2d");
    if(t){
     t.setTransform(scale,0,0,scale,-box.x*scale,-box.y*scale);
     paintLightLayer(t,camera,bounds,stepped);
     layer={...box,key,canvas};layers.set(ctx,layer);
    }else{layer=undefined;paintLightLayer(ctx,camera,bounds,stepped);}
   }
   if(layer)ctx.drawImage(layer.canvas,layer.x,layer.y,layer.canvas.width/scale,layer.canvas.height/scale);
  }
 }
 // Evening tint: a dark blue wash over the frame, approximating a multiply without its cost.
 if(light.night>.01){
  ctx.fillStyle=withAlpha("#18284f",.30*light.night);
  ctx.fillRect(0,0,width,height);
 }
 // Golden hour warms the room before the lamps take over.
 if(light.warmth>.01&&light.daylight>.05){
  ctx.fillStyle=withAlpha("#ff9f4a",.085*light.warmth*light.daylight);
  ctx.fillRect(0,0,width,height);
 }
 ctx.restore();
}
/** Floor-level glow of an active screen. Source-over, so it never breaks the draw batch. */
export function drawScreenGlow(ctx:CanvasRenderingContext2D,camera:Projection,x:number,y:number,
 height:number,color:string,strength:number):void{
 if(strength<=0)return;
 const at=iso({x,y},camera,height),z=camera.zoom;
 glowEllipse(ctx,at.x,at.y,36*z,22*z,color,strength*.8);
}
/** How strongly a lit monitor shows against the evening: 0 by day, rising with the
 * same `night` curve that darkens the room. `strength` is the screen's own level
 * (busy sessions glow more than an idle desktop). Pure, so it is easy to test. */
export function monitorEmission(night:number,strength:number):{screen:number;halo:number;spill:number}{
 const n=Math.max(0,Math.min(1,Number.isFinite(night)?night:0)),k=Math.max(0,Number.isFinite(strength)?strength:0);
 return {
  // The glass itself, lifted toward its own colour; large enough to read through the dark wash.
  screen:n<.02?0:Math.min(.3,k*1.0)*n,
  // Soft light around the monitor and over the desk.
  halo:k*(.55+1.5*n),
  spill:k*(.6+1.6*n)
 };
}
/** Night-time light of an active screen: a halo around the glass, then the glass
 * itself lifted toward the activity colour. Painted in depth order (before anything
 * seated in front of the monitor), and before the evening wash, which then tints it
 * like the rest of the room. Source-over only. */
export function drawMonitorEmission(ctx:CanvasRenderingContext2D,quad:readonly Point[],
 color:string,night:number,strength:number):void{
 const e=monitorEmission(night,strength);
 if(e.screen<=0&&e.halo<=0)return;
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const q of quad){x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y);}
 const w=x1-x0,h=y1-y0;
 if(!(w>0&&h>0))return;
 const cx=(x0+x1)/2,cy=(y0+y1)/2;
 glowEllipse(ctx,cx,cy,w*(.95+.5*night),h*(1.15+.6*night),color,Math.min(.42,e.halo*.8));
 if(e.screen>0){
  const tone=lerpHex(color,"#ffffff",.18);
  ctx.fillStyle=withAlpha(tone,e.screen);
  ctx.beginPath();ctx.moveTo(quad[0]!.x,quad[0]!.y);
  for(let i=1;i<quad.length;i++)ctx.lineTo(quad[i]!.x,quad[i]!.y);
  ctx.closePath();ctx.fill();
 }
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
