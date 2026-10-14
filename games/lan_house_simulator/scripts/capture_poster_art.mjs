// Production Canvas artwork, flat gallery and genuine scene comparison.
// Optional third argument: an earlier compiled scene.js for the same-camera before.
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const output=resolve(process.argv[2]??"out/posters");await mkdir(output,{recursive:true});
const before=process.argv[3]?await readFile(resolve(process.argv[3]),"utf8"):null;
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,reject)=>{server.stdout.once("data",ok);server.once("error",reject);server.once("exit",c=>reject(Error("Servidor: "+c)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
 const result=await page.evaluate(async before=>{
  const [{drawPosterPlate,POSTER_KINDS},{SceneRenderer},{createGame},{placeFurniture,relocateFurniture,availablePlacementSlots},{expandDirection}]=await Promise.all([
   import("./js/render/posterArt.js"),import("./js/render/scene.js"),import("./js/sim/engine.js"),
   import("./js/sim/shop.js"),import("./js/sim/room.js")]);
  let OldRenderer;
  if(before){
   const code=before.replace(/from\s+["'](\.[^"']+)["']/g,(_,path)=>"from "+JSON.stringify(new URL(path,location.origin+"/js/render/scene.js").href));
   const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));OldRenderer=(await import(url)).SceneRenderer;URL.revokeObjectURL(url);
  }
  const surface=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
  const gallery=surface(1020,775),g=gallery.getContext("2d");g.fillStyle="#192f2a";g.fillRect(0,0,1020,775);
  const label=(ctx,text,x,y,size=18)=>{ctx.fillStyle="#e7e6c8";ctx.font=`600 ${size}px system-ui`;ctx.fillText(text,x,y);};
  label(g,"Pôsteres do salão · ilustrações originais",26,36,24);
  const galleryKinds=[...POSTER_KINDS.slice(0,5),"arcade"];
  for(let i=0;i<galleryKinds.length;i++){
   const x=35+(i%3)*330,y=68+Math.floor(i/3)*340;
   g.save();g.translate(x,y);g.scale(2.7,2.7);drawPosterPlate(g,galleryKinds[i]);g.restore();
  }
  const s=createGame();s.cash=10000;
  if(!placeFurniture(s,"poster","wall-1").ok||!placeFurniture(s,"poster","wall-2").ok)throw Error("Compra não concluída");
  const stateBefore=JSON.stringify(s);
  const now=surface(1000,610),old=surface(1000,610);
  new SceneRenderer(now.getContext("2d")).draw(s,2);
  if(OldRenderer)new OldRenderer(old.getContext("2d")).draw(s,2);
  const comparison=surface(1280,900),c=comparison.getContext("2d");c.fillStyle="#192f2a";c.fillRect(0,0,1280,900);
  label(c,OldRenderer?"Antes":"Salão integrado",22,32,22);label(c,"Agora",660,32,22);
  // Same real scene pixels, enlarged for wall details; the simulation is frozen.
  c.drawImage(OldRenderer?old:now,140,15,400,255,10,50,620,395);
  c.drawImage(now,140,15,400,255,650,50,620,395);
  label(c,"Pôsteres comprados também recebem arte",24,485,20);
  c.drawImage(OldRenderer?old:now,530,30,300,180,20,510,600,360);
  c.drawImage(now,530,30,300,180,660,510,600,360);
  if(JSON.stringify(s)!==stateBefore)throw Error("Desenho alterou o save");
  // Preserve paid placements through expansion/relocation and save-compatible data.
  const expansion=expandDirection(s,"north");
  if(!expansion.ok)throw Error("Expansão norte falhou: "+expansion.message);
  const destinations=availablePlacementSlots(s,"poster");
  const destination=destinations.find(p=>p.id.startsWith("wall-north"))
    ??destinations.find(p=>p.id.startsWith("wall-side-"))
    ??destinations.find(p=>p.id!=="wall-1");
  if(!destination)throw Error("Nenhum encaixe de pôster ficou disponível após expansão");
  const moved=relocateFurniture(s,"wall-1",destination.id);
  if(!moved.ok)throw Error("Realocação de pôster: "+moved.message);
  const expanded=surface(1000,610);new SceneRenderer(expanded.getContext("2d")).draw(s,2);
  return {gallery:gallery.toDataURL(),comparison:comparison.toDataURL(),scene:now.toDataURL(),expanded:expanded.toDataURL(),
   checks:{designs:POSTER_KINDS.length,paidPosters:s.furniture.poster,placement:s.furniturePlacements[0].slotId,unchangedState:true}};
 },before);
 assert.equal(errors.length,0,errors.join("; "));
 for(const [key,file] of [["gallery","lhs_poster_collection.png"],["comparison","lhs_posters_before_after.png"],["scene","lhs_posters_in_game.png"],["expanded","lhs_posters_expanded_room.png"]])
  await writeFile(resolve(output,file),Buffer.from(result[key].split(",")[1],"base64"));
 await writeFile(resolve(output,"poster_validation.json"),JSON.stringify(result.checks,null,2)+"\n");console.log(JSON.stringify(result.checks));
}finally{await browser?.close();server.kill();}
