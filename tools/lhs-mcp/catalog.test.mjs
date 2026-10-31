import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync,spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {repositoryRoot,buildIndex,searchIndex,listFolder,searchContent,digest,
 validatedPath,extractSymbols} from "./catalog.mjs";

const serverFile=fileURLToPath(new URL("./server.mjs",import.meta.url));
const indexFile=fileURLToPath(new URL("./index.mjs",import.meta.url));
function setup(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"lhs-mcp-test-"));
 const exec=(...args)=>execFileSync("git",args,{cwd:dir,encoding:"utf8"});
 exec("init","-q");exec("config","user.email","ci@localhost");exec("config","user.name","CI");
 const dirGame="games/lan_house_simulator/src/sim";
 fs.mkdirSync(path.join(dir,dirGame),{recursive:true});
 fs.writeFileSync(path.join(dir,dirGame,"engine.ts"),
  'export function stepGame() { return "running"; }\nexport interface GameState {cash:number}\n');
 fs.writeFileSync(path.join(dir,dirGame,"types.ts"),"export type Cash=number;\n");
 fs.writeFileSync(path.join(dir,"README.md"),"Other project root file\n");
 exec("add",".");exec("commit","-qm","test fixture");
 return {dir,exec};
}
function call(dir,messages,flags=["--scope","games/lan_house_simulator"]){
 const proc=spawnSync(process.execPath,[serverFile,...flags],{
  cwd:dir,encoding:"utf8",input:messages.map(m=>JSON.stringify(m)).join("\n")+"\n",
  maxBuffer:2*1024*1024,timeout:10000
 });
 assert.equal(proc.status,0,proc.stderr);
 assert.equal(proc.stderr,"");
 return proc.stdout.split("\n").filter(Boolean).map(x=>JSON.parse(x));
}
const req=(id,name,args={})=>({jsonrpc:"2.0",id,method:"tools/call",params:{name,arguments:args}});

