import {execFileSync} from "node:child_process";
import {cpSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createHash} from "node:crypto";
import {siteConfig} from "./config.mjs";
import {pages,icon,eras} from "./content.mjs";
const root=resolve(import.meta.dirname,".."),output=resolve(root,"out/site");
export function validateConfig(c){
 if(!["preview","public"].includes(c.mode))throw Error("Modo do site inválido");
 if(c.origin){const u=new URL(c.origin);if(u.protocol!=="https:"||u.pathname!=="/"||u.search||u.hash||u.username||u.password)throw Error("origin deve ser um domínio HTTPS sem caminho");}
 if(c.email&&!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(c.email))throw Error("Email de contato inválido");
 if(c.mode==="public"&&(!c.operator?.trim()||!c.email||!c.origin))throw Error("Lançamento público: configurar responsável, email privado e domínio em website/config.mjs");
 if(c.mode==="public"&&!["provider","retention","countries","legalBasis"].every(k=>typeof c.hosting?.[k]==="string"&&c.hosting[k].trim()))throw Error("Lançamento público: informar provedor, retenção de logs, locais de processamento e bases legais da operação em hosting");
}
export function buildSite(){
 validateConfig(siteConfig);
 const accounts=JSON.parse(readFileSync(resolve(root,"account-config.json"),"utf8"));
 if(accounts.enabled&&(!siteConfig.email||!siteConfig.operator||!accounts.firebaseApiKey))throw Error("Conta online exige responsável, contato e configuração Firebase.");
 // Always ship the currently compiled game, never a stale build from another task.
 execFileSync(process.execPath,[resolve(root,"scripts/build.mjs")],{cwd:root,stdio:"inherit"});
 rmSync(output,{recursive:true,force:true});mkdirSync(resolve(output,"assets"),{recursive:true});
 for(const [from,to] of [["website/site.css","assets/site.css"],["website/site.mjs","assets/site.mjs"],["website/data-controls.mjs","assets/data-controls.mjs"],["assets/ui/brand.svg","assets/brand.svg"],["assets/ui/icons.svg","assets/icons.svg"]])cpSync(resolve(root,from),resolve(output,to));
 for(const file of ["sala.webp","pc-crt.svg","pc-lcd.svg","pc-led.svg","pc-arena.svg"])cpSync(resolve(root,"website/assets",file),resolve(output,"assets",file));
 for(const file of ["account.mjs","account-client.mjs","account.css","donate-client.mjs","donate.css","email-confirmation.mjs"])cpSync(resolve(root,"website",file),resolve(output,"assets",file));
 cpSync(resolve(root,"account-config.json"),resolve(output,"account-config.json"));
 writeFileSync(resolve(output,"assets/eras.mjs"),"export const eras="+JSON.stringify(eras)+";\n");
 cpSync(resolve(root,"dist"),resolve(output,"game"),{recursive:true});
 // Identificador muda com o código do jogo. Evita JS antigo no navegador após o deploy.
 const moduleFiles=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>
  entry.isDirectory()?moduleFiles(resolve(dir,entry.name)):[resolve(dir,entry.name)]);
 const revisionHash=createHash("sha256");
 for(const file of moduleFiles(resolve(output,"game/js")).sort())revisionHash.update(readFileSync(file));
 for(const file of ["website/site.mjs","website/site.css","website/account.mjs","website/account-client.mjs","website/account.css","website/donate-client.mjs","website/donate.css","website/email-confirmation.mjs","style.css"])revisionHash.update(readFileSync(resolve(root,file)));
 revisionHash.update(readFileSync(resolve(root,"website/assets/sala.webp")));
 const revision=revisionHash.digest("hex").slice(0,12);
 // Keep account/payment modules on the same release, including their imports.
 for(const file of moduleFiles(resolve(output,'assets')).filter(file=>file.endsWith('.mjs'))){
  writeFileSync(file,readFileSync(file,'utf8').replace(/(\b(?:from\s*|import\s*\(\s*|import\s*)["'])(\.\.?\/[^"']+\.mjs)(["'])/g,
   (_,prefix,path,quote)=>prefix+path+'?v='+revision+quote));
 }
 // Versionar o grafo inteiro: main novo com renderizadores antigos em cache
 // pode quebrar imports ou exibir a arte anterior, mesmo após atualizar a página.
 for(const file of moduleFiles(resolve(output,"game/js")).filter(file=>file.endsWith(".js"))){
  const source=readFileSync(file,"utf8");
  writeFileSync(file,source.replace(/(\b(?:from\s*|import\s*\(\s*|import\s*)["'])(\.\.?\/[^"']+\.js)(["'])/g,
   (_,prefix,path,quote)=>prefix+path+"?v="+revision+quote));
 }
 const gameStyle=resolve(output,"game/style.css");
 writeFileSync(gameStyle,readFileSync(gameStyle,"utf8").replace("./assets/ui/salon-preview.webp","./assets/ui/salon-preview.webp?v="+revision));
 const gameFile=resolve(output,"game/index.html");let game=readFileSync(gameFile,"utf8");
 game=game.replace('<span class="edition-label">','<a class="edition-label" href="/jogar/" target="_top">← Voltar ao site</a><span class="edition-label">');
 game=game.replace('<script type="module" src="./js/main.js"></script>',
  '<script type="module" src="./js/main.js?v='+revision+'"></script>');
 game=game.replace("<title>",'<meta name="robots" content="noindex"/><title>');
 game=game.replace('href="./style.css"','href="./style.css?v='+revision+'"');writeFileSync(gameFile,game);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const c=Object.fromEntries(Object.entries(siteConfig).map(([k,v])=>[k,typeof v==="string"?escape(v):v]));
 if(c.hosting)c.hosting=Object.fromEntries(Object.entries(c.hosting).map(([k,v])=>[k,escape(v)]));
 const content=pages(c),hashes=[];
 const brand=`<a class="brand" href="/" aria-label="Lan House Simulator · início"><img src="/assets/brand.svg" alt="" width="41" height="41"/><span>LAN HOUSE SIMULATOR<small>UM JOGO SOFTDOWN</small></span></a>`;
 for(const p of content){
  const url=siteConfig.origin?new URL(p.path?"/"+p.path+"/":"/",siteConfig.origin).href:null;
  const schema={"@context":"https://schema.org","@type":p.path?"WebPage":"WebSite",name:p.path?p.title:c.name,description:p.description,inLanguage:"pt-BR",...(url?{url}:{}),publisher:{"@type":"Organization",name:c.studio}};
  const structured=JSON.stringify(schema).replace(/</g,"\\u003c");hashes.push("'sha256-"+createHash("sha256").update(structured).digest("base64")+"'");
  const nav=[["","Início"],["sobre-o-jogo","O jogo"],["sobre-nos","Sobre nós"],["ajuda","Ajuda"],["donate","Donate"],["conta","Minha conta"]].map(([path,label])=>`<a href="/${path?path+"/":""}" ${p.path===path?'aria-current="page"':""}>${label}</a>`).join("");
  const canonical=url&&p.path!=="404"?`<link rel="canonical" href="${escape(url)}"/><meta property="og:url" content="${escape(url)}"/><meta property="og:image" content="${escape(new URL("/assets/sala.webp",siteConfig.origin).href)}"/><meta property="og:image:alt" content="Salão isométrico do Lan House Simulator"/>`:"";
  const html=`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#192e2a"/>
<title>${escape(p.title)} · ${c.name}</title><meta name="description" content="${escape(p.description)}"/><meta name="robots" content="${siteConfig.mode==="public"&&p.path!=="404"&&!p.noindex?"index,follow":"noindex,nofollow"}"/>
<meta property="og:type" content="website"/><meta property="og:locale" content="pt_BR"/><meta property="og:site_name" content="${c.name}"/><meta property="og:title" content="${escape(p.title)} · ${c.name}"/><meta property="og:description" content="${escape(p.description)}"/><meta name="twitter:card" content="summary_large_image"/>${canonical}
<link rel="icon" type="image/svg+xml" href="/assets/brand.svg"/><link rel="stylesheet" href="/assets/site.css?v=${revision}"/><link rel="stylesheet" href="/assets/account.css?v=${revision}"/>${p.path==='donate'?`<link rel="stylesheet" href="/assets/donate.css?v=${revision}"/>`:''}<script type="application/ld+json">${structured}</script><script type="module" src="/assets/site.mjs?v=${revision}"></script></head><body>
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a><header class="site-header"><div class="header-inner wrap">${brand}<button type="button" id="menu-toggle" class="menu-toggle" aria-controls="site-nav" aria-expanded="false">Menu ${icon("settings")}</button><nav class="site-nav" id="site-nav" aria-label="Navegação principal">${nav}<a class="button" href="/jogar/" ${p.path==="jogar"?'aria-current="page"':""}>${icon("play")} Jogar agora</a></nav></div></header>
<main id="conteudo">${p.path==="jogar"?p.body.replace('data-src="/game/"','data-src="/game/?v='+revision+'"'):p.body}</main><footer class="site-footer"><div class="footer-top wrap"><div class="footer-brand">${brand}<p>Seu bairro. Seu negócio. Sua história.<br/>Da primeira conexão ao seu próprio salão.</p></div><div class="footer-links"><h2>EXPLORE O SALÃO</h2><a href="/jogar/">Jogar agora</a><a href="/sobre-o-jogo/">Sobre o jogo</a><a href="/sobre-nos/">Sobre nós</a><a href="/ajuda/">Ajuda e perguntas</a><a href="/contato/">Contato</a></div><div class="footer-links"><h2>INFORMAÇÕES</h2><a href="/termos/">Termos de uso</a><a href="/privacidade/">Política de privacidade</a><a href="/dados/">Gerenciar dados locais</a></div></div><div class="footer-bottom wrap"><span>© 2026 SOFTDOWN · LAN HOUSE SIMULATOR</span><button type="button" class="motion-toggle" id="motion-toggle" aria-pressed="false">Pausar animações</button><span>TERMINAL DE BAIRRO / ${siteConfig.mode==="preview"?"PRÉVIA PRIVADA":"EDIÇÃO WEB"}</span></div></footer></body></html>`;
  const file=p.path==="404"?resolve(output,"404.html"):resolve(output,p.path,"index.html");mkdirSync(dirname(file),{recursive:true});writeFileSync(file,html.replaceAll('src="/assets/sala.webp"','src="/assets/sala.webp?v='+revision+'"').replaceAll('src="/assets/account.mjs"','src="/assets/account.mjs?v='+revision+'"').replaceAll('src="/assets/email-confirmation.mjs"','src="/assets/email-confirmation.mjs?v='+revision+'"'));
 }
 writeFileSync(resolve(output,"robots.txt"),siteConfig.mode==="public"?`User-agent: *\nAllow: /\nDisallow: /game/\nSitemap: ${new URL("/sitemap.xml",siteConfig.origin).href}\n`:"User-agent: *\nDisallow: /\n");
 if(siteConfig.mode==="public")writeFileSync(resolve(output,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${content.filter(p=>!p.noindex&&!["404","dados"].includes(p.path)).map(p=>`<url><loc>${escape(new URL(p.path?"/"+p.path+"/":"/",siteConfig.origin).href)}</loc></url>`).join("")}</urlset>`);
 const online=JSON.parse(readFileSync(resolve(root,"online-config.json"),"utf8"));
 let connections="'self'";
 for(const config of [online,accounts])if(config.enabled){const api=new URL(config.apiUrl);if(api.protocol!=="https:"||api.pathname!=="/"||api.search||api.hash||api.username||api.password)throw Error("URL da API online inválida");connections+=" "+api.origin+" https://identitytoolkit.googleapis.com https://securetoken.googleapis.com";}
 const csp=`default-src 'self'; script-src 'self' ${hashes.join(" ")}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self' blob:; connect-src ${connections}; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'`;
 writeFileSync(resolve(output,"_headers"),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), fullscreen=(self)\n  Content-Security-Policy: ${csp}\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=3600\n/game/js/*\n  Cache-Control: no-cache\n/conta/confirmar/*\n  ! Referrer-Policy\n  Referrer-Policy: no-referrer\n  ! Cache-Control\n  Cache-Control: no-store\n  X-Robots-Tag: noindex, nofollow\n`);
 console.log(`Site: ${content.length} páginas + jogo completo em ${output}`);return output;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename))buildSite();
