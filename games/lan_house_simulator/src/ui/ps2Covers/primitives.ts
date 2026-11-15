/** Shared original PS2 Canvas geometry helpers. */
export type Point=readonly [number,number];
export function polygon(c:CanvasRenderingContext2D,points:readonly Point[],color:string):void{
 c.fillStyle=color;c.beginPath();c.moveTo(...points[0]!);
 for(const p of points.slice(1))c.lineTo(...p);
 c.closePath();c.fill();
}
export function stroke(c:CanvasRenderingContext2D,points:readonly Point[],color:string,width=3):void{
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]!);
 for(const p of points.slice(1))c.lineTo(...p);
 c.stroke();
}
export function circle(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void{
 c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fill();
}
