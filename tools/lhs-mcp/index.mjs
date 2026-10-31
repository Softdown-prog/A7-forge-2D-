#!/usr/bin/env node
/** Build deterministic index JSON for GitHub Actions artifact or local client. */
import fs from "node:fs";
import path from "node:path";
import {repositoryRoot,buildIndex,listFolder,VERSION} from "./catalog.mjs";
const args=process.argv.slice(2);
const pick=(flag,def)=>{const i=args.indexOf(flag);return i<0?def:args[i+1]??def;};
const root=repositoryRoot(process.cwd());
const scope=pick("--scope",".");
const out=path.resolve(root,pick("--output","out/lhs-mcp-index/catalog.json"));
if(!out.startsWith(root+path.sep))throw Error("Artifact destination must be inside repo");
const previousPath=pick("--previous","");
let previousIndex=null;
if(previousPath){
 try{
  const file=path.resolve(root,previousPath);
  if(file.startsWith(root+path.sep)&&fs.statSync(file).size<=32*1024*1024){
   const candidate=JSON.parse(fs.readFileSync(file,"utf8"));
   if(candidate.schemaVersion===VERSION&&candidate.scope===scope)previousIndex=candidate;
  }
 }catch{}
}
const index=buildIndex(root,{scope,previousIndex});
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(index));
const reverse=new Map();
for(const file of index.files)for(const dependency of file.dependencies??[])
 reverse.set(dependency,(reverse.get(dependency)??0)+1);
const mostReferenced=[...reverse.entries()].map(([file,dependents])=>({file,dependents}))
 .sort((a,b)=>b.dependents-a.dependents||a.file.localeCompare(b.file)).slice(0,30);
const summary={scope,commit:index.head,statistics:index.statistics,
 buildStats:index.buildStats,
 mostReferenced,unresolvedFiles:index.files.filter(f=>f.unresolvedLocalImports?.length)
  .slice(0,30).map(f=>({path:f.path,imports:f.unresolvedLocalImports})),
 directories:listFolder(index,"",200).map(x=>({path:x.path,count:x.descendants}))};
const summaryPath=path.join(path.dirname(out),"summary.json");
fs.writeFileSync(summaryPath,JSON.stringify(summary,null,2));
console.log(JSON.stringify({catalog:out,summary:summaryPath,...summary}));
