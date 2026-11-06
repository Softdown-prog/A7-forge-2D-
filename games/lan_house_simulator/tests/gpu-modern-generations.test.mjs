import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GPU_CATALOG,buyGpu,installedGpu,gpuBonus} from "../dist/js/sim/gpu.js";
import {validGpuIds} from "../dist/js/sim/gpuCatalog.js";
import {buyPart,buyPlatform,hardwareFor,requiredPsuWatts} from "../dist/js/sim/hardware.js";
import {energyCostPerMinute} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {GPU_GAME_CATALOG,gpuGameCompatible} from "../dist/js/sim/gpuGames.js";
import {createGpuCatalogPort} from "../dist/js/application/gpuCatalogPort.js";
import {withStationOff} from "./station-power-fixture.mjs";
import {parseImportedSave,serializeSave} from "../dist/js/sim/saveTransfer.js";

const year=(s,n)=>{s.totalMinutes=(n-1998)*360*DAY_MINUTES;};
const ready=(at=2030)=>{const s=createGame(1702,"historical");year(s,at);s.cash=100000;return s;};
const accept=r=>assert.equal(r.ok,true,r.message);

test("the five original GPU generations retain their IDs, prices, bonuses and wattage",()=>{
 assert.deepEqual(GPU_CATALOG.slice(0,5).map(({id,cost,bonus,watts})=>({id,cost,bonus,watts})),[
  {id:"gpu05",cost:440,bonus:.035,watts:40},
  {id:"gpu07",cost:790,bonus:.060,watts:75},
  {id:"gpu09",cost:1150,bonus:.085,watts:100},
  {id:"gpu11",cost:1590,bonus:.11,watts:125},
  {id:"gpu13",cost:2250,bonus:.14,watts:150}
 ]);
});
test("2015–2030: eight new GPUs with increasing price, satisfaction, wattage and original SVG art",()=>{
 assert.equal(GPU_CATALOG.length,13);
 assert.deepEqual(GPU_CATALOG.slice(5).map(x=>x.year),[2015,2017,2019,2021,2023,2025,2028,2030]);
 assert.equal(new Set(GPU_CATALOG.map(x=>x.id)).size,GPU_CATALOG.length);
 for(let i=1;i<GPU_CATALOG.length;i++){
  const now=GPU_CATALOG[i],old=GPU_CATALOG[i-1];
  for(const key of ["year","cost","power","bonus","watts"])
   assert.ok(now[key]>old[key],now.id+" must improve "+key);
 }
 for(const spec of GPU_CATALOG.slice(5)){
  const svg=readFileSync(new URL("../assets/gpu/"+spec.id+".svg",import.meta.url),"utf8");
  assert.match(svg,/<svg\s/);
  assert.match(svg,/<path\s/);
  assert.match(svg,/<circle\s/);
  assert.ok(svg.length>3000,"asset too simple: "+spec.id);
  assert.ok(svg.includes(spec.name));
  assert.doesNotMatch(svg,/<(?:image|use|script)\b[^>]*(?:href|src)\s*=\s*["\x27]https?:/i,
   "GPU art must not depend on remote assets");
 }
});
test("a future GPU is rejected before its year, without power or funds",()=>{
 const s=ready(2024);
 accept(withStationOff(s,0,()=>buyPlatform(s,0,"platform24")));
 const before=structuredClone(s);
 assert.equal(withStationOff(s,0,()=>buyGpu(s,0,"gpu25")).ok,false);
 assert.deepEqual(s,before);
 year(s,2025);
 s.pcComponents[0].psu="psu350";
 const needed=requiredPsuWatts(hardwareFor(s,0),"gpu25");
 assert.ok(needed>350);
 const weak=structuredClone(s);
 const result=withStationOff(s,0,()=>buyGpu(s,0,"gpu25"));
 assert.equal(result.ok,false);
 assert.match(result.message,/fonte/);
 assert.deepEqual(s,weak);
 accept(withStationOff(s,0,()=>buyPart(s,0,"psu","psu650")));
 const cash=s.cash,expenses=s.expenses,energy=energyCostPerMinute(s,1);
 accept(withStationOff(s,0,()=>buyGpu(s,0,"gpu25")));
 assert.equal(installedGpu(s,0),"gpu25");
 assert.equal(s.cash,cash-6600);
 assert.equal(s.expenses,expenses+6600);
 assert.equal(gpuBonus(s,0),.23);
 assert.ok(energyCostPerMinute(s,1)>energy);
 assert.equal(isValidSave(s),true);
 assert.equal(parseImportedSave(serializeSave(s)).pcGpus[0],"gpu25");
});
test("modern replacement keeps old saves, never refunds and refuses downgrade",()=>{
 const s=ready(2030);
 accept(withStationOff(s,1,()=>buyGpu(s,1,"gpu13")));
 const legacy=parseImportedSave(serializeSave(s));
 assert.equal(installedGpu(legacy,1),"gpu13");
 const cash=s.cash,spent=s.expenses;
 accept(withStationOff(s,1,()=>buyGpu(s,1,"gpu30")));
 assert.equal(s.cash,cash-9250);
 assert.equal(s.expenses,spent+9250);
 assert.equal(installedGpu(s,1),"gpu30");
 assert.equal(withStationOff(s,1,()=>buyGpu(s,1,"gpu25")).ok,false);
 assert.equal(withStationOff(s,1,()=>buyGpu(s,1,"gpu30")).ok,false);
 assert.equal(installedGpu(parseImportedSave(serializeSave(s)),1),"gpu30");
});
test("GPU catalogue panel lists all 13 and uses the same real PSU quote",()=>{
 const s=ready(2030),port=createGpuCatalogPort(()=>s);
 assert.equal(port.snapshot(0).models.length,13);
 const latest=port.snapshot(0).models.at(-1);
 assert.equal(latest.id,"gpu30");
 assert.match(latest.title,/2030/);
 const needed=requiredPsuWatts(hardwareFor(s,0),"gpu30");
 assert.ok(latest.details.includes("fonte necessária "+needed+" W"));
 assert.equal(latest.locked,false);
 year(s,2025);
 assert.equal(port.snapshot(0).models.at(-1).locked,true);
 assert.equal(port.snapshot(0).models.at(-1).disabled,true);
});
test("2025 GPU still supports previously licensed 2013-era GPU games",()=>{
 const s=ready(2025);
 accept(withStationOff(s,0,()=>buyPlatform(s,0,"platform24")));
 accept(withStationOff(s,0,()=>licenseWindows(s,0,"win11")));
 accept(withStationOff(s,0,()=>buyGpu(s,0,"gpu25")));
 assert.equal(gpuGameCompatible(s,0,GPU_GAME_CATALOG[2]),true);
 assert.equal(isValidSave(s),true);
});
test("unknown GPU IDs in imports are rejected, old saves without GPUs remain valid",()=>{
 const s=ready();
 assert.equal(validGpuIds(undefined),true);
 assert.equal(validGpuIds([null,"gpu05","gpu30"]),true);
 assert.equal(validGpuIds(["gpu99"]),false);
 assert.equal(validGpuIds({gpu:"gpu30"}),false);
 assert.equal(isValidSave({...s,pcGpus:["gpu99"]}),false);
 const legacy=structuredClone(s);delete legacy.pcGpus;
 assert.equal(isValidSave(legacy),true);
});
