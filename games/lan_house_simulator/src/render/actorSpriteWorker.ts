import {drawActor,type ActorRender} from "./actorArt.js";
import {ACTOR_SPRITE_WIDTH as WIDTH,ACTOR_SPRITE_HEIGHT as HEIGHT,ACTOR_SPRITE_LEFT as LEFT,ACTOR_SPRITE_TOP as TOP} from "./actorSprites.js";

// A single reusable surface avoids allocating hundreds of Canvas contexts.
const canvas=new OffscreenCanvas(WIDTH,HEIGHT),ctx=canvas.getContext("2d")!;
const worker=self as unknown as {
 onmessage:(event:MessageEvent<{key:string;actor:ActorRender}>)=>void;
 postMessage:(value:{key:string;bitmap:ImageBitmap},transfer:Transferable[])=>void;
};
worker.onmessage=({data:{key,actor}})=>{
 drawActor(ctx,{originX:LEFT,originY:TOP,zoom:1},actor);
 const bitmap=canvas.transferToImageBitmap(); // Transfer resets the surface.
 worker.postMessage({key,bitmap},[bitmap]);
};
