/** Unmodified Canvas geometry helpers shared by PS1 covers. */
export type Point=readonly [number,number];
export function path(ctx:CanvasRenderingContext2D,points:readonly Point[],color:string):void{
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]!);
 for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.closePath();ctx.fill();
}
export function line(ctx:CanvasRenderingContext2D,points:readonly Point[],color:string,width=3):void{
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...points[0]!);
 for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.stroke();
}
export function circle(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void{
 ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
