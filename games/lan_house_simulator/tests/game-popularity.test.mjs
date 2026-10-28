import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,visitorArrivalChance,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {ERA_GAME_CATALOG,licenseEraGame,eraGameVisitorMultiplier} from "../dist/js/sim/eraGames.js";
import {GAME_POPULARITY_NOSTALGIA_FLOOR,gamePopularityWeight,gamePopularityPercent} from "../dist/js/sim/gamePopularity.js";
import {buyPlatform} from "../dist/js/sim/hardware.js";
import {buyGpu} from "../dist/js/sim/gpu.js";
import {toggleStationPower,stationReadyForSessions} from "../dist/js/sim/stationPower.js";
import {licenseGpuGame,gpuGameAttraction,gpuGameVisitorMultiplier,toggleGpuGameInstallation,tickGpuGameInstallations} from "../dist/js/sim/gpuGames.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {withStationOff} from "./station-power-fixture.mjs";

const setYear=(s,year)=>{s.totalMinutes=(year-1998)*360*DAY_MINUTES;};
const ok=result=>assert.equal(result.ok,true,result.message);
const near=(value,expected)=>assert.ok(Math.abs(value-expected)<1e-10,value+" != "+expected);

test("popularidade nasce em 100%, decai anualmente e tem nostalgia permanente",()=>{
 assert.equal(gamePopularityWeight(1998,1998),1);
 near(gamePopularityWeight(1998,1999),.85);
 near(gamePopularityWeight(1998,2000),.70);
 near(gamePopularityWeight(1998,2003),.25);
 assert.equal(gamePopularityWeight(1998,2030),GAME_POPULARITY_NOSTALGIA_FLOOR);
 assert.equal(gamePopularityPercent(1998,1999),85);
 assert.equal(gamePopularityPercent(1998,2030),25);
});

test("títulos 1998/1999 renovam a procura sem renovar licença, desconto ou venda inventada",()=>{
 const s=createGame(1928,"historical");s.cash=10000;
 ok(licenseGames(s));ok(withStationOff(s,0,()=>licenseWindows(s,0,"win98")));
 const rng=s.rng,revenue=s.revenue,served=s.served;
 for(const title of ERA_GAME_CATALOG.filter(x=>x.year===1998))ok(licenseEraGame(s,title.id));
 near(eraGameVisitorMultiplier(s),1.075);
 setYear(s,1999);
 near(eraGameVisitorMultiplier(s),1+.075*.85);
 const baseline=visitorArrivalChance(s,0);
 ok(licenseEraGame(s,"asfalto-noturno"));
 near(eraGameVisitorMultiplier(s),1+.075*.85+.015);
 assert.ok(visitorArrivalChance(s,0)>baseline,"lançamento incrementa procura no ano");
 assert.equal(licenseEraGame(s,"asfalto-noturno").ok,false);
 const owned=[...s.licensedEraGames],cash=s.cash;
 setYear(s,2030);
 near(eraGameVisitorMultiplier(s),1+owned.length*.015*.25);
 assert.deepEqual(s.licensedEraGames,owned);
 assert.equal(s.cash,cash);
 assert.equal(s.rng,rng);assert.equal(s.revenue,revenue);assert.equal(s.served,served);
 assert.ok(isValidSave(s));
 const imported=parseImportedSave(serializeSave(s));
 near(eraGameVisitorMultiplier(imported),eraGameVisitorMultiplier(s));
 assert.deepEqual(imported.licensedEraGames,owned);
});

test("jogo de GPU atrai clientes só com licença, instalação e PC compatível ligado",()=>{
 const s=createGame(2005,"historical");setYear(s,2005);s.cash=50000;
 ok(licenseGames(s));
 const originalChance=visitorArrivalChance(s,0);
 assert.equal(gpuGameVisitorMultiplier(s),1);
 ok(withStationOff(s,1,()=>buyPlatform(s,1,"platform05")));
 ok(withStationOff(s,1,()=>buyGpu(s,1,"gpu05")));
 ok(withStationOff(s,1,()=>licenseWindows(s,1,"winxp")));
 near(visitorArrivalChance(s,0),originalChance);
 ok(licenseGpuGame(s,"neon-rush"));
 near(gpuGameAttraction(s,"neon-rush"),.025);
 near(gpuGameVisitorMultiplier(s),1.025);
 near(visitorArrivalChance(s,0)/originalChance,1.025);
 const after=s.cash;
 setYear(s,2006);
 near(gpuGameAttraction(s,"neon-rush"),.025*.85);
 setYear(s,2030);
 near(gpuGameAttraction(s,"neon-rush"),.025*.25);
 assert.equal(s.cash,after,"nenhuma cobrança anual automática");
 assert.equal(licenseGpuGame(s,"neon-rush").ok,false);
 ok(toggleStationPower(s,1));
 assert.equal(gpuGameAttraction(s,"neon-rush"),0);
 assert.equal(gpuGameVisitorMultiplier(s),1);
 ok(toggleStationPower(s,1));
 near(gpuGameAttraction(s,"neon-rush"),.025*.25);
 ok(toggleGpuGameInstallation(s,1,"neon-rush"));
 assert.equal(gpuGameAttraction(s,"neon-rush"),0);
 assert.deepEqual(s.licensedGpuGames,["neon-rush"],"remover instalação não elimina licença");
 ok(toggleGpuGameInstallation(s,1,"neon-rush"));
 assert.equal(gpuGameAttraction(s,"neon-rush"),0,"download pendente não anuncia jogo");
 for(let t=0;t<40&&s.gpuGameInstallJobs?.length;t++)tickGpuGameInstallations(s);
 near(gpuGameAttraction(s,"neon-rush"),.025*.25);
 assert.ok(isValidSave(s));
 near(gpuGameVisitorMultiplier(parseImportedSave(serializeSave(s))),gpuGameVisitorMultiplier(s));
});

