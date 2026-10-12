import type { Point } from "../sim/types.js";
export interface Projection { originX: number; originY: number; zoom: number }
export const WORLD_TILE_WIDTH = 128;
export const WORLD_TILE_HEIGHT = 64;

export function cameraForRoom(width: number): Projection {
  const zoom = Math.min(0.86, 865 / ((width + 6) * 64));
  return { zoom, originX: 500 - (width - 6) * 32 * zoom, originY: 146 };
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
