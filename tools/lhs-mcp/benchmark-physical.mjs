#!/usr/bin/env node
/**
 * End-to-end physical Git repository benchmark for the exact MCP indexer.
 * Creates thousands of ordinary .ts files in os.tmpdir(); stages and commits
 * them, then measures full, warm and 1% changed indexing. Never touches the
 * real checkout, game saves, deployed assets or user repositories.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {performance} from "node:perf_hooks";
import {fileURLToPath} from "node:url";
import {buildIndex} from "./catalog.mjs";
import {searchContext} from "./context-search.mjs";

const mib=n=>Math.round(n/1048576*100)/100;
const round=n=>Math.round(n*1000)/1000;
function git(root,...args){
 return execFileSync("git",args,{cwd:root,stdio:["ignore","pipe","pipe"],maxBuffer:64*1024*1024}).toString().trim();
}
function collect(fn){
 const start=performance.now();
 const index=fn();
 return {index,elapsedMs:round(performance.now()-start)};
}
function contentFor(i,revision=0){
 const block=Math.floor(i/250);
 const previous=(i%250===0)?"./shared":"./file_"+String(i-1).padStart(5,"0");
 const tag=i%29===0?"// Compra e manutenção PS2 com fila de clientes":
           i%31===0?"// Salvar partida e inventário de computadores":
             "// Módulo de simulação e gestão da lan house";
 return tag+"\n"+
  'import {baseValue} from "'+previous+'";\n'+
  "export function generated"+i+"(){return baseValue+"+revision+";}\n"+
  "export const value"+i+"="+i+";\n";
}
function stageCommit(root,message){
 git(root,"add","-A");
 git(root,"-c","user.name=MCP Benchmark","-c","user.email=benchmark@example.invalid",
  "commit","-qm",message);
}
function makeRepo(root,size){
 git(root,"init","-q");
 const count=Math.ceil(size/250);
 for(let sector=0;sector<count;sector++){
  const folder=path.join(root,"src","sector_"+String(sector).padStart(3,"0"));
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,"shared.ts"),"export const baseValue=1;\n");
  for(let within=0;within<250;within++){
   const i=sector*250+within;
   if(i>=size-count)break;
   fs.writeFileSync(path.join(folder,"file_"+String(i).padStart(5,"0")+".ts"),contentFor(i));
  }
 }
 // The total number of physically tracked source files is exactly size.
 const existing=Number(git(root,"ls-files").split("\n").filter(Boolean).length);
 assert.equal(existing,0);
 stageCommit(root,"fixture with "+size+" physical files");
 const names=git(root,"ls-files","-z").split("\0").filter(Boolean);
 assert.equal(names.length,size,"Physical Git file count must match requested size");
 return names;
}
function assertEqualIndexes(left,right){
 assert.equal(left.statistics.files,right.statistics.files);
 assert.deepEqual(left.statistics,right.statistics);
 assert.deepEqual(left.files,right.files,"Incremental index must equal fresh full index");
}
export function runPhysicalBenchmark(size){
 if(!Number.isSafeInteger(size)||size<100||size>20000)throw Error("Physical benchmark size must be 100–20000");
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"lhs-mcp-physical-"));
 const report={files:size,kind:"physical-git-files",temporary:true};
 try{
  const generated=collect(()=>makeRepo(root,size));
  report.createCommitMs=generated.elapsedMs;
  global.gc?.();
  const pre=process.memoryUsage();
  const cold=collect(()=>buildIndex(root,{scope:"."}));
  const coldHeap=process.memoryUsage();
  assert.equal(cold.index.statistics.files,size);
  assert.equal(cold.index.buildStats.scanned,size);
  report.coldIndexMs=cold.elapsedMs;
  report.coldHeapDeltaMiB=mib(coldHeap.heapUsed-pre.heapUsed);
  report.coldContextFiles=cold.index.statistics.contextualFiles;
  report.coldSymbols=cold.index.statistics.symbols;
  report.graphEdges=cold.index.statistics.dependencyEdges;

  const warm=collect(()=>buildIndex(root,{scope:".",previousIndex:cold.index}));
  assert.equal(warm.index.buildStats.reused,size);
  assert.equal(warm.index.buildStats.scanned,0);
  assertEqualIndexes(warm.index,cold.index);
  report.warmIndexMs=warm.elapsedMs;

  const names=generated.index.filter(n=>n.endsWith(".ts")&&n.includes("/file_"));
  const count=Math.max(1,Math.floor(size*0.01));
  // 1% changed source files plus small additions/deletions.
  for(let k=0;k<count;k++){
   const relative=names[k*4],number=Number(/file_(\d+)\.ts$/.exec(relative)?.[1]);
   assert.ok(Number.isInteger(number));
   fs.writeFileSync(path.join(root,relative),contentFor(number,1));
  }
  const addedCount=Math.max(1,Math.floor(size*0.002));
  const deletedCount=addedCount;
  for(let k=0;k<deletedCount;k++)fs.unlinkSync(path.join(root,names[count*4+k]));
  for(let k=0;k<addedCount;k++){
   const filename="src/new_releases/added_"+String(k).padStart(5,"0")+".ts";
   fs.mkdirSync(path.dirname(path.join(root,filename)),{recursive:true});
   fs.writeFileSync(path.join(root,filename),
    "// Adiciona um console e atualiza o inventário\nexport const added"+k+"="+k+";\n");
  }
  stageCommit(root,"modify 1 percent, add and delete small batches");
  global.gc?.();
  const incremental=collect(()=>buildIndex(root,{scope:".",previousIndex:warm.index}));
  assert.equal(incremental.index.statistics.files,size);
  assert.equal(incremental.index.buildStats.reused,size-count-deletedCount);
  assert.equal(incremental.index.buildStats.scanned,count+addedCount);
  assert.equal(incremental.index.buildStats.deleted,deletedCount);
  const full=collect(()=>buildIndex(root,{scope:"."}));
  assertEqualIndexes(incremental.index,full.index);
  report.modifiedFiles=count;
  report.addedFiles=addedCount;
  report.deletedFiles=deletedCount;
  report.incrementalIndexMs=incremental.elapsedMs;
  report.freshAfterChangeMs=full.elapsedMs;
  report.reused=incremental.index.buildStats.reused;
  report.scanned=incremental.index.buildStats.scanned;
  report.equivalentToCold=true;
  report.percentSourceRecordsReused=round(report.reused/size*100);
  report.heapUsedEndMiB=mib(process.memoryUsage().heapUsed);
  report.rssEndMiB=mib(process.memoryUsage().rss);
  report.peakRssMiB=mib(process.resourceUsage().maxRSS*1024);

  const q=searchContext(incremental.index,"compra PS2",{limit:5});
  assert.ok(q.length>0,"Real physical source context must be searchable");
  report.contextQueryResultCount=q.length;
  // Timings are observed, not hard performance gates on shared CI hardware.
  return report;
 }finally{
  fs.rmSync(root,{recursive:true,force:true,maxRetries:4,retryDelay:200});
 }
}
export function runAll(sizes){
 if(!Array.isArray(sizes)||!sizes.length||sizes.length>2)throw Error("Provide one or two benchmark sizes");
 const reports=sizes.map(runPhysicalBenchmark);
 return {kind:"physical-git-index-benchmark",node:process.version,
  methodology:"Real tracked TS files in throwaway Git repositories; git add/commit, cold, warm, delta and fresh equality",
  limitations:"Runner-dependent timings; synthetic source, not representative of actual game complexity or production I/O",
  reports};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sizes=(process.argv.find(a=>a.startsWith("--sizes="))??"--sizes=10000,15000")
  .slice("--sizes=".length).split(",").map(Number);
 const report=runAll(sizes);
 const i=process.argv.indexOf("--output");
 if(i!==-1){
  const filename=process.argv[i+1];
  if(!filename)throw Error("Missing --output target");
  const out=path.resolve(filename);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(report,null,2));
 }
 console.log(JSON.stringify(report));
}
