import type { Point, GameState } from "../sim/types.js";
import {roomBounds} from "../sim/room.js";
import {turnPoint,type Rotation} from "../sim/layout.js";
export interface Projection { originX: number; originY: number; zoom: number;rotation?:Rotation;pivot?:Point }
export function objectCamera(cam:Projection,p:Point,w:number,d:number,rotation:Rotation=0):Projection{
 return rotation?{...cam,rotation,pivot:{x:p.x+w/2,y:p.y+d/2}}:cam;
}
export const WORLD_TILE_WIDTH = 128;
export const WORLD_TILE_HEIGHT = 64;

export function cameraForRoom(width: number): Projection {
  const zoom = Math.min(0.86, 865 / ((width + 6) * 64));
  return { zoom, originX: 500 - (width - 6) * 32 * zoom, originY: 146 };
}
/** Mantém a câmera antiga quando não há extensão, e enquadra áreas novas sem cortes. */
export function cameraForGame(s:GameState):Projection{
 const e=s.roomExtensions;
 if(!e||(!e.west&&!e.east&&!e.south&&!e.north))return cameraForRoom(8+s.expansionLevel*2);
 const b=roomBounds(s),minU=b.minX-b.maxY,maxU=b.maxX-b.minY;
 const minV=b.minX+b.minY,maxV=b.maxX+b.maxY;
 const zoom=Math.min(0.86,920/((maxU-minU)*64),535/((maxV-minV)*32+179));
 const originX=500-(maxU+minU)*32*zoom;
 const originY=305-(maxV*32+minV*32-155-24)/2*zoom;
 return {zoom,originX,originY};
}
export function iso(position: Point, camera: Projection, height = 0): Point {
  if(camera.rotation&&camera.pivot)position=turnPoint(position,camera.pivot,camera.rotation);
  return { x: camera.originX + (position.x - position.y) * 64 * camera.zoom,
    y: camera.originY + (position.x + position.y) * 32 * camera.zoom - height * camera.zoom };
}
export function polygon(ctx: CanvasRenderingContext2D, vertices: Point[], fill: string, stroke?: string): void {
  if (vertices.length === 0) return;
  ctx.beginPath(); ctx.moveTo(vertices[0]!.x, vertices[0]!.y);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i]!.x, vertices[i]!.y);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
export function cuboid(ctx: CanvasRenderingContext2D, camera: Projection, x: number, y: number,
  w: number, d: number, h: number, colors: [string, string, string]): void {
  if(camera.rotation){raisedCuboid(ctx,camera,x,y,w,d,0,h,colors);return;}
  const a=iso({x,y},camera), b=iso({x:x+w,y},camera), c=iso({x:x+w,y:y+d},camera), e=iso({x,y:y+d},camera);
  const at=iso({x,y},camera,h), bt=iso({x:x+w,y},camera,h),
    ct=iso({x:x+w,y:y+d},camera,h), et=iso({x,y:y+d},camera,h);
  polygon(ctx,[e,c,ct,et],colors[1],"#273046");
  polygon(ctx,[b,c,ct,bt],colors[2],"#273046");
  polygon(ctx,[at,bt,ct,et],colors[0],"#273046");
}
/** Select visible faces in world space, keeping height vertical after object rotation. */
export function raisedCuboid(ctx:CanvasRenderingContext2D,cam:Projection,x:number,y:number,w:number,d:number,z:number,h:number,colors:[string,string,string]):void{
 const at=(x:number,y:number,z:number)=>iso({x,y},cam,z),center=at(x+w/2,y+d/2,z);
 const faces=[
  {mid:at(x+w/2,y+d,z),points:[at(x,y+d,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x,y+d,z+h)],color:colors[1]},
  {mid:at(x+w,y+d/2,z),points:[at(x+w,y,z),at(x+w,y+d,z),at(x+w,y+d,z+h),at(x+w,y,z+h)],color:colors[2]},
  {mid:at(x+w/2,y,z),points:[at(x,y,z),at(x+w,y,z),at(x+w,y,z+h),at(x,y,z+h)],color:colors[2]},
  {mid:at(x,y+d/2,z),points:[at(x,y,z),at(x,y+d,z),at(x,y+d,z+h),at(x,y,z+h)],color:colors[1]}];
 for(const f of faces.filter(f=>f.mid.y>center.y).sort((a,b)=>a.mid.y-b.mid.y))polygon(ctx,f.points,f.color,"#556452");
 polygon(ctx,[at(x,y,z+h),at(x+w,y,z+h),at(x+w,y+d,z+h),at(x,y+d,z+h)],colors[0],"#7d8a70");
}
