import type {RoomBounds} from "../../sim/room.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {WINDOW_POSITIONS} from "../lighting.js";
import {shadeHex} from "../color.js";
import {SCENE_THEME as theme} from "../theme.js";

  export function drawRoomWalls(ctx:CanvasRenderingContext2D,camera:Projection,bounds:RoomBounds):void {
    const minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY,z=camera.zoom;
    const backTop=iso({x:minX,y:north},camera,155),backFoot=iso({x:minX,y:north},camera);
    // Ceiling lamps light the upper wall; paint falls off toward the baseboard.
    const back=ctx.createLinearGradient(0,backTop.y,0,backFoot.y);
    back.addColorStop(0,shadeHex(theme.wallBack,1.05));back.addColorStop(.6,theme.wallBack);back.addColorStop(1,shadeHex(theme.wallBack,.86));
    polygon(ctx,[backTop,iso({x:w,y:north},camera,155),
      iso({x:w,y:north},camera),backFoot],back,"#7f876e");
    const sideTop=iso({x:minX,y:south},camera,155),sideFoot=iso({x:minX,y:south},camera);
    const side=ctx.createLinearGradient(0,sideTop.y-80*z,0,sideFoot.y);
    side.addColorStop(0,shadeHex(theme.wallSide,1.04));side.addColorStop(.65,theme.wallSide);side.addColorStop(1,shadeHex(theme.wallSide,.84));
    polygon(ctx,[backTop,sideTop,sideFoot,backFoot],side,"#748168");
    // Inner corner shadow where the two walls meet.
    const corner=ctx.createLinearGradient(backFoot.x,0,backFoot.x+70*z,0);
    corner.addColorStop(0,"rgba(60,66,56,.22)");corner.addColorStop(1,"rgba(60,66,56,0)");
    polygon(ctx,[backTop,iso({x:minX+1.1,y:north},camera,155),iso({x:minX+1.1,y:north},camera),backFoot],corner);
    const cornerSide=ctx.createLinearGradient(backFoot.x,0,backFoot.x-70*z,0);
    cornerSide.addColorStop(0,"rgba(60,66,56,.18)");cornerSide.addColorStop(1,"rgba(60,66,56,0)");
    polygon(ctx,[backTop,iso({x:minX,y:north+1.1},camera,155),iso({x:minX,y:north+1.1},camera),backFoot],cornerSide);
    // Crown line: a thin bright edge marks the top of both walls.
    ctx.strokeStyle="rgba(255,250,236,.55)";ctx.lineWidth=Math.max(1,1.4*z);
    ctx.beginPath();ctx.moveTo(sideTop.x,sideTop.y);ctx.lineTo(backTop.x,backTop.y);ctx.lineTo(iso({x:w,y:north},camera,155).x,iso({x:w,y:north},camera,155).y);ctx.stroke();
    for(const position of WINDOW_POSITIONS){
      if(position+1.2>w)continue;
      const a=iso({x:position,y:north},camera,127),b=iso({x:position+1.2,y:north},camera,127),
        c=iso({x:position+1.2,y:north},camera,73),d=iso({x:position,y:north},camera,73);
      // Frame recess and shadow under the lintel; glass is painted per frame.
      polygon(ctx,[iso({x:position-.05,y:north},camera,131),iso({x:position+1.25,y:north},camera,131),
        iso({x:position+1.25,y:north},camera,70),iso({x:position-.05,y:north},camera,70)],"#cfc3a6","#8f8673");
      polygon(ctx,[a,b,c,d],"#2f4858","#F9E2BE");
      // Peitoril projetado em 2:1, distinto do caixilho.
      polygon(ctx,[iso({x:position-0.06,y:north+0.03},camera,72),
        iso({x:position+1.26,y:north+0.03},camera,72),
        iso({x:position+1.26,y:north+0.11},camera,70),
        iso({x:position-0.06,y:north+0.11},camera,70)],"#DDD0B3","#867D79");
      polygon(ctx,[iso({x:position-0.06,y:north+0.11},camera,70),
        iso({x:position+1.26,y:north+0.11},camera,70),
        iso({x:position+1.26,y:north+0.11},camera,66),
        iso({x:position-0.06,y:north+0.11},camera,66)],"#b9ab8f","#867D79");
    }
  }
