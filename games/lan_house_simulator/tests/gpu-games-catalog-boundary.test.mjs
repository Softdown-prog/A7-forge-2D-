import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {GPU_GAME_CATALOG} from "../dist/js/sim/gpuGames.js";
import {gpuGameInstallJob} from "../dist/js/sim/gpuGames.js";
import {recordGpuGameRequest,recordGpuGameSession} from "../dist/js/sim/gpuDemand.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createGpuGamesCatalogPort} from "../dist/js/application/gpuGamesCatalogPort.js";
import {renderGpuGamesCatalog} from "../dist/js/ui/gpuGamesCatalogPanel.js";
const campaign=(year=2005,mode="historical")=>{
 const s=createGame(5002,mode);s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=50000;
 return s;
};
test("1998 e modo clássico mantêm mensagens e não inventam jogos",()=>{
 const s=campaign(1998),port=createGpuGamesCatalogPort(()=>s);
 const original=JSON.stringify(s);
 assert.equal(port.snapshot().note,"Novos jogos que exigem placa de vídeo chegam em 2005.");
 assert.equal(port.snapshot().cards.length,0);
 assert.equal(JSON.stringify(s),original);
 s.economyVersion=1;
 assert.equal(port.snapshot().note,"Os jogos com GPU são um recurso do modo histórico.");
});
test("de 2005 em diante o catálogo contém os mesmos jogos, Windows e GPUs exigidos",()=>{
 const s=campaign(2013),port=createGpuGamesCatalogPort(()=>s),view=port.snapshot();
 assert.equal(view.note,null);
 assert.deepEqual(view.cards.map(x=>x.id),GPU_GAME_CATALOG.map(x=>x.id));
 assert.match(view.cards[0].requirements,/PixelForce 6600/);
 assert.match(view.cards[0].requirements,/Windows XP/i);
 assert.match(view.cards[0].status,/Nenhuma máquina compatível ainda/);
 assert.equal(view.cards[0].buyLabel,"Licenciar · R$ 580");
 assert.equal(view.cards[0].buyDisabled,true);
 assert.match(view.cards[0].buyTitle,/Regularize primeiro/);
});
test("título contratado, procura observada e cobertura financeira são apenas leitura",()=>{
 const s=campaign(2013);s.licensedGames=true;s.licensedGpuGames=["neon-rush"];
 recordGpuGameRequest(s,"neon-rush");
 recordGpuGameSession(s,"neon-rush",true,1.25);
 const before=JSON.stringify(s),view=createGpuGamesCatalogPort(()=>s).snapshot();
 const row=view.cards[0];
 assert.equal(row.buyLabel,"Licenciado");
 assert.equal(row.buyDisabled,true);
 assert.match(row.status,/Licenciado/);
 assert.match(row.demand,/1 pedidos/);
 assert.match(row.demand,/adicional recebido R\$\s?1,25/);
 assert.match(row.coverage,/Não inclui GPU, Windows, energia ou demais despesas; não é lucro/);
 assert.equal(JSON.stringify(s),before);
});
test("download em andamento preserva cronologia, identificadores e progresso inicial",()=>{
 const s=campaign(2013);s.licensedGames=true;s.licensedGpuGames=["neon-rush"];s.gpuGameInstalls=[[],[],[]];
 s.gpuGameInstallJobs=[{pc:2,id:"neon-rush",durationMinutes:18,elapsedMinutes:4}];
 const snapshot=createGpuGamesCatalogPort(()=>s).snapshot();
 assert.deepEqual(snapshot.downloads.map(j=>j.pc),[2]);
 assert.equal(snapshot.downloads[0].heading,"PC 3 · Neon Rush Online");
 assert.equal(snapshot.downloads[0].elapsedMinutes,4);
 assert.equal(gpuGameInstallJob(s,2).id,"neon-rush");
});
test("a porta acompanha o save importado sem capturar o estado antigo",()=>{
 let s=campaign(),old=s,before=JSON.stringify(s);
 const port=createGpuGamesCatalogPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.licensedGames=true;s.licensedGpuGames=["neon-rush"];
 assert.equal(port.snapshot().cards[0].buyLabel,"Licenciado");
 assert.equal(JSON.stringify(old),before);
});
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.textContent="";}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(name,val){this.attrs[name]=val;}
}
test("DOM conserva painel, data-gpu-game-buy e associação de downloads",()=>{
 const s=campaign(2013);s.licensedGames=true;s.licensedGpuGames=["neon-rush"];s.gpuGameInstalls=[[],[],[]];
 s.gpuGameInstallJobs=[{pc:0,id:"neon-rush",durationMinutes:18,elapsedMinutes:2}];
 const view=createGpuGamesCatalogPort(()=>s).snapshot();
 const host={listeners:["click"]},doc={createElement:tag=>new Node(tag)};
 let next;renderGpuGamesCatalog(host,view,doc,(old,created)=>{assert.equal(old,host);next=created;});
 assert.deepEqual(host.listeners,["click"]);
 const overview=next.children[0],job=overview.children[3];
 assert.equal(overview.className,"gpu-download-overview");
 assert.equal(job.children[1].dataset.gpuDownloadStatus,"neon-rush");
 assert.equal(job.children[2].dataset.gpuDownloadProgress,"neon-rush");
 assert.equal(job.children[2].attrs["aria-label"],"Resumo do download no PC 1");
 assert.deepEqual(job.children[3].dataset,{gpuGameCancel:"neon-rush",gpuGamePc:"0"});
 const firstCard=next.children[1],button=firstCard.children[firstCard.children.length-1];
 assert.equal(button.dataset.gpuGameBuy,"neon-rush");
});
test("componentes não importam motor, main conserva controles e atualização incremental",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/gpuGamesCatalogPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/gpuGamesCatalogPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminGpuLicenseSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(main.includes("createGpuGamesCatalogPort(()=>game)"));
 assert.ok(main.includes("renderAdminGpuLicenseSections({"));
 assert.ok(sections.includes("renderGpuGamesCatalog(options.gpuGamePanel,options.gpuGames.snapshot(),options.doc,options.sync)"));
 assert.ok(sections.includes("refreshGpuDownloadMeters(options.gpuGamePanel,"));
 assert.ok(main.includes("installGameLicensingControls("));
});
