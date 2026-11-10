import type {Point} from "../../sim/types.js";
import type {LcdId} from "../../sim/computerModels.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {drawPcScreenActivity} from "../pcScreenActivities.js";
import type {ComputerAppearance} from "./types.js";
import {raisedBox,path,plane,round} from "./primitives.js";

export const lcdMaterials:Record<LcdId,{top:string;front:string;side:string;accent:string}>={
 lcd05:{top:"#d4dcd9",front:"#a5b6b5",side:"#71888a",accent:"#75a5a8"},
 lcd08:{top:"#535d60",front:"#39474b",side:"#26383d",accent:"#98b9b7"},
 lcd12:{top:"#677579",front:"#3a5058",side:"#283e46",accent:"#68b9c4"},
 lcd17:{top:"#64706f",front:"#364846",side:"#253b38",accent:"#d7b477"},
 lcd24:{top:"#384d55",front:"#243c47",side:"#172e39",accent:"#8bb8bd"}
};

export function drawLcdMonitor(c:CanvasRenderingContext2D,cam:Projection,p:Point,a:ComputerAppearance):void{
 const id=a.lcd!;const n=["lcd05","lcd08","lcd12","lcd17","lcd24"].indexOf(id);
 const colors=lcdMaterials[id],z=cam.zoom,at=(x:number,y:number,h:number)=>iso({x:p.x+x,y:p.y+y},cam,h);
 // Width follows the horizontal face in isometric world units (sqrt(64²+32²));
 // heights keep a 4:3 first LCD and genuinely wide later panels.
 const width=[.52,.62,.67,.70,.74][n]!,height=[28,25,27,28,30][n]!;
 const x=.44-width/2,y=.12,depth=[.095,.075,.045,.035,.04][n]!,bottom=43;
 // Each stand has its own silhouette; all stay on the existing desk footprint.
 if(n===0)raisedBox(c,cam,p.x+.27,p.y+.09,.34,.20,34.5,1.8,colors.top,colors.front,colors.side);
 else if(n===1)raisedBox(c,cam,p.x+.30,p.y+.11,.28,.19,34.5,1.4,colors.top,colors.front,colors.side);
 else if(n===2){const base=at(.44,.21,35);c.fillStyle=colors.front;c.beginPath();c.ellipse(base.x,base.y,12*z,5*z,0,0,Math.PI*2);c.fill();}
 else if(n===3)raisedBox(c,cam,p.x+.30,p.y+.10,.28,.21,34.5,1.3,"#b5c1ba",colors.top,colors.side);
 else for(const side of [-1,1])path(c,[at(.44,.16,36),at(.44+side*.20,.28,35)],colors.top,3*z);
 path(c,[at(.44,.16,36),at(.44,.16,bottom+9)],n===3?"#b7c7c1":colors.front,(n===0?5:3.2)*z);
 raisedBox(c,cam,p.x+x,p.y+y,width,depth,bottom,height,colors.top,colors.front,colors.side);
 plane(c,cam,p.x+x,p.y+y+depth+.003,width,bottom,height,()=>{
  round(c,0,0,96,100,n<2?3:1.5,colors.front,"#1f393d");
  const edge=[8,6,4,2.5,2.5][n]!,foot=[12,10,7,6,6][n]!;
  round(c,edge,edge,96-edge*2,100-edge-foot,1,"#17333f");
  c.save();c.beginPath();c.rect(edge+1,edge+1,94-edge*2,98-edge-foot);c.clip();
  if(a.mode==="powered-off"){c.fillStyle="#10191b";c.fillRect(0,0,96,100);}else if(a.mode==="maintenance"){
   c.fillStyle="#243941";c.fillRect(0,0,96,100);
   path(c,[{x:34,y:30},{x:49,y:47},{x:62,y:34}],"#e0b77a",5);
   c.fillStyle="#d3a560";c.fillRect(30,61,38,4);
  }else if(a.mode==="offline"){
   c.fillStyle="#233c47";c.fillRect(0,0,96,100);
   round(c,30,32,36,25,2,"#879e9c");
   path(c,[{x:37,y:64},{x:59,y:64}],"#c7ac76",3);
   path(c,[{x:41,y:40},{x:55,y:51}],"#896d52",3);
  }else if((a.mode==="busy"||(a.mode==="ready"&&a.activity==="linux-terminal"))&&a.activity){
   const x0=edge+1,y0=edge+1;
   const w=94-edge*2,h=98-edge-foot;
   drawPcScreenActivity((x,y,ww,hh,color)=>{
     c.fillStyle=color;c.fillRect(x0+x*w,y0+y*h,ww*w,hh*h);
   },a.activity,a.activityFrame);
  }else if(n===4){
   c.fillStyle="#193a4e";c.fillRect(0,0,96,100);
   polygon(c,[{x:0,y:72},{x:47,y:24},{x:96,y:73},{x:96,y:94},{x:0,y:94}],"#275870");
   for(let i=0;i<4;i++)path(c,[{x:16+i*21,y:90},{x:47,y:30}],"#4d8791",1);
   path(c,[{x:3,y:74},{x:93,y:74}],"#84afa3",2);
   const target=a.mode==="busy"&&a.pulse?59:48;
   path(c,[{x:target-4,y:47},{x:target+4,y:47}],"#e4c181",1.5);
   path(c,[{x:target,y:43},{x:target,y:51}],"#e4c181",1.5);
   c.fillStyle="#d9b976";c.fillRect(8,12,24,4);c.fillStyle="#8cb6b6";c.fillRect(8,19,16,3);
  }else{
   c.fillStyle=["#467e94","#40697d","#3c8591","#467b71"][n]!;c.fillRect(0,0,96,100);
   polygon(c,[{x:0,y:77},{x:35,y:33},{x:96,y:70},{x:96,y:95},{x:0,y:95}],n<2?"#719a7c":"#63a498");
   polygon(c,[{x:0,y:88},{x:57,y:62},{x:96,y:81},{x:96,y:95},{x:0,y:95}],"#3f746c");
   for(let i=0;i<3;i++){c.fillStyle=i===1?"#e2c17b":"#bed5c6";c.fillRect(12,16+i*15,6,7);}
   round(c,29,24,n===0?54:40,46,2,"#e5e7d5");
   c.fillStyle=n<2?"#335e7e":"#407b79";c.fillRect(30,25,n===0?52:38,7);
   c.fillStyle="#86ada1";c.fillRect(34,39,n===0?40:27,5);
   c.fillStyle="#b1c5b0";c.fillRect(34,49,24,3);
   c.fillStyle=a.mode==="busy"&&a.pulse?"#d9b573":"#6b9d8d";c.fillRect(34,58,a.pulse?26:16,4);
   if(n>0){round(c,73,38,17,31,1,"#aec6ba");c.fillStyle="#54786f";c.fillRect(75,42,12,4);c.fillRect(75,51,9,2);}
   c.fillStyle=n===3?"#284e4a":"#b9c5ad";c.fillRect(edge,85,96-edge*2,7);
   c.fillStyle="#e5d8b5";c.fillRect(n===3?39:12,87,16,3);
  }
  polygon(c,[{x:9,y:6},{x:22,y:6},{x:60,y:90},{x:50,y:90}],"rgba(238,245,223,.07)");c.restore();
  c.fillStyle=colors.accent;c.fillRect(40,96-foot/2,15,1.5);
  c.fillStyle=a.mode==="powered-off"?"#536963":a.mode==="maintenance"?"#dfb166":a.mode==="offline"?"#a38f63":"#87c4ae";
  c.fillRect(87,95,2,2);
 });
}
