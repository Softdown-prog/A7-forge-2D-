import type { Customer, GameState, Point } from "../sim/types.js";
import { pcCount, pcPosition, roomWidth, online } from "../sim/engine.js";
import { cameraForRoom, cuboid, iso, polygon, type Projection } from "./isometric.js";

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
    type Entry={depth:number;paint:()=>void};
    const entries:Entry[]=[
      {depth:1.7,paint:()=>this.shelf(camera)},
      {depth:2.4,paint:()=>this.machine(camera,5.7,0.55,"soda",elapsedSeconds)},
      {depth:2.8,paint:()=>this.machine(camera,4.9,0.7,"candy",elapsedSeconds)},
      {depth:2.0,paint:()=>this.character(camera,1.18,0.74,"owner",elapsedSeconds)},
      {depth:3.15,paint:()=>this.counter(camera)},
      {depth:roomW+6,paint:()=>this.doorMarker(camera,s)}
    ];
    for (let i=0;i<pcCount(s);i++){
      const p=pcPosition(i);
      entries.push({depth:p.x+p.y,paint:()=>this.desk(camera,p,i,elapsedSeconds,online(s),s)});
    }
    for (const c of s.customers) {
      const seated=c.stage==="using";
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
    for(let y=0;y<6;y> for(let x=0;x<w;x++) {
      const ps=[iso({x,y},camera),iso({x:x+1,y},camera),iso({x:x+1,y:y+1},camera),iso({x,y:y+1},camera)];
      const tone=(x+y)%2===0?"#C4B7A8":"#B9AC9F";
      polygon(ctx,ps,tone,"#938579");
      if(y===4 && x>0 && x<w-1) {
        const c=iso({x:x+0.5,y:y+0.5},camera);
        ctx.fillStyle="rgba(100,83,77,0.10)";
        ctx.fillRect(c.x-4,c.y-2,8,4);
      }
    }
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
  }
  private desk(camera:Projection,p:Point,i:number,t:number,isOnline:boolean,s:GameState):void {
    const ctx=this.ctx;
    cuboid(ctx,camera,p.x-0.18,p.y-0.22,0.98,0.8,33,["#C69A70","#7E5B52","#9B6E51"]);
    cuboid(ctx,camera,p.x+0.22,p.y+0.02,0.42,0.2,62,["#253146","#10182A","#202E40"]);
    const screen=iso({x:p.x+0.64,y:p.y+0.11},camera,77);
    ctx.fillStyle=isOnline?(Math.floor(t*2+i)%2?"#8DE7E0":"#66AFEA"):"#6A6D79";
    ctx.fillRect(screen.x-9,screen.y-13,18,12);
    ctx.fillStyle="#C9CEDA";ctx.fillRect(screen.x-8,screen.y+1,16,2);
    const seat=iso({x:p.x+0.35,y:p.y+0.86},camera,25);
    ctx.fillStyle="#3B4863";ctx.beginPath();ctx.ellipse(seat.x,seat.y,18,8,0,0,Math.PI*2);ctx.fill();
    if(!s.customers.some(c=>c.pcIndex===i && c.stage==="using")) {
      ctx.fillStyle="#2D4864";ctx.fillRect(seat.x-13,seat.y-29,26,19);
    }
  }
  private character(camera:Projection,x:number,y:number,costume:string,t:number,seated=false):void {
    const ctx=this.ctx,base=iso({x,y},camera),z=camera.zoom,scale=seated?0.72:1;
    const height=52*z*scale;
    ctx.fillStyle="rgba(26,29,45,.3)";ctx.beginPath();ctx.ellipse(base.x,base.y,13*z,6*z,0,0,Math.PI*2);ctx.fill();
    const torso=costume==="owner"?"#277964":costume==="clown"?"#E6A240":costume==="vampire"?"#553D78":
      costume==="stitched-monster"?"#5F8D65":costume==="rabbit"?"#F4DEE0":costume==="mouse-mascot"?"#8F98A5":"#4B85A1";
    const face=costume==="stitched-monster"?"#93B685":costume==="vampire"?"#DEB1BB":"#E7BA92";
    const sway=seated?Math.sin(t*6)*2:Math.sin(t*5+x)*2.2;
    ctx.fillStyle="#22324A";
    if(!seated){ctx.fillRect(base.x-9*z,base.y-20*z,7*z,18*z);ctx.fillRect(base.x+3*z,base.y-20*z,7*z,18*z);}
    ctx.fillStyle=torso;ctx.fillRect(base.x-12*z,base.y-height+22*z,24*z,24*z);
    ctx.fillStyle=torso;ctx.fillRect(base.x-17*z,base.y-height+24*z+sway,6*z,18*z);
    ctx.fillRect(base.x+11*z,base.y-height+24*z-sway,6*z,18*z);
    ctx.fillStyle=face;ctx.beginPath();ctx.ellipse(base.x,base.y-height+13*z,11*z,13*z,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=costume==="owner"?"#30262D":costume==="clown"?"#EA4D5E":"#3A293C";
    ctx.fillRect(base.x-11*z,base.y-height-1*z,22*z,6*z);
    if(costume==="rabbit") {
      ctx.fillStyle="#F7E7E9";ctx.fillRect(base.x-9*z,base.y-height-23*z,6*z,21*z);
      ctx.fillRect(base.x+4*z,base.y-height-25*z,6*z,23*z);
    }
    if(costume==="mouse-mascot") {
      ctx.fillStyle="#9DA6B1";ctx.beginPath();ctx.arc(base.x-12*z,base.y-height+1*z,7*z,0,Math.PI*2);ctx.arc(base.x+12*z,base.y-height+1*z,7*z,0,Math.PI*2);ctx.fill();
    }
    if(costume==="vampire") {ctx.fillStyle="#1C2037";ctx.fillRect(base.x-4*z,base.y-height+19*z,8*z,2*z);}
    ctx.fillStyle="#1F2A3B";ctx.fillRect(base.x-5*z,base.y-height+12*z,2*z,2*z);
    ctx.fillRect(base.x+4*z,base.y-height+12*z,2*z,2*z);
    if(costume==="owner")
      this.heroHitbox={x:base.x-20,y:base.y-height-12,width:40,height:height+18};
  }
  private customer(camera:Projection,c:Customer,t:number,seated:boolean):void {
    let x=c.x,y=c.y;
    if(seated && c.pcIndex!==null){
      const p=pcPosition(c.pcIndex);x=p.x+0.33;y=p.y+0.72;
    }
    this.character(camera,x,y,c.costume,t+0.4*c.id,seated);
    if(c.stage==="waiting") {
      const p=iso({x,y},camera,66);
      this.ctx.fillStyle="#FFF0B2";this.ctx.font="bold 16px sans-serif";
      this.ctx.fillText("?",p.x,p.y);
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
    const p=iso({x:w*0.72,y:0},camera,157);
    this.ctx.fillStyle="#694D63";this.ctx.fillRect(p.x-79,p.y-21,158,29);
    this.ctx.fillStyle="#FFF0CF";this.ctx.font="bold 14px system-ui,sans-serif";
    this.ctx.textAlign="center";this.ctx.fillText("LAN HOUSE SIMULATOR",p.x,p.y-2);this.ctx.textAlign="start";
  }
  private hudInside(ctx:CanvasRenderingContext2D,s:GameState):void {
    ctx.fillStyle="rgba(15,25,43,.88)";ctx.fillRect(18,526,395,64);
    ctx.fillStyle="#FFECCB";ctx.font="bold 14px system-ui,sans-serif";
    ctx.fillText("Clique no proprietário atrás do balcão",31,552);
    ctx.fillStyle="#B6D9DF";ctx.font="12px system-ui,sans-serif";
    ctx.fillText("Clientes: "+s.customers.length+"   |   PCs: "+pcCount(s)+"   |   Internet: "+(online(s)?"online":"offline"),31,575);
  }
}
