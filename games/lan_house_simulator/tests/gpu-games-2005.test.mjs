import {withStationOff} from "./station-power-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,stepGame,isValidSave,chooseAvailablePc} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames,sessionRevenue} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {annualHourlyCeiling} from "../dist/js/sim/historicalEconomy.js";
import {
 GPU_GAME_CATALOG,quoteGpuGame,licenseGpuGame,gpuGameEligiblePcs,
 gpuGameHourlyRate,gpuGameSessionPrice,wantsGpuGame
} from "../dist/js/sim/gpuGames.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function year(s,y){s.totalMinutes=(y-1998)*360*DAY_MINUTES;}
function accept(result,what){assert.equal(result.ok,true,what+": "+result.message);}
function setup(y=2005,pc=1){
 const s=createGame(9,"historical");
 s.cash=25000;year(s,y);
 accept(licenseGames(s),"basic titles");
 accept(withStationOff(s,pc,()=>buyPlatform(s,pc,"platform05")),"platform 2024");
 accept(withStationOff(s,pc,()=>buyGpu(s,pc,"gpu05")),"GPU");
 accept(withStationOff(s,pc,()=>licenseWindows(s,pc,"winxp")),"Windows");
 return s;
}
test("catálogo GPU exige 2005, licenciamento básico e pelo menos uma máquina compatível",()=>{
 const prior=createGame(9,"historical");prior.cash=30000;
 year(prior,2004);
 accept(licenseGames(prior),"basic");
 const old=prior.cash;
 assert.equal(quoteGpuGame(prior,"neon-rush").ok,false);
 assert.match(quoteGpuGame(prior,"neon-rush").message,/2005/);
 assert.equal(licenseGpuGame(prior,"neon-rush").ok,false);
 assert.equal(prior.cash,old);
 year(prior,2005);
 assert.equal(quoteGpuGame(prior,"neon-rush").ok,false);
 assert.match(quoteGpuGame(prior,"neon-rush").message,/GPU/);
 accept(withStationOff(prior,1,()=>buyGpu(prior,1,"gpu05")),"GPU alone");
 assert.equal(quoteGpuGame(prior,"neon-rush").ok,false,"Windows incompatível bloqueia o jogo");
 const classic=createGame(9);classic.cash=100000;year(classic,2005);
 classic.licensedGames=true;accept(withStationOff(classic,1,()=>buyGpu(classic,1,"gpu05")),"GPU classic");
 assert.equal(licenseGpuGame(classic,"neon-rush").ok,false);
 assert.equal(classic.licensedGpuGames,undefined);
});
test("licença consome dinheiro uma vez e só atende PCs com GPU e Windows adequados",()=>{
 const s=setup(),before=s.cash,beforeExpenses=s.expenses,rng=s.rng;
 const quote=quoteGpuGame(s,"neon-rush");
 assert.equal(quote.ok,true);
 assert.deepEqual(quote.eligiblePcs,[1]);
 assert.equal(JSON.stringify(s.licensedGpuGames),undefined);
 const exact=quote.cost;
 accept(licenseGpuGame(s,"neon-rush"),"premium");
 assert.equal(s.cash,before-exact);
 assert.equal(s.expenses,beforeExpenses+exact);
 assert.equal(s.rng,rng);
 assert.deepEqual(s.licensedGpuGames,["neon-rush"]);
 assert.deepEqual(gpuGameEligiblePcs(s,GPU_GAME_CATALOG[0]),[1]);
 assert.equal(licenseGpuGame(s,"neon-rush").ok,false,"não cobra duas vezes");
 assert.equal(gpuGameHourlyRate(s,0),s.pricePerHour,"PC 1 não tem GPU");
 assert.ok(gpuGameHourlyRate(s,1)>s.pricePerHour);
 assert.ok(gpuGameHourlyRate(s,1)<=annualHourlyCeiling(2005));
 const base=sessionRevenue(s.pricePerHour,90,true);
 assert.equal(gpuGameSessionPrice(s,0,90,true),base);
 assert.ok(gpuGameSessionPrice(s,1,90,true)>base);
 assert.equal(gpuGameSessionPrice(s,1,90,false),base,"não gamer não paga premium");
 assert.ok(isValidSave(s));
 assert.deepEqual(parseImportedSave(serializeSave(s)).licensedGpuGames,["neon-rush"]);
});
test("níveis adicionais exigem GPU/Windows; título bloqueado não gera licença",()=>{
 const s=setup(2005,0);
 assert.equal(quoteGpuGame(s,"circuito-competitivo").ok,false);
 year(s,2009);
 assert.equal(quoteGpuGame(s,"circuito-competitivo").ok,false,"GPU e Windows precisam de atualização");
 accept(withStationOff(s,0,()=>buyPlatform(s,0,"platform08")),"plataforma 2008");
 accept(withStationOff(s,0,()=>buyGpu(s,0,"gpu09")),"GPU 2009");
 accept(withStationOff(s,0,()=>licenseWindows(s,0,"win7")),"Windows 7");
 assert.equal(quoteGpuGame(s,"circuito-competitivo").ok,true);
 accept(licenseGpuGame(s,"circuito-competitivo"),"2009");
 const quote=quoteGpuGame(s,"arena-do-futuro");
 assert.equal(quote.ok,false);
 year(s,2013);
 assert.equal(quoteGpuGame(s,"arena-do-futuro").ok,false,"GPU 2009 não basta");
 accept(withStationOff(s,0,()=>buyPlatform(s,0,"platform12")),"plataforma 2012");
 accept(withStationOff(s,0,()=>buyGpu(s,0,"gpu13")),"GPU 2013");
 assert.equal(quoteGpuGame(s,"arena-do-futuro").ok,true);
 accept(licenseGpuGame(s,"arena-do-futuro"),"2013");
 assert.ok(gpuGameHourlyRate(s,0)>=s.pricePerHour);
 assert.ok(gpuGameHourlyRate(s,0)<=annualHourlyCeiling(2013));
 assert.equal(s.licensedGpuGames.length,2);
 const noGpu={...s,pcGpus:[null,null,null]};
 assert.equal(gpuGameHourlyRate(noGpu,0),s.pricePerHour,"licença salva não torna GPU opcional");
});
test("saves antigos continuam válidos; IDs duplicados, falsos e de anos futuros não",()=>{
 const old=createGame(7,"historical");
 assert.ok(isValidSave(old));
 assert.equal(parseImportedSave(serializeSave(old)).licensedGpuGames,undefined);
 const s=setup();accept(licenseGpuGame(s,"neon-rush"),"premium");
 for(const licenses of [["neon-rush","neon-rush"],["fake"],["arena-do-futuro"]]){
  s.licensedGpuGames=licenses;
  assert.equal(isValidSave(s),false,JSON.stringify(licenses));
  assert.throws(()=>serializeSave(s));
 }
 s.licensedGpuGames=["neon-rush"];
 assert.ok(isValidSave(s));
 s.customers=[{id:1,x:0,y:0,stage:"arriving",target:{x:0,y:0},costume:"regular",pcIndex:null,usedMinutes:0,waitingMinutes:0,offlineWait:0,happy:true,gpuGamer:"yes"}];
 assert.equal(isValidSave(s),false,"rejeitar flags inválidas no save");
});
test("perfil de cliente é determinístico e só começa em 2005",()=>{
 const s=createGame(7,"historical");
 assert.equal(wantsGpuGame(s,4),false);
 year(s,2005);
 assert.equal(wantsGpuGame(s,4),true);
 assert.equal(wantsGpuGame(s,5),false);
 const classic=createGame(7);year(classic,2013);
 assert.equal(wantsGpuGame(classic,4),false);
});
test("interface mostra jogos 2005+ na aba de licenças com motivos e bloqueios",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const ts=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 assert.ok(html.includes('id="gpu-game-catalog"'));
 assert.ok(ts.includes("quoteGpuGame(game,title.id)"));
 assert.ok(ts.includes("licenseGpuGame(game,id)"));
 assert.ok(ts.includes('activeAdminTab==="licenses"'));
 assert.ok(ts.includes("action.disabled=!quote.ok"));
});
test("clientes reais usam preferencialmente estação premium; sem licença preço permanece normal",()=>{
 const s=setup();
 const prior=s.cash;
 accept(licenseGpuGame(s,"neon-rush"),"licença");
 // A simulação de tempo real não fabrica sessões: os NPCs determinísticos
 // chegam e pagam apenas se completarem a fila e encontrarem um PC livre.
 let gamerPaid=false,regularPaid=false;
 for(let minute=0;minute<5*DAY_MINUTES;minute+=120){
  stepGame(s,120);
  gamerPaid ||=s.customers.some(c=>c.gpuGameCharged===true);
  regularPaid ||=s.customers.some(c=>c.gpuGameCharged===false);
 }
 assert.ok(s.served>0);
 assert.ok(gamerPaid,"ao menos um visitante usou título licenciado em GPU");
 assert.ok(regularPaid,"outros clientes mantêm a tarifa básica");
 assert.ok(s.revenue>0);
 assert.ok(isValidSave(s));
 assert.ok(s.cash!==prior);
});
