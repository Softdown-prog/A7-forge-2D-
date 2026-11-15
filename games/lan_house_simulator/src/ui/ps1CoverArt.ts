/** Deterministic procedural covers for the fictional PlayStation 1 catalogue.
 * This UI-only module neither changes the simulation nor requires downloads.
 * PNG data URLs are compatible with Angular's image sanitizer and site CSP. */
import {circle} from "./ps1Covers/primitives.js";
import {PS1_COVER_DRAWINGS} from "./ps1Covers/registry.js";

export interface Ps1CoverDisc {
 readonly id:string;readonly title:string;readonly genre:string;
 readonly releaseYear?:number;
}
const cache=new Map<string,string>();
const W=420,H=560;
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
function random(seed:number):()=>number{
 let state=seed>>>0;
 return ()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
}
function seed(text:string):number{
 let s=2166136261;
 for(const c of text)s=Math.imul(s^c.charCodeAt(0),16777619);
 return s>>>0;
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
 const art=PS1_COVER_DRAWINGS[disc.id];
 if(typeof art==="function")art(ctx);
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
