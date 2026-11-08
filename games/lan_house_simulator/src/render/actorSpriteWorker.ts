import {drawActor,type ActorRender} from "./actorArt.js";
import {ACTOR_SPRITE_WIDTH as WIDTH,ACTOR_SPRITE_HEIGHT as HEIGHT,ACTOR_SPRITE_LEFT as LEFT,ACTOR_SPRITE_TOP as TOP} from "./actorSprites.js";

// Reuse both surfaces; readbacks and tight bitmap preparation stay off the UI thread.
const canvas=new OffscreenCanvas(WIDTH,HEIGHT),ctx=canvas.getContext("2d",{willReadFrequently:true})!;
const cropped=new OffscreenCanvas(WIDTH,HEIGHT),crop=cropped.getContext("2d")!;
const worker=self as unknown as {
 onmessage:(event:MessageEvent<{key:string;actor:ActorRender;scale?:number}>)=>void;
 postMessage:(value:{key:string;bitmap:ImageBitmap;left:number;top:number;scale:number},transfer:Transferable[])=>void;
};
worker.onmessage=({data:{key,actor,scale:requested}})=>{
 // HiDPI surfaces ask for `scale` device pixels per art unit (1 keeps the old frames).
 const scale=Number.isFinite(requested)&&requested!>0?Math.min(4,requested!):1;
 const width=Math.ceil(WIDTH*scale),height=Math.ceil(HEIGHT*scale),left=LEFT*scale,top=TOP*scale;
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 drawActor(ctx,{originX:left,originY:top,zoom:scale},actor);
 // Keep every nontransparent pixel plus a two-pixel interpolation gutter.
 // The old 72x120 rectangles spent most of the 16 MiB budget on empty margins.
 const pixels=ctx.getImageData(0,0,width,height).data;
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]){
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 if(maxX<0){minX=minY=0;maxX=maxY=0;}
 minX=Math.max(0,minX-2);minY=Math.max(0,minY-2);
 maxX=Math.min(width-1,maxX+2);maxY=Math.min(height-1,maxY+2);
 cropped.width=maxX-minX+1;cropped.height=maxY-minY+1;
 crop.drawImage(canvas,minX,minY,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
 const bitmap=cropped.transferToImageBitmap();ctx.clearRect(0,0,width,height);
 worker.postMessage({key,bitmap,left:left-minX,top:top-minY,scale},[bitmap]);
};
