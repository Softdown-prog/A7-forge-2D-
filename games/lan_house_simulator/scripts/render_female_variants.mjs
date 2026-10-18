/** Art QA: real LHS actor renderer, three discrete female character costumes. */
import {chromium} from "playwright";
import {createServer} from "node:http";
import {mkdir,readFile,rename} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";

const root=resolve(import.meta.dirname,"../dist");
const out=resolve(process.argv[2]??"out/female-variants");
await mkdir(out,{recursive:true});
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css"};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url??"/","http://localhost");
  const file=resolve(root,"."+(u.pathname==="/"?"/index.html":decodeURIComponent(u.pathname)));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"}).end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser,context;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 context=await browser.newContext({viewport:{width:1200,height:840},
  recordVideo:{dir:out,size:{width:1200,height:840}}});
 const page=await context.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto("http://127.0.0.1:"+server.address().port+"/",{waitUntil:"domcontentloaded"});
 await page.evaluate(async()=>{
  const {drawActor,FEMALE_COSTUMES,actorStyleFor}=await import("./js/render/actorArt.js");
  document.body.replaceChildren();
  document.body.style.cssText="margin:0;overflow:hidden;background:#0b1524";
  const canvas=document.createElement("canvas");
  canvas.width=1200;canvas.height=840;document.body.append(canvas);
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas unavailable");
  const names=["01 / LONGO + CARDIGAN","02 / CHANEL + JAQUETA","03 / RABO + MOLETOM"];
  const directions=["south","east","north","west"];
  const poses=["walking","walking","sitting","standing-up"];
  function label(str,x,y,size,color="#ddeefa"){
   ctx.fillStyle=color;ctx.font="bold "+size+"px Arial,sans-serif";
   ctx.fillText(str,x,y);
  }
  window.__drawFemaleVariantSheet=(time)=>{
   const bg=ctx.createLinearGradient(0,0,1200,840);bg.addColorStop(0,"#18293e");bg.addColorStop(1,"#0a1323");
   ctx.fillStyle=bg;ctx.fillRect(0,0,1200,840);
   ctx.fillStyle="#67d8c5";ctx.fillRect(23,19,7,61);
   label("LAN HOUSE SIMULATOR / CHARACTER ART",47,43,17,"#6fe3d9");
   label("3 MODELOS FEMININOS  ·  4 DIREÇÕES  ·  ANIMAÇÕES REAIS",47,76,21);
   for(let r=0;r<3;r++){
    const kind=FEMALE_COSTUMES[r],style=actorStyleFor(kind,2),row=110+r*240;
    label(names[r],34,row+22,17,style.highlight);
    for(let col=0;col<4;col++){
     const left=22+col*297,top=row+32;
     ctx.fillStyle="#233649";ctx.beginPath();ctx.roundRect(left,top,284,190,10);ctx.fill();
     ctx.strokeStyle="#48627a";ctx.lineWidth=1;ctx.stroke();
     ctx.strokeStyle="rgba(140,206,220,.12)";
     for(let line=0;line<5;line++){ctx.beginPath();ctx.moveTo(left+24,top+35+line*32);ctx.lineTo(left+260,top+35+line*32);ctx.stroke();}
     label(["FRENTE / ANDANDO","PERFIL / ANDANDO","COSTAS / SENTADA","PERFIL / LEVANTANDO"][col],
       left+11,top+19,11,"#c4d5e7");
     drawActor(ctx,{originX:left+143,originY:top+177,zoom:1.65},
      {x:0,y:0,kind,id:2,time:time+r*.4,pose:poses[col],
       direction:directions[col],transition:col===3?.5:1});
    }
   }
   label("ROPA E CABELO DESENHADOS POR MODELO · SEM MÁSCARAS OU ROTAÇÃO DE PALETA",
    26,832,13,"#a9c9d6");
  };
  window.__drawFemaleVariantSheet(1.15);
 });
 await page.locator("canvas").screenshot({path:resolve(out,"lhs_tres_clientes_femininas.png")});
 await page.evaluate(()=>{
  window.__done=false;
  const start=performance.now();
  const draw=now=>{
   const t=(now-start)/1000;
   window.__drawFemaleVariantSheet(1.15+t);
   if(t>=3.8){window.__done=true;return;}
   requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
 });
 await page.waitForFunction(()=>window.__done===true,null,{timeout:15000});
 if(errors.length)throw Error(errors.join(" | "));
 const video=await page.video().path();
 await context.close();context=null;
 await rename(video,resolve(out,"lhs_tres_clientes_femininas.webm"));
 console.log("QA OK: three female actor costumes, four facing directions, real poses.");
}finally{
 await context?.close();await browser?.close();
 await new Promise(resolve=>server.close(resolve));
}
