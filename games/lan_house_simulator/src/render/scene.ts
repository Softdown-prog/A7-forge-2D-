import {merchandiseDisplay} from "./merchandiseDisplay.js";
import type {ProductId} from "../sim/merchandise.js";
import {editableObjects,objectCorners,layoutPlacementIssue,type EditableObject} from "../sim/editableObjects.js";
import type { Customer, GameState, Point } from "../sim/types.js";
import { pcCount, pcPosition, roomWidth, online } from "../sim/engine.js";
import {roomBounds,type RoomBounds} from "../sim/room.js";
import { cameraForGame, cuboid, iso, polygon, type Projection,objectCamera } from "./isometric.js";
import { drawRetroComputer } from "./retroComputer.js";
import {cosmeticAvailable} from "../sim/premiumCosmetics.js";
import {drawNeonOpenSign,neonOpenLit} from "./neonOpenArt.js";
import {drawVipAquarium} from "./aquariumArt.js";
import {drawPixelClock} from "./pixelClockArt.js";
import {yearFromMinutes} from "../sim/historicalEconomy.js";
import {furnitureSlots,occupiedFurnitureSlots,availablePlacementSlots,furnitureLocations,type FurnitureKind,type PlacementSlot} from "../sim/shop.js";
import { vendingMachines,placedObject,counterPoint,type PlacedPoint } from "../sim/layout.js";
import {drawVendingMachine,drawSnackShelf} from "./retailArt.js";
import {wallEndpoints,canBuildWall,type WallSegment} from "../sim/walls.js";
import {annexComputerSlots,availableAnnexComputers} from "../sim/stations.js";
import {BIN_SPOTS,binSpots,type RepairJob,type CleaningJob} from "../sim/services.js";
import type {ServiceAccessIssue} from "../sim/serviceAccess.js";
import type {PostmanDelivery} from "../sim/postmanDelivery.js";
import {drawRoomWindows} from "./scene/windows.js";
import {drawRoomFloor} from "./scene/floor.js";
import {drawRoomWalls} from "./scene/walls.js";
import {drawRoomDecor} from "./scene/decor.js";
import {drawInteriorWall,drawInteriorDoor} from "./scene/partitions.js";
import {drawGpuInstallMarkers} from "./scene/gpuInstallOverlay.js";
import {drawServiceAccessOverlay} from "./scene/serviceOverlay.js";
import {drawTrashBin} from "./scene/trashBin.js";
import {drawScenePostman} from "./scene/characters/postman.js";
import {drawSceneWorker} from "./scene/characters/worker.js";
import {drawSceneOwner} from "./scene/characters/owner.js";
import {drawSceneCustomer} from "./scene/characters/customer.js";
import {SCENE_THEME as theme} from "./theme.js";
import {ps1StationPoint,ps1PlayableDisc} from "../sim/ps1.js";
import {ps2StationPoint,ps2PlayableGame} from "../sim/ps2.js";
import {customerConsole,customerConsoleSeat} from "../sim/consoleLayout.js";
import {drawPs2Station} from "./ps2Art.js";
import {drawPs1Station} from "./ps1Art.js";
import {drawWallPoster,purchasedPosterKind,type PosterKind} from "./posterArt.js";
import {drawPremiumWallPoster,type PremiumPosterIndex} from "./premiumRoomArt.js";
import {drawCounter} from "./counterArt.js";
import {drawCounterPrinter} from "./printerArt.js";
import {printingAnimationActive} from "../sim/printService.js";
import {copyingAnimationActive} from "../sim/discCopy.js";
import {drawCounterDiscCopier} from "./discCopierArt.js";
import {drawNightMatchMarkers,drawNightMatchReactions,nightMatchReactions,type NightMatchReaction} from "./nightMatchMarkers.js";
import {drawNightPrizePresentation} from "./nightPrizePresentation.js";
import {drawNightReopening} from "./nightReopening.js";
import {SCENE_WIDTH,SCENE_HEIGHT,contextScale} from "./sceneSurface.js";
import {daylightAt,drawSceneLighting,drawScreenGlow,drawMonitorEmission,monitorEmission,drawVignette,type Daylight} from "./lighting.js";
import {computerAppearance,screenGlow,monitorScreenQuad} from "./retroComputer.js";

