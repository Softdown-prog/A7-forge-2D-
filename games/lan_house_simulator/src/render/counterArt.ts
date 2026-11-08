import type {Point} from "../sim/types.js";
import {iso,polygon,raisedCuboid,type Projection} from "./isometric.js";
import {drawRasterCached,rasterCacheUsable} from "./rasterCache.js";
import {contactShadow,faceVisible as visible,flatEllipse,panel,round,top,vertical,wire} from "./planeArt.js";

const BRASS_LIGHT="#e9cf8e",BRASS="#caa66a",BRASS_DARK="#8f6f3e";
function line(c:CanvasRenderingContext2D,points:Point[],color:string,width:number):void{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
function brassGradient(c:CanvasRenderingContext2D,y0:number,y1:number):CanvasGradient{
 const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,BRASS_LIGHT);g.addColorStop(.5,BRASS);g.addColorStop(1,BRASS_DARK);return g;
}
/** Shadow of the overhanging top, clipped to the rounded panel so it never spills past the corners. */
function lipShadow(c:CanvasRenderingContext2D,depth:number,rgb:string,alpha:number):void{
 c.save();c.beginPath();c.roundRect(0,0,100,60,2.5);c.clip();
 const g=c.createLinearGradient(0,0,0,depth);g.addColorStop(0,"rgba("+rgb+","+alpha+")");g.addColorStop(1,"rgba("+rgb+",0)");
 c.fillStyle=g;c.fillRect(0,0,100,depth);c.restore();
}
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
   round(c,0,0,100,60,3,vertical(c,"#2a4a41","#1c332d"));round(c,1.5,2.5,97,54,2,vertical(c,"#47776b","#2f5649"));
   round(c,4,5,92,46,2,vertical(c,"#3c6a58","#2b5043"));
   c.strokeStyle="#5c8270";c.lineWidth=.9;for(const at of [22,40,60,78]){c.beginPath();c.moveTo(at,6);c.lineTo(at,51);c.stroke();}
   // Inset door bevels: a light top edge and a dark bottom edge on every door.
   for(const [a,b] of [[5,21],[23,39],[61,77],[79,95]] as const){
    c.strokeStyle="rgba(205,236,214,.22)";c.lineWidth=.9;c.beginPath();c.moveTo(a,7);c.lineTo(b,7);c.stroke();
    c.strokeStyle="rgba(10,24,20,.35)";c.beginPath();c.moveTo(a,50);c.lineTo(b,50);c.stroke();
   }
   // Brass plaque: bevelled frame, dark enamel and engraved lettering.
   round(c,27,12,46,28,3.5,brassGradient(c,12,40));round(c,29.5,14.5,41,23,2.5,vertical(c,"#1b3830","#27473d"));
   c.fillStyle="rgba(10,22,18,.7)";c.font="bold 11px sans-serif";c.textAlign="center";c.fillText("CAIXA",50.6,30.8);
   c.fillStyle="#f1dba6";c.fillText("CAIXA",50,30);
   for(const sx of [30.5,69.5])for(const sy of [15.5,36.5]){c.fillStyle="#fff1c4";c.beginPath();c.arc(sx,sy,.9,0,Math.PI*2);c.fill();}
   // Geometric terminal mark, scaled with the panel rather than a screen billboard.
   c.fillStyle="#d6b778";c.fillRect(11,20,9,8);c.fillRect(14,29,3,3);c.fillRect(11,32,9,2);
   c.fillStyle="#f6e3ae";c.fillRect(11,20,9,1.2);
   // Brass pulls.
   round(c,80,24,7,3,1.2,brassGradient(c,24,27));round(c,13,40,7,3,1.2,brassGradient(c,40,43));
   // Dark toe-kick with a thin highlight where it meets the cabinet.
   c.fillStyle="rgba(8,20,16,.5)";c.fillRect(3,53.5,94,3);c.fillStyle="rgba(190,226,205,.16)";c.fillRect(3,53.2,94,.7);
   // The overhanging top throws a soft shadow down the upper edge of the doors.
   lipShadow(c,12,"6,16,13",.42);
  });
 }
 if(visible(cam,"right"))panel(c,cam,x+1.716,y+.085,.52,10,31,"y",()=>{
  round(c,1,1,98,58,2,vertical(c,"#805940","#6a4631"));round(c,5,4,90,50,2,vertical(c,"#b0835a","#9b6f48"));
  c.strokeStyle="#bf9364";c.lineWidth=1;for(const at of [14,30,46]){c.beginPath();c.moveTo(7,at);c.bezierCurveTo(29,at-3,55,at+4,91,at);c.stroke();}
  c.strokeStyle="rgba(255,236,196,.22)";c.lineWidth=.8;c.strokeRect(5.5,4.5,89,49);
  lipShadow(c,10,"34,18,8",.36);
 });
 if(visible(cam,"back"))panel(c,cam,x+.13,y+.034,1.47,10,31,"x",()=>{
  round(c,0,0,100,60,2,vertical(c,"#85604a","#6f4e38"));round(c,4,5,43,21,2,vertical(c,"#bb9068","#a87f58"));round(c,4,30,43,24,2,vertical(c,"#ad8359","#9a714c"));round(c,52,5,43,49,2,vertical(c,"#a57a54","#8f6844"));
  round(c,20,13,12,3,1,brassGradient(c,13,16));round(c,20,37,12,3,1,brassGradient(c,37,40));round(c,55,25,3,11,1,brassGradient(c,25,36));
  c.strokeStyle="rgba(255,236,196,.2)";c.lineWidth=.8;c.strokeRect(4.5,5.5,42,20);c.strokeRect(4.5,30.5,42,23);c.strokeRect(52.5,5.5,42,48);
  lipShadow(c,9,"34,18,8",.34);
 });
 if(visible(cam,"left"))panel(c,cam,x+.036,y+.085,.52,10,31,"y",()=>{
  round(c,0,0,100,60,2,vertical(c,"#96694b","#7c583f"));round(c,7,5,86,50,2,vertical(c,"#b58a62","#a07751"));
  c.fillStyle="#855e43";for(let i=0;i<5;i++)c.fillRect(24,18+i*5,50,2);
  c.fillStyle="rgba(255,236,196,.18)";for(let i=0;i<5;i++)c.fillRect(24,18+i*5,50,.6);
  lipShadow(c,9,"34,18,8",.34);
 });
 box(0,0,1.75,.72,49,4,["#e8c48e","#bb8a57","#a8754c"]);
 box(.016,.015,1.72,.69,53,2,["#f0d7a8","#d6aa71","#c49b66"]);
 top(c,cam,x+.08,y+.05,1.59,.60,55.1,()=>{
  const sheen=c.createLinearGradient(0,0,0,60);sheen.addColorStop(0,"rgba(255,246,214,.20)");sheen.addColorStop(.55,"rgba(255,246,214,0)");sheen.addColorStop(1,"rgba(120,80,40,.10)");
  c.fillStyle=sheen;c.fillRect(0,0,100,60);
  c.strokeStyle="rgba(126,91,53,.16)";c.lineWidth=.8;
  for(const at of [10,27,47]){c.beginPath();c.moveTo(0,at);c.bezierCurveTo(26,at-3,65,at+4,100,at+1);c.stroke();}
  // Polished wear along the customer-side edge, where hands and elbows rest.
  c.fillStyle="rgba(255,244,208,.22)";c.fillRect(2,53,96,3);
  c.fillStyle="rgba(150,104,56,.20)";c.fillRect(2,56.5,96,2);
 });

 // Leather desk pad under the keyboard and mouse.
 top(c,cam,x+.18,y+.015,.67,.15,55.05,()=>{round(c,0,0,100,60,8,"#3a4a41");round(c,3,5,94,50,6,"#46584d");c.fillStyle="rgba(255,255,230,.10)";c.fillRect(6,7,88,2);});

 // Compact CRT faces the administrator; the customer sees its rear vents.
 contactShadow(c,cam,x+.20,y+.15,.43,.30,55.1,.22);
 box(.23,.23,.31,.18,55,4,["#b6ad90","#7e8570","#78816c"]);
 box(.20,.15,.43,.30,59,28,["#e7dec8","#b6bca5","#9caa91"]);
 // Rear housing of the tube: a smaller, darker step behind the screen block.
 if(visible(cam,"front"))panel(c,cam,x+.235,y+.452,.36,63,18,"x",()=>{
  round(c,0,0,100,60,5,vertical(c,"#b9c0a8","#a3ab92"));
  c.fillStyle="#6c7a6b";for(let i=0;i<6;i++)c.fillRect(14,8+i*6.4,72,2.2);
  c.fillStyle="rgba(255,255,236,.25)";for(let i=0;i<6;i++)c.fillRect(14,8+i*6.4,72,.6);
  round(c,33,46,34,8,2,"#ece3c9");c.fillStyle="#9aa28a";c.fillRect(37,49,18,1.4);c.fillRect(37,51.4,12,1.1);
  c.fillStyle="#6c7a6b";c.beginPath();c.arc(78,50,2.4,0,Math.PI*2);c.fill();
 });
 // Side vents on the tube housing, visible from whichever side the camera shows.
 if(visible(cam,"right"))panel(c,cam,x+.63,y+.17,.26,60,24,"y",()=>{
  round(c,0,0,100,60,3,vertical(c,"#a9b29a","#8f9a82"));
  c.fillStyle="#65745f";for(let i=0;i<7;i++)c.fillRect(16,9+i*6,68,2);
  c.fillStyle="rgba(255,255,236,.2)";for(let i=0;i<7;i++)c.fillRect(16,9+i*6,68,.6);
 });
 if(visible(cam,"left"))panel(c,cam,x+.20,y+.17,.26,60,24,"y",()=>{
  round(c,0,0,100,60,3,vertical(c,"#b3bba4","#99a58b"));
  c.fillStyle="#65745f";for(let i=0;i<7;i++)c.fillRect(16,9+i*6,68,2);
 });
 if(visible(cam,"back"))panel(c,cam,x+.224,y+.148,.38,62,23,"x",()=>{
  // Plastic bezel, deep glass, a faint scanline texture and a diagonal reflection.
  round(c,0,0,100,60,5,vertical(c,"#8a917c","#6d7566"));round(c,4,4,92,47,4,"#1b3431");
  round(c,6,6,88,42,3,vertical(c,"#5ea396","#3d7c72"));
  round(c,6,6,88,7,2,"#254f49");c.fillStyle="#e4edc4";c.fillRect(10,8.2,18,2);c.fillStyle="#7ab59b";c.fillRect(31,8.2,3,2);c.fillRect(37,8.2,3,2);
  c.fillStyle="#dbe4bc";c.fillRect(11,18,24,2.6);c.fillRect(11,25,46,2);c.fillRect(11,30,37,2);c.fillRect(11,35,29,2);
  c.fillStyle="#bfe0a0";c.fillRect(11,41,5,2.6);
  round(c,40,37,18,5,1,"#93bc9f");round(c,62,37,24,5,1,"#cedcba");
  c.fillStyle="rgba(10,28,25,.11)";for(let i=0;i<20;i++)c.fillRect(6,13+i*2,88,.7);
  c.fillStyle="rgba(255,255,255,.17)";c.beginPath();c.moveTo(8,6);c.lineTo(40,6);c.lineTo(22,48);c.lineTo(8,48);c.closePath();c.fill();
  // Badge, power LED and the contrast/brightness dials under the glass.
  round(c,6,53,16,3.4,1.2,"#c9c3aa");c.fillStyle="#a6e07f";c.beginPath();c.arc(90,54.6,1.5,0,Math.PI*2);c.fill();
  c.fillStyle="#52594d";c.beginPath();c.arc(80,54.6,1.5,0,Math.PI*2);c.arc(74,54.6,1.5,0,Math.PI*2);c.fill();
 });
 // Keyboard on the pad: key rows with a long space bar and a wire to the monitor base.
 box(.23,.025,.45,.105,55.1,2,["#d9d7c2","#a6b09b","#8c9d8c"]);
 top(c,cam,x+.25,y+.032,.41,.085,57.2,()=>{
  c.fillStyle="#5d7367";c.fillRect(0,0,100,60);
  for(let row=0;row<3;row++)for(let col=0;col<10;col++){c.fillStyle=(row+col)%7===0?"#9fb0a1":"#d6dccb";c.fillRect(2.5+col*9.6,4+row*14,7.4,10);}
  c.fillStyle="#d6dccb";c.fillRect(20,46,56,9);c.fillStyle="#9fb0a1";c.fillRect(80,46,16,9);
  c.fillStyle="rgba(255,255,255,.25)";for(let row=0;row<3;row++)c.fillRect(2.5,4+row*14,95,1);
 });
 wire(c,cam,{x:x+.45,y:y+.14},56.5,{x:x+.42,y:y+.24},58,"#58655a",1.2,3);
 // Mouse and a short cable back to the keyboard.
 box(.70,.045,.065,.085,55.1,2.6,["#e1ddc6","#b0b9a2","#97a590"]);
 top(c,cam,x+.708,y+.052,.049,.045,57.8,()=>{round(c,0,0,100,60,18,"#e8e4cf");c.fillStyle="#9ba895";c.fillRect(48,0,4,30);});
 wire(c,cam,{x:x+.735,y:y+.05},57,{x:x+.67,y:y+.045},57,"#5a685d",1,2);

 // Cash drawer / till: receipt printer paper, key grid and a lit display.
 contactShadow(c,cam,x+1.17,y+.33,.35,.27,55.1,.2);
 box(1.17,.33,.35,.27,55,8,["#5a7966","#294d40","#224739"]);
 top(c,cam,x+1.205,y+.345,.28,.23,63.1,()=>{
  round(c,3,2,94,56,3,"#bdc8ac");round(c,12,8,76,14,2,"#203d36");c.fillStyle="#abd995";c.fillRect(16,11,22,2.6);c.fillRect(16,16,36,2);c.fillRect(52,12,27,4);
  c.fillStyle="rgba(255,255,255,.14)";c.beginPath();c.moveTo(12,8);c.lineTo(48,8);c.lineTo(36,22);c.lineTo(12,22);c.closePath();c.fill();
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)round(c,12+col*20,28+row*8,14,5,1,col===3?"#caa164":"#637d69");
  round(c,12,52,76,4,1,"#f1ead2");
 });
 // Order pad / receipt book, with a pen resting on it.
 top(c,cam,x+.81,y+.36,.27,.22,55.2,()=>{
  round(c,0,0,100,60,2,"#465f51");round(c,5,3,90,52,2,"#f3e8ce");
  c.fillStyle="#977a58";c.fillRect(13,11,73,3);c.fillStyle="#afb899";for(const at of [23,34,45])c.fillRect(13,at,65,1.5);
  c.fillStyle="#bd8b50";c.fillRect(82,7,5,43);
 });
 line(c,[iso({x:x+.63,y:y+.43},cam,57),iso({x:x+.68,y:y+.49},cam,55)],"#677767",1.7*z);
 line(c,[iso({x:x+.93,y:y+.40},cam,55.6),iso({x:x+1.02,y:y+.47},cam,55.6)],"#2f4a7a",1.5*z);

 // Brass service bell: a base disc, a dome with a highlight and a push button.
 contactShadow(c,cam,x+.075,y+.485,.10,.10,55.1,.22);
 flatEllipse(c,cam,x+.125,y+.535,.052,.052,55.2,"#9b7840","#6d5428");
 flatEllipse(c,cam,x+.125,y+.535,.040,.040,57.6,BRASS,BRASS_DARK);
 flatEllipse(c,cam,x+.118,y+.528,.022,.022,59.2,BRASS_LIGHT);
 flatEllipse(c,cam,x+.125,y+.535,.010,.010,61,"#f4e0a8","#9b7840",10);
 // Pen cup with two pens, and a card holder for the price list.
 contactShadow(c,cam,x+.075,y+.27,.10,.10,55.1,.2);
 flatEllipse(c,cam,x+.125,y+.32,.045,.045,55.2,"#2d4c42","#1c332d");
 const cupA=iso({x:x+.08,y:y+.32},cam,55.2),cupB=iso({x:x+.17,y:y+.32},cam,55.2),cupC=iso({x:x+.17,y:y+.32},cam,63),cupD=iso({x:x+.08,y:y+.32},cam,63);
 polygon(c,[cupA,cupB,cupC,cupD],"#3b6657","#1c332d");
 flatEllipse(c,cam,x+.125,y+.32,.045,.045,63,"#2a463c","#1c332d");
 line(c,[iso({x:x+.115,y:y+.315},cam,61),iso({x:x+.095,y:y+.30},cam,70)],"#c1473c",1.5*z);
 line(c,[iso({x:x+.135,y:y+.325},cam,61),iso({x:x+.15,y:y+.34},cam,69)],"#2f4a7a",1.5*z);
 line(c,[iso({x:x+.125,y:y+.32},cam,61),iso({x:x+.125,y:y+.31},cam,71)],"#e0b348",1.5*z);
 contactShadow(c,cam,x+.23,y+.50,.17,.10,55.1,.18);
 box(.23,.52,.17,.04,55,9,["#efe7cd","#d8ceb0","#c1b797"]);
 if(visible(cam,"front"))panel(c,cam,x+.235,y+.562,.16,57,6.5,"x",()=>{
  round(c,0,0,100,60,3,"#f6efd8");c.fillStyle="#2f5649";c.fillRect(8,9,50,7);c.fillStyle="#9aa78f";for(const at of [24,34,44])c.fillRect(8,at,84,3);
  c.fillStyle="#caa164";c.fillRect(66,9,26,7);
 });
 c.restore();
}
/** Static artwork is rasterized once per zoom/orientation, including relocated counters. */
export function drawCounter(c:CanvasRenderingContext2D,cam:Projection,p:Point,useCache=true):void{
 if(!useCache||!rasterCacheUsable(c)){paintCounter(c,cam,p);return;}
 const z=cam.zoom,anchor=iso(p,cam);
 drawRasterCached(c,"counter",{
  key:[z,cam.rotation??0].join(":"),anchorX:anchor.x,anchorY:anchor.y,snap:"round",limit:24,
  padX:Math.ceil(210*z)+4,padY:Math.ceil(190*z)+4,width:Math.ceil(420*z)+8,height:Math.ceil(350*z)+8
 },target=>paintCounter(target,cam,p));
}
