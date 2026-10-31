import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync,spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {buildIndex} from "./catalog.mjs";
import {tokenize,queryTerms,contextFromSource,searchContext} from "./context-search.mjs";

const scope="games/lan_house_simulator";
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),"lhs-context-"));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8"});
 git("init","-q");git("config","user.email","ci@test.invalid");git("config","user.name","CI");
 const files={
  [scope+"/src/ui/ps2Shop.ts"]:
   "// Compra e instala a bancada do PlayStation2.\nexport function buyPs2Station(): boolean { return true; }\n",
  [scope+"/src/sim/retailQueue.ts"]:
   "// Organiza a fila de clientes para comprar mercadorias.\nexport function processCustomerQueue(): void {}\n",
  [scope+"/src/sim/saveState.ts"]:
   "// Salvar a partida e restaurar a simulação após reiniciar.\nexport function persistSave(): void {}\n",
  [scope+"/src/ui/weather.ts"]:
   "// Atualiza clima e chuva na interface.\nexport function updateWeather(): void {}\n",
  [scope+"/src/ui/secret.ts"]:
   'export const token="sk-test-NEVER-INDEX-THIS-STRING";\n'
 };
 for(const [name,data] of Object.entries(files)){
  fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});
  fs.writeFileSync(path.join(root,name),data);
 }
 git("add",".");git("commit","-qm","fixture");
 return {root,git,files};
}
test("normalizes camelCase, accents and simple bilingual domain terms",()=>{
 assert.deepEqual(tokenize("Compra de persistência SaveState"),
  ["compra","persistencia","save","state"]);
 assert.deepEqual(queryTerms("comprar PS2"),["purchase","ps2"]);
 assert.deepEqual(queryTerms("fila de clientes"),["queue","customer"]);
 assert.throws(()=>queryTerms("e na de um"),/meaningful/);
});
test("ranks by purpose and returns scoped evidence",t=>{
 const {root}=fixture(t),index=buildIndex(root,{scope});
 assert.equal(index.schemaVersion,5);
 const consoles=searchContext(index,"comprar PS2");
 assert.ok(consoles.length>0);
 assert.match(consoles[0].path,/ps2Shop\.ts$/);
 assert.equal(consoles[0].matchedTerms,2);
 assert.ok(consoles[0].evidence.length>=2);
 const queue=searchContext(index,"fila de clientes");
 assert.match(queue[0].path,/retailQueue\.ts$/);
 const saved=searchContext(index,"salvar partida");
 assert.match(saved[0].path,/saveState\.ts$/);
 const scoped=searchContext(index,"comprar",{prefix:scope+"/src/ui"});
 assert.ok(scoped.every(x=>x.path.includes("/src/ui/")));
 assert.deepEqual(searchContext(index,"ps2",{prefix:"nonexistent"}),[]);
});
test("bounded lexical metadata excludes quoted values and raw source",t=>{
 const {root}=fixture(t),index=buildIndex(root,{scope});
 const secret=index.files.find(f=>f.path.endsWith("secret.ts"));
 assert.equal(JSON.stringify(secret).includes("NEVER-INDEX-THIS-STRING"),false);
 assert.ok(Object.keys(secret.contextTerms).length<=300);
 assert.ok(contextFromSource("export function testSomething() {}\n",".ts").terms.test);
});
test("incremental indexing invalidates contextual terms after a dirty edit",t=>{
 const {root,files}=fixture(t),initial=buildIndex(root,{scope});
 const cached=buildIndex(root,{scope,previousIndex:initial});
 assert.equal(cached.buildStats.reused,Object.keys(files).length);
 const ps2=scope+"/src/ui/ps2Shop.ts";
 fs.writeFileSync(path.join(root,ps2),"// Clima chuva tempo\nexport function rainForecast() {}\n");
 const changed=buildIndex(root,{scope,previousIndex:cached});
 assert.equal(changed.buildStats.scanned,1);
 assert.equal(changed.buildStats.reused,Object.keys(files).length-1);
 const stale=searchContext(changed,"comprar ps2").find(x=>x.path===ps2);
 assert.equal(stale?.matchedTerms,2,"PS2Shop filename still contributes both concepts");
 assert.equal(stale?.evidence.find(x=>x.term==="purchase")?.where,"filename",
  "Purchase only matches the unchanged file name, not stale source content");
 assert.equal(changed.files.find(x=>x.path===ps2).contextTerms.purchase,undefined);
 assert.ok(searchContext(changed,"clima").some(x=>x.path===ps2));
});
test("MCP protocol serves contextual search and rejects empty questions",t=>{
 const {root}=fixture(t);
 const server=fileURLToPath(new URL("./server.mjs",import.meta.url));
 const commands=[
  {jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"test",version:"1"}}},
  {jsonrpc:"2.0",id:2,method:"tools/list"},
  {jsonrpc:"2.0",id:3,method:"tools/call",params:{name:"search_context",
   arguments:{query:"onde comprar PS2",limit:3}}},
  {jsonrpc:"2.0",id:4,method:"tools/call",params:{name:"search_context",
   arguments:{query:"",limit:3}}}
 ];
 const proc=spawnSync(process.execPath,[server,"--scope",scope],{
  cwd:root,encoding:"utf8",timeout:15000,input:commands.map(c=>JSON.stringify(c)).join("\n")+"\n"
 });
 assert.equal(proc.status,0,proc.stderr);
 const messages=proc.stdout.trim().split("\n").map(JSON.parse);
 assert.equal(messages[1].result.tools.length,16);
 assert.match(messages[2].result.content[0].text,/ps2Shop/);
 assert.equal(messages[3].result.isError,true);
});
