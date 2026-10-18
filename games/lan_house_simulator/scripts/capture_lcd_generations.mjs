import {selectAdminArea,selectTask} from './management_navigation.mjs';
// Native Canvas contact sheet and real UI purchase/cache validation.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY,DAY_MINUTES} from "../dist/js/sim/types.js";
const output=resolve(process.argv[2]??"out/lcd");await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",n=>reject(Error("Servidor: "+n)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const result=await page.evaluate(async()=>{
  const [{drawRetroComputer,drawSeatedKeyboardOverlay},{createGame},{LCD_CATALOG},{drawActor,actorStyleFor}]=await Promise.all([
   import("./js/render/retroComputer.js"),import("./js/sim/engine.js"),import("./js/sim/computerModels.js"),import("./js/render/actorArt.js")]);
  const surface=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
  const label=(c,text,x,y,size=18,color="#e9e5c6")=>{c.fillStyle=color;c.font=`600 ${size}px system-ui`;c.fillText(text,x,y);};
  const models=[{tier:1,id:null,name:"CRT · geração 1",year:1998},{tier:2,id:null,name:"CRT · geração 2",year:2000},
   {tier:3,id:null,name:"CRT · geração 3",year:2003},...LCD_CATALOG.map(m=>({...m,tier:3}))];
  const gallery=surface(1600,910),g=gallery.getContext("2d");g.fillStyle="#192f2a";g.fillRect(0,0,1600,910);
  label(g,"Terminal de Bairro · oito gerações de computadores",30,40,26);
  label(g,"Modelos do jogo · CRT → LCD → LED → IPS → Arena",30,70,16,"#9fb7a5");
  const s=createGame();s.pcLcdModels=[null,null,null];
  models.forEach((model,i)=>{
   const col=i%4,row=Math.floor(i/4),left=col*400,top=95+row*390;
   label(g,String(model.year),left+25,top+28,15,"#c8ad79");label(g,model.name,left+25,top+58,20);
   s.pcTiers[0]=model.tier;s.pcLcdModels[0]=model.id;
   drawRetroComputer(g,{originX:left+205,originY:top+265,zoom:2.2},{x:0,y:0},0,.4,true,s);
  });
  label(g,"Troca por estação · novos kits liberados conforme os anos passam",30,884,18,"#b7c8b0");
  const seated=surface(1500,410),sc=seated.getContext("2d");sc.fillStyle="#192f2a";sc.fillRect(0,0,1500,410);
  label(sc,"LCDs no uso real · cliente, rede desconectada e manutenção",25,35,22);
  LCD_CATALOG.forEach((model,i)=>{
   s.pcLcdModels[0]=model.id;s.pcTiers[0]=3;s.pcWear[0]=i===4?100:0;
   s.customers=i<3?[{id:2,pcIndex:0,stage:"using"}]:[];
   const cam={originX:150+i*300,originY:265,zoom:1.7},p={x:0,y:0};
   drawRetroComputer(sc,cam,p,0,.4,i!==3,s);
   if(i<3){drawActor(sc,cam,{x:.35,y:.82,kind:"regular",id:2,time:.4,pose:"sitting",direction:"north"});
    const style=actorStyleFor("regular",2);drawSeatedKeyboardOverlay(sc,cam,p,.4,style.skin,style.shirt);}
   label(sc,model.name,25+i*300,80,16);label(sc,i===3?"Sem rede":i===4?"Em manutenção":"Em uso",25+i*300,375,14,"#b7c8b0");
  });
  const a=surface(600,400),b=surface(600,400),ac=a.getContext("2d"),bc=b.getContext("2d"),cases=[],fingerprints=[];
  for(const zoom of [.42,.86,1.8])for(const model of LCD_CATALOG)for(const mode of ["ready","busy","offline","maintenance"]){
   s.pcLcdModels[0]=model.id;s.pcWear[0]=mode==="maintenance"?100:0;
   s.customers=mode==="busy"?[{id:2,pcIndex:0,stage:"using"}]:[];
   const camera={originX:225.37,originY:190.63,zoom},position={x:1.125,y:.375},snapshot=JSON.stringify(s);
   for(const time of [.1,.8])for(const alpha of [1,.4]){
    ac.globalAlpha=bc.globalAlpha=1;ac.fillStyle=bc.fillStyle="#213c33";ac.fillRect(0,0,600,400);bc.fillRect(0,0,600,400);
    ac.globalAlpha=bc.globalAlpha=alpha;drawRetroComputer(ac,camera,position,0,time,mode!=="offline",s);
    drawRetroComputer(bc,camera,position,0,time,mode!=="offline",s,false);
    const aa=ac.getImageData(0,0,600,400).data,bb=bc.getImageData(0,0,600,400).data;
    let changed=0,max=0,sum=0;for(let i=0;i<aa.length;i++){const d=Math.abs(aa[i]-bb[i]);max=Math.max(max,d);sum+=d;if(d>1)changed++;}
    if(JSON.stringify(s)!==snapshot)throw Error("Renderer alterou a partida");
    cases.push({zoom,id:model.id,mode,time,alpha,channelsChangedBeyondRounding:changed,maxChannelDelta:max,meanChannelDelta:sum/aa.length});
    if(zoom===1.8&&mode==="ready"&&time===.1&&alpha===1)fingerprints.push(a.toDataURL());
   }
  }
  return {gallery:gallery.toDataURL(),seated:seated.toDataURL(),cases,uniqueModels:new Set(fingerprints).size};
 });
 await writeFile(resolve(output,"lcd_pixel_checks.json"),JSON.stringify(result.cases,null,2)+"\n");
 assert.equal(result.uniqueModels,5,"Cada geração deve ter arte distinta");
 // Affine thin bezels have slightly stronger premultiplied edge rounding
 // than CRTs. Bound isolated edge differences to 200 channels out of 960,000.
 for(const c of result.cases){assert.ok(c.maxChannelDelta<=36&&c.channelsChangedBeyondRounding<=200&&c.meanChannelDelta<.003,JSON.stringify(c));
  if(c.alpha!==1)assert.equal(c.maxChannelDelta,0);}
 for(const [key,name] of [["gallery","lhs_eight_pc_generations.png"],["seated","lhs_lcd_seated_and_status.png"]])
  await writeFile(resolve(output,name),Buffer.from(result[key].split(",")[1],"base64"));
 const checks=[];
 // Actual controls at three viewport widths. Only PC 02 buys a kit.
 for(const width of [1440,414,360]){
  const context=await browser.newContext({viewport:{width,height:950}}),s=createGame();
  s.cash=10000;s.pcTiers=[3,3,3];s.totalMinutes=(2024-1998)*360*DAY_MINUTES;
  await context.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");},{key:GAME_SAVE_KEY,state:s});
  const ui=await context.newPage();ui.on("pageerror",e=>errors.push(String(e)));
  await ui.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});await ui.locator("#menu-continue").click();
  await ui.locator("#open-admin").click();await selectAdminArea(ui,'computers');await selectTask(ui,'computers','operations');
  await ui.locator('[data-pc-power="1"]').click();await selectTask(ui,'computers','monitors');
  assert.equal(await ui.locator(".lcd-card").count(),5);
  await ui.locator('[data-lcd-select="1"]').focus();await ui.waitForTimeout(650);
  assert.equal(await ui.evaluate(()=>document.activeElement?.dataset.lcdSelect),"1","Atualização periódica conserva foco do teclado");
  const dispatch=selector=>ui.evaluate(selector=>{const node=document.querySelector(selector);if(!node)throw Error(selector);node.dispatchEvent(new MouseEvent("click",{bubbles:true}));},selector);
  await dispatch('[data-lcd-select="1"] .ui-icon');await dispatch('[data-lcd-buy="lcd24"] .ui-icon');
  const saved=await ui.evaluate(key=>JSON.parse(localStorage.getItem(key)),GAME_SAVE_KEY);
  assert.deepEqual(saved.pcLcdModels,[null,"lcd24",null]);assert.equal(saved.cash,7520);assert.equal(saved.expenses,2480);
  assert.equal(await ui.locator('[data-lcd-buy="lcd24"]').isDisabled(),true);
  assert.match(await ui.locator('[data-lcd-current]').textContent(),/PC 2.*Arena 27/);
  const bounds=await ui.evaluate(()=>({page:document.documentElement.scrollWidth,width:innerWidth,panel:document.querySelector("#admin").scrollWidth,client:document.querySelector("#admin").clientWidth}));
  assert.ok(bounds.page<=bounds.width+3&&bounds.panel<=bounds.client+3,JSON.stringify(bounds));
  await ui.reload({waitUntil:"networkidle"});await ui.locator("#menu-continue").click();await ui.locator("#open-admin").click();await selectAdminArea(ui,'computers');await selectTask(ui,'computers','monitors');
  await dispatch('[data-lcd-select="1"] .ui-icon');assert.match(await ui.locator('[data-lcd-current]').textContent(),/Arena 27/);
  checks.push({width,purchase:true,reload:true,noOverflow:true});await context.close();
 }
 const lockedContext=await browser.newContext(),early=createGame();early.cash=10000;early.pcTiers=[3,3,3];early.totalMinutes=(2005-1998)*360*DAY_MINUTES;
 await lockedContext.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:GAME_SAVE_KEY,state:early});
 const earlyPage=await lockedContext.newPage();await earlyPage.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 await earlyPage.locator("#menu-continue").click();await earlyPage.locator("#open-admin").click();await selectAdminArea(earlyPage,'computers');await selectTask(earlyPage,'computers','operations');
 await earlyPage.locator('[data-pc-power="0"]').click();await selectTask(earlyPage,'computers','monitors');
 assert.equal(await earlyPage.locator('[data-lcd-buy="lcd05"]').isEnabled(),true);
 for(const id of ["lcd08","lcd12","lcd17","lcd24"])assert.equal(await earlyPage.locator('[data-lcd-buy="'+id+'"]').isDisabled(),true);
 await lockedContext.close();assert.deepEqual(errors,[]);
 const validation={cases:result.cases,checks,yearGate2005:true,uniqueModels:result.uniqueModels};
 await writeFile(resolve(output,"lcd_render_validation.json"),JSON.stringify(validation,null,2)+"\n");
 console.log(JSON.stringify({cases:result.cases.length,checks,yearGate2005:true,maxChannelDelta:Math.max(...result.cases.map(c=>c.maxChannelDelta))}));
}finally{await browser?.close();server.kill();}
