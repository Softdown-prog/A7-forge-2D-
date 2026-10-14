// Tests the actual game UI in Chromium with real touch events and save reloads.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
const output=resolve(process.argv[2]??"out/layout-editor");await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});const results=[];
 for(const width of [1440,414,360]){
  const context=await browser.newContext({viewport:{width,height:950},hasTouch:width<700,isMobile:width<700}),page=await context.newPage(),errors=[];
  const press=locator=>width<700?locator.tap():locator.click();
  page.on("pageerror",e=>errors.push(String(e)));const state=createGame();state.cash=20000;
  await page.addInitScript(s=>{if(!localStorage.getItem("lhs-save-v1"))localStorage.setItem("lhs-save-v1",JSON.stringify(s));},state);
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});await press(page.locator("#menu-continue"));
  await press(page.locator("#organize-layout"));await page.locator("#layout-object").selectOption("pc:0");
  if(width===1440){
   const cases=await page.evaluate(async()=>{
    const [{objectCamera},{drawRetroComputer},{drawVendingMachine,drawSnackShelf},{createGame}]=await Promise.all([import("./js/render/isometric.js"),import("./js/render/retroComputer.js"),import("./js/render/retailArt.js"),import("./js/sim/engine.js")]);
    const a=document.createElement("canvas"),b=document.createElement("canvas");a.width=b.width=600;a.height=b.height=500;const ac=a.getContext("2d"),bc=b.getContext("2d"),cases=[],s=createGame();
    for(const zoom of [.42,.86,1.8])for(let rotation=0;rotation<4;rotation++)for(const kind of ["pc","pc-lcd","soda","candy","shelf"]){
     const [w,d]=kind.startsWith("pc")?[1.1,.7]:kind==="shelf"?[.46,1.22]:[.66,.59],cam=objectCamera({originX:250.37,originY:300.63,zoom},{x:0,y:0},w,d,rotation);
     s.pcLcdModels=[kind==="pc-lcd"?"lcd24":null];
     const draw=(c,cache)=>kind.startsWith("pc")?drawRetroComputer(c,cam,{x:0,y:0},0,.1,true,s,cache):kind==="shelf"?drawSnackShelf(c,cam,-.23,20,cache,{x:0,y:0}):drawVendingMachine(c,cam,{x:0,y:0},kind,.1,9,cache);
     for(const c of [ac,bc]){c.fillStyle="#213c33";c.fillRect(0,0,600,500);}draw(ac,true);draw(bc,false);
     const aa=ac.getImageData(0,0,600,500).data,bb=bc.getImageData(0,0,600,500).data;let max=0,changed=0,sum=0;
     for(let i=0;i<aa.length;i++){const delta=Math.abs(aa[i]-bb[i]);max=Math.max(max,delta);if(delta>1)changed++;sum+=Math.max(0,delta-1);}
     cases.push({zoom,rotation,kind,max,changed,residual:sum/aa.length});
    }return cases;
   });
   await writeFile(resolve(output,"rotated_sprite_validation.json"),JSON.stringify(cases,null,2));
   for(const c of cases)assert.ok(c.max<=32&&c.changed<=500&&c.residual<.001,JSON.stringify(c));
  }
  const zoom=await page.locator("#scene-zoom").textContent();if(width<700)assert.equal(zoom,"160%");
  // Tap the floor at the desired desk's center, accounting for scroll and CSS zoom.
  const tap=await page.evaluate(async()=>{
   const [{cameraForGame,iso}]=await Promise.all([import("./js/render/isometric.js")]);
   const s=JSON.parse(localStorage.getItem("lhs-save-v1")),p=iso({x:3.05,y:3.35},cameraForGame(s));
   const c=document.querySelector("#game"),v=document.querySelector("#scene-viewport"),scale=c.getBoundingClientRect().width/c.width;
   v.scrollLeft=Math.max(0,p.x*scale-v.clientWidth/2);v.scrollTop=Math.max(0,p.y*scale-v.clientHeight/2);
   const r=c.getBoundingClientRect();return {nativeX:p.x,nativeY:p.y};
  });
  await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
  const tapNow=await page.evaluate(({x,y})=>{const c=document.querySelector("#game"),r=c.getBoundingClientRect();return {x:r.left+x*r.width/c.width,y:r.top+y*r.height/c.height};},{x:tap.nativeX,y:tap.nativeY});
  if(width<700)await page.touchscreen.tap(tapNow.x,tapNow.y);else await page.mouse.click(tapNow.x,tapNow.y);
  await press(page.locator("#layout-rotate"));await press(page.locator("#layout-confirm"));
  console.log("checking",width,await page.locator("#layout-message").textContent());
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")));const placed=saved.objectPlacements?.find(p=>p.id==="pc:0");assert.ok(placed);assert.equal(placed.rotation,1);assert.equal(placed.x,2.5);assert.equal(placed.y,3);
  const minutes=saved.totalMinutes;await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")).totalMinutes),minutes);
  await press(page.locator("#layout-close"));await press(page.locator("#open-menu"));await page.reload();await press(page.locator("#menu-continue"));await press(page.locator("#organize-layout"));await page.locator("#layout-object").selectOption("pc:0");
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")));assert.deepEqual(saved.objectPlacements.find(p=>p.id==="pc:0"),placed);
  const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,viewport:document.querySelector("#scene-viewport").clientWidth,canvas:document.querySelector("#game").getBoundingClientRect().width}));assert.ok(bounds.scroll<=bounds.width+3);assert.ok(bounds.canvas>=bounds.viewport);
  await page.screenshot({path:resolve(output,"layout_"+width+".png")});
  await press(page.locator("#layout-close"));await press(page.locator("#open-shop"));await press(page.locator('[data-buy="wall"]'));
  const beforeWall=await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")));
  await page.evaluate(async()=>{const {cameraForGame,iso}=await import("./js/render/isometric.js"),s=JSON.parse(localStorage.getItem("lhs-save-v1")),p=iso({x:5.5,y:4},cameraForGame(s)),c=document.querySelector("#game"),v=document.querySelector("#scene-viewport"),scale=c.getBoundingClientRect().width/c.width;v.scrollLeft=Math.max(0,p.x*scale-v.clientWidth/2);v.scrollTop=Math.max(0,p.y*scale-v.clientHeight/2);});
  await page.evaluate(()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok))));
  const edge=await page.evaluate(async()=>{const {cameraForGame,iso}=await import("./js/render/isometric.js"),p=iso({x:5.5,y:4},cameraForGame(JSON.parse(localStorage.getItem("lhs-save-v1")))),c=document.querySelector("#game"),r=c.getBoundingClientRect();return {x:r.left+p.x*r.width/c.width,y:r.top+p.y*r.height/c.height};});
  if(width<700)await page.touchscreen.tap(edge.x,edge.y);else await page.mouse.click(edge.x,edge.y);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")).interiorWalls?.length??0),beforeWall.interiorWalls?.length??0,"Primeiro toque apenas seleciona");
  await press(page.locator("#turn-wall"));await press(page.locator("#confirm-wall"));
  const afterWall=await page.evaluate(()=>JSON.parse(localStorage.getItem("lhs-save-v1")));assert.equal(afterWall.interiorWalls.length,(beforeWall.interiorWalls?.length??0)+1);assert.equal(afterWall.expenses,beforeWall.expenses+30);
assert.deepEqual(errors,[]);results.push({width,zoom,bounds,placement:placed,wallConfirmed:true,errors});await context.close();
 }
 await writeFile(resolve(output,"layout_ui_validation.json"),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser?.close();server.kill();}
