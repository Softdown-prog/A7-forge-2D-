import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
 Soundscape,AUDIO_LEVELS,PRINTER_CHANCE,PRINTER_COOLDOWN_SECONDS,
 PRINTER_AFTER_PAYMENT_DELAY_SECONDS,shouldPlayPrinterSound
} from "../dist/js/audio/soundscape.js";
import {createPrinterBuffer,PRINTER_DURATION_SECONDS} from "../dist/js/audio/printerSfx.js";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {buyPrinter} from "../dist/js/sim/printService.js";
import {snapshotGameState} from "../dist/js/sim/saveTransfer.js";

test("impressora toca em 35% dos serviços, em volume discreto e com cooldown",()=>{
 assert.equal(PRINTER_CHANCE,.35);
 assert.equal(PRINTER_COOLDOWN_SECONDS,14);
 assert.equal(PRINTER_AFTER_PAYMENT_DELAY_SECONDS,.90);
 assert.ok(AUDIO_LEVELS.printer>AUDIO_LEVELS.keyboard);
 assert.ok(AUDIO_LEVELS.printer<AUDIO_LEVELS.soda);
 assert.ok(AUDIO_LEVELS.printer<AUDIO_LEVELS.income);
 assert.equal(shouldPlayPrinterSound(.349,14),true);
 assert.equal(shouldPlayPrinterSound(.35,14),false);
 assert.equal(shouldPlayPrinterSound(0,13.99),false);
});
test("buffer é determinístico, curto e sem estalos ou clip",()=>{
 const ctx={sampleRate:24000,createBuffer(ch,n,rate){
   assert.equal(ch,1);const data=new Float32Array(n);
   return {duration:n/rate,getChannelData:()=>data};
 }};
 const a=createPrinterBuffer(ctx),b=createPrinterBuffer(ctx),data=a.getChannelData(0);
 assert.equal(a.duration,PRINTER_DURATION_SECONDS);
 assert.deepEqual(data,b.getChannelData(0));
 assert.ok(data.some(v=>Math.abs(v)>.06));
 assert.ok(data.every(Number.isFinite));
 assert.ok(data.every(v=>Math.abs(v)<=.423));
 assert.ok(Math.abs(data.at(-1))<.001);
});
test("impressão realmente paga de cliente regular dispara uma vez; save descarta áudio",()=>{
 const s=createGame(22);s.cash=2000;
 stepGame(s,1);assert.equal(s.printEffects,undefined);
 buyPrinter(s);
 s.customers=[{id:4,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},
   costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,wallet:30}];
 stepGame(s,1);
 assert.ok(s.printer.pages>0);
 assert.equal(s.printEffects?.length,1);
 assert.equal(s.printEffects[0].customerId,4);
 assert.equal(s.paymentEffects?.length,1);
 assert.equal(snapshotGameState(s).printEffects,undefined);
 assert.equal(isValidSave(s),true);
 const count=s.printEffects.length;
 stepGame(s,1);
 assert.equal(s.printEffects.length,count);
});
test("cliente que entra exclusivamente para imprimir usa a mesma fila de áudio",()=>{
 const s=createGame(12);s.cash=2000;buyPrinter(s);
 s.customers=[{id:9,x:1.55,y:2.56,stage:"waiting",target:{x:1.55,y:2.56},
  serviceRequest:"printing",costume:"regular",pcIndex:null,usedMinutes:0,
  waitingMinutes:0,offlineWait:0,happy:true,wallet:30}];
 stepGame(s,1);
 assert.equal(s.printEffects?.length,1);
 assert.equal(s.printEffects[0].customerId,9);
 assert.equal(s.paymentEffects?.length,1);
});
test("reprodução respeita chance, tempo, cache, caixa prioritário e áudio desligado",()=>{
 const starts=[],levels=[];let renders=0;
 const ctx={sampleRate:24000,state:"running",currentTime:20,
  createBuffer(ch,n,r){renders++;const data=new Float32Array(n);
    return {duration:n/r,getChannelData:()=>data};},
  createBufferSource(){return {buffer:null,connect(n){return n},start(t){starts.push(t)},stop(){}};},
  createGain(){return {gain:{setValueAtTime(v){levels.push(v)},linearRampToValueAtTime(v){levels.push(v)}},connect(n){return n}};}
 };
 let i=0;const values=[.9,.34,.02,.01];
 const sound=new Soundscape(true,()=>.9,()=>values[i++]??.9);
 sound.context=ctx;sound.master={gain:{value:.82}};
 assert.equal(sound.printer(),false);
 assert.equal(sound.printer(),true);
 assert.equal(renders,1);
 ctx.currentTime=22;assert.equal(sound.printer(),false);
 ctx.currentTime=36;assert.equal(sound.printer(),true);
 assert.equal(renders,1);
 assert.equal(starts.length,2);
 assert.ok(Math.abs(starts[0]-(20+.006+PRINTER_AFTER_PAYMENT_DELAY_SECONDS))<1e-6);
 assert.ok(Math.abs(starts[1]-(36+.006+PRINTER_AFTER_PAYMENT_DELAY_SECONDS))<1e-6);
 assert.ok(levels.includes(AUDIO_LEVELS.printer));
 sound.setEnabled(false);ctx.currentTime=51;
 assert.equal(sound.printer(),false);
});
test("sons não aparecem por frame nem por CD/DVD",()=>{
 const root=resolve(import.meta.dirname,"..");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 const engine=readFileSync(resolve(root,"src/sim/engine.ts"),"utf8");
 const decisions=readFileSync(resolve(root,"src/sim/customerDecisions.ts"),"utf8");
 const saves=readFileSync(resolve(root,"src/sim/saveTransfer.ts"),"utf8");
 assert.match(main,/game\.printEffects\?\.splice\(0\)/);
 assert.match(main,/soundscape\.printer\(\)/);
 // As duas emissões por serviço pago estão em customerDecisions, não no engine.
 assert.equal((decisions.match(/s\.printEffects=queueVisualEvent/g)||[]).length,2);
 assert.equal((engine.match(/s\.printEffects=queueVisualEvent/g)||[]).length,0);
 assert.match(saves,/\bprintEffects\b/);
});
