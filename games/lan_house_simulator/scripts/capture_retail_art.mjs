// Production illustrations, native sprite equivalence and live inventory changes.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const output=resolve(process.argv[2]??"out/retail");await mkdir(output,{recursive:true});
const before=process.argv[3]?await readFile(resolve(process.argv[3]),"utf8"):null;
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",n=>reject(Error("Servidor: "+n)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});const page=await browser.newPage(),errors=[];page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const result=await page.evaluate(async before=>{
  const [{drawVendingMachine,drawSnackShelf,RETAIL_DISPLAY_CAPACITY},{SceneRenderer},{createGame,stepGame},{stockItem},{VENDING_MACHINES}]=await Promise.all([
   import("./js/render/retailArt.js"),import("./js/render/scene.js"),import("./js/sim/engine.js"),import("./js/sim/economy.js"),import("./js/sim/layout.js")]);
  let Old;if(before){const code=before.replace(/from\s+["'](\.[^"']+)["']/g,(_,p)=>"from "+JSON.stringify(new URL(p,location.origin+"/js/render/scene.js").href));
   const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));Old=(await import(url)).SceneRenderer;URL.revokeObjectURL(url);}
  const surface=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
  const label=(c,text,x,y,size=20)=>{c.fillStyle="#eae3c4";c.font=`600 ${size}px system-ui`;c.fillText(text,x,y);};
  const draw=(c,cam,kind,time,stock,cache=true)=>kind==="snacks"?drawSnackShelf(c,cam,-.23,stock,cache):drawVendingMachine(c,cam,{x:0,y:0},kind,time,stock,cache);
  const camera=(x,y,z,kind)=>({originX:x+(kind==="snacks"?2.92*64*z:0),originY:y-(kind==="snacks"?2.92*32*z:0),zoom:z});
  const gallery=surface(1260,930),g=gallery.getContext("2d");g.fillStyle="#192f2a";g.fillRect(0,0,1260,930);
  label(g,"Terminal de Bairro · máquinas e expositor",25,36,26);
  const kinds=["soda","candy","snacks"],names={soda:"Refrigerantes",candy:"Doces",snacks:"Salgadinhos"};
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
   const kind=kinds[col],cam=camera(155+col*420,345+row*410,2.3,kind);
   label(g,(row===0&&Old?"Antes":"Agora")+" · "+names[kind],25+col*420,86+row*410);
   if(row===0&&Old){const old=new Old(g);if(kind==="snacks")old.shelf(cam,-.23);else old.machine(cam,0,0,kind,.2);}
   else draw(g,cam,kind,.2,RETAIL_DISPLAY_CAPACITY[kind]);
  }
  label(g,"Vidros, controles, bandejas de retirada e embalagens com volume",25,898,18);
  const stockSheet=surface(1260,480),sc=stockSheet.getContext("2d");sc.fillStyle="#192f2a";sc.fillRect(0,0,1260,480);
  label(sc,"O desenho acompanha o estoque da partida",25,34,25);
  for(let i=0;i<3;i++)for(let col=0;col<3;col++){
   const kind=kinds[col],quantity=[0,2,RETAIL_DISPLAY_CAPACITY[kind]][i],cam=camera(95+col*420+i*110,290,1.15,kind);
   draw(sc,cam,kind,.4,quantity);label(sc,quantity?quantity+" unidades":"Vazio",40+col*420+i*110,350,15);
  }
  for(let col=0;col<3;col++)label(sc,names[kinds[col]],25+col*420,415,20);
  const a=surface(600,440),b=surface(600,440),ac=a.getContext("2d"),bc=b.getContext("2d"),cases=[];
  for(const zoom of [.42,.86,1.8])for(const kind of kinds)for(const stock of [0,2,RETAIL_DISPLAY_CAPACITY[kind],99])for(const time of [.1,1.1])for(const alpha of [1,.4]){
   const cam=camera(255.37,265.63,zoom,kind);ac.globalAlpha=bc.globalAlpha=1;ac.fillStyle=bc.fillStyle="#213c33";ac.fillRect(0,0,600,440);bc.fillRect(0,0,600,440);
   ac.globalAlpha=bc.globalAlpha=alpha;draw(ac,cam,kind,time,stock);draw(bc,cam,kind,time,stock,false);
   const aa=ac.getImageData(0,0,600,440).data,bb=bc.getImageData(0,0,600,440).data;let max=0,sum=0,beyondRounding=0,changed=0;
   for(let i=0;i<aa.length;i++){const d=Math.abs(aa[i]-bb[i]);max=Math.max(max,d);sum+=d;beyondRounding+=Math.max(0,d-1);if(d>1)changed++;}
   cases.push({zoom,kind,stock,time,alpha,maxChannelDelta:max,changedChannels:changed,meanChannelDelta:sum/aa.length,meanBeyondRounding:beyondRounding/aa.length});
  }
  // Translation with negative room bounds must not reuse clipped/stale rack sprites.
  for(const minX of [-10,-4,0]){const cam={originX:260-minX*64*.86+2.92*64*.86,originY:260-2.92*32*.86,zoom:.86};
   ac.globalAlpha=bc.globalAlpha=1;ac.fillStyle=bc.fillStyle="#213c33";ac.fillRect(0,0,600,440);bc.fillRect(0,0,600,440);
   drawSnackShelf(ac,cam,minX,10);drawSnackShelf(bc,cam,minX,10,false);
   const aa=ac.getImageData(0,0,600,440).data,bb=bc.getImageData(0,0,600,440).data;let max=0,sum=0,beyondRounding=0,changed=0;
   for(let i=0;i<aa.length;i++){const d=Math.abs(aa[i]-bb[i]);max=Math.max(max,d);sum+=d;beyondRounding+=Math.max(0,d-1);if(d>1)changed++;}
   cases.push({minX,alpha:1,maxChannelDelta:max,changedChannels:changed,meanChannelDelta:sum/aa.length,meanBeyondRounding:beyondRounding/aa.length});
  }
  const state=createGame(1998),canvas=surface(1000,610),renderer=new SceneRenderer(canvas.getContext("2d"));
  const snapshot=JSON.stringify(state);renderer.draw(state,.2);if(JSON.stringify(state)!==snapshot)throw Error("Arte altera estado/RNG");
  const stocked=canvas.toDataURL();state.inventory={soda:0,candy:0,snacks:0};renderer.draw(state,.2);const empty=canvas.toDataURL();
  state.cash=10000;for(const kind of kinds){if(!stockItem(state,kind).ok)throw Error("Reposição recusada");}
  renderer.draw(state,.2);const restocked=canvas.toDataURL();if(stocked===empty||restocked===empty)throw Error("Vitrine não acompanha estoque");
  // Engine-produced purchases should reach both machines and the snack shelf.
  const live=createGame(72421);live.cash=10000;live.licensedGames=true;live.pcWindowsLicenses=[true,true,true];const sold=new Set();
  for(let minute=0;minute<720*2;minute++){
   for(const kind of kinds)if(live.inventory[kind]<3)stockItem(live,kind);
   stepGame(live,1);for(const effect of live.saleEffects??[])sold.add(effect.item);
   live.saleEffects=[];const beforeDraw=JSON.stringify(live);renderer.draw(live,minute*.01);
   if(JSON.stringify(live)!==beforeDraw)throw Error("Render de compra altera simulação");
  }
  return {gallery:gallery.toDataURL(),stockSheet:stockSheet.toDataURL(),cases,sold:[...sold],stockChanges:true,positions:VENDING_MACHINES};
 },before);
 for(const [key,name] of [["gallery","lhs_retail_before_after.png"],["stockSheet","lhs_retail_stock_states.png"]])await writeFile(resolve(output,name),Buffer.from(result[key].split(",")[1],"base64"));
 await writeFile(resolve(output,"retail_render_validation.json"),JSON.stringify({cases:result.cases,sold:result.sold,stockChanges:result.stockChanges,positions:result.positions},null,2)+"\n");
 assert.deepEqual(errors,[]);assert.deepEqual([...result.sold].sort(),["candy","snacks","soda"]);
 // Ignore one-level Canvas gradient rounding; bound larger differences independently.
 for(const c of result.cases){assert.ok(c.maxChannelDelta<=24&&c.changedChannels<=200&&c.meanBeyondRounding<.001,JSON.stringify(c));if(c.alpha!==1)assert.equal(c.maxChannelDelta,0);}
 console.log(JSON.stringify({cases:result.cases.length,maxDelta:Math.max(...result.cases.map(c=>c.maxChannelDelta)),changedChannels:Math.max(...result.cases.map(c=>c.changedChannels)),meanDelta:Math.max(...result.cases.map(c=>c.meanChannelDelta)),sold:result.sold,stockChanges:true}));
}finally{await browser?.close();server.kill();}
