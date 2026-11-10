import type {RoomBounds} from "../../sim/room.js";
import {iso,polygon,type Projection} from "../isometric.js";
import {premiumCheckerPatch} from "../premiumRoomArt.js";
import {shadeHex,withAlpha,cellNoise} from "../color.js";
import {SCENE_THEME as theme} from "../theme.js";

  export function drawRoomFloor(ctx:CanvasRenderingContext2D,camera:Projection,bounds:RoomBounds,premium=false):void {
    const minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY,z=camera.zoom;
    // O cenário é uma plataforma suspensa: sem exterior, sem base ligada a um terreno.
    const rearRight=iso({x:w,y:north},camera);
    const frontRight=iso({x:w,y:south},camera);
    const frontLeft=iso({x:minX,y:south},camera);
    const bottom=24*z;
    ctx.save();
    ctx.shadowColor="rgba(7,12,23,0.65)";
    ctx.shadowBlur=25*z;
    ctx.shadowOffsetY=18*z;
    polygon(ctx,[frontLeft,frontRight,
      {x:frontRight.x,y:frontRight.y+bottom},
      {x:frontLeft.x,y:frontLeft.y+bottom}],"#514854","#343245");
    ctx.restore();
    // Slab faces: a vertical gradient reads as thickness instead of two flat fills.
    const frontFace=ctx.createLinearGradient(0,frontLeft.y,0,frontLeft.y+bottom);
    frontFace.addColorStop(0,shadeHex(theme.baseFront,1.12));frontFace.addColorStop(1,shadeHex(theme.baseFront,.78));
    polygon(ctx,[frontLeft,frontRight,
      {x:frontRight.x,y:frontRight.y+bottom},
      {x:frontLeft.x,y:frontLeft.y+bottom}],frontFace,theme.ink);
    const sideFace=ctx.createLinearGradient(0,rearRight.y,0,frontRight.y+bottom);
    sideFace.addColorStop(0,shadeHex(theme.baseSide,1.08));sideFace.addColorStop(1,shadeHex(theme.baseSide,.8));
    polygon(ctx,[rearRight,frontRight,
      {x:frontRight.x,y:frontRight.y+bottom},
      {x:rearRight.x,y:rearRight.y+bottom}],sideFace,theme.ink);
    for(let y=north;y<south;y++) for(let x=minX;x<w;x++) {
      const ps=[iso({x,y},camera),iso({x:x+1,y},camera),iso({x:x+1,y:y+1},camera),iso({x,y:y+1},camera)];
      if(premium)premiumCheckerPatch(ctx,camera,x,y);
      else {
        // Each tile keeps its checker tone with a deterministic ±3% variation:
        // ceramic reads as individual pieces instead of a printed grid.
        const base=(x+y)%2===0?theme.floorLight:theme.floorDark;
        const tone=shadeHex(base,.97+cellNoise(x,y,3)*.06);
        polygon(ctx,ps,tone,withAlpha(theme.floorLine,.75));
        // Light catches the top-left edge of every tile; the opposite edge recedes.
        ctx.strokeStyle="rgba(255,255,255,.22)";ctx.lineWidth=Math.max(.6,.9*z);
        ctx.beginPath();ctx.moveTo(ps[3]!.x,ps[3]!.y);ctx.lineTo(ps[0]!.x,ps[0]!.y);ctx.lineTo(ps[1]!.x,ps[1]!.y);ctx.stroke();
        if(cellNoise(x,y,11)>.86){
          // Occasional worn spot, well inside the tile.
          const c=iso({x:x+.3+cellNoise(x,y,5)*.4,y:y+.3+cellNoise(x,y,7)*.4},camera);
          ctx.fillStyle="rgba(90,78,66,.07)";ctx.beginPath();ctx.ellipse(c.x,c.y,9*z,4*z,0,0,Math.PI*2);ctx.fill();
        }
      }
      if(y===4 && x>0 && x<w-1) {
        const c=iso({x:x+0.5,y:y+0.5},camera);
        ctx.fillStyle="rgba(100,83,77,0.10)";
        ctx.fillRect(c.x-4,c.y-2,8,4);
      }
    }
    // Ambient occlusion where the floor meets the back and side walls.
    ctx.save();
    const nl=iso({x:minX,y:north},camera),nr=iso({x:w,y:north},camera),nf=iso({x:w,y:north+.75},camera);
    const northAo=ctx.createLinearGradient(nr.x,nr.y,nf.x,nf.y);
    northAo.addColorStop(0,"rgba(34,40,38,.30)");northAo.addColorStop(1,"rgba(34,40,38,0)");
    polygon(ctx,[nl,nr,nf,iso({x:minX,y:north+.75},camera)],northAo);
    const wl=iso({x:minX,y:north},camera),ws=iso({x:minX,y:south},camera),wi=iso({x:minX+.6,y:south},camera);
    const westAo=ctx.createLinearGradient(ws.x,ws.y,wi.x,wi.y);
    westAo.addColorStop(0,"rgba(34,40,38,.26)");westAo.addColorStop(1,"rgba(34,40,38,0)");
    polygon(ctx,[wl,ws,wi,iso({x:minX+.6,y:north},camera)],westAo);
    // Depth cue: the back of the room sits under the lamps, the front edge recedes.
    const depth=ctx.createLinearGradient(0,nl.y,0,frontLeft.y);
    depth.addColorStop(0,"rgba(255,244,214,.09)");depth.addColorStop(.55,"rgba(255,244,214,0)");depth.addColorStop(1,"rgba(18,26,34,.13)");
    polygon(ctx,[nl,nr,frontRight,frontLeft],depth);
    ctx.restore();
    // Tapete de circulação feito no mesmo plano da grade; sem geometria 3D.
    const rug=[
      iso({x:0.7,y:4.15},camera),iso({x:Math.min(w-0.5,5.1),y:4.15},camera),
      iso({x:Math.min(w-0.5,5.1),y:4.83},camera),iso({x:0.7,y:4.83},camera)
    ];
    polygon(ctx,rug,"rgba(66,105,106,0.19)","rgba(73,106,105,0.30)");
    // Woven border inside the runner, stitched to the same plane.
    polygon(ctx,[
      iso({x:0.8,y:4.23},camera),iso({x:Math.min(w-0.6,5.0),y:4.23},camera),
      iso({x:Math.min(w-0.6,5.0),y:4.75},camera),iso({x:0.8,y:4.75},camera)
    ],"rgba(0,0,0,0)","rgba(214,205,170,0.22)");
  }
