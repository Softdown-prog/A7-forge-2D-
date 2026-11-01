#!/usr/bin/env node
/** Compare the current branch to a fetched remote base; advisory only. */
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {repositoryRoot,buildIndex,VERSION} from "./catalog.mjs";
import {readBranchComparison,reviewBranch} from "./branch-review.mjs";
const root=repositoryRoot(process.cwd()),args=process.argv.slice(2);
function option(key,fallback=""){const idx=args.indexOf(key);return idx<0?fallback:args[idx+1]??fallback;}
const comparison=readBranchComparison(root,{baseBranch:option("--base-branch","main")});
let index;
try{
 const saved=JSON.parse(fs.readFileSync(path.join(root,"out/lhs-mcp-index/catalog.json"),"utf8"));
 if(saved.schemaVersion===VERSION&&saved.scope==="."&&saved.head===comparison.headSha&&
  Array.isArray(saved.files))index=saved;
}catch{}
if(!index)index=buildIndex(root,{scope:"."});
const report=reviewBranch(index,comparison);
const output=option("--output","");
if(output){
 const target=path.resolve(root,output);
 if(!target.startsWith(root+path.sep))throw Error("Report path must stay within checkout");
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,JSON.stringify(report,null,2)+"\n");
}
console.log(JSON.stringify({kind:"advisory-branch-review",
 head:report.comparison.headSha,base:report.comparison.baseSha,
 ahead:report.comparison.aheadBy,behind:report.comparison.behindBy,
 filesChanged:report.filesChanged,areas:report.areas,
 affected:report.affectedGame.affectedCount,
 suggestedTests:report.affectedGame.suggestedTests.length,
 risk:report.risk,mergeDecision:report.mergeDecision}));
