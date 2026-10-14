import assert from "node:assert/strict";
import test from "node:test";
import {Soundscape,AUDIO_LEVELS,SODA_CHANCE,SODA_COOLDOWN_SECONDS,shouldPlaySodaSound} from "../dist/js/audio/soundscape.js";

test("refrigerante é ocasional e mais baixo que os outros sons",()=>{
 assert.equal(SODA_CHANCE,0.28);
 assert.equal(SODA_COOLDOWN_SECONDS,12);
 assert.ok(AUDIO_LEVELS.soda<AUDIO_LEVELS.keyboard);
 assert.ok(AUDIO_LEVELS.keyboard<AUDIO_LEVELS.mouse);
 assert.equal(shouldPlaySodaSound(.27,12),true);
 assert.equal(shouldPlaySodaSound(.29,12),false);
 assert.equal(shouldPlaySodaSound(.01,11.99),false);
});
test("venda real alterna áudio sem tocar em todas as compras",()=>{
 const played=[];
 const context={state:"running",currentTime:20,
   createBufferSource(){return {buffer:null,connect(d){return d},start(){played.push(this.buffer.name)},stop(){}};},
   createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(d){return d}};}};
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
