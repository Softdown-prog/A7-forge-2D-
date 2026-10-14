// Refresh the website's lightweight still using the actual game renderer.
// Run after changing counter/actor/scenery art, before build:site.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);server.once('exit',code=>fail(Error('Server: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const data=await page.evaluate(async()=>{
  const [{SceneRenderer},{createGame,pcPosition},{computerSeat}]=await Promise.all([import('./js/render/scene.js'),import('./js/sim/engine.js'),import('./js/sim/route.js')]);
  const s=createGame(98);s.customers=[0,1].map(i=>{const p=computerSeat(pcPosition(i,s));return {id:i+1,x:p.x,y:p.y,target:p,route:[],stage:'using',costume:'regular',pcIndex:i,facing:'north',usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true};});
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=610;new SceneRenderer(canvas.getContext('2d')).draw(s,0);const image=document.createElement('canvas');image.width=1096;image.height=668;image.getContext('2d').drawImage(canvas,0,0,image.width,image.height);return image.toDataURL('image/webp',.86).split(',')[1];
 });
 const bytes=Buffer.from(data,'base64');if(bytes.length>=100000)throw Error('Preview exceeds size budget');
 await writeFile(resolve(import.meta.dirname,'../website/assets/sala.webp'),bytes);console.log('Current counter and owner preview: '+bytes.length+' bytes');
}finally{await browser?.close();server.kill();}
