import type {Point} from "../sim/types.js";
import {iso,polygon,raisedCuboid,type Projection} from "./isometric.js";

const faces={front:[0,3],back:[1,2],right:[0,1],left:[2,3]};
function visible(cam:Projection,face:keyof typeof faces):boolean{return faces[face].includes(cam.rotation??0);}
/** Paint on the physical plane. Letters remain readable on the visible side. */
function panel(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,span:number,z:number,h:number,axis:"x"|"y",paint:()=>void):void{
 let a=iso({x,y},cam,z+h),b=iso({x:x+(axis==="x"?span:0),y:y+(axis==="y"?span:0)},cam,z+h);
 if(b.x<a.x)[a,b]=[b,a];
 c.save();c.transform((b.x-a.x)/100,(b.y-a.y)/100,0,h*cam.zoom/60,a.x,a.y);paint();c.restore();
}
function top(c:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,paint:()=>void):void{
 const a=iso({x,y},cam,z),b=iso({x:x+w,y},cam,z),e=iso({x,y:y+d},cam,z);
 c.save();c.transform((b.x-a.x)/100,(b.y-a.y)/100,(e.x-a.x)/60,(e.y-a.y)/60,a.x,a.y);paint();c.restore();
}
function round(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string):void{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function line(c:CanvasRenderingContext2D,points:Point[],color:string,width:number):void{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
function paintCounter(c:CanvasRenderingContext2D,cam:Projection,p:Point):void{
 const {x,y}=p,z=cam.zoom;
 c.save();c.lineJoin="round";c.lineCap="round";
 const box=(dx:number,dy:number,w:number,d:number,base:number,h:number,colors:[string,string,string])=>raisedCuboid(c,cam,x+dx,y+dy,w,d,base,h,colors);
 // Foot, cabinet and a real raised top share the original 1.75 × .72 footprint.
 polygon(c,[iso({x:x+.04,y:y+.04},cam),iso({x:x+1.71,y:y+.04},cam),iso({x:x+1.71,y:y+.7},cam),iso({x:x+.04,y:y+.7},cam)],"rgba(15,35,30,.24)");
 box(.055,.045,1.64,.63,0,5,["#45665a","#263f37","#203b35"]);
 box(.035,.035,1.68,.65,5,44,["#c3a576","#986b49","#78553e"]);
 if(visible(cam,"front")){
  panel(c,cam,x+.11,y+.687,1.53,9,33,"x",()=>{
   round(c,0,0,100,60,3,"#233f38");round(c,1.5,2.5,97,54,2,"#3b6656");
   round(c,4,5,92,46,2,"#335b4b");
   c.strokeStyle="#5c8270";c.lineWidth=.9;for(const at of [22,40,60,78]){c.beginPath();c.moveTo(at,6);c.lineTo(at,51);c.stroke();}
   round(c,29,14,42,24,3,"#213d35");c.strokeStyle="#caaa70";c.lineWidth=1.2;c.strokeRect(31,16,38,20);
   c.fillStyle="#efd8a2";c.font="bold 11px sans-serif";c.textAlign="center";c.fillText("CAIXA",50,30);
   // Geometric terminal mark, scaled with the panel rather than a screen billboard.
   c.fillStyle="#d6b778";c.fillRect(11,20,9,8);c.fillRect(14,29,3,3);c.fillRect(11,32,9,2);
   round(c,80,24,7,3,1,"#cba767");
  });
 }
 if(visible(cam,"right"))panel(c,cam,x+1.716,y+.085,.52,10,31,"y",()=>{
  round(c,1,1,98,58,2,"#775239");round(c,5,4,90,50,2,"#a67850");
  c.strokeStyle="#bf9364";c.lineWidth=1;for(const at of [14,30,46]){c.beginPath();c.moveTo(7,at);c.bezierCurveTo(29,at-3,55,at+4,91,at);c.stroke();}
 });
 if(visible(cam,"back"))panel(c,cam,x+.13,y+.034,1.47,10,31,"x",()=>{
  round(c,0,0,100,60,2,"#7b583f");round(c,4,5,43,21,2,"#b2875f");round(c,4,30,43,24,2,"#a57b54");round(c,52,5,43,49,2,"#9a704b");
  round(c,20,13,12,3,1,"#e0bd80");round(c,20,37,12,3,1,"#dfb97e");round(c,55,25,3,11,1,"#dec08a");
 });
 if(visible(cam,"left"))panel(c,cam,x+.036,y+.085,.52,10,31,"y",()=>{
  round(c,0,0,100,60,2,"#8f6649");round(c,7,5,86,50,2,"#ae845d");
  c.fillStyle="#855e43";for(let i=0;i<5;i++)c.fillRect(24,18+i*5,50,2);
 });
 box(0,0,1.75,.72,49,4,["#e8c48e","#bb8a57","#a8754c"]);
 box(.016,.015,1.72,.69,53,2,["#f0d7a8","#d6aa71","#c49b66"]);
 top(c,cam,x+.08,y+.05,1.59,.60,55.1,()=>{
  c.strokeStyle="rgba(126,91,53,.16)";c.lineWidth=.8;
  for(const at of [10,27,47]){c.beginPath();c.moveTo(0,at);c.bezierCurveTo(26,at-3,65,at+4,100,at+1);c.stroke();}
 });
 // Compact CRT faces the administrator; the customer sees its rear vents.
 box(.23,.23,.31,.18,55,4,["#b6ad90","#7e8570","#78816c"]);
 box(.20,.15,.43,.30,59,28,["#e7dec8","#b6bca5","#9caa91"]);
 if(visible(cam,"front"))panel(c,cam,x+.235,y+.452,.36,63,18,"x",()=>{
  round(c,0,0,100,60,5,"#b1b89f");c.fillStyle="#798978";for(let i=0;i<5;i++)c.fillRect(16,8+i*7,68,2.5);
  c.fillStyle="#e7ddc4";c.fillRect(34,46,32,7);
 });
 if(visible(cam,"back"))panel(c,cam,x+.224,y+.148,.38,62,23,"x",()=>{
  round(c,0,0,100,60,5,"#777e6b");round(c,5,5,90,45,4,"#223d3a");round(c,9,8,82,38,3,"#57968b");
  round(c,9,8,82,7,2,"#254f49");c.fillStyle="#dbe4bc";c.fillRect(13,21,24,3);c.fillRect(13,28,46,2);c.fillRect(13,33,37,2);
  round(c,13,38,23,5,1,"#cedcba");round(c,40,38,18,5,1,"#93bc9f");round(c,81,52,5,3,1,"#bed89c");
 });
 // Input pad, till and receipt book use the same countertop plane.
 box(.23,.025,.45,.105,55,2,["#d5d3bd","#a2ad98","#899b89"]);
 top(c,cam,x+.25,y+.032,.41,.085,57.1,()=>{c.fillStyle="#687e72";for(let row=0;row<3;row++)for(let col=0;col<8;col++)c.fillRect(3+col*12,5+row*15,8,10);});
 box(1.17,.33,.35,.27,55,8,["#5a7966","#294d40","#224739"]);
 top(c,cam,x+1.205,y+.345,.28,.23,63.1,()=>{
  round(c,3,2,94,56,3,"#bdc8ac");round(c,12,8,76,14,2,"#203d36");c.fillStyle="#abd995";c.fillRect(52,12,27,4);
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)round(c,12+col*20,28+row*8,14,5,1,col===3?"#caa164":"#637d69");
 });
 top(c,cam,x+.81,y+.36,.27,.22,55.2,()=>{
  round(c,0,0,100,60,2,"#465f51");round(c,5,3,90,52,2,"#f3e8ce");
  c.fillStyle="#977a58";c.fillRect(13,11,73,3);c.fillStyle="#afb899";for(const at of [23,34,45])c.fillRect(13,at,65,1.5);
  c.fillStyle="#bd8b50";c.fillRect(82,7,5,43);
 });
 line(c,[iso({x:x+.63,y:y+.43},cam,57),iso({x:x+.68,y:y+.49},cam,55)],"#677767",1.7*z);
 c.restore();
}
const sprites=new WeakMap<CanvasRenderingContext2D,Map<string,HTMLCanvasElement>>();
/** Static artwork is rasterized once per zoom/orientation, including relocated counters. */
export function drawCounter(c:CanvasRenderingContext2D,cam:Projection,p:Point,useCache=true):void{
 if(!useCache||typeof document==="undefined"){paintCounter(c,cam,p);return;}
 const z=cam.zoom,anchor=iso(p,cam),ix=Math.round(anchor.x),iy=Math.round(anchor.y),key=[z,cam.rotation??0,(anchor.x-ix).toFixed(5),(anchor.y-iy).toFixed(5)].join(":"),padX=Math.ceil(210*z)+4,padY=Math.ceil(190*z)+4;
 let cache=sprites.get(c);if(!cache){cache=new Map();sprites.set(c,cache);}let sprite=cache.get(key);
 if(!sprite){
  sprite=document.createElement("canvas");sprite.width=Math.ceil(420*z)+8;sprite.height=Math.ceil(350*z)+8;
  const target=sprite.getContext("2d");if(!target){paintCounter(c,cam,p);return;}
  target.translate(padX-ix,padY-iy);paintCounter(target,cam,p);cache.set(key,sprite);
  if(cache.size>24)cache.delete(cache.keys().next().value!);
 }
 c.drawImage(sprite,ix-padX,iy-padY);
}
