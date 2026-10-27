import assert from "node:assert/strict";
import test from "node:test";
import {Soundscape,AUDIO_LEVELS,SODA_CHANCE,SODA_COOLDOWN_SECONDS,SODA_AFTER_SALE_DELAY_SECONDS,shouldPlaySodaSound} from "../dist/js/audio/soundscape.js";
import {readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";

test("refrigerante é ocasional, mais audível e permanece abaixo do mouse",()=>{
 assert.equal(SODA_CHANCE,0.28);
 assert.equal(SODA_COOLDOWN_SECONDS,12);
 assert.equal(AUDIO_LEVELS.soda,0.085);
 assert.ok(AUDIO_LEVELS.soda>AUDIO_LEVELS.keyboard);
 assert.ok(AUDIO_LEVELS.soda<AUDIO_LEVELS.mouse);
 assert.equal(SODA_AFTER_SALE_DELAY_SECONDS,0.90);
 assert.ok(AUDIO_LEVELS.keyboard<AUDIO_LEVELS.mouse);
 assert.equal(shouldPlaySodaSound(.27,12),true);
 assert.equal(shouldPlaySodaSound(.29,12),false);
 assert.equal(shouldPlaySodaSound(.01,11.99),false);
});
test("venda real alterna áudio sem tocar em todas as compras",()=>{
 const played=[],starts=[],levels=[];
 const context={state:"running",currentTime:20,
   createBufferSource(){return {buffer:null,connect(d){return d},start(t){played.push(this.buffer.name);starts.push(t)},stop(){}};},
   createGain(){return {gain:{setValueAtTime(v){levels.push(v)},exponentialRampToValueAtTime(){}},connect(d){return d}};}};
 let index=0;
 const sequence=[.9,.01,.01,.9,.01];
 const sound=new Soundscape(true,()=>sequence[index++]??.9);
 sound.context=context;
 sound.master={};
 sound.approved.set("vending_soda_01",{name:"soda1",duration:1.8});
 sound.approved.set("vending_soda_02",{name:"soda2",duration:1.8});
 assert.equal(sound.soda(),false);
 assert.equal(sound.soda(),true);
 context.currentTime=24;
 assert.equal(sound.soda(),false);
 context.currentTime=36;
 assert.equal(sound.soda(),false);
 context.currentTime=48;
 assert.equal(sound.soda(),true);
 assert.deepEqual(played,["soda1","soda2"]);
 assert.ok(Math.abs(starts[0]-(20+0.006+SODA_AFTER_SALE_DELAY_SECONDS))<1e-6);
 assert.ok(Math.abs(starts[1]-(48+0.006+SODA_AFTER_SALE_DELAY_SECONDS))<1e-6);
 assert.equal(levels[0],AUDIO_LEVELS.soda);
 assert.equal(levels[2],AUDIO_LEVELS.soda);
});
test("nunca toca se áudio desabilitado ou gravações faltantes",()=>{
 const context={state:"running",currentTime:20};
 const sound=new Soundscape(true,()=>0);
 sound.context=context;
 sound.master={gain:{value:0.82}};
 assert.equal(sound.soda(),false);
 sound.setEnabled(false);
 assert.equal(sound.soda(),false);
});

test("amostras OGG originais são diferentes e copiadas intactas no build",()=>{
 const root=resolve(import.meta.dirname,".."),samples=[];
 for(const n of ["vending_soda_01","vending_soda_02"]){
   const original=readFileSync(resolve(root,"assets/audio",n+".ogg"));
   const packaged=readFileSync(resolve(root,"dist/assets/audio",n+".ogg"));
   assert.ok(statSync(resolve(root,"assets/audio",n+".ogg")).size>10000);
   assert.equal(original.subarray(0,4).toString(),"OggS");
   assert.deepEqual(packaged,original);
   samples.push(original.toString("base64"));
 }
 assert.notEqual(samples[0],samples[1]);
});
test("som aprovado toca apenas no fluxo de venda e não cria botão de teste na produção",()=>{
 const root=resolve(import.meta.dirname,"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 const engine=readFileSync(resolve(root,"src/audio/soundscape.ts"),"utf8");
 const css=readFileSync(resolve(root,"style.css"),"utf8");
 assert.doesNotMatch(html,/preview-soda-sfx|preview-soda-status|sound-preview/);
 assert.doesNotMatch(main,/preview-soda-sfx|previewSoda/);
 assert.doesNotMatch(engine,/previewSoda/);
 assert.doesNotMatch(css,/sound-preview/);
 const feedback=readFileSync(resolve(root,"src/application/frameFeedbackPort.ts"),"utf8");
 assert.match(main,/frameFeedback\.sales\(isPlaying\)/);
 assert.match(feedback,/if\(e\.item==="soda"\)audio\.soda\(\)/);
 assert.equal(AUDIO_LEVELS.soda,0.085);
 assert.equal(SODA_AFTER_SALE_DELAY_SECONDS,0.90);
});
