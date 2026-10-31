import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync,spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {buildIndex} from "./catalog.mjs";
import {extractImportSpecifiers,resolveLocalImport,directDependencies,
 directDependents,impactAnalysis} from "./dependency-graph.mjs";

const scope="games/lan_house_simulator";
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"lhs-graph-"));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const git=(...a)=>execFileSync("git",a,{cwd:root,encoding:"utf8"});
 git("init","-q");git("config","user.email","ci@example.test");
 git("config","user.name","CI");
 const files={
  [scope+"/src/sim/types.ts"]:"export type Cash=number;\n",
  [scope+"/src/sim/engine.ts"]:
   'import type {Cash} from "./types.js";\n'+
   'export function stepGame(): number {return 1;}\n',
  [scope+"/src/ui/panel.ts"]:
   'export {stepGame} from "../sim/engine.js";\n'+
   'const lazy=import("../sim/engine.js");\n',
  [scope+"/src/ui/standalone.ts"]:"import xyz from 'some-package';\n"
 };
 for(const [rel,data] of Object.entries(files)){
  fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});
  fs.writeFileSync(path.join(root,rel),data);
 }
 git("add",".");git("commit","-qm","graph test");
 return {root,paths:files};
}
test("resolve TS paths from JS specifiers and find reverse dependents",t=>{
 const {root}=fixture(t),index=buildIndex(root,{scope});
 const types=scope+"/src/sim/types.ts",engine=scope+"/src/sim/engine.ts",panel=scope+"/src/ui/panel.ts";
 assert.equal(index.schemaVersion,4);
 assert.deepEqual(directDependencies(index,engine).dependencies,[types]);
 assert.deepEqual(directDependencies(index,panel).dependencies,[engine]);
 assert.deepEqual(directDependents(index,engine),[panel]);
 assert.deepEqual(directDependents(index,types),[engine]);
 assert.deepEqual(impactAnalysis(index,types,{depth:3}).affected,[
  {path:engine,depth:1,via:types},{path:panel,depth:2,via:engine}
 ]);
 assert.deepEqual(impactAnalysis(index,types,{depth:1}).affected,[
  {path:engine,depth:1,via:types}
 ]);
 assert.equal(directDependencies(index,scope+"/src/ui/standalone.ts").externalImports[0],"some-package");
});
test("import extraction supports static, re-export, require and literal dynamic imports",()=>{
 const value=[
  '// import x from "./ignored.js";',
  'import "./a.js";',
  'export {read} from "./b.js";',
  'const x=require("./c.js");',
  'const y=import("./d.js");',
  'import type {Foo} from "./e.js";'
 ].join("\n");
 assert.deepEqual(extractImportSpecifiers(value,".ts").sort(),
  ["./a.js","./b.js","./c.js","./d.js","./e.js"]);
 const files=new Set(["src/a.ts","src/b/index.ts","src/c.ts"]);
 assert.equal(resolveLocalImport("src/a.ts","./a.js",files),"src/a.ts");
 assert.equal(resolveLocalImport("src/a.ts","./b",files),"src/b/index.ts");
 assert.equal(resolveLocalImport("src/a.ts","../../elsewhere",files),null);
 assert.equal(resolveLocalImport("src/a.ts","not-relative",files),null);
});
test("Graph results are available through JSON-RPC and bounded",t=>{
 const {root}=fixture(t);
 const server=fileURLToPath(new URL("./server.mjs",import.meta.url));
 const requests=[
  {jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"test",version:"1"}}},
  {jsonrpc:"2.0",id:2,method:"tools/list"},
  ...[
   ["file_dependencies",{path:scope+"/src/ui/panel.ts"}],
   ["find_dependents",{path:scope+"/src/sim/engine.ts"}],
   ["impact_analysis",{path:scope+"/src/sim/types.ts",depth:2}]
  ].map(([name,args],i)=>({jsonrpc:"2.0",id:3+i,method:"tools/call",params:{name,arguments:args}}))
 ];
 const proc=spawnSync(process.execPath,[server,"--scope",scope],{
  cwd:root,encoding:"utf8",input:requests.map(x=>JSON.stringify(x)).join("\n")+"\n",timeout:10000
 });
 assert.equal(proc.status,0,proc.stderr);
 const responses=proc.stdout.trim().split("\n").map(JSON.parse);
 assert.equal(responses[1].result.tools.length,16);
 assert.match(responses[2].result.content[0].text,/engine.ts/);
 assert.match(responses[3].result.content[0].text,/panel.ts/);
 assert.equal(responses[4].result.structuredContent.result.affected.length,2);
});
