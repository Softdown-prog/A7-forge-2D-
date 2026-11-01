#!/usr/bin/env node
/** Advisory diff review CLI; never checks out or modifies source files. */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildIndex,repositoryRoot,VERSION} from "./catalog.mjs";
import {readGitDiff,reviewDiff} from "./diff-review.mjs";
const root=repositoryRoot(process.cwd());
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]??fallback;};
const base=option("--base","HEAD^");
const savedPath=path.join(root,"out/lhs-mcp-index/catalog.json");
let index;
try{
 const stored=JSON.parse(fs.readFileSync(savedPath,"utf8"));
 if(stored.schemaVersion===VERSION&&stored.head===
   (await import("node:child_process")).execFileSync("git",["rev-parse","HEAD"],{
    cwd:root,encoding:"utf8"}).trim()&&Array.isArray(stored.files))index=stored;
}catch{}
if(!index)index=buildIndex(root,{scope:"."});
const diff=readGitDiff(root,{base});
const report={comparison:{base:diff.base,head:index.head,scope:"games/lan_house_simulator"},
 ...reviewDiff(index,diff.changes)};
const output=option("--output","");
if(output){
 const target=path.resolve(root,output);
 if(!target.startsWith(root+path.sep))throw Error("Output must stay within repository");
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,JSON.stringify(report,null,2));
}
console.log(JSON.stringify({kind:"advisory-diff-review",base,
 changed:report.changedCount,affected:report.affectedCount,
 tests:report.suggestedTests.length,risk:report.risk,status:report.status}));
