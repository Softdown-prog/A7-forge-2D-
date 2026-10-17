import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave,stepGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {gpuDemandReport,recordGpuGameRequest,recordGpuGameSession,validGpuGameDemand} from "../dist/js/sim/gpuDemand.js";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseGpuGame} from "../dist/js/sim/gpuGames.js";
import {withStationOff} from "./station-power-fixture.mjs";

const observed=(s,id)=>gpuDemandReport(s).find(r=>r.id===id);
const accept=(result)=>assert.equal(result.ok,true,result.message);
test("métricas observam pedidos, atendimento e receita premium sem alterar economia ou RNG",()=>{
 const s=createGame(42,"historical");s.totalMinutes=(2005-1998)*360*DAY_MINUTES;
 const before={cash:s.cash,revenue:s.revenue,rng:s.rng,served:s.served};
 recordGpuGameRequest(s,"neon-rush");recordGpuGameRequest(s,"neon-rush");
 recordGpuGameSession(s,"neon-rush",true,.75);
 recordGpuGameSession(s,"neon-rush",false,0);
 assert.deepEqual(observed(s,"neon-rush"),{id:"neon-rush",name:"Neon Rush Online",
  requested:2,played:1,basic:1,withoutSession:0,premiumRevenue:.75});
 assert.deepEqual({cash:s.cash,revenue:s.revenue,rng:s.rng,served:s.served},before);
 assert.deepEqual(parseImportedSave(serializeSave(s)).gpuGameDemand,s.gpuGameDemand);
});
test("pedido já em fila ao importar save é reconciliado no primeiro atendimento",()=>{
 const s=createGame(13,"historical");recordGpuGameSession(s,"neon-rush",false,0);
 assert.equal(observed(s,"neon-rush").requested,1);
 assert.equal(observed(s,"neon-rush").basic,1);
 assert.equal(isValidSave(s),true);
});
test("métricas falsificadas, negativas e incoerentes são rejeitadas",()=>{
 const s=createGame(42,"historical");
 for(const invalid of [
  {"fake":{requested:1,played:0,basic:0,premiumCents:0}},
  {"neon-rush":{requested:1,played:2,basic:0,premiumCents:0}},
  {"neon-rush":{requested:1,played:0,basic:0,premiumCents:-1}},
  {"neon-rush":{requested:1.5,played:0,basic:0,premiumCents:0}}
 ]){
  assert.equal(validGpuGameDemand(invalid),false);
  s.gpuGameDemand=invalid;assert.equal(isValidSave(s),false);
 }
 delete s.gpuGameDemand;assert.equal(isValidSave(s),true);
});
test("clientes reais registram pedidos, uso e cobranças sem sessão artificial",()=>{
 const s=createGame(91,"historical");s.cash=30000;s.totalMinutes=(2005-1998)*360*DAY_MINUTES;
 accept(licenseGames(s));
 accept(withStationOff(s,1,()=>buyPlatform(s,1,"platform05")));
 accept(withStationOff(s,1,()=>buyGpu(s,1,"gpu05")));
 accept(withStationOff(s,1,()=>licenseWindows(s,1,"winxp")));
 accept(licenseGpuGame(s,"neon-rush"));
 for(let i=0;i<4*DAY_MINUTES;i+=120)stepGame(s,120);
 const row=observed(s,"neon-rush");
 assert.ok(row.requested>0);
 assert.ok(row.played>0);
 assert.ok(row.requested>=row.played+row.basic);
 assert.ok(s.served>=row.played+row.basic);
 assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true);
});
test("interface apresenta o histórico real na aba de licenças",()=>{
 const text=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 assert.match(text,/gpuDemandReport\(game\)/);
 assert.match(text,/observed.premiumRevenue/);
 assert.match(text,/pedidos sem sessão concluída/);
});
