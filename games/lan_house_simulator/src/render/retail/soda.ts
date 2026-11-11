import {line,rounded} from "./primitives.js";

export const SODA_COLORS=["#bf6560","#79a69e","#d5b366"] as const;
export function drawSodaCan(c:CanvasRenderingContext2D,x:number,y:number,color:string):void{
 const shade=c.createLinearGradient(x,0,x+12,0);shade.addColorStop(0,"#53655f");shade.addColorStop(.25,color);shade.addColorStop(.72,color);shade.addColorStop(1,"#425955");
 rounded(c,x,y,12,22,3,shade);
 c.fillStyle="#c5d0c4";c.beginPath();c.ellipse(x+6,y+1,5.4,1.7,0,0,Math.PI*2);c.fill();
 c.strokeStyle="#5d756f";c.lineWidth=.8;c.stroke();c.fillStyle="#536d68";c.fillRect(x+5,y,3,1);
 c.fillStyle="#eee8c9";c.beginPath();c.ellipse(x+6,y+11,4,5,0,0,Math.PI*2);c.fill();
 line(c,[{x:x+5,y:y+8},{x:x+8,y:y+11},{x:x+5,y:y+14}],color,1.3);
 line(c,[{x:x+2,y:y+5},{x:x+2,y:y+17}],"rgba(245,243,214,.4)",1);
}
