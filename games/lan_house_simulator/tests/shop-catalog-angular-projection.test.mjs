import test from "node:test";
import assert from "node:assert/strict";
import {
 regularShopCardView,shopCardIcon,publishAngularShopCatalog
} from "../dist/js/ui/shopCatalogAngularProjection.js";

const computer={
 id:"computer",label:"Computador",category:"Hardware",
 description:"Novo PC para o salão"
};
const offer={
 disabled:false,text:"Comprar · R$ 320",
 placementHint:"A passagem para a cadeira deve ficar livre.",
 ownedText:"Instalados: 3"
};

test("Angular card preserves original quote, ownership and placement guidance",()=>{
 const card=regularShopCardView(computer,offer,null,null);
 assert.deepEqual({
  id:card.id,label:card.label,category:card.category,
  text:card.buttonText,disabled:card.disabled,
  hint:card.placementHint,owned:card.ownedText,icon:card.icon
 },{
  id:"computer",label:"Computador",category:"Hardware",
  text:"Comprar · R$ 320",disabled:false,
  hint:"A passagem para a cadeira deve ficar livre.",
  owned:"Instalados: 3",icon:"computer"
 });
 assert.equal(card.artworkSrc,null);
 assert.equal(card.buttonTitle,"");
});

test("counter service quote overrides default shop button without changing the price",()=>{
 const item={...computer,id:"printer",label:"Impressora"};
 const service={disabled:true,text:"Adquirida · serviço ativo",title:"Já instalada"};
 const card=regularShopCardView(item,offer,service,"data:image/png;base64,YQ==");
 assert.equal(card.disabled,true);
 assert.equal(card.buttonText,"Adquirida · serviço ativo");
 assert.equal(card.buttonTitle,"Já instalada");
 assert.equal(card.artworkSrc,"data:image/png;base64,YQ==");
 assert.equal(card.placementHint,offer.placementHint);
});

test("regular product lock cannot be bypassed by Angular",()=>{
 const card=regularShopCardView(computer,{...offer,disabled:true,text:"Caixa insuficiente"},null,null);
 assert.equal(card.disabled,true);
 assert.equal(card.buttonText,"Caixa insuficiente");
});

test("shop icon names are constrained to local icon sprite identifiers",()=>{
 assert.equal(shopCardIcon("computer-annex"),"computer");
 assert.equal(shopCardIcon("extend-east"),"expand");
 assert.equal(shopCardIcon("plant"),"plant");
 assert.equal(shopCardIcon("invented-id#javascript:alert(1)"),"computer");
});

test("snapshot event is dormant without a matching Angular host",()=>{
 const events=[];
 const doc={
  getElementById:()=>null,
  dispatchEvent:event=>events.push(event)
 };
 publishAngularShopCatalog(doc,{
  category:"equipment",cards:[],consolesPending:false
 });
 assert.equal(events.length,0);
});

test("snapshot event contains only read-only card data when Angular host exists",()=>{
 if(typeof CustomEvent!=="function")return;
 const events=[];
 const doc={
  getElementById:id=>id==="angular-shop-catalog"?{}:null,
  dispatchEvent:event=>events.push(event)
 };
 const cards=[regularShopCardView(computer,offer,null,null)];
 publishAngularShopCatalog(doc,{
  category:"equipment",cards,consolesPending:false
 });
 assert.equal(events.length,1);
 assert.equal(events[0].type,"lhs:shop-cards-updated");
 assert.equal(events[0].detail.cards[0].buttonText,"Comprar · R$ 320");
});
