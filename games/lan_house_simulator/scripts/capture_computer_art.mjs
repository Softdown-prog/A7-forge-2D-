// Production Canvas rendering, before/after and cache invalidation checks.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const output=resolve(process.argv[2]??"out/computers");await mkdir(output,{recursive:true});
const before=process.argv[3]?await readFile(resolve(process.argv[3]),"utf8"):null;
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",n=>reject(Error("Servidor: "+n)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const result=await page.evaluate(async before=>{
  const [{drawRetroComputer,drawSeatedKeyboardOverlay},{createGame},{drawActor,actorStyleFor}]=await Promise.all([
   import("./js/render/retroComputer.js"),import("./js/sim/engine.js"),import("./js/render/actorArt.js")]);
  let old;
  if(before){
   const code=before.replace(/from\s+["'](\.[^"']+)["']/g,(_,path)=>"from "+JSON.stringify(new URL(path,location.origin+"/js/render/retroComputer.js").href));
   const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));old=(await import(url)).drawRetroComputer;URL.revokeObjectURL(url);
  }
  const surface=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
  const label=(c,text,x,y,size=18)=>{c.textAlign="left";c.fillStyle="#e9e5c6";c.font=`600 ${size}px system-ui`;c.fillText(text,x,y);};
  const s=createGame();s.pcTiers=[1,2,3];s.pcGpus=[null,null,"gpu09"];
  const gallery=surface(1200,850),g=gallery.getContext("2d");g.fillStyle="#192f2a";g.fillRect(0,0,1200,850);
  label(g,"Computadores do salão · mesmo encaixe, mais detalhe",25,35,24);
  for(let row=0;row<2;row++)for(let index=0;index<3;index++){
   const cam={originX:190+index*390,originY:260+row*340,zoom:2.2};
   label(g,(row===0&&old?"Antes":"Agora")+" · nível "+(index+1),45+index*390,77+row*340);
   const draw=row===0&&old?old:drawRetroComputer;draw(g,cam,{x:0,y:0},index,.4,true,s);
  }
  label(g,"Teclado, mouse, cabos, gaveteiro e cadeira integrados",25,797,19);
  const seated=surface(930,400),sc=seated.getContext("2d");sc.fillStyle="#192f2a";sc.fillRect(0,0,930,400);
  label(sc,"Cliente sentado · mãos no teclado",24,32,22);
  const cam={originX:240,originY:240,zoom:2.2},p={x:0,y:0};
  s.customers=[{id:2,x:.35,y:.82,pcIndex:1,stage:"using"}];
  drawRetroComputer(sc,cam,p,1,.4,true,s);
  drawActor(sc,cam,{x:.35,y:.82,kind:"regular",id:2,time:.4,pose:"sitting",direction:"north"});
  const style=actorStyleFor("regular",2);drawSeatedKeyboardOverlay(sc,cam,p,.4,style.skin,style.shirt);
  for(const [index,online,wear,title] of [[0,false,0,"Sem rede"],[2,true,100,"Em manutenção"]]){
   s.pcWear[index]=wear;drawRetroComputer(sc,{originX:570+(index===2?220:0),originY:240,zoom:1.6},p,index,.4,online,s);
   label(sc,title,475+(index===2?220:0),80,17);
  }
  // Compare the same geometry with/without cache across fractional camera
  // positions and changed hardware, occupied seats, network, faults and pulses.
  const a=surface(600,400),b=surface(600,400),ac=a.getContext("2d"),bc=b.getContext("2d"),cases=[];
  for(const zoom of [.42,.86,1.8])for(const tier of [1,2,3])for(const mode of ["ready","busy","offline","maintenance"]){
   s.pcTiers[0]=tier;s.pcWear[0]=mode==="maintenance"?100:0;s.pcGpus[0]=tier===3?"gpu11":null;
   s.customers=mode==="busy"?[{id:2,pcIndex:0,stage:"using"}]:[];
   const camera={originX:225.37,originY:190.63,zoom},position={x:1.125,y:.375};
   const snapshot=JSON.stringify(s);
   for(const time of [.1,.8])for(const alpha of [1,.4]){
    // Production scenes have an opaque floor/background. Reading straight RGB
    // from near-transparent edges overstates invisible premultiplication noise.
    ac.globalAlpha=bc.globalAlpha=1;ac.fillStyle=bc.fillStyle="#213c33";
    ac.fillRect(0,0,600,400);bc.fillRect(0,0,600,400);
    ac.globalAlpha=bc.globalAlpha=alpha;
    drawRetroComputer(ac,camera,position,0,time,mode!=="offline",s);
    drawRetroComputer(bc,camera,position,0,time,mode!=="offline",s,false);
    const aa=ac.getImageData(0,0,600,400).data,bb=bc.getImageData(0,0,600,400).data;
    let changed=0,max=0,sum=0;
    for(let i=0;i<aa.length;i++){const d=Math.abs(aa[i]-bb[i]);max=Math.max(max,d);sum+=d;if(d>1)changed++;}
    if(JSON.stringify(s)!==snapshot)throw Error("Renderer alterou o save");
    cases.push({zoom,tier,mode,time,alpha,channelsChangedBeyondRounding:changed,maxChannelDelta:max,meanChannelDelta:sum/aa.length});
   }
  }
  return {gallery:gallery.toDataURL(),seated:seated.toDataURL(),cases};
 },before);
 assert.equal(errors.length,0,errors.join("; "));
 for(const [key,file] of [["gallery","lhs_computers_before_after.png"],["seated","lhs_computer_seated_and_status.png"]])
  await writeFile(resolve(output,file),Buffer.from(result[key].split(",")[1],"base64"));
 await writeFile(resolve(output,"computer_render_validation.json"),JSON.stringify(result.cases,null,2)+"\n");
 // Offscreen Canvas can rasterize a handful of antialiased edge channels
 // differently. Bound those differences; stale sprites or clipping fail by
 // hundreds of pixels or full-color deltas, rather than isolated edge noise.
 for(const test of result.cases){
  assert.ok(test.maxChannelDelta<=24&&test.channelsChangedBeyondRounding<=150&&test.meanChannelDelta<.003,
   "Cache altera a arte além das bordas antialias: "+JSON.stringify(test));
  if(test.alpha!==1)assert.equal(test.maxChannelDelta,0,"Prévia transparente deve usar desenho direto");
 }
 console.log(JSON.stringify({cases:result.cases.length,maxChannelDelta:Math.max(...result.cases.map(c=>c.maxChannelDelta))}));
}finally{await browser?.close();server.kill();}
