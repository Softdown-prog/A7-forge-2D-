#!/usr/bin/env node
/**
 * Human-curated retrieval checks against REAL tracked LHS modules.
 * Questions are authored independently of file names when practical.
 * Reports honest rankings; no synthetic records or mocked content.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {buildIndex,repositoryRoot} from "./catalog.mjs";
import {searchContext,prepareContextSearch} from "./context-search.mjs";

const prefix="games/lan_house_simulator/src/";
const tasks=[
 {query:"fila de clientes no caixa",target:"sim/retailQueue.ts"},
 {query:"importação exportação salvar partida",target:"sim/saveTransfer.ts"},
 {query:"simulação console PS2",target:"sim/ps2.ts"},
 {query:"calendário de correio e cartas",target:"sim/mailCalendar.ts"},
 {query:"preferência de som e áudio",target:"ui/soundPreferencePort.ts"},
 {query:"painel do clima e horário",target:"ui/timeWeatherPanel.ts"},
 {query:"desenhar cartões do catálogo na loja",target:"ui/shopCatalogRenderer.ts"},
 {query:"economia histórica anual",target:"sim/historicalEconomy.ts"},
 {query:"regras do PS1 em 2002",target:"sim/ps1.ts"},
 {query:"abas da administração",target:"ui/adminAreaTabs.ts"},
 {query:"avisos de correspondência",target:"application/mailNotifications.ts"},
 {query:"controles do console PS1",target:"ui/ps1Controls.ts"}
];
export function evaluate(index){
 const missing=tasks.filter(t=>!index.files.some(f=>f.path===prefix+t.target));
 assert.deepEqual(missing.map(t=>t.target),[],"All ground-truth paths must exist in real source index");
 const t0=performance.now();
 const prepared=prepareContextSearch(index);
 const preparationMs=performance.now()-t0;
 const results=tasks.map(t=>{
  const started=performance.now();
  const candidates=searchContext(index,t.query,{prefix:prefix.slice(0,-1),limit:10});
  const latency=performance.now()-started;
  const ranking=candidates.findIndex(f=>f.path===prefix+t.target)+1;
  return {query:t.query,target:t.target,rank:ranking||null,
   top1:ranking===1,top5:ranking>0&&ranking<=5,top10:ranking>0&&ranking<=10,
   latencyMs:+latency.toFixed(3),
   suggestions:candidates.slice(0,5).map(x=>({path:x.path.slice(prefix.length),score:x.score}))};
 });
 const sorted=results.map(x=>x.latencyMs).sort((a,b)=>a-b);
 const at=n=>sorted[Math.floor((sorted.length-1)*n)];
 return {kind:"real-LHS-context-relevance",commit:index.head,scope:prefix,
  methodology:"12 manually labeled intent queries, real tracked game source, top-k filename ranking",
  contextPreparedFiles:prepared.length,preparationMs:+preparationMs.toFixed(3),
  queries:tasks.length,hitAt1:results.filter(r=>r.top1).length,
  hitAt5:results.filter(r=>r.top5).length,
  hitAt10:results.filter(r=>r.top10).length,
  medianLatencyMs:at(0.5),p95LatencyMs:at(0.95),results};
}
if(process.argv[1]&&path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const root=repositoryRoot(process.cwd());
 const idxPath="out/lhs-mcp-index/catalog.json";
 let index;
 try{
  const saved=JSON.parse(fs.readFileSync(idxPath,"utf8"));
  if(saved.head===undefined||!saved.files?.length)throw Error("Missing actual index data");
  index=saved;
 }catch{
  index=buildIndex(root,{scope:"."});
 }
 const report=evaluate(index);
 assert.ok(report.hitAt5===report.queries,
  "All 12 labeled real modules must appear in top-five search results");
 assert.ok(report.hitAt1>=7,"At least seven labeled modules should rank first");
 const position=process.argv.indexOf("--output");
 if(position!==-1){
  const out=process.argv[position+1];if(!out)throw Error("Missing report path");
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(report,null,2));
 }
 console.log(JSON.stringify({kind:report.kind,commit:report.commit,queries:report.queries,
  top1:report.hitAt1,top5:report.hitAt5,top10:report.hitAt10,
  preparationMs:report.preparationMs,medianLatencyMs:report.medianLatencyMs,
  missed:report.results.filter(r=>!r.top5).map(r=>({target:r.target,rank:r.rank,
   top:r.suggestions.slice(0,2)}))}));
}
