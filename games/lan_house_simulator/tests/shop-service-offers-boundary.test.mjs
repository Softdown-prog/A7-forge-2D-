import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {shopPrice} from "../dist/js/sim/shop.js";
import {quotePrinter,buyPrinter} from "../dist/js/sim/printService.js";
import {quoteDiscCopier,buyDiscCopier} from "../dist/js/sim/discCopy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createShopServiceOffersPort} from "../dist/js/application/shopServiceOffersPort.js";
import {renderShopServiceOffer} from "../dist/js/ui/shopServiceOfferButton.js";
function inYear(year=1998,mode="historical"){
 const s=createGame(9918,mode);
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;
 s.cash=10000;
 return s;
}
const offers=s=>createShopServiceOffersPort(()=>s);
test("as cotações da loja são puras e preservam RNG e preços",()=>{
 const s=inYear(2002),before=JSON.stringify(s),port=offers(s);
 for(const id of ["printer","disc-copier"]){
  const x=port.snapshot(id);
  assert.equal(x.disabled,false);
  assert.equal(x.text,"Comprar · R$ "+shopPrice(s,id));
 }
 assert.equal(JSON.stringify(s),before);
});
test("impressora fica disponível desde 1998",()=>{
 const s=inYear(),x=offers(s).snapshot("printer");
 assert.equal(x.disabled,false);
 assert.equal(x.title,quotePrinter(s).message);
 assert.equal(x.text,"Comprar · R$ 320");
});
test("impressora: dinheiro insuficiente e valor exato",()=>{
 const s=inYear();s.cash=319;
 const x=offers(s).snapshot("printer");
 assert.equal(x.disabled,true);
 assert.equal(x.title,quotePrinter(s).message);
 assert.equal(x.text,"Caixa insuficiente · R$ 320");
 s.cash=320;
 assert.equal(offers(s).snapshot("printer").disabled,false);
});
test("impressora comprada não aparece disponível para duplicar",()=>{
 const s=inYear();assert.equal(buyPrinter(s).ok,true);
 const x=offers(s).snapshot("printer");
 assert.equal(x.disabled,true);
 assert.equal(x.title,quotePrinter(s).message);
 assert.equal(x.text,"Adquirida · serviço ativo");
});
test("copiadora bloqueada antes de 2001 com cotação preservada",()=>{
 const s=inYear(2000),x=offers(s).snapshot("disc-copier");
 assert.equal(x.disabled,true);
 assert.equal(x.title,quoteDiscCopier(s).message);
 assert.equal(x.text,"🔒 Disponível em 2001");
});
test("copiadora liberada a partir de 2001",()=>{
 const s=inYear(2001),x=offers(s).snapshot("disc-copier");
 assert.equal(x.disabled,false);
 assert.equal(x.title,quoteDiscCopier(s).message);
 assert.equal(x.text,"Comprar · R$ 900");
});
test("copiadora: saldo R$ 899 bloqueia, R$ 900 habilita",()=>{
 const s=inYear(2001);s.cash=899;
 const x=offers(s).snapshot("disc-copier");
 assert.equal(x.disabled,true);
 assert.equal(x.title,quoteDiscCopier(s).message);
 assert.equal(x.text,"Caixa insuficiente · R$ 900");
 s.cash=900;
 assert.equal(offers(s).snapshot("disc-copier").disabled,false);
});
test("copiadora instalada continua desativada e com label de serviço",()=>{
 const s=inYear(2001);assert.equal(buyDiscCopier(s).ok,true);
 const x=offers(s).snapshot("disc-copier");
 assert.equal(x.disabled,true);
 assert.equal(x.title,quoteDiscCopier(s).message);
 assert.equal(x.text,"Adquirida · serviço ativo");
});
test("modo clássico preserva serviço e valor do catálogo",()=>{
 const s=inYear(2001,"classic"),port=offers(s);
 assert.equal(port.snapshot("printer").disabled,false);
 assert.equal(port.snapshot("disc-copier").disabled,false);
 assert.equal(port.snapshot("disc-copier").text,"Comprar · R$ 900");
});
test("porta acompanha save importado sem alterar instância antiga",()=>{
 let s=inYear(2002);const port=createShopServiceOffersPort(()=>s);
 const old=s,before=JSON.stringify(s);
 s=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(s),true);
 assert.equal(buyPrinter(s).ok,true);
 assert.equal(buyDiscCopier(s).ok,true);
 assert.equal(port.snapshot("printer").text,"Adquirida · serviço ativo");
 assert.equal(port.snapshot("disc-copier").text,"Adquirida · serviço ativo");
 assert.equal(JSON.stringify(old),before);
});
test("render altera somente estado, título e texto do botão",()=>{
 const s=inYear(2001),button={disabled:true,title:"antigo",textContent:"antigo",dataset:{buy:"disc-copier"}};
 renderShopServiceOffer(button,offers(s).snapshot("disc-copier"));
 assert.equal(button.disabled,false);
 assert.equal(button.title,quoteDiscCopier(s).message);
 assert.equal(button.textContent,"Comprar · R$ 900");
 assert.equal(button.dataset.buy,"disc-copier");
 s.cash=0;
 renderShopServiceOffer(button,offers(s).snapshot("disc-copier"));
 assert.equal(button.disabled,true);
 assert.equal(button.textContent,"Caixa insuficiente · R$ 900");
});
test("fronteira: render sem motor; compra permanece delegada",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/shopServiceOffersPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/shopServiceOfferButton.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const shop=readFileSync(new URL("ui/shopControls.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|quotePrinter|quoteDiscCopier|buyPrinter|buyDiscCopier/);
 assert.match(main,/createShopServiceOffersPort\(\(\)=>game\)/);
 assert.match(main,/renderShopServiceOffer\(button,shopServiceOffersPort\.snapshot\(item\.id\)\)/);
 assert.doesNotMatch(main,/\bquotePrinter\b|\bquoteDiscCopier\b/);
 assert.match(shop,/port\.purchase\(id,ps1Slot\)/);
});
