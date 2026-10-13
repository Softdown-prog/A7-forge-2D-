import type { Customer, GameState, Point } from "../sim/types.js";
import { pcCount, pcPosition, roomWidth, online } from "../sim/engine.js";
import {roomBounds,type RoomBounds} from "../sim/room.js";
import { cameraForGame, cuboid, iso, polygon, type Projection } from "./isometric.js";
import { drawRetroComputer, drawSeatedKeyboardOverlay } from "./retroComputer.js";
import { drawActor, actorHitbox, actorStyleFor, type ActorPose } from "./actorArt.js";
import { COMPUTER_DIRECTION, movementDirection } from "./direction.js";
import {FURNITURE_SLOTS,furnitureSlots,occupiedFurnitureSlots,furnitureLocations,type FurnitureKind,type PlacementSlot} from "../sim/shop.js";
import { VENDING_MACHINES, VENDING_WIDTH, VENDING_DEPTH } from "../sim/layout.js";

export class SceneRenderer {
  private heroHitbox = { x: 0, y: 0, width: 0, height: 0 };
  constructor(private ctx: CanvasRenderingContext2D) {}
  hitOwner(x: number, y: number): boolean {
    const r = this.heroHitbox;
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  }
  draw(s: GameState, elapsedSeconds: number): void {
    const ctx = this.ctx, w=1000, h=610, roomW=roomWidth(s), camera=cameraForGame(s),bounds=roomBounds(s);
    ctx.clearRect(0,0,w,h);
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,"#172036"); sky.addColorStop(1,"#34425C");
    ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
    this.floor(camera,bounds);
    this.walls(camera,bounds);
    this.decor(camera,bounds);
    this.extraPosters(camera,s);
    type Entry={depth:number;paint:()=>void};
    const entries:Entry[]=[
      {depth:3.7,paint:()=>this.shelf(camera,bounds.minX)},
      {depth:6,paint:()=>this.extraFurniture(camera,s)},
      ...VENDING_MACHINES.map(m=>({
        depth:m.x+m.y+0.25,
        paint:()=>this.machine(camera,m.x,m.y,m.kind,elapsedSeconds)
      })),
      {depth:2.0,paint:()=>this.owner(camera,elapsedSeconds)},
      {depth:3.15,paint:()=>this.counter(camera)},
      {depth:roomW+6,paint:()=>this.doorMarker(camera,s)}
    ];
    for (let i=0;i<pcCount(s);i++){
      const p=pcPosition(i);
      entries.push({depth:p.x+p.y,paint:()=>this.desk(camera,p,i,elapsedSeconds,online(s),s)});
    }
    for (const c of s.customers) {
      const seated=c.stage==="sitting" || c.stage==="using" || c.stage==="standing";
      const location=seated && c.pcIndex!==null ? pcPosition(c.pcIndex) : c;
      entries.push({depth:location.x+location.y+(seated?1.16:0.08),paint:()=>this.customer(camera,c,elapsedSeconds,seated)});
    }
    entries.sort((a,b)=>a.depth-b.depth);
    for (const e of entries) e.paint();
    this.sign(camera,roomW);
    this.hudInside(ctx,s);
  }
  /** The ghost shares the exact geometry with purchased furniture. */
  drawPlacementCandidates(s:GameState,kind:FurnitureKind,hoveredId:string|null):void{
    const camera=cameraForGame(s);
    const occupied=occupiedFurnitureSlots(s);
    const surface=kind==="poster"?"wall":"floor";
    const ctx=this.ctx;
    ctx.save();
    for(const slot of furnitureSlots(s)){
      if(slot.surface!==surface)continue;
      const at=this.slotAnchor(camera,slot),blocked=occupied.has(slot.id);
      const hover=slot.id===hoveredId;
      ctx.beginPath();ctx.ellipse(at.x,at.y,16*camera.zoom,9*camera.zoom,0,0,Math.PI*2);
      ctx.fillStyle=blocked?"rgba(185,62,57,0.78)":hover?"rgba(113,233,165,0.92)":"rgba(81,182,137,0.73)";
      ctx.fill();ctx.strokeStyle=blocked?"#ffd2bd":"#edffe9";ctx.lineWidth=hover?3:1.5;ctx.stroke();
      if(hover&&!blocked){ctx.save();ctx.globalAlpha=0.73;this.renderPurchasedFurniture(camera,kind,slot.x,slot.y);ctx.restore();}
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
      ?iso({x:slot.x+0.33,y:0.01},camera,137)
      :iso({x:slot.x+0.25,y:slot.y+0.20},camera,9);
  }
  private renderPurchasedFurniture(camera:Projection,kind:FurnitureKind,x:number,y:number,rotation:0|1|2|3=0):void{
    if(kind==="poster"){
      polygon(this.ctx,[iso({x,y:0.01},camera,156),iso({x:x+0.65,y:0.01},camera,156),
        iso({x:x+0.65,y:0.01},camera,117),iso({x,y:0.01},camera,117)],"#557e88","#e7bf81");
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
    const positioned=(s.furniturePlacements??[]).filter(p=>p.kind==="poster");
    for(let i=0;i<Math.min(2,Math.max(0,(s.furniture?.poster??0)-positioned.length));i++){
      const x=2.1+i*2.25;
      polygon(this.ctx,[iso({x,y:0.01},camera,156),iso({x:x+0.65,y:0.01},camera,156),
        iso({x:x+0.65,y:0.01},camera,117),iso({x,y:0.01},camera,117)],"#557e88","#e7bf81");
    }
    for(const placed of positioned){
      const slot=furnitureSlots(s).find(v=>v.id===placed.slotId&&v.surface==="wall");
      if(slot)this.renderPurchasedFurniture(camera,"poster",slot.x,slot.y);
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
  private floor(camera:Projection,bounds:RoomBounds):void {
    const ctx=this.ctx,minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY;
    // O cenário é uma plataforma suspensa: sem exterior, sem base ligada a um terreno.
    const rearRight=iso({x:w,y:north},camera);
    const frontRight=iso({x:w,y:south},camera);
    const frontLeft=iso({x:minX,y:south},camera);
    const bottom=24*camera.zoom;
    ctx.save();
    ctx.shadowColor="rgba(7,12,23,0.65)";
    ctx.shadowBlur=25*camera.zoom;
    ctx.shadowOffsetY=18*camera.zoom;
    polygon(ctx,[frontLeft,frontRight,
      {x:frontRight.x,y:frontRight.y+bottom},
      {x:frontLeft.x,y:frontLeft.y+bottom}],"#514854","#343245");
    ctx.restore();
    polygon(ctx,[frontLeft,frontRight,
      {x:frontRight.x,y:frontRight.y+bottom},
      {x:frontLeft.x,y:frontLeft.y+bottom}],"#615662","#3B3A49");
    polygon(ctx,[rearRight,frontRight,
      {x:frontRight.x,y:frontRight.y+bottom},
      {x:rearRight.x,y:rearRight.y+bottom}],"#6E5862","#3B3A49");
    for(let y=north;y<south;y++) for(let x=minX;x<w;x++) {
      const ps=[iso({x,y},camera),iso({x:x+1,y},camera),iso({x:x+1,y:y+1},camera),iso({x,y:y+1},camera)];
      const tone=(x+y)%2===0?"#C4B7A8":"#B9AC9F";
      polygon(ctx,ps,tone,"#938579");
      if(y===4 && x>0 && x<w-1) {
        const c=iso({x:x+0.5,y:y+0.5},camera);
        ctx.fillStyle="rgba(100,83,77,0.10)";
        ctx.fillRect(c.x-4,c.y-2,8,4);
      }
    }
    // Tapete de circulação feito no mesmo plano da grade; sem geometria 3D.
    polygon(ctx,[
      iso({x:0.7,y:4.15},camera),iso({x:Math.min(w-0.5,5.1),y:4.15},camera),
      iso({x:Math.min(w-0.5,5.1),y:4.83},camera),iso({x:0.7,y:4.83},camera)
    ],"rgba(66,105,106,0.17)","rgba(73,106,105,0.27)");
  }
  private walls(camera:Projection,bounds:RoomBounds):void {
    const ctx=this.ctx,minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY;
    polygon(ctx,[iso({x:minX,y:north},camera,155),iso({x:w,y:north},camera,155),
      iso({x:w,y:north},camera),iso({x:minX,y:north},camera)],"#D7C6B2","#715C60");
    polygon(ctx,[iso({x:minX,y:north},camera,155),iso({x:minX,y:south},camera,155),
      iso({x:minX,y:south},camera),iso({x:minX,y:north},camera)],"#B9ABB2","#786877");
    for(const position of [2.15,4.45]){
      const a=iso({x:position,y:0},camera,127),b=iso({x:position+1.2,y:0},camera,127),
        c=iso({x:position+1.2,y:0},camera,73),d=iso({x:position,y:0},camera,73);
      polygon(ctx,[a,b,c,d],"#344F62","#F9E2BE");
      polygon(ctx,[iso({x:position+0.62,y:0},camera,127),iso({x:position+0.62,y:0},camera,73),
        c,b],"rgba(127,186,201,0.19)");
      // Montante e travessa dividem a janela, sem renderizar qualquer exterior.
      const mullionTop=iso({x:position+0.6,y:0},camera,127);
      const mullionBottom=iso({x:position+0.6,y:0},camera,73);
      ctx.strokeStyle="#C5B49B";ctx.lineWidth=2.3*camera.zoom;
      ctx.beginPath();ctx.moveTo(mullionTop.x,mullionTop.y);
      ctx.lineTo(mullionBottom.x,mullionBottom.y);ctx.stroke();
      const middleLeft=iso({x:position,y:0},camera,100);
      const middleRight=iso({x:position+1.2,y:0},camera,100);
      ctx.beginPath();ctx.moveTo(middleLeft.x,middleLeft.y);
      ctx.lineTo(middleRight.x,middleRight.y);ctx.stroke();
      // Peitoril projetado em 2:1, distinto do caixilho.
      polygon(ctx,[iso({x:position-0.06,y:0.03},camera,72),
        iso({x:position+1.26,y:0.03},camera,72),
        iso({x:position+1.26,y:0.11},camera,70),
        iso({x:position-0.06,y:0.11},camera,70)],"#DDD0B3","#867D79");
    }
  }
  private decor(camera:Projection,bounds:RoomBounds):void {
    const ctx=this.ctx,minX=bounds.minX,w=bounds.maxX,south=bounds.maxY,north=bounds.minY;
    // Frisos ao pé das paredes; ajudam a perceber o interior sem adicionar telhado.
    polygon(ctx,[
      iso({x:minX,y:north+0.02},camera,9),iso({x:w,y:north+0.02},camera,9),
      iso({x:w,y:north+0.02},camera,2),iso({x:minX,y:north+0.02},camera,2)
    ],"#967D78");
    polygon(ctx,[
      iso({x:minX+0.02,y:north},camera,9),iso({x:minX+0.02,y:south},camera,9),
      iso({x:minX+0.02,y:south},camera,2),iso({x:minX+0.02,y:north},camera,2)
    ],"#817A84");
    // Quadros montados sobre a parede do fundo, altura consistente em world pixels.
    for(const [x,label,accent] of [
      [minX+0.82,"LAN","#52766C"],[Math.max(minX+3.25,w-2.2),"JOGOS","#927053"]
    ] as const){
      const corners=[
        iso({x,y:0},camera,128),iso({x:x+0.92,y:0},camera,128),
        iso({x:x+0.92,y:0},camera,79),iso({x,y:0},camera,79)
      ];
      polygon(ctx,corners,"#E4D3B6","#856957");
      const inner=[
        iso({x:x+0.09,y:0},camera,118),iso({x:x+0.83,y:0},camera,118),
        iso({x:x+0.83,y:0},camera,86),iso({x:x+0.09,y:0},camera,86)
      ];
      polygon(ctx,inner,accent);
      const middle=iso({x:x+0.46,y:0},camera,97);
      ctx.save();ctx.font="bold 9px system-ui,sans-serif";
      ctx.textAlign="center";ctx.fillStyle="#F7E4C9";
      ctx.fillText(label,middle.x,middle.y+2);
      ctx.restore();
    }
    // Cinco cartazes de jogos no plano da parede esquerda (x=0).
    // Lettering e ilustrações procedurais de homenagem, sem copiar capas/logotipos.
    // Todos acima dos móveis, com o próprio City Horizon em destaque.
    const posters=[
      {y:0.27,lines:["ROLLERCOASTER","TYCOON"],base:"#416F66",accent:"#F2D28C",symbol:"wheel"},
      {y:1.40,lines:["COUNTER","STRIKE"],base:"#3B5265",accent:"#E3C38B",symbol:"cross"},
      {y:2.53,lines:["PANGYA"],base:"#457C86",accent:"#E7EBCC",symbol:"ball"},
      {y:3.66,lines:["GUNBOUND"],base:"#594C85",accent:"#E8BD89",symbol:"star"},
      {y:4.79,lines:["CITY","HORIZON"],base:"#2D746F",accent:"#F1D39B",symbol:"city"}
    ] as const;
    for(const poster of posters){
      const a=poster.y,b=poster.y+0.96;
      const at=(y:number,z:number)=>iso({x:minX+0.012,y},camera,z);
      polygon(ctx,[at(a,133),at(b,133),at(b,74),at(a,74)],
        "#DFCAA6","#695969");
      polygon(ctx,[at(a+0.06,128),at(b-0.06,128),
        at(b-0.06,79),at(a+0.06,79)],poster.base);
      // Geometria abstrata pequena no terço superior, exclusiva a cada jogo.
      const center=at((a+b)/2,117),z=camera.zoom;
      ctx.save();
      ctx.strokeStyle=poster.accent;ctx.fillStyle=poster.accent;
      ctx.lineWidth=Math.max(1,1.8*z);
      if(poster.symbol==="wheel"){
        ctx.beginPath();ctx.arc(center.x,center.y,8*z,0,Math.PI*2);ctx.stroke();
        for(let n=0;n<5;n++){
          const ang=n*Math.PI*2/5;
          ctx.beginPath();ctx.moveTo(center.x,center.y);
          ctx.lineTo(center.x+Math.cos(ang)*7*z,center.y+Math.sin(ang)*7*z);ctx.stroke();
        }
      } else if(poster.symbol==="cross"){
        ctx.beginPath();ctx.moveTo(center.x-7*z,center.y);ctx.lineTo(center.x+7*z,center.y);
        ctx.moveTo(center.x,center.y-7*z);ctx.lineTo(center.x,center.y+7*z);ctx.stroke();
        ctx.strokeRect(center.x-5*z,center.y-5*z,10*z,10*z);
      } else if(poster.symbol==="ball"){
        ctx.beginPath();ctx.arc(center.x,center.y,7*z,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=poster.base;ctx.beginPath();ctx.arc(center.x+2*z,center.y-2*z,2*z,0,Math.PI*2);ctx.fill();
      } else if(poster.symbol==="star"){
        ctx.beginPath();
        for(let n=0;n<10;n++){
          const ang=n*Math.PI/5-Math.PI/2,r=(n%2?3.3:8)*z;
          const px=center.x+Math.cos(ang)*r,py=center.y+Math.sin(ang)*r;
          if(n===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        ctx.closePath();ctx.fill();
      } else {
        for(const [offset,height] of [[-8,9],[-1,14],[6,11]] as const){
          ctx.fillRect(center.x+offset*z,center.y-height*z/2,6*z,height*z);
        }
      }
      // Legibilidade 1x: duas linhas somente onde necessário; o nome é textual.
      const fontSize=Math.max(5,7.6*z);
      ctx.font="bold "+fontSize+"px system-ui,sans-serif";
      ctx.textAlign="center";ctx.fillStyle="#F8EAD5";
      const label=at((a+b)/2,91);
      poster.lines.forEach((line,i)=>{
        ctx.fillText(line,label.x,label.y+(i-(poster.lines.length-1)/2)*8*z,69*z);
      });
      if(poster.symbol==="city"){
        const underline=at((a+b)/2,82);
        ctx.fillStyle="#F1D39B";ctx.fillRect(underline.x-13*z,underline.y,26*z,2*z);
      }
      ctx.restore();
    }
    // Luminárias na parte superior da parede: iluminação contida e sem brilho glossy.
    for(const x of [1.7,3.9,Math.max(5.4,w-1.2)]){
      const p=iso({x,y:0},camera,146),z=camera.zoom;
      ctx.fillStyle="#7B6261";ctx.fillRect(p.x-17*z,p.y-4*z,34*z,9*z);
      ctx.fillStyle="#F6E1B2";ctx.fillRect(p.x-14*z,p.y-1*z,28*z,3*z);
    }
  }
  private counter(camera:Projection):void {
    const ctx=this.ctx;
    cuboid(ctx,camera,0.9,1.42,1.75,0.68,49,["#EDCB8E","#7E5047","#986353"]);
    cuboid(ctx,camera,0.95,1.45,1.65,0.7,12,["#F3D5A1","#9E6A4C","#A57958"]);
    const point=iso({x:1.55,y:1.7},camera,62);
    ctx.fillStyle="#26374E";ctx.fillRect(point.x-9,point.y-10,18,15);
    ctx.fillStyle="#83D4CE";ctx.fillRect(point.x-6,point.y-7,12,8);
  }
  private shelf(camera:Projection,minX=0):void {
    const ctx=this.ctx;
    // Expositor lateral aberto para salgadinhos, inspirado em displays de conveniência.
    // Estrutura fina de metal com quatro bandejas e embalagens reais em perspectiva,
    // sem logomarca comercial nem o antigo cubo maciço de madeira.
    const x=minX+0.23,y=2.92,w=0.46,d=1.22,z=camera.zoom;
    const palette=["#e7a92c","#c95048","#68a86a","#6e91c8","#ca77a0","#ecbf64"];
    const shelfLine=(a:{x:number;y:number},b:{x:number;y:number},color:string,width:number):void=>{
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.lineWidth=width*z;ctx.strokeStyle=color;ctx.stroke();
    };
    // Pernas metálicas visíveis; desenho vazado permite ver a parede por trás.
    for(const [px,py] of [[x,y],[x+w,y],[x,y+d],[x+w,y+d]]){
      shelfLine(iso({x:px,y:py},camera,1),iso({x:px,y:py},camera,92),"#475969",4);
      const base=iso({x:px,y:py},camera,2);
      ctx.fillStyle="#293b4b";ctx.fillRect(base.x-3*z,base.y-2*z,6*z,4*z);
    }
    // Prateleiras discretas e pacotinhos empilhados por fileira.
    for(let row=0;row<4;row++){
      const height=17+row*20;
      const corners=[
        iso({x,y},camera,height),iso({x:x+w,y},camera,height),
        iso({x:x+w,y:y+d},camera,height),iso({x,y:y+d},camera,height)
      ];
      polygon(ctx,corners,"#c6c8ba","#52616a");
      shelfLine(corners[2]!,corners[3]!,"#576976",3);
      for(let i=0;i<5;i++){
        // A frente do pacote é um pequeno quadrilátero no plano da prateleira.
        const by=y+0.11+i*0.215;
        const p=iso({x:x+0.24,y:by},camera,height+1);
        const top=iso({x:x+0.24,y:by},camera,height+15);
        const wide=iso({x:x+0.24,y:by+0.12},camera,height+1);
        const wideTop=iso({x:x+0.24,y:by+0.12},camera,height+15);
        const tint=palette[(i+row*2)%palette.length]!;
        polygon(ctx,[top,wideTop,wide,p],tint,"#5e5360");
        // Selagem da embalagem e selo circular de sabor.
        shelfLine(top,wideTop,"#f4dfb6",1.8);
        const middle=iso({x:x+0.246,y:by+0.06},camera,height+8);
        ctx.fillStyle="#fff1c5";ctx.beginPath();
        ctx.ellipse(middle.x,middle.y,2.6*z,2.9*z,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#806850";ctx.lineWidth=.7*z;ctx.stroke();
      }
    }
    // Faixa de comunicação original, sem copiar a identidade de Elma Chips.
    const a=iso({x:x-.015,y:y+.08},camera,101);
    const b=iso({x:x-.015,y:y+d-.08},camera,101);
    shelfLine(a,b,"#e4ad45",8);
    const label=iso({x:x-.015,y:y+d/2},camera,106);
    ctx.save();ctx.fillStyle="#fff4db";ctx.textAlign="center";
    ctx.font="bold "+Math.max(7,9*z)+"px system-ui,sans-serif";
    ctx.fillText("SALGADINHOS",label.x,label.y);ctx.restore();
  }
  private machine(camera:Projection,x:number,y:number,kind:"soda"|"candy",t:number):void {
    const ctx=this.ctx, soda=kind==="soda",h=soda?106:94,z=camera.zoom;
    const w=VENDING_WIDTH,d=VENDING_DEPTH;
    cuboid(ctx,camera,x,y,w,d,h,soda?
      ["#DB6265","#953447","#B94D59"]:["#E7B65B","#A87840","#C78E50"]);
    // A frente agora olha para o salão (Y+), como os monitores dos clientes.
    // O painel inteiro segue o plano isométrico da face: nenhum círculo colado no lado.
    const front=(u:number,height:number)=>iso({x:x+u,y:y+d+0.003},camera,height);
    polygon(ctx,[front(.055,h-12),front(.49,h-12),
      front(.49,h-66),front(.055,h-66)],"#253A4A","#E7D4B1");
    // Fileiras de garrafas/latas e doces; prateleiras pertencem ao vidro.
    for(let row=0;row<3;row++){
      const top=h-24-row*15;
      const a=front(.075,top-8),b=front(.47,top-8);
      ctx.strokeStyle="#B8B4A0";ctx.lineWidth=Math.max(1,1.4*z);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      for(let col=0;col<3;col++){
        const p=front(.12+col*.142,top);
        const tint=soda?
          ["#C95C67","#78ADB8","#DFB770"][(col+row)%3]!:
          ["#E5C78B","#BC8F9C","#99BD91"][(col+row)%3]!;
        ctx.fillStyle=tint;ctx.fillRect(p.x-2.5*z,p.y-6*z,5*z,8*z);
        ctx.fillStyle="#EFE6D1";ctx.fillRect(p.x-2*z,p.y-3*z,4*z,2*z);
      }
    }
    polygon(ctx,[front(.39,h-14),front(.46,h-14),
      front(.23,h-64),front(.15,h-64)],"rgba(182,220,234,0.16)");
    // A faixa de marca é legível, sem copiar marca comercial.
    const label=front(.32,h-5);
    ctx.save();ctx.textAlign="center";ctx.font="bold "+Math.max(7,9*z)+"px system-ui,sans-serif";
    ctx.fillStyle="#FFF2D1";ctx.fillText(soda?"REFRI":"DOCES",label.x,label.y);
    ctx.restore();
    // Moedeiro, seleção e porta de entrega na mesma face frontal.
    polygon(ctx,[front(.535,h-31),front(.62,h-31),
      front(.62,h-55),front(.535,h-55)],"#D8C2A1","#815E54");
    const button=front(.58,h-42);
    ctx.fillStyle=Math.floor(t*1.2)%2===0?"#A7D6AF":"#8EB5A7";
    ctx.fillRect(button.x-2*z,button.y-3*z,4*z,5*z);
    const hatch=front(.33,17);
    ctx.fillStyle="#263346";ctx.fillRect(hatch.x-10*z,hatch.y-5*z,20*z,9*z);
    ctx.fillStyle="#CFBFA3";ctx.fillRect(hatch.x-7*z,hatch.y-3*z,14*z,2*z);
    // Rodapé sólido e sombra de contato reforçam a escala física.
    const foot=front(.33,2);
    ctx.fillStyle="rgba(32,34,45,0.24)";
    ctx.beginPath();ctx.ellipse(foot.x,foot.y+3*z,20*z,5*z,0,0,Math.PI*2);ctx.fill();
  }
  private desk(camera:Projection,p:Point,i:number,t:number,isOnline:boolean,s:GameState):void {
    drawRetroComputer(this.ctx,camera,p,i,t,isOnline,s);
  }
  private owner(camera:Projection,t:number):void {
    // Mesmo rosto e uniforme em todos os quadros; o balcão oclui parcialmente o corpo.
    drawActor(this.ctx,camera,{x:1.45,y:1.05,kind:"owner",id:0,time:t,pose:"idle",direction:"south"});
    // Bandeja oval na mão do proprietário, preservando rosto e hitbox do ator.
    const plate=iso({x:1.63,y:1.27},camera,45),scale=camera.zoom;
    this.ctx.save();
    this.ctx.lineWidth=3*scale;
    this.ctx.strokeStyle="#314859";
    this.ctx.fillStyle="#edf1e6";
    this.ctx.beginPath();this.ctx.ellipse(plate.x,plate.y,16*scale,6*scale,-0.10,0,Math.PI*2);
    this.ctx.fill();this.ctx.stroke();
    this.ctx.strokeStyle="#bdc9c5";this.ctx.lineWidth=1.2*scale;
    this.ctx.beginPath();this.ctx.ellipse(plate.x,plate.y,11*scale,3.5*scale,-0.10,0,Math.PI*2);
    this.ctx.stroke();this.ctx.restore();
    this.heroHitbox=actorHitbox(camera,1.45,1.05);
  }
  private customer(camera:Projection,c:Customer,t:number,seated:boolean):void {
    let x=c.x,y=c.y;
    const moving=c.stage==="arriving" || c.stage==="to_pc" ||
      c.stage==="shopping" || c.stage==="leaving";
    let pose:ActorPose=moving?"walking":"idle";
    let transition=1;
    if(seated && c.pcIndex!==null){
      const p=pcPosition(c.pcIndex);
      x=p.x+0.35;y=p.y+0.82;
      pose=c.stage==="standing"?"standing-up":"sitting";
      transition=c.stage==="sitting"?Math.min(1,(c.poseMinutes??0)/3):
        c.stage==="standing"?Math.min(1,(c.poseMinutes??0)/3):1;
    }
    const direction=seated?COMPUTER_DIRECTION:
      moving?movementDirection({x:c.x,y:c.y},c.target,c.facing??"south"):
      (c.facing??"south");
    drawActor(this.ctx,camera,{
      x,y,kind:c.costume,id:c.id,time:t+0.29*c.id,
      pose,direction,transition
    });
    if(seated && c.pcIndex!==null){
      const style=actorStyleFor(c.costume,c.id);
      const weight=c.stage==="using"?1:
        c.stage==="sitting"?transition:
        c.stage==="standing"?1-transition:0;
      drawSeatedKeyboardOverlay(this.ctx,camera,pcPosition(c.pcIndex),t,
        style.skin,style.shirt,weight);
    }
    if(c.stage==="waiting"){
      const p=iso({x,y},camera,91);
      this.ctx.fillStyle="#FFF4BC";
      this.ctx.font="bold 15px system-ui,sans-serif";
      this.ctx.fillText("?",p.x-4,p.y);
    }
  }
  private doorMarker(camera:Projection,s:GameState):void {
    // Somente limiar de entrada dentro do salão; não há rua, fachada externa ou chuva.
    const x=7.5,y=6,ctx=this.ctx;
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
  }
  private sign(camera:Projection,w:number):void {
    // Plaqueta de marca na área vazia do fundo: não cobre quadros nem clientes.
    const ctx=this.ctx,x=28,y=28,label=w>7?"SALÃO AMPLIADO":"PEQUENO NEGÓCIO";
    ctx.save();
    ctx.fillStyle="rgba(22,35,52,0.94)";ctx.fillRect(x,y,238,53);
    ctx.strokeStyle="#B89A78";ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,236,51);
    ctx.fillStyle="#E6C795";ctx.fillRect(x+13,y+10,3,30);
    ctx.font="bold 18px system-ui,sans-serif";ctx.fillStyle="#FFEDD1";
    ctx.fillText("LAN HOUSE",x+28,y+25);
    ctx.font="bold 10px system-ui,sans-serif";ctx.fillStyle="#A5D2C6";
    ctx.fillText(label+"  ·  1998",x+28,y+42);
    ctx.restore();
    void camera;
  }
  private hudInside(ctx:CanvasRenderingContext2D,s:GameState):void {
    ctx.fillStyle="rgba(15,25,43,.88)";ctx.fillRect(18,526,395,64);
    ctx.fillStyle="#FFECCB";ctx.font="bold 14px system-ui,sans-serif";
    ctx.fillText("Clique no proprietário atrás do balcão",31,552);
    ctx.fillStyle="#B6D9DF";ctx.font="12px system-ui,sans-serif";
    ctx.fillText("Clientes: "+s.customers.length+"   |   PCs: "+pcCount(s)+"   |   Internet: "+(online(s)?"online":"offline"),31,575);
  }
}
