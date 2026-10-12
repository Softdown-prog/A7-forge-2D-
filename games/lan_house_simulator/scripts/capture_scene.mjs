// Captura genuína do Canvas em Chromium para revisão visual, sem aprovar arte.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { createGame, pcPosition } from "../dist/js/sim/engine.js";
import { computerSeat } from "../dist/js/sim/route.js";
import { GAME_SAVE_KEY } from "../dist/js/sim/types.js";

const root=resolve(import.meta.dirname,"../dist");
const output=resolve(process.argv[2]??"out/validation");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".wav":"audio/wav"};
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url??"/","http://localhost").pathname);
    const file=resolve(root,"."+ (pathname==="/"?"/index.html":pathname));
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    const content=await readFile(file);
    res.writeHead(200,{"content-type":mime[extname(file)]??"application/octet-stream"});
    res.end(content);
  }catch{res.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const url="http://127.0.0.1:"+server.address().port+"/";
const state=createGame(1998);
state.totalMinutes=31;
state.served=2;state.revenue=18;state.cash=868;state.purchases=0;
state.eventLog=[
 "D1 10:31 · Cliente usando um dos computadores",
 "D1 10:28 · Cliente pagou R$ 9 por 45 minutos",
 "D1 10:00 · A pequena lan house abriu as portas!"
];
function customer(id,stage,pcIndex,x,y,costume){
  return {id,stage,pcIndex,x,y,costume,usedMinutes:9,
    waitingMinutes:0,offlineWait:0,happy:true,target:{x,y},route:[],poseMinutes:0};
}
const seat=computerSeat(pcPosition(0));
state.customers=[
 customer(1,"using",0,seat.x,seat.y,"regular"),
 customer(2,"to_pc",1,4.1,4.48,"clown"),
 customer(3,"arriving",null,5.55,4.48,"vampire")
];
// A simulação continua determinística no navegador, mas a captura representa
// exatamente o Canvas do jogo, não uma composição de imagem externa.
let browser;
try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const errors=[];
  for(const config of [
    {name:"desktop",width:1440,height:950},
    {name:"mobile",width:414,height:920}
  ]){
    const page=await browser.newPage({viewport:{width:config.width,height:config.height},deviceScaleFactor:1});
    page.on("pageerror",e=>errors.push(config.name+": "+String(e)));
    await page.addInitScript(({key,payload})=>localStorage.setItem(key,JSON.stringify(payload)),
      {key:GAME_SAVE_KEY,payload:state});
    await page.goto(url,{waitUntil:"networkidle"});
    await page.waitForFunction(()=>{
      const canvas=document.querySelector("#game");
      if(!(canvas instanceof HTMLCanvasElement))return false;
      return canvas.getContext("2d")?.getImageData(500,300,1,1).data[3]===255;
    },null,{timeout:10000});
    const bounds=await page.evaluate(()=>({
      viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
      canvasWidth:document.querySelector("#game").width,
      canvasHeight:document.querySelector("#game").height
    }));
    if(bounds.scrollWidth>bounds.viewport+3)throw Error("Horizontal overflow on "+config.name+": "+JSON.stringify(bounds));
    const shot=await page.locator("#game").screenshot({type:"png"});
    if(shot.length<10000)throw Error("Canvas screenshot suspiciously small on "+config.name);
    await writeFile(resolve(output,"lhs_canvas_"+config.name+".png"),shot);
    // Ampliação do próprio framebuffer renderizado, não uma arte recriada.
    if(config.name==="desktop"){
      const encoded=await page.evaluate(()=>{
        const source=document.querySelector("#game");
        if(!(source instanceof HTMLCanvasElement))throw Error("Canvas ausente");
        const crop=document.createElement("canvas");crop.width=900;crop.height=560;
        const context=crop.getContext("2d");
        if(!context)throw Error("Canvas de detalhe ausente");
        context.imageSmoothingEnabled=true;
        context.drawImage(source,315,155,550,345,0,0,900,560);
        return crop.toDataURL("image/png").split(",")[1];
      });
      await writeFile(resolve(output,"lhs_characters_closeup_desktop.png"),
        Buffer.from(encoded,"base64"));
      // Segunda inspeção, focada nos três monitores e nas vitrines das máquinas.
      const equipment=await page.evaluate(()=>{
        const source=document.querySelector("#game");
        if(!(source instanceof HTMLCanvasElement))throw Error("Canvas ausente");
        const crop=document.createElement("canvas");crop.width=1000;crop.height=570;
        const context=crop.getContext("2d");
        if(!context)throw Error("Canvas de detalhe indisponível");
        context.drawImage(source,345,175,530,302,0,0,1000,570);
        return crop.toDataURL("image/png").split(",")[1];
      });
      await writeFile(resolve(output,"lhs_equipment_closeup_desktop.png"),
        Buffer.from(equipment,"base64"));
      // Matriz de pose gerada pelas MESMAS funções do runtime, sem mock visual.
      const poses=await page.evaluate(async()=>{
        const [{drawActor,actorStyleFor},{drawRetroComputer,drawSeatedKeyboardOverlay},{createGame}]=await Promise.all([
          import("./js/render/actorArt.js"),
          import("./js/render/retroComputer.js"),
          import("./js/sim/engine.js")
        ]);
        const directions=["south","north","east","west"];
        const names=["FRENTE","COSTAS","DIREITA","ESQUERDA"];
        const canvas=document.createElement("canvas");
        canvas.width=1080;canvas.height=760;
        const ctx=canvas.getContext("2d");
        if(!ctx)throw Error("Canvas de prancha indisponível");
        ctx.fillStyle="#17243A";ctx.fillRect(0,0,canvas.width,canvas.height);
        const state=createGame(1998);
        for(let col=0;col<4;col++){
          const x0=20+col*264;
          ctx.fillStyle="#EAD6B9";ctx.font="bold 18px system-ui";
          ctx.fillText(names[col],x0+45,36);
          for(let row=0;row<3;row++){
            const y0=54+row*229;
            ctx.fillStyle="#2C3C51";ctx.fillRect(x0,y0,248,215);
            ctx.strokeStyle="#80929D";ctx.strokeRect(x0+.5,y0+.5,247,214);
            const camera={originX:x0+124,originY:y0+188,zoom:1.7};
            ctx.fillStyle="#A7B6C8";ctx.font="bold 12px system-ui";
            ctx.fillText(["PASSO A","PASSO B","PC: COSTAS + MÃOS"][row],x0+12,y0+19);
            if(row===2){
              // CRT do jogo em tamanho real aumentado, com assento ao fundo.
              const at={x:0.2,y:-0.35};
              const poseCamera={originX:x0+90,originY:y0+157,zoom:1.5};
              drawRetroComputer(ctx,poseCamera,at,0,1,true,state);
              drawActor(ctx,poseCamera,{
                x:at.x+0.35,y:at.y+0.82,kind:"regular",id:1,time:1.2,
                pose:"sitting",direction:"north",transition:1
              });
              // O mesmo overlay usado pelo SceneRenderer, depois do ator e da mesa.
              const style=actorStyleFor("regular",1);
              drawSeatedKeyboardOverlay(ctx,poseCamera,at,1.2,style.skin,style.shirt,1);
            }else{
              drawActor(ctx,camera,{
                x:0,y:0,kind:"regular",id:1,time:row===0?0.20:0.60,
                pose:"walking",direction:directions[col]
              });
            }
          }
        }
        return canvas.toDataURL("image/png").split(",")[1];
      });
      await writeFile(resolve(output,"lhs_four_directions_and_pc_pose.png"),
        Buffer.from(poses,"base64"));
    }
    await page.screenshot({path:resolve(output,"lhs_page_"+config.name+".png"),fullPage:true});
    await page.close();
  }
  if(errors.length)throw Error("Browser page errors: "+errors.join("; "));
  await writeFile(resolve(output,"README.txt"),
    "Capturas diretas do Chromium: Canvas e pagina completa em desktop/mobile. "+ 
    "Seed 1998, estado de clientes fixado para revisao. Arte procedural placeholder. Sem aprovacao artistica.\n");
  console.log("LHS: capturas reais desktop/mobile geradas sem erros no navegador.");
}finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
}
