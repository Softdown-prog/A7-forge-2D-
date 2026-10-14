import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=resolve(import.meta.dirname,"../out/site"),port=4287;
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",
 ".svg":"image/svg+xml",".webp":"image/webp",".json":"application/json"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url??"/","http://localhost").pathname);
  const dest=resolve(root,"."+pathname,pathname.endsWith("/")?"index.html":"");
  if(!dest.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const info=await stat(dest);if(!info.isFile())throw Error("not a file");
  res.writeHead(200,{"Content-Type":mime[extname(dest)]??"application/octet-stream"});
  res.end(await readFile(dest));
 }catch{res.writeHead(404);res.end("Arquivo não encontrado");}
});
await new Promise((ok,reject)=>server.listen(port,"127.0.0.1",err=>err?reject(err):ok()));
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];
  page.on("pageerror",err=>errors.push(String(err)));
  for(const [path,selector] of [["/",".screen"],["/sobre-o-jogo/",".salon-figure"]]){
   await page.goto("http://127.0.0.1:"+port+path,{waitUntil:"networkidle"});
   const img=page.locator("img[data-scene-preview]");
   if(await img.count())await img.scrollIntoViewIfNeeded();
   await page.locator(selector+" canvas[role=img],canvas"+selector+"[role=img]").waitFor({state:"visible",timeout:12000});
   const result=await page.locator("canvas[role=img]").first().evaluate(canvas=>{
    const {width,height}=canvas,pixels=canvas.getContext("2d").getImageData(0,0,width,height).data;
    let covered=0;for(let i=3;i<pixels.length;i+=32)if(pixels[i]>0)covered++;
    return {width,height,covered};
   });
   assert.equal(result.width,1000);assert.equal(result.height,610);
   assert.ok(result.covered>10000,"Renderização não pintou o salão real");
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log("Prévia do balcão pelo SceneRenderer: site e sobre-o-jogo aprovados em desktop e celular");
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
