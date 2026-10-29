import {assertSourceCall} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {createLayoutEditorPort} from "../dist/js/application/layoutEditorPort.js";
import {createLayoutEditor} from "../dist/js/ui/layoutEditor.js";
import {cameraForGame,iso} from "../dist/js/render/isometric.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {placeFurniture} from "../dist/js/sim/shop.js";
import {buildWall} from "../dist/js/sim/walls.js";

test("porta move objetos com a mesma validacao do motor e salva depois de importar",()=>{
 let s=createGame(401,"historical");s.cash=20000;
 const port=createLayoutEditorPort(()=>s,cameraForGame);
 const old=s;
 assert.equal(port.objects().some(o=>o.id==="pc:0"),true);
 assert.ok(port.placementIssue({...port.objects().find(o=>o.id==="pc:0"),x:100}));
 const draft={...port.objects().find(o=>o.id==="pc:0"),x:2.5,y:3,rotation:1};
 const before=JSON.stringify(s);
 assert.equal(port.move("pc:0",{...draft,x:200}).ok,false);
 assert.equal(JSON.stringify(s),before);
 const move=port.move("pc:0",draft);
 assert.equal(move.ok,true,move.message);
 assert.equal(port.objects().find(o=>o.id==="pc:0").rotation,1);
 assert.equal(isValidSave(s),true);
 s=parseImportedSave(serializeSave(s));
 const next={...port.objects().find(o=>o.id==="pc:0"),x:2.5,y:3,rotation:2};
 assert.equal(port.move("pc:0",next).ok,true);
 assert.equal(old.objectPlacements[0].rotation,1);
 assert.equal(s.objectPlacements[0].rotation,2);
});

test("retirar decoração e divisória mantém os estados atuais e não custa dinheiro",()=>{
 const s=createGame(402,"historical");s.cash=20000;
 const port=createLayoutEditorPort(()=>s,cameraForGame);
 assert.equal(placeFurniture(s,"table","floor-2").ok,true);
 const object=port.objects().find(o=>o.id==="decor:floor-2");
 assert.ok(object);
 assert.equal(port.removalIssue(object.id),null);
 const money=[s.cash,s.expenses],before=JSON.stringify(s);
 assert.equal(port.remove("invalid").ok,false);
 assert.equal(JSON.stringify(s),before);
 assert.equal(port.remove(object.id).ok,true);
 assert.deepEqual([s.cash,s.expenses],money);
 assert.equal(port.objects().some(o=>o.id===object.id),false);
 assert.equal(buildWall(s,{axis:"y",x:4,y:4}).ok,true);
 const partition=port.partitions()[0];assert.ok(partition);
 assert.equal(port.partition(partition.id)?.id,partition.id);
 assert.deepEqual(port.endpoints(partition).length,2);
 const wallMoney=[s.cash,s.expenses];
 assert.equal(port.remove(partition.id).ok,true);
 assert.deepEqual([s.cash,s.expenses],wallMoney);
 assert.equal(port.partition(partition.id),null);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});

