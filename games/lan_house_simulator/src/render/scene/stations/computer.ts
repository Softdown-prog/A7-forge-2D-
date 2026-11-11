import type {GameState,Point} from "../../../sim/types.js";
import type {PlacedPoint} from "../../../sim/layout.js";
import {objectCamera,type Projection} from "../../isometric.js";
import {drawRetroComputer,computerAppearance,screenGlow,monitorScreenQuad} from "../../retroComputer.js";
import {daylightAt,drawScreenGlow,drawMonitorEmission,monitorEmission} from "../../lighting.js";

/** One PC workstation, including its dynamic monitor light. */
  export function drawComputerDesk(ctx:CanvasRenderingContext2D,camera:Projection,p:Point,i:number,t:number,isOnline:boolean,s:GameState):void {
    const cam=objectCamera(camera,p,1.1,.7,(p as PlacedPoint).rotation);
    drawRetroComputer(ctx,cam,p,i,t,isOnline,s);
    // Screen light spills over the desk, keyboard and bezel; stronger after dusk.
    // Additive and painted after the cached sprite, so the raster stays reusable.
    const appearance=computerAppearance(s,i,t,isOnline),glow=screenGlow(appearance);
    if(glow&&ctx.globalAlpha===1){
      const light=daylightAt(s.totalMinutes),emission=monitorEmission(light.night,glow.strength);
      drawScreenGlow(ctx,cam,p.x+.45,p.y+.47,38,glow.color,emission.spill);
      // As the evening comes in the glass itself brightens against the darker room.
      const quad=monitorScreenQuad(cam,p,appearance.lcd);
      if(quad)drawMonitorEmission(ctx,quad,glow.color,light.night,glow.strength);
    }
  }
