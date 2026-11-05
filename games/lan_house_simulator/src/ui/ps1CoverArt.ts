/** Deterministic procedural covers for the fictional PlayStation 1 catalogue.
 * This UI-only module neither changes the simulation nor requires downloads.
 * PNG data URLs are compatible with Angular's image sanitizer and site CSP. */
export interface Ps1CoverDisc {
 readonly id:string;readonly title:string;readonly genre:string;
 readonly releaseYear?:number;
}
const cache=new Map<string,string>();
const W=420,H=560;
type Point=readonly [number,number];
const THEMES:Record<string,readonly [string,string,string]>={
 "turbo-circuito":["#100d38","#fb4e8b","#ffec90"],
 "gol-de-rua":["#062b3c","#2ad9a3","#ffe193"],
 "ilha-dos-cristais":["#112b5b","#8a7eff","#a0ffef"],
 "luta-neon":["#160c38","#ff467e","#45e9f8"],
 "cosmo-blocos":["#111e4f","#9f5bff","#f7d65a"],
 "rally-do-deserto":["#572c35","#d67839","#ffe2a1"],
 "sombras-do-castelo":["#141e40","#7762a2","#dde3ff"],
 "defensores-do-espaco":["#061e4b","#4276b8","#96faff"],
 "selva-perdida":["#133934","#3e9760","#f7e7a2"],
 "dragoes-de-aco":["#2c233d","#ba5976","#eebc95"],
 "ritmo-da-cidade":["#211744","#c4479c","#79f6ff"],
 "agentes-da-noite":["#111d35","#346b7a","#d9f9f3"],
 "oceano-profundo":["#062b4f","#178e9e","#a9f8e6"]
};
const TITLES:Record<string,readonly string[]>={
 "turbo-circuito":["TURBO","CIRCUITO"],
 "gol-de-rua":["GOL DE","RUA"],
 "ilha-dos-cristais":["ILHA DOS","CRISTAIS"],
 "luta-neon":["LUTA","NEON"],
 "cosmo-blocos":["COSMO","BLOCOS"],
 "rally-do-deserto":["RALLY DO","DESERTO"],
 "sombras-do-castelo":["SOMBRAS DO","CASTELO"],
 "defensores-do-espaco":["DEFENSORES","DO ESPAÇO"],
 "selva-perdida":["SELVA","PERDIDA"],
 "dragoes-de-aco":["DRAGÕES","DE AÇO"],
 "ritmo-da-cidade":["RITMO DA","CIDADE"],
 "agentes-da-noite":["AGENTES","DA NOITE"],
 "oceano-profundo":["OCEANO","PROFUNDO"]
};
function path(ctx:CanvasRenderingContext2D,points:readonly Point[],color:string):void{
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]!);
 for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.closePath();ctx.fill();
}
function line(ctx:CanvasRenderingContext2D,points:readonly Point[],color:string,width=3):void{
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...points[0]!);
 for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.stroke();
}
function circle(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string):void{
 ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}
