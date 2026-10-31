/**
 * LHS MCP file catalog. No npm dependencies, no runtime game imports.
 * Index tracked source files; reject filesystem escapes and symlinks.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";

const MAX_INDEXED_BYTES=256*1024;
export const MAX_EDIT_BYTES=1024*1024;
export const VERSION=1;
const ignoreDirectories=new Set([".git","node_modules","dist","out",".angular-browser-tools",".next","coverage","build",".cache"]);
const secretNames=/^(?:\.env(?:\..*)?|\.npmrc|\.pypirc|id_rsa|id_ed25519|credentials(?:\..*)?|.*\.(?:pem|key|p12|pfx))$/i;
const textExt=new Set([".ts",".tsx",".js",".mjs",".cjs",".jsx",".json",".jsonc",".css",".scss",".html",".md",".mdx",".txt",".yaml",".yml",".xml",".svg",".go",".rs",".py",".toml",".sh",".sql",".gitignore"]);
const symbolExt=new Set([".ts",".tsx",".js",".mjs",".cjs",".jsx",".go",".rs",".py"]);
export const digest=buf=>createHash("sha256").update(buf).digest("hex");
export function git(root,args){return execFileSync("git",args,{cwd:root,encoding:"utf8",maxBuffer:64*1024*1024}).trim();}
export function repositoryRoot(start){
 return fs.realpathSync(git(start,["rev-parse","--show-toplevel"]));
}
function isExcluded(rel){
 const parts=rel.split("/");
 return parts.some(segment=>ignoreDirectories.has(segment)) || secretNames.test(parts.at(-1)??"");
}
function inScope(rel,scope){return scope==="."||rel===scope||rel.startsWith(scope+"/");}
export function validatedPath(root,scope,input,{newFile=false}={}){
 if(typeof input!=="string"||!input||input.includes("\0")||input.includes("\\")||
    input.startsWith("/")||/^[A-Za-z]:/.test(input))throw Error("Invalid relative path");
 const rel=path.posix.normalize(input);
 if(rel==="."||rel===".."||rel.startsWith("../")||rel.startsWith("/")||isExcluded(rel)||
    !inScope(rel,scope))throw Error("Path outside MCP scope or excluded");
 const base=fs.realpathSync(root);
 const absolute=path.resolve(base,rel);
 if(!absolute.startsWith(base+path.sep))throw Error("Path escapes repository");
 // Check every existing ancestor; do not follow symlinks even inside repo.
 let cur=base;
 for(const part of rel.split("/")){
  cur=path.join(cur,part);
  if(fs.existsSync(cur)&&fs.lstatSync(cur).isSymbolicLink())throw Error("Symlink not allowed");
 }
 if(!newFile && !fs.statSync(absolute).isFile())throw Error("Not a regular file");
 return {relative:rel,absolute};
}
function tracked(root){
 return execFileSync("git",["ls-files","-z","--cached","--full-name"],{
  cwd:root,encoding:"utf8",maxBuffer:64*1024*1024
 }).split("\0").filter(Boolean).sort();
}
export function extractSymbols(content,ext){
 if(!symbolExt.has(ext))return [];
 const patterns=[
  {kind:"class",re:/^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/},
  {kind:"interface",re:/^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/},
  {kind:"type",re:/^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*[=<{]/},
  {kind:"function",re:/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/},
  {kind:"constant",re:/^\s*export\s+(?:const|let)\s+([A-Za-z_$][\w$]*)\s*[=:]/},
  {kind:"method",re:/^\s*(?:export\s+)?(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_][\w]*)\s*[(<]/},
  {kind:"function",re:/^\s*func\s+(?:\([^)]*\)\s+)?([A-Za-z_][\w]*)\s*\(/},
  {kind:"function",re:/^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)\s*\(/},
 ];
 const result=[];
 const lines=content.split(/\r?\n/);
 for(let n=0;n<lines.length;n++){
  const line=lines[n];
  if(line.length>1500)continue;
  for(const p of patterns){const match=p.re.exec(line);if(match){result.push({name:match[1],kind:p.kind,line:n+1});break;}}
 }
 return result.slice(0,1500);
}
export function buildIndex(root,{scope="."}={}){
 root=fs.realpathSync(root);
 if(scope!=="." )validatedPath(root,".",scope+"/.probe",{newFile:true});
 const list=tracked(root).filter(rel=>inScope(rel,scope)&&!isExcluded(rel));
 const files=[];
 for(const rel of list){
  let stat,absolute;
  try{
   ({absolute}=validatedPath(root,scope,rel));
   stat=fs.statSync(absolute);
  }catch{continue;}
  if(!stat.isFile())continue;
  const ext=path.posix.extname(rel).toLowerCase();
  const record={path:rel,bytes:stat.size,ext,symbols:[],imports:[]};
  if(stat.size<=MAX_INDEXED_BYTES && (textExt.has(ext)||path.basename(rel)==="Dockerfile")){
   try{
    const buf=fs.readFileSync(absolute);
    if(!buf.includes(0)){
     const contents=buf.toString("utf8");
     record.symbols=extractSymbols(contents,ext);
     const re=/(?:import\s+(?:type\s+)?(?:[^;\n]*?\s+from\s+)?|require\s*\(|\bfrom\s+)['"]([^'"\r\n]+)['"]/g;
     record.imports=Array.from(contents.matchAll(re)).slice(0,120).map(m=>m[1]);
    }
   }catch{}
  }
  files.push(record);
 }
 return {
  schemaVersion:VERSION,scope,head:git(root,["rev-parse","HEAD"]),
  files,statistics:{files:files.length,symbols:files.reduce((n,f)=>n+f.symbols.length,0),
    totalBytes:files.reduce((n,f)=>n+f.bytes,0)}
 };
}
export function searchIndex(index,query,{prefix="",limit=30,mode="files"}={}){
 const q=String(query??"").trim().toLowerCase();
 if(!q)throw Error("Query required");
 const tokens=q.split(/\s+/);
 const max=Math.min(Math.max(Number(limit)||30,1),100);
 let matched=[];
 for(const entry of index.files){
  if(prefix&&!entry.path.startsWith(prefix))continue;
  const file=entry.path.toLowerCase(),base=path.posix.basename(file);
  if(mode!=="symbols"){
   const score=tokens.reduce((value,term)=>value+(base===term?100:base.includes(term)?40:file.includes(term)?12:0),0);
   if(score>0)matched.push({path:entry.path,score,bytes:entry.bytes,kind:"file"});
  }
  if(mode!=="files")for(const s of entry.symbols){
   const name=s.name.toLowerCase();
   const score=tokens.reduce((value,term)=>value+(name===term?130:name.includes(term)?65:0),0);
   if(score>0)matched.push({path:entry.path,score,symbol:s.name,line:s.line,kind:s.kind});
  }
 }
 return matched.sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path)).slice(0,max);
}
export function listFolder(index,prefix="",limit=100){
 const normalized=prefix.replace(/\/$/,"");
 const parts=new Map();
 for(const file of index.files){
  if(normalized && !(file.path===normalized||file.path.startsWith(normalized+"/")))continue;
  const rest=normalized?file.path.slice(normalized.length+1):file.path;
  const segment=rest.split("/")[0];
  if(!segment)continue;
  const child=(normalized?normalized+"/":"")+segment;
  const item=parts.get(child)??{path:child,type:rest.includes("/")?"directory":"file",descendants:0};
  item.descendants++;if(rest.includes("/"))item.type="directory";
  parts.set(child,item);
 }
 return Array.from(parts.values()).sort((a,b)=>a.type.localeCompare(b.type)||a.path.localeCompare(b.path))
  .slice(0,Math.min(200,Math.max(1,Number(limit)||100)));
}
export function searchContent(root,index,query,{prefix="",limit=30,caseSensitive=false}={}){
 if(typeof query!=="string"||query.length<2||query.length>150)throw Error("Query must have 2–150 characters");
 const results=[],needle=caseSensitive?query:query.toLowerCase();
 const max=Math.min(80,Math.max(1,Number(limit)||30));
 for(const entry of index.files){
  if(results.length>=max)break;
  if(prefix&&!entry.path.startsWith(prefix))continue;
  if(entry.bytes>MAX_INDEXED_BYTES||!textExt.has(entry.ext))continue;
  try{
   const {absolute}=validatedPath(root,index.scope,entry.path);
   const content=fs.readFileSync(absolute,"utf8");
   for(const [pos,line] of content.split(/\r?\n/).entries()){
    if((caseSensitive?line:line.toLowerCase()).includes(needle)){
     results.push({path:entry.path,line:pos+1,text:line.trim().slice(0,260)});
     if(results.length>=max)break;
    }
   }
  }catch{}
 }
 return results;
}
