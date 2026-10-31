#!/usr/bin/env node
/**
 * Synthetic workload benchmark for the real LHS context-search implementation.
 * No repository files are generated or modified. This measures in-memory
 * retrieval (not Git checkout/index throughput or real-world relevance).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {performance} from "node:perf_hooks";
import {fileURLToPath} from "node:url";
import {searchContext,contextFromSource} from "./context-search.mjs";

const cases=[
 {query:"comprar PS2",name:"ps2Shop",symbol:"buyPs2Station",source:"// Compra de bancada PS2 no catálogo de consoles"},
 {query:"fila de clientes",name:"retailQueue",symbol:"processCustomerQueue",source:"// Processa fila de clientes na lan house"},
 {query:"salvar partida",name:"saveState",symbol:"persistSaveState",source:"// Salvar partida com persistência local"},
 {query:"estoque fornecedores",name:"stockSuppliers",symbol:"updateSupplierStock",source:"// Gerencia estoque e fornecedores"},
 {query:"licença de computadores",name:"computerLicenses",symbol:"purchasePcLicense",source:"// Licenças para computadores"},
 {query:"manutenção PS2",name:"ps2Maintenance",symbol:"maintainPs2Station",source:"// Manutenção e desgaste de consoles PS2"},
 {query:"faxineiro limpeza",name:"cleaningStaff",symbol:"scheduleCleaner",source:"// Faxineiro responsável por limpeza"},
 {query:"carteiro correio",name:"mailCourier",symbol:"deliverMail",source:"// Carteiro entrega correio e revistas"},
 {query:"som configurações",name:"audioSettings",symbol:"setSoundPreference",source:"// Configurações de som da partida"},
 {query:"clima chuva",name:"weatherRain",symbol:"updateRainWeather",source:"// Clima e chuva na simulação"},
 {query:"móveis posicionamento",name:"furniturePlacement",symbol:"placeFurniture",source:"// Posicionamento de móveis isométricos"},
 {query:"reputação clientes",name:"customerReputation",symbol:"updateCustomerReputation",source:"// Reputação e satisfação de clientes"}
];
function makeEntry(name,content){
 const ext=".ts",context=contextFromSource(content,ext);
 return {path:name,bytes:content.length,ext,imports:[],dependencies:[],
  symbols:[],contextTerms:context.terms,contextHeadings:context.headings};
}
function syntheticIndex(size){
 const files=[];
 for(let i=0;i<size;i++){
  const basename="module_"+String(i).padStart(5,"0")+".ts";
  const f={
   path:"games/lan_house_simulator/generated/sector_"+Math.floor(i/300)+"/"+basename,
   bytes:125,ext:".ts",imports:[],dependencies:[],
   symbols:[{name:"genericModule"+i,kind:"function",line:2}],
   contextTerms:{simulation:2,module:1,process:1,update:1},
   contextHeadings:[]
  };
  files.push(f);
 }
 for(let i=0;i<cases.length;i++){
  const item=cases[i],at=100+i*1031;
  if(at>=size)throw Error("Fixture position out of range");
  files[at]=makeEntry(
   "games/lan_house_simulator/src/"+(i%2?"sim":"ui")+"/"+item.name+".ts",
   item.source+"\nexport function "+item.symbol+"() {}");
  files[at].symbols=[{name:item.symbol,kind:"function",line:2}];
 }
 return {schemaVersion:5,scope:".",files};
}
function percentiles(a){
 const sorted=[...a].sort((x,y)=>x-y);
 const at=p=>Math.round(sorted[Math.floor((sorted.length-1)*p)]*1000)/1000;
 return {medianMs:at(0.5),p95Ms:at(0.95),maxMs:at(1)};
}
function run(size){
 global.gc?.();
 const before=process.memoryUsage();
 const constructionStart=performance.now(),index=syntheticIndex(size);
 const buildMs=performance.now()-constructionStart;
 const afterBuild=process.memoryUsage();
 // Prime both the JIT and any future memoization without recording warmups.
 for(const c of cases)searchContext(index,c.query,{limit:5});
 const durations=[],misses=[];
 const iterations=3;
 for(let repetition=0;repetition<iterations;repetition++){
  for(const c of cases){
   const t0=performance.now();
   const matches=searchContext(index,c.query,{limit:5});
   durations.push(performance.now()-t0);
   const expected="/"+c.name+".ts";
   const position=matches.findIndex(x=>x.path.endsWith(expected));
   if(position<0||position>=5)misses.push({query:c.query,expected,position,top:matches.map(m=>m.path)});
   assert.equal(matches.length<=5,true);
  }
 }
 const top1=cases.filter(c=>searchContext(index,c.query,{limit:1})[0]?.path.endsWith("/"+c.name+".ts")).length;
 const empty=searchContext(index,"nebulosa artemisia",{limit:5});
 assert.equal(empty.length,0,"Unrelated question should return no result");
 assert.deepEqual(misses,[],"All targeted modules should be in top five");
 const after=process.memoryUsage();
 return {files:size,queries:cases.length,iterations,measuredQueries:durations.length,
  top1,top5:cases.length,top1Rate:top1/cases.length,top5Rate:1,
  queryLatency:percentiles(durations),
  constructionMs:Math.round(buildMs*1000)/1000,
  heapDeltaBuildMiB:Math.round((afterBuild.heapUsed-before.heapUsed)/1048576*100)/100,
  heapPeakObservedMiB:Math.round(after.heapUsed/1048576*100)/100,
  rssPeakObservedMiB:Math.round(after.rss/1048576*100)/100,
  negativeQueryResults:empty.length};
}
const report={kind:"synthetic-index-search-only",node:process.version,
 limitations:"Synthetic indexed metadata; excludes Git file creation, disk scanning and real-world relevance",
 sizes:[10000,15000].map(run)};
assert.ok(report.sizes.every(r=>r.top5Rate===1));
const output=process.argv.indexOf("--output");
if(output!==-1){
 const filename=process.argv[output+1];
 if(!filename)throw Error("Missing --output path");
 const dest=path.resolve(filename);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report));
