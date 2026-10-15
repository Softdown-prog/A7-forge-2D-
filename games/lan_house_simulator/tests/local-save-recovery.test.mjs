import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY,DAY_MINUTES} from "../dist/js/sim/types.js";
import {GAME_SAVE_BACKUP_KEY,loadLocalSave,writeLocalSave,replaceLocalSave} from "../dist/js/sim/localSave.js";
const makeStore=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
test("Continuar só com estado validado, não apenas chave presente",()=>{
 const store=makeStore();assert.equal(loadLocalSave(store).source,"none");
 writeLocalSave(store,createGame());assert.equal(loadLocalSave(store).source,"primary");
 store.setItem(GAME_SAVE_KEY,"{");
 assert.deepEqual(loadLocalSave(store),{state:null,source:"none",invalidPrimary:true});
});
test("backup recupera save anterior sem apagar registro danificado",()=>{
 const store=makeStore(),s=createGame();s.cash=1500;writeLocalSave(store,s);
 s.cash=1800;writeLocalSave(store,s);
 store.setItem(GAME_SAVE_KEY,"{");
 const recovered=loadLocalSave(store);
 assert.equal(recovered.source,"backup");assert.equal(recovered.invalidPrimary,true);
 assert.equal(recovered.state.cash,1500);assert.equal(store.getItem(GAME_SAVE_KEY),"{");
});
test("cópia anterior gira apenas quando muda o dia",()=>{
 const store=makeStore(),s=createGame();
 s.cash=100;writeLocalSave(store,s);s.cash=200;writeLocalSave(store,s);
 s.cash=300;writeLocalSave(store,s);
 assert.equal(JSON.parse(store.getItem(GAME_SAVE_BACKUP_KEY)).cash,100);
 s.totalMinutes=DAY_MINUTES;s.cash=400;writeLocalSave(store,s);
 s.cash=500;writeLocalSave(store,s);
 assert.equal(JSON.parse(store.getItem(GAME_SAVE_BACKUP_KEY)).cash,400);
});
test("nova campanha, importação e reinício não herdam backups",()=>{
 const store=makeStore(),s=createGame();
 writeLocalSave(store,s);writeLocalSave(store,s);
 assert.ok(store.getItem(GAME_SAVE_BACKUP_KEY));
 const fresh=createGame(90);fresh.cash=750;replaceLocalSave(store,fresh);
 assert.equal(loadLocalSave(store).state.cash,750);
 assert.equal(store.getItem(GAME_SAVE_BACKUP_KEY),null);
});
test("quota do backup não bloqueia principal e falha principal preserva estado",()=>{
 const store=makeStore(),s=createGame();
 writeLocalSave(store,s);s.cash=999;
 writeLocalSave({...store,setItem:(key,val)=>{if(key===GAME_SAVE_BACKUP_KEY)throw Error("quota");store.setItem(key,val);}},s);
 assert.equal(loadLocalSave(store).state.cash,999);
 assert.throws(()=>replaceLocalSave({...store,setItem:()=>{throw Error("quota");}},createGame()),/quota/);
 assert.equal(loadLocalSave(store).state.cash,999);
});
test("validação e armazenamento indisponível",()=>{
 const store=makeStore(),s=createGame();s.totalMinutes=-1;
 assert.throws(()=>writeLocalSave(store,s));
 store.setItem(GAME_SAVE_KEY,"{");
 store.setItem(GAME_SAVE_BACKUP_KEY,'{"version":1,"totalMinutes":-20}');
 assert.equal(loadLocalSave(store).source,"none");
 assert.equal(loadLocalSave({getItem:()=>{throw Error("blocked");}}).source,"none");
});
