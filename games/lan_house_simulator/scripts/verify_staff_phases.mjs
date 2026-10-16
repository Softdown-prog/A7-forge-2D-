// Verifica mensagens de fases e Canvas com equipes realmente renderizadas, desktop/mobile.
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame,pcPosition} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {hireEmployee} from "../dist/js/sim/staff.js";
import {dispatchHiredStaff,binSpots} from "../dist/js/sim/services.js";

const output=resolve(process.argv[2]??"out/staff-phases");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((resolveReady,reject)=>{
  server.stdout.once("data",resolveReady);server.once("error",reject);
  server.once("exit",code=>reject(Error("Server exit: "+code)));
 });
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const checks=[];
 for(const width of [1280,414,360])for(const phase of ["idle","arriving","working","leaving"]){
  const mobile=width<700,state=createGame(48,"historical");
  state.cash=7000;state.pcPoweredOff=[true,true,true];
  hireEmployee(state,"cleaner");hireEmployee(state,"technician");
  if(phase!=="idle"){
   state.binFill=[85,0];state.pcWear=[100,0,0];
   dispatchHiredStaff(state);
   assert.equal(state.employeePayrollAccrued,18);
   if(phase!=="arriving"){
    const bin=binSpots(state)[0],pc=pcPosition(0,state);
    const cleaning=state.cleaningJob,repair=state.repairJobs[0];
    Object.assign(cleaning,{x:bin.x,y:bin.y,phase,progress:phase==="working"?5:9,moving:false,binIndex:0});
    Object.assign(repair,{x:pc.x,y:pc.y,phase,progress:phase==="working"?12:repair.duration,moving:false});
   }
  }
  const ctx=await browser.newContext({viewport:{width,height:930},isMobile:mobile,hasTouch:mobile});
  await ctx.addInitScript(({key,s})=>{localStorage.setItem(key,JSON.stringify(s));
   localStorage.setItem("lhs.sound","off");},{key:GAME_SAVE_KEY,s:state});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const press=async sel=>mobile?await page.locator(sel).tap():await page.locator(sel).click();
  await press("#menu-continue");await press("#open-admin");await press('[data-admin-tab="services"]');
  const cleaner=await page.locator("#cleaner-activity").innerText();
  const tech=await page.locator("#technician-activity").innerText();
  const cp=page.locator("#cleaner-progress"),tp=page.locator("#technician-progress");
  const cleanVisible=await cp.isVisible(),techVisible=await tp.isVisible();
  if(phase==="idle"){
   assert.match(cleaner,/aguardando necessidade/);
   assert.match(tech,/aguardando necessidade/);
  }else if(phase==="arriving"){
   assert.match(cleaner,/A caminho/);assert.match(tech,/A caminho · PC 1/);
  }else if(phase==="working"){
   assert.match(cleaner,/Limpando · \d+%/);
   assert.match(tech,/Reparando · PC 1 · \d+%/);
   assert.equal(cleanVisible,true);assert.equal(techVisible,true);
  }else{
   assert.match(cleaner,/Saindo/);assert.match(tech,/Saindo · PC 1/);
  }
  if(phase!=="working"){assert.equal(cleanVisible,false);assert.equal(techVisible,false);}
  // Cada estado também deve ser desenhado no verdadeiro canvas da cena.
  const picture=await page.evaluate(async (s)=>{
   const {SceneRenderer}=await import("./js/render/scene.js");
   const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;
   new SceneRenderer(canvas.getContext("2d")).draw(s,1.2);
   const pixels=canvas.getContext("2d").getImageData(0,0,1000,610).data;
   let nonzero=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>100)nonzero++;
   return {png:canvas.toDataURL("image/png"),nonzero};
  },state);
  assert.ok(picture.nonzero>80000,"Cena precisa renderizar o salão e os funcionários");
  if(width===1280)await writeFile(resolve(output,"team_"+phase+".png"),Buffer.from(picture.png.split(",")[1],"base64"));
  if(width===414)await page.locator("#section-services").screenshot({path:resolve(output,"team_mobile_"+phase+".png")});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3,phase+"/"+width+": "+overflow);
  assert.deepEqual(errors,[]);
  checks.push({width,phase,cleaner,tech,cleanVisible,techVisible,overflow});
  await ctx.close();
 }
 await writeFile(resolve(output,"staff_phases_validation.json"),JSON.stringify({checks},null,2));
 console.log(JSON.stringify({cases:checks.length,phases:["idle","arriving","working","leaving"],widths:[1280,414,360],errors:0}));
}finally{await browser?.close();server.kill();}
