// Verifica avisos de passagem e mapa de inspeção no Canvas com Chromium real.
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";

const output=resolve(process.argv[2]??"out/validation");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],
 {stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{
  server.stdout.once("data",ok);
  server.once("error",fail);
  server.once("exit",code=>fail(Error("Server closed: "+code)));
 });
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const checks=[];
 for(const width of [1280,414,360]){
  for(const kind of ["bin","pc","clear"]){
   const s=createGame(532,"historical");
   s.cash=4000;s.pcPoweredOff=[true,true,true];
   if(kind==="bin"){
    s.binFill=[80,20];
    s.interiorWalls=[
     {axis:"x",x:1,y:3},{axis:"x",x:1,y:4},
     {axis:"y",x:1,y:3},{axis:"y",x:2,y:3}
    ];
   }else if(kind==="pc"){
    s.pcWear=[100,0,0];
    s.interiorWalls=[
     {axis:"x",x:2,y:1},{axis:"x",x:2,y:2},
     {axis:"y",x:2,y:1},{axis:"y",x:3,y:1}
    ];
   }else{s.binFill=[80,0];s.pcWear=[100,0,0];}
   const ctx=await browser.newContext({viewport:{width,height:850},
    isMobile:width<700,hasTouch:width<700});
   await ctx.addInitScript(({key,state})=>{
    localStorage.setItem(key,JSON.stringify(state));
    localStorage.setItem("lhs.sound","off");
   },{key:GAME_SAVE_KEY,state:s});
   const page=await ctx.newPage(),errors=[];
   page.on("pageerror",e=>errors.push(String(e)));
   await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   const tap=async css=>width<700
     ?await page.locator(css).tap()
     :await page.locator(css).click();
   await tap("#menu-continue");
   await tap("#open-admin");
   await tap('[data-admin-tab="services"]');
   const summary=await page.locator("#service-access-summary").innerText();
   const view=page.locator("#show-service-access");
   const disabled=await view.isDisabled();
   const count=kind==="clear"?0:1;
   if(kind==="clear"){
    assert.match(summary,/Nenhum destino/);
    assert.equal(disabled,true);
   }else{
    assert.match(summary,/1 destino/);
    const targets=await page.locator("#service-access-list").innerText();
    assert.match(targets,kind==="bin"?/Lixeira 1/:/PC 1/);
    assert.equal(disabled,false);
    // O renderer de inspeção é chamado sobre a cena real.
    const pixels=await page.evaluate(async state=>{
     const {SceneRenderer}=await import("./js/render/scene.js");
     const {serviceAccessIssues}=await import("./js/sim/serviceAccess.js");
     const canvas=document.createElement("canvas");
     canvas.width=1000;canvas.height=610;
     const draw=new SceneRenderer(canvas.getContext("2d"));
     draw.draw(state,1.12);
     const before=canvas.getContext("2d").getImageData(0,0,1000,610).data.slice();
     draw.drawServiceAccessOverlay(state,serviceAccessIssues(state),1.12);
     const after=canvas.getContext("2d").getImageData(0,0,1000,610).data;
     let changed=0;
     for(let i=0;i<before.length;i+=4)
      if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+
         Math.abs(before[i+2]-after[i+2])>50)changed++;
     return changed;
    },s);
    assert.ok(pixels>120,"marcador deve alterar pixels reais do salão: "+pixels);
    await tap("#show-service-access");
    assert.equal(await page.locator("#admin").isVisible(),false);
    const visibility=await page.evaluate(()=>{
     const el=document.getElementById("service-access-toolbar");
     const stage=document.querySelector(".stage");
     const app=document.getElementById("game-app");
     const styles=el?getComputedStyle(el):null;
     return {exists:!!el,hidden:el?.hidden,display:styles?.display,
      box:el?{w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}:null,
      parentHidden:stage?.hasAttribute("hidden"),appHidden:app?.hidden,
      mapHint:document.getElementById("service-access-map-hint")?.textContent};
    });
    assert.equal(await page.locator("#service-access-toolbar").isVisible(),true,
     kind+"/"+width+": "+JSON.stringify(visibility)+" pageErrors="+JSON.stringify(errors));
    await page.locator("#service-access-toolbar").screenshot({
     path:resolve(output,"access_"+kind+"_"+width+"_toolbar.png")
    });
    if(width===1280)
     await page.locator("#game").screenshot({path:resolve(output,"access_"+kind+"_scene.png")});
    await tap("#hide-service-access");
    assert.equal(await page.locator("#service-access-toolbar").isVisible(),false);
   }
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=3,"conteúdo vazou da tela: "+kind+"/"+width+" "+overflow);
   assert.deepEqual(errors,[]);
   checks.push({width,kind,count,summary,overflow});
   await ctx.close();
  }
 }
 await writeFile(resolve(output,"service_access_validation.json"),JSON.stringify({checks},null,2));
 console.log(JSON.stringify({cases:checks.length,widths:[1280,414,360],blockedScenarios:2,errors:0}));
}finally{await browser?.close();server.kill();}
