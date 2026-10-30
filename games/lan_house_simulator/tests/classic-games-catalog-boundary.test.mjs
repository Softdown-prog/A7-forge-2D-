import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {licenseGames} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,ERA_GAME_CATALOG,quoteEraGame} from "../dist/js/sim/eraGames.js";
import {gamePopularityPercent} from "../dist/js/sim/gamePopularity.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createClassicGamesCatalogPort} from "../dist/js/application/classicGamesCatalogPort.js";
import {renderClassicGamesCatalog} from "../dist/js/ui/classicGamesCatalogPanel.js";
import {withStationOff} from "./station-power-fixture.mjs";
const at=(year=1998,mode="historical")=>{
 const s=createGame(44021,mode);s.cash=5000;s.totalMinutes=(year-1998)*360*DAY_MINUTES;return s;
};
test("ano 1998 mostra os dois conjuntos iniciais e mantém as licenças bloqueadas",()=>{
 const s=at(),before=JSON.stringify(s),view=createClassicGamesCatalogPort(()=>s).snapshot();
 assert.deepEqual(view.sections.map(x=>x.year),[1998,1999]);
 assert.deepEqual(view.sections.map(x=>x.cards.length),[5,5]);
 assert.match(view.summary,/0 de 10 títulos licenciados/);
 assert.equal(view.sections[0].cards[0].buttonDisabled,true);
 assert.match(view.sections[0].cards[0].status,/Regularize primeiro os direitos básicos/);
 assert.equal(view.sections[1].cards[0].buttonLabel,"🔒 Chega em 1999");
 assert.equal(JSON.stringify(s),before);
});
test("licença básica e Windows tornam os cartões elegíveis sem cobrar na leitura",()=>{
 const s=at(),port=createClassicGamesCatalogPort(()=>s);
 assert.equal(licenseGames(s).ok,true);
 assert.equal(port.snapshot().sections[0].cards[0].buttonDisabled,true);
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"win98")).ok,true);
 const quote=quoteEraGame(s,ERA_GAME_CATALOG[0].id),cash=s.cash;
 const card=port.snapshot().sections[0].cards[0];
 assert.equal(card.buttonDisabled,!quote.ok);
 assert.equal(card.buttonLabel,"Licenciar · R$ "+ERA_GAME_CATALOG[0].cost);
 assert.equal(card.buttonTitle,quote.message);
 assert.ok(card.status.includes("Pronto para licenciar"));
 assert.equal(s.cash,cash);
});
test("compra mostra licença permanente, custo e bônus de nostalgia",()=>{
 const s=at(),port=createClassicGamesCatalogPort(()=>s);
 assert.equal(licenseGames(s).ok,true);
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"win98")).ok,true);
 assert.equal(licenseEraGame(s,"turbo-98").ok,true);
 let view=port.snapshot();
 assert.equal(view.sections[0].cards[0].buttonLabel,"✓ Licenciado");
 assert.equal(view.sections[0].cards[0].owned,true);
 assert.equal(view.sections[0].cards[0].buttonDisabled,true);
 assert.match(view.summary,/1 de 10 títulos licenciados/);
 s.totalMinutes=3*360*DAY_MINUTES;
 view=port.snapshot();
 const c=view.sections[0].cards[0];
 assert.ok(c.meta.includes("popularidade em 2001: "+gamePopularityPercent(1998,2001)+"%"));
 assert.ok(c.status.includes("✓ Licença permanente"));
});
test("Setor Zero aparece somente após a descoberta do ano 2000",()=>{
 const s=at(2000),port=createClassicGamesCatalogPort(()=>s);
 assert.deepEqual(port.snapshot().sections.map(x=>x.year),[1998,1999]);
 s.ericSecondMailDelivered=true;
 const view=port.snapshot();
 assert.deepEqual(view.sections.map(x=>x.year),[1998,1999,2000]);
 assert.match(view.summary,/0 de 11 títulos licenciados/);
 const network=view.sections[2].cards[0];
 assert.equal(network.id,"setor-zero");
 assert.ok(network.status.includes("PCs aptos agora: 0 (mínimo 2)"));
 assert.equal(network.buttonDisabled,true);
 assert.equal(network.buttonTitle,quoteEraGame(s,network.id).message);
 s.ericSecondMailDelivered=false;s.totalMinutes=3*360*DAY_MINUTES;
 assert.deepEqual(port.snapshot().sections.map(x=>x.year),[1998,1999,2000]);
});
test("modo clássico e ano futuro preservam o cálculo e limitações",()=>{
 const s=at(2024,"classic"),port=createClassicGamesCatalogPort(()=>s);
 const view=port.snapshot();
 assert.equal(view.sections.length,3);
 assert.equal(view.sections[0].cards[0].locked,false);
 assert.equal(view.sections[0].cards[0].buttonDisabled,true);
 assert.ok(view.sections[0].cards[0].meta.includes("popularidade em 2024:"));
});
test("save importado é lido sem prender a porta à partida anterior",()=>{
 let s=at(),original=s,before=JSON.stringify(s);
 const port=createClassicGamesCatalogPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 assert.equal(licenseGames(s).ok,true);
 assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"win98")).ok,true);
 assert.equal(licenseEraGame(s,"blocos-e-cores").ok,true);
 assert.equal(port.snapshot().sections[0].cards[3].owned,true);
 assert.equal(JSON.stringify(original),before);
});
class Node{
 constructor(tag){this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.textContent="";}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
}
test("renderizador conserva cards, capas, atributos de compra e listener delegado",()=>{
 const s=at(),view=createClassicGamesCatalogPort(()=>s).snapshot();
 const host={listeners:["click"]},doc={createElement:tag=>new Node(tag)};
 let next;renderClassicGamesCatalog(host,view,doc,(old,created)=>{
  assert.equal(old,host);next=created;
 });
 assert.deepEqual(host.listeners,["click"]);
 assert.equal(next.children.length,3);
 assert.equal(next.children[0].className,"era-game-summary");
 const year98=next.children[1],card=year98.children[1].children[0];
 assert.equal(year98.className,"era-game-section");
 assert.equal(card.className,"era-game-card");
 assert.equal(card.children[0].dataset.theme,"speed");
 assert.equal(card.children[0].children[1].attrs["aria-hidden"],"true");
 const button=card.children[1].children[4];
 assert.equal(button.dataset.eraGameBuy,"turbo-98");
 assert.equal(button.disabled,view.sections[0].cards[0].buttonDisabled);
 assert.equal(button.title,view.sections[0].cards[0].buttonTitle);
 assert.equal(button.className,"slice");
});
test("componente apenas apresenta dados e main não realiza a cotação do catálogo",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/classicGamesCatalogPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/classicGamesCatalogPanel.ts",root),"utf8");
 const sections=readFileSync(new URL("ui/adminGpuLicenseSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(sourceModule("application/gamePorts.ts").includes("createClassicGamesCatalogPort(getState)"));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("renderAdminGpuLicenseSections({"));
 assert.ok(sections.includes("renderClassicGamesCatalog(options.eraGamePanel,options.classic.snapshot(),options.doc,options.sync)"));
 assert.ok(sourceModule("ui/runtimeControls.ts").includes("installGameLicensingControls("));
 assert.ok(sourceModule("ui/gamePanels.ts").includes("panelChanged(\"eraGamePanel\""));
 assertCompositionAdaptersExclude("quoteEraGame(game,title.id)");
});