test("scoped deterministic index, symbols, folders and content",t=>{
 const {dir}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 assert.equal(repositoryRoot(dir),fs.realpathSync(dir));
 const i=buildIndex(dir,{scope:"games/lan_house_simulator"});
 assert.equal(i.statistics.files,2);
 assert.ok(i.statistics.symbols>=3);
 assert.equal(i.files.some(f=>f.path==="README.md"),false);
 assert.match(JSON.stringify(searchIndex(i,"stepGame",{mode:"symbols"})),/stepGame/);
 assert.match(JSON.stringify(searchIndex(i,"engine",{mode:"files"})),/engine.ts/);
 assert.match(JSON.stringify(listFolder(i,"games/lan_house_simulator/src/sim")),/types.ts/);
 assert.match(JSON.stringify(searchContent(dir,i,"return")),/running/);
 assert.deepEqual(extractSymbols("fn simulate(x: u8) {}\nfunc Serve() {}\ndef parser():\n pass\n",".rs")
  .map(x=>x.name),["simulate","Serve","parser"]);
});
test("reject escapes, secrets, symlinks and wrong scope",t=>{
 const {dir}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const bad of ["../README.md","/etc/passwd","README.md","games/lan_house_simulator/../../README.md",
  "games/lan_house_simulator/.env","games/lan_house_simulator/.npmrc"]){
  assert.throws(()=>validatedPath(dir,"games/lan_house_simulator",bad,{newFile:true}));
 }
 fs.symlinkSync(path.join(dir,"README.md"),path.join(dir,"games/lan_house_simulator/link.md"));
 assert.throws(()=>validatedPath(dir,"games/lan_house_simulator","games/lan_house_simulator/link.md"));
});
test("MCP JSON-RPC handshake, search, read and readonly edit denial",t=>{
 const {dir}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const filepath="games/lan_house_simulator/src/sim/engine.ts";
 const source=fs.readFileSync(path.join(dir,filepath));
 const response=call(dir,[
  {jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"test",version:"1"}}},
  {jsonrpc:"2.0",method:"notifications/initialized"},
  {jsonrpc:"2.0",id:2,method:"tools/list"},
  req(3,"find_symbols",{query:"stepGame"}),
  req(4,"read_file",{path:filepath,line_count:2}),
  req(5,"edit_file",{path:filepath,expected_sha256:digest(source),find:"running",replace:"paused",dry_run:false}),
  {jsonrpc:"2.0",id:6,method:"made/up"}
 ]);
 assert.equal(response.length,6);
 assert.equal(response[0].result.protocolVersion,"2025-06-18");
 assert.ok(response[1].result.tools.length>=10);
 assert.match(response[2].result.content[0].text,/stepGame/);
 assert.equal(response[3].result.structuredContent.result.sha256,digest(source));
 assert.equal(response[4].result.isError,true);
 assert.equal(response[5].error.code,-32601);
 assert.equal(fs.readFileSync(path.join(dir,filepath),"utf8").includes("running"),true);
});
test("MCP write mode requires hashes and defaults to previews",t=>{
 const {dir}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const f="games/lan_house_simulator/src/sim/engine.ts";
 const data=fs.readFileSync(path.join(dir,f),"utf8"),sha=digest(data);
 const dest="games/lan_house_simulator/src/sim/new.ts";
 const messages=[
  req(1,"edit_file",{path:f,expected_sha256:sha,find:"running",replace:"paused"}),
  req(2,"edit_file",{path:f,expected_sha256:"bad",find:"running",replace:"paused",dry_run:false}),
  req(3,"edit_file",{path:f,expected_sha256:sha,find:"running",replace:"paused",dry_run:false}),
  req(4,"create_file",{path:dest,content:"export const n=1;"}),
  req(5,"create_file",{path:dest,content:"export const n=1;",dry_run:false}),
  req(6,"move_file",{path:dest,destination:"games/lan_house_simulator/src/sim/moved.ts",
    expected_sha256:digest("export const n=1;"),dry_run:false}),
  req(7,"delete_file",{path:"games/lan_house_simulator/src/sim/moved.ts",
    expected_sha256:digest("export const n=1;"),dry_run:false})
 ];
 const r=call(dir,messages,["--scope","games/lan_house_simulator","--allow-write"]);
 assert.equal(r[0].result.structuredContent.result.dryRun,true);
 assert.equal(r[1].result.isError,true);
 for(const i of [2,4,5,6])assert.equal(r[i].result.isError,false,JSON.stringify(r[i]));
 assert.match(fs.readFileSync(path.join(dir,f),"utf8"),/paused/);
 assert.equal(fs.existsSync(path.join(dir,"games/lan_house_simulator/src/sim/moved.ts")),false);
});
test("index builder emits auditable JSON without changing sources",t=>{
 const {dir}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const proc=spawnSync(process.execPath,[indexFile,"--scope","games/lan_house_simulator","--output","out/lhs-mcp-index/catalog.json"],{
  cwd:dir,encoding:"utf8",timeout:10000
 });
 assert.equal(proc.status,0,proc.stderr);
 const index=JSON.parse(fs.readFileSync(path.join(dir,"out/lhs-mcp-index/catalog.json"),"utf8"));
 assert.equal(index.statistics.files,2);
 assert.equal(index.scope,"games/lan_house_simulator");
 assert.ok(fs.existsSync(path.join(dir,"out/lhs-mcp-index/summary.json")));
});


