import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
const root=resolve(import.meta.dirname,"../dist");
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".wav":"audio/wav",".svg":"image/svg+xml"};
createServer(async(req,res)=>{
  try{
    const u=new URL(req.url??"/","http://localhost");
    const decoded=decodeURIComponent(u.pathname);
    const destination=resolve(root,"."+decoded,(decoded.endsWith("/")?"index.html":""));
    if(destination!==root&&!destination.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
    const info=await stat(destination);
    if(!info.isFile()){res.writeHead(404);res.end();return;}
    const data=await readFile(destination);
    res.writeHead(200,{"content-type":mime[extname(destination)]??"application/octet-stream"});
    res.end(data);
  }catch {res.writeHead(404);res.end("Arquivo não encontrado");}
}).listen(4173,"127.0.0.1",()=>console.log("Lan House Simulator: http://localhost:4173"));
