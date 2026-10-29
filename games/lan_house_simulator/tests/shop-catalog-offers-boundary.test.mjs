import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {SHOP_CATALOG,shopPrice,furnitureLimit,availablePlacementSlots} from "../dist/js/sim/shop.js";
import {availableAnnexComputers} from "../dist/js/sim/stations.js";
import {MAX_EXTENSION_LEVEL,expandDirection} from "../dist/js/sim/room.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {shopPlacementStatus,shopPurchaseButtonText} from "../dist/js/ui/shopGuidance.js";
import {createShopCatalogOffersPort} from "../dist/js/application/shopCatalogOffersPort.js";
import {renderShopCatalogOfferButton} from "../dist/js/ui/shopCatalogOfferButton.js";

function harness(){
 let s=createGame(5001,"historical");s.cash=10000;
 const port=createShopCatalogOffersPort(()=>s,()=>availableAnnexComputers(s).length);
 return {port,get game(){return s;},replace:next=>{s=next;}};
}
function originalOffer(s,id){
 const max=(id==="poster"||id==="plant"||id==="table")?furnitureLimit(s,id):0;
 const count=s.furniture?.[id]??0;
 const ext=id.startsWith("extend-")?id.slice(7):null;
 const full=id==="door"?!(s.interiorWalls?.length):
  id==="computer-annex"?!availableAnnexComputers(s).length:
  ext?(s.roomExtensions?.[ext]??0)>=MAX_EXTENSION_LEVEL:
  id==="expand"?s.expansionLevel>=2:
  id==="computer"?((s.installedPcs??(3+s.expansionLevel*2))>=3+s.expansionLevel*2):
  max>0&&(count>=max||!availablePlacementSlots(s,id).length);
 const price=shopPrice(s,id),poor=s.cash<price;
 return {
  disabled:full||poor,
  text:shopPurchaseButtonText(id,full,poor,price,max>0),
  placementHint:shopPlacementStatus(s,id),
  ownedText:max>0?"Instalados: "+count+" · posições livres: "+availablePlacementSlots(s,id).length:null
 };
}
test("os 14 itens mantêm ofertas e dicas exatamente iguais às originais",()=>{
 const x=harness(),before=JSON.stringify(x.game);
 assert.equal(SHOP_CATALOG.length,14);
 for(const item of SHOP_CATALOG)assert.deepEqual(x.port.snapshot(item.id),originalOffer(x.game,item.id),item.id);
 assert.equal(JSON.stringify(x.game),before);
});
test("sem saldo mantém texto de bloqueio e preço sem modificar dinheiro",()=>{
 const x=harness();x.game.cash=0;
 for(const id of ["computer","computer-annex","expand","extend-west","poster","wall"]){
  const v=x.port.snapshot(id);
  assert.equal(v.disabled,true);
  assert.deepEqual(v,originalOffer(x.game,id));
 }
});
test("saldo exato de computador permite iniciar compra",()=>{
 const x=harness();x.game.expansionLevel=1;x.game.installedPcs=3;x.game.cash=shopPrice(x.game,"computer");
 const v=x.port.snapshot("computer");
 assert.equal(v.disabled,false);
 assert.equal(v.text,"Instalar PC · R$ 320");
});
test("limite de PCs principais permanece independente das vagas de anexo",()=>{
 const x=harness();x.game.installedPcs=3;
 assert.equal(x.port.snapshot("computer").text,"Sem vaga na área principal");
 x.game.expansionLevel=1;
 assert.equal(x.port.snapshot("computer").disabled,false);
 assert.equal(x.port.snapshot("computer").text,"Instalar PC · R$ 320");
});
test("PC de anexo solicita ampliação antes de oferecer vaga",()=>{
 const x=harness();
 assert.equal(x.port.snapshot("computer-annex").text,"Sem vaga na ampliação");
 assert.match(x.port.snapshot("computer-annex").placementHint,/Primeiro amplie/);
});
test("ampliação real libera a seleção da vaga de PC em anexo",()=>{
 const x=harness(),s=x.game;
 assert.equal(expandDirection(s,"west").ok,true);
 const v=x.port.snapshot("computer-annex");
 assert.equal(v.disabled,false);
 assert.equal(v.text,"Escolher vaga · R$ 320");
 assert.match(v.placementHint,/1 vaga livre/);
 assert.equal(isValidSave(s),true);
});
test("expansão principal informa limite de duas compras",()=>{
 const x=harness();
 x.game.expansionLevel=2;
 const v=x.port.snapshot("expand");
 assert.equal(v.disabled,true);
 assert.equal(v.text,"Limite da área principal");
 assert.deepEqual(v,originalOffer(x.game,"expand"));
});
test("limite direcional conserva preço e aviso em cada ala",()=>{
 const x=harness();
 x.game.roomExtensions={west:5,east:5,north:5,south:0};
 for(const id of ["extend-west","extend-east","extend-north"]){
  const v=x.port.snapshot(id);
  assert.equal(v.disabled,true);
  assert.equal(v.text,"Limite nesta direção");
  assert.deepEqual(v,originalOffer(x.game,id));
 }
});
test("porta precisa de divisória, enquanto construir parede permanece livre",()=>{
 const x=harness();
 assert.equal(x.port.snapshot("door").disabled,true);
 assert.equal(x.port.snapshot("wall").disabled,false);
 x.game.interiorWalls=[{axis:"x",x:2,y:2}];
 assert.equal(x.port.snapshot("door").disabled,false);
 assert.equal(x.port.snapshot("door").text,"Comprar · R$ 80");
});
test("móveis preservam texto de instalados e posições livres",()=>{
 const x=harness();
 for(const id of ["poster","plant","table"]){
  const v=x.port.snapshot(id);
  assert.equal(v.disabled,false);
  assert.match(v.ownedText,/^Instalados: 0 · posições livres: \d+$/);
  assert.deepEqual(v,originalOffer(x.game,id));
 }
});
test("móveis sem caixa conservam informações de posições",()=>{
 const x=harness();x.game.cash=0;
 const v=x.port.snapshot("plant");
 assert.equal(v.disabled,true);
 assert.equal(v.text,"Caixa insuficiente · R$ 85");
 assert.match(v.ownedText,/posições livres:/);
});
test("serviços e PS1 mantêm o estado genérico antes das ofertas especializadas",()=>{
 const x=harness();
 for(const id of ["printer","disc-copier","ps1"]){
  const v=x.port.snapshot(id);
  assert.equal(v.disabled,false);
  assert.equal(v.placementHint,null);
  assert.equal(v.ownedText,null);
  assert.deepEqual(v,originalOffer(x.game,id));
 }
});
test("consulta repete o resultado sem gravar dados no save",()=>{
 const x=harness(),before=JSON.stringify(x.game);
 const first=x.port.snapshot("table");
 assert.deepEqual(x.port.snapshot("table"),first);
 assert.equal(JSON.stringify(x.game),before);
});
test("importação de save usa instância substituída e preserva a antiga",()=>{
 const x=harness(),old=x.game,before=JSON.stringify(old);
 let next=parseImportedSave(serializeSave(old));
 assert.equal(isValidSave(next),true);
 next.cash=5;x.replace(next);
 assert.deepEqual(x.port.snapshot("computer"),originalOffer(next,"computer"));
 assert.equal(JSON.stringify(old),before);
});
test("render de botão não altera o data-buy nem cria listeners",()=>{
 const x=harness(),button={disabled:true,textContent:"",dataset:{buy:"computer"},title:""};
 renderShopCatalogOfferButton(button,x.port.snapshot("computer"));
 assert.equal(button.disabled,false);
 assert.equal(button.textContent,x.port.snapshot("computer").text);
 assert.equal(button.dataset.buy,"computer");
 x.game.cash=0;
 renderShopCatalogOfferButton(button,x.port.snapshot("computer"));
 assert.equal(button.disabled,true);
 assert.equal(button.dataset.buy,"computer");
});
test("UI continua sem dependência do motor e as compras usam controlador",()=>{
 const root=new URL("../src/",import.meta.url);
 const main=readFileSync(new URL("main.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/shopCatalogOfferButton.ts",root),"utf8");
 const legacy=readFileSync(new URL("ui/shopGuidance.ts",root),"utf8");
 const port=readFileSync(new URL("application/shopCatalogOffersPort.ts",root),"utf8");
 const app=readFileSync(new URL("application/shopCatalogGuidance.ts",root),"utf8");
 const controls=readFileSync(new URL("ui/shopControls.ts",root),"utf8");
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|shopPrice|buyComputer|addEventListener/);
 assert.doesNotMatch(legacy,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(port,/\b(document|window|HTMLElement)\b/);
 assert.doesNotMatch(app,/\b(document|window|HTMLElement)\b/);
 assert.match(main,/createShopCatalogOffersPort\(\(\)=>game,\(\)=>placementActions\.availableAnnex\(\)\.length\)/);
 assert.match(main,/const offer=shopCatalogOffersPort\.snapshot\(item\.id\)/);
 assert.match(main,/renderShopCatalogOfferButton\(button,offer\)/);
 assert.match(main,/renderShopServiceOffer\(button,shopServiceOffersPort\.snapshot\(item\.id\)\)/);
 assert.match(main,/renderPs1ShopOfferButton\(button,ps1ShopOfferPort\.snapshot\(\)\)/);
 assert.match(controls,/port\.purchase\(id,ps1Slot\)/);
});
