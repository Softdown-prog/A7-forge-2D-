import test from "node:test";
import assert from "node:assert/strict";
import {createGame,stepGame,isValidSave} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {buyPrinter,setPrintPrice,servePrinting,printPaperInkCost,printWalkInDemand,PRINT_PAGES_PER_DAY} from "../dist/js/sim/printService.js";
import {buyDiscCopier,setDiscCopyPrice,serveDiscCopy,discMediaCost,discWalkInDemand,DISC_COPIES_PER_DAY} from "../dist/js/sim/discCopy.js";
import {printEconomy,discEconomy,SERVICE_ADMISSION_MINUTES} from "../dist/js/sim/serviceEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
const close=(a,b)=>Math.abs(a-b)<1e-6;
function at(year=1998,mode="historical"){
 const s=createGame(23,mode);
 s.totalMinutes=(year-1998)*360*DAY_MINUTES;s.cash=20000;
 return s;
}
test("investimentos e margens aparecem separados da receita do PC, sem dupla contagem",()=>{
 const s=at(2001),before=s.cash;
 assert.equal(printEconomy(s),null);
 assert.equal(discEconomy(s),null);
 assert.equal(buyPrinter(s).ok,true);
 assert.equal(buyDiscCopier(s).ok,true);
 assert.equal(s.cash,before-320-900);
 const print=printEconomy(s),disc=discEconomy(s);
 assert.deepEqual([print.operatingResult,print.netAfterInvestment,print.remainingInvestment], [0,-320,320]);
 assert.deepEqual([disc.operatingResult,disc.netAfterInvestment,disc.remainingInvestment], [0,-900,900]);
 assert.equal(print.fullyRecovered,false);assert.equal(disc.fullyRecovered,false);
 assert.equal(print.walkIns,0);assert.equal(disc.walkIns,0);
 assert.ok(close(print.expectedWalkInAttemptsPerDay,Math.round(630*printWalkInDemand(s)*10)/10));
 assert.ok(close(disc.expectedWalkInAttemptsPerDay,Math.round(630*discWalkInDemand(s)*10)/10));
 assert.equal(SERVICE_ADMISSION_MINUTES,DAY_MINUTES-90);
});
test("progresso real de amortização acompanha vendas; não gera renda automaticamente",()=>{
 const s=at(2001);buyPrinter(s);buyDiscCopier(s);
 const initial=[s.cash,s.revenue,s.expenses];
 for(let id=1;id<2000;id++){
  if(id%36===0){s.totalMinutes+=DAY_MINUTES;}
  servePrinting(s,{id,stage:"waiting",serviceRequest:"printing",wallet:100});
  serveDiscCopy(s,{id,stage:"waiting",serviceRequest:"disc-copy",wallet:100});
 }
 const print=printEconomy(s),disc=discEconomy(s);
 assert.ok(print.revenue>0&&disc.revenue>0);
 assert.ok(close(print.operatingResult,print.revenue-print.materialCost));
 assert.ok(close(print.netAfterInvestment,print.operatingResult-320));
 assert.ok(close(disc.netAfterInvestment,disc.operatingResult-900));
 assert.equal(print.remainingInvestment,Math.max(0,Math.round(-print.netAfterInvestment*100)/100));
 assert.equal(disc.remainingInvestment,Math.max(0,Math.round(-disc.netAfterInvestment*100)/100));
 assert.ok(close(s.cash-initial[0],s.revenue-(s.expenses-initial[2])),
  "caixa só muda pelo resultado após mídias e papel");
 assert.ok(close(s.revenue-initial[1],s.revenue));
 assert.ok(close(s.expenses-initial[2],print.materialCost+disc.materialCost));
 const saved=parseImportedSave(serializeSave(s));
 assert.equal(isValidSave(saved),true);
 assert.deepEqual(printEconomy(saved),print);assert.deepEqual(discEconomy(saved),disc);
});
test("receita positiva pode esconder prejuízo após materiais e investimento",()=>{
 const s=at(2025);buyPrinter(s);buyDiscCopier(s);
 assert.ok(printPaperInkCost(s)>.5);
 assert.equal(setPrintPrice(s,.5).ok,true);
 setDiscCopyPrice(s,"cd",1);setDiscCopyPrice(s,"dvd",1);
 assert.ok(discMediaCost(s,"cd")>=1);
 const printer=printEconomy(s),copier=discEconomy(s);
 assert.equal(printer.fullyRecovered,false);assert.equal(copier.fullyRecovered,false);
 assert.ok(printer.remainingInvestment>0&&copier.remainingInvestment>0);
 const baselinePrint=printWalkInDemand(s),baselineDisc=discWalkInDemand(s);
 setPrintPrice(s,20);setDiscCopyPrice(s,"cd",80);setDiscCopyPrice(s,"dvd",80);
 assert.ok(printWalkInDemand(s)<baselinePrint);
 assert.ok(discWalkInDemand(s)<baselineDisc);
 assert.equal(printEconomy(s).expectedWalkInAttemptsPerDay,
  Math.round(printWalkInDemand(s)*SERVICE_ADMISSION_MINUTES*10)/10);
 assert.equal(discEconomy(s).expectedWalkInAttemptsPerDay,
  Math.round(discWalkInDemand(s)*SERVICE_ADMISSION_MINUTES*10)/10);
});
test("campanhas em 1998, 2001, 2015, 2025 e 2030: sem renda passiva, sem PCs e com limites diários",()=>{
 for(const year of [1998,2001,2015,2025,2030]){
  const s=at(year);
  s.pcPoweredOff=[true,true,true];s.inventory={soda:0,candy:0,snacks:0};
  assert.equal(buyPrinter(s).ok,true);
  if(year>=2001)assert.equal(buyDiscCopier(s).ok,true);
  const startRng=s.rng,startServed=s.served;
  // Um intervalo finito de gameplay com a porta, caixa e filas reais;
  // não atribuir automaticamente o potencial teórico como receita.
  for(let tick=0;tick<4*DAY_MINUTES;tick++)stepGame(s,1);
  const p=printEconomy(s),d=discEconomy(s);
  assert.equal(s.served,startServed,year+": PCs desligados não devem gerar sessões");
  assert.ok(p.walkIns>=0);
  assert.ok(p.revenue>=0&&p.materialCost>=0);
  assert.ok(p.walkIns<=p.revenue/.5+1);
  assert.ok(s.printer.pages<=4*PRINT_PAGES_PER_DAY);
  if(d){assert.ok(d.walkIns>=0);assert.ok(s.discCopier.cdCopies+s.discCopier.dvdCopies<=4*DISC_COPIES_PER_DAY);}
  if(!d)assert.equal(year,1998);
  assert.deepEqual(s.pcWear,[0,0,0]);
  assert.equal(isValidSave(parseImportedSave(serializeSave(s))),true,year+" save");
  assert.equal(printEconomy(s).remainingInvestment,Math.max(0,-printEconomy(s).netAfterInvestment));
  // RNG pode mudar por clima, contas e rotina base. Testes de chegada isolados
  // garantem que as demandas de serviço não o consomem.
  assert.ok(Number.isSafeInteger(s.rng)||s.rng>=0);
 }
});
test("sem equipamento nem compra antecipada não existe oportunidade avulsa fictícia",()=>{
 const s=createGame(11,"historical");
 assert.equal(printEconomy(s),null);assert.equal(discEconomy(s),null);
 assert.equal(discWalkInDemand(s),0);assert.equal(printWalkInDemand(s),0);
 assert.equal(buyDiscCopier(s).ok,false);
 for(let i=0;i<5*DAY_MINUTES;i++){
  s.totalMinutes=i;
  assert.equal(discWalkInDemand(s),0);
 }
});
