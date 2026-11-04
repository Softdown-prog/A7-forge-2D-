/** Dependency-free static frontend runtime. The API is a separate image/service. */
import {createServer} from 'node:http';
import {readFile,stat,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export async function startSiteServer({root,host='127.0.0.1',port=0}){
 root=await realpath(root);
 const rules=[];let current;
 for(const line of (await readFile(resolve(root,'_headers'),'utf8')).split('\n')){
  if(line.startsWith('/')){current={pattern:line,headers:{}};rules.push(current);}
  else if(current){const match=line.trim().match(/^([^:]+):\s*(.*)$/);if(match)current.headers[match[1]]=match[2];}
 }
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json',
  '.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wav':'audio/wav','.ogg':'audio/ogg','.mp3':'audio/mpeg','.ico':'image/x-icon'};
 const server=createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
   const headers={'Cache-Control':'no-cache, must-revalidate'};
   for(const rule of rules)if(rule.pattern===pathname||(rule.pattern.endsWith('*')&&pathname.startsWith(rule.pattern.slice(0,-1))))Object.assign(headers,rule.headers);
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'}).end();return;}
   if(pathname==='/health'){res.writeHead(200,{...headers,'Content-Type':'application/json','Cache-Control':'no-store'}).end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok',frontend:'angular'}));return;}
   if(pathname==='/favicon.ico'){res.writeHead(204,headers).end();return;}
   if(pathname.includes('\0')||pathname.includes('\\')||pathname.split('/').includes('..')){res.writeHead(400,headers).end();return;}
   let file=resolve(root,'.'+pathname);
   if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403,headers).end();return;}
   let status=200;
   try{
    const info=await stat(file);
    if(info.isDirectory()){
     if(!pathname.endsWith('/')){res.writeHead(308,{...headers,Location:pathname+'/'}).end();return;}
     file=resolve(file,'index.html');
    }
    const actual=await realpath(file);
    if(!actual.startsWith(root+sep)||!(await stat(actual)).isFile()||pathname.startsWith('/_'))throw Error('Not public');
    file=actual;
   }catch{file=resolve(root,'404.html');status=404;}
   const data=await readFile(file);
   res.writeHead(status,{'Content-Type':types[extname(file)]??'application/octet-stream',...headers});
   res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(400,{'Cache-Control':'no-store'}).end();}
 });
 await new Promise((ok,no)=>{server.once('error',no);server.listen(port,host,ok);});
 return {origin:'http://'+host+':'+server.address().port,
  close:()=>new Promise((ok,no)=>server.close(error=>error?no(error):ok()))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT??8080);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
 const server=await startSiteServer({root:process.env.LHS_SITE_ROOT??resolve(import.meta.dirname,'../out/site'),host:'0.0.0.0',port});
 console.log('Angular frontend listening on port '+port);
 for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{void server.close().then(()=>process.exit(0));});
}
