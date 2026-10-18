import {drawActor,type ActorRender} from "./actorArt.js";
import {iso,type Projection} from "./isometric.js";

const FRAMES=32,TAU=Math.PI*2;
export const ACTOR_SPRITE_WIDTH=72,ACTOR_SPRITE_HEIGHT=120;
export const ACTOR_SPRITE_LEFT=36,ACTOR_SPRITE_TOP=110;
const LIMIT=Math.floor(16*1024*1024/(ACTOR_SPRITE_WIDTH*ACTOR_SPRITE_HEIGHT*4));
interface SpriteCache{frames:Map<string,ImageBitmap>;pending:Set<string>;worker:Worker|null}
// Frames can be shared by the menu preview and the live room.
let sharedCache:SpriteCache|undefined;
function createCache():SpriteCache{
 const cache:SpriteCache={frames:new Map(),pending:new Set(),worker:null};
 if(typeof Worker==="undefined"||typeof OffscreenCanvas==="undefined")return cache;
 try{
  const url=new URL("./actorSpriteWorker.js",import.meta.url);
  // The published module graph carries ?v=release; the Worker entry must carry
  // that revision too, or a browser/CDN can mix releases across threads.
  url.search=new URL(import.meta.url).search;
  const worker=new Worker(url,{type:"module"});
  cache.worker=worker;
  worker.onmessage=(event:MessageEvent<{key:string;bitmap:ImageBitmap}>)=>{
   const {key,bitmap}=event.data;cache.pending.delete(key);
   cache.frames.get(key)?.close();cache.frames.delete(key);cache.frames.set(key,bitmap);
   if(cache.frames.size>LIMIT){const oldest=cache.frames.keys().next().value!;cache.frames.get(oldest)!.close();cache.frames.delete(oldest);}
  };
  worker.onerror=event=>{event.preventDefault();worker.terminate();cache.worker=null;cache.pending.clear();};
 }catch{/* Original vector renderer remains available without worker support. */}
 return cache;
}
/** Reuse the vector artist's frames, while keeping world movement continuous.
 * Rasterization runs outside the animation/input thread. A pending frame uses
 * the original art immediately; it never blocks or pauses an actor to warm up.
 * Work, seat transitions and premium effects keep their continuous renderer. */
export function drawActorSprite(ctx:CanvasRenderingContext2D,camera:Projection,a:ActorRender):void{
 const pose=a.pose??"idle";
 if(camera.zoom>1||a.kind==="owner"||a.kind==="cleaner"||a.kind==="technician"||a.premiumHeadset||
    (pose!=="idle"&&pose!=="walking"&&pose!=="sitting")||
    (pose==="sitting"&&(a.transition??1)<1)){
  drawActor(ctx,camera,a);return;
 }
 // Share palettes, not customer identities or interpolated world coordinates.
 const id=a.kind==="regular"?(Math.abs(Math.trunc(a.id))||0)%4:0;
 const rate=pose==="walking"?7.7:pose==="sitting"?(a.gamepad?8:5.2):0;
 const offset=pose==="walking"?a.id*.27:pose==="sitting"&&!a.gamepad?a.id*.37:0;
 const phase=rate?((Math.round((a.time*rate+offset)/TAU*FRAMES)%FRAMES)+FRAMES)%FRAMES:0;
 const time=rate?(phase/FRAMES*TAU-(pose==="walking"?id*.27:pose==="sitting"&&!a.gamepad?id*.37:0))/rate:0;
 const key=[a.kind,id,pose,a.direction??"south",a.facing??1,!!a.gamepad,!!a.consoleSeat,phase].join("|");
 const cache=sharedCache??=createCache();
 const sprite=cache.frames.get(key);
 if(!sprite){
  if(cache.worker&&!cache.pending.has(key)&&cache.pending.size<64){
   cache.pending.add(key);cache.worker.postMessage({key,actor:{...a,x:0,y:0,id,time}});
  }
  drawActor(ctx,camera,a);return;
 }
 cache.frames.delete(key);cache.frames.set(key,sprite);
 const p=iso(a,camera),z=camera.zoom;
 // 1x source retains detail for room cameras (<= .86x), independently of zoom.
 ctx.drawImage(sprite,p.x-ACTOR_SPRITE_LEFT*z,p.y-ACTOR_SPRITE_TOP*z,ACTOR_SPRITE_WIDTH*z,ACTOR_SPRITE_HEIGHT*z);
}
