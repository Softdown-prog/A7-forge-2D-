// Counter equipment (counter, printer, disc copier): the cached raster must reproduce the live drawing.
// Usage: node scripts/verify_counter_equipment.mjs [out/counter-equipment]
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const output=resolve(process.argv[2]??'out/counter-equipment');await mkdir(output,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,'serve.mjs')],{stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once('data',ok);server.once('error',fail);server.once('exit',code=>fail(Error('Server stopped: '+code)));});
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const result=await page.evaluate(async()=>{
  const [{drawCounter},{drawCounterPrinter},{drawCounterDiscCopier},{objectCamera}]=await Promise.all([
   import('./js/render/counterArt.js'),import('./js/render/printerArt.js'),import('./js/render/discCopierArt.js'),import('./js/render/isometric.js')]);
  const surface=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const cases=[];
  for(const scale of [1,2])for(const zoom of [.45,.86,1.75,2.4])for(let rotation=0;rotation<4;rotation++)for(const active of [false,true])for(const position of [{x:.9,y:1.42},{x:2.25,y:3.5}]){
   const w=900,h=750,a=surface(w*scale,h*scale),b=surface(w*scale,h*scale),ac=a.getContext('2d'),bc=b.getContext('2d');
   const cam=objectCamera({originX:450.37,originY:350.63,zoom},position,1.75,.72,rotation);
   for(const [ctx,cached] of [[ac,false],[bc,true]]){
    ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle='#213b35';ctx.fillRect(0,0,w,h);
    drawCounter(ctx,cam,position,cached);drawCounterPrinter(ctx,cam,position,active,1.3,cached);drawCounterDiscCopier(ctx,cam,position,active,1.1,cached);
   }
   const aa=ac.getImageData(0,0,w*scale,h*scale).data,bb=bc.getImageData(0,0,w*scale,h*scale).data;
   let max=0,changed=0,strong=0,sum=0;for(let i=0;i<aa.length;i++){const d=Math.abs(aa[i]-bb[i]);max=Math.max(max,d);if(d>1)changed++;if(d>48)strong++;sum+=Math.max(0,d-1);}
   cases.push({scale,zoom,rotation,active,position:position.x,max,changed,strong,residual:sum/aa.length});
  }
  return cases;
 });
 await writeFile(resolve(output,'counter_equipment_validation.json'),JSON.stringify({cases:result,errors},null,2));
 assert.equal(errors.length,0,errors.join('; '));
 // What this guards: a cached raster that is clipped, shifted or missing a part. That shows up as many pixels
 // far from the live drawing (delta > 48) and a larger mean residual. Pixels that differ only slightly are
 // expected: gradients are dithered by device position and the cache places the bitmap on a rounded pixel.
 // Measured per component: printer and copier are near-exact; the counter's small differences sit in the
 // dithered shadow gradients under the countertop.
 const worst=result.reduce((m,c)=>c.max>m.max?c:m,result[0]);
 for(const c of result)assert.ok(c.strong<=60&&c.residual<.002,JSON.stringify(c));
 console.log(JSON.stringify({cases:result.length,worstMax:worst.max,worstStrong:Math.max(...result.map(c=>c.strong)),worstChanged:Math.max(...result.map(c=>c.changed)),worstResidual:+Math.max(...result.map(c=>c.residual)).toFixed(5)}));
}finally{await browser?.close();server.kill();}
