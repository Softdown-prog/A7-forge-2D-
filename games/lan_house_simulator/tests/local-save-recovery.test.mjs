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

test("leitura bloqueada do backup não impede salvar na chave principal",()=>{
 const store=makeStore(),s=createGame(5);writeLocalSave(store,s);
 s.cash=1620;
 const withBlockedBackup={...store,getItem:(key)=>{if(key===GAME_SAVE_BACKUP_KEY)throw Error("backup inacessível");return store.getItem(key);}};
 assert.doesNotThrow(()=>writeLocalSave(withBlockedBackup,s));
 assert.equal(loadLocalSave(store).state.cash,1620);
});
test("recuperação tenta o backup mesmo quando o navegador nega ler a chave principal",()=>{
 const store=makeStore(),s=createGame(7);s.cash=3480;writeLocalSave(store,s);
 store.setItem(GAME_SAVE_BACKUP_KEY,store.getItem(GAME_SAVE_KEY));
 const blocked={getItem:(key)=>{if(key===GAME_SAVE_KEY)throw Error("chave principal bloqueada");return store.getItem(key);}};
 const read=loadLocalSave(blocked);
 assert.equal(read.source,"backup");assert.equal(read.state.cash,3480);
});
test("partidas extensas sobrevivem ao checkpoint diário, backup e encerramento em 2030",async()=>{
 const {GAME_LAST_MINUTE}=await import("../dist/js/sim/mailCalendar.js");
 const {stepGame}=await import("../dist/js/sim/engine.js");
 const store=makeStore(),s=createGame(31,"historical");
 s.cash=5432.25;s.revenue=142300.75;s.expenses=136868.50;
 s.served=87000;s.nextCustomerId=87012;
 s.totalMinutes=GAME_LAST_MINUTE-3;
 s.eventLog=["Campanha de longa duração","Saldo consolidado"];
 writeLocalSave(store,s);
 const initialLength=store.getItem(GAME_SAVE_KEY).length;
 assert.ok(initialLength<2_000_000,"checkpoint dentro do limite local");
 s.totalMinutes++;s.cash=5443.25;writeLocalSave(store,s);
 assert.equal(loadLocalSave(store).state.totalMinutes,GAME_LAST_MINUTE-2);
 assert.equal(loadLocalSave(store).state.served,87000);
 assert.equal(JSON.parse(store.getItem(GAME_SAVE_BACKUP_KEY)).cash,5432.25);
 store.setItem(GAME_SAVE_KEY,"{");
 const recovered=loadLocalSave(store);
 assert.equal(recovered.source,"backup");
 assert.equal(recovered.state.cash,5432.25);
 assert.equal(recovered.state.served,87000);
 assert.equal(recovered.state.totalMinutes,GAME_LAST_MINUTE-3);
 // Chegar ao limite de 2030 não pode avançar para 2031 ou reabrir o calendário.
 stepGame(s,40);
 assert.equal(s.totalMinutes,GAME_LAST_MINUTE);
 const cash=s.cash;stepGame(s,120);
 assert.equal(s.totalMinutes,GAME_LAST_MINUTE);
 assert.equal(s.cash,cash);
 assert.equal(s.leftoverMinutes,0);
 writeLocalSave(store,s);
 assert.equal(loadLocalSave(store).source,"primary");
 assert.equal(loadLocalSave(store).state.totalMinutes,GAME_LAST_MINUTE);
});
test("checkpoint de anos distintos não perde a progressão nem os campos opcionais",()=>{
 const {store,getItem}=(()=>{const store=makeStore();return {store,getItem:key=>store.getItem(key)};})();
 const s=createGame(49,"historical");
 s.employees={cleaner:true};s.employeePayrollAccrued=84;
 s.pcPoweredOff=[true,false,false];
 for(const d of [30,360,7*360,26*360,32*360]){
  s.totalMinutes=d*DAY_MINUTES+16;
  s.served=d*2;
  writeLocalSave(store,s);
  const reload=loadLocalSave(store);
  assert.equal(reload.source,"primary");
  assert.equal(reload.state.totalMinutes,s.totalMinutes);
  assert.equal(reload.state.served,d*2);
  assert.equal(reload.state.employeePayrollAccrued,84);
  assert.deepEqual(reload.state.pcPoweredOff,[true,false,false]);
  assert.ok(getItem(GAME_SAVE_KEY).length<2_000_000);
 }
});
