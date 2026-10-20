// Production artist + sprite worker, moving through the real isometric projection.
// npm run build && node scripts/verify_customer_walk.mjs [output] [before actorArt.js]
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,readFile,rename} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const out=resolve(process.argv[2]??"out/customer-walk");await mkdir(out,{recursive:true});
const before=process.argv[3]?await readFile(process.argv[3],"utf8"):null;
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser,context;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({viewport:{width:1200,height:900},recordVideo:{dir:out,size:{width:1200,height:900}}});
 const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const metrics=await page.evaluate(async before=>{
  const {drawActor}=await import("./js/render/actorArt.js");
  const {drawActorSprite}=await import("./js/render/actorSprites.js");
  const {screenViewForMotion}=await import("./js/render/direction.js");
  const canvas=()=>{const c=document.createElement("canvas");c.width=180;c.height=180;return c.getContext("2d");};
  const raw=canvas(),cached=canvas(),camera={originX:90,originY:150,zoom:.86};
  const views=["front-left","front-right","back-left","back-right","front","back","profile-left","profile-right"];
  const kinds=["regular","female","female-bob","female-ponytail","clown","vampire","rabbit","mouse-mascot","stitched-monster"];
  let cases=0,bitmapDraws=0,maxMissing=0,maxError=0;
  const drawImage=cached.drawImage;cached.drawImage=function(...args){bitmapDraws++;return drawImage.apply(this,args);};
  const compare=(a)=>{
   raw.clearRect(0,0,180,180);cached.clearRect(0,0,180,180);
   drawActor(raw,camera,a);drawActorSprite(cached,camera,a);
   const x=raw.getImageData(0,0,180,180).data,y=cached.getImageData(0,0,180,180).data;
   let missing=0,error=0,pixels=0;
   for(let i=0;i<x.length;i+=4){
    if(x[i+3]>200&&!y[i+3])missing++;
    if(x[i+3]||y[i+3]){pixels++;for(let c=0;c<4;c++)error+=Math.abs(x[i+c]-y[i+c]);}
   }
   maxMissing=Math.max(missing,maxMissing);maxError=Math.max(maxError,error/(pixels*4));cases++;
  };
  for(const kind of kinds)for(const screenView of views){
   for(const walkDistance of [0,7.5,15,22.5,30,37.5]){
    drawActorSprite(cached,camera,{x:0,y:0,kind,id:31,time:987,pose:"walking",screenView,walkDistance});
   }
   const deadline=performance.now()+5000;
   while(true){
    const count=bitmapDraws;
    drawActorSprite(cached,camera,{x:0,y:0,kind,id:31,time:987,pose:"walking",screenView,walkDistance:37.5});
    if(bitmapDraws>count)break;
    if(performance.now()>deadline)throw Error("Sprite worker timeout");
    await new Promise(ok=>setTimeout(ok,20));
   }
   for(const walkDistance of [0,7.5,15,22.5,30,37.5]){
    const a={x:0,y:0,kind,id:31,time:987,pose:"walking",screenView,walkDistance};
    const count=bitmapDraws;compare(a);
    if(bitmapDraws!==count+1)throw Error("Frame was not served by sprite worker");
    raw.clearRect(0,0,180,180);drawActor(raw,camera,a);
    const one=raw.getImageData(0,0,180,180).data;
    raw.clearRect(0,0,180,180);drawActor(raw,camera,{...a,time:12345});
    const two=raw.getImageData(0,0,180,180).data;
    if(!one.every((v,i)=>v===two[i]))throw Error("Clock changed distance-driven stride");
   }
  }
  let old=drawActor;
  if(before){
   const code=before.replace(/from "\.\/(.*?)"/g,(_,file)=>`from "${location.origin}/js/render/${file}"`);
   const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));old=(await import(url)).drawActor;
  }
  document.body.replaceChildren();document.body.style.cssText="margin:0;background:#172d29;overflow:hidden";
  const sheet=document.createElement("canvas");sheet.width=1200;sheet.height=900;document.body.append(sheet);const ctx=sheet.getContext("2d");
  const steps=[[0,1],[1,0],[-1,0],[0,-1]];
  const label=(text,x,y,size=15)=>{ctx.font=`600 ${size}px system-ui`;ctx.fillStyle="#dce7bc";ctx.fillText(text,x,y);};
  window.drawWalk=(t)=>{
   ctx.fillStyle="#172d29";ctx.fillRect(0,0,1200,900);
   label("LHS / CAMINHADA DOS CLIENTES",24,36,23);
   label(before?"Mesmo caminho e velocidade · renderizador do jogo · antes / agora":"Mesmo caminho e velocidade · passada por tempo / por distância",24,62,15);
   for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const [dx,dy]=steps[col],view=screenViewForMotion(dx,dy),kind=row<2?"regular":"female-bob";
    const x=col*300,y=85+row*200;
    ctx.strokeStyle="#335348";ctx.strokeRect(x+8,y,284,190);
    label((row%2===0?(before?"ANTES":"POR TEMPO"):"AGORA")+" / "+view,x+20,y+23,13);
    const length=Math.hypot((dx-dy)*64,(dx+dy)*32),distance=t*42;
    ctx.strokeStyle="#577769";ctx.beginPath();ctx.moveTo(x+105,y+145);ctx.lineTo(x+105+(dx-dy)*64/length*110,y+145+(dx+dy)*32/length*110);ctx.stroke();
    (row%2===0?old:drawActor)(ctx,{originX:x+105,originY:y+145,zoom:1.15},
     {x:dx*distance/length,y:dy*distance/length,kind,id:2,time:t,pose:"walking",screenView:view,
      walkDistance:row%2===0?undefined:distance});
   }
  };
  window.drawWalk(.4);
  return {cases,bitmapDraws,maxMissing,maxError};
 },before);
 assert.equal(metrics.cases,432);assert.ok(metrics.bitmapDraws>=432,"worker did not supply all requested frames");
 assert.ok(metrics.maxMissing<25,JSON.stringify(metrics));assert.ok(metrics.maxError<14,JSON.stringify(metrics));
 await page.screenshot({path:resolve(out,"comparison.png")});
 await page.evaluate(()=>{
  window.done=false;const start=performance.now();
  const frame=now=>{const t=(now-start)/1000;window.drawWalk(t%2.2);if(t>6.5){window.done=true;return;}requestAnimationFrame(frame);};requestAnimationFrame(frame);
 });
 await page.waitForFunction(()=>window.done,null,{timeout:15000});assert.deepEqual(errors,[]);
 const video=await page.video().path();await context.close();context=null;
 await rename(video,resolve(out,"comparison.webm"));
 await writeFile(resolve(out,"verification.json"),JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));
}finally{await context?.close();await browser?.close();server.kill();}
