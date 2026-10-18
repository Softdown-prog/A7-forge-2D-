/** Cookie-art smoke. Preview-only entitlement injection, no purchase or credit. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdir,readFile,rename} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const root=resolve(import.meta.dirname,'../dist');
const out=resolve(process.argv[2]??'out/cookie-art');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url??'/','http://localhost');
  const target=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(target!==root&&!target.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(target);
  res.writeHead(200,{'content-type':mime[extname(target)]??'application/octet-stream'}).end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 context=await browser.newContext({viewport:{width:1000,height:610},
  recordVideo:{dir:out,size:{width:1000,height:610}}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const [{createGame},{SceneRenderer},{setVerifiedCosmetics},{DAY_MINUTES}]=await Promise.all([
   import('./js/sim/engine.js'),import('./js/render/scene.js'),
   import('./js/sim/premiumCosmetics.js'),import('./js/sim/types.js')]);
  document.body.replaceChildren();
  document.body.style.cssText='margin:0;overflow:hidden;background:#0a1625';
  const canvas=document.createElement('canvas');
  canvas.width=1000;canvas.height=610;document.body.append(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('No Canvas 2D');
  const s=createGame(2000,'historical'),scene=new SceneRenderer(ctx);
  setVerifiedCosmetics(['pixel-led-clock']); // mock ownership for artwork only
  window.__clockDraw=(year,minute,seconds)=>{
   s.totalMinutes=(year-1998)*360*DAY_MINUTES+minute;
   scene.draw(s,seconds);
  };
  window.__clockDraw(2000,270,1); // 14:30
 });
 await page.locator('canvas').screenshot({path:resolve(out,'cookies_pixel_clock_aberto.png')});
 await page.evaluate(()=>window.__clockDraw(2000,690,2)); // 21:30
 await page.locator('canvas').screenshot({path:resolve(out,'cookies_pixel_clock_fechamento.png')});
 await page.evaluate(()=>window.__clockDraw(1999,270,2));
 await page.locator('canvas').screenshot({path:resolve(out,'cookies_pixel_clock_bloqueado_1999.png')});
 await page.evaluate(()=>{
  window.__clockDone=false;
  const start=performance.now();
  const loop=now=>{
   const elapsed=(now-start)/1000;
   if(elapsed>=3){window.__clockDone=true;return;}
   window.__clockDraw(2000,elapsed<1.5?275:690,elapsed);
   requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
 });
 await page.waitForFunction(()=>window.__clockDone===true,null,{timeout:12000});
 if(errors.length)throw Error(errors.join(' | '));
 const source=await page.video().path();
 await context.close();context=null;
 await rename(source,resolve(out,'cookies_pixel_clock_preview.webm'));
 console.log('Relógio Pixel LED: game scene screenshots + animation OK (no real purchase).');
}finally{
 await context?.close();await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
