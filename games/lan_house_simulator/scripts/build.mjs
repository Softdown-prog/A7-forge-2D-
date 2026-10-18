import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,"..");
rmSync(resolve(root,"dist"),{recursive:true,force:true});
mkdirSync(resolve(root,"dist"),{recursive:true});
execFileSync(process.execPath,[resolve(root,"node_modules/typescript/bin/tsc"),"-p",resolve(root,"tsconfig.json")],{cwd:root,stdio:"inherit"});
for(const file of ["index.html","style.css","online-config.json"])cpSync(resolve(root,file),resolve(root,"dist",file));
// Site and game use the same account session and token refresh implementation.
cpSync(resolve(root,"website/account-client.mjs"),resolve(root,"dist/js/ui/accountClient.js"));
cpSync(resolve(root,"assets"),resolve(root,"dist/assets"),{recursive:true});
// A mesma imagem de reserva funciona no jogo isolado e dentro de /game/.
cpSync(resolve(root,"website/assets/sala.webp"),resolve(root,"dist/assets/ui/salon-preview.webp"));
console.log("LHS build estático em dist/");
