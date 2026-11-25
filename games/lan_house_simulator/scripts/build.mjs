import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { assertAngularGameDocument } from "../frontend-angular/scripts/game_document.mjs";
const root=resolve(import.meta.dirname,"..");
assertAngularGameDocument(readFileSync(resolve(root,"index.html"),"utf8"));
const angular=resolve(root,"frontend-angular");
const cli=resolve(angular,"node_modules/@angular/cli/bin/ng.js");
if(!existsSync(cli)){
 const args=["ci","--prefix","frontend-angular","--no-audit","--no-fund"];
 if(process.env.npm_execpath){
  execFileSync(process.execPath,[process.env.npm_execpath,...args],{cwd:root,stdio:"inherit"});
 }else{
  const windows=process.platform==="win32";
  execFileSync(windows?"npm.cmd":"npm",args,{cwd:root,stdio:"inherit",shell:windows});
 }
}
const angularOutput=resolve(angular,"dist/game-ui");
rmSync(angularOutput,{recursive:true,force:true});
execFileSync(process.execPath,[cli,"build","game-ui","--configuration","production"],{cwd:angular,stdio:"inherit"});
rmSync(resolve(root,"dist"),{recursive:true,force:true});
mkdirSync(resolve(root,"dist"),{recursive:true});
execFileSync(process.execPath,[resolve(root,"node_modules/typescript/bin/tsc"),"-p",resolve(root,"tsconfig.json")],{cwd:root,stdio:"inherit"});
const browserOutput=resolve(angularOutput,"browser");
cpSync(browserOutput,resolve(root,"dist/__angular"),{
 recursive:true,filter:file=>file!==resolve(browserOutput,"index.html"),
});
for(const file of ["index.html","style.css","online-config.json"])cpSync(resolve(root,file),resolve(root,"dist",file));
// Site and game use the same account session and token refresh implementation.
cpSync(resolve(root,"website/account-client.mjs"),resolve(root,"dist/js/ui/accountClient.js"));
cpSync(resolve(root,"assets"),resolve(root,"dist/assets"),{recursive:true});
// A mesma imagem de reserva funciona no jogo isolado e dentro de /game/.
cpSync(resolve(root,"website/assets/sala.webp"),resolve(root,"dist/assets/ui/salon-preview.webp"));
console.log("LHS build estático em dist/ (Angular + Canvas)");
