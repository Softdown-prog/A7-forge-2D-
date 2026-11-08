/** Shared bitmap cache for static furniture painted with vector calls.
 * A raster is keyed by its art key, the device scale and the sub-pixel phase
 * of its anchor, so a blit reproduces the exact live rasterization (text
 * included). Nothing here touches simulation state. */
import {contextScale} from "./sceneSurface.js";

export interface RasterSpec{
 /** Art identity: everything that changes the pixels except camera phase. */
 key:string;
 /** Scene-space anchor; snapped to a device pixel before painting. */
 anchorX:number;anchorY:number;
 /** Scene units kept to the left/top of the anchor inside the bitmap. */
 padX:number;padY:number;
 /** Bitmap extent in scene units (already multiplied by camera zoom). */
 width:number;height:number;
 /** Anchor snapping rule used by the original painter. */
 snap?:"floor"|"round";
 /** LRU capacity for this painter family. */
 limit?:number;
}
type Store=Map<string,HTMLCanvasElement>;
const stores=new WeakMap<CanvasRenderingContext2D,Map<string,Store>>();
function storeFor(ctx:CanvasRenderingContext2D,family:string):Store{
 let families=stores.get(ctx);if(!families){families=new Map();stores.set(ctx,families);}
 let store=families.get(family);if(!store){store=new Map();families.set(family,store);}
 return store;
}
/** True when the target can be reproduced from a bitmap without visible change. */
export function rasterCacheUsable(ctx:CanvasRenderingContext2D):boolean{
 return typeof document!=="undefined"&&ctx.globalAlpha===1&&ctx.globalCompositeOperation==="source-over"&&
  (!ctx.filter||ctx.filter==="none")&&contextScale(ctx)!==null;
}
/** Paint through the cache when possible; otherwise paint directly. */
export function drawRasterCached(ctx:CanvasRenderingContext2D,family:string,spec:RasterSpec,
 paint:(target:CanvasRenderingContext2D)=>void):void{
 const scale=contextScale(ctx);
 if(scale===null||!rasterCacheUsable(ctx)){paint(ctx);return;}
 const snap=spec.snap==="round"?Math.round:Math.floor;
 // Snap in device pixels: the bitmap keeps the live sub-pixel phase at any scale.
 const deviceX=spec.anchorX*scale,deviceY=spec.anchorY*scale;
 const snapX=snap(deviceX),snapY=snap(deviceY);
 const padX=Math.ceil(spec.padX*scale),padY=Math.ceil(spec.padY*scale);
 const key=spec.key+"|"+scale+"|"+(deviceX-snapX).toFixed(5)+"|"+(deviceY-snapY).toFixed(5);
 const store=storeFor(ctx,family);
 let sprite=store.get(key);
 if(!sprite){
  sprite=document.createElement("canvas");
  sprite.width=Math.max(1,Math.ceil(spec.width*scale));sprite.height=Math.max(1,Math.ceil(spec.height*scale));
  const target=sprite.getContext("2d");
  if(!target){paint(ctx);return;}
  target.setTransform(scale,0,0,scale,padX-snapX,padY-snapY);
  paint(target);
  store.set(key,sprite);
  const limit=spec.limit??64;
  while(store.size>limit)store.delete(store.keys().next().value!);
 }else{store.delete(key);store.set(key,sprite);}
 ctx.drawImage(sprite,(snapX-padX)/scale,(snapY-padY)/scale,sprite.width/scale,sprite.height/scale);
}
