import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {createPricingPort} from "../dist/js/application/pricingPort.js";
import {productPrice} from "../dist/js/sim/economy.js";
import {buyPrinter} from "../dist/js/sim/printService.js";
import {buyDiscCopier} from "../dist/js/sim/discCopy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";

test("precos horarios seguem passos historicos e mantem instancia corrente depois do import",()=>{
 let game=createGame(2026,"historical");
 game.pricePerHour=2;
 const port=createPricingPort(()=>game);
 assert.equal(port.changeHourly(1).ok,true);
 assert.equal(game.pricePerHour,2.5);
 assert.equal(port.changeHourly(-1).ok,true);
 assert.equal(game.pricePerHour,2);
 const previous=game;
 const restored=parseImportedSave(serializeSave(game));
 assert.ok(isValidSave(restored));
 game=restored;
 assert.equal(port.changeHourly(-1).ok,true);
 assert.equal(game.pricePerHour,1.5);
 assert.equal(previous.pricePerHour,2,"instancia anterior precisa continuar intacta");
 const before=JSON.stringify(game);
 assert.equal(port.changeHourly(3).ok,false);
 assert.equal(JSON.stringify(game),before);
});

test("modo classico ajusta R$ 2 e so migra uma vez, sem reescrever o caixa",()=>{
 const game=createGame(33,"classic");game.pricePerHour=12;game.cash=1532;
 game.retailPrices={soda:8,candy:5,snacks:9};
 const port=createPricingPort(()=>game);
 assert.equal(port.changeHourly(1).ok,true);
 assert.equal(game.pricePerHour,14);
 assert.equal(port.canMigrateHistorical(),true);
 assert.equal(port.migrateHistorical(),true);
 assert.equal(game.economyVersion,2);
 assert.equal(game.cash,1532);
 assert.equal(game.retailPrices,undefined);
 assert.ok(game.pricePerHour<=3);
 assert.equal(port.canMigrateHistorical(),false);
 const before=JSON.stringify(game);
 assert.equal(port.migrateHistorical(),false);
 assert.equal(JSON.stringify(game),before);
});

test("preco da impressao valida passo do save e nao aceita botao adulterado",()=>{
 const game=createGame(71,"historical");game.cash=2000;
 assert.equal(buyPrinter(game).ok,true);
 const port=createPricingPort(()=>game);
 const original=game.printer.price;
 assert.equal(port.changePrinting(1,1).ok,false);
 assert.equal(game.printer.price,original);
 assert.equal(port.changePrinting(1,.5).ok,true);
 assert.equal(game.printer.price,original+.5);
 assert.equal(port.changePrinting(-1,-.5).ok,true);
 assert.equal(game.printer.price,original);
 const before=JSON.stringify(game);
 assert.equal(port.changePrinting(0).ok,false);
 assert.equal(JSON.stringify(game),before);
});

test("copiadora e produtos usam validacoes do motor, inclusive periodo de desbloqueio",()=>{
 const game=createGame(78,"historical");game.cash=5000;
 const port=createPricingPort(()=>game);
 const before=JSON.stringify(game);
 assert.equal(port.changeDisc("cd",1).ok,false);
 assert.equal(port.changeDisc("dvd",0).ok,false);
 assert.equal(port.changeRetail("invalid",1).ok,false);
 assert.equal(JSON.stringify(game),before);
 game.totalMinutes=(2001-1998)*360*720;
 assert.equal(buyDiscCopier(game).ok,true);
 const original=game.discCopier.prices.cd;
 assert.equal(port.changeDisc("cd",1).ok,true);
 assert.equal(game.discCopier.prices.cd,original+1);
 const soda=productPrice(game,"soda");
 assert.equal(port.changeRetail("soda",1).ok,true);
 assert.equal(productPrice(game,"soda"),soda+1);
 assert.equal(port.changePs1(1).ok,false,"sem bancada de PS1 não pode cobrar");
});

test("o controller de UI conhece so a porta, e o main nao altera precos diretamente",()=>{
 const root=new URL("../src/",import.meta.url);
 const controller=readFileSync(new URL("ui/pricingControls.ts",root),"utf8");
 const port=readFileSync(new URL("application/pricingPort.ts",root),"utf8");
 const main=readFileSync(new URL("main.ts",root),"utf8");
 assert.doesNotMatch(controller,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(controller,/from\s*["']\.\.\/render\//);
 assert.doesNotMatch(port,/\bdocument\b|\bwindow\b|\bHTMLElement\b/);
 assert.match(main,/installPricingControls\(createPricingPort\(\(\)=>game\)/);
 assert.doesNotMatch(main,/\b(setHourlyPrice|setPrintPrice|setProductPrice|setDiscCopyPrice|setPs1HourlyPrice)\s*\(/);
});
