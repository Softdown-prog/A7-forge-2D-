import type {Point} from "../../sim/types.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {drawPcScreenActivity} from "../pcScreenActivities.js";
import type {ComputerAppearance} from "./types.js";
import {raisedBox,path,plane,round} from "./primitives.js";

export function drawCrtMonitor(c:CanvasRenderingContext2D,cam:Projection,p:Point,a:ComputerAppearance):void{
 const {tier,mode,pulse}=a,z=cam.zoom;
 const mx=p.x+.22,my=p.y-.05,mw=.46,md=.36,mz=36,mh=39;
 const top=a.linuxModel==="linux-dev-99"?"#607986":a.linuxModel?"#a6bfb8":tier===3?"#d3dedb":tier===2?"#eee0bc":"#f0e6d0";
 const side=a.linuxModel==="linux-dev-99"?"#405866":a.linuxModel?"#688b7d":tier===3?"#879fa0":tier===2?"#b9a57c":"#b7b1a0";
 const at=(x:number,y:number,h:number)=>iso({x,y},cam,h);
 if(cam.rotation===1||cam.rotation===2){
  raisedBox(c,cam,mx,my,mw,md,mz,mh,top,side,side);
  for(let i=0;i<5;i++)path(c,[at(mx+.08,my,mz+10+i*4),at(mx+mw-.08,my,mz+10+i*4)],"#75867b",1*z);
  raisedBox(c,cam,mx+.09,my+.12,.29,.27,34.5,3,"#dcd3bc","#a69f8a","#8f968a");return;
 }
 // CRT back narrows and slopes away from the broad front bezel.
 polygon(c,[at(mx+mw,my+md,mz),at(mx+mw-.055,my,mz+5),
  at(mx+mw-.055,my,mz+mh-5),at(mx+mw,my+md,mz+mh)],side,"#7b7d72");
 polygon(c,[at(mx,my+md,mz+mh),at(mx+.055,my,mz+mh-5),
  at(mx+mw-.055,my,mz+mh-5),at(mx+mw,my+md,mz+mh)],top,"#938c7a");
 path(c,[at(mx+.065,my+.055,mz+mh-4),at(mx+mw-.075,my+.055,mz+mh-4)],"#f9f0d8",1*z);
 for(let i=0;i<4;i++)path(c,[at(mx+mw-.027,my+.075+i*.045,mz+17),
  at(mx+mw-.015,my+.095+i*.045,mz+26)],"#747e75",.9*z);
 raisedBox(c,cam,mx+.09,my+.12,.29,.27,34.5,3,"#dcd3bc","#a69f8a","#8f968a");
 plane(c,cam,mx,my+md+.005,mw,mz,mh,()=>{
  const bezel=a.linuxModel==="linux-dev-99"?"#576f80":a.linuxModel?"#a8c8b5":tier===3?"#c6d6d3":tier===2?"#e4d4ac":"#e8deca";
  round(c,0,0,96,100,7,bezel,"#807b6c");
  path(c,[{x:6,y:89},{x:6,y:8},{x:86,y:8}],"#fff4df",2);
  path(c,[{x:91,y:13},{x:91,y:91},{x:13,y:91}],"#b6af99",2);
  round(c,10,11,77,70,7,"#8a9384");round(c,13,14,71,64,6,"#122f33","#526e65");
  c.save();c.beginPath();c.roundRect(15,16,67,60,5);c.clip();
  if(mode==="powered-off"){c.fillStyle="#10191b";c.fillRect(15,16,67,60);}else if(mode==="maintenance"){
   c.fillStyle="#263c3c";c.fillRect(15,16,67,60);
   path(c,[{x:34,y:34},{x:49,y:49},{x:59,y:38}],"#d7ae65",5);
   c.fillStyle="#d7ae65";c.fillRect(33,56,30,4);
  }else if((mode==="busy"||(mode==="ready"&&a.activity==="linux-terminal"))&&a.activity){
   drawPcScreenActivity((x,y,w,h,color)=>{
     c.fillStyle=color;c.fillRect(15+x*67,16+y*60,w*67,h*60);
   },a.activity,a.activityFrame);
  }else{
   c.fillStyle=mode==="offline"?"#284249":"#3a7c7c";c.fillRect(15,16,67,60);
   polygon(c,[{x:15,y:63},{x:47,y:30},{x:82,y:55},{x:82,y:76},{x:15,y:76}],"#32716a");
   c.fillStyle="#8eafa4";c.fillRect(15,69,67,7);c.fillStyle="#d9d5af";c.fillRect(18,70,16,4);
   for(let i=0;i<3;i++){c.fillStyle=i===1?"#e7cc8e":"#e5e2c2";c.fillRect(20,22+i*13,7,7);}
   round(c,34,26,41,35,2,"#d8dfcc","#51746e");
   c.fillStyle="#315d6e";c.fillRect(35,27,39,7);
   c.fillStyle=mode==="offline"?"#c09765":"#8baaa2";c.fillRect(39,40,29,5);
   c.fillStyle="#a5bdb0";c.fillRect(39,48,23,3);
   c.fillStyle=mode==="busy"&&pulse?"#d0b675":"#689181";c.fillRect(39,54,mode==="busy"&&pulse?27:17,3);
  }
  polygon(c,[{x:18,y:17},{x:35,y:17},{x:62,y:76},{x:53,y:76}],"rgba(245,246,212,.08)");c.restore();
  round(c,16,86,33,4,2,"#a49e8c");
  c.fillStyle=mode==="powered-off"?"#536963":mode==="maintenance"?"#d19a53":mode==="offline"?"#beaa72":"#7fae86";c.fillRect(77,88,5,3);
  round(c,84,87,5,6,2,"#aea994");
 });
}
