import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SHOP_CATALOG} from "../dist/js/sim/shop.js";
import {createShopCatalogCard,appendStandardShopCatalogCard,appendShopCatalogOwned} from "../dist/js/ui/shopCatalogCard.js";

class Node {
 constructor(tag,doc){
  this.tag=tag;this.doc=doc;this.children=[];this.dataset={};this.attrs={};
  this.className="";this.innerHTML="";this.textContent="";this.type="";
  this.src="";this.alt="";this.width=0;this.height=0;this.disabled=false;
 }
 setAttribute(key,value){this.attrs[key]=value;}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=[...items];}
 getContext(type){
  assert.equal(this.tag,"canvas");assert.equal(type,"2d");
  return null;
 }
 toDataURL(){
  assert.equal(this.tag,"canvas");
  assert.equal(this.width,640);assert.equal(this.height,360);
  return "data:image/png;mock="+this.doc.createdCanvas++;
 }
}
function doc(){
 const document={created:[],createdCanvas:0,createElement(tag){
  const el=new Node(tag,document);document.created.push(el);return el;
 }};
 return document;
}
const get=id=>SHOP_CATALOG.find(x=>x.id===id);

test("cartão conserva artigo, classes, dados e acessibilidade",()=>{
 const document=doc(),item=get("computer"),fields=createShopCatalogCard(item,document);
 assert.equal(fields.card.tag,"article");
 assert.equal(fields.card.className,"shop-card");
 assert.equal(fields.art.tag,"div");
 assert.equal(fields.art.className,"shop-art");
 assert.equal(fields.art.dataset.item,item.id);
 assert.equal(fields.art.attrs["aria-hidden"],"true");
 assert.equal(fields.button.type,"button");
 assert.equal(fields.button.dataset.buy,item.id);
 assert.equal(fields.card.children.length,0);
});
test("rótulos da loja preservam conteúdo e nomes de elementos",()=>{
 const document=doc(),item=get("plant"),v=createShopCatalogCard(item,document);
 assert.equal(v.title.tag,"h3");assert.equal(v.title.textContent,item.label);
 assert.equal(v.category.tag,"small");assert.equal(v.category.textContent,item.category);
 assert.equal(v.description.tag,"p");assert.equal(v.description.textContent,item.description);
});
test("ícone de computadores utiliza símbolo existente",()=>{
 const v=createShopCatalogCard(get("computer-annex"),doc());
 assert.match(v.art.innerHTML,/icons\.svg#computer/);
 assert.equal(v.art.children.length,0);
});
test("expansões mantêm ícone compartilhado",()=>{
 for(const id of ["expand","extend-west","extend-east","extend-north"]){
  const v=createShopCatalogCard(get(id),doc());
  assert.match(v.art.innerHTML,/icons\.svg#expand/,id);
 }
});
test("móveis mantêm ícones próprios e não geram Canvas",()=>{
 for(const id of ["poster","plant","table"]){
  const document=doc(),v=createShopCatalogCard(get(id),document);
  assert.match(v.art.innerHTML,new RegExp("icons\\.svg#"+id));
  assert.equal(document.created.filter(x=>x.tag==="canvas").length,0);
 }
});
test("miniaturas de impressora, copiadora e PS1 substituem o SVG",()=>{
 for(const id of ["printer","disc-copier","ps1"]){
  const document=doc(),v=createShopCatalogCard(get(id),document);
  assert.equal(v.art.innerHTML,"");
  assert.equal(v.art.children.length,1);
  assert.equal(v.art.children[0].tag,"img");
  assert.equal(v.art.children[0].alt,"");
  assert.match(v.art.children[0].src,/^data:image\/png;mock=/);
  assert.equal(document.created.filter(x=>x.tag==="canvas").length<=1,true);
 }
});
test("miniaturas são reutilizadas sem criar novo Canvas",()=>{
 const id="printer",a=doc(),b=doc();
 const first=createShopCatalogCard(get(id),a),second=createShopCatalogCard(get(id),b);
 assert.equal(first.art.children[0].src,second.art.children[0].src);
 assert.equal(b.created.some(x=>x.tag==="canvas"),false);
});
test("cartões comuns mantêm ordem dos nós e o botão de compra",()=>{
 const document=doc(),fields=createShopCatalogCard(get("computer"),document);
 appendStandardShopCatalogCard(fields,null,document);
 assert.deepEqual(fields.card.children,[fields.art,fields.category,fields.title,fields.description,fields.button]);
 assert.equal(fields.card.children.at(-1).dataset.buy,"computer");
});
test("mensagem de posição mantém classe, texto e ordem original",()=>{
 const document=doc(),fields=createShopCatalogCard(get("extend-west"),document);
 appendStandardShopCatalogCard(fields,"Próxima compra: +2 de espaço.",document);
 assert.deepEqual(fields.card.children.slice(0,4),[fields.art,fields.category,fields.title,fields.description]);
 const hint=fields.card.children[4];
 assert.equal(hint.tag,"small");
 assert.equal(hint.className,"shop-purchase-status");
 assert.equal(hint.textContent,"Próxima compra: +2 de espaço.");
 assert.equal(fields.card.children[5],fields.button);
});
test("texto de móveis instalados aparece após o botão",()=>{
 const document=doc(),fields=createShopCatalogCard(get("table"),document);
 appendStandardShopCatalogCard(fields,null,document);
 appendShopCatalogOwned(fields.card,"Instalados: 2 · posições livres: 8",document);
 assert.equal(fields.card.children.at(-2),fields.button);
 assert.equal(fields.card.children.at(-1).tag,"span");
 assert.equal(fields.card.children.at(-1).textContent,"Instalados: 2 · posições livres: 8");
});
test("PS1 conserva cartão vazio para o seletor de posição existente",()=>{
 const document=doc(),fields=createShopCatalogCard(get("ps1"),document);
 assert.deepEqual(fields.card.children,[]);
 assert.equal(fields.button.dataset.buy,"ps1");
 assert.equal(fields.art.dataset.item,"ps1");
});
test("somente apresentação: sem motor, sem listeners e mesmos pontos de integração",()=>{
 const root=new URL("../src/",import.meta.url);
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/shopCatalogCard.ts",root),"utf8");
 const controls=readFileSync(new URL("ui/shopControls.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|stepGame|buyPs1Station|shopPrice|addEventListener|localStorage/);
 assert.doesNotMatch(main,/\bshopArtwork\b|\bdrawPrinterShop\b|\bdrawDiscCopier\b|\bdrawPs1Station\b|\bcatalogueIcon\b/);
 assert.match(main,/createShopCatalogCard\(item,document\)/);
 assert.match(main,/appendStandardShopCatalogCard\(fields,placementHint,document\)/);
 assert.match(main,/appendShopCatalogOwned\(card,/);
 assert.match(main,/renderPs1ShopPlacement\(card,\{art,category,title,description,button\}/);
 assert.match(controls,/querySelector<HTMLSelectElement>\("#ps1-placement"\)/);
});
