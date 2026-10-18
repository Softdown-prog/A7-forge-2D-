/** Prévia de arte procedurais da coleção Cookies, sem transação nem save editado. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdir,readFile,rename} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../dist'),out=resolve(process.argv[2]??'out/cookie-art');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url??'/','http://127.0.0.1'),file=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream'}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 context=await browser.newContext({viewport:{width:1380,height:800},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1380,height:800}}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const [{createGame,pcPosition},{DAY_MINUTES},{drawRetroComputer},
   {drawNeonOpenSign,neonOpenLit},{setVerifiedCosmetics},
   {SceneRenderer}]=await Promise.all([
    import('./js/sim/engine.js'),import('./js/sim/types.js'),
    import('./js/render/retroComputer.js'),import('./js/render/neonOpenArt.js'),
    import('./js/sim/premiumCosmetics.js'),import('./js/render/scene.js')
  ]);
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:#0b1623;overflow:hidden';
  const canvas=document.createElement('canvas');canvas.width=1380;canvas.height=800;
  canvas.style.cssText='display:block;width:1380px;height:800px';document.body.append(canvas);
  const c=canvas.getContext('2d');if(!c)throw Error('Canvas indisponível');
  const s=createGame(1902,'historical');
  s.totalMinutes=(2015-1998)*360*DAY_MINUTES+500;
  s.pcTiers=[3,3,3];
  const p=pcPosition(0,s);
  setVerifiedCosmetics(['keyboard-rainbow-rgb','neon-open-sign']);
  function box(x,y,w,h,r,color){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();}
  function txt(t,x,y,size,color='#f4f8ff',bold=true){c.fillStyle=color;c.font=(bold?'bold ':'')+size+'px Arial';c.fillText(t,x,y);}
  function draw(t){
   c.fillStyle='#0b1623';c.fillRect(0,0,1380,800);
   const bg=c.createLinearGradient(0,0,1380,120);
   bg.addColorStop(0,'#153145');bg.addColorStop(1,'#101827');
   c.fillStyle=bg;c.fillRect(0,0,1380,116);
   c.fillStyle='#6eeedf';c.fillRect(30,28,7,66);
   txt('SOFTDOWN · COLEÇÃO COOKIES',55,55,19,'#7ae6e3');
   txt('PRODUTOS 03 E 04 — ARTE DO PRÓPRIO JOGO',55,91,28);
   c.textAlign='right';txt('DESENHO ISOMÉTRICO · SEM COBRANÇA',1347,53,13,'#b7c8d3');
   c.textAlign='left';
   const panels=[{x:23,w:652,color:'#6be5dd'},{x:705,w:652,color:'#f3a2c8'}];
   for(const panel of panels){box(panel.x,137,panel.w,610,16,'#1d3141');box(panel.x+8,145,panel.w-16,593,12,'#253d4c');box(panel.x+16,148,panel.w-32,6,3,panel.color);}
   txt('TECLADO RAINBOW RGB',51,198,25);
   txt('25 COOKIES · DISPONÍVEL A PARTIR DE 2012',51,223,14,'#88e8dc');
   txt('PLACA NEON ABERTO',733,198,25);
   txt('30 COOKIES · DISPONÍVEL DESDE 1998',733,223,14,'#ffb7d7');
   // Cena de computador: mesa, CRT/LCD, periféricos e cadeira reais do runtime.
   c.save();c.beginPath();c.roundRect(43,244,612,278,10);c.clip();
   c.fillStyle='#142734';c.fillRect(43,244,612,278);
   const focus={x:p.x+.38,y:p.y+.41},zoom=2.55;
   const cam={zoom,originX:354-(focus.x-focus.y)*64*zoom,originY:423-(focus.x+focus.y)*32*zoom};
   drawRetroComputer(c,cam,p,0,t,true,s,false);c.restore();
   txt('EQUIPAMENTO COMPLETO COM TECLADO INSTALADO',56,542,13,'#b7cddd');
   // Macro real do mesmo teclado renderizado no mesmo módulo.
   c.save();c.beginPath();c.roundRect(43,555,612,150,12);c.clip();
   c.fillStyle='#111f31';c.fillRect(43,555,612,150);
   const world={x:p.x+.36,y:p.y+.435},focusZ=37.5,z=6.0;
   const close={zoom:z,originX:345-(world.x-world.y)*64*z,
    originY:625-(world.x+world.y)*32*z+focusZ*z};
   drawRetroComputer(c,close,p,0,t,true,s,false);
   c.restore();
   txt('ZOOM DO PERIFÉRICO — TECLAS ILUMINADAS',56,724,12,'#bcd7e6');
   // A placa pendurada, e duas renderizações idênticas sob luz ligada/desligada.
   for(let i=0;i<2;i++){
    const x=737+i*305;
    box(x,255,286,330,12,'#152533');
    c.fillStyle=i?'#16202e':'#2e4b57';c.fillRect(x+12,267,262,306);
    const signCam={zoom:1.5,originX:x+143,originY:570};
    drawNeonOpenSign(c,signCam,{x:0,y:0},t,i===0);
    txt(i?'21:00 · LUZES APAGADAS':'20:59 · LUZES ACESAS',x+14,287,12,i?'#879ba9':'#83efda');
   }
   txt('ARMAÇÃO METÁLICA · VIDRO NEON · LIGA/DESLIGA',732,627,15,'#e4cbd9');
   txt('POSICIONADA SOBRE A PORTA NO SALÃO REAL',732,654,13,'#b4c8d3',false);
   txt('0 VANTAGEM NO NEGÓCIO · DIREITOS VINCULADOS À CONTA',47,775,14,'#9bb5c4');
  }
  window.__cookieDraw=draw;
  window.__cookieDone=false;
  window.__cookieStart=()=>{
   const begin=performance.now();function tick(now){
    const t=Math.min(6,(now-begin)/1000);draw(t);
    if(t>=6){window.__cookieDone=true;return;}requestAnimationFrame(tick);
   }requestAnimationFrame(tick);
  };
  window.__sceneCapture=(minute)=>{
   const temp=document.createElement('canvas');temp.id='scene-capture';
   temp.width=1000;temp.height=610;temp.style.cssText='position:fixed;left:0;top:0;z-index:9999';
   document.body.append(temp);
   s.totalMinutes=(2015-1998)*360*DAY_MINUTES+minute;
   new SceneRenderer(temp.getContext('2d')).draw(s,1.2);
   if(neonOpenLit(s.totalMinutes)!==(minute<660))throw Error('Falha de horário');
   return true;
  };
  draw(.7);
 });
 await page.locator('canvas').screenshot({path:resolve(out,'cookies_teclado_placa_preview.png')});
 await page.evaluate(()=>window.__sceneCapture(580));
 await page.locator('#scene-capture').screenshot({path:resolve(out,'cookies_neon_porta_aberta.png')});
 await page.locator('#scene-capture').evaluate(el=>el.remove());
 await page.evaluate(()=>window.__sceneCapture(660));
 await page.locator('#scene-capture').screenshot({path:resolve(out,'cookies_neon_porta_fechando.png')});
 await page.locator('#scene-capture').evaluate(el=>el.remove());
 await page.evaluate(()=>window.__cookieStart());
 await page.waitForFunction(()=>window.__cookieDone===true,null,{timeout:22000});
 if(errors.length)throw Error(errors.join(' | '));
 const video=await page.video().path();
 await context.close();context=null;
 await rename(video,resolve(out,'cookies_teclado_placa_preview.webm'));
 console.log('COOKIES VISUAL PASS: macro teclado, porta em dois horários e MP4.');
}finally{
 await context?.close();await browser?.close();await new Promise(done=>server.close(done));
}
