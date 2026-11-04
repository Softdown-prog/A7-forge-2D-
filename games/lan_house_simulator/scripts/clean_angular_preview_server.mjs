/** Local Cloudflare Pages approximation for QA; never binds a public interface. */
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
export async function startCleanAngularPreview(){
 const root=resolve(import.meta.dirname,'../out/site-clean-angular');
 const rules=[];let current;
 for(const line of (await readFile(resolve(root,'_headers'),'utf8')).split('\n')){
  if(line.startsWith('/')){current={pattern:line,headers:{}};rules.push(current);}
  else if(current&&/^\s+[^:]+:/.test(line)){
   const match=line.trim().match(/^([^:]+):\s*(.*)$/);
   current.headers[match[1]]=match[2];
  }
 }
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml',
  '.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.ico':'image/x-icon'};
 const server=createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
   const headers={};
   for(const rule of rules)if(rule.pattern===pathname||
    (rule.pattern.endsWith('*')&&pathname.startsWith(rule.pattern.slice(0,-1))))Object.assign(headers,rule.headers);
   if(pathname==='/favicon.ico'){res.writeHead(204,headers).end();return;}
   let file=resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');
   if(!file.startsWith(root+sep)){res.writeHead(403,headers).end();return;}
   let status=200;
   try{if(!(await stat(file)).isFile())throw Error();}
   catch{file=resolve(root,'404.html');status=404;}
   res.writeHead(status,{'Content-Type':types[extname(file)]??'application/octet-stream',...headers});
   res.end(await readFile(file));
  }catch{res.writeHead(500).end();}
 });
 await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
 return {origin:'http://127.0.0.1:'+server.address().port,
  close:()=>new Promise((ok,no)=>server.close(error=>error?no(error):ok()))};
}
