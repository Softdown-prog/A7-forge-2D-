import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,"..");
rmSync(resolve(root,"dist"),{recursive:true,force:true});
mkdirSync(resolve(root,"dist"),{recursive:true});
execFileSync(process.execPath,[resolve(root,"node_modules/typescript/bin/tsc"),"-p",resolve(root,"tsconfig.json")],{cwd:root,stdio:"inherit"});
// The complete website is Angular-first. Keep React only for standalone
// compatibility builds (npm run build) and old-browser regression fixtures.
// Do not spend CPU bundling a React entry that the Angular cutover removes.
const gameUi=process.env.LHS_GAME_UI??"react";
if(gameUi!=="react"&&gameUi!=="angular")throw Error("LHS_GAME_UI inválido: "+gameUi);
if(gameUi==="react"){
const {build:buildReact}=await import("esbuild");
await buildReact({
 entryPoints:[resolve(root,"src/react/entry.jsx")],
 outfile:resolve(root,"dist/js/react-entry.js"),
 bundle:true,minify:true,format:"esm",target:"es2022",
 external:["./main.js"],
 define:{"process.env.NODE_ENV":JSON.stringify("production")},
 logLevel:"warning"
});
}
for(const file of ["index.html","style.css","online-config.json"])cpSync(resolve(root,file),resolve(root,"dist",file));
// Site and game use the same account session and token refresh implementation.
cpSync(resolve(root,"website/account-client.mjs"),resolve(root,"dist/js/ui/accountClient.js"));
cpSync(resolve(root,"assets"),resolve(root,"dist/assets"),{recursive:true});
// A mesma imagem de reserva funciona no jogo isolado e dentro de /game/.
cpSync(resolve(root,"website/assets/sala.webp"),resolve(root,"dist/assets/ui/salon-preview.webp"));
console.log("LHS build estático em dist/ (UI "+gameUi+")");
