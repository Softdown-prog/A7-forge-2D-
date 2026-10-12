// Record real browser gameplay with deterministic keyboard input and Playwright.
import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import http from "node:http";
const root=resolve(process.argv[2]||"out/magic_castle");
const dest=resolve(process.argv[3]||"out/magic_castle_video");
await mkdir(dest,{recursive:true});
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,"http://localhost"),p=resolve(root,"."+decodeURIComponent(url.pathname==="/" ? "/index.html":url.pathname));
  if(!p.startsWith(root+"/")){res.writeHead(403).end();return;}
  const data=await readFile(p);
  const type=p.endsWith(".html")?"text/html":p.endsWith(".js")?"application/javascript":p.endsWith(".css")?"text/css":p.endsWith(".svg")?"image/svg+xml":p.endsWith(".png")?"image/png":"application/octet-stream";
  res.writeHead(200,{"content-type":type});res.end(data);
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const url="http://127.0.0.1:"+server.address().port+"/";
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:900,height:620},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.goto(url);await page.waitForFunction(()=>Object.values(images).every(i=>i.complete&&i.naturalWidth)&&Object.values(art).every(i=>i.complete&&i.naturalWidth));
 // One recording that moves, fires, jumps, and shows all three enemy types.
 const ff=spawn("ffmpeg",["-y","-loglevel","error","-f","image2pipe","-framerate","20","-vcodec","png","-i","pipe:0","-c:v","libx264","-pix_fmt","yuv420p","-crf","20","-movflags","+faststart",resolve(dest,"magic_castle_scene_01.mp4")],{stdio:["pipe","inherit","inherit"]});
 const segments=[{frames:38,keys:["ArrowRight","Enter"]},{frames:18,keys:["ArrowRight","Space","Enter"]},{frames:36,keys:["ArrowRight","Enter"]},{frames:28,keys:["Enter"]},{frames:25,keys:["ArrowRight","Enter"]},{frames:24,keys:["ArrowLeft","Enter"]},{frames:25,keys:["Enter"]}];
 let frameNo=0;
 for(const segment of segments){await page.evaluate(keys=>{window.keys.clear();keys.forEach(k=>window.keys.add(k));},segment.keys);
 for(let i=0;i<segment.frames;i++){await page.evaluate(()=>{update(1/20);paint();});const shot=await page.locator("#game").screenshot({type:"png"});if(!ff.stdin.write(shot))await new Promise(ok=>ff.stdin.once("drain",ok));frameNo++;}}
 ff.stdin.end();
 const exit=await new Promise(ok=>ff.on("close",ok));
 if(exit!==0)throw Error("ffmpeg failed: "+exit);
 if(errors.length)throw Error("Browser runtime errors: "+errors.join("; "));
 console.log(JSON.stringify({video:"magic_castle_scene_01.mp4",frames:frameNo,fps:20,seconds:frameNo/20,errors}));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
