import {drawActor,OWNER_IDLE_RATE,type ActorRender} from "./actorArt.js";
import {walkPhase,WALK_CYCLE_DISTANCE} from "./walkCycle.js";
import {iso,type Projection} from "./isometric.js";
import {contextScale} from "./sceneSurface.js";

const FRAMES=32,TAU=Math.PI*2;
export const ACTOR_SPRITE_WIDTH=72,ACTOR_SPRITE_HEIGHT=120;
export const ACTOR_SPRITE_LEFT=36,ACTOR_SPRITE_TOP=110;
const PIXEL_BUDGET=16*1024*1024;
/** `scale` is the device pixels per art unit the frame was rasterized at. */
interface SpriteFrame{bitmap:ImageBitmap;left:number;top:number;bytes:number;scale:number}
interface SpriteCache{frames:Map<string,SpriteFrame>;pending:Set<string>;worker:Worker|null;bytes:number}
// Frames can be shared by the menu preview and the live room.
let sharedCache:SpriteCache|undefined;
function createCache():SpriteCache{
 const cache:SpriteCache={frames:new Map(),pending:new Set(),worker:null,bytes:0};
 if(typeof Worker==="undefined"||typeof OffscreenCanvas==="undefined")return cache;
 try{
  const url=new URL("./actorSpriteWorker.js",import.meta.url);
  // The published module graph carries ?v=release; the Worker entry must carry
  // that revision too, or a browser/CDN can mix releases across threads.
  url.search=new URL(import.meta.url).search;
  const worker=new Worker(url,{type:"module"});
  cache.worker=worker;
  worker.onmessage=(event:MessageEvent<{key:string;bitmap:ImageBitmap;left:number;top:number;scale?:number}>)=>{
   const {key,bitmap,left,top}=event.data,scale=event.data.scale??1;cache.pending.delete(key);
   const previous=cache.frames.get(key);
   if(previous){cache.bytes-=previous.bytes;previous.bitmap.close();cache.frames.delete(key);}
   const bytes=bitmap.width*bitmap.height*4;
   cache.frames.set(key,{bitmap,left,top,bytes,scale});cache.bytes+=bytes;
   // HiDPI frames carry scale² more pixels; the budget grows with them, capped at 4×.
   while(cache.bytes>PIXEL_BUDGET*Math.min(4,Math.max(1,scale*scale))){
    const oldest=cache.frames.keys().next().value!,frame=cache.frames.get(oldest)!;
    cache.bytes-=frame.bytes;frame.bitmap.close();cache.frames.delete(oldest);
   }
  };
  worker.onerror=event=>{event.preventDefault();worker.terminate();cache.worker=null;cache.pending.clear();};
 }catch{/* Original vector renderer remains available without worker support. */}
 return cache;
}
/** The PS2 grip is positioned per station and seat. It cannot share an
 * asynchronous bitmap key with another PS2 seat (or with the PS1).
 * Only these active PS2 rigs bypass the cache; walking and PS1 stay cached.
 */
export function actorRequiresLiveGamepadRig(a:Pick<ActorRender,"modernGamepad"|"gamepad"|"gamepadGrip">):boolean{
 return !!(a.gamepad&&a.modernGamepad&&a.gamepadGrip);
}
/** Reuse the vector artist's frames, while keeping world movement continuous.
 * Rasterization runs outside the animation/input thread. A pending frame uses
 * the original art immediately; it never blocks or pauses an actor to warm up.
 * Work, seat transitions and premium effects keep their continuous renderer. */
/** Which actors may be served from rasterized frames. Work, seat transitions and premium effects keep
 * their continuous renderer. The owner is cacheable only while idle (breathing and a light gesture,
 * one loop); printing, copying, receiving and the cyber costume stay live. */
export function actorSpriteEligible(a:ActorRender,zoom:number):boolean{
 const pose=a.pose??"idle";
 if(actorRequiresLiveGamepadRig(a)||zoom>1||a.kind==="cleaner"||a.kind==="technician"||a.kind==="postman"||a.premiumHeadset||a.reaction)return false;
 if(a.kind==="owner")return pose==="idle"&&!a.premiumCyber;
 if(pose!=="idle"&&pose!=="walking"&&pose!=="sitting")return false;
 return !(pose==="sitting"&&(a.transition??1)<1);
}
export function drawActorSprite(ctx:CanvasRenderingContext2D,camera:Projection,a:ActorRender):void{
 const pose=a.pose??"idle";
 if(!actorSpriteEligible(a,camera.zoom)){drawActor(ctx,camera,a);return;}
 // Share palettes, not customer identities or interpolated world coordinates.
 const id=a.kind==="regular"?(Math.abs(Math.trunc(a.id))||0)%4:0;
 const rate=pose==="walking"?7.7:pose==="sitting"?(a.gamepad?8:5.2):a.kind==="owner"?OWNER_IDLE_RATE:0;
 const offset=pose==="walking"?a.id*.27:pose==="sitting"&&!a.gamepad?a.id*.37:0;
 const angle=pose==="walking"&&a.walkDistance!==undefined?walkPhase(a.walkDistance):a.time*rate+offset;
 const phase=rate?((Math.round(angle/TAU*FRAMES)%FRAMES)+FRAMES)%FRAMES:0;
 const time=rate?(phase/FRAMES*TAU-(pose==="walking"?id*.27:pose==="sitting"&&!a.gamepad?id*.37:0))/rate:0;
 // A HiDPI backing store rasterizes the frame at its device scale, so the
 // bitmap is never magnified; a transformed context it cannot match stays vector.
 const scale=contextScale(ctx);
 if(scale===null){drawActor(ctx,camera,a);return;}
 const key=[a.kind,id,pose,a.direction??"south",a.screenView??"legacy",a.facing??1,!!a.gamepad,!!a.consoleSeat,phase,scale===1?"":scale].join("|");
 const cache=sharedCache??=createCache();
 const sprite=cache.frames.get(key);
 if(!sprite){
  if(cache.worker&&!cache.pending.has(key)&&cache.pending.size<64){
   cache.pending.add(key);cache.worker.postMessage({key,scale,actor:{...a,x:0,y:0,id,time,walkDistance:a.walkDistance===undefined?undefined:phase/FRAMES*WALK_CYCLE_DISTANCE}});
  }
  drawActor(ctx,camera,a);return;
 }
 cache.frames.delete(key);cache.frames.set(key,sprite);
 const p=iso(a,camera),z=camera.zoom/sprite.scale;
 // Cropping removes transparent margins only; the anchor and 1x art are retained.
 ctx.drawImage(sprite.bitmap,p.x-sprite.left*z,p.y-sprite.top*z,sprite.bitmap.width*z,sprite.bitmap.height*z);
}
