import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const root=resolve(import.meta.dirname,"..");
const required=[
  "docs/GAME_DESIGN.md","docs/ARCHITECTURE.md","docs/WORKER_POOL.md","docs/BACKLOG.md",
  "authoring/recipes/vending_machine_study.json","dist/index.html","dist/js/main.js","dist/style.css"
];
const missing=required.filter(p=>!existsSync(resolve(root,p)));
const design=readFileSync(resolve(root,"docs/GAME_DESIGN.md"),"utf8");
for(const term of ["refrigerante","paçocas","internet","licenças","nine-slice","chuva","balcão","fantasias"]){
  if(!design.toLowerCase().includes(term))missing.push("contrato da ideia ausente: "+term);
}
if(missing.length){console.error("Auditoria LHS falhou:",missing.join(", "));process.exit(1);}
console.log("LHS: contratos e build estático presentes; arte continua em revisão.");
