import type {MotionCustomer,MotionWorker} from "./motion.js";
import {merchandiseDisplay} from "./merchandiseDisplay.js";
import type {ProductId} from "../sim/merchandise.js";
import {editableObjects,objectCorners,layoutPlacementIssue,builtPosters,type EditableObject} from "../sim/editableObjects.js";
import {computerSeat} from "../sim/route.js";
import type { Customer, GameState, Point } from "../sim/types.js";
import { pcCount, pcPosition, roomWidth, online } from "../sim/engine.js";
import {roomBounds,type RoomBounds} from "../sim/room.js";
import { cameraForGame, cuboid, iso, polygon, type Projection,objectCamera } from "./isometric.js";
import { drawRetroComputer, drawSeatedKeyboardOverlay } from "./retroComputer.js";
import {cosmeticAvailable,headsetOnSession} from "../sim/premiumCosmetics.js";
import {drawNeonOpenSign,neonOpenLit} from "./neonOpenArt.js";
import {drawVipAquarium} from "./aquariumArt.js";
import {drawPixelClock} from "./pixelClockArt.js";
import {yearFromMinutes} from "../sim/historicalEconomy.js";
import { actorHitbox, actorStyleFor, type ActorPose } from "./actorArt.js";
import {drawActorSprite as drawActor} from "./actorSprites.js";
import { movementDirection,screenViewForMotion } from "./direction.js";
import {furnitureSlots,occupiedFurnitureSlots,availablePlacementSlots,furnitureLocations,type FurnitureKind,type PlacementSlot} from "../sim/shop.js";
import { vendingMachines,placedObject,counterPoint,type PlacedPoint } from "../sim/layout.js";
import {drawVendingMachine,drawSnackShelf} from "./retailArt.js";
import {wallEndpoints,canBuildWall,type WallSegment} from "../sim/walls.js";
import {annexComputerSlots,availableAnnexComputers} from "../sim/stations.js";
import {BIN_SPOTS,binSpots,binStatus,type RepairJob,type CleaningJob} from "../sim/services.js";
import {workPhaseLabel} from "../sim/staffPresentation.js";
import type {ServiceAccessIssue} from "../sim/serviceAccess.js";
import {workerMotion} from "./workerMotion.js";
import {drawWorkContact} from "./workEffects.js";
import {technicianContactPoint} from "../sim/staffWorksites.js";
import type {PostmanDelivery} from "../sim/postmanDelivery.js";
import {SCENE_THEME as theme} from "./theme.js";
import {gpuGameInstallPausedReason} from "../sim/gpuGames.js";
import {ps1StationPoint,ps1PlayableDisc} from "../sim/ps1.js";
import {ps2StationPoint,ps2PlayableGame} from "../sim/ps2.js";
import {customerConsole,customerConsoleSeat} from "../sim/consoleLayout.js";
import {drawPs2Station,drawPs2Controller,ps2ActorGrip} from "./ps2Art.js";
import {drawPs1Station,drawPs1Controller} from "./ps1Art.js";
import {drawWallPoster,purchasedPosterKind,type PosterKind} from "./posterArt.js";
import {premiumCheckerPatch,drawPremiumWallPoster,type PremiumPosterIndex} from "./premiumRoomArt.js";
import {drawCounter} from "./counterArt.js";
import {drawCounterPrinter} from "./printerArt.js";
import {printingAnimationActive} from "../sim/printService.js";
import {copyingAnimationActive} from "../sim/discCopy.js";
import {drawCounterDiscCopier} from "./discCopierArt.js";
import {drawNightMatchMarkers,drawNightMatchReactions,nightMatchReactions,type NightMatchReaction} from "./nightMatchMarkers.js";
import {drawNightPrizePresentation} from "./nightPrizePresentation.js";
import {drawNightReopening} from "./nightReopening.js";
import {SCENE_WIDTH,SCENE_HEIGHT,contextScale} from "./sceneSurface.js";
import {daylightAt,drawSceneLighting,drawScreenGlow,drawMonitorEmission,monitorEmission,drawVignette,drawLampHalo,lampPositions,windowGlass,WINDOW_POSITIONS,type Daylight} from "./lighting.js";
import {computerAppearance,screenGlow,monitorScreenQuad} from "./retroComputer.js";
import {shadeHex,withAlpha,cellNoise} from "./color.js";

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
    if(!s.gpuGameInstallJobs?.length)return;
    const ctx=this.ctx;ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";
    for(const job of s.gpuGameInstallJobs){
      const pc=pcPosition(job.pc,s),at=iso({x:pc.x+.40,y:pc.y+.28},camera,92);
      const w=Math.max(27,42*camera.zoom),h=Math.max(4,5*camera.zoom);
      const x=at.x-w/2,y=at.y-15*camera.zoom,pct=job.elapsedMinutes/job.durationMinutes;
      const paused=!!gpuGameInstallPausedReason(s,job.pc);
      ctx.fillStyle="rgba(15,27,35,.92)";
      ctx.fillRect(x-3,y-18*camera.zoom,w+6,18*camera.zoom+h+6);
      ctx.fillStyle=paused?"#f6b96e":"#dbf7ea";
      ctx.font="bold "+Math.max(9,10*camera.zoom)+"px system-ui,sans-serif";
      ctx.fillText(paused?"PAUSA":Math.floor(pct*100)+"%",at.x,y-8*camera.zoom);
      ctx.fillStyle="#4c5a60";ctx.fillRect(x,y,w,h);
      ctx.fillStyle=paused?"#dd9754":"#69d5a4";ctx.fillRect(x,y,w*pct,h);
      if(!paused&&pct>0){
        ctx.save();ctx.beginPath();ctx.rect(x,y,w*pct,h);ctx.clip();
        const shine=x+(elapsedSeconds*15%(w+12))-12;
        ctx.fillStyle="rgba(244,255,252,.5)";ctx.fillRect(shine,y,5,h);
        ctx.restore();
      }
    }
    ctx.restore();
  }
  /** Modo de inspeção acionado na aba Serviços, sem recalcular caminhos por frame.
   * Destaca o destino inacessível, não afirma identificar a parede culpada. */
  drawServiceAccessOverlay(s:GameState,issues:readonly ServiceAccessIssue[],time:number):void{
    const ctx=this.ctx,cam=cameraForGame(s),z=cam.zoom;
    ctx.save();
    ctx.textAlign="center";ctx.textBaseline="middle";
    for(const [i,issue] of issues.entries()){
      const ground=iso(issue.point,cam,3);
      const at=iso(issue.point,cam,85);
      const pulse=1+Math.sin(time*3+i*1.7)*.09;
      ctx.lineWidth=Math.max(2,2.6*z);
      ctx.strokeStyle="#ffe4a6";
      ctx.fillStyle="rgba(184,60,47,.24)";
      ctx.beginPath();ctx.ellipse(ground.x,ground.y,23*z*pulse,12*z*pulse,0,0,Math.PI*2);
      ctx.fill();ctx.stroke();
      const label=issue.label.toUpperCase()+" · SEM PASSAGEM";
      const font=Math.max(10,Math.min(13,12*z));
      ctx.font="700 "+font+"px system-ui,sans-serif";
      const width=ctx.measureText(label).width+14;
      const x=Math.max(width/2+4,Math.min(1000-width/2-4,at.x));
      const y=Math.max(15,Math.min(590,at.y-(i%2)*14));
      ctx.fillStyle="rgba(89,30,28,.96)";
      ctx.fillRect(x-width/2,y-14,width,28);
      ctx.strokeStyle="#ffc58a";ctx.lineWidth=1.5;
      ctx.strokeRect(x-width/2,y-14,width,28);
      ctx.fillStyle="#fff0d9";
      ctx.fillText(label,x,y);
    }
    ctx.restore();
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
    const [a,b]=wallEndpoints(wall),height=78;
    const footA=iso(a,camera),footB=iso(b,camera),topA=iso(a,camera,height),topB=iso(b,camera,height);
    const ctx=this.ctx;ctx.save();
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
  private drawInteriorDoor(camera:Projection,door:WallSegment,preview=false):void{
    const [a,b]=wallEndpoints(door),ctx=this.ctx;
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
    const ctx=this.ctx,minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY,z=camera.zoom;
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
  private walls(camera:Projection,bounds:RoomBounds):void {
    const ctx=this.ctx,minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY,z=camera.zoom;
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
  /** Glass tint per simulated hour: sky by day, amber at sunset, dark at night.
   * Mullions and the diagonal sheen are repainted on top each frame. */
  private windowPanes(camera:Projection,bounds:RoomBounds,light:Daylight):void{
    const ctx=this.ctx,north=bounds.minY,w=bounds.maxX,glass=windowGlass(light);
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
  private decor(camera:Projection,bounds:RoomBounds,s:GameState):void {
    const ctx=this.ctx,minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY;
    // Light cones below each lamp belong to the static wall paint.
    for(const x of lampPositions(bounds))drawLampHalo(ctx,camera,x,north);
    // Frisos ao pé das paredes; ajudam a perceber o interior sem adicionar telhado.
    polygon(ctx,[
      iso({x:minX,y:north+0.02},camera,9),iso({x:w,y:north+0.02},camera,9),
      iso({x:w,y:north+0.02},camera,2),iso({x:minX,y:north+0.02},camera,2)
    ],"#967D78");
    polygon(ctx,[
      iso({x:minX,y:north+0.02},camera,10.5),iso({x:w,y:north+0.02},camera,10.5),
      iso({x:w,y:north+0.02},camera,9),iso({x:minX,y:north+0.02},camera,9)
    ],"#b8a29c");
    polygon(ctx,[
      iso({x:minX+0.02,y:north},camera,9),iso({x:minX+0.02,y:south},camera,9),
      iso({x:minX+0.02,y:south},camera,2),iso({x:minX+0.02,y:north},camera,2)
    ],"#817A84");
    polygon(ctx,[
      iso({x:minX+0.02,y:north},camera,10.5),iso({x:minX+0.02,y:south},camera,10.5),
      iso({x:minX+0.02,y:south},camera,9),iso({x:minX+0.02,y:north},camera,9)
    ],"#a39ca6");
    // Pôsteres premium usam as molduras e pontos existentes; nunca bloqueiam paredes.
    const premium=cosmeticAvailable("exclusive-arcade-posters",yearFromMinutes(s.totalMinutes));
    for(const p of builtPosters(s)){
      const placement={x:p.x,y:p.y,axis:p.axis!,span:p.span!,top:p.id.endsWith(":0")||p.id.endsWith(":1")?128:133,height:p.id.endsWith(":0")||p.id.endsWith(":1")?49:59};
      const index=Number(p.id.slice("built-poster:".length));
      if(premium&&index>=0&&index<3)drawPremiumWallPoster(ctx,camera,placement,index as PremiumPosterIndex);
      else drawWallPoster(ctx,camera,placement,p.posterKind!);
    }
    // Luminárias na parte superior da parede: iluminação contida e sem brilho glossy.
    for(const x of lampPositions(bounds)){
      const p=iso({x,y:north},camera,146),z=camera.zoom;
      ctx.fillStyle="rgba(40,36,34,.25)";ctx.fillRect(p.x-18*z,p.y+5*z,36*z,2.5*z);
      ctx.fillStyle="#7B6261";ctx.fillRect(p.x-17*z,p.y-4*z,34*z,9*z);
      ctx.fillStyle="#5c4847";ctx.fillRect(p.x-17*z,p.y-4*z,34*z,2*z);
      ctx.fillStyle="#F6E1B2";ctx.fillRect(p.x-14*z,p.y-1*z,28*z,3*z);
      ctx.fillStyle="rgba(255,255,255,.65)";ctx.fillRect(p.x-12*z,p.y-.4*z,24*z,1.2*z);
    }
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
    const ctx=this.ctx,loc=iso(p,camera),z=camera.zoom;
    const status=binStatus(fill);
    ctx.save();ctx.translate(loc.x,loc.y);ctx.lineJoin="round";
    // Sombra no chão, corpo estável (mesma âncora da projeção usada nos móveis).
    ctx.fillStyle="rgba(19,30,36,.32)";
    ctx.beginPath();ctx.ellipse(0,3*z,12*z,5*z,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#426F68";ctx.strokeStyle="#1A3D3F";ctx.lineWidth=1.8*z;
    ctx.beginPath();ctx.moveTo(-10*z,-21*z);ctx.lineTo(10*z,-21*z);
    ctx.lineTo(8*z,0);ctx.lineTo(-8*z,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle="#90BBAA";ctx.beginPath();ctx.ellipse(0,-21*z,10*z,3.5*z,0,0,Math.PI*2);ctx.fill();
    if(status==="empty"){
      // Boca aberta, fundo escuro visível: lixeira efetivamente vazia.
      ctx.fillStyle="#1B3437";ctx.beginPath();ctx.ellipse(0,-21*z,7.5*z,2.2*z,0,0,Math.PI*2);ctx.fill();
    }else{
      // Nível cresce dentro do recipiente, com indicador frontal legível.
      const amount=Math.min(1,Math.max(0,fill/100));
      ctx.fillStyle="#A58E69";
      ctx.beginPath();ctx.ellipse(0,-20*z,7.4*z,2.4*z,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=status==="full"?"#D28C4B":"#B0C28B";
      ctx.fillRect(-7*z,-15*z,14*z*amount,4*z);
      if(status==="full"){
        // Lixeira cheia: sacos visíveis acima da tampa, marca clara de lotação.
        ctx.fillStyle="#645F52";
        ctx.beginPath();ctx.ellipse(-4*z,-26*z,5*z,5*z,-.24,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#97866C";
        ctx.beginPath();ctx.ellipse(4*z,-27*z,5*z,5.5*z,.28,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#CBB77D";ctx.lineWidth=1.1*z;
        ctx.beginPath();ctx.moveTo(0,-31*z);ctx.lineTo(2*z,-33*z);ctx.stroke();
        ctx.fillStyle="#E6B45A";ctx.fillRect(-9*z,-23*z,18*z,3*z);
      }
    }
    ctx.restore();
  }
  /** Visiting postman: same actor rig, procedural uniform, visible delivery animation. */
  private postman(camera:Projection,job:PostmanDelivery,t:number):void{
    const motion=(job as PostmanDelivery&{renderMotion?:{moving:boolean;distance:number;view:import("./direction.js").ActorScreenView}}).renderMotion;
    const moving=motion?.moving??job.moving;
    drawActor(this.ctx,camera,{
      x:job.x,y:job.y,kind:"postman",id:-31,time:t,
      pose:job.phase==="handing"?"delivering":moving?"walking":"idle",
      direction:job.phase==="handing"?"north":job.facing??"north",
      screenView:job.phase==="handing"?undefined:motion?.view,
      walkDistance:job.phase==="handing"?undefined:motion?.distance
    });
    const pos=iso(job,camera),ctx=this.ctx,z=camera.zoom;
    const caption=job.phase==="handing"?"ENTREGANDO REVISTA":
      job.phase==="arriving"?"CARTEIRO · CHEGANDO":"CARTEIRO · SAINDO";
    ctx.save();ctx.font="700 "+Math.max(9,10*z)+"px system-ui";
    const w=ctx.measureText(caption).width+10;
    ctx.fillStyle="rgba(24,42,70,.93)";
    ctx.fillRect(pos.x-w/2,pos.y-143*z,w,19*z);
    ctx.fillStyle="#FFE495";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(caption,pos.x,pos.y-133.5*z);
    ctx.restore();
  }
  /** Trabalhadores agora usam EXATAMENTE a geometria, câmera e caminhada dos clientes. */
  private worker(camera:Projection,job:RepairJob|CleaningJob,time:number,
    kind:"technician"|"cleaner",progress:number,s:GameState):void{
    const ctx=this.ctx,z=camera.zoom,working=job.phase==="working";
    // Vincula visualmente o funcionário ao equipamento. As linhas e os círculos
    // são puramente gráficos: sem caminho fantasma ou mudança de posição.
    if(working){
      const target=kind==="cleaner"
       ?binSpots(s)[(job as CleaningJob).binIndex??0]
       :technicianContactPoint(pcPosition((job as RepairJob).pc,s));
      if(target){
        const floor=iso(target,camera,3),worker=iso({x:job.x,y:job.y},camera,2);
        ctx.save();
        ctx.strokeStyle=kind==="cleaner"?"rgba(154,219,171,.85)":"rgba(235,194,111,.82)";
        ctx.lineWidth=Math.max(1.3,1.8*z);
        ctx.setLineDash([5*z,4*z]);
        ctx.beginPath();ctx.moveTo(worker.x,worker.y);ctx.lineTo(floor.x,floor.y);ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle=kind==="cleaner"?"rgba(103,181,132,.13)":"rgba(239,190,99,.11)";
        ctx.beginPath();ctx.ellipse(floor.x,floor.y,16*z,9*z,0,0,Math.PI*2);
        ctx.fill();ctx.stroke();
        ctx.restore();
      }
    }
    const locomotion=(job as MotionWorker).renderMotion;
    const moving=locomotion?.moving??!!job.moving;
    drawActor(ctx,camera,{
      x:job.x,y:job.y,kind,id:kind==="cleaner"?-17:-19,
      time,pose:working?(kind==="cleaner"?"sweeping":"repairing"):moving?"walking":"idle",
      direction:job.facing??"north",
      // Workers now share the customers' ground-driven stride and isometric facing.
      // Work actions stay independent; an idle worker never walks in place.
      walkDistance:!working?locomotion?.distance:undefined,
      screenView:!working&&moving?locomotion?.view:undefined
    });
    const p=iso({x:job.x,y:job.y},camera);
    if(working){
      // Movimento de trabalho compartilhado com as mãos do personagem.
      // Mantém âncora, escala e espelhamento idênticos ao actorArt.
      const motion=workerMotion(kind==="cleaner"?"sweeping":"repairing",time);
      ctx.save();ctx.translate(p.x,p.y);
      ctx.scale(z*(job.facing==="west"?-1:1),z);
      ctx.lineCap="round";ctx.lineJoin="round";
      if(kind==="cleaner"){
        const tip=motion.toolTip,grip=motion.nearHand;
        // Sombras curtas da vassoura no chão; cabeça em contato com os pés.
        ctx.strokeStyle="rgba(51,50,40,.2)";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(tip.x-13,tip.y+2);ctx.lineTo(tip.x+13,tip.y+2);ctx.stroke();
        // Cabo e anéis, alinhados aos dedos da mão superior e inferior.
        ctx.strokeStyle="#34444A";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(grip.x-1,grip.y-5);ctx.lineTo(tip.x,tip.y-2);ctx.stroke();
        ctx.strokeStyle="#A87E51";ctx.lineWidth=2.8;
        ctx.beginPath();ctx.moveTo(grip.x-1,grip.y-5);ctx.lineTo(tip.x,tip.y-2);ctx.stroke();
        ctx.fillStyle="#C0AC76";ctx.strokeStyle="#46544D";ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(tip.x-12,tip.y-4);ctx.lineTo(tip.x+12,tip.y-4);
        ctx.lineTo(tip.x+15,tip.y+1);ctx.lineTo(tip.x-15,tip.y+1);
        ctx.closePath();ctx.fill();ctx.stroke();
        // Cerdas se curvam discretamente a cada passada.
        for(let b=-11;b<=11;b+=3){
          ctx.strokeStyle=b%2===0?"#9C8D66":"#DAC394";ctx.lineWidth=1.3;
          ctx.beginPath();ctx.moveTo(tip.x+b,tip.y);ctx.lineTo(tip.x+b+motion.pulse*2,tip.y+5);ctx.stroke();
        }
        if(Math.abs(motion.pulse)>.65){
          ctx.strokeStyle="rgba(187,177,139,.48)";ctx.lineWidth=1.5;
          for(let j=0;j<2;j++){
            ctx.beginPath();ctx.moveTo(tip.x-20-j*4,tip.y+3+j*2);
            ctx.lineTo(tip.x-25-j*4,tip.y+4+j*2);ctx.stroke();
          }
        }
      }else{
        const tip=motion.toolTip,grip=motion.nearHand;
        // Maleta aberta no chão: a mão esquerda sustenta enquanto a direita
        // gira a ferramenta. Evita desenhar um segundo PC sobre a estação.
        ctx.fillStyle="#394F53";ctx.strokeStyle="#263843";ctx.lineWidth=1.6;
        ctx.fillRect(15,-14,24,13);ctx.strokeRect(15,-14,24,13);
        ctx.fillStyle="#E0C27A";ctx.fillRect(17,-12,20,4);
        ctx.fillStyle="#879CA0";ctx.fillRect(18,-7,6,3);ctx.fillRect(27,-7,7,3);
        // Chave de fenda acompanha a oscilação do punho até a maleta.
        ctx.strokeStyle="#A9BDCB";ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(grip.x,grip.y+4);ctx.lineTo(tip.x,tip.y);ctx.stroke();
        ctx.strokeStyle="#D7AF60";ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(grip.x,grip.y+3);ctx.lineTo(grip.x+2,grip.y+10);ctx.stroke();
        ctx.fillStyle=motion.pulse>.2?"#F3CE7F":"#9CABAB";
        ctx.fillRect(34,-16,3,3);
        if(motion.pulse>.74){
          ctx.strokeStyle="#F3D17A";ctx.lineWidth=1.2;
          ctx.beginPath();ctx.moveTo(tip.x+2,tip.y-3);ctx.lineTo(tip.x+5,tip.y-6);ctx.stroke();
        }
      }
      ctx.restore();
      // O gesto da ferramenta responde no objeto trabalhado, além da pose do ator.
      // Calculado da posição real da máquina/lixeira; o render não afeta o save.
      const contact=kind==="cleaner"
        ?binSpots(s)[(job as CleaningJob).binIndex??0]
        :technicianContactPoint(pcPosition((job as RepairJob).pc,s));
      if(contact)drawWorkContact(ctx,camera,kind,contact,time);
      ctx.save();ctx.fillStyle="#142934";
      ctx.fillRect(p.x-22*z,p.y-107*z,44*z,7*z);
      ctx.fillStyle=kind==="technician"?"#E5BD59":"#8CC6B8";
      ctx.fillRect(p.x-21*z,p.y-106*z,42*z*Math.max(0,Math.min(1,progress)),5*z);
      ctx.restore();
    }
    // Etiqueta curta segue o personagem e reaproveita exatamente a fase do job.
    // Não altera a câmera, o deslocamento, a colisão ou o estado persistido.
    ctx.save();
    const caption=workPhaseLabel(kind,job).toUpperCase();
    const font=Math.max(9,10.5*z),pad=5;
    ctx.font="700 "+font+"px system-ui";
    const width=ctx.measureText(caption).width+pad*2;
    // Os dois profissionais chegam pela mesma porta; evitar etiquetas sobrepostas.
    const badgeY=p.y-(kind==="technician"?152:132)*z-font, badgeX=p.x-width/2;
    ctx.fillStyle="rgba(24,43,47,.92)";
    ctx.fillRect(badgeX,badgeY,width,font+8);
    ctx.fillStyle=working?(kind==="technician"?"#efcd82":"#b1e6da"):"#f6f0d9";
    ctx.textAlign="center";ctx.textBaseline="top";
    ctx.fillText(caption,p.x,badgeY+4);
    ctx.restore();
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
    const position=counterPoint(s,{x:1.45,y:1.05}),r=placedObject(s,"counter",{x:.9,y:1.42}).rotation??0;
    // Mesmo rosto e uniforme em todos os quadros; o balcão oclui parcialmente o corpo.
    const printAt=s?.printer?.lastPrintedMinute??-1,copyAt=s?.discCopier?.lastCopiedMinute??-1;
    // Prioridade ao serviço pago mais recente; ambos os equipamentos animam independente.
    const pose=s&&copyingAnimationActive(s)&&copyAt>=printAt?"copying":
      s&&printingAnimationActive(s)?"printing":
      s?.postmanDelivery?.phase==="handing"?"receiving":"idle";
    drawActor(this.ctx,camera,{...position,kind:"owner",id:0,time:t,pose,
      direction:(["south","west","north","east"] as const)[r],
      premiumCyber:!!s&&cosmeticAvailable("tony-cyber",yearFromMinutes(s.totalMinutes))});
    this.heroHitbox=actorHitbox(camera,position.x,position.y);
  }
  private customer(camera:Projection,c:Customer,t:number,seated:boolean,s:GameState,
    reaction?:NightMatchReaction):void {
    let x=c.x,y=c.y;
    const motion=(c as MotionCustomer).renderMotion;
    const moving=c.stage==="arriving" || c.stage==="to_pc" ||
      c.stage==="shopping" || c.stage==="leaving";
    let pose:ActorPose=moving&&(motion?motion.moving:Math.hypot(c.target.x-c.x,c.target.y-c.y)>.0001)?"walking":"idle";
    let transition=1;
    if(seated && customerConsole(c)){
      const seat=customerConsoleSeat(s,c);
      if(seat){x=seat.x;y=seat.y;pose=c.stage==="standing"?"standing-up":"sitting";
       transition=c.stage==="sitting"?Math.min(1,(c.poseMinutes??0)/3):
        c.stage==="standing"?Math.min(1,(c.poseMinutes??0)/3):1;}
    }else if(seated && c.pcIndex!==null){
      const p=pcPosition(c.pcIndex,s);
      const seat=computerSeat(p);x=seat.x;y=seat.y;
      pose=c.stage==="standing"?"standing-up":"sitting";
      transition=c.stage==="sitting"?Math.min(1,(c.poseMinutes??0)/3):
        c.stage==="standing"?Math.min(1,(c.poseMinutes??0)/3):1;
    }
    const direction=seated&&customerConsole(c)?"north":
      seated&&c.pcIndex!==null?(["north","east","south","west"] as const)[pcPosition(c.pcIndex,s).rotation??0]:
      // SceneMotion resolves the direction of the *visible* interpolated step.
      // The next waypoint can already be around a corner: do not turn early.
      moving?(c.facing??movementDirection({x:c.x,y:c.y},c.target)):(c.facing??"south");
    const ps2Point=c.ps2StationIndex!==undefined?ps2StationPoint(s,c.ps2StationIndex):null;
    const consoleView=seated&&ps2Point?screenViewForMotion(ps2Point.x+.44-x,ps2Point.y+.395-y,"north"):undefined;
    // Seat-specific PS2 grip must mirror with the actor, not with the TV.
    const grip=seated&&ps2Point?ps2ActorGrip({x,y},ps2Point,consoleView):undefined;
    const drawPad=()=>drawPs2Controller(this.ctx,camera,{x,y},t+.29*c.id,c.ps2SeatIndex??0,
       ps2Point??undefined,actorStyleFor(c.costume,c.id).skin);
    // A controller in front of a back-facing torso must be occluded by the body.
    const padBehind=consoleView?.startsWith("back");
    if(seated&&ps2Point&&c.stage==="using"&&padBehind)drawPad();
    drawActor(this.ctx,camera,{
      x,y,kind:c.costume,id:c.id,time:t+0.29*c.id,
      pose,direction,transition,walkDistance:motion?.distance,
      reaction:reaction?.kind,
      // Face the current interpolated world step in SCREEN space (2:1 isometric).
      screenView:seated?consoleView:motion?.view??screenViewForMotion(
        pose==="walking"?c.target.x-c.x:0,
        pose==="walking"?c.target.y-c.y:0,direction),
      gamepad:seated&&customerConsole(c)!==null&&c.stage==="using",
      modernGamepad:c.ps2StationIndex!==undefined,gamepadGrip:grip,
      consoleSeat:seated&&customerConsole(c)!==null,
      premiumHeadset:seated&&c.pcIndex!==null&&!customerConsole(c)&&
       cosmeticAvailable("headset-rgb-neon",yearFromMinutes(s.totalMinutes))&&
       headsetOnSession(c.id,c.pcIndex)
    });
    if(seated&&ps2Point&&c.stage==="using"&&!padBehind)drawPad();
    if(seated&&c.ps1StationIndex!==undefined&&c.stage==="using")
      drawPs1Controller(this.ctx,camera,{x,y},t,c.ps1SeatIndex??0);
    if(seated && c.pcIndex!==null){
      const style=actorStyleFor(c.costume,c.id);
      const weight=reaction?0:c.stage==="using"?1:
        c.stage==="sitting"?transition:
        c.stage==="standing"?1-transition:0;
      drawSeatedKeyboardOverlay(this.ctx,objectCamera(camera,pcPosition(c.pcIndex,s),1.1,.7,pcPosition(c.pcIndex,s).rotation),pcPosition(c.pcIndex,s),t,
        style.skin,style.shirt,weight);
    }
    if(c.vip){
      const marker=iso({x,y},camera,100);
      this.ctx.save();this.ctx.font="bold "+Math.max(10,12*camera.zoom)+"px system-ui,sans-serif";
      this.ctx.textAlign="center";this.ctx.lineWidth=2*camera.zoom;this.ctx.strokeStyle="#273448";
      this.ctx.strokeText("★ VIP",marker.x,marker.y);this.ctx.fillStyle="#f5ca64";this.ctx.fillText("★ VIP",marker.x,marker.y);this.ctx.restore();
    }
    if(c.stage==="waiting"){
      const p=iso({x,y},camera,95);
      this.ctx.save();
      this.ctx.font="900 "+Math.max(20,23*camera.zoom)+"px system-ui,sans-serif";
      this.ctx.textAlign="center";this.ctx.textBaseline="middle";
      this.ctx.lineJoin="round";this.ctx.lineWidth=4*camera.zoom;
      this.ctx.strokeStyle="#222535";this.ctx.strokeText("?",p.x,p.y);
      this.ctx.fillStyle="#FF4848";this.ctx.fillText("?",p.x,p.y);
      this.ctx.restore();
    }
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
