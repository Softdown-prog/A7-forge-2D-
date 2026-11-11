import {merchandiseDisplay} from "./merchandiseDisplay.js";
import type {ProductId} from "../sim/merchandise.js";
import {editableObjects,objectCorners,layoutPlacementIssue,type EditableObject} from "../sim/editableObjects.js";
import type { Customer, GameState, Point } from "../sim/types.js";
import { pcCount, pcPosition, roomWidth, online } from "../sim/engine.js";
import {roomBounds,type RoomBounds} from "../sim/room.js";
import { cameraForGame, iso, polygon, type Projection,objectCamera } from "./isometric.js";
import {cosmeticAvailable} from "../sim/premiumCosmetics.js";
import {drawVipAquarium} from "./aquariumArt.js";
import {drawPixelClock} from "./pixelClockArt.js";
import {yearFromMinutes} from "../sim/historicalEconomy.js";
import type {FurnitureKind} from "../sim/shop.js";
import { vendingMachines,placedObject,counterPoint,type PlacedPoint } from "../sim/layout.js";
import {drawVendingMachine,drawSnackShelf} from "./retailArt.js";
import type {WallSegment} from "../sim/walls.js";
import {BIN_SPOTS,binSpots,type RepairJob,type CleaningJob} from "../sim/services.js";
import type {ServiceAccessIssue} from "../sim/serviceAccess.js";
import type {PostmanDelivery} from "../sim/postmanDelivery.js";
import {drawRoomWindows} from "./scene/windows.js";
import {RoomBackgroundCache} from "./scene/background.js";
import {drawComputerDesk} from "./scene/stations/computer.js";
import {drawCounterSurface,drawSceneCounter} from "./scene/stations/counter.js";
import {drawAnnexPcCandidates} from "./scene/annexPcOverlay.js";
import {drawDoorCandidates,drawWallPreview} from "./scene/wallOverlay.js";
import {drawEntryMarker} from "./scene/entryMarker.js";
import {drawRoomSign} from "./scene/roomSign.js";
import {drawRoomStatus} from "./scene/roomStatus.js";
import {drawPurchasedFurniture,drawExtraFurniture} from "./scene/furnitureArt.js";
import {drawPlacementCandidates,drawRelocationCandidates} from "./scene/furnitureOverlay.js";
import {drawInteriorWall,drawInteriorDoor} from "./scene/partitions.js";
import {drawGpuInstallMarkers} from "./scene/gpuInstallOverlay.js";
import {drawServiceAccessOverlay} from "./scene/serviceOverlay.js";
import {drawTrashBin} from "./scene/trashBin.js";
import {drawScenePostman} from "./scene/characters/postman.js";
import {drawSceneWorker} from "./scene/characters/worker.js";
import {drawSceneOwner} from "./scene/characters/owner.js";
import {drawSceneCustomer} from "./scene/characters/customer.js";
import {ps1StationPoint,ps1PlayableDisc} from "../sim/ps1.js";
import {ps2StationPoint,ps2PlayableGame} from "../sim/ps2.js";
import {customerConsole,customerConsoleSeat} from "../sim/consoleLayout.js";
import {drawPs2Station} from "./ps2Art.js";
import {drawPs1Station} from "./ps1Art.js";
import {drawWallPoster} from "./posterArt.js";
import {drawNightMatchMarkers,drawNightMatchReactions,nightMatchReactions,type NightMatchReaction} from "./nightMatchMarkers.js";
import {drawNightPrizePresentation} from "./nightPrizePresentation.js";
import {drawNightReopening} from "./nightReopening.js";
import {SCENE_WIDTH,SCENE_HEIGHT} from "./sceneSurface.js";
import {daylightAt,drawSceneLighting,type Daylight} from "./lighting.js";

