import type {RoomBounds} from "../../sim/room.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {windowGlass,WINDOW_POSITIONS,type Daylight} from "../lighting.js";
import {drawRasterCached,rasterCacheUsable} from "../rasterCache.js";

/** Window glass, reflections and frame for every window on the north wall (pure function of its arguments). */
function paintWindowPanes(ctx:CanvasRenderingContext2D,camera:Projection,north:number,w:number,glass:ReturnType<typeof windowGlass>):void{
  ctx.save();
  for(const position of WINDOW_POSITIONS){
    if(position+1.2>w)continue;
    const a=iso({x:position,y:north},camera,127),b=iso({x:position+1.2,y:north},camera,127),
      c=iso({x:position+1.2,y:north},camera,73),d=iso({x:position,y:north},camera,73);
    const g=ctx.createLinearGradient(0,a.y,0,d.y);
    g.addColorStop(0,glass.top);g.addColorStop(1,glass.bottom);
    polygon(ctx,[a,b,c,d],g);
    // Interior reflection of the lamps grows as the street darkens.
    polygon(ctx,[iso({x:position+0.62,y:north},camera,127),iso({x:position+0.62,y:north},camera,73),c,b],
      "rgba(255,246,222,"+(glass.sheen*.45).toFixed(3)+")");
    polygon(ctx,[iso({x:position+.08,y:north},camera,124),iso({x:position+.42,y:north},camera,124),
      iso({x:position+.26,y:north},camera,78),iso({x:position+.08,y:north},camera,78)],
      "rgba(255,255,255,"+(glass.sheen*.5).toFixed(3)+")");
    // Montante e travessa dividem a janela, sem renderizar qualquer exterior.
    const mullionTop=iso({x:position+0.6,y:north},camera,127);
    const mullionBottom=iso({x:position+0.6,y:north},camera,73);
    ctx.strokeStyle="#C5B49B";ctx.lineWidth=2.3*camera.zoom;
    ctx.beginPath();ctx.moveTo(mullionTop.x,mullionTop.y);
    ctx.lineTo(mullionBottom.x,mullionBottom.y);ctx.stroke();
    const middleLeft=iso({x:position,y:north},camera,100);
    const middleRight=iso({x:position+1.2,y:north},camera,100);
    ctx.beginPath();ctx.moveTo(middleLeft.x,middleLeft.y);
    ctx.lineTo(middleRight.x,middleRight.y);ctx.stroke();
    ctx.strokeStyle="#F9E2BE";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.stroke();
  }
  ctx.restore();
}

  export function drawRoomWindows(ctx:CanvasRenderingContext2D,camera:Projection,bounds:RoomBounds,light:Daylight):void{
    const glass=windowGlass(light),north=bounds.minY,w=bounds.maxX,z=camera.zoom;
    if(!rasterCacheUsable(ctx)){paintWindowPanes(ctx,camera,north,w,glass);return;}
    const anchor=iso({x:WINDOW_POSITIONS[0]!,y:north},camera,0);
    drawRasterCached(ctx,"window-panes",{
      key:[z,w,north,glass.top,glass.bottom,glass.sheen.toFixed(3)].join(":"),anchorX:anchor.x,anchorY:anchor.y,snap:"round",limit:6,
      padX:Math.ceil(10*z)+4,padY:Math.ceil(135*z)+4,width:Math.ceil(250*z)+12,height:Math.ceil(190*z)+8
    },target=>paintWindowPanes(target,camera,north,w,glass));
  }
