import {wallEndpoints,type WallSegment} from "../../sim/walls.js";
import {iso,polygon,type Projection} from "../isometric.js";

  export function drawInteriorWall(ctx:CanvasRenderingContext2D,camera:Projection,wall:WallSegment,preview=false,allowed=true):void{
    const [a,b]=wallEndpoints(wall),height=78;
    const footA=iso(a,camera),footB=iso(b,camera),topA=iso(a,camera,height),topB=iso(b,camera,height);
    ctx.save();
    let fill:string|CanvasGradient=preview?(allowed?"rgba(91,183,147,0.68)":"rgba(204,78,69,0.72)"):"rgba(211,195,177,0.91)";
    if(!preview){
      // Lit from above: brighter cap, shaded foot, like the outer walls.
      const g=ctx.createLinearGradient(0,topA.y,0,footA.y);
      g.addColorStop(0,"rgba(226,212,192,0.94)");g.addColorStop(.7,"rgba(207,191,172,0.92)");g.addColorStop(1,"rgba(168,152,139,0.93)");
      fill=g;
    }
    polygon(ctx,[topA,topB,footB,footA],fill,
      preview?(allowed?"#bdf5d4":"#ffd0ba"):"#735f61");
    if(!preview){
      // Baseboard strip grounds the partition on the tiles.
      const baseA=iso(a,camera,7),baseB=iso(b,camera,7);
      ctx.fillStyle="rgba(120,100,96,.55)";ctx.beginPath();ctx.moveTo(footA.x,footA.y);ctx.lineTo(footB.x,footB.y);ctx.lineTo(baseB.x,baseB.y);ctx.lineTo(baseA.x,baseA.y);ctx.closePath();ctx.fill();
    }
    const capA=iso({x:a.x+0.03,y:a.y+0.03},camera,height+2),
      capB=iso({x:b.x+0.03,y:b.y+0.03},camera,height+2);
    ctx.strokeStyle=preview?"#f3f3d8":"#faf0dc";ctx.lineWidth=Math.max(1,4*camera.zoom);
    ctx.beginPath();ctx.moveTo(capA.x,capA.y);ctx.lineTo(capB.x,capB.y);ctx.stroke();
    ctx.restore();
  }

  export function drawInteriorDoor(ctx:CanvasRenderingContext2D,camera:Projection,door:WallSegment,preview=false):void{
    const [a,b]=wallEndpoints(door);
    const left=iso(a,camera),right=iso(b,camera),
      leftTop=iso(a,camera,78),rightTop=iso(b,camera,78);
    ctx.save();
    ctx.strokeStyle=preview?"#8ee6b3":"#704c48";
    ctx.lineWidth=Math.max(3,8*camera.zoom);
    ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(leftTop.x,leftTop.y);
    ctx.lineTo(rightTop.x,rightTop.y);ctx.lineTo(right.x,right.y);ctx.stroke();
    ctx.strokeStyle=preview?"#ddffe3":"#d4ad77";
    ctx.lineWidth=Math.max(1.5,3*camera.zoom);
    ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.stroke();
    ctx.restore();
  }
