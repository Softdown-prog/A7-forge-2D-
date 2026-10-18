// Check the real purchase, catalog artwork and Tony's paid printing gesture.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const output=resolve(process.argv[2]??"out/printer-tony");
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);server.once("exit",code=>fail(Error("Server stopped: "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700,ctx=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  const press=loc=>mobile?loc.tap():loc.click();
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await press(page.locator("#menu-new"));
  await press(page.locator("#open-shop"));
  const printerCard=page.locator("#shop-catalog .shop-card").filter({has:page.locator('button[data-buy="printer"]')});
  const img=printerCard.locator('.shop-art img');
  assert.equal(await img.count(),1,"printer keeps its own rendered artwork");
  const artwork=await img.evaluate(async image=>{
   await image.decode();const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const c=canvas.getContext("2d");c.drawImage(image,0,0);const p=c.getImageData(0,0,canvas.width,canvas.height).data;
   const colors=new Set();
   for(let i=0;i<p.length;i+=80)colors.add((p[i]<<16)|(p[i+1]<<8)|p[i+2]);
   return {colors:colors.size,width:canvas.width,height:canvas.height};
  });
  assert.ok(artwork.colors>18,"art cannot be a generic icon or flat rectangle");
  assert.equal(await printerCard.locator('button[data-buy="printer"]').innerText().then(t=>t.includes("320")),true);
  await img.screenshot({path:resolve(output,'printer_catalog_'+width+'.png')});
  await press(printerCard.locator('button[data-buy="printer"]'));
  assert.match(await printerCard.locator('button[data-buy="printer"]').innerText(),/serviço ativo/i);
  assert.equal(await printerCard.locator('button[data-buy="printer"]').isDisabled(),true);
  await press(page.locator("#close-shop"));
  const proof=await page.evaluate(async()=>{
   const [{createGame},{buyPrinter},{SceneRenderer},{editableObjects},{servePrinting}]=await Promise.all([
    import("./js/sim/engine.js"),import("./js/sim/printService.js"),
    import("./js/render/scene.js"),import("./js/sim/editableObjects.js"),import("./js/sim/printService.js")
   ]);
   const state=createGame(11,"historical");
   state.cash=1000;
   const first=JSON.stringify(editableObjects(state));
   const draw=(s,time)=>{
    const el=document.createElement("canvas");el.width=1000;el.height=610;
    new SceneRenderer(el.getContext("2d")).draw(s,time);
    return el;
   };
   const before=draw(state,.7);
   buyPrinter(state);
   const afterPurchase=draw(state,.7);
   const still=JSON.stringify(editableObjects(state));
   state.totalMinutes=40;
   const customer={id:4,stage:"to_pc",wallet:30};
   const sale=servePrinting(state,customer);
   const running=draw(state,.7);
   const pixels=(a,b)=>{
    const x=a.getContext("2d").getImageData(0,0,1000,610).data;
    const y=b.getContext("2d").getImageData(0,0,1000,610).data;
    let count=0;for(let i=0;i<x.length;i+=4)if(x[i]!==y[i]||x[i+1]!==y[i+1]||x[i+2]!==y[i+2])count++;return count;
   };
   const staticDifference=pixels(before,afterPurchase);
   const activeDifference=pixels(afterPurchase,running);
   return {sameLayout:first===still,purchased:Boolean(state.printer),
    paidPrint:Boolean(sale),staticDifference,activeDifference,
    sceneAfter:afterPurchase.toDataURL(),sceneActive:running.toDataURL()};
  });
  assert.equal(proof.sameLayout,true,"printer must not create a new collision/object");
  assert.equal(proof.purchased,true);
  assert.equal(proof.paidPrint,true);
  assert.ok(proof.staticDifference>40,"printer must be visible in the game");
  assert.ok(proof.activeDifference>12,"printing frames must differ from resting frame");
  for(const [name,data] of [["installed",proof.sceneAfter],["printing",proof.sceneActive]]){
   if(width===1280)await writeFile(resolve(output,'printer_'+name+'_scene.png'),Buffer.from(data.split(",")[1],"base64"));
  }
  assert.deepEqual(errors,[]);
  reports.push({width,artwork,purchase:true,staticDifference:proof.staticDifference,activeDifference:proof.activeDifference,errors});
  await ctx.close();
 }
 await writeFile(resolve(output,"printer_tony_validation.json"),JSON.stringify({reports},null,2));
 console.log(JSON.stringify({reports}));
}finally{await browser?.close();server.kill();}