export class SceneRenderer {
  private heroHitbox = { x: 0, y: 0, width: 0, height: 0 };
  private background:HTMLCanvasElement|null=null;
  private backgroundKey="";
  constructor(private ctx: CanvasRenderingContext2D) {}
  hitOwner(x: number, y: number): boolean {
    const r = this.heroHitbox;
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  }
  drawLayoutOverlay(s:GameState,selected:string|null,draft:EditableObject|null,time:number):void{
    const cam=cameraForGame(s),ctx=this.ctx;
    ctx.save();
    for(const o of editableObjects(s)){
      const corners=o.surface==="wall"?[iso({x:o.x,y:o.y},cam,115),iso({x:o.x+(o.axis==="y"?0:o.w),y:o.y+(o.axis==="y"?o.w:0)},cam,115)]:objectCorners(o).map(p=>iso(p,cam,2));
      ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(corners.length>2)ctx.closePath();
      ctx.strokeStyle=o.id===selected?"#92d8ed":"rgba(239,190,91,.7)";ctx.lineWidth=o.id===selected?3:1.2;ctx.stroke();
    }
    if(draft){
      const original=editableObjects(s).find(o=>o.id===draft.id),changed=!original||original.x!==draft.x||original.y!==draft.y||original.rotation!==draft.rotation;
      ctx.globalAlpha=.65;
      if(changed){
      if(draft.kind==="pc")this.desk(cam,draft,draft.index!,time,online(s),s);
      else if(draft.kind==="counter")this.counter(cam,draft);
      else if(draft.kind==="shelf")this.shelf(cam,0,s.inventory.snacks,draft,merchandiseDisplay(s,"snacks"));
      else if(draft.kind==="soda"||draft.kind==="candy")this.machine(cam,draft.x,draft.y,draft.kind,time,s.inventory[draft.kind],draft.rotation,merchandiseDisplay(s,draft.kind));
      else if(draft.kind==="bin")this.trashBin(cam,draft,0);
      else if(draft.id.startsWith("built-poster:"))drawWallPoster(ctx,cam,{x:draft.x,y:draft.y,axis:draft.rotation===3?"y":"x",span:draft.span!,top:133,height:59},draft.posterKind!);
      else this.renderPurchasedFurniture(cam,draft.kind as FurnitureKind,draft.x,draft.y,draft.rotation,"city",draft.axis);
      }
      ctx.globalAlpha=1;
      const corners=objectCorners(draft).map(p=>iso(p,cam,3));
      polygon(ctx,corners,layoutPlacementIssue(s,draft)?"rgba(215,92,69,.15)":"rgba(121,223,152,.15)",layoutPlacementIssue(s,draft)?"#efad87":"#b9efa1");
    }
    ctx.restore();
  }
  draw(s: GameState, elapsedSeconds: number): void {
    const ctx = this.ctx, w=SCENE_WIDTH, h=SCENE_HEIGHT, roomW=roomWidth(s), camera=cameraForGame(s),bounds=roomBounds(s);
    const light=daylightAt(s.totalMinutes);
    this.drawBackground(s,camera,bounds,w,h);
    // Glass follows the simulated hour; frames and sills stay in the cached background.
    this.windowPanes(camera,bounds,light);
    type Entry={depth:number;paint:()=>void};
    const entries:Entry[]=[
      {depth:placedObject(s,"shelf",{x:bounds.minX+.23,y:2.92}).x+placedObject(s,"shelf",{x:bounds.minX+.23,y:2.92}).y+.55,paint:()=>this.shelf(camera,bounds.minX,s.inventory.snacks,placedObject(s,"shelf",{x:bounds.minX+.23,y:2.92}),merchandiseDisplay(s,"snacks"))},
      {depth:6,paint:()=>this.extraFurniture(camera,s)},
      ...vendingMachines(s).map(m=>({
        depth:m.x+m.y+0.25,
        paint:()=>this.machine(camera,m.x,m.y,m.kind,elapsedSeconds,s.inventory[m.kind],m.rotation,merchandiseDisplay(s,m.kind))
      })),
      {depth:counterPoint(s,{x:1.45,y:1.05}).x+counterPoint(s,{x:1.45,y:1.05}).y-.5,paint:()=>this.owner(camera,elapsedSeconds,s)},
      {depth:placedObject(s,"counter",{x:.9,y:1.42}).x+placedObject(s,"counter",{x:.9,y:1.42}).y+.8,paint:()=>{
        const counter=placedObject(s,"counter",{x:.9,y:1.42});
        this.counter(camera,counter);
        // Impressora decorativa paga: sobre o tampo, sem novo footprint ou colisão.
        if(s.printer)drawCounterPrinter(this.ctx,objectCamera(camera,counter,1.75,.72,counter.rotation),
          counter,printingAnimationActive(s),elapsedSeconds);
        // A copiadora tem footprint só visual, no outro extremo do tampo.
        if(s.discCopier)drawCounterDiscCopier(this.ctx,objectCamera(camera,counter,1.75,.72,counter.rotation),
          counter,copyingAnimationActive(s),elapsedSeconds);
      }},
      {depth:roomW+6,paint:()=>this.doorMarker(camera,s)}
    ];
    // Aquário VIP preso à parede norte, sem ocupar espaço de circulação.
    if(cosmeticAvailable("aquarium-rgb",yearFromMinutes(s.totalMinutes))){
      const point={x:Math.min(bounds.maxX-1.42,Math.max(bounds.minX+.8,3.15)),
        y:bounds.minY+.13};
      entries.push({depth:point.x+point.y+.25,
        paint:()=>drawVipAquarium(ctx,camera,point,elapsedSeconds)});
    }
    // Fixed north-wall mount, away from the aquarium; no new navigation obstacle.
    if(cosmeticAvailable("pixel-led-clock",yearFromMinutes(s.totalMinutes))){
      const point={x:Math.max(bounds.minX+.25,bounds.maxX-1.62),y:bounds.minY+.016};
      entries.push({depth:point.x+point.y+.2,
        paint:()=>drawPixelClock(ctx,camera,point,s.totalMinutes,elapsedSeconds)});
    }
    for (let i=0;i<pcCount(s);i++){
      const p=pcPosition(i,s);
      entries.push({depth:p.x+p.y,paint:()=>this.desk(camera,p,i,elapsedSeconds,online(s),s)});
    }
    for(let i=0;i<(s.ps1Stations?.length??0);i++){
      const point=ps1StationPoint(s,i);
      if(point){
       const inUse=s.customers.some(c=>c.ps1StationIndex===i&&c.stage==="using");
       entries.push({depth:point.x+point.y+.3,paint:()=>drawPs1Station(ctx,camera,point,
        s.ps1Stations![i]!.wear,inUse,elapsedSeconds,ps1PlayableDisc(s,i),
        s.ps1Stations![i]!.secondSeat===true)});
      }
    }
    for(let i=0;i<(s.ps2Stations?.length??0);i++){
      const point=ps2StationPoint(s,i);if(!point)continue;
      const st=s.ps2Stations![i]!,active=s.customers.some(c=>c.ps2StationIndex===i&&c.stage==="using");
      entries.push({depth:point.x+point.y+.3,paint:()=>drawPs2Station(ctx,camera,point,
       st.wear,active,elapsedSeconds,ps2PlayableGame(s,i),!!st.secondSeat,!!st.poweredOff)});
    }
    for(let i=0;i<BIN_SPOTS.length;i++){
      const p=binSpots(s)[i]!;
      entries.push({depth:p.x+p.y+.1,paint:()=>this.trashBin(camera,p,s.binFill?.[i]??0)});
    }
    for(const job of s.repairJobs??[])entries.push({depth:job.x+job.y+.9,paint:()=>this.worker(camera,job,elapsedSeconds,"technician",job.progress/job.duration,s)});
    if(s.cleaningJob){const j=s.cleaningJob;entries.push({depth:j.x+j.y+.9,paint:()=>this.worker(camera,j,elapsedSeconds,"cleaner",j.progress/9,s)});}
    if(s.postmanDelivery){
      const postal=s.postmanDelivery;
      entries.push({depth:postal.x+postal.y+.09,
       paint:()=>this.postman(camera,postal,elapsedSeconds)});
    }
    for(const wall of s.interiorWalls??[])
      entries.push({depth:wall.x+wall.y+0.5,paint:()=>this.drawInteriorWall(camera,wall)});
    for(const door of s.interiorDoors??[])
      entries.push({depth:door.x+door.y+0.5,paint:()=>this.drawInteriorDoor(camera,door)});
    const matchReactions=nightMatchReactions(s);
    for (const c of s.customers) {
      const seated=c.stage==="sitting" || c.stage==="using" || c.stage==="standing";
      const location=seated&&customerConsole(c)
        ?customerConsoleSeat(s,c)??c:
          seated&&c.pcIndex!==null?pcPosition(c.pcIndex,s):c;
      entries.push({depth:location.x+location.y+(seated?1.16:0.08),paint:()=>this.customer(camera,c,elapsedSeconds,seated,s,
        matchReactions.find(reaction=>reaction.playerId===c.id))});
    }
    entries.sort((a,b)=>a.depth-b.depth);
    for (const e of entries) e.paint();
    // Lamps, daylight and the evening tint sit over the room, under every label.
    drawSceneLighting(ctx,camera,s,elapsedSeconds,w,h);
    this.drawGpuInstallMarkers(s,camera,elapsedSeconds);
    this.sign(camera,roomW);
    // Indicadores dos jogadores reais por cima do cenário e atrás do HUD geral.
    drawNightMatchMarkers(ctx,s,camera);
    drawNightMatchReactions(ctx,s,camera,elapsedSeconds,matchReactions);
    drawNightPrizePresentation(ctx,s,camera,elapsedSeconds);
    drawNightReopening(ctx,s,elapsedSeconds);
    this.hudInside(ctx,s);
  }
  /** Marcador flutuante, acima do PC real, usando o estado salvo da simulação. */
  private drawGpuInstallMarkers(s:GameState,camera:Projection,elapsedSeconds:number):void{
    drawGpuInstallMarkers(this.ctx,s,camera,elapsedSeconds);
  }
  /** Modo de inspeção acionado na aba Serviços, sem recalcular caminhos por frame.
   * Destaca o destino inacessível, não afirma identificar a parede culpada. */
  drawServiceAccessOverlay(s:GameState,issues:readonly ServiceAccessIssue[],time:number):void{
    drawServiceAccessOverlay(this.ctx,s,issues,time);
  }
  /** One local bitmap for the unchanged room: shadow, floor, outside walls and
   * fixed decoration. Animated objects keep their original depth-sorted paint. */
  private drawBackground(s:GameState,camera:Projection,bounds:RoomBounds,w:number,h:number):void{
    const live=this.ctx,scale=contextScale(live)??1;
    const key=JSON.stringify([w,h,scale,camera,bounds,s.furniture?.poster??0,
      s.furniturePlacements?.filter(p=>p.kind==="poster")??[],s.objectPlacements?.filter(p=>p.id.startsWith("built-poster:"))??[],s.removedBuiltPosters??[],
      cosmeticAvailable("arcade-checker-floor",yearFromMinutes(s.totalMinutes)),
      cosmeticAvailable("exclusive-arcade-posters",yearFromMinutes(s.totalMinutes))]);
    if(typeof document!=="undefined"){
      if(!this.background)this.background=document.createElement("canvas");
      const buffer=this.background.getContext("2d");
      if(buffer){
        if(key!==this.backgroundKey){
          // The bitmap matches the live backing store, so the blit is pixel-exact.
          const width=Math.round(w*scale),height=Math.round(h*scale);
          if(this.background.width!==width||this.background.height!==height){this.background.width=width;this.background.height=height;}
          buffer.setTransform(scale,0,0,scale,0,0);
          this.ctx=buffer;
          try{this.paintBackground(s,camera,bounds,w,h);this.backgroundKey=key;}
          finally{this.ctx=live;}
        }
        live.drawImage(this.background,0,0,this.background.width/scale,this.background.height/scale);return;
      }
    }
    this.paintBackground(s,camera,bounds,w,h);
  }
  private paintBackground(s:GameState,camera:Projection,bounds:RoomBounds,w:number,h:number):void{
    const ctx=this.ctx,sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,theme.backgroundTop);sky.addColorStop(1,theme.backgroundBottom);
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    // Faint diagonal sheen keeps the empty backdrop from reading as a flat fill.
    const sheen=ctx.createLinearGradient(0,0,w,h);
    sheen.addColorStop(0,"rgba(255,255,255,.035)");sheen.addColorStop(.5,"rgba(255,255,255,0)");sheen.addColorStop(1,"rgba(0,0,0,.08)");
    ctx.fillStyle=sheen;ctx.fillRect(0,0,w,h);
    drawVignette(ctx,w,h,.42);
    this.floor(camera,bounds,cosmeticAvailable("arcade-checker-floor",yearFromMinutes(s.totalMinutes)));
    this.walls(camera,bounds);this.decor(camera,bounds,s);this.extraPosters(camera,s);
  }
  /** Paredes isométricas procedurais, respeitando a ordem de profundidade dos objetos. */
  private drawInteriorWall(camera:Projection,wall:WallSegment,preview=false,allowed=true):void{
    drawInteriorWall(this.ctx,camera,wall,preview,allowed);
  }
  private drawInteriorDoor(camera:Projection,door:WallSegment,preview=false):void{
    drawInteriorDoor(this.ctx,camera,door,preview);
  }
  /** Ícones e fantasma dos novos PCs, usando o mesmo centro de clique da UI. */
  drawAnnexPcCandidates(s:GameState,hovered:string|null):void{
    const cam=cameraForGame(s),available=new Set(availableAnnexComputers(s).map(x=>x.id));
    this.ctx.save();
    for(const slot of annexComputerSlots(s)){
      const p=iso({x:slot.position.x+0.35,y:slot.position.y+0.55},cam,4);
      const free=available.has(slot.id),selected=hovered===slot.id;
      this.ctx.beginPath();this.ctx.ellipse(p.x,p.y,19*cam.zoom,11*cam.zoom,0,0,Math.PI*2);
      this.ctx.fillStyle=!free?"rgba(183,75,70,.78)":selected?"rgba(114,233,162,.98)":"rgba(73,160,130,.80)";
      this.ctx.fill();
      this.ctx.strokeStyle="#f6efdc";this.ctx.lineWidth=selected?3:1.3;this.ctx.stroke();
      if(selected&&free){this.ctx.globalAlpha=.66;
        drawRetroComputer(this.ctx,cam,slot.position,pcCount(s),1,true,s);
        this.ctx.globalAlpha=1;
      }
    }
    this.ctx.restore();
  }
  drawDoorCandidates(s:GameState,hovered:WallSegment|null):void{
    const cam=cameraForGame(s);
    this.ctx.save();
    for(const wall of s.interiorWalls??[]){
      const [a,b]=wallEndpoints(wall),point=iso({x:(a.x+b.x)/2,y:(a.y+b.y)/2},cam,40);
      this.ctx.fillStyle="#d2bc76";this.ctx.beginPath();
      this.ctx.arc(point.x,point.y,Math.max(2,6*cam.zoom),0,Math.PI*2);this.ctx.fill();
    }
    if(hovered)this.drawInteriorDoor(cam,hovered,true);
    this.ctx.restore();
  }
  drawWallPreview(s:GameState,wall:WallSegment|null,demolish:boolean):void{
    if(!wall)return;
    const exists=(s.interiorWalls??[]).some(w=>w.axis===wall.axis&&w.x===wall.x&&w.y===wall.y);
    const isDoor=(s.interiorDoors??[]).some(w=>w.axis===wall.axis&&w.x===wall.x&&w.y===wall.y);
    if(demolish&&isDoor){this.drawInteriorDoor(cameraForGame(s),wall,true);return;}
    if(demolish&&!exists)return;
    this.drawInteriorWall(cameraForGame(s),wall,true,demolish?exists:canBuildWall(s,wall));
  }
  /** The ghost shares the exact geometry with purchased furniture. */
  drawPlacementCandidates(s:GameState,kind:FurnitureKind,hoveredId:string|null,rotation:0|1|2|3=0):void{
    const camera=cameraForGame(s);
    const occupied=occupiedFurnitureSlots(s),available=new Set(availablePlacementSlots(s,kind).map(p=>p.id));
    const surface=kind==="poster"?"wall":"floor";
    const ctx=this.ctx;
    ctx.save();
    for(const slot of furnitureSlots(s)){
      if(slot.surface!==surface)continue;
      const at=this.slotAnchor(camera,slot),blocked=occupied.has(slot.id)||!available.has(slot.id);
      const hover=slot.id===hoveredId;
      ctx.beginPath();ctx.ellipse(at.x,at.y,16*camera.zoom,9*camera.zoom,0,0,Math.PI*2);
      ctx.fillStyle=blocked?"rgba(185,62,57,0.78)":hover?"rgba(113,233,165,0.92)":"rgba(81,182,137,0.73)";
      ctx.fill();ctx.strokeStyle=blocked?"#ffd2bd":"#edffe9";ctx.lineWidth=hover?3:1.5;ctx.stroke();
      if(hover&&!blocked){ctx.save();ctx.globalAlpha=0.73;this.renderPurchasedFurniture(camera,kind,slot.x,slot.y,rotation,"city",slot.axis);ctx.restore();}
    }
    ctx.restore();
  }
  /** Modo de reorganização: proprietário escolhe primeiro um móvel e depois um encaixe livre. */
  drawRelocationCandidates(s:GameState,fromSlot:string|null,hoveredId:string|null):void{
    const camera=cameraForGame(s),ctx=this.ctx;
    const items=furnitureLocations(s),moving=items.find(p=>p.slotId===fromSlot);
    const occupied=occupiedFurnitureSlots(s);
    ctx.save();
    for(const slot of furnitureSlots(s)){
      if(moving && ((moving.kind==="poster")!==(slot.surface==="wall")))continue;
      const owned=items.some(p=>p.slotId===slot.id);
      if(!moving&&!owned)continue;
      const at=this.slotAnchor(camera,slot);
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
        this.renderPurchasedFurniture(camera,moving.kind,slot.x,slot.y,moving.rotation??0);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  private slotAnchor(camera:Projection,slot:PlacementSlot):Point{
    return slot.surface==="wall"
      ?iso({x:slot.x+(slot.axis==="y"?0:.33),y:slot.y+(slot.axis==="y"?.33:0)},camera,137)
      :iso({x:slot.x+0.25,y:slot.y+0.20},camera,9);
  }
  private renderPurchasedFurniture(camera:Projection,kind:FurnitureKind,x:number,y:number,rotation:0|1|2|3=0,posterKind:PosterKind="city",axis:"x"|"y"="x",premiumIndex?:PremiumPosterIndex):void{
    if(kind==="poster"){
      const placement={x,y,axis,span:.65,top:156,height:39};
      if(premiumIndex!==undefined)drawPremiumWallPoster(this.ctx,camera,placement,premiumIndex);
      else drawWallPoster(this.ctx,camera,placement,posterKind);
    }else if(kind==="plant"){
      cuboid(this.ctx,camera,x,y,0.32,0.32,22,["#a87553","#805344","#915f4c"]);
      const center=iso({x:x+0.16,y:y+0.16},camera,42);
      this.ctx.fillStyle="#578d68";this.ctx.beginPath();
      this.ctx.ellipse(center.x,center.y,13*camera.zoom,15*camera.zoom,0,0,Math.PI*2);this.ctx.fill();
    }else if(kind==="table"){
      cuboid(this.ctx,camera,x,y,rotation%2===0?0.55:0.4,rotation%2===0?0.4:0.55,23,["#c49a76","#8d6754","#a07b60"]);
    }
    if(kind!=="poster"){
      const width=kind==="table"?(rotation%2===0?0.55:0.4):0.32;
      const depth=kind==="table"?(rotation%2===0?0.4:0.55):0.32;
      const direction=[[0,1],[1,0],[0,-1],[-1,0]][rotation]!;
      const marker=iso({x:x+width/2+direction[0]!*width*.43,
                        y:y+depth/2+direction[1]!*depth*.43},camera,kind==="plant"?20:19);
      this.ctx.fillStyle="#f5cd91";this.ctx.beginPath();
      this.ctx.ellipse(marker.x,marker.y,3.5*camera.zoom,2.5*camera.zoom,0,0,Math.PI*2);this.ctx.fill();
    }
  }
  private extraPosters(camera:Projection,s:GameState):void{
    const premium=cosmeticAvailable("exclusive-arcade-posters",yearFromMinutes(s.totalMinutes));
    const positioned=(s.furniturePlacements??[]).filter(p=>p.kind==="poster");
    for(let i=0;i<Math.min(2,Math.max(0,(s.furniture?.poster??0)-positioned.length));i++){
      const x=2.1+i*2.25;
      const y=roomBounds(s).minY+0.01;
      this.renderPurchasedFurniture(camera,"poster",x,y,0,purchasedPosterKind(i),"x",premium?(i%3 as PremiumPosterIndex):undefined);
    }
    for(const [index,placed] of positioned.entries()){
      const slot=furnitureSlots(s).find(v=>v.id===placed.slotId&&v.surface==="wall");
      if(slot)this.renderPurchasedFurniture(camera,"poster",slot.x,slot.y,0,purchasedPosterKind(index),slot.axis,premium?(index%3 as PremiumPosterIndex):undefined);
    }
  }
    /* Saved placement coordinates are always resolved from vetted slots. */
  private extraFurniture(camera:Projection,s:GameState):void{
    const positioned=s.furniturePlacements??[];
    const legacyPlants=Math.max(0,(s.furniture?.plant??0)-positioned.filter(p=>p.kind==="plant").length);
    for(let i=0;i<Math.min(2,legacyPlants);i++){
      const x=i===0?0.6:roomWidth(s)-0.8,y=i===0?5.3:3.6;
      cuboid(this.ctx,camera,x,y,0.32,0.32,22,["#a87553","#805344","#915f4c"]);
      const center=iso({x:x+0.16,y:y+0.16},camera,42);
      this.ctx.fillStyle="#578d68";this.ctx.beginPath();
      this.ctx.ellipse(center.x,center.y,13*camera.zoom,15*camera.zoom,0,0,Math.PI*2);this.ctx.fill();
    }
    if((s.furniture?.table??0)>positioned.filter(p=>p.kind==="table").length){
      cuboid(this.ctx,camera,0.75,4.12,0.55,0.4,23,["#c49a76","#8d6754","#a07b60"]);
    }
    for(const placed of positioned){
      if(placed.kind==="poster")continue;
      const slot=furnitureSlots(s).find(v=>v.id===placed.slotId&&v.surface==="floor");
      if(slot)this.renderPurchasedFurniture(camera,placed.kind,slot.x,slot.y,placed.rotation??0);
    }
  }
  private floor(camera:Projection,bounds:RoomBounds,premium=false):void {
    drawRoomFloor(this.ctx,camera,bounds,premium);
  }
  private walls(camera:Projection,bounds:RoomBounds):void {
    drawRoomWalls(this.ctx,camera,bounds);
  }
  /** Glass tint per simulated hour: sky by day, amber at sunset, dark at night.
   * Mullions and the diagonal sheen are repainted on top each frame. */
  /** The glass only changes with the simulated minute, so it is rasterized once per light state and zoom
   * instead of being repainted (gradients, reflections, mullions) on every frame. */
  private windowPanes(camera:Projection,bounds:RoomBounds,light:Daylight):void{
    drawRoomWindows(this.ctx,camera,bounds,light);
  }
  private decor(camera:Projection,bounds:RoomBounds,s:GameState):void {
    drawRoomDecor(this.ctx,camera,bounds,s);
  }
  private counter(camera:Projection,p:PlacedPoint={x:.9,y:1.42}):void {
    drawCounter(this.ctx,objectCamera(camera,p,1.75,.72,p.rotation),p);
  }
  private shelf(camera:Projection,minX=0,stock=20,p:PlacedPoint={x:minX+.23,y:2.92},display?:readonly ProductId[]):void {
    drawSnackShelf(this.ctx,objectCamera(camera,p,.46,1.22,p.rotation),minX,stock,true,p,display);
  }
  private machine(camera:Projection,x:number,y:number,kind:"soda"|"candy",t:number,stock?:number,rotation:0|1|2|3=0,display?:readonly ProductId[]):void {
    drawVendingMachine(this.ctx,objectCamera(camera,{x,y},.66,.59,rotation),{x,y},kind,t,stock,true,display);
  }
  private trashBin(camera:Projection,p:Point,fill:number):void{
    drawTrashBin(this.ctx,camera,p,fill);
  }
  /** Visiting postman: same actor rig, procedural uniform, visible delivery animation. */
  private postman(camera:Projection,job:PostmanDelivery,t:number):void{
    drawScenePostman(this.ctx,camera,job,t);
  }
  /** Trabalhadores agora usam EXATAMENTE a geometria, câmera e caminhada dos clientes. */
  private worker(camera:Projection,job:RepairJob|CleaningJob,time:number,
    kind:"technician"|"cleaner",progress:number,s:GameState):void{
    drawSceneWorker(this.ctx,camera,job,time,kind,progress,s);
  }
  private desk(camera:Projection,p:Point,i:number,t:number,isOnline:boolean,s:GameState):void {
    const cam=objectCamera(camera,p,1.1,.7,(p as PlacedPoint).rotation);
    drawRetroComputer(this.ctx,cam,p,i,t,isOnline,s);
    // Screen light spills over the desk, keyboard and bezel; stronger after dusk.
    // Additive and painted after the cached sprite, so the raster stays reusable.
    const appearance=computerAppearance(s,i,t,isOnline),glow=screenGlow(appearance);
    if(glow&&this.ctx.globalAlpha===1){
      const light=daylightAt(s.totalMinutes),emission=monitorEmission(light.night,glow.strength);
      drawScreenGlow(this.ctx,cam,p.x+.45,p.y+.47,38,glow.color,emission.spill);
      // As the evening comes in the glass itself brightens against the darker room.
      const quad=monitorScreenQuad(cam,p,appearance.lcd);
      if(quad)drawMonitorEmission(this.ctx,quad,glow.color,light.night,glow.strength);
    }
  }
  private owner(camera:Projection,t:number,s?:GameState):void {
    this.heroHitbox=drawSceneOwner(this.ctx,camera,t,s);
  }
  private customer(camera:Projection,c:Customer,t:number,seated:boolean,s:GameState,
    reaction?:NightMatchReaction):void {
    drawSceneCustomer(this.ctx,camera,c,t,seated,s,reaction);
  }
  private doorMarker(camera:Projection,s:GameState):void {
    // Somente limiar de entrada dentro do salão; não há rua, fachada externa ou chuva.
    const x=7.5,y=6,ctx=this.ctx,z=camera.zoom;
    // Doormat just inside the threshold: ribbed fibre, worn centre, no exterior.
    polygon(ctx,[
      iso({x:x-0.62,y:y-0.78},camera,.4),iso({x:x+0.62,y:y-0.78},camera,.4),
      iso({x:x+0.62,y:y-0.28},camera,.4),iso({x:x-0.62,y:y-0.28},camera,.4)
    ],"#6f5a48","#4e3f33");
    ctx.save();ctx.strokeStyle="rgba(214,190,150,.35)";ctx.lineWidth=Math.max(.7,1*z);
    for(let i=1;i<7;i++){const a=iso({x:x-0.62,y:y-0.78+i*.07},camera,.5),b=iso({x:x+0.62,y:y-0.78+i*.07},camera,.5);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    ctx.restore();
    polygon(ctx,[
      iso({x:x-0.45,y:y-0.24},camera),iso({x:x+0.45,y:y-0.24},camera),
      iso({x:x+0.45,y},camera),iso({x:x-0.45,y},camera)
    ],"#D8B98D","#856F62");
    const left=iso({x:x-0.45,y},camera),right=iso({x:x+0.45,y},camera);
    ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);
    ctx.strokeStyle="#FFF0BC";ctx.lineWidth=4*camera.zoom;ctx.stroke();
    const mid=iso({x,y:y-0.45},camera);
    polygon(ctx,[{x:mid.x-10,y:mid.y+5},{x:mid.x+10,y:mid.y+5},
      {x:mid.x,y:mid.y-6}],"#F1D49B");
    // Placa premium montada sobre a entrada: nenhuma colisão ou espaço extra.
    if(cosmeticAvailable("neon-open-sign",yearFromMinutes(s.totalMinutes)))
      drawNeonOpenSign(ctx,camera,{x,y:y-.37},s.totalMinutes*.1,neonOpenLit(s.totalMinutes));
  }
  private sign(camera:Projection,w:number):void {
    // Plaqueta de marca na área vazia do fundo: não cobre quadros nem clientes.
    const ctx=this.ctx,x=28,y=28,label=w>8?"SALÃO AMPLIADO":"PRIMEIRAS CONEXÕES";
    ctx.save();
    // Terminal plate: soft drop shadow, rounded corners, brushed gradient and a bevel.
    // Soft drop shadow from stacked translucent plates: shadowBlur is avoided on purpose,
    // this plate is repainted every frame and blur is costly on low-end Android.
    for(const [grow,drop,alpha] of [[5,6,.07],[3,5,.09],[1,3,.14]] as const){
      ctx.fillStyle="rgba(0,0,0,"+alpha+")";ctx.beginPath();ctx.roundRect(x-grow,y+drop-grow,210+grow*2,50+grow*2,6+grow);ctx.fill();
    }
    const plate=ctx.createLinearGradient(x,y,x,y+50);
    plate.addColorStop(0,"rgba(34,60,54,0.94)");plate.addColorStop(1,"rgba(22,40,37,0.94)");
    ctx.fillStyle=plate;ctx.beginPath();ctx.roundRect(x,y,210,50,6);ctx.fill();
    ctx.strokeStyle="#5e7b52";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x+.5,y+.5,209,49,6);ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.08)";ctx.beginPath();ctx.moveTo(x+6,y+1.5);ctx.lineTo(x+204,y+1.5);ctx.stroke();
    ctx.fillStyle=theme.mint;ctx.fillRect(x+13,y+14,9,9);
    ctx.fillStyle=theme.amber;ctx.fillRect(x+20,y+22,4,4);
    ctx.fillStyle="rgba(185,215,163,.35)";ctx.fillRect(x+13,y+42,184,1);
    ctx.font="bold 17px Trebuchet MS, sans-serif";ctx.fillStyle=theme.paper;
    ctx.fillText("LAN HOUSE",x+35,y+24);
    ctx.font="bold 9px Courier New, monospace";ctx.fillStyle=theme.mint;
    ctx.fillText(label,x+35,y+39);
    ctx.restore();
    void camera;
  }
  private hudInside(ctx:CanvasRenderingContext2D,s:GameState):void {
    ctx.save();
    for(const [grow,drop,alpha] of [[4,4,.07],[2,3,.1]] as const){
      ctx.fillStyle="rgba(0,0,0,"+alpha+")";ctx.beginPath();ctx.roundRect(18-grow,558+drop-grow,310+grow*2,29+grow*2,5+grow);ctx.fill();
    }
    ctx.fillStyle="rgba(25,46,42,.9)";ctx.beginPath();ctx.roundRect(18,558,310,29,5);ctx.fill();
    ctx.strokeStyle="rgba(94,123,82,.8)";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(18.5,558.5,309,28,5);ctx.stroke();
    ctx.fillStyle=theme.mint;ctx.fillRect(29,571,5,5);
    ctx.fillStyle="rgba(185,215,163,.35)";ctx.fillRect(28,570,7,7);ctx.fillStyle=theme.mint;ctx.fillRect(29,571,5,5);
    ctx.fillStyle=theme.paper;ctx.font="bold 10px Courier New, monospace";
    ctx.fillText(pcCount(s)+" ESTAÇÕES  /  "+s.customers.length+" CLIENTES",44,576);ctx.restore();
  }
}
