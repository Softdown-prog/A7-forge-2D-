/** Prévia visual com os MESMOS renderizadores do jogo e sem checkout.
 * Os direitos são simulados exclusivamente neste navegador de teste. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdir,readFile,rename} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const root=resolve(import.meta.dirname,'../dist'),out=resolve(process.argv[2]??'out/cookie-art');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??'/','http://localhost');
  const file=resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':types[extname(file)]??'application/octet-stream'}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 context=await browser.newContext({viewport:{width:1390,height:875},deviceScaleFactor:1,
  recordVideo:{dir:out,size:{width:1390,height:875}}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const [{createGame},{SceneRenderer},{setVerifiedCosmetics,cosmeticAvailable},
   {DAY_MINUTES},{drawActor},{drawVipAquarium},
   {vipProductThumbnail}]=await Promise.all([
    import('./js/sim/engine.js'),import('./js/render/scene.js'),
    import('./js/sim/premiumCosmetics.js'),import('./js/sim/types.js'),
    import('./js/render/actorArt.js'),import('./js/render/aquariumArt.js'),
    import('./js/ui/vipProductArt.js')
  ]);
  document.body.replaceChildren();
  document.body.style.cssText='margin:0;background:#0d1c2a;overflow:hidden';
  const game=createGame(2831,'historical');
  game.totalMinutes=(2015-1998)*360*DAY_MINUTES+245;
  const surface=document.createElement('canvas');surface.width=1000;surface.height=610;
  const painter=new SceneRenderer(surface.getContext('2d'));
  const frame=(ids,t)=>{
   setVerifiedCosmetics(ids);painter.draw(game,t);
   const copy=document.createElement('canvas');copy.width=1000;copy.height=610;
   copy.getContext('2d').drawImage(surface,0,0);return copy;
  };
  const unowned=frame([],1.25),onlyTony=frame(['tony-cyber'],1.25);
  const onlyAqua=frame(['aquarium-rgb'],1.25);
  const both=frame(['tony-cyber','aquarium-rgb'],1.25),revoked=frame([],1.25);
  const hash=canvas=>{
   const bytes=canvas.getContext('2d').getImageData(0,0,1000,610).data;
   let h=2166136261;for(let i=0;i<bytes.length;i+=31)h=Math.imul(h^bytes[i],16777619)>>>0;return h;
  };
  const checks=[unowned,onlyTony,onlyAqua,both,revoked].map(hash);
  if(checks[0]===checks[1]||checks[0]===checks[2]||checks[1]===checks[3]||
    checks[2]===checks[3]||checks[0]!==checks[4])throw Error('Direitos/cache: '+checks.join('/'));
  if(!vipProductThumbnail('tony-cyber')?.startsWith('data:image/png')||
    !vipProductThumbnail('aquarium-rgb')?.startsWith('data:image/png'))
   throw Error('Miniaturas não usam desenho do produto');
  const c=document.createElement('canvas');c.id='vip-showcase';
  c.width=1390;c.height=875;c.style.cssText='display:block;width:1390px;height:875px';
  document.body.append(c);
  const ctx=c.getContext('2d');
  const box=(x,y,w,h,r,color)=>{
   ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  };
  const txt=(str,x,y,size=16,color='#e4f4fb')=>{
   ctx.fillStyle=color;ctx.font='700 '+size+'px Arial,sans-serif';ctx.fillText(str,x,y);
  };
  const titleX=25;
  function paint(t){
   ctx.fillStyle='#0b1928';ctx.fillRect(0,0,1390,875);
   const bg=ctx.createLinearGradient(0,0,1390,115);
   bg.addColorStop(0,'#1a3544');bg.addColorStop(1,'#151e38');
   ctx.fillStyle=bg;ctx.fillRect(0,0,1390,120);
   ctx.fillStyle='#77edda';ctx.fillRect(25,25,7,69);
   txt('SOFTDOWN / COLEÇÃO VIP COOKIES',49,50,17,'#88ece1');
   txt('07 · TONY CYBER      +      08 · AQUÁRIO RGB',49,93,28);
   ctx.textAlign='right';txt('ARTE DO JOGO, NÃO IMAGENS ILUSTRATIVAS',1363,55,13,'#aacbd2');ctx.textAlign='left';
   // As duas imagens são amostras tiradas do MESMO motor do salão.
   for(const p of [
    {x:23,title:'SEM COSMÉTICOS',img:unowned,color:'#a0b6c4'},
    {x:701,title:'COM TONY CYBER E AQUÁRIO',img:both,color:'#82f0de'}
   ]){
    box(p.x,137,665,411,15,'#223849');
    ctx.fillStyle=p.color;ctx.fillRect(p.x+12,149,641,4);
    txt(p.title,p.x+20,183,19);
    ctx.drawImage(p.img,p.x+12,196,641,339);
   }
   box(24,563,657,274,13,'#1f3649');
   box(700,563,666,274,13,'#1f3649');
   txt('TONY CYBER · 60 COOKIES · DESDE 2010',43,597,17,'#9bf9ea');
   txt('AQUÁRIO RGB · 45 COOKIES · DESDE 2008',721,597,17,'#bca6ee');
   const dirs=['south','west','north','east'];
   for(let i=0;i<4;i++){
    const x=82+i*151;
    const cam={originX:x,originY:770,zoom:1.48};
    drawActor(ctx,cam,{x:0,y:0,kind:'owner',id:0,time:t,pose:'idle',
     direction:dirs[i],premiumCyber:true});
    txt(['FRENTE','ESQUERDA','COSTAS','DIREITA'][i],x-38,816,11,'#c2d6e3');
   }
   const aqCam={originX:845,originY:806,zoom:1.58};
   drawVipAquarium(ctx,aqCam,{x:0,y:0},t);
   txt('3 PEIXES · BOLHAS · LED ANIMADO',1007,668,13,'#b2d9df');
   txt('SUSPENSO NA PAREDE, SEM COLISÃO',1007,690,11,'#93b9ce');
   txt('SEM LUCRO, SATISFAÇÃO OU TEMPO EXTRA',24,862,13,'#b1cad7');
   ctx.textAlign='right';txt('DIREITOS VINCULADOS À CONTA',1363,862,13,'#9bded4');ctx.textAlign='left';
  }
  paint(1);
  window.__runVipDemo=()=>{
   const base=performance.now();window.__vipDone=false;
   function next(now){
    const time=Math.min(5,(now-base)/1000);
    paint(time);if(time>=5){window.__vipDone=true;return;}
    requestAnimationFrame(next);
   }
   requestAnimationFrame(next);
  };
  window.__vipCanvas={baseline:unowned,premium:both};
 });
 await page.locator('#vip-showcase').screenshot({path:resolve(out,'cookies_tony_cyber_aquario_comparacao.png')});
 for(const [which,name] of [['baseline','cookies_vip_salao_antes.png'],
   ['premium','cookies_vip_salao_depois.png']]){
  await page.evaluate(which=>{
   const el=document.createElement('canvas');el.width=1000;el.height=610;el.id='vip-room-capture';
   el.style.cssText='position:fixed;left:0;top:0;z-index:999999';
   el.getContext('2d').drawImage(window.__vipCanvas[which],0,0);
   document.body.append(el);
  },which);
  await page.locator('#vip-room-capture').screenshot({path:resolve(out,name)});
  await page.locator('#vip-room-capture').evaluate(el=>el.remove());
 }
 await page.evaluate(()=>window.__runVipDemo());
 await page.waitForFunction(()=>window.__vipDone===true,null,{timeout:20000});
 if(errors.length)throw Error('Browser: '+errors.join(' | '));
 const video=await page.video().path();
 await context.close();context=null;
 await rename(video,resolve(out,'cookies_tony_cyber_aquario_preview.webm'));
 console.log('VIP OK: baseline, Tony, aquarium, both, revocation, thumbnails and animated preview');
}finally{
 await context?.close();await browser?.close();
 await new Promise(done=>server.close(done));
}
