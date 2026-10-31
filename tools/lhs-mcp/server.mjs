#!/usr/bin/env node
/** MCP JSON-RPC over stdio: start on demand; GitHub Actions is not a daemon. */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {randomUUID} from "node:crypto";
import {repositoryRoot,buildIndex,searchIndex,searchContent,listFolder,
 validatedPath,digest,MAX_EDIT_BYTES,git} from "./catalog.mjs";
import {directDependencies,directDependents,impactAnalysis} from "./dependency-graph.mjs";

const args=process.argv.slice(2);
function option(name,fallback=""){const i=args.indexOf(name);return i<0?fallback:args[i+1]??fallback;}
const root=repositoryRoot(process.cwd());
const scope=option("--scope","games/lan_house_simulator");
const allowWrite=args.includes("--allow-write");
const indexPath=option("--index");
let index;
function reload(){
 index=buildIndex(root,{scope});
 return index;
}
if(indexPath){
 try{
  const saved=JSON.parse(fs.readFileSync(indexPath,"utf8"));
  // HEAD is insufficient if a developer edited tracked files since checkout.
  // Index artifacts are reusable only on a clean worktree.
  const clean=git(root,["status","--porcelain","--untracked-files=no"]).length===0;
  if(clean&&saved.head===git(root,["rev-parse","HEAD"])&&saved.scope===scope&&
     saved.schemaVersion===2&&Array.isArray(saved.files))index=saved;
 }catch{}
}
if(!index)reload();
const bounded=(value,fallback=50,max=200)=>Math.min(max,Math.max(1,Number(value)||fallback));
function fileContents(p){
 const found=validatedPath(root,scope,p);
 const data=fs.readFileSync(found.absolute);
 if(data.length>MAX_EDIT_BYTES||data.includes(0))throw Error("File is too large or binary");
 return {...found,buffer:data,text:data.toString("utf8"),sha256:digest(data)};
}
function writeAllowed(dryRun){
 if(!allowWrite && dryRun===false)throw Error("Write disabled. Start locally with --allow-write; Actions remain read-only.");
}
function edit(a){
 const {relative,absolute,text,sha256}=fileContents(a.path);
 if(!a.expected_sha256||sha256!==a.expected_sha256)throw Error("Hash mismatch; re-read file before edit");
 if(typeof a.find!=="string"||!a.find.length||a.find.length>100000||typeof a.replace!=="string"||
   a.replace.length>100000)throw Error("Invalid replacement");
 const appearances=text.split(a.find).length-1;
 if(appearances!==1)throw Error("Expected exactly one match, found "+appearances);
 const revised=text.replace(a.find,a.replace);
 if(Buffer.byteLength(revised)>MAX_EDIT_BYTES)throw Error("Modified file exceeds size limit");
 const dryRun=a.dry_run!==false;writeAllowed(dryRun);
 if(!dryRun){atomicWrite(absolute,revised);reload();}
 return {path:relative,changed:revised!==text,dryRun,beforeSha256:sha256,afterSha256:digest(revised),
  preview:revised.slice(Math.max(0,text.indexOf(a.find)-120),text.indexOf(a.find)+a.replace.length+120)};
}
function atomicWrite(filename,content){
 const temp=filename+".lhs-mcp-"+randomUUID();
 const mode=fs.statSync(filename).mode;
 try{fs.writeFileSync(temp,content,{mode});fs.renameSync(temp,filename);}
 finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
function create(a){
 const {relative,absolute}=validatedPath(root,scope,a.path,{newFile:true});
 if(fs.existsSync(absolute))throw Error("File already exists");
 if(typeof a.content!=="string"||Buffer.byteLength(a.content)>MAX_EDIT_BYTES)throw Error("Invalid content");
 const dryRun=a.dry_run!==false;writeAllowed(dryRun);
 if(!dryRun){
  fs.mkdirSync(path.dirname(absolute),{recursive:true});
  fs.writeFileSync(absolute,a.content,{flag:"wx",mode:0o644});
  reload();
 }
 return {path:relative,dryRun,sha256:digest(a.content),bytes:Buffer.byteLength(a.content)};
}
function remove(a){
 const {relative,absolute,sha256}=fileContents(a.path);
 if(a.expected_sha256!==sha256)throw Error("Hash mismatch");
 const dryRun=a.dry_run!==false;writeAllowed(dryRun);
 if(!dryRun){fs.unlinkSync(absolute);reload();}
 return {path:relative,dryRun,sha256};
}
function move(a){
 const from=fileContents(a.path);
 const dest=validatedPath(root,scope,a.destination,{newFile:true});
 if(a.expected_sha256!==from.sha256)throw Error("Hash mismatch");
 if(fs.existsSync(dest.absolute))throw Error("Destination already exists");
 const dryRun=a.dry_run!==false;writeAllowed(dryRun);
 if(!dryRun){
  fs.mkdirSync(path.dirname(dest.absolute),{recursive:true});
  fs.renameSync(from.absolute,dest.absolute);reload();
 }
 return {from:from.relative,to:dest.relative,dryRun,sha256:from.sha256};
}
const properties=(fields)=>({type:"object",additionalProperties:false,properties:fields});
const str=(description)=>({type:"string",description});
const int={type:"integer",minimum:1,maximum:200};
const dry={type:"boolean",description:"Preview by default; use false with --allow-write to apply"};
const tools=[
 {name:"project_status",description:"Indexed project statistics, commit, scope and local working tree.",inputSchema:properties({})},
 {name:"list_directory",description:"List indexed files and folders without recursively dumping the repository.",inputSchema:properties({prefix:str("Relative folder"),limit:int})},
 {name:"find_files",description:"Rank filenames and paths by search keywords.",inputSchema:{...properties({query:str("Filename or keywords"),prefix:str("Optional folder prefix"),limit:int}),required:["query"]}},
 {name:"find_symbols",description:"Locate declarations across TypeScript, JavaScript, Go, Rust and Python.",inputSchema:{...properties({query:str("Function/class/type name"),prefix:str("Optional folder prefix"),limit:int}),required:["query"]}},
 {name:"search_content",description:"Search code text with line numbers, results limited.",inputSchema:{...properties({query:str("Literal code substring"),prefix:str("Folder prefix"),limit:int,caseSensitive:{type:"boolean"}}),required:["query"]}},
 {name:"file_info",description:"File digest, size, symbol declarations and imports.",inputSchema:{...properties({path:str("Repo-relative path")}),required:["path"]}},
 {name:"read_file",description:"Read a bounded line range with SHA256 for safe later edits.",inputSchema:{...properties({path:str("Repo-relative path"),start_line:int,line_count:int}),required:["path"]}},
 {name:"file_dependencies",description:"List resolved local imports and unresolved paths for a tracked file.",inputSchema:{...properties({path:str("Repo-relative path")}),required:["path"]}},
 {name:"find_dependents",description:"Find source files which directly import a tracked file.",inputSchema:{...properties({path:str("Repo-relative path"),limit:int}),required:["path"]}},
 {name:"impact_analysis",description:"Follow reverse static imports to locate possibly affected files before editing.",inputSchema:{...properties({path:str("Repo-relative path"),depth:{type:"integer",minimum:1,maximum:8},limit:int}),required:["path"]}},
 {name:"refresh_index",description:"Rebuild index from the currently checked out Git files.",inputSchema:properties({})},
 {name:"edit_file",description:"Exact one-occurrence replacement with SHA256 optimistic lock; dry run default.",inputSchema:{...properties({path:str("Repo-relative file"),expected_sha256:str("From read_file"),find:str("Unique exact text"),replace:str("Replacement text"),dry_run:dry}),required:["path","expected_sha256","find","replace"]}},
 {name:"create_file",description:"Create a new file within the selected scope; dry run default.",inputSchema:{...properties({path:str("New repo-relative path"),content:str("New file contents"),dry_run:dry}),required:["path","content"]}},
 {name:"move_file",description:"Move a file with expected SHA256 and no overwrite; dry run default.",inputSchema:{...properties({path:str("Source path"),destination:str("Destination path"),expected_sha256:str("From read_file"),dry_run:dry}),required:["path","destination","expected_sha256"]}},
 {name:"delete_file",description:"Delete an existing file with expected SHA256; dry run default.",inputSchema:{...properties({path:str("Repo-relative file"),expected_sha256:str("From read_file"),dry_run:dry}),required:["path","expected_sha256"]}}
];
function call(name,a={}){
 if(!a||typeof a!=="object"||Array.isArray(a))throw Error("Arguments must be an object");
 switch(name){
  case "project_status":return {scope,head:index.head,...index.statistics,
   writable:allowWrite,changes:git(root,["status","--short","--untracked-files=no"]).split("\n").filter(Boolean).slice(0,80)};
  case "list_directory":return listFolder(index,a.prefix??"",a.limit);
  case "find_files":return searchIndex(index,a.query,{prefix:a.prefix,limit:a.limit,mode:"files"});
  case "find_symbols":return searchIndex(index,a.query,{prefix:a.prefix,limit:a.limit,mode:"symbols"});
  case "search_content":return searchContent(root,index,a.query,{prefix:a.prefix,limit:a.limit,caseSensitive:a.caseSensitive});
  case "file_info":{
   const f=fileContents(a.path);const entry=index.files.find(x=>x.path===f.relative);
   return {path:f.relative,bytes:f.buffer.length,sha256:f.sha256,symbols:entry?.symbols??[],imports:entry?.imports??[]};
  }
  case "read_file":{
   const f=fileContents(a.path),lines=f.text.split(/\r?\n/);
   const start=bounded(a.start_line,1,Math.max(1,lines.length));
   const count=bounded(a.line_count,100,250);
   return {path:f.relative,sha256:f.sha256,totalLines:lines.length,from:start,
    lines:lines.slice(start-1,start-1+count).map((text,i)=>({line:start+i,text}))};
  }
  case "file_dependencies":return directDependencies(index,validatedPath(root,scope,a.path).relative);
  case "find_dependents":return directDependents(index,validatedPath(root,scope,a.path).relative,{limit:a.limit});
  case "impact_analysis":return impactAnalysis(index,validatedPath(root,scope,a.path).relative,{depth:a.depth,limit:a.limit});
  case "refresh_index":return reload().statistics;
  case "edit_file":return edit(a);
  case "create_file":return create(a);
  case "move_file":return move(a);
  case "delete_file":return remove(a);
  default:throw Error("Unknown tool: "+name);
 }
}
function respond(message){
 process.stdout.write(JSON.stringify(message)+"\n");
}
async function handle(message){
 if(!message||message.jsonrpc!=="2.0"||typeof message.method!=="string")
  return {jsonrpc:"2.0",id:message?.id??null,error:{code:-32600,message:"Invalid request"}};
 if(!Object.hasOwn(message,"id"))return null;
 const id=message.id;
 try{
  if(message.method==="initialize")return {jsonrpc:"2.0",id,
   result:{protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},
    serverInfo:{name:"lhs-repository-mcp",version:"0.1.0"}}};
  if(message.method==="ping")return {jsonrpc:"2.0",id,result:{}};
  if(message.method==="tools/list")return {jsonrpc:"2.0",id,result:{tools}};
  if(message.method==="tools/call"){
   const name=message.params?.name;
   if(!tools.some(t=>t.name===name))return {jsonrpc:"2.0",id,error:{code:-32602,message:"Unknown tool"}};
   try{
    const value=call(name,message.params?.arguments??{});
    return {jsonrpc:"2.0",id,result:{content:[{type:"text",text:JSON.stringify(value)}],
     structuredContent:{result:value},isError:false}};
   }catch(error){
    return {jsonrpc:"2.0",id,result:{content:[{type:"text",text:String(error.message??error)}],isError:true}};
   }
  }
  return {jsonrpc:"2.0",id,error:{code:-32601,message:"Method not found"}};
 }catch(error){return {jsonrpc:"2.0",id,error:{code:-32603,message:String(error.message??error)}};}
}
const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of input){
 if(line.length>1024*1024){respond({jsonrpc:"2.0",id:null,error:{code:-32700,message:"Message too large"}});continue;}
 try{const message=JSON.parse(line);const response=await handle(message);if(response)respond(response);}
 catch{respond({jsonrpc:"2.0",id:null,error:{code:-32700,message:"Parse error"}});}
}
