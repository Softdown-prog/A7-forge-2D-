#!/usr/bin/env node
/** Build deterministic index JSON for GitHub Actions artifact or local client. */
import fs from "node:fs";
import path from "node:path";
import {repositoryRoot,buildIndex,listFolder} from "./catalog.mjs";
const args=process.argv.slice(2);
const pick=(flag,def)=>{const i=args.indexOf(flag);return i<0?def:args[i+1]??def;};
const root=repositoryRoot(process.cwd());
const scope=pick("--scope",".");
const out=path.resolve(root,pick("--output","out/lhs-mcp-index/catalog.json"));
if(!out.startsWith(root+path.sep))throw Error("Artifact destination must be inside repo");
const index=buildIndex(root,{scope});
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index));
const summary={scope,commit:index.head,statistics:index.statistics,
 directories:listFolder(index,"",200).map(x=>({path:x.path,count:x.descendants}))};
const summaryPath=path.join(path.dirname(out),"summary.json");
fs.writeFileSync(summaryPath,JSON.stringify(summary,null,2));
console.log(JSON.stringify({catalog:out,summary:summaryPath,...summary}));
