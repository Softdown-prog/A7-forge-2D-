import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {installSoundInputBindings} from "../dist/js/ui/soundInputBindings.js";

class ElementStub {
 constructor(parent=null){this.parent=parent;}
 closest(query){assert.equal(query,"button");return this.parent;}
}
class ButtonStub extends ElementStub {
 constructor(disabled=false){super(null);this.disabled=disabled;}
 closest(query){assert.equal(query,"button");return this;}
}
function fixture(){
 const registered=[],listeners=new Map(),calls=[];
 const doc={hidden:false,addEventListener:(type,callback,options)=>{
  registered.push([type,options?.capture??false]);
  listeners.set(type,callback);
 }};
 const mixer={preload:()=>calls.push("preload"),unlock:()=>calls.push("unlock"),
  click:()=>calls.push("click"),stopKeyboard:()=>calls.push("stopKeyboard")};
 const originalElement=globalThis.Element,originalButton=globalThis.HTMLButtonElement;
 globalThis.Element=ElementStub;globalThis.HTMLButtonElement=ButtonStub;
 const restore=()=>{
  if(originalElement===undefined)delete globalThis.Element;else globalThis.Element=originalElement;
  if(originalButton===undefined)delete globalThis.HTMLButtonElement;else globalThis.HTMLButtonElement=originalButton;
 };
 return {doc,mixer,registered,listeners,calls,install:()=>installSoundInputBindings(doc,mixer),
  emit:(type,payload={})=>listeners.get(type)(payload),restore};
}
function check(testFn){
 const f=fixture();
 try{testFn(f);}finally{f.restore();}
}
test("pré-carrega mixer antes de registrar ouvintes",()=>check(f=>{
 f.install();
 assert.deepEqual(f.calls,["preload"]);
 assert.equal(f.registered.length,4);
}));
test("registro mantém ordem e captura original de pointerdown, keydown e click",()=>check(f=>{
 f.install();
 assert.deepEqual(f.registered,[
  ["pointerdown",true],["keydown",true],["click",true],["visibilitychange",false]
 ]);
}));
test("pointerdown desbloqueia áudio em primeiro gesto",()=>check(f=>{
 f.install();f.emit("pointerdown");assert.deepEqual(f.calls,["preload","unlock"]);
}));
test("Enter de teclado desbloqueia áudio",()=>check(f=>{
 f.install();f.emit("keydown",{key:"Enter"});assert.deepEqual(f.calls,["preload","unlock"]);
}));
test("espaço de teclado desbloqueia áudio",()=>check(f=>{
 f.install();f.emit("keydown",{key:" "});assert.deepEqual(f.calls,["preload","unlock"]);
}));
test("outras teclas não tentam desbloquear áudio",()=>check(f=>{
 f.install();f.emit("keydown",{key:"Escape"});assert.deepEqual(f.calls,["preload"]);
}));
test("som de click é disparado uma vez ao tocar botão habilitado",()=>check(f=>{
 f.install();f.emit("click",{target:new ButtonStub()});
 assert.deepEqual(f.calls,["preload","click"]);
}));
test("elemento filho de botão encontra controle via closest",()=>check(f=>{
 f.install();f.emit("click",{target:new ElementStub(new ButtonStub())});
 assert.deepEqual(f.calls,["preload","click"]);
}));
test("botão desabilitado não toca som",()=>check(f=>{
 f.install();f.emit("click",{target:new ButtonStub(true)});
 assert.deepEqual(f.calls,["preload"]);
}));
test("click fora de botão não toca som",()=>check(f=>{
 f.install();f.emit("click",{target:new ElementStub(null)});
 assert.deepEqual(f.calls,["preload"]);
}));
test("targets não DOM e targets nulos não tocam som",()=>check(f=>{
 f.install();f.emit("click",{target:null});f.emit("click",{target:"button"});
 assert.deepEqual(f.calls,["preload"]);
}));
test("aba oculta interrompe o som de teclado",()=>check(f=>{
 f.install();f.doc.hidden=true;f.emit("visibilitychange");
 assert.deepEqual(f.calls,["preload","stopKeyboard"]);
}));
test("aba visível não interrompe som de teclado",()=>check(f=>{
 f.install();f.emit("visibilitychange");
 assert.deepEqual(f.calls,["preload"]);
}));
test("mudanças de visibilidade são lidas ao ocorrer, não no bootstrap",()=>check(f=>{
 f.install();f.emit("visibilitychange");
 f.doc.hidden=true;f.emit("visibilitychange");
 f.doc.hidden=false;f.emit("visibilitychange");
 assert.deepEqual(f.calls,["preload","stopKeyboard"]);
}));
test("o mesmo mixer recebe todos eventos e preserva contagem",()=>check(f=>{
 f.install();f.emit("pointerdown");
 f.emit("keydown",{key:"Enter"});f.emit("click",{target:new ButtonStub()});
 f.doc.hidden=true;f.emit("visibilitychange");
 assert.deepEqual(f.calls,["preload","unlock","unlock","click","stopKeyboard"]);
 assert.equal(f.registered.length,4);
}));
test("UI de áudio não conhece motor nem salva partidas",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/soundInputBindings.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/(?:sim|application|render|audio)\//);
 assert.doesNotMatch(ui,/\b(GameState|stepGame|save\(|localStorage|requestAnimationFrame|new Audio)\b/);
 assert.match(main,/installSoundInputBindings\(document,soundscape\)/);
 assert.match(ui,/doc\.addEventListener\("click",event=>/);
 assert.match(ui,/control instanceof HTMLButtonElement&&!control\.disabled/);
});
