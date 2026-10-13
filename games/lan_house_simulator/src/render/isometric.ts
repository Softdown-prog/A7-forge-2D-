import type { Point, GameState } from "../sim/types.js";
import {roomBounds} from "../sim/room.js";
export interface Projection { originX: number; originY: number; zoom: number }
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
  const a=iso({x,y},camera), b=iso({x:x+w,y},camera), c=iso({x:x+w,y:y+d},camera), e=iso({x,y:y+d},camera);
  const at=iso({x,y},camera,h), bt=iso({x:x+w,y},camera,h),
    ct=iso({x:x+w,y:y+d},camera,h), et=iso({x,y:y+d},camera,h);
  polygon(ctx,[e,c,ct,et],colors[1],"#273046");
  polygon(ctx,[b,c,ct,bt],colors[2],"#273046");
  polygon(ctx,[at,bt,ct,et],colors[0],"#273046");
}
