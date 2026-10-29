import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame} from "../dist/js/sim/engine.js";
import {gameYear} from "../dist/js/sim/era.js";
import {createPanelRevisionCache} from "../dist/js/application/panelRevisionCache.js";
import {createShopCatalogRevisionPort} from "../dist/js/application/shopCatalogRevisionPort.js";

function fixture(){
 let state=createGame(7651,"historical");
 const port=createShopCatalogRevisionPort(()=>state);
 return {port,state:()=>state,swap:newState=>{state=newState;}};
}
function legacy(s,category){
 return [category,s.cash,s.discCopier,s.printer,s.ps1Stations,s.ps1Discs,
  gameYear(s),s.expansionLevel,s.installedPcs,s.annexPcs,s.roomExtensions,
  s.furniture,s.furniturePlacements,s.objectPlacements,s.removedBuiltPosters,
  s.interiorWalls,s.interiorDoors];
}
test("projeção tem os mesmos dezessete campos originais na mesma ordem",()=>{
 const x=fixture(),s=x.state();
 assert.deepEqual(x.port.snapshot("equipment"),legacy(s,"equipment"));
 assert.equal(x.port.snapshot("equipment").length,17);
});
test("categoria indefinida preserva undefined e posições do vetor",()=>{
 const x=fixture(),v=x.port.snapshot(undefined);
 assert.equal(v[0],undefined);
 assert.deepEqual(v,legacy(x.state(),undefined));
});
test("a categoria da loja não é normalizada nem convertida",()=>{
 const x=fixture();
 for(const category of ["equipment","consoles","building","decoration",""]){
  assert.equal(x.port.snapshot(category)[0],category);
 }
});
test("caixa acompanha mudanças antes da próxima pintura",()=>{
 const x=fixture(),before=x.port.snapshot("equipment")[1];
 x.state().cash+=37.5;
 assert.equal(x.port.snapshot("equipment")[1],before+37.5);
});
test("contadores de copiadora e impressora mantêm os valores do motor",()=>{
 const x=fixture(),s=x.state(),v=x.port.snapshot("equipment");
 assert.equal(v[2],s.discCopier);assert.equal(v[3],s.printer);
});
test("estações e discos PS1 são referências originais",()=>{
 const x=fixture(),s=x.state(),v=x.port.snapshot("consoles");
 assert.equal(v[4],s.ps1Stations);assert.equal(v[5],s.ps1Discs);
});
test("ano deriva da partida ativa, sem receber uma data de UI",()=>{
 const x=fixture(),s=x.state();
 assert.equal(x.port.snapshot("equipment")[6],gameYear(s));
});
test("expansão e quantidade instalada não usam PC simulado no lugar do save",()=>{
 const x=fixture(),s=x.state(),v=x.port.snapshot("building");
 assert.equal(v[7],s.expansionLevel);assert.equal(v[8],s.installedPcs);
});
test("PCs do anexo mantêm sua própria posição de invalidação",()=>{
 const x=fixture(),s=x.state();
 assert.equal(x.port.snapshot("building")[9],s.annexPcs);
});
test("roomExtensions mantém identidade para a mesma partida",()=>{
 const x=fixture(),s=x.state();
 assert.equal(x.port.snapshot("building")[10],s.roomExtensions);
});
test("móveis e suas posições mantêm três revisões distintas",()=>{
 const x=fixture(),s=x.state(),v=x.port.snapshot("decoration");
 assert.equal(v[11],s.furniture);
 assert.equal(v[12],s.furniturePlacements);
 assert.equal(v[13],s.objectPlacements);
});
test("pôsteres removidos mantêm estado opcional e referência",()=>{
 const x=fixture(),s=x.state();
 assert.equal(x.port.snapshot("decoration")[14],s.removedBuiltPosters);
});
test("paredes e portas permanecem campos separados",()=>{
 const x=fixture(),s=x.state(),v=x.port.snapshot("building");
 assert.equal(v[15],s.interiorWalls);assert.equal(v[16],s.interiorDoors);
});
test("substituir um vetor aparece imediatamente no snapshot",()=>{
 const x=fixture(),s=x.state(),before=x.port.snapshot("decoration")[11];
 s.furniture={...s.furniture};
 assert.equal(x.port.snapshot("decoration")[11],s.furniture);
 assert.notEqual(x.port.snapshot("decoration")[11],before);
});
test("o cache JSON conserva o bloqueio em revisões iguais",()=>{
 const x=fixture(),changed=createPanelRevisionCache();
 assert.equal(changed("shop",x.port.snapshot("equipment"),false),true);
 assert.equal(changed("shop",x.port.snapshot("equipment"),false),false);
});
test("trocar categoria ou caixa invalida cache existente",()=>{
 const x=fixture(),changed=createPanelRevisionCache();
 assert.equal(changed("shop",x.port.snapshot("equipment"),false),true);
 assert.equal(changed("shop",x.port.snapshot("building"),false),true);
 assert.equal(changed("shop",x.port.snapshot("building"),false),false);
 x.state().cash+=12;
 assert.equal(changed("shop",x.port.snapshot("building"),false),true);
});
test("renderização forçada continua prevalecendo sobre cache idêntico",()=>{
 const x=fixture(),changed=createPanelRevisionCache();
 changed("shop",x.port.snapshot("consoles"),false);
 assert.equal(changed("shop",x.port.snapshot("consoles"),true),true);
 assert.equal(changed("shop",x.port.snapshot("consoles"),false),false);
});
test("troca de save é lida sem criar outra porta",()=>{
 const x=fixture(),old=x.state(),original=JSON.stringify(old);
 const fresh=createGame(7652,"classic");fresh.cash=7892;
 x.swap(fresh);
 assert.deepEqual(x.port.snapshot("equipment"),legacy(fresh,"equipment"));
 assert.equal(x.port.snapshot("equipment")[1],7892);
 assert.equal(JSON.stringify(old),original);
});
test("leitura repetida não modifica a partida nem o RNG",()=>{
 const x=fixture(),before=JSON.stringify(x.state());
 for(const name of [undefined,"equipment","consoles","building","decoration"]){
  x.port.snapshot(name);x.port.snapshot(name);
 }
 assert.equal(JSON.stringify(x.state()),before);
});
test("porta não depende de DOM, cronômetros, persistência nem compras",()=>{
 const source=readFileSync(new URL("../src/application/shopCatalogRevisionPort.ts",import.meta.url),"utf8");
 for(const forbidden of ["document","window","HTMLElement","localStorage","setInterval",
  "requestAnimationFrame","stepGame","applyResult","saveGame","shopPrice"])
  assert.equal(source.includes(forbidden),false,forbidden);
});
test("main fornece a categoria atual e ainda delega o renderizador original",()=>{
 const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 assert.ok(main.includes("createShopCatalogRevisionPort(()=>game)"));
 assert.ok(main.includes('revision:()=>shopCatalogRevisionPort.snapshot(shopPanels?.current())'));
 assert.ok(main.includes('changed:(revision,force)=>panelChanged("shop",revision,force)'));
 assert.ok(main.includes("renderShopCatalog({"));
 assert.ok(main.includes("currentCategory:()=>shopPanels?.current()"));
 assert.ok(main.includes("offer:id=>shopCatalogOffersPort.snapshot(id)"));
 assert.ok(!main.includes("game.removedBuiltPosters,game.interiorWalls,game.interiorDoors"));
});
