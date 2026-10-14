import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";

const output=resolve(process.argv[2]??"out/performance");await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});const page=await browser.newPage();
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const results=await page.evaluate(async()=>{
  const [{SceneRenderer},{createGame},{expandDirection},{placeFurniture,relocateFurniture}]=await Promise.all([
   import("./js/render/scene.js"),import("./js/sim/engine.js"),import("./js/sim/room.js"),import("./js/sim/shop.js")]);
  const surface=()=>{const canvas=document.createElement("canvas");canvas.width=1000;canvas.height=610;return canvas.getContext("2d");};
  const cached=surface(),direct=surface(),renderer=new SceneRenderer(cached),original=new SceneRenderer(direct);
  // Same drawing functions, with only the new background bitmap bypassed.
  original.drawBackground=function(s,camera,bounds,w,h){this.paintBackground(s,camera,bounds,w,h);};
  const s=createGame();s.cash=10000;const cases=[];
  const compare=name=>{
   renderer.draw(s,2);original.draw(s,2);
   const a=cached.getImageData(0,0,1000,610).data,b=direct.getImageData(0,0,1000,610).data;
   let pixels=0,max=0;
   for(let i=0;i<a.length;i+=4){let changed=false;for(let j=0;j<4;j++){const d=Math.abs(a[i+j]-b[i+j]);max=Math.max(max,d);changed ||=d>1;}if(changed)pixels++;}
   cases.push({name,pixelsChangedBeyondRounding:pixels,maxChannelDelta:max});
  };
  compare("initial");compare("cached-repeat");
  if(!expandDirection(s,"north").ok)throw Error("Expansão não comprada");compare("room-expansion");
  if(!placeFurniture(s,"poster","wall-1").ok)throw Error("Pôster não comprado");compare("new-poster");
  if(!relocateFurniture(s,"wall-1","wall-2").ok)throw Error("Pôster não movido");compare("poster-moved");
  if(!placeFurniture(s,"plant","floor-1").ok)throw Error("Planta não comprada");compare("floor-furniture");
  return cases;
 });
 for(const result of results)assert.equal(result.pixelsChangedBeyondRounding,0,"Cache muda arte: "+JSON.stringify(result));
 await writeFile(resolve(output,"render_cache_verification.json"),JSON.stringify(results,null,2)+"\n");console.log(JSON.stringify(results));
}finally{await browser?.close();server.kill();}