export class SceneRenderer {
  private heroHitbox = { x: 0, y: 0, width: 0, height: 0 };
  private readonly background=new RoomBackgroundCache();
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
      if(draft.kind==="pc")drawComputerDesk(ctx,cam,draft,draft.index!,time,online(s),s);
      else if(draft.kind==="counter")drawCounterSurface(ctx,cam,draft);
      else if(draft.kind==="shelf")this.shelf(cam,0,s.inventory.snacks,draft,merchandiseDisplay(s,"snacks"));
      else if(draft.kind==="soda"||draft.kind==="candy")this.machine(cam,draft.x,draft.y,draft.kind,time,s.inventory[draft.kind],draft.rotation,merchandiseDisplay(s,draft.kind));
      else if(draft.kind==="bin")this.trashBin(cam,draft,0);
      else if(draft.id.startsWith("built-poster:"))drawWallPoster(ctx,cam,{x:draft.x,y:draft.y,axis:draft.rotation===3?"y":"x",span:draft.span!,top:133,height:59},draft.posterKind!);
      else drawPurchasedFurniture(this.ctx,cam,draft.kind as FurnitureKind,draft.x,draft.y,draft.rotation,"city",draft.axis);
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
    this.background.draw(ctx,s,camera,bounds,w,h);
    // Glass follows the simulated hour; frames and sills stay in the cached background.
    this.windowPanes(camera,bounds,light);
    type Entry={depth:number;paint:()=>void};
    const entries:Entry[]=[
      {depth:placedObject(s,"shelf",{x:bounds.minX+.23,y:2.92}).x+placedObject(s,"shelf",{x:bounds.minX+.23,y:2.92}).y+.55,paint:()=>this.shelf(camera,bounds.minX,s.inventory.snacks,placedObject(s,"shelf",{x:bounds.minX+.23,y:2.92}),merchandiseDisplay(s,"snacks"))},
      {depth:6,paint:()=>drawExtraFurniture(this.ctx,camera,s)},
      ...vendingMachines(s).map(m=>({
        depth:m.x+m.y+0.25,
        paint:()=>this.machine(camera,m.x,m.y,m.kind,elapsedSeconds,s.inventory[m.kind],m.rotation,merchandiseDisplay(s,m.kind))
      })),
      {depth:counterPoint(s,{x:1.45,y:1.05}).x+counterPoint(s,{x:1.45,y:1.05}).y-.5,paint:()=>this.owner(camera,elapsedSeconds,s)},
      {depth:placedObject(s,"counter",{x:.9,y:1.42}).x+placedObject(s,"counter",{x:.9,y:1.42}).y+.8,paint:()=>{
        const counter=placedObject(s,"counter",{x:.9,y:1.42});
        drawSceneCounter(ctx,camera,counter,s,elapsedSeconds);
      }},
      {depth:roomW+6,paint:()=>drawEntryMarker(ctx,camera,s)}
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
      entries.push({depth:p.x+p.y,paint:()=>drawComputerDesk(ctx,camera,p,i,elapsedSeconds,online(s),s)});
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
      entries.push({depth:wall.x+wall.y+0.5,paint:()=>drawInteriorWall(ctx,camera,wall)});
    for(const door of s.interiorDoors??[])
      entries.push({depth:door.x+door.y+0.5,paint:()=>drawInteriorDoor(ctx,camera,door)});
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
    drawRoomSign(ctx,camera,roomW);
    // Indicadores dos jogadores reais por cima do cenário e atrás do HUD geral.
    drawNightMatchMarkers(ctx,s,camera);
    drawNightMatchReactions(ctx,s,camera,elapsedSeconds,matchReactions);
    drawNightPrizePresentation(ctx,s,camera,elapsedSeconds);
    drawNightReopening(ctx,s,elapsedSeconds);
    drawRoomStatus(ctx,s);
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
  /** Positions and renders annex PC previews without mutating the purchase state. */
  drawAnnexPcCandidates(s:GameState,hovered:string|null):void{
    drawAnnexPcCandidates(this.ctx,s,hovered);
  }
  drawDoorCandidates(s:GameState,hovered:WallSegment|null):void{
    drawDoorCandidates(this.ctx,s,hovered);
  }
  drawWallPreview(s:GameState,wall:WallSegment|null,demolish:boolean):void{
    drawWallPreview(this.ctx,s,wall,demolish);
  }
  drawPlacementCandidates(s:GameState,kind:FurnitureKind,hoveredId:string|null,rotation:0|1|2|3=0):void {
    drawPlacementCandidates(this.ctx,s,kind,hoveredId,rotation);
  }
  drawRelocationCandidates(s:GameState,fromSlot:string|null,hoveredId:string|null):void {
    drawRelocationCandidates(this.ctx,s,fromSlot,hoveredId);
  }
  /** Glass tint per simulated hour: sky by day, amber at sunset, dark at night.
   * Mullions and the diagonal sheen are repainted on top each frame. */
  /** The glass only changes with the simulated minute, so it is rasterized once per light state and zoom
   * instead of being repainted (gradients, reflections, mullions) on every frame. */
  private windowPanes(camera:Projection,bounds:RoomBounds,light:Daylight):void{
    drawRoomWindows(this.ctx,camera,bounds,light);
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
  private owner(camera:Projection,t:number,s?:GameState):void {
    this.heroHitbox=drawSceneOwner(this.ctx,camera,t,s);
  }
  private customer(camera:Projection,c:Customer,t:number,seated:boolean,s:GameState,
    reaction?:NightMatchReaction):void {
    drawSceneCustomer(this.ctx,camera,c,t,seated,s,reaction);
  }
}
