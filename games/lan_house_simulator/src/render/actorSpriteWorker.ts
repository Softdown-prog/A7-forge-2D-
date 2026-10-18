import {drawActor,type ActorRender} from "./actorArt.js";
import {ACTOR_SPRITE_WIDTH as WIDTH,ACTOR_SPRITE_HEIGHT as HEIGHT,ACTOR_SPRITE_LEFT as LEFT,ACTOR_SPRITE_TOP as TOP} from "./actorSprites.js";

// Reuse both surfaces; readbacks and tight bitmap preparation stay off the UI thread.
const canvas=new OffscreenCanvas(WIDTH,HEIGHT),ctx=canvas.getContext("2d",{willReadFrequently:true})!;
const cropped=new OffscreenCanvas(WIDTH,HEIGHT),crop=cropped.getContext("2d")!;
const worker=self as unknown as {
 onmessage:(event:MessageEvent<{key:string;actor:ActorRender}>)=>void;
 postMessage:(value:{key:string;bitmap:ImageBitmap;left:number;top:number},transfer:Transferable[])=>void;
};
worker.onmessage=({data:{key,actor}})=>{
 drawActor(ctx,{originX:LEFT,originY:TOP,zoom:1},actor);
 // Keep every nontransparent pixel plus a two-pixel interpolation gutter.
 // The old 72x120 rectangles spent most of the 16 MiB budget on empty margins.
 const pixels=ctx.getImageData(0,0,WIDTH,HEIGHT).data;
 let minX=WIDTH,minY=HEIGHT,maxX=-1,maxY=-1;
 for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)if(pixels[(y*WIDTH+x)*4+3]){
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 if(maxX<0){minX=minY=0;maxX=maxY=0;}
 minX=Math.max(0,minX-2);minY=Math.max(0,minY-2);
 maxX=Math.min(WIDTH-1,maxX+2);maxY=Math.min(HEIGHT-1,maxY+2);
 cropped.width=maxX-minX+1;cropped.height=maxY-minY+1;
 crop.drawImage(canvas,minX,minY,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
 const bitmap=cropped.transferToImageBitmap();ctx.clearRect(0,0,WIDTH,HEIGHT);
 worker.postMessage({key,bitmap,left:LEFT-minX,top:TOP-minY},[bitmap]);
};