function random(seed:number):()=>number{
 let state=seed>>>0;
 return ()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
}
function seed(text:string):number{
 let s=2166136261;
 for(const c of text)s=Math.imul(s^c.charCodeAt(0),16777619);
 return s>>>0;
}
function race(ctx:CanvasRenderingContext2D):void{
 circle(ctx,308,146,78,"#ff6d90");
 for(let i=0;i<12;i++)line(ctx,[[0,110+i*27],[420,15+i*11]],"#6e5ad766",2);
 path(ctx,[[190,199],[248,199],[453,462],[-36,462]],"#1b214b");
 line(ctx,[[190,199],[-36,462]],"#f74fbb",8);
 line(ctx,[[248,199],[453,462]],"#f74fbb",8);
 for(let i=0;i<5;i++){
  const t=(i+1)/6,y=199+t*t*255,size=4+t*15;
  path(ctx,[[218-size/3,y],[222+size/3,y],[230+size,y+size*2],[206-size,y+size*2]],"#fff2a5");
 }
 path(ctx,[[94,330],[126,294],[293,294],[338,330],[364,397],[74,397]],"#1d173a");
 path(ctx,[[125,303],[168,259],[266,259],[302,303]],"#87f3ed");
 path(ctx,[[89,333],[337,333],[355,378],[73,378]],"#f33382");
 path(ctx,[[115,345],[175,345],[168,365],[103,365]],"#fff3af");
 path(ctx,[[254,345],[315,345],[328,365],[260,365]],"#fff3af");
 for(const x of [106,305])circle(ctx,x,394,25,"#0b0a24");
 line(ctx,[[193,319],[239,319]],"#fad5ef",6);
}
function soccer(ctx:CanvasRenderingContext2D):void{
 circle(ctx,309,134,87,"#ffe28a");
 for(let i=0;i<11;i++){
  const x=i*44;
  ctx.fillStyle=i%3===0?"#103e54":"#19506a";
  ctx.fillRect(x,200+(i%4)*-20,42,180);
  for(let j=0;j<4;j++){ctx.fillStyle="#ffdf9655";ctx.fillRect(x+9,220+j*32,9,8);}
 }
 path(ctx,[[0,347],[420,309],[420,460],[0,460]],"#158b68");
 for(let i=0;i<4;i++)line(ctx,[[0,370+i*25],[420,331+i*22]],"#b3ffd666",2);
 line(ctx,[[40,210],[181,197],[194,337],[39,354],[40,210]],"#dcf8ee",8);
 for(let i=1;i<6;i++)line(ctx,[[40+i*25,208-i*2],[40+i*25,351-i*3]],"#cfffe055",2);
 line(ctx,[[40,236],[185,221]],"#cfffe077",2);
 circle(ctx,281,330,84,"#f6f1e5");
 path(ctx,[[280,281],[316,305],[303,350],[259,350],[246,305]],"#14233a");
 for(let a=0;a<5;a++){
  const angle=a*Math.PI*2/5;
  const x=281+Math.cos(angle)*67,y=330+Math.sin(angle)*67;
  line(ctx,[[281+Math.cos(angle)*34,330+Math.sin(angle)*34],[x,y]],"#183446",11);
 }
 line(ctx,[[228,320],[194,302],[174,260]],"#e8ffba",5);
}
function island(ctx:CanvasRenderingContext2D):void{
 circle(ctx,320,140,65,"#e7d0ff");
 path(ctx,[[0,350],[104,227],[161,304],[233,190],[337,350],[420,256],[420,465],[0,465]],"#233c75");
 path(ctx,[[0,393],[113,317],[180,377],[263,283],[420,369],[420,469],[0,469]],"#3c4c96");
 for(let i=0;i<6;i++)line(ctx,[[i*87-25,410+i%2*10],[i*87+61,409+i%2*10]],"#7be7f2aa",4);
 for(const [x,y,size] of [[92,334,57],[199,288,94],[307,353,69]] as const){
  path(ctx,[[x,y-size],[x+size*.4,y-size*.3],[x+size*.28,y+size*.6],
   [x-size*.25,y+size*.5],[x-size*.42,y-size*.2]],"#8bf7e6");
  path(ctx,[[x,y-size],[x+size*.4,y-size*.3],[x,y+size*.25]],"#e2caff");
  path(ctx,[[x,y-size],[x-size*.42,y-size*.2],[x-size*.25,y+size*.5],[x,y+size*.25]],"#54a7e4");
  circle(ctx,x,y-size*.12,size*.1,"#ffffff");
 }
}
function fighter(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,color:string,flip:number):void{
 ctx.save();ctx.translate(x,y);ctx.scale(scale*flip,scale);
 ctx.shadowColor=color;ctx.shadowBlur=19;
 circle(ctx,-1,-100,22,color);
 path(ctx,[[-26,-76],[21,-74],[31,-8],[-33,-5]],color);
 path(ctx,[[-22,-3],[-42,73],[-18,81],[8,20],[26,78],[51,72],[25,-8]],color);
 path(ctx,[[18,-66],[57,-86],[94,-79],[90,-61],[49,-58],[26,-29]],color);
 path(ctx,[[-28,-69],[-57,-37],[-77,-42],[-65,-57],[-40,-86]],color);
 ctx.restore();
}
function combat(ctx:CanvasRenderingContext2D):void{
 circle(ctx,204,190,118,"#52318a");
 for(let i=0;i<10;i++){
  const x=i*47;line(ctx,[[x,345],[210+(x-210)*2,445]],"#74e6eb66",2);
 }
 for(let i=0;i<7;i++)line(ctx,[[0,346+i*i*3],[420,346+i*i*3]],"#74e6eb88",2);
 fighter(ctx,121,331,1.04,"#ff5a9d",1);
 fighter(ctx,305,335,1.04,"#5df8ff",-1);
 path(ctx,[[213,141],[184,210],[217,207],[197,280],[261,191],[228,195],[251,141]],"#ffe18b");
}
function blocks(ctx:CanvasRenderingContext2D):void{
 circle(ctx,314,142,76,"#6e62d9");circle(ctx,325,128,43,"#a88cf6");
 ctx.save();ctx.translate(218,284);ctx.rotate(-.16);
 const cell=48;const pieces=[
  {x:-3,y:0,c:"#ff709e",p:[[0,0],[1,0],[2,0],[1,1]]},
  {x:1,y:-1,c:"#74f5ef",p:[[0,0],[0,1],[1,1],[2,1]]},
  {x:-2,y:3,c:"#ffe683",p:[[0,0],[1,0],[0,1],[1,1]]},
  {x:1,y:3,c:"#ae86ff",p:[[1,0],[2,0],[0,1],[1,1]]}
 ];
 for(const piece of pieces)for(const [dx,dy] of piece.p){
  const x=(piece.x+dx)*cell,y=(piece.y+dy)*cell;
  ctx.fillStyle=piece.c;ctx.fillRect(x,y,cell-4,cell-4);
  ctx.fillStyle="#ffffff77";ctx.fillRect(x+5,y+5,cell-14,6);
  ctx.strokeStyle="#13214c";ctx.lineWidth=4;ctx.strokeRect(x,y,cell-4,cell-4);
 }
 ctx.restore();
}

