import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {createGameSessionPort} from "../dist/js/application/gameSessionPort.js";
import {GAME_SAVE_KEY} from "../dist/js/sim/types.js";
import {GAME_SAVE_BACKUP_KEY} from "../dist/js/sim/localSave.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {installSaveFileControls} from "../dist/js/ui/saveFileControls.js";

function storage(){
 const map=new Map();
 return {
  map,
  store:{
   getItem:key=>map.get(key)??null,
   setItem:(key,value)=>map.set(key,value),
   removeItem:key=>map.delete(key)
  }
 };
}

test("sessão carrega partida principal e recupera backup sem apagar dados inválidos",()=>{
 let game=createGame(21,"historical");
 const {map,store}=storage();
 const port=createGameSessionPort(store,()=>game);
 assert.equal(port.startup().source,"none");
 port.persist();
 assert.equal(port.startup().source,"primary");
 const valid=map.get(GAME_SAVE_KEY);
 map.set(GAME_SAVE_BACKUP_KEY,valid);
 map.set(GAME_SAVE_KEY,"{not-json");
 const recovered=port.startup();
 assert.equal(recovered.source,"backup");
 assert.equal(recovered.invalidPrimary,true);
 assert.equal(isValidSave(recovered.state),true);
 assert.equal(map.get(GAME_SAVE_KEY),"{not-json","não deve destruir a cópia danificada");
 assert.equal(map.get(GAME_SAVE_BACKUP_KEY),valid,"mantém a cópia boa");
});

test("persistência, exportação e importação seguem a instância corrente sem alterar o formato",()=>{
 let game=createGame(22,"historical");
 const {map,store}=storage();
 const port=createGameSessionPort(store,()=>game);
 port.persist();
 const original=game;
 const exported=port.exportSnapshot();
 assert.match(exported.filename,/^lan-house-simulator-dia-[0-9]+\.json$/);
 assert.equal(parseImportedSave(exported.contents).rng,game.rng);
 const backupSeed=map.get(GAME_SAVE_KEY);
 game=parseImportedSave(exported.contents);
 game.cash=2345;
 port.persist();
 assert.equal(JSON.parse(map.get(GAME_SAVE_KEY)).cash,2345);
 assert.equal(map.get(GAME_SAVE_BACKUP_KEY),backupSeed);
 const candidate=port.parseImport(exported.contents);
 assert.notEqual(candidate,original);
 assert.equal(candidate.cash,original.cash);
 assert.equal(game.cash,2345,"parse nunca substitui a partida atual");
 port.replace(candidate);
 game=candidate;
 assert.equal(JSON.parse(map.get(GAME_SAVE_KEY)).cash,original.cash);
 assert.equal(map.has(GAME_SAVE_BACKUP_KEY),false,"substituição explícita não preserva outro jogo no backup");
 assert.equal(isValidSave(game),true);
});

test("falha de gravação explícita conserva a partida em memória e o último save",()=>{
 let current=createGame(24,"historical");
 const {map,store}=storage();
 const session=createGameSessionPort(store,()=>current);
 session.persist();
 const old=map.get(GAME_SAVE_KEY);
 const saveToImport=createGame(25,"historical");
 const failing={...store,setItem(){throw new Error("armazenamento indisponível");}};
 const guarded=createGameSessionPort(failing,()=>current);
 assert.throws(()=>guarded.replace(saveToImport),/armazenamento indisponível/);
 assert.equal(map.get(GAME_SAVE_KEY),old);
 assert.equal(current.rng,createGame(24,"historical").rng);
 assert.throws(()=>guarded.parseImport("{quebrado"),/JSON inválido/);
 assert.equal(current.rng,createGame(24,"historical").rng);
});

test("nova campanha mantém a semente do correio independente do RNG do motor",()=>{
 let game=createGame(25,"historical");
 const {store}=storage(),port=createGameSessionPort(store,()=>game);
 const a=port.newGame(72421,"historical",12345);
 const b=port.newGame(72421,"historical",67890);
 const expected=createGame(72421,"historical");
 assert.equal(a.mailScheduleSeed,12345);
 assert.equal(b.mailScheduleSeed,67890);
 assert.equal(a.rng,expected.rng);
 assert.equal(b.rng,expected.rng);
 assert.equal(isValidSave(a),true);
 assert.equal(isValidSave(b),true);
});

test("importação de arquivos e exportação mantêm limite, controles e mensagens",async()=>{
 const old={document:globalThis.document,window:globalThis.window,URL:globalThis.URL};
 const events=()=>{const handlers={};return {addEventListener:(n,cb)=>{handlers[n]=cb;},fire:(n="click")=>handlers[n]?.()};};
 const importButton=events(),exportButton=events(),importFile=Object.assign(events(),{files:[],value:""});
 let canExport=false,imports=[],alerts=[],savedLinks=[],revoked=[];
 globalThis.document={
  createElement:()=>({
   set href(v){this.url=v;},set download(v){this.filename=v;},
   click(){savedLinks.push({url:this.url,name:this.filename});},
   remove(){}
  }),
  body:{append(){}}
 };
 globalThis.window={setTimeout:fn=>fn()};
 globalThis.URL={createObjectURL:()=> "blob:save-test",revokeObjectURL:url=>revoked.push(url)};
 try{
  installSaveFileControls({
   importFile,importButton,exportButton,
   canExport:()=>canExport,
   exportSnapshot:()=>({filename:"lan-house-simulator-dia-1.json",contents:"{}"}),
   importText:async value=>{imports.push(value);if(value==="bad")throw new Error("Inválido");},
   notify:message=>alerts.push(message)
  });
  exportButton.fire();
  assert.match(alerts.at(-1),/Nenhuma partida/);
  canExport=true;
  exportButton.fire();
  assert.equal(savedLinks[0].name,"lan-house-simulator-dia-1.json");
  assert.deepEqual(revoked,["blob:save-test"]);
  importFile.files=[{size:2_000_001,text:async()=> "oversize"}];
  await importFile.fire("change");
  assert.match(alerts.at(-1),/2 MB/);
  assert.equal(imports.length,0);
  importFile.files=[{size:5,text:async()=> "valid"}];
  await importFile.fire("change");
  assert.deepEqual(imports,["valid"]);
  assert.equal(importFile.value,"");
  importFile.files=[{size:3,text:async()=> "bad"}];
  await importFile.fire("change");
  assert.match(alerts.at(-1),/Inválido/);
  assert.deepEqual(imports,["valid","bad"]);
  let tapped=false;
  importFile.click=()=>{tapped=true;};
  importButton.fire();
  assert.equal(tapped,true);
 }finally{
  for(const [name,value] of Object.entries(old)){
   if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
 }
});

test("UI de arquivos não conhece estado do motor e main injeta a porta",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/saveFileControls.ts",root),"utf8");
 const app=readFileSync(new URL("application/gameSessionPort.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b/);
 assert.doesNotMatch(app,/\bwindow\b|\bdocument\b|\blocalStorage\b|\bHTMLElement\b/);
 assert.match(sourceModule("application/gameApplication.ts"),/createGameSessionPort\(/);
 assert.match(sourceModule("ui/runtimeSessionController.ts"),/installSaveFileControls\(/);
 assertCompositionAdaptersExclude(/\b(?:loadLocalSave|writeLocalSave|replaceLocalSave|parseImportedSave|serializeSave)\s*\(/);
});
