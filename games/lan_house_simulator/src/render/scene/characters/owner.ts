import type {GameState} from "../../../sim/types.js";
import {counterPoint,placedObject} from "../../../sim/layout.js";
import {copyingAnimationActive} from "../../../sim/discCopy.js";
import {printingAnimationActive} from "../../../sim/printService.js";
import {cosmeticAvailable} from "../../../sim/premiumCosmetics.js";
import {yearFromMinutes} from "../../../sim/historicalEconomy.js";
import type {Projection} from "../../isometric.js";
import {actorHitbox} from "../../actorArt.js";
import {drawActorSprite as drawActor} from "../../actorSprites.js";

  export function drawSceneOwner(ctx:CanvasRenderingContext2D,camera:Projection,t:number,s?:GameState):ReturnType<typeof actorHitbox> {
    const position=counterPoint(s,{x:1.45,y:1.05}),r=placedObject(s,"counter",{x:.9,y:1.42}).rotation??0;
    // Mesmo rosto e uniforme em todos os quadros; o balcão oclui parcialmente o corpo.
    const printAt=s?.printer?.lastPrintedMinute??-1,copyAt=s?.discCopier?.lastCopiedMinute??-1;
    // Prioridade ao serviço pago mais recente; ambos os equipamentos animam independente.
    const pose=s&&copyingAnimationActive(s)&&copyAt>=printAt?"copying":
      s&&printingAnimationActive(s)?"printing":
      s?.postmanDelivery?.phase==="handing"?"receiving":"idle";
    drawActor(ctx,camera,{...position,kind:"owner",id:0,time:t,pose,
      direction:(["south","west","north","east"] as const)[r],
      premiumCyber:!!s&&cosmeticAvailable("tony-cyber",yearFromMinutes(s.totalMinutes))});
    return actorHitbox(camera,position.x,position.y);
  }
