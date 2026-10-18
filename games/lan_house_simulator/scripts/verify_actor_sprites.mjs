// Visual and animation regression checks against the original vector artist.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const output=resolve(process.argv[2]??'out/actor-sprites');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const {drawActor}=await import('./js/render/actorArt.js'),{drawActorSprite}=await import('./js/render/actorSprites.js');
  const surface=()=>{const c=document.createElement('canvas');c.width=160;c.height=160;return c.getContext('2d',{willReadFrequently:true});};
  const raw=surface(),cached=surface(),cases=[];
  const preview=document.createElement('canvas');preview.width=960;preview.height=640;const sheet=preview.getContext('2d');sheet.fillStyle='#222b37';sheet.fillRect(0,0,960,640);
  const kinds=['regular','rabbit','mouse-mascot','clown','vampire','stitched-monster'];
  for(let pass=0;pass<2;pass++){for(const kind of kinds)for(const direction of ['north','south','east','west'])for(const pose of ['idle','walking','sitting','console'])drawActorSprite(cached,{originX:80,originY:130,zoom:.86},{x:0,y:0,kind,id:37,time:2.1,pose:pose==='console'?'sitting':pose,gamepad:pose==='console',consoleSeat:pose==='console',direction});await new Promise(ok=>setTimeout(ok,1500));}
  let bitmapDraws=0;const blit=cached.drawImage;cached.drawImage=function(...args){bitmapDraws++;return blit.apply(this,args);};
  for(const kind of ['regular','rabbit','mouse-mascot','clown','vampire','stitched-monster'])for(const direction of ['north','south','east','west'])for(const pose of ['idle','walking','sitting','console'])for(const zoom of [.35,.86,1]){
   const actor={x:0,y:0,kind,id:37,time:2.1,pose:pose==='console'?'sitting':pose,gamepad:pose==='console',consoleSeat:pose==='console',direction},camera={originX:80.25,originY:130.5,zoom};
   raw.clearRect(0,0,160,160);cached.clearRect(0,0,160,160);drawActor(raw,camera,actor);drawActorSprite(cached,camera,actor);
   const maskA=raw.getImageData(0,0,160,160).data,maskB=cached.getImageData(0,0,160,160).data;
   let missing=0;for(let i=3;i<maskA.length;i+=4)if(maskA[i]>200&&maskB[i]===0)missing++;
   for(const ctx of [raw,cached]){ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#222b37';ctx.fillRect(0,0,160,160);ctx.globalCompositeOperation='source-over';}
   const a=raw.getImageData(0,0,160,160).data,b=cached.getImageData(0,0,160,160).data;
   let error=0,visible=0;
   for(let i=0;i<a.length;i+=4){if(a[i]!==34||a[i+1]!==43||a[i+2]!==55||b[i]!==34||b[i+1]!==43||b[i+2]!==55){visible++;for(let j=0;j<4;j++)error+=Math.abs(a[i+j]-b[i+j]);}}
   cases.push({kind,direction,pose,zoom,meanChannelError:error/(visible*4),missing});
   if(zoom===.86&&direction==='south'&&(pose==='walking'||pose==='sitting')){const x=kinds.indexOf(kind)*160,y=pose==='walking'?0:320;sheet.drawImage(raw.canvas,x,y);sheet.drawImage(cached.canvas,x,y+160);sheet.fillStyle='#eeeecc';sheet.font='11px sans-serif';sheet.fillText(kind+' / '+pose,x+5,y+15);sheet.fillText('sprite',x+5,y+175);}
  }
  // Complex/time-dependent poses must still match the vector artist exactly.
  for(const extra of [{kind:'owner',pose:'printing'},{kind:'cleaner',pose:'sweeping'},{kind:'technician',pose:'repairing'},{pose:'standing-up',transition:.5},{pose:'sitting',transition:.5},{pose:'sitting',premiumHeadset:true}]){
   const a={x:0,y:0,id:1,time:1.2,kind:'regular',...extra},camera={originX:80,originY:130,zoom:.86};
   raw.clearRect(0,0,160,160);cached.clearRect(0,0,160,160);drawActor(raw,camera,a);drawActorSprite(cached,camera,a);
   const one=raw.getImageData(0,0,160,160).data,two=cached.getImageData(0,0,160,160).data;
   if(!one.every((v,i)=>v===two[i]))throw Error('Changed continuous pose: '+JSON.stringify(extra));
  }
  const camera={originX:80,originY:130,zoom:.86},actor={x:0,y:0,id:1,kind:'regular',pose:'walking',time:1};
  drawActorSprite(cached,camera,actor);drawActorSprite(cached,camera,{...actor,time:1.2});await new Promise(ok=>setTimeout(ok,500));
  const calls=[],original=cached.drawImage;cached.drawImage=function(...args){calls.push(args);return original.apply(this,args);};
  drawActorSprite(cached,camera,actor);drawActorSprite(cached,camera,{...actor,x:.1});drawActorSprite(cached,camera,{...actor,time:1.2});
  if(calls[0][0]!==calls[1][0]||calls[0][1]===calls[1][1]||calls[0][0]===calls[2][0])throw Error('Animation or continuous movement frozen');
  // Shared palette at different IDs, after a full animation cycle, reuses art.
  drawActorSprite(cached,camera,{...actor,id:5,time:actor.time-4*.27/7.7+2*Math.PI/7.7});
  if(calls[0][0]!==calls[3][0])throw Error('Cache depends on full customer identity');
  if(bitmapDraws<288)throw Error('Sprite frames not ready: '+bitmapDraws);
  return {preview:preview.toDataURL('image/png'),cases:cases.length,bitmapDraws,maxMeanChannelError:Math.max(...cases.map(c=>c.meanChannelError)),maxMissingOpaquePixels:Math.max(...cases.map(c=>c.missing)),worst:cases.sort((a,b)=>b.meanChannelError-a.meanChannelError).slice(0,6)};
 });
 const png=result.preview;delete result.preview;await writeFile(resolve(output,'actor_comparison.png'),Buffer.from(png.split(',')[1],'base64'));
 assert.ok(result.maxMeanChannelError<14,JSON.stringify(result));assert.ok(result.maxMissingOpaquePixels<25,JSON.stringify(result));
 await writeFile(resolve(output,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 for(const mode of ['unsupported','blocked']){
  const fallback=await browser.newPage(),errors=[];fallback.on('pageerror',e=>errors.push(String(e)));
  if(mode==='unsupported')await fallback.addInitScript(()=>{window.OffscreenCanvas=undefined;});
  else await fallback.route('**/actorSpriteWorker.js',route=>route.abort());
  await fallback.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  const equal=await fallback.evaluate(async()=>{
   const {drawActor}=await import('./js/render/actorArt.js'),{drawActorSprite}=await import('./js/render/actorSprites.js');
   const canvas=()=>{const c=document.createElement('canvas');c.width=160;c.height=160;return c.getContext('2d');},one=canvas(),two=canvas();
   const cam={originX:80,originY:130,zoom:.86},actor={x:0,y:0,kind:'regular',id:1,time:1.23,pose:'walking'};
   drawActorSprite(two,cam,actor);await new Promise(ok=>setTimeout(ok,300));two.clearRect(0,0,160,160);
   drawActor(one,cam,actor);drawActorSprite(two,cam,actor);
   const a=one.getImageData(0,0,160,160).data,b=two.getImageData(0,0,160,160).data;return a.every((v,i)=>v===b[i]);
  });
  assert.equal(equal,true,mode+' fallback changed art');assert.deepEqual(errors,[]);await fallback.close();
 }
 console.log('Worker unsupported/blocked: original art and animation retained.');
}finally{await browser?.close();server.kill();}
