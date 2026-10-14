// Draws the production Canvas actor, optionally beside a compiled older module.
// Usage: node scripts/capture_actor_volume.mjs out/actor-volume [before.js]
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const output=resolve(process.argv[2]??"out/actor-volume");
const before=process.argv[3]?await readFile(resolve(process.argv[3]),"utf8"):null;
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",c=>reject(Error("Servidor: "+c)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1200,height:720}});
 const errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const result=await page.evaluate(async before=>{
  const {drawActor}=await import("./js/render/actorArt.js");
  let old;
  if(before){
   const code=before.replaceAll('"./isometric.js"',JSON.stringify(location.origin+"/js/render/isometric.js"));
   const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));
   old=(await import(url)).drawActor;URL.revokeObjectURL(url);
  }
  const directions=["south","east","north","west"],labels=["Frente","Perfil direito","Costas","Perfil esquerdo"];
  const kinds=["regular","owner","clown","vampire","stitched-monster","rabbit","mouse-mascot"];
  const title=(ctx,text,x,y,size=15)=>{ctx.fillStyle="#dce7bc";ctx.font=`600 ${size}px system-ui`;ctx.fillText(text,x,y);};
  function sheet(width,height,heading){
   const c=document.createElement("canvas");c.width=width;c.height=height;const ctx=c.getContext("2d");
   ctx.fillStyle="#192f2a";ctx.fillRect(0,0,width,height);title(ctx,heading,26,35,22);return {c,ctx};
  }
  const comparison=sheet(1040,510,old?"Mais corpo — mesmo personagem, mesma câmera":"Personagem integrado — quatro direções");
  for(let row=0;row<(old?2:1);row++){
   const draw=row===0&&old?old:drawActor;
   title(comparison.ctx,old?(row===0?"Antes":"Agora"):"Agora",26,95+row*210);
   for(let i=0;i<4;i++){
    const x=180+i*235,y=245+row*210;
    title(comparison.ctx,labels[i],x-70,70+row*210);
    draw(comparison.ctx,{originX:x,originY:y,zoom:1.95},{x:0,y:0,kind:"regular",id:2,time:0,pose:"idle",direction:directions[i]});
   }
  }
  const variants=sheet(880,1370,"Figurinos preservados — quatro direções");
  for(let k=0;k<kinds.length;k++){
   title(variants.ctx,kinds[k],22,80+k*182);
   for(let i=0;i<4;i++)drawActor(variants.ctx,{originX:185+i*205,originY:227+k*182,zoom:1.6},
    {x:0,y:0,kind:kinds[k],id:2,time:.3,pose:"idle",direction:directions[i]});
  }
  const poses=sheet(1020,760,"Animações — pés e assento nas mesmas âncoras");
  for(let row=0;row<3;row++){
   const pose=["walking","sitting","standing-up"][row];title(poses.ctx,pose,22,90+row*225);
   for(let i=0;i<4;i++)drawActor(poses.ctx,{originX:180+i*235,originY:246+row*225,zoom:1.85},
    {x:0,y:0,kind:"regular",id:2,time:.45,pose,direction:directions[i],transition:pose==="standing-up"?.5:1});
  }
  const test=document.createElement("canvas");test.width=200;test.height=160;const ctx=test.getContext("2d");
  const camera={originX:100,originY:140,zoom:1};let samples=0,maxWidth=0;
  function coverage(draw,direction){
   ctx.clearRect(0,0,200,160);draw(ctx,camera,{x:0,y:0,kind:"regular",id:2,time:0,pose:"idle",direction});
   const data=ctx.getImageData(79,88,43,30).data;let n=0;
   for(let i=3;i<data.length;i+=4)if(data[i]>127)n++;return n;
  }
  const torsoCoverage=directions.map(direction=>({direction,before:old?coverage(old,direction):null,after:coverage(drawActor,direction)}));
  for(const kind of kinds)for(const direction of directions)for(const pose of ["idle","walking","sitting","standing-up"])
   for(const transition of [0,.5,1]){
    ctx.clearRect(0,0,200,160);
    drawActor(ctx,camera,{x:0,y:0,kind,id:2,time:.45,pose,direction,transition});
    const data=ctx.getImageData(0,0,200,160).data;let count=0,minX=200,maxX=0;
    for(let y=0;y<160;y++)for(let x=0;x<200;x++)if(data[(y*200+x)*4+3]>127){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);}
    if(count<300||minX===0||maxX===199)throw Error("Ator vazio/cortado: "+JSON.stringify({kind,direction,pose,transition,count}));
    maxWidth=Math.max(maxWidth,maxX-minX);samples++;
   }
  return {comparison:comparison.c.toDataURL(),variants:variants.c.toDataURL(),poses:poses.c.toDataURL(),samples,maxWidth,torsoCoverage};
 },before);
 assert.equal(errors.length,0,errors.join("; "));
 for(const [key,file] of [["comparison","lhs_actor_volume_comparison.png"],["variants","lhs_actor_volume_four_directions.png"],["poses","lhs_actor_volume_poses.png"]])
  await writeFile(resolve(output,file),Buffer.from(result[key].split(",")[1],"base64"));
 const {comparison,variants,poses,...metrics}=result;
 if(before)for(const row of metrics.torsoCoverage)assert.ok(row.after>row.before,"Sem aumento de volume: "+JSON.stringify(row));
 await writeFile(resolve(output,"actor_volume_validation.json"),JSON.stringify(metrics,null,2)+"\n");console.log(JSON.stringify(metrics));
}finally{await browser?.close();server.kill();}