test("GPU não gera bônus no clássico ou com licença sem hardware compatível",()=>{
 const classic=createGame(8,"classic");setYear(classic,2013);
 classic.licensedGames=true;assert.equal(gpuGameVisitorMultiplier(classic),1);
 const s=createGame(8,"historical");setYear(s,2005);s.licensedGames=true;
 s.licensedGpuGames=["neon-rush"];assert.equal(gpuGameVisitorMultiplier(s),1);
 s.pcWindowsLicenses=[true,true,true];
 assert.equal(gpuGameAttraction(s,"neon-rush"),0);
});

test("UI mostra popularidade atual, nostalgia, bônus e disponibilidade física",()=>{
 const ts=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 const classic=readFileSync(new URL("../src/application/classicGamesCatalogPort.ts",import.meta.url),"utf8");
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(ts.includes('gamePopularityPercent(title.year,year)'));
 assert.ok(ts.includes('gpuGameAttraction(game,title.id)'));
 assert.ok(classic.includes('bônus atual de procura'));
 assert.ok(classic.includes('popularidade em '));
 assert.ok(html.includes('As licenças não vencem'));
 assert.ok(html.includes('PCs compatíveis ligados'));
});


test("PCs quebrados, interditados e desligados nao criam capacidade fantasma",()=>{
 const s=createGame(1901,"historical");
 const original=visitorArrivalChance(s,0);
 assert.ok(original>0);
 const accounting={cash:s.cash,expenses:s.expenses,revenue:s.revenue,rng:s.rng};
 s.pcWear=[100,100,100];
 assert.equal(visitorArrivalChance(s,0),0);
 assert.equal(stationReadyForSessions(s,0),false);
 s.pcWear[0]=80;
 near(visitorArrivalChance(s,0),original);
 s.repairJobs=[{pc:0,x:2.2,y:1.1,phase:"working",progress:1,duration:24}];
 assert.equal(stationReadyForSessions(s,0),false);
 assert.equal(visitorArrivalChance(s,0),0);
 s.repairJobs=[];
 ok(toggleStationPower(s,0));
 assert.equal(visitorArrivalChance(s,0),0);
 ok(toggleStationPower(s,0));
 near(visitorArrivalChance(s,0),original);
 assert.deepEqual({cash:s.cash,expenses:s.expenses,revenue:s.revenue,rng:s.rng},accounting);
 assert.ok(isValidSave(s));
});

test("licencas classicas nao anunciam jogo se o unico Windows licenciado esta fora de servico",()=>{
 const s=createGame(991,"historical");s.cash=5000;
 ok(licenseGames(s));ok(withStationOff(s,1,()=>licenseWindows(s,1,"win98")));
 ok(licenseEraGame(s,"turbo-98"));
 near(eraGameVisitorMultiplier(s),1.015);
 const chance=visitorArrivalChance(s,0),rng=s.rng,revenue=s.revenue;
 ok(toggleStationPower(s,1));
 assert.equal(eraGameVisitorMultiplier(s),1);
 assert.ok(visitorArrivalChance(s,0)<chance,"restam PCs sem jogo, mas nao o bonus anunciado");
 ok(toggleStationPower(s,1));
 s.pcWear=[0,100,0];
 assert.equal(eraGameVisitorMultiplier(s),1);
 s.pcWear[1]=0;
 near(eraGameVisitorMultiplier(s),1.015);
 assert.equal(s.rng,rng);assert.equal(s.revenue,revenue);
 assert.deepEqual(s.licensedEraGames,["turbo-98"]);
 assert.ok(isValidSave(s));
 near(eraGameVisitorMultiplier(parseImportedSave(serializeSave(s))),1.015);
});

test("jogo GPU sem PC operacional perde apelo temporariamente, sem perder licenca",()=>{
 const s=createGame(901,"historical");setYear(s,2005);s.cash=50000;
 ok(licenseGames(s));
 ok(withStationOff(s,1,()=>buyPlatform(s,1,"platform05")));
 ok(withStationOff(s,1,()=>buyGpu(s,1,"gpu05")));
 ok(withStationOff(s,1,()=>licenseWindows(s,1,"winxp")));
 ok(licenseGpuGame(s,"neon-rush"));
 near(gpuGameAttraction(s,"neon-rush"),.025);
 s.pcWear[1]=100;
 assert.equal(gpuGameAttraction(s,"neon-rush"),0);
 s.pcWear[1]=0;
 s.repairJobs=[{pc:1,x:3.65,y:1.1,phase:"working",progress:1,duration:24}];
 assert.equal(gpuGameAttraction(s,"neon-rush"),0);
 s.repairJobs=[];
 ok(toggleGpuGameInstallation(s,1,"neon-rush")); // remove
 ok(toggleGpuGameInstallation(s,1,"neon-rush")); // inicia download
 assert.equal(stationReadyForSessions(s,1),false);
 assert.equal(gpuGameAttraction(s,"neon-rush"),0);
 for(let t=0;t<40&&s.gpuGameInstallJobs?.length;t++)tickGpuGameInstallations(s);
 near(gpuGameAttraction(s,"neon-rush"),.025);
 assert.deepEqual(s.licensedGpuGames,["neon-rush"]);
 assert.ok(isValidSave(s));
 near(gpuGameAttraction(parseImportedSave(serializeSave(s)),"neon-rush"),.025);
});
