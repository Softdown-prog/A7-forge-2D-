import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";
import {mailBaseline,consumeNewMail} from "../dist/js/audio/mailNotification.js";
import {Soundscape,AUDIO_LEVELS} from "../dist/js/audio/soundscape.js";

test("A7 tratou o arquivo autoral e ele foi preservado no build",()=>{
 const root=resolve(import.meta.dirname,"..");
 const file=resolve(root,"assets/audio/mail_notification_01.ogg");
 const original=readFileSync(file);
 const production=readFileSync(resolve(root,"dist/assets/audio/mail_notification_01.ogg"));
 assert.ok(statSync(file).size>1000);
 assert.equal(original.subarray(0,4).toString(),"OggS");
 assert.deepEqual(production,original);
 const report=JSON.parse(readFileSync(resolve(root,"assets/audio/mail_notification_provenance.json"),"utf8"));
 assert.equal(report.selected,"poc_candidate_06");
 assert.equal(report.candidates.length,8);
 assert.equal(createHash("sha256").update(original).digest("hex"),report.sha256);
});
test("toca somente em IDs de cartas novas, não na leitura/reabertura do correio",()=>{
 let ids=mailBaseline([{id:"old",read:false}]);
 assert.equal(consumeNewMail(ids,[{id:"old",read:false}]),0);
 assert.equal(consumeNewMail(ids,[{id:"old",read:true}]),0);
 assert.equal(consumeNewMail(ids,[{id:"old",read:false},{id:"warning",read:false}]),1);
 assert.equal(consumeNewMail(ids,[{id:"warning",read:false}]),0);
 assert.equal(consumeNewMail(ids,[{id:"new",read:false},{id:"story",read:false}]),2);
 assert.equal(consumeNewMail(ids,[{id:"already-read",read:true}]),0);
 ids=mailBaseline([{id:"from-save",read:false}]);
 assert.equal(consumeNewMail(ids,[{id:"from-save",read:false}]),0);
 assert.equal(consumeNewMail(ids,[{id:"next",read:false}]),1);
});
test("volume é intermediário; áudio desabilitado e cooldown funcionam",()=>{
 assert.ok(AUDIO_LEVELS.mail>AUDIO_LEVELS.mouse);
 assert.ok(AUDIO_LEVELS.mail<AUDIO_LEVELS.smallSale);
 const played=[],levels=[];
 const ctx={state:"running",currentTime:10,
  createBufferSource(){return {buffer:null,connect(n){return n},start(){played.push(this.buffer.tag)},stop(){}};},
  createGain(){return {gain:{setValueAtTime(v){levels.push(v)},exponentialRampToValueAtTime(){}},connect(n){return n}};}
 };
 const sound=new Soundscape();
 sound.context=ctx;sound.master={gain:{value:.82}};
 assert.equal(sound.mail(),false);
 sound.approved.set("mail",{tag:"mail",duration:.38});
 assert.equal(sound.mail(),true);
 assert.equal(sound.mail(),false);
 ctx.currentTime=12;assert.equal(sound.mail(),true);
 sound.setEnabled(false);
 ctx.currentTime=20;assert.equal(sound.mail(),false);
 assert.deepEqual(played,["mail","mail"]);
 assert.equal(levels[0],AUDIO_LEVELS.mail);
});
test("interface dispara após entregar carta; recomeçar e importar redefinem baseline",()=>{
 const root=resolve(import.meta.dirname,"..");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 const sound=readFileSync(resolve(root,"src/audio/soundscape.ts"),"utf8");
 assert.ok(main.indexOf("consumeNewMail(knownMailIds,game.notices)")>main.indexOf("stepGame(game,dt*4.0)"));
 assert.match(main,/if\(arrivedMail>0&&!document\.hidden\)soundscape\.mail\(\)/);
 assert.ok((main.match(/resetMailAudioBaseline\(\)/g)||[]).length>=5);
 assert.match(sound,/mail:"\.\/assets\/audio\/mail_notification_01\.ogg"/);
});
