/** Original drawing primitives shared by all seven vector poster designs. */
export function poly(c:CanvasRenderingContext2D,points:readonly number[][],color:string):void{
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x!,y!):c.moveTo(x!,y!));c.closePath();c.fillStyle=color;c.fill();
}
export function disk(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void{
 c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
}
export function line(c:CanvasRenderingContext2D,points:readonly number[][],color:string,width=2):void{
 c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x!,y!):c.moveTo(x!,y!));c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
