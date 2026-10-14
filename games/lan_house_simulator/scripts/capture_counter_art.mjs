// Production Canvas artwork and regression checks; no changes to simulation state.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const output=resolve(process.argv[2]??'out/counter-art');await mkdir(output,{recursive:true});
const before=process.argv[3]?await readFile(resolve(process.argv[3]),'utf8'):null;
const beforeActor=process.argv[4]?await readFile(resolve(process.argv[4]),'utf8'):null;
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);server.once('exit',code=>fail(Error('Server stopped: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const result=await page.evaluate(async({before,beforeActor})=>{
  const [{SceneRenderer},{drawCounter},{createGame},{objectCamera,iso},{counterPoint},{drawActor}]=await Promise.all([import('./js/render/scene.js'),import('./js/render/counterArt.js'),import('./js/sim/engine.js'),import('./js/render/isometric.js'),import('./js/sim/layout.js'),import('./js/render/actorArt.js')]);
  const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const title=(c,text,x,y,size=20)=>{c.fillStyle='#e8e2c6';c.font=`600 ${size}px system-ui`;c.fillText(text,x,y);};
  let old=SceneRenderer,oldActor=drawActor;const urls=[];
  const load=async(code,actorUrl)=>{code=code.replace(/from\s+"([^"]+)"/g,(_,path)=>'from '+JSON.stringify(path==='./actorArt.js'&&actorUrl?actorUrl:new URL(path,location.origin+'/js/render/').href));const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));urls.push(url);return {module:await import(url),url};};
  if(beforeActor){const actor=await load(beforeActor);oldActor=actor.module.drawActor;if(before)old=(await load(before,actor.url)).module.SceneRenderer;}else if(before)old=(await load(before)).module.SceneRenderer;
  const state=createGame(),p={x:.9,y:1.42},snapshot=JSON.stringify(state);
  const isolated=(ctx,Renderer,cam,s)=>{const r=new Renderer(ctx),owner=counterPoint(s,{x:1.45,y:1.05}),counter=s.objectPlacements?.find(p=>p.id==='counter')??p;if(owner.x+owner.y-.5<counter.x+counter.y+.8){r.owner(cam,0,s);r.counter(cam,counter);}else{r.counter(cam,counter);r.owner(cam,0,s);}};
  const comparison=surface(1200,500),cc=comparison.getContext('2d');cc.fillStyle='#213b35';cc.fillRect(0,0,1200,500);title(cc,'Balcão e administrador · Lan House Simulator',30,34,22);
  for(let col=0;col<2;col++){title(cc,col===0&&before?'Antes':'Agora',35+col*600,70,18);isolated(cc,col===0&&before?old:SceneRenderer,{originX:300+col*600,originY:96,zoom:2.4},state);}
  const directions=surface(1200,990),dc=directions.getContext('2d');dc.fillStyle='#213b35';dc.fillRect(0,0,1200,990);title(dc,'Integrado nas quatro orientações',30,36,22);
  for(let r=0;r<4;r++){const col=r%2,row=Math.floor(r/2),s=createGame();s.objectPlacements=[{id:'counter',...p,rotation:r}];title(dc,['Frente','Lateral','Trás','Lateral oposta'][r],30+col*600,90+row*450);isolated(dc,SceneRenderer,{originX:300+col*600,originY:130+row*450,zoom:2.2},s);}
  const scene=surface(1000,610);new SceneRenderer(scene.getContext('2d')).draw(state,0);
  const actors=surface(1000,270),actorCtx=actors.getContext('2d');actorCtx.fillStyle='#213b35';actorCtx.fillRect(0,0,1000,270);title(actorCtx,'Administrador · detalhes do uniforme e postura',26,32,20);
  for(let i=0;i<4;i++)drawActor(actorCtx,{originX:130+i*245,originY:240,zoom:2.05},{x:0,y:0,kind:'owner',id:0,time:0,pose:'idle',direction:['south','east','north','west'][i]});
  // Customers must remain pixel-identical to their previous designs.
  const customerChecks=[];if(beforeActor)for(const kind of ['regular','clown','vampire','stitched-monster','rabbit','mouse-mascot'])for(const direction of ['south','east','north','west'])for(const pose of ['idle','walking','sitting']){
   const a=surface(180,200),b=surface(180,200),cam={originX:90,originY:175,zoom:1.5},actor={x:0,y:0,kind,id:3,time:.45,pose,direction};oldActor(a.getContext('2d'),cam,actor);drawActor(b.getContext('2d'),cam,actor);const aa=a.getContext('2d').getImageData(0,0,180,200).data,bb=b.getContext('2d').getImageData(0,0,180,200).data;customerChecks.push({kind,direction,pose,same:aa.every((v,i)=>v===bb[i])});
  }
  const pixelCases=[];for(const zoom of [.45,.86,1.75,2.4])for(let r=0;r<4;r++)for(const position of [p,{x:2.25,y:3.5}]){
   const a=surface(900,750),b=surface(900,750),ac=a.getContext('2d'),bc=b.getContext('2d'),cam=objectCamera({originX:450.37,originY:350.63,zoom},position,1.75,.72,r);for(const ctx of [ac,bc]){ctx.fillStyle="#213b35";ctx.fillRect(0,0,900,750);}drawCounter(ac,cam,position,true);drawCounter(bc,cam,position,false);
   const aa=ac.getImageData(0,0,900,750).data,bb=bc.getImageData(0,0,900,750).data;let max=0,changed=0,sum=0;for(let i=0;i<aa.length;i++){const d=Math.abs(aa[i]-bb[i]);max=Math.max(max,d);if(d>1)changed++;sum+=Math.max(0,d-1);}pixelCases.push({zoom,rotation:r,position,max,changed,residual:sum/aa.length});
  }
  const hitChecks=[];for(let rotation=0;rotation<4;rotation++){const s=createGame();s.objectPlacements=[{id:'counter',x:2.5,y:3,rotation}];const c=surface(1000,610),renderer=new SceneRenderer(c.getContext('2d')),cam={originX:500,originY:100,zoom:.7};renderer.owner(cam,0,s);const center=iso(counterPoint(s,{x:1.45,y:1.05}),cam,65);hitChecks.push({rotation,hit:renderer.hitOwner(center.x,center.y),miss:renderer.hitOwner(-999,-999)});}
  if(JSON.stringify(state)!==snapshot)throw Error('Drawing mutated save');urls.forEach(URL.revokeObjectURL);
  return {comparison:comparison.toDataURL(),directions:directions.toDataURL(),scene:scene.toDataURL(),actors:actors.toDataURL(),pixelCases,customerChecks,hitChecks};
 },{before,beforeActor});
 for(const [key,file]of [['comparison','counter_before_after.png'],['directions','counter_four_directions.png'],['scene','counter_game_scene.png'],['actors','administrator_details.png']])await writeFile(resolve(output,file),Buffer.from(result[key].split(',')[1],'base64'));
 await writeFile(resolve(output,'counter_validation.json'),JSON.stringify({pixelCases:result.pixelCases,customerChecks:result.customerChecks,hitChecks:result.hitChecks,errors},null,2));
 for(const c of result.pixelCases)assert.ok(c.max<=32&&c.changed<1000&&c.residual<.001,JSON.stringify(c));for(const c of result.customerChecks)assert.equal(c.same,true,JSON.stringify(c));for(const c of result.hitChecks){assert.equal(c.hit,true);assert.equal(c.miss,false);}assert.deepEqual(errors,[]);console.log(JSON.stringify({pixelCases:result.pixelCases.length,customersUnchanged:result.customerChecks.length,hitChecks:result.hitChecks.length,errors}));
}finally{await browser?.close();server.kill();}
