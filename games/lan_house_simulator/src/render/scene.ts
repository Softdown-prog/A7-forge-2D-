import type { Customer, GameState, Point } from "../sim/types.js";
import { pcCount, pcPosition, roomWidth, online } from "../sim/engine.js";
import { cameraForRoom, cuboid, iso, polygon, type Projection } from "./isometric.js";
import { drawRetroComputer } from "./retroComputer.js";
import { drawActor, actorHitbox, type ActorPose } from "./actorArt.js";

export class SceneRenderer {
  private heroHitbox = { x: 0, y: 0, width: 0, height: 0 };
  constructor(private ctx: CanvasRenderingContext2D) {}
  hitOwner(x: number, y: number): boolean {
    const r = this.heroHitbox;
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  }
  draw(s: GameState, elapsedSeconds: number): void {
    const ctx = this.ctx, w=1000, h=610, roomW=roomWidth(s), camera=cameraForRoom(roomW);
    ctx.clearRect(0,0,w,h);
    const sky = ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,"#172036"); sky.addColorStop(1,"#34425C");
    ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
    this.floor(camera,roomW);
    this.walls(camera,roomW);
    this.decor(camera,roomW);
    type Entry={depth:number;paint:()=>void};
    const entries:Entry[]=[
      {depth:1.7,paint:()=>this.shelf(camera)},
      {depth:2.4,paint:()=>this.machine(camera,5.7,0.55,"soda",elapsedSeconds)},
      {depth:2.8,paint:()=>this.machine(camera,4.9,0.7,"candy",elapsedSeconds)},
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
      entries.push({depth:c.x+c.y+0.08,paint:()=>this.customer(camera,c,elapsedSeconds,seated)});
    }
    entries.sort((a,b)=>a.depth-b.depth);
    for (const e of entries) e.paint();
    this.sign(camera,roomW);
    this.hudInside(ctx,s);
  }
  private floor(camera:Projection,w:number):void {
    const ctx=this.ctx;
    // O cenário é uma plataforma suspensa: sem exterior, sem base ligada a um terreno.
    const rearRight=iso({x:w,y:0},camera);
    const frontRight=iso({x:w,y:6},camera);
    const frontLeft=iso({x:0,y:6},camera);
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
    for(let y=0;y<6;y++) for(let x=0;x<w;x++) {
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
  private walls(camera:Projection,w:number):void {
    const ctx=this.ctx;
    polygon(ctx,[iso({x:0,y:0},camera,155),iso({x:w,y:0},camera,155),
      iso({x:w,y:0},camera),iso({x:0,y:0},camera)],"#D7C6B2","#715C60");
    polygon(ctx,[iso({x:0,y:0},camera,155),iso({x:0,y:6},camera,155),
      iso({x:0,y:6},camera),iso({x:0,y:0},camera)],"#B9ABB2","#786877");
    for(const position of [2.15,4.45]){
      const a=iso({x:position,y:0},camera,127),b=iso({x:position+1.2,y:0},camera,127),
        c=iso({x:position+1.2,y:0},camera,73),d=iso({x:position,y:0},camera,73);
      polygon(ctx,[a,b,c,d],"#344F62","#F9E2BE");
      polygon(ctx,[iso({x:position+0.62,y:0},camera,127),iso({x:position+0.62,y:0},camera,73),
        c,b],"rgba(127,186,201,0.14)");
    }
  }
  private decor(camera:Projection,w:number):void {
    const ctx=this.ctx;
    // Frisos ao pé das paredes; ajudam a perceber o interior sem adicionar telhado.
    polygon(ctx,[
      iso({x:0,y:0.02},camera,9),iso({x:w,y:0.02},camera,9),
      iso({x:w,y:0.02},camera,2),iso({x:0,y:0.02},camera,2)
    ],"#967D78");
    polygon(ctx,[
      iso({x:0.02,y:0},camera,9),iso({x:0.02,y:6},camera,9),
      iso({x:0.02,y:6},camera,2),iso({x:0.02,y:0},camera,2)
    ],"#817A84");
    // Quadros montados sobre a parede do fundo, altura consistente em world pixels.
    for(const [x,label,accent] of [
      [0.82,"LAN","#52766C"],[Math.max(3.25,w-2.2),"JOGOS","#927053"]
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
    // Quadros no plano da parede esquerda (x=0), sem exterior.
    for(const [start,label,accent] of [
      [1.20,"CYBER","#587D79"],[3.28,"JOGOS","#987654"]
    ] as const){
      polygon(ctx,[
        iso({x:0,y:start},camera,126),iso({x:0,y:start+1.20},camera,126),
        iso({x:0,y:start+1.20},camera,78),iso({x:0,y:start},camera,78)
      ],"#B18E6D","#6F5D66");
      polygon(ctx,[
        iso({x:0,y:start+0.09},camera,119),
        iso({x:0,y:start+1.11},camera,119),
        iso({x:0,y:start+1.11},camera,85),
        iso({x:0,y:start+0.09},camera,85)
      ],accent);
      const p=iso({x:0,y:start+0.59},camera,103);
      ctx.save();ctx.font="bold 8px system-ui,sans-serif";
      ctx.fillStyle="#FFF0D9";ctx.textAlign="center";ctx.fillText(label,p.x,p.y+2);
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
  private shelf(camera:Projection):void {
    const ctx=this.ctx;
    cuboid(ctx,camera,2.9,0.4,1.1,0.45,75,["#B88966","#694A44","#7D5441"]);
    for(let i=0;i<5;i++){
      const p=iso({x:3.0+i*0.17,y:0.43},camera,81);
      ctx.fillStyle=["#E8A644","#A4C97C","#E8B77B","#CFA6F0","#E8A644"][i]!;
      ctx.fillRect(p.x-3,p.y-7,6,10);
    }
  }
  private machine(camera:Projection,x:number,y:number,kind:"soda"|"candy",t:number):void {
    const ctx=this.ctx,h=kind==="soda"?106:85;
    cuboid(ctx,camera,x,y,0.65,0.6,h,kind==="soda"?
      ["#E65E5F","#992D45","#B74154"]:["#F5B84E","#B57634","#D68B46"]);
    const a=iso({x:x+0.65,y:y+0.25},camera,h-17);
    ctx.fillStyle=kind==="soda"?"#6ACACD":"#614C75";
    ctx.beginPath();ctx.ellipse(a.x,a.y,13,17,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=t%1<0.5?"#FFF3C7":"#6C4769";
    ctx.fillRect(a.x-6,a.y-8,12,4);
    const label=iso({x:x+0.65,y:y+0.4},camera,38);
    ctx.fillStyle="#FFF6DB";ctx.fillRect(label.x-8,label.y-6,16,5);
    const slot=iso({x:x+0.65,y:y+0.43},camera,17),z=camera.zoom;
    ctx.fillStyle="#253348";ctx.fillRect(slot.x-9*z,slot.y-5*z,18*z,7*z);
    ctx.fillStyle=kind==="soda"?"#A5E5D6":"#F1D391";
    ctx.fillRect(slot.x-6*z,slot.y-3*z,9*z,2*z);
  }
  private desk(camera:Projection,p:Point,i:number,t:number,isOnline:boolean,s:GameState):void {
    drawRetroComputer(this.ctx,camera,p,i,t,isOnline,s);
  }
  private owner(camera:Projection,t:number):void {
    // Mesmo rosto e uniforme em todos os quadros; o balcão oclui parcialmente o corpo.
    drawActor(this.ctx,camera,{x:1.45,y:1.05,kind:"owner",id:0,time:t,pose:"idle",facing:1});
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
    const dx=c.target.x-c.x,dy=c.target.y-c.y;
    const facing:1|-1=moving && (dx-dy)<-0.04?-1:1;
    drawActor(this.ctx,camera,{
      x,y,kind:c.costume,id:c.id,time:t+0.29*c.id,
      pose,facing,transition
    });
    if(c.stage==="waiting"){
      const p=iso({x,y},camera,91);
      this.ctx.fillStyle="#FFF4BC";
      this.ctx.font="bold 15px system-ui,sans-serif";
      this.ctx.fillText("?",p.x-4,p.y);
    }
  }
  private doorMarker(camera:Projection,s:GameState):void {
    // Somente limiar de entrada dentro do salão; não há rua, fachada externa ou chuva.
    const x=roomWidth(s)-0.5,y=6,ctx=this.ctx;
    polygon(ctx,[
      iso({x:x-0.45,y:y-0.24},camera),iso({x:x+0.45,y:y-0.24},camera),
      iso({x:x+0.45,y},camera),iso({x:x-0.45,y},camera)
    ],"#D8B98D","#856F62");
    const left=iso({x:x-0.45,y},camera),right=iso({x:x+0.45,y},camera);
    ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);
    ctx.strokeStyle="#FFF0BC";ctx.lineWidth=4*camera.zoom;ctx.stroke();
    const mid=iso({x,y:5.55},camera);
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