test("dangling symlinks are denied for both read and file creation",t=>{
 const {dir}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const bad="games/lan_house_simulator/broken.ts";
 fs.symlinkSync(path.join(dir,"missing.ts"),path.join(dir,bad));
 assert.throws(()=>validatedPath(dir,"games/lan_house_simulator",bad,{newFile:true}),
  /Symlink not allowed/);
});
test("cached index is invalidated when tracked worktree files change",t=>{
 const {dir,exec}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const local="games/lan_house_simulator/src/sim/engine.ts";
 const artifact="out/lhs-mcp-index/catalog.json";
 const indexed=spawnSync(process.execPath,[indexFile,"--scope","games/lan_house_simulator","--output",artifact],{
  cwd:dir,encoding:"utf8",timeout:10000
 });
 assert.equal(indexed.status,0,indexed.stderr);
 fs.writeFileSync(path.join(dir,local),'export function revisedEngine() {return 7;}\n');
 const replies=call(dir,[
  req(1,"find_symbols",{query:"revisedEngine"}),
  req(2,"find_symbols",{query:"stepGame"})
 ],["--scope","games/lan_house_simulator","--index",artifact]);
 assert.match(replies[0].result.content[0].text,/revisedEngine/);
 assert.equal(replies[1].result.structuredContent.result.length,0);
});

test("incremental index reuses clean content, rescans dirty, added, staged and deleted",t=>{
 const {dir,exec}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const scope="games/lan_house_simulator",engine=scope+"/src/sim/engine.ts";
 const types=scope+"/src/sim/types.ts";
 const first=buildIndex(dir,{scope});
 assert.equal(first.buildStats.scanned,2);
 assert.equal(first.buildStats.reused,0);
 const second=buildIndex(dir,{scope,previousIndex:first});
 assert.equal(second.buildStats.reused,2);
 assert.equal(second.buildStats.scanned,0);
 assert.equal(second.files.find(f=>f.path===engine).blobOid,first.files.find(f=>f.path===engine).blobOid);
 fs.writeFileSync(path.join(dir,engine),'export function updatedEngine() {return 42;}\n');
 const dirty=buildIndex(dir,{scope,previousIndex:second});
 assert.equal(dirty.buildStats.scanned,1);
 assert.equal(dirty.buildStats.reused,1);
 assert.match(JSON.stringify(searchIndex(dirty,"updatedEngine",{mode:"symbols"})),/updatedEngine/);
 exec("add",engine);exec("commit","-qm","modify engine");
 const staged=buildIndex(dir,{scope,previousIndex:second});
 assert.equal(staged.buildStats.scanned,1);
 assert.equal(staged.buildStats.reused,1);
 const add=scope+"/src/sim/added.ts";
 fs.writeFileSync(path.join(dir,add),'import type {Cash} from "./types.js";\nexport const newValue=1;\n');
 exec("add",add);
 const increased=buildIndex(dir,{scope,previousIndex:staged});
 assert.equal(increased.buildStats.scanned,1);
 assert.equal(increased.buildStats.reused,2);
 assert.ok(increased.files.find(f=>f.path===add).dependencies.includes(types));
 exec("rm",types);
 const removed=buildIndex(dir,{scope,previousIndex:increased});
 assert.equal(removed.buildStats.deleted,1);
 assert.equal(removed.statistics.files,2);
 assert.equal(removed.files.find(f=>f.path===add).dependencies.length,0);
 assert.ok(removed.files.find(f=>f.path===add).unresolvedLocalImports.length);
});
test("index CLI --previous produces same results with reuse and ignores invalid cache",t=>{
 const {dir}=setup();t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const output="out/lhs-mcp-index/catalog.json";
 const invoke=(previous)=>spawnSync(process.execPath,[indexFile,"--scope","games/lan_house_simulator",
  "--output",output,...(previous?["--previous",previous]:[])],{
  cwd:dir,encoding:"utf8",timeout:10000
 });
 assert.equal(invoke(null).status,0);
 const first=JSON.parse(fs.readFileSync(path.join(dir,output),"utf8"));
 assert.equal(first.schemaVersion,4);
 assert.equal(invoke(output).status,0);
 const second=JSON.parse(fs.readFileSync(path.join(dir,output),"utf8"));
 assert.equal(second.buildStats.reused,2);
 assert.equal(second.buildStats.scanned,0);
 assert.deepEqual(second.files,first.files);
 assert.equal(invoke("out/missing.json").status,0);
 const third=JSON.parse(fs.readFileSync(path.join(dir,output),"utf8"));
 assert.equal(third.buildStats.scanned,2);
});
