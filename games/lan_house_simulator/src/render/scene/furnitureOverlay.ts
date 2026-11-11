import type {GameState,Point} from "../../sim/types.js";
import {cameraForGame,iso,type Projection} from "../isometric.js";
import {furnitureSlots,occupiedFurnitureSlots,type FurnitureKind,type PlacementSlot} from "../../sim/furnitureLayout.js";
import {availablePlacementSlots,furnitureLocations} from "../../sim/shop.js";
import {drawPurchasedFurniture} from "./furnitureArt.js";
/** Edit-mode previews draw the same geometry as purchased furniture. */
  /** The ghost shares the exact geometry with purchased furniture. */
  export function drawPlacementCandidates(ctx:CanvasRenderingContext2D,s:GameState,kind:FurnitureKind,hoveredId:string|null,rotation:0|1|2|3=0):void{
    const camera=cameraForGame(s);
    const occupied=occupiedFurnitureSlots(s),available=new Set(availablePlacementSlots(s,kind).map(p=>p.id));
    const surface=kind==="poster"?"wall":"floor";
    
    ctx.save();
    for(const slot of furnitureSlots(s)){
      if(slot.surface!==surface)continue;
      const at=slotAnchor(camera,slot),blocked=occupied.has(slot.id)||!available.has(slot.id);
      const hover=slot.id===hoveredId;
      ctx.beginPath();ctx.ellipse(at.x,at.y,16*camera.zoom,9*camera.zoom,0,0,Math.PI*2);
      ctx.fillStyle=blocked?"rgba(185,62,57,0.78)":hover?"rgba(113,233,165,0.92)":"rgba(81,182,137,0.73)";
      ctx.fill();ctx.strokeStyle=blocked?"#ffd2bd":"#edffe9";ctx.lineWidth=hover?3:1.5;ctx.stroke();
      if(hover&&!blocked){ctx.save();ctx.globalAlpha=0.73;drawPurchasedFurniture(ctx,camera,kind,slot.x,slot.y,rotation,"city",slot.axis);ctx.restore();}
    }
    ctx.restore();
  }
  /** Modo de reorganização: proprietário escolhe primeiro um móvel e depois um encaixe livre. */
  export function drawRelocationCandidates(ctx:CanvasRenderingContext2D,s:GameState,fromSlot:string|null,hoveredId:string|null):void{
    const camera=cameraForGame(s);
    const items=furnitureLocations(s),moving=items.find(p=>p.slotId===fromSlot);
    const occupied=occupiedFurnitureSlots(s);
    ctx.save();
    for(const slot of furnitureSlots(s)){
      if(moving && ((moving.kind==="poster")!==(slot.surface==="wall")))continue;
      const owned=items.some(p=>p.slotId===slot.id);
      if(!moving&&!owned)continue;
      const at=slotAnchor(camera,slot);
      const selected=slot.id===fromSlot,hovered=slot.id===hoveredId;
      ctx.beginPath();
      ctx.ellipse(at.x,at.y,18*camera.zoom,10*camera.zoom,0,0,Math.PI*2);
      ctx.fillStyle=selected?"rgba(94,197,255,0.93)":owned
        ?(moving?"rgba(183,68,64,0.78)":"rgba(245,194,98,0.88)")
        :hovered?"rgba(111,231,172,0.96)":"rgba(91,188,144,0.75)";
      ctx.fill();
      ctx.strokeStyle=selected?"#dbf7ff":owned&&moving?"#ffe0c4":"#fff4d9";
      ctx.lineWidth=hovered||selected?3:1.5;ctx.stroke();
      if(moving && hovered&&!occupied.has(slot.id)){
        ctx.save();ctx.globalAlpha=0.76;
        drawPurchasedFurniture(ctx,camera,moving.kind,slot.x,slot.y,moving.rotation??0);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  function slotAnchor(camera:Projection,slot:PlacementSlot):Point{
    return slot.surface==="wall"
      ?iso({x:slot.x+(slot.axis==="y"?0:.33),y:slot.y+(slot.axis==="y"?.33:0)},camera,137)
      :iso({x:slot.x+0.25,y:slot.y+0.20},camera,9);
  }
