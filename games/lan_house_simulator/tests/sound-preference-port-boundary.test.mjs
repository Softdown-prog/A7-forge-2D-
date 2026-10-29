import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createSoundPreferencePort} from "../dist/js/ui/soundPreferencePort.js";

function fixture(initial=null){
 const values=new Map(),calls=[];
 if(initial!==null)values.set("lhs.sound",initial);
 const store={
  get:key=>{calls.push(["get",key]);return values.get(key)??null;},
  set:(key,value)=>{calls.push(["set",key,value]);values.set(key,value);}
 };
 const mixer={setEnabled:enabled=>calls.push(["audio",enabled])};
 return {values,calls,store,mixer,port:createSoundPreferencePort(store)};
}
test("som habilitado por padrão para usuário sem preferência",()=>{
 const x=fixture();
 assert.equal(x.port.read(),true);
 assert.deepEqual(x.calls,[["get","lhs.sound"]]);
});
test("preferência off desativa áudio na inicialização",()=>{
 assert.equal(fixture("off").port.read(),false);
});
test("preferência on ativa áudio na inicialização",()=>{
 assert.equal(fixture("on").port.read(),true);
});
test("valores anteriores diferentes de off preservam áudio ligado",()=>{
 for(const value of ["", "disabled","OFF","false","0"]){
  assert.equal(fixture(value).port.read(),true,value);
 }
});
test("localStorage bloqueado na leitura não impede o menu",()=>{
 const port=createSoundPreferencePort({
  get:()=>{throw Error("SecurityError");},set:()=>{}
 });
 assert.equal(port.read(),true);
});
test("desligar som atualiza mixer antes de persistir",()=>{
 const x=fixture("on");x.port.update(false,x.mixer);
 assert.deepEqual(x.calls,[["audio",false],["set","lhs.sound","off"]]);
 assert.equal(x.values.get("lhs.sound"),"off");
});
test("ligar som atualiza mixer antes de persistir",()=>{
 const x=fixture("off");x.port.update(true,x.mixer);
 assert.deepEqual(x.calls,[["audio",true],["set","lhs.sound","on"]]);
});
test("mudança de preferência é observada na próxima leitura",()=>{
 const x=fixture("off");assert.equal(x.port.read(),false);
 x.port.update(true,x.mixer);assert.equal(x.port.read(),true);
});
test("erro de armazenamento na gravação não bloqueia ativação do áudio",()=>{
 const calls=[],port=createSoundPreferencePort({
  get:()=>null,set:()=>{throw Error("QuotaExceededError");}
 });
 assert.doesNotThrow(()=>port.update(true,{setEnabled:x=>calls.push(x)}));
 assert.deepEqual(calls,[true]);
});
test("erro ao persistir desativação ainda desliga som",()=>{
 const calls=[],port=createSoundPreferencePort({
  get:()=>null,set:()=>{throw Error("SecurityError");}
 });
 port.update(false,{setEnabled:x=>calls.push(x)});
 assert.deepEqual(calls,[false]);
});
test("falha do mixer é propagada e não provoca gravação incorreta",()=>{
 const x=fixture();const sound={setEnabled:()=>{throw Error("audio");}};
 assert.throws(()=>x.port.update(false,sound),/audio/);
 assert.deepEqual(x.calls,[]);
});
test("duas preferências não interferem no estado de outro armazenamento",()=>{
 const a=fixture("on"),b=fixture("off");
 a.port.update(false,a.mixer);
 assert.equal(b.port.read(),false);
 b.port.update(true,b.mixer);
 assert.equal(a.port.read(),false);
});
test("não cria listeners nem consulta save, sim ou Canvas",()=>{
 const root=new URL("../src/",import.meta.url);
 const src=readFileSync(new URL("ui/soundPreferencePort.ts",root),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/(?:sim|render|audio|application)\//);
 assert.doesNotMatch(src,/\b(GameState|localStorage|document|window|CanvasRenderingContext2D|addEventListener|stepGame)\b/);
});
test("main mantém Soundscape compartilhado e delega somente preferência ao port",()=>{
 const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 assert.match(main,/const soundPreference=createSoundPreferencePort\(\{/);
 assert.match(main,/const soundEnabled=soundPreference\.read\(\)/);
 assert.match(main,/const soundscape=new Soundscape\(soundEnabled\)/);
 assert.match(main,/soundPreference\.update\(enabled,soundscape\)/);
 assert.match(main,/installSoundInputBindings\(document,soundscape\)/);
 assert.doesNotMatch(main,/localStorage\.setItem\("lhs\.sound"/);
});
