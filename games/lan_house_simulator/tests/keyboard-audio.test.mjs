import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync,statSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {Soundscape,KEYBOARD_TAKES,keyboardTakeAt,AUDIO_LEVELS,KEYBOARD_DURATION} from "../dist/js/audio/soundscape.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");

test("três takes aprovados são áudios OGG reais e diferentes",()=>{
  assert.deepEqual([...KEYBOARD_TAKES],["keyboard_te1","keyboard_t2","keyboard_t3"]);
  const unique=new Set();
  for(const name of KEYBOARD_TAKES){
    const filename=resolve(root,"assets/audio",name+".ogg");
    assert.ok(statSync(filename).size>10000,filename);
    const bytes=readFileSync(filename);
    assert.equal(bytes.subarray(0,4).toString(),"OggS");
    unique.add(createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(unique.size,3,"os três arquivos precisam ter batidas realmente diferentes");
});

test("sequência de teclado alterna A/B/C sem repetir imediatamente",()=>{
  const sequence=Array.from({length:9},(_,i)=>keyboardTakeAt(i));
  assert.deepEqual(sequence,[...KEYBOARD_TAKES,...KEYBOARD_TAKES,...KEYBOARD_TAKES]);
  assert.equal(KEYBOARD_DURATION,3.5);
});

test("teclado sempre fica abaixo do mouse e dos pagamentos na mixagem",()=>{
  assert.ok(0<AUDIO_LEVELS.keyboard && AUDIO_LEVELS.keyboard<AUDIO_LEVELS.mouse);
  assert.ok(AUDIO_LEVELS.mouse<AUDIO_LEVELS.smallSale);
  assert.ok(AUDIO_LEVELS.smallSale<AUDIO_LEVELS.income);
});

test("Soundscape toca um take por sessão, respeita intervalo e stop sem loop",()=>{
  const played=[];
  const stops=[];
  const gainParam=()=>({
    value:1,
    setValueAtTime(value){this.value=value;},
    linearRampToValueAtTime(value){this.value=value;},
    exponentialRampToValueAtTime(value){this.value=value;},
    cancelScheduledValues(){}
  });
  const output={connect(){return this}};
  const ctx={
    state:"running",currentTime:5,
    createBufferSource(){
      const source={
        buffer:null,onended:null,
        connect(dest){return dest;},
        start(){played.push(this.buffer.tag);},
        stop(){stops.push(this.buffer.tag);}
      };
      return source;
    },
    createGain(){return {gain:gainParam(),connect(dest){return dest}};}
  };
  const sound=new Soundscape();
  sound.context=ctx;
  sound.keyboardBus={gain:gainParam(),connect(){return output}};
  for(const tag of KEYBOARD_TAKES)sound.approved.set(tag,{tag,duration:3.3});
  for(let i=0;i<9;i++){
    sound.keyboard();
    sound.keyboard(); // segundo pedido no mesmo instante não sobrepõe.
    ctx.currentTime+=KEYBOARD_DURATION;
  }
  assert.deepEqual(played,[...KEYBOARD_TAKES,...KEYBOARD_TAKES,...KEYBOARD_TAKES]);
  assert.equal(stops.length,9);
  sound.stopKeyboard();
  assert.equal(sound.keyboardNodes.size,0);
  assert.equal(sound.nextKeyboard,ctx.currentTime);
});

test("se uma gravação não carregar, alternância aproveita as restantes",()=>{
  const played=[];
  const param={value:1,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}};
  const ctx={state:"running",currentTime:2,
    createBufferSource(){return {buffer:null,connect(d){return d;},start(){played.push(this.buffer.id);},stop(){}};},
    createGain(){return {gain:param,connect(d){return d}};}
  };
  const sound=new Soundscape();
  sound.context=ctx;
  sound.keyboardBus={gain:param,connect(d){return d}};
  sound.approved.set("keyboard_t2",{id:"t2",duration:3.3});
  for(let i=0;i<4;i++){sound.keyboard();ctx.currentTime+=4;}
  assert.deepEqual(played,["t2","t2","t2","t2"]);
});
