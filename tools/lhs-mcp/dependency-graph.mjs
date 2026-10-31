/**
 * Best-effort static import graph for JS/TS source, independent from the game.
 * An edge means "this file statically imports/re-exports that tracked file".
 * No dependency installation, TypeScript execution, or filesystem traversal.
 */
import path from "node:path";

const jsExts=new Set([".ts",".tsx",".js",".jsx",".mjs",".cjs",".mts",".cts"]);
const extensions=[".ts",".tsx",".mts",".cts",".js",".jsx",".mjs",".cjs",".json"];
const alias={".js":[".ts",".tsx",".js",".jsx"],".mjs":[".mts",".mjs"],".cjs":[".cts",".cjs"]};

export function extractImportSpecifiers(source,extension){
 if(!jsExts.has(extension))return [];
 // Static imports/re-exports, require(), and import() on string literals.
 // Strip line comments to reduce noise; this is not a full syntax parser.
 const clean=source.split(/\r?\n/).filter(line=>!line.trimStart().startsWith("//")).join("\n");
 const patterns=[
  /\b(?:import|export)\s+(?:type\s+)?(?:[^;\n]*?\s+from\s+)?(['"])([^'"\r\n]+)\1/g,
  /\b(?:require|import)\s*\(\s*(['"])([^'"\r\n]+)\1\s*\)/g
 ];
 const found=new Set();
 for(const expression of patterns)for(const match of clean.matchAll(expression))found.add(match[2]);
 return [...found];
}

export function resolveLocalImport(filePath,specifier,knownFiles){
 if(typeof specifier!=="string"||!specifier.startsWith(".")||
   specifier.includes("\0")||specifier.includes("\\")||
   /[?#]/.test(specifier))return null;
 const base=path.posix.normalize(path.posix.join(path.posix.dirname(filePath),specifier));
 if(base===".."||base.startsWith("../")||path.posix.isAbsolute(base))return null;
 const ext=path.posix.extname(base);
 const candidates=ext
  ? [base,...(alias[ext]??[]).map(e=>base.slice(0,-ext.length)+e)]
  : [base,...extensions.map(e=>base+e),
     ...extensions.map(e=>base+"/index"+e)];
 return candidates.find(candidate=>knownFiles.has(candidate))??null;
}
export function resolveImportGraph(files){
 const tracked=new Set(files.map(f=>f.path));
 for(const file of files){
  const references=[],missing=[];
  if(jsExts.has(file.ext))for(const spec of file.imports){
   if(!spec.startsWith("."))continue; // External packages have no local file edge.
   const resolved=resolveLocalImport(file.path,spec,tracked);
   if(resolved)references.push(resolved);
   else missing.push(spec);
  }
  file.dependencies=[...new Set(references)].sort();
  file.unresolvedLocalImports=[...new Set(missing)].sort();
 }
 return files;
}
export function directDependencies(index,target){
 const entry=index.files.find(f=>f.path===target);
 if(!entry)throw Error("File is absent from current index");
 return {path:target,dependencies:entry.dependencies??[],
  unresolvedLocalImports:entry.unresolvedLocalImports??[],
  externalImports:(entry.imports??[]).filter(s=>!s.startsWith("."))};
}
export function directDependents(index,target,{limit=100}={}){
 if(!index.files.some(f=>f.path===target))throw Error("File is absent from current index");
 const max=Math.min(Math.max(Number(limit)||100,1),200);
 return index.files.filter(f=>(f.dependencies??[]).includes(target))
  .map(f=>f.path).sort().slice(0,max);
}
export function impactAnalysis(index,target,{depth=4,limit=100}={}){
 if(!index.files.some(f=>f.path===target))throw Error("File is absent from current index");
 const maxDepth=Math.min(Math.max(Number(depth)||4,1),8);
 const max=Math.min(Math.max(Number(limit)||100,1),200);
 const reverse=new Map();
 for(const f of index.files)for(const dependency of f.dependencies??[]){
  const affected=reverse.get(dependency)??[];
  affected.push(f.path);reverse.set(dependency,affected);
 }
 const discovered=new Set([target]),affected=[],queue=[{path:target,depth:0}];
 for(let head=0;head<queue.length;head++){
  const current=queue[head];
  if(current.depth>=maxDepth)continue;
  for(const dependent of (reverse.get(current.path)??[]).sort()){
   if(discovered.has(dependent))continue;
   discovered.add(dependent);
   const next={path:dependent,depth:current.depth+1,via:current.path};
   affected.push(next);queue.push(next);
   if(affected.length>=max)return {path:target,affected,truncated:true,maxDepth};
  }
 }
 return {path:target,affected,truncated:false,maxDepth};
}
