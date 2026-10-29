import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderShopCatalog} from "../dist/js/ui/shopCatalogRenderer.js";

function element(tag){
 const children=[],listeners=new Map();
 return {
  tagName:tag.toUpperCase(),children,dataset:{},attributes:{},hidden:false,
  className:"",disabled:false,textContent:"",scrollTop:9,
  append(...nodes){children.push(...nodes);},
  replaceChildren(...nodes){children.splice(0,children.length,...nodes);},
  before(node){children.push(node);},
  after(node){children.push(node);},
  setAttribute(k,v){this.attributes[k]=v;},
  addEventListener(type,handler){listeners.set(type,handler);},
  fire(type){listeners.get(type)?.();},
  getContext:()=>null,toDataURL:()=>"data:image/png;base64,AA==",
  querySelector:()=>null,querySelectorAll:()=>[],
  closest:()=>null
 };
}
const products=[
 {id:"computer",label:"Computador",category:"Hardware",description:"Novo PC"},
 {id:"printer",label:"Impressora",category:"Serviços",description:"Impressão"},
 {id:"disc-copier",label:"Copiadora",category:"Serviços",description:"CD"},
 {id:"ps1",label:"PlayStation",category:"Consoles",description:"Bancada"},
 {id:"extend-west",label:"Expandir",category:"Obra",description:"Ala"},
 {id:"plant",label:"Planta",category:"Decoração",description:"Vaso"}
];
function fixture({category="equipment",items=products,discs=null,slots=[{id:"a",label:"Norte"},{id:"b",label:"Oeste"}]}={}){
 const calls=[],host=element("section");
 host.append(element("p"));
 const doc={createElement:tag=>element(tag)};
 let selected=null,current=category;
 const options={
  host,doc,items,currentCategory:()=>{calls.push(["category",current]);return current;},
  renderOverview:()=>calls.push(["overview"]),
  offer:id=>{calls.push(["offer",id]);return {
   disabled:false,text:"Comprar "+id,placementHint:"Encaixe",ownedText:null
  };},
  service:id=>{calls.push(["service",id]);return {
   disabled:true,title:"Sem caixa",text:"Indisponível "+id
  };},
  ps1Offer:()=>{calls.push(["ps1Offer"]);return {disabled:false,text:"Comprar PS1"};},
  ps1Slots:()=>{calls.push(["ps1Slots"]);return slots;},
  selectedPs1Slot:()=>selected,
  selectPs1Slot:id=>{selected=id;calls.push(["selected",id]);},
  discs:{snapshot:()=>{calls.push(["discs"]);return discs;}}
 };
 const render=()=>renderShopCatalog(options);
 return {render,options,host,doc,calls,selected:()=>selected,
  category:v=>{current=v;},setSelected:v=>{selected=v;}};
}
test("a loja atualiza cabeçalho antes de reconstruir cartões",()=>{
 const x=fixture();x.render();
 assert.deepEqual(x.calls[0],["overview"]);
 assert.equal(x.host.children.length,3);
});
test("a categoria equipamentos exibe apenas seus três produtos",()=>{
 const x=fixture();x.render();
 assert.deepEqual(x.calls.filter(c=>c[0]==="offer").map(c=>c[1]),
  ["computer","printer","disc-copier"]);
});
test("a aba consoles seleciona exclusivamente a bancada PS1",()=>{
 const x=fixture({category:"consoles"});x.render();
 assert.deepEqual(x.calls.filter(c=>c[0]==="offer").map(c=>c[1]),["ps1"]);
});
test("a categoria construção não exibe decorações",()=>{
 const x=fixture({category:"building"});x.render();
 assert.deepEqual(x.calls.filter(c=>c[0]==="offer").map(c=>c[1]),["extend-west"]);
});
test("a categoria decoração não consulta preços de equipamentos",()=>{
 const x=fixture({category:"decoration"});x.render();
 assert.deepEqual(x.calls.filter(c=>c[0]==="offer").map(c=>c[1]),["plant"]);
});
test("a categoria atual é consultada em tempo real a cada desenho",()=>{
 const x=fixture();x.render();x.category("decoration");x.render();
 assert.deepEqual(x.calls.filter(c=>c[0]==="offer").map(c=>c[1]).slice(-1),["plant"]);
});
test("o host descarta a árvore anterior antes de recriar",()=>{
 const x=fixture();x.render();const original=x.host.children[0];
 x.render();assert.equal(x.host.children.length,3);
 assert.notEqual(x.host.children[0],original);
});
test("o cartão regular mantém o botão delegado com data-buy",()=>{
 const x=fixture({items:[products[0]]});x.render();
 const card=x.host.children[0];
 assert.equal(card.tagName,"ARTICLE");
 assert.ok(card.children.some(node=>node.dataset.buy==="computer"));
});
test("uma compra de impressora usa cotação própria sem alterar a oferta de outros itens",()=>{
 const x=fixture({items:[products[1]]});x.render();
 const button=x.host.children[0].children.find(c=>c.tagName==="BUTTON");
 assert.deepEqual(x.calls.filter(c=>c[0]==="service"),[["service","printer"]]);
 assert.equal(button.disabled,true);
 assert.equal(button.textContent,"Indisponível printer");
});
test("uma compra de copiadora consulta serviço específico",()=>{
 const x=fixture({items:[products[2]]});x.render();
 assert.deepEqual(x.calls.filter(c=>c[0]==="service"),[["service","disc-copier"]]);
});
test("cartão regular recebe dica de encaixe antes do botão",()=>{
 const x=fixture({items:[products[0]]});x.render();
 const parts=x.host.children[0].children;
 assert.equal(parts.at(-2).textContent,"Encaixe");
 assert.equal(parts.at(-1).dataset.buy,"computer");
});
test("cartão adquirido mantém o rótulo após o botão",()=>{
 const x=fixture({items:[products[0]]});
 x.options.offer=id=>({disabled:false,text:id,placementHint:null,ownedText:"Comprado"});
 x.render();assert.equal(x.host.children[0].children.at(-1).textContent,"Comprado");
});
test("oferta PS1 sobrepõe botão genérico e mantém seletor de posição",()=>{
 const x=fixture({category:"consoles"});x.render();
 const card=x.host.children[0],button=card.children.find(e=>e.dataset.buy==="ps1");
 assert.equal(button.textContent,"Comprar PS1");
 assert.ok(card.children.some(e=>e.id==="ps1-placement"));
});
test("o seletor PS1 mantém primeira posição e atualiza seleção",()=>{
 const x=fixture({category:"consoles"});x.render();
 assert.equal(x.selected(),"a");
 assert.deepEqual(x.calls.filter(c=>c[0]==="selected"),[["selected","a"]]);
});
test("o seletor PS1 conserva posição anteriormente escolhida",()=>{
 const x=fixture({category:"consoles"});x.setSelected("b");x.render();
 assert.equal(x.selected(),"b");
});
test("sem vagas PS1 informa seleção vazia",()=>{
 const x=fixture({category:"consoles",slots:[]});x.render();
 assert.equal(x.selected(),null);
 assert.deepEqual(x.calls.filter(c=>c[0]==="selected"),[["selected",null]]);
});
test("catálogo de CDs só é consultado quando aberto em consoles",()=>{
 const x=fixture();x.render();assert.equal(x.calls.some(c=>c[0]==="discs"),false);
 x.category("consoles");x.render();
 assert.equal(x.calls.filter(c=>c[0]==="discs").length,1);
});
test("sem resultado de CDs não cria heading nem cartões extras",()=>{
 const x=fixture({category:"consoles"});x.render();
 assert.equal(x.host.children.length,1);
});
test("CDs reais aparecem depois da bancada, preservando botões delegados",()=>{
 const row={id:"corrida",title:"Corrida",genre:"Aventura",copies:1,
  price:20,noStation:false,full:false,disabled:false};
 const x=fixture({category:"consoles",discs:[row]});x.render();
 assert.equal(x.host.children.length,4);
 assert.equal(x.host.children[3].children.find(n=>n.tagName==="BUTTON").dataset.buyPs1Disc,"corrida");
});
test("ofertas são atualizadas em toda renderização sem cache próprio",()=>{
 const x=fixture({items:[products[0]]});x.render();x.render();
 assert.equal(x.calls.filter(c=>c[0]==="offer").length,2);
});
test("a composição usa apenas DTOs e nenhuma regra de compra ou save",()=>{
 const src=readFileSync(new URL("../src/ui/shopCatalogRenderer.ts",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(src,/\b(GameState|buyComputer|applyResult|localStorage|requestAnimationFrame|stepGame)\b/);
 assert.match(main,/renderShopCatalog\(\{/);
 assert.match(main,/offer:id=>shopCatalogOffersPort\.snapshot\(id\)/);
 assert.match(main,/service:id=>shopServiceOffersPort\.snapshot\(id\)/);
 assert.match(main,/items:SHOP_CATALOG/);
 assert.match(main,/if\(!panelChanged\("shop",/);
});
