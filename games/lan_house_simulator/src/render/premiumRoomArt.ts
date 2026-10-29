import {iso,polygon,type Projection} from "./isometric.js";
import type {PosterPlacement} from "./posterArt.js";

export const EXCLUSIVE_POSTER_TITLES=["NOITE PIXEL","CORRIDA LUNAR","CASTELO DIGITAL"] as const;
export type PremiumPosterIndex=0|1|2;

/** Desenho puro: nenhuma modificação da planta ou da geometria usada pela IA. */
export function premiumCheckerPatch(
 ctx:CanvasRenderingContext2D,cam:Projection,x:number,y:number
):void{
 const at=(dx:number,dy:number,z=0.4)=>iso({x:x+dx,y:y+dy},cam,z);
 const rect=(ax:number,ay:number,bx:number,by:number,color:string)=>{
  polygon(ctx,[at(ax,ay),at(bx,ay),at(bx,by),at(ax,by)],color);
 };
 // Revestimento real, 3x3 placas finas por célula. Material escuro/porcelanato,
 // linhas leves de rejunte e diagonais iluminadas a cada quatro placas.
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const n=(x*3+col+y*3+row)&1;
  const bright=n===0;
  rect(col/3,row/3,(col+1)/3,(row+1)/3,bright?"#dad6c9":"#252d39");
  const a=at(col/3+.026,row/3+.025),b=at((col+1)/3-.028,row/3+.025);
  ctx.strokeStyle=bright?"rgba(255,255,255,.38)":"rgba(133,216,224,.17)";
  ctx.lineWidth=.9*cam.zoom;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  if((col+row)%4===0){
   const u=at(col/3+.09,row/3+.13),v=at(col/3+.25,row/3+.22);
   ctx.strokeStyle="rgba(79,216,213,.25)";
   ctx.lineWidth=.7*cam.zoom;ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(v.x,v.y);ctx.stroke();
  }
 }
 const edge=[
  at(0,0),at(1,0),at(1,1),at(0,1)
 ];
 polygon(ctx,edge,"rgba(0,0,0,0)","rgba(83,205,198,.26)");
}

/** 96x112: ilustrações originais de coleção fictícia, sem marcas terceiras.
 * Desenhadas no Canvas, inclusive letras, brilho, moldura e reflexão. */
