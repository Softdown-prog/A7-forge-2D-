/**
 * Preview de arte: injeta entitlements APENAS neste teste isolado.
 * Em produção somente o GET /v1/account autenticado concede propriedade.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {mkdir,readFile,rename} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const root=resolve(import.meta.dirname,'../dist');
const out=resolve(process.argv[2]??'out/cookie-art');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{const u=new URL(req.url??'/','http://localhost');
  const file=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403).end();return;}
  res.writeHead(200,{'content-type':mime[extname(file)]??'application/octet-stream'}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 context=await browser.newContext({viewport:{width:1470,height:840},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1470,height:840}}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const [{createGame,pcPosition},{computerSeat},{drawRetroComputer,drawSeatedKeyboardOverlay},
    {drawActor,actorStyleFor},{setVerifiedCosmetics,headsetOnSession},
    {DAY_MINUTES}]=await Promise.all([
    import('./js/sim/engine.js'),
    import('./js/sim/route.js'),import('./js/render/retroComputer.js'),
    import('./js/render/actorArt.js'),import('./js/sim/premiumCosmetics.js'),
    import('./js/sim/types.js')]);
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:#0a111d;overflow:hidden';
  const canvas=document.createElement('canvas');canvas.width=1470;canvas.height=840;
  canvas.style.cssText='display:block;width:1470px;height:840px';document.body.append(canvas);
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível');
  const s=createGame(1610,'historical');
  s.totalMinutes=(2015-1998)*360*DAY_MINUTES+12;
  s.pcTiers=[3,3,3];s.customers=[{stage:'using',pcIndex:0}];
  const p=pcPosition(0,s),seat=computerSeat(p);
  if(!headsetOnSession(10,0)){
   const id=Array.from({length:200},(_,i)=>i+1).find(id=>headsetOnSession(id,0));
   if(id===undefined)throw Error('Nenhum cliente válido para usar fone');
   window.__demoCustomerId=id;
  }else window.__demoCustomerId=10;
  function rect(x,y,w,h,fill,r=0){
   ctx.fillStyle=fill;ctx.beginPath();if(r)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill();
  }
  function label(text,x,y,size,color='#e5f2fa',weight='bold'){
   ctx.fillStyle=color;ctx.font=weight+' '+size+'px Arial, sans-serif';ctx.fillText(text,x,y);
  }
  function draw(t){
   ctx.fillStyle='#0a111d';ctx.fillRect(0,0,1470,840);
   const header=ctx.createLinearGradient(0,0,1470,220);
   header.addColorStop(0,'#141f31');header.addColorStop(1,'#0b1727');
   rect(0,0,1470,124,header);
   rect(23,23,7,76,'#75e9df',3);
   label('SOFTDOWN / COSMETIC LAB',47,50,18,'#77e8dc');
   label('COLEÇÃO RGB — PROTÓTIPOS EM JOGO',47,94,30,'#eef6fc');
   ctx.textAlign='right';label('ANO 2015  ·  EFEITOS SEM VANTAGENS',1434,54,15,'#a7bdcf');
   label('SEM PAGAMENTO OU COOKIES CONSUMIDOS',1434,79,13,'#e4b5c5');
   ctx.textAlign='left';
   const panels=[
    {x:23,title:'01 / EQUIPAMENTO PADRÃO',accent:'#8899aa',premium:false,headset:false,price:'BASE GRATUITA'},
    {x:514,title:'02 / CADEIRA GAMER NEON',accent:'#73e8d8',premium:true,headset:false,price:'50 COOKIES · R$ 5,00 EQUIV.'},
    {x:1005,title:'03 / SETUP COM FONE RGB',accent:'#ef87dc',premium:true,headset:true,price:'FONE 40 COOKIES · R$ 4,00 EQUIV.'}
   ];
   for(const panel of panels){
    ctx.save();
    rect(panel.x,148,442,620,'#172737',16);
    rect(panel.x+1,149,440,618,'#1e3042',14);
    rect(panel.x+12,160,418,6,panel.accent,3);
    label(panel.title,panel.x+25,199,18,'#f2f7fb');
    label(panel.price,panel.x+25,226,13,panel.accent);
    // Estúdio isométrico sem trocar os desenhos reais do LHS.
    ctx.beginPath();ctx.roundRect(panel.x+13,244,416,418,12);ctx.clip();
    const bg=ctx.createLinearGradient(0,244,0,660);
    bg.addColorStop(0,'#29405a');bg.addColorStop(.62,'#1e303f');bg.addColorStop(1,'#162432');
    rect(panel.x+13,244,416,418,bg);
    for(let x=-200;x<=600;x+=36){
     ctx.beginPath();ctx.moveTo(panel.x+218,450);ctx.lineTo(panel.x+x,662);
     ctx.strokeStyle='rgba(114,180,180,.13)';ctx.lineWidth=1;ctx.stroke();
    }
    for(let y=0;y<7;y++){
     ctx.beginPath();ctx.moveTo(panel.x+13,460+y*y*6.2);ctx.lineTo(panel.x+429,460+y*y*6.2);
     ctx.strokeStyle='rgba(116,188,197,.12)';ctx.stroke();
    }
    rect(panel.x+13,640,416,25,'rgba(5,14,22,.45)');
    // Exatamente os renderizadores TS do jogo, sem sprites substitutos.
    setVerifiedCosmetics(panel.premium?['chair-gamer-neon','headset-rgb-neon']:[]);
    const zoom=2.70;
    const focus={x:p.x+.23,y:p.y+.49};
    const cam={zoom,originX:panel.x+223-(focus.x-focus.y)*64*zoom,
     originY:508-(focus.x+focus.y)*32*zoom};
    drawRetroComputer(ctx,cam,p,0,t,true,s,false);
    drawActor(ctx,cam,{x:seat.x,y:seat.y,kind:'regular',
     id:window.__demoCustomerId,time:t,pose:'sitting',direction:'north',
     premiumHeadset:panel.headset});
    const style=actorStyleFor('regular',window.__demoCustomerId);
    drawSeatedKeyboardOverlay(ctx,cam,p,t,style.skin,style.shirt,1);
    ctx.restore();
    rect(panel.x+15,669,412,75,'#1b2d3d',9);
    label(panel.premium?'ACABAMENTO PREMIUM':'MOBILIÁRIO INICIAL',panel.x+28,699,13,panel.accent);
    label(panel.headset?'48% DAS SESSÕES DE COMPUTADOR':panel.premium?
     'ESPUMA · COSTURA · REFLEXOS · RGB':'FUNCIONAMENTO IDENTICO',panel.x+28,721,13,'#c8d7e4','normal');
   }
   rect(25,793,1420,2,'#476175');
   label('NÃO ALTERA LUCRO, CONFORTO, TEMPO, HARDWARE OU PROGRESSÃO.',28,815,14,'#aec5d2');
   ctx.textAlign='right';label('CANVAS 2D · RENDER REAL · PRÉVIA TÉCNICA',1444,815,14,'#83e3d6');
   ctx.textAlign='left';
  }
  window.__drawCookiePreview=draw;
  window.__done=false;
  window.__runCookiePreview=()=>{
   const start=performance.now();
   function loop(now){const t=Math.min(6,(now-start)/1000);draw(t);
    if(t>=6){window.__done=true;return;}requestAnimationFrame(loop);}
   requestAnimationFrame(loop);
  };
  draw(.4);
 });
 await page.locator('canvas').screenshot({path:resolve(out,'cookies_cadeira_fone_preview.png')});
 // Detalhe de produto desenhado exclusivamente pelos MESMOS artistas de runtime.
 await page.evaluate(async()=>{
  const [{drawNeonChair},{drawActor}]=await Promise.all([
   import('./js/render/retroComputer.js'),import('./js/render/actorArt.js')
  ]);
  const product=document.createElement('canvas');
  product.id='cookies-product-details';product.width=1320;product.height=730;
  product.style.cssText='position:fixed;left:0;top:0;z-index:9999';
  document.body.append(product);
  const c=product.getContext('2d');
  const grad=c.createLinearGradient(0,0,1320,730);
  grad.addColorStop(0,'#0e1d2c');grad.addColorStop(1,'#0a1421');
  c.fillStyle=grad;c.fillRect(0,0,1320,730);
  function title(str,x,y,size,color='#e5f2fa'){
   c.fillStyle=color;c.font='bold '+size+'px Arial';c.fillText(str,x,y);}
  c.fillStyle='#68e9de';c.fillRect(40,38,7,60);
  title('COOKIES   /   DETALHE DO PRODUTO',64,60,18,'#75e9dc');
  title('ARTE PROCEDURAL — MESMO RENDERIZADOR DO JOGO',64,96,27);
  const cols=[{x:32,w:618,color:'#75ebdd'},{x:672,w:617,color:'#ee91dd'}];
  for(const item of cols){
   c.beginPath();c.roundRect(item.x,132,item.w,540,16);c.fillStyle='#1a2d3d';c.fill();
   c.fillStyle=item.color;c.fillRect(item.x+14,147,item.w-28,4);
  }
  title('CADEIRA GAMER NEON',64,193,24);
  title('50 COOKIES · DETALHES EM RGB',64,219,15,'#6aeadd');
  const cam={originX:513,originY:502,zoom:5.25};
  drawNeonChair(c,cam,{x:0,y:0},false,0);
  title('BASE 5 RODÍZIOS · CARBONO · ALMOFADAS',64,635,13,'#a9c7d4');
  title('HEADSET RGB + MICROFONE',705,193,24);
  title('40 COOKIES · CONTATO ANATÔMICO',705,219,15,'#ee91dd');
  c.save();c.beginPath();c.rect(685,245,590,370);c.clip();
  drawActor(c,{originX:981,originY:836,zoom:7.0},
   {x:0,y:0,kind:'regular',id:1,time:1.8,pose:'sitting',direction:'north',
    premiumHeadset:true});
  c.restore();
  title('ARCOS DUPLOS · CONCHAS · HASTE ARTICULADA',705,635,13,'#a9c7d4');
  c.fillStyle='#799eac';c.fillRect(35,703,1250,1);
  title('DESENHOS EXPERIMENTAIS: SEM SALDO, COBRANÇA OU ITENS CONCEDIDOS',45,722,12,'#b6cbd5');
 });
 await page.locator('#cookies-product-details').screenshot({
  path:resolve(out,'cookies_cadeira_fone_detalhes.png')});
 await page.locator('#cookies-product-details').evaluate(el=>el.remove());

 const sampleBefore=await page.evaluate(()=>{const c=document.querySelector('canvas').getContext('2d');return c.getImageData(24,250,425,408).data.reduce((a,v,i)=>a+(i%67===0?v:0),0)});
 const sampleAfter=await page.evaluate(()=>{window.__drawCookiePreview(2.7);const c=document.querySelector('canvas').getContext('2d');return c.getImageData(24,250,425,408).data.reduce((a,v,i)=>a+(i%67===0?v:0),0)});
 if(!Number.isFinite(sampleBefore)||!Number.isFinite(sampleAfter))throw Error('Canvas inválido');
 await page.evaluate(()=>window.__runCookiePreview());
 await page.waitForFunction(()=>window.__done===true,null,{timeout:22000});
 if(errors.length)throw Error(errors.join(' | '));
 const video=await page.video().path();
 await context.close();context=null;
 await rename(video,resolve(out,'cookies_cadeira_fone_preview.webm'));
 console.log('PREVIEW OK: arte original renderizada pelo jogo, sem cobrança e sem saldo fictício.');
}finally{
 await context?.close();await browser?.close();await new Promise(resolve=>server.close(resolve));
}
