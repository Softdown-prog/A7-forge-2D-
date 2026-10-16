/** Videos independentes do menu, derivados de ticks e Canvas do jogo.
 * Produz ciclo completo de chegada→trabalho→saída e bloqueios demonstrados. */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame} from "../dist/js/sim/engine.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {dispatchHiredStaff} from "../dist/js/sim/services.js";
const out=resolve(process.argv[2]??"out/validation");
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);server.once("exit",c=>fail(Error("Server stopped: "+c)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const makeContext=()=>browser.newContext({viewport:{width:1000,height:610},recordVideo:{dir:out,size:{width:1000,height:610}}});
 const first=await makeContext(),page=await first.newPage();
 const pageErrors=[];page.on("pageerror",e=>pageErrors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const s=createGame(64,"historical");s.cash=3000;s.pcPoweredOff=[true,true,true];s.pcWear=[100,0,0];s.binFill=[85,0];
 hireEmployee(s,"cleaner");hireEmployee(s,"technician");dispatchHiredStaff(s);
 assert.ok(s.cleaningJob&&s.repairJobs?.length);
 const phases=await page.evaluate(async state=>{
  const {SceneRenderer}=await import("./js/render/scene.js");
  const {SceneMotion}=await import("./js/render/motion.js");
  const {tickServices}=await import("./js/sim/services.js");
  const s=structuredClone(state);
  const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;
  canvas.style.cssText="position:fixed!important;inset:0;width:1000px;height:610px;z-index:2147483647";
  document.body.appendChild(canvas);document.body.style.margin="0";
  const ctx=canvas.getContext("2d"),renderer=new SceneRenderer(ctx),motion=new SceneMotion();
  const states={cleaner:new Set(),technician:new Set()};
  for(let tick=0;tick<138;tick++){
   motion.capture(s);tickServices(s);
   for(let i=1;i<=3;i++){
    const shown=motion.sample(s,i/3),t=(tick*3+i)*.07;
    renderer.draw(shown,t);
    ctx.save();ctx.fillStyle="rgba(22,41,45,.93)";ctx.fillRect(0,0,1000,43);
    ctx.fillStyle="#F3DBA5";ctx.textBaseline="middle";ctx.textAlign="left";ctx.font="bold 14px system-ui";
    const label=job=>!job?"CONCLUÍDO":job.phase==="arriving"?"CHEGANDO":job.phase==="working"?"TRABALHANDO":"SAINDO";
    ctx.fillText("FAXINEIRO: "+label(shown.cleaningJob)+"    |    TÉCNICO: "+label(shown.repairJobs?.[0]),23,22);
    ctx.restore();
    await new Promise(ok=>setTimeout(ok,55));
   }
   states.cleaner.add(s.cleaningJob?.phase??"complete");
   states.technician.add(s.repairJobs?.[0]?.phase??"complete");
  }
  return {phases:Object.fromEntries(Object.entries(states).map(([k,v])=>[k,[...v]])),
   cleanerDone:!s.cleaningJob,technicianDone:!(s.repairJobs?.length)};
 },s);
 const recording=page.video();await first.close();
 await recording.saveAs(resolve(out,"staff_full_cycle.webm"));
 for(const role of ["cleaner","technician"])
  for(const phase of ["arriving","working","leaving","complete"])
   assert.ok(phases.phases[role].includes(phase),role+" missing "+phase+": "+JSON.stringify(phases));
 assert.ok(phases.cleanerDone&&phases.technicianDone,"both workers must leave the room");
 assert.deepEqual(pageErrors,[]);
 // Segundo vídeo: duas cenas bloqueadas e uma liberada após abrir passagem.
 const second=await makeContext(),map=await second.newPage();
 await map.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const issuesCount=await map.evaluate(async()=>{
  const {SceneRenderer}=await import("./js/render/scene.js");
  const {serviceAccessIssues}=await import("./js/sim/serviceAccess.js");
  const {createGame}=await import("./js/sim/engine.js");
  const scenes=[
   {title:"LIXEIRA 1: PASSAGEM BLOQUEADA",setup:s=>{
     s.binFill=[80,0];s.interiorWalls=[
      {axis:"x",x:1,y:3},{axis:"x",x:1,y:4},
      {axis:"y",x:1,y:3},{axis:"y",x:2,y:3}
     ];
   }},
   {title:"PC 1: TÉCNICO SEM ACESSO",setup:s=>{
     s.pcWear=[100,0,0];s.interiorWalls=[
      {axis:"x",x:2,y:1},{axis:"x",x:2,y:2},
      {axis:"y",x:2,y:1},{axis:"y",x:3,y:1}
     ];
   }},
   {title:"PASSAGEM LIBERADA: CHAMADO DISPONÍVEL",setup:s=>{
     s.binFill=[80,0];s.pcWear=[100,0,0];
   }}
  ];
  const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;
  canvas.style.cssText="position:fixed!important;inset:0;width:1000px;height:610px;z-index:2147483647";
  document.body.appendChild(canvas);document.body.style.margin="0";
  const ctx=canvas.getContext("2d"),renderer=new SceneRenderer(ctx),counts=[];
  for(const scene of scenes){
   const state=createGame(64,"historical");scene.setup(state);
   const issues=serviceAccessIssues(state);counts.push(issues.length);
   for(let i=0;i<43;i++){
    renderer.draw(state,i*.07);
    renderer.drawServiceAccessOverlay(state,issues,i*.07);
    ctx.save();ctx.fillStyle="rgba(22,41,45,.93)";ctx.fillRect(0,0,1000,43);
    ctx.fillStyle="#F4DBA9";ctx.textBaseline="middle";ctx.textAlign="left";ctx.font="bold 15px system-ui";
    ctx.fillText(scene.title+" | SEM PASSAGEM: "+issues.length,20,22);
    ctx.restore();
    await new Promise(ok=>setTimeout(ok,75));
   }
  }
  return counts;
 });
 const secondVideo=map.video();await second.close();
 await secondVideo.saveAs(resolve(out,"service_blockages.webm"));
 assert.deepEqual(issuesCount,[1,1,0]);
 await writeFile(resolve(out,"staff_diagnostics_video.json"),
  JSON.stringify({phases,issueCounts:issuesCount,files:["staff_full_cycle.webm","service_blockages.webm"]},null,2));
 console.log(JSON.stringify({phases,issuesCount,recordedVideos:2}));
}finally{await browser?.close();server.kill();}
