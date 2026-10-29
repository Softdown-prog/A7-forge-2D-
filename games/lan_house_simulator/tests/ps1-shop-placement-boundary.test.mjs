import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {ps1PlacementSlots,ps1PlacementLabel,buyPs1Station} from "../dist/js/sim/ps1.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createPs1ShopPlacementPort} from "../dist/js/application/ps1ShopPlacementPort.js";
import {renderPs1ShopPlacement} from "../dist/js/ui/ps1ShopPlacementPicker.js";
const makeGame=()=>{const s=createGame(9917,"historical");s.totalMinutes=4*360*DAY_MINUTES;s.cash=10000;return s;};
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.events={};
  this.id="";this.value="";this.textContent="";this.className="";this.hidden=false;this.disabled=false;}
 append(...children){this.children.push(...children);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,cb){this.events[k]=cb;}
 click(){this.events.click?.();}
}
function harness(slots,selected=null){
 const card=new Node("article"),doc={createElement:tag=>new Node(tag)};
 const fields=Object.fromEntries(["art","category","title","description","button"].map(k=>[k,new Node(k)]));
 const selectedIds=[];
 renderPs1ShopPlacement(card,fields,slots,selected,id=>selectedIds.push(id),doc);
 const select=card.children[4],box=card.children[5];
 return {card,fields,select,selectedIds,back:box.children[0],label:box.children[1],next:box.children[2],help:card.children[6]};
}
test("a porta conserva posições, nomes e save sem mutações",()=>{
 const s=makeGame(),before=JSON.stringify(s),spots=createPs1ShopPlacementPort(()=>s).snapshot();
 assert.deepEqual(spots.map(x=>x.id),ps1PlacementSlots(s).map(x=>x.id));
 assert.deepEqual(spots.map(x=>x.label),ps1PlacementSlots(s).map(ps1PlacementLabel));
 assert.equal(JSON.stringify(s),before);
});
test("seletor técnico oculto continua no cartão junto ao botão de compra",()=>{
 const x=harness(createPs1ShopPlacementPort(()=>makeGame()).snapshot());
 assert.equal(x.select.id,"ps1-placement");assert.equal(x.select.hidden,true);
 assert.equal(x.card.children[7],x.fields.button);
 assert.equal(x.select.value,x.select.children[0].value);
 assert.deepEqual(x.selectedIds,[x.select.value]);
});
test("legenda e ajuda preservam descrição acessível e orientação",()=>{
 const x=harness(createPs1ShopPlacementPort(()=>makeGame()).snapshot());
 assert.equal(x.label.id,"ps1-location-name");
 assert.equal(x.label.attrs["aria-live"],"polite");
 assert.equal(x.label.textContent,x.select.children[0].textContent);
 assert.match(x.help.textContent,/norte.*sul.*oeste.*leste/);
});
test("setas têm rótulos e botões próprios",()=>{
 const x=harness(createPs1ShopPlacementPort(()=>makeGame()).snapshot());
 assert.equal(x.back.type,"button");assert.equal(x.next.type,"button");
 assert.equal(x.back.textContent,"◀");assert.equal(x.next.textContent,"▶");
 assert.match(x.next.attrs["aria-label"],/próximo local/);
});
test("próximo local atualiza somente a escolha técnica e rótulo",()=>{
 const s=makeGame(),before=JSON.stringify(s),x=harness(createPs1ShopPlacementPort(()=>s).snapshot());
 x.next.click();
 assert.equal(x.select.value,ps1PlacementSlots(s)[1].id);
 assert.equal(x.label.textContent,ps1PlacementLabel(ps1PlacementSlots(s)[1]));
 assert.equal(x.selectedIds.at(-1),x.select.value);
 assert.equal(JSON.stringify(s),before);
});
test("seta anterior retorna à última vaga",()=>{
 const spots=createPs1ShopPlacementPort(()=>makeGame()).snapshot(),x=harness(spots);
 x.back.click();assert.equal(x.select.value,spots.at(-1).id);
});
test("seleção existente é preservada após atualização da loja",()=>{
 const spots=createPs1ShopPlacementPort(()=>makeGame()).snapshot(),x=harness(spots,spots[2].id);
 assert.equal(x.select.value,spots[2].id);assert.deepEqual(x.selectedIds,[spots[2].id]);
});
test("vaga comprada deixa de ser selecionável no próximo render",()=>{
 const s=makeGame(),occupied=ps1PlacementSlots(s)[0].id;
 assert.equal(buyPs1Station(s,occupied).ok,true);
 const spots=createPs1ShopPlacementPort(()=>s).snapshot(),x=harness(spots,occupied);
 assert.notEqual(x.select.value,occupied);assert.equal(x.select.value,spots[0].id);
});
test("zero ou uma vaga desabilita as setas sem acionar compras",()=>{
 const empty=harness([],"floor-3");
 assert.equal(empty.select.value,"");assert.deepEqual(empty.selectedIds,[null]);
 assert.equal(empty.back.disabled,true);assert.equal(empty.next.disabled,true);
 empty.next.click();assert.deepEqual(empty.selectedIds,[null]);
 const one=harness([{id:"floor-2",label:"Entrada sul"}]);
 assert.equal(one.back.disabled,true);assert.equal(one.next.disabled,true);
 assert.equal(one.select.value,"floor-2");
});
test("porta acompanha o save importado sem prender a instância anterior",()=>{
 let s=makeGame();const old=s,oldSave=JSON.stringify(s),port=createPs1ShopPlacementPort(()=>s);
 s=parseImportedSave(serializeSave(s));assert.equal(isValidSave(s),true);
 assert.equal(buyPs1Station(s,ps1PlacementSlots(s)[0].id).ok,true);
 assert.notDeepEqual(port.snapshot().map(x=>x.id),ps1PlacementSlots(old).map(x=>x.id));
 assert.equal(JSON.stringify(old),oldSave);
});
test("novas alas mantêm posições e nomes únicos",()=>{
 const s=makeGame();s.roomExtensions={west:2,east:2,north:2,south:0};
 const spots=createPs1ShopPlacementPort(()=>s).snapshot();
 assert.equal(new Set(spots.map(x=>x.id)).size,spots.length);
 for(const dir of ["oeste","leste","norte"])assert.ok(spots.some(x=>x.label.includes(dir)));
});
test("limite de camadas: UI sem motor e compra delegada ao shopControls",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/ps1ShopPlacementPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/ps1ShopPlacementPicker.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const catalog=readFileSync(new URL("ui/shopCatalogRenderer.ts",root),"utf8");
 const controls=readFileSync(new URL("ui/shopControls.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|buyPs1Station|stepGame/);
 assert.match(main,/createPs1ShopPlacementPort\(\(\)=>game\)/);
 assert.match(main,/ps1Slots:\(\)=>ps1ShopPlacementPort\.snapshot\(\)/);
 assert.match(catalog,/renderPs1ShopPlacement\(card,\{art,category,title,description,button\}/);
 assert.match(controls,/querySelector<HTMLSelectElement>\("#ps1-placement"\)/);
});
