import test from "node:test";
import assert from "node:assert/strict";
import {createGame,isValidSave,pcCount} from "../dist/js/sim/engine.js";
import {buyComputer,nextComputerPlacementIssue,shopPrice} from "../dist/js/sim/shop.js";
import {expandShop} from "../dist/js/sim/economy.js";
import {fixedLayoutObjects} from "../dist/js/sim/layoutGeometry.js";
import {createShopCatalogOffersPort} from "../dist/js/application/shopCatalogOffersPort.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

function setup(){
 let game=createGame(7901,"historical");game.cash=10000;
 const offers=createShopCatalogOffersPort(()=>game,()=>0);
 return {offers,get game(){return game;},swap:s=>{game=s;}};
}
function nextPcLocation(game){
 const count=game.installedPcs??3+game.expansionLevel*2;
 const preview={...game,installedPcs:count+1};
 const next=fixedLayoutObjects(preview).find(o=>o.id==="pc:"+count);
 assert.ok(next,"próximo PC disponível no layout");
 return next;
}
function blockNextPc(game){
 const pc=nextPcLocation(game);
 game.objectPlacements=[{id:"shelf",x:pc.x,y:pc.y,rotation:0}];
}
test("salão inicial continua exigindo expansão antes de oferecer quarto PC",()=>{
 const x=setup();
 assert.match(nextComputerPlacementIssue(x.game),/Amplie/);
 assert.equal(x.offers.snapshot("computer").text,"Sem vaga na área principal");
});
test("após a expansão, a posição disponível é aprovada sem cobrança",()=>{
 const x=setup();assert.equal(expandShop(x.game).ok,true);
 const before=JSON.stringify(x.game);
 assert.equal(nextComputerPlacementIssue(x.game),null);
 assert.equal(x.offers.snapshot("computer").disabled,false);
 assert.equal(JSON.stringify(x.game),before);
});
test("posição física bloqueada desativa compra na loja, embora exista vaga numérica",()=>{
 const x=setup();assert.equal(expandShop(x.game).ok,true);
 blockNextPc(x.game);
 const offer=x.offers.snapshot("computer");
 assert.equal(offer.disabled,true);
 assert.equal(offer.text,"Posição do próximo PC bloqueada");
 assert.match(offer.placementHint,/3\/5 PCs/);
 assert.match(offer.placementHint,/Próximo PC sem encaixe/);
 assert.match(offer.placementHint,/Reorganize o salão/);
});
test("a prévia e o botão usam o mesmo motivo da recusa",()=>{
 const x=setup();expandShop(x.game);blockNextPc(x.game);
 const before=JSON.stringify(x.game),message=nextComputerPlacementIssue(x.game);
 assert.equal(buyComputer(x.game).ok,false);
 assert.equal(buyComputer(x.game).message,message);
 assert.equal(JSON.stringify(x.game),before);
});
test("reorganizar o objeto bloqueador reabilita o botão sem reiniciar",()=>{
 const x=setup();expandShop(x.game);blockNextPc(x.game);
 assert.equal(x.offers.snapshot("computer").disabled,true);
 x.game.objectPlacements=[];
 assert.equal(x.offers.snapshot("computer").disabled,false);
 assert.equal(x.offers.snapshot("computer").text,"Instalar PC · R$ 320");
});
test("saldo insuficiente continua prioritário mesmo com encaixe bloqueado",()=>{
 const x=setup();expandShop(x.game);blockNextPc(x.game);
 x.game.cash=0;
 const offer=x.offers.snapshot("computer");
 assert.equal(offer.disabled,true);
 assert.equal(offer.text,"Caixa insuficiente · R$ "+shopPrice(x.game,"computer"));
 assert.match(offer.placementHint,/Reorganize o salão/);
});
test("compra válida é cobrada uma única vez",()=>{
 const x=setup();expandShop(x.game);
 const before=x.game.cash,spent=x.game.expenses;
 assert.equal(nextComputerPlacementIssue(x.game),null);
 assert.equal(buyComputer(x.game).ok,true);
 assert.equal(x.game.cash,before-320);
 assert.equal(x.game.expenses,spent+320);
 assert.equal(pcCount(x.game),4);
});
test("a progressão completa permite 5 e 7 PCs sem travar artificialmente",()=>{
 const x=setup();expandShop(x.game);
 for(const count of [4,5]){
  assert.equal(nextComputerPlacementIssue(x.game),null,"prévia no PC "+count);
  assert.equal(buyComputer(x.game).ok,true,"compra PC "+count);
 }
 assert.equal(x.offers.snapshot("computer").disabled,true);
 assert.equal(expandShop(x.game).ok,true);
 for(const count of [6,7]){
  assert.equal(nextComputerPlacementIssue(x.game),null,"prévia no PC "+count);
  assert.equal(x.offers.snapshot("computer").disabled,false,"oferta PC "+count);
  assert.equal(buyComputer(x.game).ok,true,"compra PC "+count);
 }
 assert.equal(pcCount(x.game),7);
 assert.equal(x.offers.snapshot("computer").text,"Sem vaga na área principal");
 assert.equal(isValidSave(x.game),true);
});
test("no limite 7/7 o botão permanece bloqueado, mesmo com dinheiro",()=>{
 const x=setup();x.game.expansionLevel=2;x.game.installedPcs=7;
 const before=JSON.stringify(x.game),offer=x.offers.snapshot("computer");
 assert.equal(offer.disabled,true);
 assert.equal(offer.text,"Sem vaga na área principal");
 assert.equal(JSON.stringify(x.game),before);
});
test("o catálogo conserva outras ofertas e suas regras",()=>{
 const x=setup();expandShop(x.game);blockNextPc(x.game);
 assert.equal(x.offers.snapshot("poster").text,"Comprar · R$ 45");
 assert.equal(x.offers.snapshot("computer-annex").text,"Sem vaga na ampliação");
});
test("trocar de save reaplica a prévia à nova partida",()=>{
 const x=setup();expandShop(x.game);blockNextPc(x.game);
 const old=x.game,before=JSON.stringify(old);
 const fresh=createGame(7902,"historical");fresh.cash=10000;
 assert.equal(expandShop(fresh).ok,true);
 x.swap(fresh);
 assert.equal(x.offers.snapshot("computer").disabled,false);
 assert.equal(JSON.stringify(old),before);
});
test("save importado continua aceito, inclusive com a cotação consultada",()=>{
 const x=setup();expandShop(x.game);
 const restored=parseImportedSave(serializeSave(x.game));
 x.swap(restored);
 const before=JSON.stringify(restored);
 assert.equal(x.offers.snapshot("computer").disabled,false);
 assert.equal(nextComputerPlacementIssue(restored),null);
 assert.equal(JSON.stringify(restored),before);
 assert.equal(isValidSave(restored),true);
});
test("a prévia não modifica estado, filas, RNG nem despesas",()=>{
 const x=setup();expandShop(x.game);
 const before=JSON.stringify(x.game);
 for(let i=0;i<4;i++)nextComputerPlacementIssue(x.game);
 assert.equal(JSON.stringify(x.game),before);
});