export function drawPremiumPosterPlate(c:CanvasRenderingContext2D,index:PremiumPosterIndex):void{
 const neon=["#6df0e2","#f9b0eb","#ffcd74"][index],
      accent=["#ff80bd","#7de0ff","#a993ff"][index];
 const base=["#081e2e","#171337","#221a3b"][index];
 const rad=(x:number,y:number,r:number,color:string)=>{
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
 };
 const line=(pts:number[][],color:string,w=1)=>{
  c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x!,y!):c.moveTo(x!,y!));
  c.strokeStyle=color;c.lineWidth=w;c.stroke();
 };
 c.save();c.lineJoin="round";c.lineCap="round";
 c.fillStyle="#0a1821";c.fillRect(0,0,96,112);
 // Moldura de metal anodizado e espelho sob o vidro.
 let caseGrad=c.createLinearGradient(0,0,96,112);
 caseGrad.addColorStop(0,"#cbdbe4");caseGrad.addColorStop(.27,"#506576");
 caseGrad.addColorStop(.65,"#253749");caseGrad.addColorStop(1,"#a4b7c8");
 c.fillStyle=caseGrad;c.fillRect(1.2,1,93.6,110);
 c.fillStyle="#050d17";c.fillRect(5,5,86,102);
 const sky=c.createLinearGradient(0,8,0,83);
 sky.addColorStop(0,base);sky.addColorStop(.68,["#264661","#48255f","#5c315d"][index]!);
 sky.addColorStop(1,["#ef7999","#d578a9","#df866f"][index]!);
 c.fillStyle=sky;c.fillRect(7,7,82,77);
 c.save();c.beginPath();c.rect(7,7,82,76);c.clip();
 for(let i=0;i<18;i++){
  let x=11+((i*31+index*13)%75),y=11+((i*19+index*7)%40);
  rad(x,y,i%5===0?1.05:.48,i%4===0?neon:"#e7f6ff");
 }
 if(index===0){
  // Cidade cyberpunk, horizonte e uma estrada arcade em perspectiva.
  rad(69,29,15,"#ffc5d8");rad(69,29,11,"#ffdcdb");
  for(const [x,y,w] of [[8,43,8],[17,29,10],[29,39,9],[39,24,12],[53,40,8],[63,37,10],[75,32,14]]){
   c.fillStyle="#101b34";c.fillRect(x,y,w,83-y);
   for(let n=0;n<3;n++){c.fillStyle=(n+x)%2?neon:"#ef8fae";c.fillRect(x+2+(n%2)*3,y+7+n*9,1.4,3);}
  }
  line([[48,53],[17,83]],neon,1.5);line([[48,53],[79,83]],neon,1.5);
  for(let y=61;y<84;y+=5)line([[10,y],[86,y]],"rgba(114,246,231,.43)",.8);
  // Cabine angular de uma nave/táxi futurista.
  c.fillStyle="#fc8eb0";c.beginPath();c.moveTo(35,70);c.lineTo(44,61);c.lineTo(55,61);c.lineTo(64,70);c.lineTo(67,79);c.lineTo(31,79);c.closePath();c.fill();
  c.fillStyle="#12314c";c.fillRect(40,64,18,7);
  line([[34,73],[63,73]],"#fff2d6",1.5);rad(36,80,2.5,"#a3faff");rad(62,80,2.5,"#a3faff");
 }else if(index===1){
  // Órbita espacial com circuito, astros facetados e piloto robô.
  rad(70,25,14,"#e4bbea");rad(70,25,10,"#7c65c8");
  c.strokeStyle=neon;c.lineWidth=2;c.beginPath();c.ellipse(55,36,39,14,-.5,0,Math.PI*2);c.stroke();
  c.strokeStyle="rgba(249,175,235,.5)";c.lineWidth=1;c.beginPath();c.ellipse(55,36,44,18,-.4,0,Math.PI*2);c.stroke();
  line([[8,73],[34,51],[55,70],[88,48]],"#7de8f5",4);
  line([[8,76],[34,54],[55,73],[88,51]],"#203553",5);
  // Corrida espacial com motor e foguete próprios.
  c.fillStyle="#f5e6d1";c.beginPath();c.moveTo(34,40);c.lineTo(48,26);c.lineTo(62,40);c.lineTo(57,65);c.lineTo(39,65);c.closePath();c.fill();
  c.fillStyle="#e67fbe";c.beginPath();c.moveTo(34,43);c.lineTo(24,60);c.lineTo(39,55);c.lineTo(57,55);c.lineTo(74,60);c.lineTo(62,43);c.closePath();c.fill();
  c.fillStyle="#264861";c.beginPath();c.ellipse(48,42,7,10,0,0,Math.PI*2);c.fill();
  rad(46,39,2,"#b8f9fe");
  line([[42,64],[39,79]],"#ffd07b",6);line([[54,64],[58,78]],"#91f2f5",5);
  rad(19,23,3,"#fffdcd");
 }else{
  // Castelo arcade e explorador com cajado enfrentando cristal flutuante.
  rad(72,25,18,"#edaaaf");rad(72,25,13,"#fbd6b6");
  c.fillStyle="#251c3e";
  c.beginPath();c.moveTo(7,76);c.lineTo(19,65);c.lineTo(33,72);c.lineTo(46,50);c.lineTo(58,65);c.lineTo(78,50);c.lineTo(90,70);c.lineTo(90,85);c.lineTo(7,85);c.closePath();c.fill();
  c.fillStyle="#3f3655";c.fillRect(34,30,20,53);c.fillRect(56,43,13,40);
  c.fillStyle="#2e2649";c.fillRect(38,21,12,14);c.fillRect(57,35,10,14);
  for(let x=34;x<=53;x+=8){c.fillStyle="#b48aa0";c.fillRect(x,27,4,5);}
  for(let x=57;x<=70;x+=8){c.fillStyle="#bc92a3";c.fillRect(x,40,4,5);}
  c.fillStyle="#0e1d39";c.beginPath();c.arc(45,72,7,Math.PI,0);c.lineTo(52,83);c.lineTo(38,83);c.closePath();c.fill();
  c.fillStyle="#ffe7af";c.fillRect(43,46,3,6);c.fillRect(59,59,3,6);
  // Herói estilizado e feixe mágico.
  rad(22,52,4.3,"#eec3a1");c.fillStyle="#72c2c2";c.fillRect(18,57,9,17);
  c.fillStyle="#32234d";c.fillRect(18,74,3,8);c.fillRect(25,74,3,8);
  line([[29,64],[37,39]],"#dec6a4",2.5);
  rad(37,38,4,neon);
  line([[39,38],[60,32],[77,41]],"#c5b0ff",1.8);
  c.fillStyle="#93f7e4";c.beginPath();c.moveTo(77,29);c.lineTo(85,40);c.lineTo(78,52);c.lineTo(69,40);c.closePath();c.fill();
  line([[77,29],[77,52]],"#e3ffff",1.5);
 }
 c.restore();
 // Base do pôster é editorialmente separada da arte.
 c.fillStyle=base;c.fillRect(7,82,82,24);
 c.fillStyle=neon;c.fillRect(9,84,78,1);
 const name=EXCLUSIVE_POSTER_TITLES[index].split(" ");
 c.fillStyle="#edfaff";c.textAlign="center";
 c.font="900 10px Arial,sans-serif";
 name.forEach((word,i)=>c.fillText(word,48,94+i*9.3,78));
 c.fillStyle=accent;c.fillRect(8,105,80,2);
 c.fillStyle="rgba(255,255,255,.23)";c.beginPath();c.moveTo(7,7);c.lineTo(37,7);c.lineTo(11,81);c.lineTo(7,81);c.closePath();c.fill();
 c.strokeStyle="rgba(226,255,255,.65)";c.lineWidth=.9;c.strokeRect(4,4,88,104);
 c.restore();
}

export function drawPremiumWallPoster(
 c:CanvasRenderingContext2D,cam:Projection,p:PosterPlacement,index:PremiumPosterIndex
):void{
 const l=p.axis==="y"?{x:p.x,y:p.y+p.span}:{x:p.x,y:p.y};
 const r=p.axis==="y"?{x:p.x,y:p.y}:{x:p.x+p.span,y:p.y};
 const a=iso(l,cam,p.top),b=iso(r,cam,p.top),d=iso(l,cam,p.top-p.height);
 c.save();c.transform((b.x-a.x)/96,(b.y-a.y)/96,(d.x-a.x)/112,(d.y-a.y)/112,a.x,a.y);
 c.fillStyle="rgba(6,12,21,.30)";c.fillRect(5,5,96,112);
 drawPremiumPosterPlate(c,index);c.restore();
}
