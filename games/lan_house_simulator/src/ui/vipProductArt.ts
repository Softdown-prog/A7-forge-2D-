import {drawActor} from "../render/actorArt.js";
import {drawVipAquarium} from "../render/aquariumArt.js";

/** Miniaturas reais, feitas uma vez com o renderizador procedural.
 * São bitmaps pequenos e não iniciam animações nem repintura da UI a cada frame. */
const thumbnails=new Map<string,string>();
export function vipProductThumbnail(id:string):string|null{
 if(id!=="tony-cyber"&&id!=="aquarium-rgb")return null;
 const cached=thumbnails.get(id);if(cached)return cached;
 if(typeof document==="undefined")return null;
 const canvas=document.createElement("canvas");
 canvas.width=212;canvas.height=186;
 const c=canvas.getContext("2d");if(!c)return null;
 const bg=c.createLinearGradient(0,0,212,186);
 bg.addColorStop(0,"#112537");bg.addColorStop(1,"#263c57");
 c.fillStyle=bg;c.fillRect(0,0,212,186);
 c.fillStyle="rgba(118,233,218,.11)";
 for(let i=0;i<8;i++){c.fillRect(8+i*28,0,1,186);c.fillRect(0,i*26,212,1);}
 if(id==="tony-cyber"){
  const cam={originX:103,originY:155,zoom:1.73};
  drawActor(c,cam,{kind:"owner",id:0,time:2.1,pose:"idle",
    direction:"south",x:0,y:0,premiumCyber:true});
 }else{
  drawVipAquarium(c,{originX:50,originY:161,zoom:1.14},{x:0,y:0},2.4);
 }
 const url=canvas.toDataURL("image/png");thumbnails.set(id,url);return url;
}