test("toques intencionais selecionam, enquanto arrasto e scroll não executam comandos",t=>{
 let now=10000;t.mock.method(performance,"now",()=>now);
 const globals={document:globalThis.document,window:globalThis.window};
 const eventListeners={};const elementListeners={};
 const viewport={scrollLeft:0,scrollTop:0};
 const canvas={
  width:1000,height:650,parentElement:null,
  closest:selector=>selector==="#scene-viewport"?viewport:null,
  addEventListener:(name,fn)=>{eventListeners[name]=fn;},
  getBoundingClientRect:()=>({left:0,top:0,width:1000,height:650})
 };
 globalThis.window={matchMedia:()=>({matches:true})};
 globalThis.document={
  querySelector:selector=>selector==="#layout-confirm"?
    {addEventListener:(name,fn)=>{elementListeners[name]=fn;},disabled:false}:null,
  getElementById:id=>id==="layout-confirm"?
    {addEventListener:(name,fn)=>{elementListeners[name]=fn;},disabled:false}:null
 };
 try{
  const s=createGame(403,"historical");s.cash=20000;
  const port=createLayoutEditorPort(()=>s,cameraForGame);
  let changed=0,opened=0;
  const editor=createLayoutEditor(canvas,port,()=>{opened++;},()=>{changed++;});
  editor.open();
  assert.equal(opened,1);
  const object=port.objects().find(o=>o.id==="pc:0");
  const cam=port.camera(),hit=iso({x:object.x+object.w/2,y:object.y+object.d/2},cam,50);
  const send=(name,id,x,y,additional={})=>{
   const event={
    pointerType:"touch",pointerId:id,clientX:x,clientY:y,
    preventDefault(){},stopImmediatePropagation(){},...additional
   };
   eventListeners[name](event);
  };
  send("pointerdown",1,hit.x,hit.y);
  send("pointerup",1,hit.x+11,hit.y);
  assert.equal(editor.selected,null,"deslocamento maior que 10px representa arrasto");
  send("pointerdown",2,hit.x,hit.y);
  viewport.scrollLeft=4;
  send("pointerup",2,hit.x,hit.y);
  assert.equal(editor.selected,null,"scroll horizontal não deve selecionar");
  viewport.scrollLeft=0;
  send("pointerdown",20,hit.x,hit.y);viewport.scrollTop=4;
  send("pointerup",20,hit.x,hit.y);assert.equal(editor.selected,null,"scroll vertical não deve selecionar");viewport.scrollTop=0;
  send("pointerdown",21,hit.x,hit.y);send("pointercancel",21,hit.x,hit.y);
  send("pointerup",21,hit.x,hit.y);assert.equal(editor.selected,null,"cancelamento não confirma seleção");
  send("pointerdown",3,hit.x,hit.y);
  now+=1800; // A stationary long press is still a deliberate tap.
  send("pointerup",3,hit.x,hit.y);
  assert.equal(editor.selected,"pc:0");
  assert.ok(editor.draft);
  send("click",3,hit.x,hit.y,{pointerType:"mouse"});
  assert.equal(editor.selected,"pc:0","click de compatibilidade não seleciona de novo");
  const destination=iso({x:2.5+object.w/2,y:3+object.d/2},cam);
  send("pointerdown",4,destination.x,destination.y);
  send("pointerup",4,destination.x,destination.y);
  assert.equal(editor.draft.x,2.5);
  assert.equal(editor.draft.y,3);
  elementListeners.click();
  assert.equal(changed,1);
  assert.deepEqual(s.objectPlacements.find(p=>p.id==="pc:0"),{id:"pc:0",x:2.5,y:3,rotation:0});
  assert.equal(editor.selected,null);
  assert.equal(isValidSave(s),true);
  editor.reset();assert.equal(editor.active,false);assert.equal(editor.draft,null);
  assert.equal(changed,1,"descartar rascunho em troca de save não executa uma ação da partida");
 }finally{
  for(const [name,value] of Object.entries(globals)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});

test("UI do editor não depende de GameState; pointer handlers conservam seus contratos",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/layoutEditor.ts",root),"utf8");
 const port=readFileSync(new URL("application/layoutEditorPort.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|\bgetState\(/);
 assert.doesNotMatch(port,/\bwindow\b|\bdocument\b|\bHTMLCanvasElement\b/);
 assertSourceCall("application/gamePorts.ts","createLayoutEditorPort",["getState","cameraForState"]);
 assertSourceCall("bootstrap/bootstrapGame.ts","createLayoutEditor",["elements.canvas","application.ports.layoutEditorPort"]);
 for(const [pattern,name] of [
  [/Math\.hypot\(e\.clientX-start\.x,e\.clientY-start\.y\)>10/,"arrasto de 10px"],
  [/scrollLeft\?\?0\)-start\.left\)>3/,"rolagem horizontal"],
  [/scrollTop\?\?0\)-start\.top\)>3/,"rolagem vertical"],
  [/performance\.now\(\)-lastTouch<650/,"click duplicado"],
  [/pointerup/,"touch"],[/pointercancel/,"cancelamento"]
 ])assert.match(ui,pattern,name);
});