/** Motivos geométricos próprios para os oito lançamentos anuais adicionais. */
function annualArt(ctx:CanvasRenderingContext2D,id:string):void{
 switch(id){
 case "rally-do-deserto":{
  circle(ctx,322,132,83,"#ffe5a8");
  path(ctx,[[0,295],[105,238],[216,294],[335,212],[420,282],[420,458],[0,458]],"#db9555");
  path(ctx,[[0,363],[153,294],[260,342],[420,276],[420,468],[0,468]],"#b76c4b");
  path(ctx,[[171,247],[234,247],[388,459],[34,459]],"#685260");
  line(ctx,[[171,247],[34,459]],"#f5cc87",8);line(ctx,[[234,247],[388,459]],"#f5cc87",8);
  path(ctx,[[91,348],[132,301],[275,301],[327,348],[340,388],[79,388]],"#367e94");
  path(ctx,[[135,305],[167,272],[247,272],[279,305]],"#a8e9d8");
  for(const x of [105,309])circle(ctx,x,391,23,"#25243b");
  line(ctx,[[120,348],[156,348]],"#fff2bc",9);break;
 }
 case "sombras-do-castelo":{
  circle(ctx,315,133,75,"#eaedff");
  for(const [x,h] of [[25,190],[117,150],[205,212],[310,177]] as const){
   path(ctx,[[x,410],[x,h],[x+26,h-47],[x+52,h],[x+52,410]],"#172443");
   path(ctx,[[x+14,h+36],[x+26,h+18],[x+37,h+36],[x+37,h+83],[x+14,h+83]],"#ffe1a3");
  }
  path(ctx,[[0,408],[420,408],[420,465],[0,465]],"#272948");
  path(ctx,[[168,400],[187,331],[206,318],[230,340],[245,400]],"#7b9bbb");
  circle(ctx,208,315,23,"#c3d6df");line(ctx,[[220,345],[285,302]],"#f4db9a",9);
  break;
 }
 case "defensores-do-espaco":{
  circle(ctx,331,130,88,"#6e8cda");circle(ctx,313,115,53,"#9dcbf5");
  for(let i=0;i<17;i++)circle(ctx,22+(i*103)%376,55+(i*73)%303,2+(i%3),"#dcf9ff");
  path(ctx,[[210,193],[254,302],[361,375],[254,363],[212,408],[168,363],[61,375],[168,302]],"#72d3de");
  path(ctx,[[210,205],[229,320],[210,384],[191,320]],"#d1f5fd");
  path(ctx,[[163,358],[184,386],[160,442]],"#ffb2a1");
  path(ctx,[[237,386],[256,358],[260,442]],"#ffb2a1");
  for(const x of [80,323]){path(ctx,[[x,231],[x+29,252],[x+5,269],[x-23,252]],"#f7a6c1");}
  break;
 }
 case "selva-perdida":{
  circle(ctx,316,137,81,"#f8edaa");
  for(let i=0;i<7;i++){
   const x=-18+i*73;
   path(ctx,[[x,73],[x+70,45],[x+115,115],[x+43,162]],i%2?"#1b5b43":"#267e5b");
   line(ctx,[[x+43,58],[x+43,360]],"#1b473e",12);
  }
  path(ctx,[[0,375],[78,299],[141,346],[209,250],[279,348],[359,301],[420,356],[420,458],[0,458]],"#194d42");
  path(ctx,[[142,346],[159,279],[207,253],[253,284],[269,346]],"#baae86");
  path(ctx,[[175,308],[230,308],[235,346],[170,346]],"#294a50");
  path(ctx,[[0,412],[420,412],[420,466],[0,466]],"#347f5a");
  break;
 }
 case "dragoes-de-aco":{
  circle(ctx,301,125,88,"#efac9b");
  path(ctx,[[20,322],[123,245],[187,305],[267,212],[411,299],[355,351],[284,323],[213,364],[157,332],[77,380]],"#a9bdca");
  path(ctx,[[120,289],[171,201],[236,242],[255,318],[197,384],[143,350]],"#687f9d");
  path(ctx,[[236,250],[294,217],[357,240],[385,276],[346,304],[285,283]],"#b4c8c9");
  circle(ctx,350,253,8,"#ffe4af");
  path(ctx,[[176,344],[186,419],[209,445],[240,415],[263,344]],"#7084a8");
  for(const x of [35,95,323])line(ctx,[[x,435],[x+34,395]],"#eb866e",5);
  break;
 }
 case "ritmo-da-cidade":{
  circle(ctx,312,131,84,"#ef8bd1");
  for(let i=0;i<14;i++){
   const h=55+(i*51)%169,x=5+i*30;
   ctx.fillStyle=i%2?"#82e9ec":"#ffbc9e";ctx.fillRect(x,385-h,19,h);
  }
  path(ctx,[[82,248],[338,248],[357,393],[67,393]],"#1d2552");
  path(ctx,[[95,261],[326,261],[332,380],[90,380]],"#56648c");
  for(const x of [148,279]){
   circle(ctx,x,326,48,"#101c44");circle(ctx,x,326,29,"#88e4ed");circle(ctx,x,326,13,"#d4b2f6");
  }
  line(ctx,[[194,281],[239,281]],"#f6d6fa",10);break;
 }
 case "agentes-da-noite":{
  circle(ctx,326,135,80,"#b5f2e9");
  for(let i=0;i<10;i++){
   const x=i*47,h=135+(i*37)%129;
   ctx.fillStyle=i%2?"#172f49":"#203c50";ctx.fillRect(x,445-h,43,h);
   for(let j=0;j<3;j++){ctx.fillStyle="#ffdd9f77";ctx.fillRect(x+11,450-h+j*30,8,12);}
  }
  path(ctx,[[0,425],[420,425],[420,467],[0,467]],"#112a3e");
  path(ctx,[[165,403],[175,350],[194,323],[216,329],[227,405]],"#86a7b8");
  circle(ctx,198,318,23,"#a3c8cb");
  path(ctx,[[166,304],[183,271],[210,271],[229,304]],"#1d3447");
  line(ctx,[[242,340],[341,283]],"#c7f5eb",6);
  break;
 }
 case "oceano-profundo":{
  circle(ctx,334,134,82,"#56aec8");
  for(let i=0;i<20;i++)circle(ctx,27+(i*57)%364,67+(i*113)%307,2+i%4,"#b9fff199");
  path(ctx,[[0,397],[67,354],[154,397],[253,349],[339,399],[420,355],[420,465],[0,465]],"#186c78");
  path(ctx,[[106,278],[151,236],[280,236],[324,278],[316,326],[114,326]],"#f4cd77");
  path(ctx,[[144,242],[180,211],[243,211],[279,242]],"#9bf3e2");
  for(const x of [171,246]){circle(ctx,x,286,29,"#1d677f");circle(ctx,x,286,18,"#8de5e5");}
  path(ctx,[[322,276],[374,255],[374,343],[317,329]],"#d9a96e");
  for(const [x,y] of [[38,239],[359,195],[332,368]] as const){
   path(ctx,[[x-22,y],[x,y-13],[x+21,y],[x,y+13]],"#b7e5b2");
  }
  break;
 }
 }
}

