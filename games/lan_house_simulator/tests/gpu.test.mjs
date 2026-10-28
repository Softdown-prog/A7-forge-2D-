import {withStationOff} from "./station-power-fixture.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GPU_CATALOG,buyGpu,installedGpu,gpuBonus} from "../dist/js/sim/gpu.js";
import {hardwareSatisfactionBonus,energyCostPerMinute} from "../dist/js/sim/economy.js";
import {buyComputer} from "../dist/js/sim/shop.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
const year=(s,y)=>{s.totalMinutes=(y-1998)*360*DAY_MINUTES;};
test("interface informa diferença de satisfação e custo integral de troca",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const source=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 const presentation=readFileSync(new URL("../src/ui/gpuCatalogPanel.ts",import.meta.url),"utf8");
 const projection=readFileSync(new URL("../src/application/gpuCatalogPort.ts",import.meta.url),"utf8");
 assert.match(html,/id="gpu-replacement-note"/);
 assert.ok(source.includes("renderGpuCatalogPanel("));
 assert.ok(presentation.includes('setText("gpu-replacement-note"'));
 assert.ok(projection.includes("sem desconto"));
 assert.ok(projection.includes("model.bonus-(current?.bonus??0)"));
 assert.ok(projection.includes("ganho adicional"));
});
test("cinco GPUs distintas e desenhos SVG autênticos do jogo",()=>{
 assert.deepEqual(GPU_CATALOG.map(x=>x.year),[2005,2007,2009,2011,2013]);
 for(const spec of GPU_CATALOG){
  const svg=readFileSync(new URL("../assets/gpu/"+spec.id+".svg",import.meta.url),"utf8");
  assert.match(svg,/<svg /);assert.match(svg,/<path /);assert.match(svg,/<circle /);
  assert.ok(svg.length>3000);
 }
});
test("não compra antes de 2005 ou antecipa o lançamento seguinte",()=>{
 const s=createGame();s.cash=50000;
 assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu05")).ok,false);assert.equal(s.pcGpus[0],null);
 year(s,2005);assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu05")).ok,true);
 assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu07")).ok,false);
 year(s,2007);assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu07")).ok,true);
 assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu05")).ok,false);
});
test("GPU paga apenas pelo PC selecionado e pode ser melhorada",()=>{
 const s=createGame();s.cash=25000;year(s,2013);
 const cash=s.cash;
 assert.equal(withStationOff(s,1,()=>buyGpu(s,1,"gpu13")).ok,true);
 assert.equal(s.cash,cash-2250);assert.equal(s.expenses,2250);
 assert.equal(installedGpu(s,1),"gpu13");assert.equal(installedGpu(s,0),null);
 assert.ok(gpuBonus(s,1)>0);
 assert.ok(hardwareSatisfactionBonus(s,1)>hardwareSatisfactionBonus(s,0));
});
test("energia sobe com GPUs e uma partida salva mantém estado",()=>{
 const s=createGame();s.cash=3000;year(s,2005);
 const before=energyCostPerMinute(s,1);
 assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu05")).ok,true);
 assert.ok(energyCostPerMinute(s,1)>before);
 const loaded=parseImportedSave(serializeSave(s));
 assert.equal(installedGpu(loaded,0),"gpu05");
 const old=createGame();delete old.pcGpus;
 assert.equal(installedGpu(old,0),null);
});
test("índices das GPUs seguem os PCs na expansão",()=>{
 const s=createGame();s.cash=50000;year(s,2005);
 assert.equal(withStationOff(s,2,()=>buyGpu(s,2,"gpu05")).ok,true);
 s.expansionLevel=1;
 assert.equal(buyComputer(s).ok,true);
 assert.equal(installedGpu(s,2),"gpu05");
 assert.equal(installedGpu(s,3),null);
});
