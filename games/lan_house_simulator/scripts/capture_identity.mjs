// Real-browser review of every workspace and of the new SVG click targets.
import {chromium} from "playwright";
import {spawn,execFileSync} from "node:child_process";
import {mkdir,writeFile,rm,readFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";

const output=resolve(process.argv[2]??"out/identity"),record=process.argv.includes("--video");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",code=>reject(Error("Servidor encerrou: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const errors=[],checks=[];
 for(const config of [{name:"desktop",width:1440,height:950},{name:"mobile",width:414,height:920},{name:"small-mobile",width:360,height:800}]){
  const filming=record&&config.name==="desktop";
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},deviceScaleFactor:1,
   ...(config.name!=="desktop"?{isMobile:true,hasTouch:true}:{}),
   ...(filming?{recordVideo:{dir:resolve(output,"recording"),size:{width:1440,height:950}}}:{})});
  // Keep PC 01 unavailable until its real technician action is exercised.
  const state=createGame(1998);state.cash=5000;state.pcWear=[100,10,0];
  await context.addInitScript(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");},{key:GAME_SAVE_KEY,state});
  const page=await context.newPage();
  page.on("pageerror",e=>errors.push(config.name+": "+e));
  page.on("response",r=>{if(r.status()>=400)errors.push(config.name+": HTTP "+r.status()+" "+r.url());});
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const hold=async()=>{if(filming)await page.waitForTimeout(1200);};
  const checkBounds=async(label)=>{
   const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
    panel:Array.from(document.querySelectorAll('.admin:not([hidden])')).map(p=>({scroll:p.scrollWidth,width:p.clientWidth}))}));
   assert.ok(result.width<=config.width+3 && result.scroll<=config.width+3,label+" page overflow: "+JSON.stringify(result));
   assert.ok(result.panel.every(p=>p.scroll<=p.width+3),label+" panel overflow: "+JSON.stringify(result));
  };
  const shot=async(name,panel)=>{
   if(panel)await page.locator(panel).evaluate(p=>p.scrollTop=0);
   await checkBounds(name);await hold();
   await page.screenshot({path:resolve(output,"lhs_identity_"+name+"_"+config.name+".png"),fullPage:!panel});
  };
  await shot("menu");
  await page.locator("#menu-options").click();assert.equal(await page.locator("#menu-settings").isVisible(),true);
  await page.locator("#option-sound").check();assert.equal(await page.evaluate(()=>localStorage.getItem("lhs.sound")),"on");
  await page.locator("#option-sound").uncheck();await page.locator("#menu-options").click();
  await page.locator("#menu-continue").click();await page.locator("#game-app").waitFor({state:"visible"});
  assert.equal(await page.locator("#status .hud-card").count(),5);
  await shot("game");
  await page.locator("#open-admin").click();
  assert.equal(await page.evaluate(()=>document.activeElement?.id),"close-admin");
  // Focus remains in the window, and Escape closes it without pausing the game.
  await page.keyboard.press("Shift+Tab");assert.equal(await page.locator("#admin").evaluate(p=>p.contains(document.activeElement)),true);
  await page.keyboard.press("Escape");assert.equal(await page.locator("#admin").isVisible(),false);
  assert.equal(await page.locator("#game-app").isVisible(),true);
  await page.locator("#open-admin").click();
  await page.locator('[data-admin-tab="prices"]').focus();await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator('[data-admin-tab="computers"]').getAttribute("aria-selected"),"true");
  for(const tab of ["prices","computers","gpus","licenses","stock","services","finance"]){
   await page.locator('[data-admin-tab="'+tab+'"]').click();
   assert.equal(await page.locator('[data-section="'+tab+'"]').isVisible(),true);
   await shot("admin-"+tab,"#admin");
  }
  await page.locator('[data-admin-tab="stock"]').click();
  const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  // Dispatch directly on the SVG child to cover event delegation too.
  await page.locator("#stock-soda .ui-icon").evaluate(svg=>svg.dispatchEvent(new MouseEvent("click",{bubbles:true})));
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  assert.ok(after.inventory.soda>before.inventory.soda);assert.ok(after.expenses>before.expenses);
  assert.equal(after.cash,before.cash+(after.revenue-before.revenue)-(after.expenses-before.expenses));
  await page.locator('[data-admin-tab="computers"]').click();
  await page.locator('[data-pc-repair="0"] .ui-icon').evaluate(svg=>svg.dispatchEvent(new MouseEvent("click",{bubbles:true})));
  const repaired=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  assert.equal(repaired.repairJobs?.some(j=>j.pc===0),true);
  await page.keyboard.press("Escape");
  await page.locator("#open-shop").click();await shot("shop","#shop");
  assert.equal(await page.locator("#shop-catalog .shop-art").count(),11);
  await page.locator('[data-buy="plant"] .ui-icon').evaluate(svg=>svg.dispatchEvent(new MouseEvent("click",{bubbles:true})));
  assert.equal(await page.locator("#placement-toolbar").isVisible(),true);
  assert.equal(await page.locator("#panel-backdrop").isVisible(),false);
  await page.locator("#placement-cancel").click();
  await page.locator("#open-notices").click();await shot("mail","#notices");
  const mark=page.locator("[data-notice-read]").first();
  if(await mark.count()){await mark.locator(".ui-icon").evaluate(svg=>svg.dispatchEvent(new MouseEvent("click",{bubbles:true})));}
  await page.keyboard.press("Escape");
  await page.locator("#open-menu").click();assert.equal(await page.locator("#panel-backdrop").isVisible(),false);
  assert.equal(await page.locator("#start-screen").isVisible(),true);
  const downloading=page.waitForEvent("download");await page.locator("#save-export").click();
  const download=await downloading,payload=await readFile(await download.path());
  assert.equal(JSON.parse(payload).format,"softdown-lan-house-save");
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#save-import-file").setInputFiles({name:"identity-check.json",mimeType:"application/json",buffer:payload});
  await page.waitForFunction(()=>document.getElementById("save-message")?.textContent?.includes("importada com sucesso"));
  await page.locator("#menu-continue").click();await hold();
  checks.push({viewport:config.name,width:config.width,height:config.height,workspaces:11,svgActions:true,saveRoundTrip:true,focusAndEscape:true,keyboardTabs:true,overflow:false});
  const video=page.video();await context.close();
  if(filming){
   const file=resolve(output,"lhs_visual_identity.mp4");
   execFileSync("ffmpeg",["-y","-i",await video.path(),"-an","-c:v","libx264","-threads","2","-preset","veryfast","-crf","23","-pix_fmt","yuv420p","-movflags","+faststart",file],{stdio:["ignore","ignore","pipe"]});
   const encoded=JSON.parse(execFileSync("ffprobe",["-v","error","-show_entries","format=duration,size","-of","json",file],{encoding:"utf8"}));
   assert.ok(Number(encoded.format.duration)>5&&Number(encoded.format.size)>10000,"MP4 deve ser completo e reproduzível");
   await rm(resolve(output,"recording"),{recursive:true,force:true});
  }
 }
 // Reduced motion: previews remain visible without imposing animation.
 const reduced=await browser.newPage({viewport:{width:414,height:920},reducedMotion:"reduce"});
 await reduced.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 assert.equal(await reduced.locator(".title-cursor").evaluate(e=>getComputedStyle(e).animationName),"none");await reduced.close();
 if(errors.length)throw Error(errors.join("\n"));
 await writeFile(resolve(output,"lhs_identity_validation.json"),JSON.stringify({checks,errors,icons:41,audio:false},null,2)+"\n");
 console.log("Identidade: onze telas em três tamanhos, ações em SVG, foco, Escape e movimento reduzido validados.");
}finally{await browser?.close();server.kill();}
