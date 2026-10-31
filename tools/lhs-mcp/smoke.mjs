#!/usr/bin/env node
/** End-to-end MCP stdio smoke on real checkout. */
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {repositoryRoot} from "./catalog.mjs";
const root=repositoryRoot(process.cwd());
const requests=[
 {jsonrpc:"2.0",id:1,method:"initialize",params:{
  protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"github-actions",version:"1.0"}
 }},
 {jsonrpc:"2.0",method:"notifications/initialized"},
 {jsonrpc:"2.0",id:2,method:"tools/list"},
 {jsonrpc:"2.0",id:3,method:"tools/call",params:{name:"project_status"}},
 {jsonrpc:"2.0",id:4,method:"tools/call",params:{name:"find_files",arguments:{query:"shopCatalogRenderer"}}},
 {jsonrpc:"2.0",id:5,method:"tools/call",params:{name:"find_symbols",arguments:{query:"createGame"}}},
 {jsonrpc:"2.0",id:6,method:"tools/call",params:{name:"search_content",arguments:{query:"ShopCatalogComponent",limit:8}}},
 {jsonrpc:"2.0",id:7,method:"tools/call",params:{name:"impact_analysis",arguments:{path:"games/lan_house_simulator/src/sim/types.ts",depth:3,limit:30}}},
 {jsonrpc:"2.0",id:8,method:"tools/call",params:{name:"search_context",arguments:{query:"comprar PS2",prefix:"games/lan_house_simulator/src",limit:20}}}
];
const proc=spawnSync(process.execPath,[fileURLToPath(new URL("./server.mjs",import.meta.url)),
 "--scope",".","--index","out/lhs-mcp-index/catalog.json"],{
 cwd:root,encoding:"utf8",timeout:45000,
 input:requests.map(x=>JSON.stringify(x)).join("\n")+"\n",
 maxBuffer:8*1024*1024
});
assert.equal(proc.status,0,proc.stderr);
const values=proc.stdout.split("\n").filter(Boolean).map(JSON.parse);
assert.equal(values.length,8);
assert.ok(values[1].result.tools.some(t=>t.name==="edit_file"));
assert.ok(values[2].result.structuredContent.result.files>100);
for(const i of [3,4,5])assert.ok(values[i].result.structuredContent.result.length>0,
 "Expected lookup results: "+i);
assert.ok(values[6].result.structuredContent.result.affected.length>0,"Expected real game impact edges");
assert.ok(values[1].result.tools.some(t=>t.name==="search_context"),"Context tool registered");
assert.ok(values[7].result.structuredContent.result.some(f=>/ps2/i.test(f.path)),
 "Context search must find real PS2 module");
console.log(JSON.stringify({ready:true,head:values[2].result.structuredContent.result.head,
 indexedFiles:values[2].result.structuredContent.result.files,
 tools:values[1].result.tools.length,queries:4}));
