// Captura quatro frames reais de cada trabalho + vídeo, sem alterar simulação.
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame} from "../dist/js/sim/engine.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {dispatchHiredStaff} from "../dist/js/sim/services.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";

const out=resolve(process.argv[2]??"out/worker-motion");
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",code=>fail(Error("Server exited: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1200,height:760}});
 const errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const shots=[];
 const sample=createGame(64,"historical");sample.cash=3000;
 sample.pcPoweredOff=[true,true,true];sample.binFill=[85,0];sample.pcWear=[100,0,0];
 hireEmployee(sample,"cleaner");hireEmployee(sample,"technician");dispatchHiredStaff(sample);
 const payroll=sample.employeePayrollAccrued;
 // Reposiciona apenas as cópias de teste: o desenho usa os jobs reais como entradas.
 for(const kind of ["cleaner","technician"]){
  const four=await page.evaluate(async ({state,kind})=>{
   const {SceneRenderer}=await import("./js/render/scene.js");
   const {cameraForGame,iso}=await import("./js/render/isometric.js");
   const {binSpots}=await import("./js/sim/services.js");
   const {pcPosition}=await import("./js/sim/engine.js");
   const {technicianWorkPoint,cleanerWorkPoint}=await import("./js/sim/staffWorksites.js");
   const frames=[],times=[0,.19,.38,.57];
   const directions=["south","east","north","west"];
   for(const direction of directions)for(const time of times){
    const s=structuredClone(state);
    const job=kind==="cleaner"?s.cleaningJob:s.repairJobs[0];
    const point=kind==="cleaner"?cleanerWorkPoint(binSpots(s)[0]):technicianWorkPoint(pcPosition(0,s));
    Object.assign(job,{x:point.x,y:point.y,phase:"working",moving:false,
     facing:direction,progress:kind==="cleaner"?5:12});
    if(kind==="cleaner")s.repairJobs=[];
    else s.cleaningJob=undefined;
    const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;
    const ctx=canvas.getContext("2d");new SceneRenderer(ctx).draw(s,time);
    const pos=iso(point,cameraForGame(s)),size=150;
    const snippet=document.createElement("canvas");snippet.width=260;snippet.height=220;
    const sc=snippet.getContext("2d");sc.fillStyle="#23393a";sc.fillRect(0,0,260,220);
    sc.drawImage(canvas,pos.x-size*.5,pos.y-165,180,185,40,16,180,185);
    frames.push({direction,time,png:snippet.toDataURL("image/png"),
     pixels:sc.getImageData(0,0,260,220).data});
   }
   const sheet=document.createElement("canvas");sheet.width=1040;sheet.height=880;
   const ctx=sheet.getContext("2d");ctx.fillStyle="#203838";ctx.fillRect(0,0,1040,880);
   let differences=0;
   for(let i=0;i<frames.length;i++){
    const f=frames[i],x=(i%4)*260,y=Math.floor(i/4)*220;
    const img=new Image();img.src=f.png;await img.decode();
    ctx.drawImage(img,x,y);
    ctx.fillStyle="#EBDDA9";ctx.font="bold 13px system-ui";
    ctx.fillText(f.direction+" · "+f.time.toFixed(2)+"s",x+12,y+18);
    if(i%4>0){
     const before=frames[i-1].pixels,after=f.pixels;
     for(let j=0;j<after.length;j+=4)
      if(Math.abs(after[j]-before[j])+Math.abs(after[j+1]-before[j+1])+
       Math.abs(after[j+2]-before[j+2])>45)differences++;
    }
   }
   return {png:sheet.toDataURL("image/png"),differences};
  },{state:sample,kind});
  assert.ok(four.differences>200,kind+" deve ter movimento de ferramenta e mãos visível");
  await writeFile(resolve(out,kind+"_work_four_directions.png"),Buffer.from(four.png.split(",")[1],"base64"));
  shots.push({kind,differences:four.differences});
 }
 // Ampliação máxima: efeitos reais de contato legíveis também com zoom reduzido.
 const small=await page.evaluate(async state=>{
  const {SceneRenderer}=await import("./js/render/scene.js");
  const {cameraForGame}=await import("./js/render/isometric.js");
  const {binSpots}=await import("./js/sim/services.js");
  const {pcPosition}=await import("./js/sim/engine.js");
  const {cleanerWorkPoint,technicianWorkPoint}=await import("./js/sim/staffWorksites.js");
  const s=structuredClone(state);
  s.roomExtensions={north:6,south:0,east:6,west:6};
  const zoom=cameraForGame(s).zoom;
  const bin=cleanerWorkPoint(binSpots(s)[0]),pc=technicianWorkPoint(pcPosition(0,s));
  Object.assign(s.cleaningJob,{...bin,phase:"working",moving:false,progress:4,binIndex:0,facing:"south"});
  Object.assign(s.repairJobs[0],{...pc,phase:"working",moving:false,progress:10,facing:"north"});
  const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;
  const ctx=canvas.getContext("2d"),draw=new SceneRenderer(ctx);
  draw.draw(s,.10);const first=ctx.getImageData(0,0,1000,610).data.slice();
  draw.draw(s,.34);const second=ctx.getImageData(0,0,1000,610).data;
  let changed=0;
  for(let i=0;i<first.length;i+=4)
   if(Math.abs(first[i]-second[i])+Math.abs(first[i+1]-second[i+1])+Math.abs(first[i+2]-second[i+2])>50)changed++;
  return {zoom,changed,png:canvas.toDataURL("image/png")};
 },sample);
 assert.ok(small.zoom<.7,"a vista deve verificar câmera afastada");
 assert.ok(small.changed>50,"movimento de trabalho deve permanecer visível no zoom mínimo: "+small.changed);
 await writeFile(resolve(out,"worker_contact_small_zoom.png"),
  Buffer.from(small.png.split(",")[1],"base64"));
 shots.push({kind:"small-zoom",differences:small.changed,zoom:small.zoom});
 // Vídeo de validação real com os dois personagens trabalhando no Canvas.
 const movieCtx=await browser.newContext({viewport:{width:1000,height:610},
  recordVideo:{dir:out,size:{width:1000,height:610}}});
 const movie=await movieCtx.newPage();
 await movie.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 await movie.evaluate(async state=>{
  const {SceneRenderer}=await import("./js/render/scene.js");
  const {binSpots}=await import("./js/sim/services.js");
  const {pcPosition}=await import("./js/sim/engine.js");
  const {technicianWorkPoint,cleanerWorkPoint}=await import("./js/sim/staffWorksites.js");
  const s=structuredClone(state);
  const b=cleanerWorkPoint(binSpots(s)[0]),pc=technicianWorkPoint(pcPosition(0,s));
  Object.assign(s.cleaningJob,{x:b.x,y:b.y,phase:"working",progress:5,facing:"south",moving:false});
  Object.assign(s.repairJobs[0],{x:pc.x,y:pc.y,phase:"working",progress:12,facing:"south",moving:false});
  const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;
  canvas.style.cssText="position:fixed;left:0;top:0;width:1000px;height:610px;z-index:999999";
  document.body.appendChild(canvas);
  const renderer=new SceneRenderer(canvas.getContext("2d"));
  for(let i=0;i<32;i++){
   renderer.draw(s,i/12);
   await new Promise(ok=>setTimeout(ok,85));
  }
 },sample);
 const videoPath=resolve(out,"worker_actions.webm");
 const recording=movie.video();
 await movieCtx.close();
 await recording.saveAs(videoPath);
 assert.equal(sample.employeePayrollAccrued,payroll);
 assert.deepEqual(errors,[]);
 await writeFile(resolve(out,"worker_motion_validation.json"),JSON.stringify({shots,video:"worker_actions.webm"},null,2));
 console.log(JSON.stringify({kinds:shots,video:true,errors:0}));
}finally{await browser?.close();server.kill();}
