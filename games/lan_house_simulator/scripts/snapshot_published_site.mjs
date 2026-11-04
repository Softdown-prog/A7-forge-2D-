/** Read-only inventory of published HTML. Never executes JS, logs in or calls payment APIs. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {siteConfig} from '../website/config.mjs';
const paths=['/','/jogar/','/sobre-o-jogo/','/sobre-nos/','/ajuda/','/contato/',
 '/conta/','/conta/confirmar/','/donate/','/termos/','/privacidade/','/dados/','/404/'];
const output=resolve(import.meta.dirname,'../out/site-clean-angular-browser');
mkdirSync(output,{recursive:true});
const temporary=mkdtempSync(join(tmpdir(),'lhs-public-inventory-'));
const pages=[];
try{
 for(const path of paths){
  const headerFile=join(temporary,'headers');
  const html=execFileSync('curl',['--silent','--show-error','--location','--max-time','30',
   '--dump-header',headerFile,new URL(path,siteConfig.origin).href],{encoding:'utf8',maxBuffer:2000000});
  const headers=readFileSync(headerFile,'utf8');
  pages.push({path,status:Number([...headers.matchAll(/HTTP\/[\d.]+\s+(\d+)/g)].at(-1)?.[1]),
   sha256:createHash('sha256').update(html).digest('hex'),
   title:html.match(/<title>(.*?)<\/title>/s)?.[1],
   headings:[...html.matchAll(/<h[12]\b[^>]*>(.*?)<\/h[12]>/gs)].map(m=>m[1].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()),
   links:[...new Set([...html.matchAll(/href="([^"#]+[^"]*)"/g)].map(m=>m[1]))],
   csp:headers.match(/^content-security-policy:\s*(.+)$/im)?.[1]?.trim()});
 }
 writeFileSync(resolve(output,'published-route-inventory.json'),JSON.stringify({origin:siteConfig.origin,
  observedAt:new Date().toISOString(),readOnly:true,pages},null,2)+'\n');
 console.log('Published HTML inventory:',pages.map(x=>x.path+' '+x.status).join(', '));
}finally{rmSync(temporary,{recursive:true,force:true});}
