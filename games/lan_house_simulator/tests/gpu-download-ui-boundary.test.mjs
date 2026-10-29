import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {createGpuDownloadMetersPort} from "../dist/js/application/gpuDownloadMetersPort.js";
import {refreshGpuDownloadMeters} from "../dist/js/ui/gpuDownloadMeters.js";
const fresh=()=>{
 const s=createGame(778,"historical");
 s.internetTier=2;s.totalMinutes=7*360*1440;s.offlineUntil=0;
 return s;
};
test("projeção preserva banda e pausa de downloads sem alterar o save",()=>{
 const s=fresh(),port=createGpuDownloadMetersPort(()=>s);
 assert.equal(port.bandwidth(),"Internet nível 2: até 2 PC(s) transferindo por minuto do jogo. 0 download(s) apto(s) a avançar.");
 assert.equal(port.progress(0,"neon-rush"),null);
 s.gpuGameInstallJobs=[{pc:0,id:"neon-rush",durationMinutes:20,elapsedMinutes:6}];
 s.offlineUntil=s.totalMinutes+10;
 assert.equal(port.progress(0,"neon-rush").label,"PC 1 · 30% · Pausado: sem internet");
 assert.equal(port.progress(0,"neon-rush").minutesElapsed,6);
 assert.equal(port.progress(0,"jogo-incorreto"),null);
 assert.equal(s.gpuGameInstallJobs[0].elapsedMinutes,6);
});
test("ao importar outra partida, a porta abandona o download antigo",()=>{
 let s=fresh();const port=createGpuDownloadMetersPort(()=>s);
 s.gpuGameInstallJobs=[{pc:0,id:"neon-rush",durationMinutes:20,elapsedMinutes:6}];
 const previous=s;
 s=fresh();s.internetTier=3;
 assert.match(port.bandwidth(),/Internet nível 3: até 3 PC/);
 assert.equal(port.progress(0,"neon-rush"),null);
 assert.equal(previous.gpuGameInstallJobs[0].elapsedMinutes,6);
});
test("atualização incremental mantém os nós e ignora aba fechada e identificadores diferentes",()=>{
 const s=fresh(),port=createGpuDownloadMetersPort(()=>s);
 s.gpuGameInstallJobs=[{pc:0,id:"neon-rush",durationMinutes:20,elapsedMinutes:6}];
 s.offlineUntil=s.totalMinutes+10;
 const bandwidth={textContent:"antigo"};
 const label={dataset:{gpuGamePc:"0",gpuDownloadStatus:"neon-rush"},textContent:"antigo"};
 const stale={dataset:{gpuGamePc:"0",gpuDownloadStatus:"outra"},textContent:"preservado"};
 const progress={dataset:{gpuGamePc:"0",gpuDownloadProgress:"neon-rush"},value:0};
 const panel={
  querySelector:()=>bandwidth,
  querySelectorAll:selector=>selector==="[data-gpu-download-status]"?[label,stale]:[progress]
 };
 refreshGpuDownloadMeters(panel,false,port);
 assert.equal(bandwidth.textContent,"antigo");
 refreshGpuDownloadMeters(panel,true,port);
 assert.match(bandwidth.textContent,/Internet nível 2/);
 assert.equal(label.textContent,"PC 1 · 30% · Pausado: sem internet");
 assert.equal(stale.textContent,"preservado");
 assert.equal(progress.value,6);
});
test("fronteira mantém UI independente da simulação e sem recriação do catálogo",()=>{
 const root=new URL("../src/",import.meta.url);
 const ui=readFileSync(new URL("ui/gpuDownloadMeters.ts",root),"utf8");
 const app=readFileSync(new URL("application/gpuDownloadMetersPort.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminGpuLicenseSections.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLProgressElement)\b/);
 assert.doesNotMatch(ui,/\breplaceChildren\(|\binnerHTML\b/);
 assert.match(main,/createGpuDownloadMetersPort\(\(\)=>game\)/);
 assert.match(main,/renderAdminGpuLicenseSections\(\{/);
 assert.match(sections,/refreshGpuDownloadMeters\(options.gpuGamePanel/);
});
