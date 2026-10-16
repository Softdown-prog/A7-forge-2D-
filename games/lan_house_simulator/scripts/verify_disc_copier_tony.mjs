// Verifica arte de copiadora sobre balcão, gesto do Tony e quatro rotações.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";

const out=resolve(process.argv[2]??"out/disc-copier-tony");
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try {
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);server.once("exit",code=>fail(Error("Server stopped "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const results=[];
 for(const width of [1280,414,360]){
  const mobile=width<700;
  const context=await browser.newContext({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const data=await page.evaluate(async()=>{
   const [{createGame},{buyDiscCopier,serveDiscCopy,copyingAnimationActive},
    {buyPrinter,servePrinting,printingAnimationActive},{SceneRenderer},
    {drawActor,actorHitbox},{editableObjects},{DAY_MINUTES}]=await Promise.all([
     import("./js/sim/engine.js"),import("./js/sim/discCopy.js"),
     import("./js/sim/printService.js"),import("./js/render/scene.js"),
     import("./js/render/actorArt.js"),import("./js/sim/editableObjects.js"),
     import("./js/sim/types.js")]);
   const surface=(w=1000,h=610)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
   const draw=s=>{const c=surface();new SceneRenderer(c.getContext("2d")).draw(s,.95);return c;};
   const changed=(a,b)=>{const aa=a.getContext("2d").getImageData(0,0,a.width,a.height).data;
    const bb=b.getContext("2d").getImageData(0,0,b.width,b.height).data;let count=0;
    for(let i=0;i<aa.length;i+=4)if(aa[i]!==bb[i]||aa[i+1]!==bb[i+1]||aa[i+2]!==bb[i+2])count++;
    return count;};
   const checks=[];const images={};
   for(let rotation=0;rotation<4;rotation++){
    const s=createGame(15,"historical");s.totalMinutes=3*360*DAY_MINUTES;s.cash=4000;
    s.objectPlacements=[{id:"counter",x:.9,y:1.42,rotation}];
    const originalLayout=JSON.stringify(editableObjects(s));
    const before=draw(s);
    const bought=buyDiscCopier(s);
    const installed=draw(s);
    const layoutSame=originalLayout===JSON.stringify(editableObjects(s));
    const sale=serveDiscCopy(s,{id:15,stage:"waiting",serviceRequest:"disc-copy",wallet:40});
    const copying=draw(s);
    // A presença de impressora não pode apagar a copiadora.
    buyPrinter(s);
    const both=draw(s);
    const printed=servePrinting(s,{id:4,stage:"waiting",serviceRequest:"printing",wallet:40});
    const bothActive=draw(s);
    checks.push({rotation,price:bought.ok?900:0,paid:!!sale,printed:!!printed,
      installedPixels:changed(before,installed),copyFrames:changed(installed,copying),
      combinedPixels:changed(copying,both),bothFrames:changed(both,bothActive),
      layoutSame,copyingActive:copyingAnimationActive(s),printingActive:printingAnimationActive(s)});
    if(rotation===0){images.before=before.toDataURL();images.installed=installed.toDataURL();
      images.copying=copying.toDataURL();images.both=both.toDataURL();images.bothActive=bothActive.toDataURL();}
   }
   const directions=["south","west","north","east"],actors=[];
   for(const direction of directions){
    const a=surface(190,220),b=surface(190,220),camera={originX:95,originY:199,zoom:1.5};
    const props={x:0,y:0,kind:"owner",id:0,time:.95,direction};
    drawActor(a.getContext("2d"),camera,{...props,pose:"idle"});
    drawActor(b.getContext("2d"),camera,{...props,pose:"copying"});
    const hit=actorHitbox(camera,0,0);
    actors.push({direction,difference:changed(a,b),sameHitbox:hit.width===75&&hit.height>100});
   }
   return {checks,actors,images};
  });
  for(const c of data.checks){
   assert.equal(c.price,900);assert.equal(c.paid,true);assert.equal(c.printed,true);
   assert.equal(c.layoutSame,true);
   assert.ok(c.installedPixels>25,"Copiadora precisa aparecer no balcão "+c.rotation);
   assert.ok(c.copyFrames>12,"Cópia paga precisa ativar animação "+c.rotation);
   assert.ok(c.combinedPixels>25,"Impressora e copiadora precisam coexistir "+c.rotation);
   assert.ok(c.bothFrames>12,"Ambos os equipamentos devem animar "+c.rotation);
   assert.equal(c.copyingActive,true);assert.equal(c.printingActive,true);
  }
  for(const c of data.actors){assert.ok(c.difference>10);assert.equal(c.sameHitbox,true);}
  if(width===1280)for(const [name,img]of Object.entries(data.images)){
   await writeFile(resolve(out,"disc_copier_"+name+".png"),Buffer.from(img.split(",")[1],"base64"));
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=3);assert.deepEqual(errors,[]);
  results.push({width,checks:data.checks,actors:data.actors,overflow,errors});
  await context.close();
 }
 await writeFile(resolve(out,"disc_copier_tony_validation.json"),JSON.stringify({results},null,2));
 console.log(JSON.stringify({results:results.map(x=>({width:x.width,rotations:x.checks.length,errors:x.errors.length}))}));
}finally{await browser?.close();server.kill();}