function paint(ctx:CanvasRenderingContext2D,disc:Ps1CoverDisc):void{
 const colors=THEMES[disc.id]??["#171c3f","#6fa6dc","#ffd87f"];
 const gradient=ctx.createLinearGradient(0,0,420,560);
 gradient.addColorStop(0,colors[0]);gradient.addColorStop(.68,colors[1]);gradient.addColorStop(1,colors[0]);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 const rng=random(seed(disc.id));
 for(let i=0;i<85;i++){
  ctx.globalAlpha=.13+rng()*.51;
  circle(ctx,12+rng()*396,55+rng()*380,.6+rng()*2.1,colors[2]);
 }
 ctx.globalAlpha=1;
 switch(disc.id){
  case "turbo-circuito":race(ctx);break;
  case "gol-de-rua":soccer(ctx);break;
  case "ilha-dos-cristais":island(ctx);break;
  case "luta-neon":combat(ctx);break;
  case "cosmo-blocos":blocks(ctx);break;
  default:annualArt(ctx,disc.id);
 }
 const panel=ctx.createLinearGradient(0,380,0,560);
 panel.addColorStop(0,"#0d173700");panel.addColorStop(.23,"#071126ed");panel.addColorStop(1,"#060b1e");
 ctx.fillStyle=panel;ctx.fillRect(0,380,420,180);
 ctx.fillStyle="#080e20e8";ctx.fillRect(0,0,420,46);
 ctx.fillStyle="#e7f1fc";ctx.font="bold 18px Arial, sans-serif";
 ctx.fillText("SOFTDOWN",20,28);
 ctx.fillStyle=colors[2];ctx.font="bold 12px Arial, sans-serif";
 ctx.textAlign="right";ctx.fillText("CD-ROM · "+(disc.releaseYear??2002),400,28);ctx.textAlign="left";
 const lines=TITLES[disc.id]??[disc.title.toLocaleUpperCase("pt-BR")];
 ctx.textBaseline="top";
 ctx.shadowColor="#000b";ctx.shadowBlur=5;
 for(let i=0;i<lines.length;i++){
  const value=lines[i]??"";
  ctx.fillStyle=i===0?"#ffffff":colors[2];
  ctx.font="900 48px Arial, sans-serif";
  const width=ctx.measureText(value).width;
  ctx.save();ctx.translate(22,411+i*53);
  if(width>375)ctx.scale(375/width,1);
  ctx.fillText(value,0,0);
  ctx.restore();
 }
 ctx.shadowBlur=0;
 ctx.fillStyle="#cddbeb";ctx.font="bold 11px Arial, sans-serif";
 ctx.fillText(disc.genre.toLocaleUpperCase("pt-BR")+"  ·  EDIÇÃO ORIGINAL",22,534);
 ctx.strokeStyle="#d9eafb99";ctx.lineWidth=6;ctx.strokeRect(3,3,414,554);
}
/** Build a cached PNG that both Angular and the native DOM can render. */
export function ps1ProceduralCover(disc:Ps1CoverDisc,doc?:Pick<Document,"createElement">):string{
 const safeId=/^[a-z0-9-]+$/.test(disc.id)?disc.id:"cosmo-blocos";
 const fallback="assets/ps1/covers/"+safeId+".svg";
 const key=disc.id+"\u0000"+disc.title+"\u0000"+disc.genre+"\u0000"+(disc.releaseYear??2002);
 const saved=cache.get(key);if(saved)return saved;
 const target=doc??(typeof document!=="undefined"?document:undefined);
 if(!target)return fallback;
 try{
  const canvas=target.createElement("canvas") as HTMLCanvasElement;
  if(typeof canvas.getContext!=="function"||typeof canvas.toDataURL!=="function")return fallback;
  canvas.width=W;canvas.height=H;
  const context=canvas.getContext("2d");if(!context)return fallback;
  paint(context,disc);
  const cover=canvas.toDataURL("image/png");
  if(!cover.startsWith("data:image/png;base64,"))return fallback;
  cache.set(key,cover);return cover;
 }catch{return fallback;}
}
