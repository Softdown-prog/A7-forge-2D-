/** Logical scene units and the device backing store that presents them.
 * Every painter keeps working in the fixed 1000×610 coordinate system; only
 * the number of device pixels behind each unit changes with the display. */
export const SCENE_WIDTH=1000,SCENE_HEIGHT=610;
/** Fine pointers get up to 3× (4K at full width); touch devices keep 2× for battery/CPU. */
export const MAX_BACKING_SCALE=3,MAX_COARSE_BACKING_SCALE=2;
/** Hard ceiling on RGBA pixels of one scene surface (≈ 24 MiB). */
export const MAX_BACKING_PIXELS=6_000_000;

/** Backing-store scale for a Canvas shown at `cssWidth` CSS pixels on a device
 * pixel ratio `devicePixelRatio`. Quantized to tenths: 1000×610 scene units then
 * map onto whole device pixels, sprite caches are shared while the viewport is
 * resized by a few pixels, and the result is never below 1. */
export function sceneBackingScale(cssWidth:number,devicePixelRatio:number,coarse=false):number{
 if(!Number.isFinite(cssWidth)||cssWidth<=0||!Number.isFinite(devicePixelRatio)||devicePixelRatio<=0)return 1;
 const wanted=cssWidth*devicePixelRatio/SCENE_WIDTH;
 const byPixels=Math.sqrt(MAX_BACKING_PIXELS/(SCENE_WIDTH*SCENE_HEIGHT));
 const cap=Math.min(coarse?MAX_COARSE_BACKING_SCALE:MAX_BACKING_SCALE,byPixels);
 return Math.max(1,Math.min(cap,Math.ceil(wanted*10-1e-9)/10));
}

export interface BackingCanvas{width:number;height:number}
export interface BackingContext{setTransform?(a:number,b:number,c:number,d:number,e:number,f:number):void}
/** Resize the bitmap to `scale` device pixels per scene unit and map scene units
 * onto it. Returns true when the bitmap was reallocated (its content is lost). */
export function fitSceneBackingStore(canvas:BackingCanvas,ctx:BackingContext,scale:number):boolean{
 const s=Number.isFinite(scale)&&scale>0?scale:1;
 const width=Math.round(SCENE_WIDTH*s),height=Math.round(SCENE_HEIGHT*s);
 const changed=canvas.width!==width||canvas.height!==height;
 if(changed){canvas.width=width;canvas.height=height;}
 if(typeof ctx.setTransform==="function")ctx.setTransform(s,0,0,s,0,0);
 return changed;
}

export interface ClientRect{left:number;top:number;width:number;height:number}
/** Pointer position in scene units, independent of CSS zoom and backing scale. */
export function scenePointFromClient(rect:ClientRect,clientX:number,clientY:number):{x:number;y:number}{
 return {x:(clientX-rect.left)/Math.max(1,rect.width)*SCENE_WIDTH,
  y:(clientY-rect.top)/Math.max(1,rect.height)*SCENE_HEIGHT};
}
/** Scene units covered by one CSS pixel: touch radii are specified on screen. */
export function sceneUnitsPerCssPixel(rect:Pick<ClientRect,"width">):number{
 return SCENE_WIDTH/Math.max(1,rect.width);
}

interface TransformLike{a:number;b:number;c:number;d:number;e:number;f:number}
interface TransformContext{getTransform?():TransformLike|undefined}
/** Uniform device scale of a context: 1 for the identity, the factor for a pure
 * scale, or null when the transform cannot be reproduced by a cached bitmap. */
export function contextScale(ctx:TransformContext):number|null{
 if(typeof ctx.getTransform!=="function")return 1;
 const t=ctx.getTransform();
 if(!t||typeof t.a!=="number")return 1;
 if(t.b!==0||t.c!==0||t.e!==0||t.f!==0||t.a!==t.d||!(t.a>0)||!Number.isFinite(t.a))return null;
 return t.a;
}
