import type {GameState} from "../../sim/types.js";
import {cameraForGame,iso} from "../isometric.js";
import {wallEndpoints,canBuildWall,type WallSegment} from "../../sim/walls.js";
import {drawInteriorWall,drawInteriorDoor} from "./partitions.js";

/** Building overlays stay separate from wall collision and navigation policy. */
  export function drawDoorCandidates(ctx:CanvasRenderingContext2D,s:GameState,hovered:WallSegment|null):void{
    const cam=cameraForGame(s);
    ctx.save();
    for(const wall of s.interiorWalls??[]){
      const [a,b]=wallEndpoints(wall),point=iso({x:(a.x+b.x)/2,y:(a.y+b.y)/2},cam,40);
      ctx.fillStyle="#d2bc76";ctx.beginPath();
      ctx.arc(point.x,point.y,Math.max(2,6*cam.zoom),0,Math.PI*2);ctx.fill();
    }
    if(hovered)drawInteriorDoor(ctx,cam,hovered,true);
    ctx.restore();
  }
  export function drawWallPreview(ctx:CanvasRenderingContext2D,s:GameState,wall:WallSegment|null,demolish:boolean):void{
    if(!wall)return;
    const exists=(s.interiorWalls??[]).some(w=>w.axis===wall.axis&&w.x===wall.x&&w.y===wall.y);
    const isDoor=(s.interiorDoors??[]).some(w=>w.axis===wall.axis&&w.x===wall.x&&w.y===wall.y);
    if(demolish&&isDoor){drawInteriorDoor(ctx,cameraForGame(s),wall,true);return;}
    if(demolish&&!exists)return;
    drawInteriorWall(ctx,cameraForGame(s),wall,true,demolish?exists:canBuildWall(s,wall));
  }
