import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {buyPrinter,setPrintPrice,printPaperInkCost,PRINT_PAGES_PER_DAY} from "../dist/js/sim/printService.js";
import {buyDiscCopier,setDiscCopyPrice,discMediaCost,DISC_COPIES_PER_DAY} from "../dist/js/sim/discCopy.js";
import {printEconomy,discEconomy} from "../dist/js/sim/serviceEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createDeskPricingPort} from "../dist/js/application/deskPricingPort.js";
import {renderDiscPricing,renderPrintPricing,renderDeskServicePanels} from "../dist/js/ui/deskPricingPanel.js";

const currency=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const starting=(mode="historical")=>{const s=createGame(6151,mode);s.cash=5000;s.totalMinutes=3*360*720;return s;};
test("sem equipamentos não mostra serviços inexistentes nem altera save",()=>{
 const s=starting(),port=createDeskPricingPort(()=>s),before=JSON.stringify(s);
 assert.deepEqual(port.installed(),{discs:false,printer:false});
 assert.equal(port.discs(),null);assert.equal(port.printing(),null);
 assert.equal(JSON.stringify(s),before);
});
test("cópias de CD/DVD usam preço, material, capacidades e limites reais",()=>{
 const s=starting();assert.equal(buyDiscCopier(s).ok,true);
 const port=createDeskPricingPort(()=>s),initial=port.discs();
 assert.deepEqual(initial.rows.map(r=>r.kind),["cd","dvd"]);
 assert.ok(initial.capacity.includes("0 de "+DISC_COPIES_PER_DAY+" cópias feitas hoje"));
 assert.ok(initial.rows.every(r=>r.cost.includes(currency(discMediaCost(s,r.kind)))));
 assert.equal(setDiscCopyPrice(s,"cd",1).ok,true);
 assert.equal(setDiscCopyPrice(s,"dvd",80).ok,true);
 const view=port.discs();
 assert.equal(view.rows[0].decreaseDisabled,true);
 assert.equal(view.rows[1].increaseDisabled,true);
 assert.equal(view.rows[0].price,currency(1));
 assert.equal(view.rows[1].price,currency(80));
});
test("impressão histórica preserva passo de R$ 0,50 e custos",()=>{
 const s=starting();assert.equal(buyPrinter(s).ok,true);
 const port=createDeskPricingPort(()=>s);
 assert.equal(port.printing().step,.5);
 assert.ok(port.printing().capacity.includes("0 de "+PRINT_PAGES_PER_DAY+" páginas hoje"));
 assert.equal(setPrintPrice(s,.5).ok,true);
 assert.equal(port.printing().decreaseDisabled,true);
 assert.ok(port.printing().cost.includes(currency(printPaperInkCost(s))));
 assert.equal(setPrintPrice(s,20).ok,true);
 assert.equal(port.printing().increaseDisabled,true);
});
test("impressão clássica mantém valores inteiros e margem nula",()=>{
 const s=starting("classic");assert.equal(buyPrinter(s).ok,true);
 const port=createDeskPricingPort(()=>s);
 assert.equal(port.printing().step,1);
 assert.equal(setPrintPrice(s,1).ok,true);
 assert.equal(port.printing().decreaseDisabled,true);
 assert.match(port.printing().cost,/sem margem para recuperar a máquina/);
});
test("relatórios financeiros não inventam atendimento ou alteram estado",()=>{
 const s=starting("classic");buyPrinter(s);buyDiscCopier(s);
 s.printer.pages=8;s.printer.revenue=500;s.printer.expenses=45;s.printer.walkIns=1;
 s.discCopier.cdCopies=10;s.discCopier.dvdCopies=3;
 s.discCopier.revenue=1400;s.discCopier.expenses=55;s.discCopier.walkIns=2;
 const before=JSON.stringify(s),port=createDeskPricingPort(()=>s);
 const print=port.printing(),disc=port.discs();
 assert.match(print.summary,/1 cliente atendido exclusivamente para imprimir/);
 assert.match(disc.summary,/2 clientes atendidos exclusivamente para cópias/);
 assert.match(print.capacity,/Investimento inicial recuperado/);
 assert.match(disc.capacity,/Investimento inicial recuperado/);
 assert.ok(print.summary.includes(currency(printEconomy(s).operatingResult)));
 assert.ok(disc.summary.includes(currency(discEconomy(s).operatingResult)));
 assert.equal(JSON.stringify(s),before);
});
test("depois de importar save, porta acessa nova partida, sem tocar na antiga",()=>{
 let s=starting();buyPrinter(s);buyDiscCopier(s);
 const port=createDeskPricingPort(()=>s),old=s,before=JSON.stringify(s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 s.printer.price+=.5;
 assert.equal(port.printing().price,currency(s.printer.price));
 assert.equal(JSON.stringify(old),before);
});
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.textContent="";this.innerHTML="";}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(name,value){this.attrs[name]=value;}
}
test("renderizadores mantêm botões e eventos delegados nas duas abas",()=>{
 const s=starting();buyPrinter(s);buyDiscCopier(s);
 const port=createDeskPricingPort(()=>s),doc={createElement:tag=>new Node(tag)};
 const host={listeners:["click"]},shown=new Map(),setText=(id,val)=>shown.set(id,val);
 let discs,printer;
 renderDiscPricing(host,port.discs(),setText,()=>"<i>disc</i>",doc,(current,next)=>{assert.equal(current,host);discs=next;});
 renderPrintPricing(host,port.printing(),setText,doc,(current,next)=>{assert.equal(current,host);printer=next;});
 assert.equal(host.listeners[0],"click");
 assert.equal(discs.children.length,2);
 assert.deepEqual(discs.children[0].children[1].children[0].dataset,{discKind:"cd",delta:"-1"});
 assert.equal(discs.children[0].children[1].children[2].dataset.delta,"1");
 assert.equal(printer.children[0].children[1].children[0].dataset.printDelta,"-0.5");
 assert.equal(printer.children[0].children[1].children[2].dataset.printDelta,"0.5");
 assert.deepEqual([...shown.keys()],["disc-copy-summary","disc-copy-capacity","print-service-summary","print-service-capacity"]);
});
test("porta sem DOM e apresentação sem dependência de simulação",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/deskPricingPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/deskPricingPanel.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|addEventListener/);
 assert.ok(main.includes("createDeskPricingPort(()=>game)"));
 assert.ok(main.includes('isActive:page=>managementPanels.active("prices",page)'));
 assert.ok(ui.includes('options.isActive("discs")'));
 assert.ok(ui.includes('options.isActive("printing")'));
 assert.ok(main.includes("renderDeskServicePanels(deskPricingPort,{"));
 assert.ok(ui.includes("renderDiscPricing(options.discControls,view,options.setText,options.iconMarkup,options.doc,options.sync)"));
 assert.ok(ui.includes("renderPrintPricing(options.printControls,view,options.setText,options.doc,options.sync)"));
 assert.doesNotMatch(main,/\bprintEconomy\(|\bdiscEconomy\(/);
});
