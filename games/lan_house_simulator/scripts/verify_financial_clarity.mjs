// Regressão visual do painel de caixa (desktop e celulares).
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import assert from "node:assert/strict";
import {createGame,stepGame} from "../dist/js/sim/engine.js";
import {GAME_SAVE_KEY,DAY_MINUTES} from "../dist/js/sim/types.js";

const out=resolve(process.argv[2]??"out/balance-panel");
await mkdir(out,{recursive:true});
const server=spawn(process.execPath,[resolve(import.meta.dirname,"serve.mjs")],{stdio:["ignore","pipe","inherit"]});
let browser;
try{
 await new Promise((ok,fail)=>{server.stdout.once("data",ok);server.once("error",fail);
  server.once("exit",code=>fail(Error("Server stopped "+code)));});
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const reports=[];
 for(const width of [1280,414,360]){
  const mobile=width<700,context=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  const s=createGame(width,"historical");
  s.cash=386.49;s.revenue=900;s.expenses=1363.51;
  // Dia 30 do ciclo: testar o aviso de fechamento antes da virada.
  s.totalMinutes=29*DAY_MINUTES;s.energyAccrued=325;
  await context.addInitScript(({key,state})=>{
   localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:s});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  const click=async selector=>mobile?await page.locator(selector).tap():await page.locator(selector).click();
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await click("#menu-continue");await click("#open-admin");
  assert.equal((await page.locator(".admin-summary").innerText()).includes("Saldo acumulado"),false);
  assert.match(await page.locator(".admin-summary").innerText(),/Resultado acumulado/);
  assert.match(await page.locator("#admin-cash").innerText(),/386,49/);
  assert.match(await page.locator("#admin-profit").innerText(),/-463,51/);
  assert.equal(await page.locator("#balance-details").evaluate(el=>el.open),false);
  await click("#balance-details summary");
  assert.equal(await page.locator("#balance-details").evaluate(el=>el.open),true);
  assert.match(await page.locator("#balance-opening").innerText(),/850,00/);
  assert.match(await page.locator("#balance-income").innerText(),/900,00/);
  assert.match(await page.locator("#balance-outgoing").innerText(),/1\.363,51/);
  assert.match(await page.locator("#balance-available").innerText(),/386,49/);
  assert.equal(await page.locator("#balance-reconciliation").isVisible(),false);
  assert.match(await page.locator(".balance-guide").innerText(),/As contas por mês são uma previsão/);
  assert.match(await page.locator("#bill-watch-title").innerText(),/1 dia do jogo/);
  assert.match(await page.locator("#bill-watch-status").innerText(),/Se a cobrança fosse agora, faltariam/);
  assert.equal(await page.locator("#bill-watch").evaluate(el=>el.classList.contains("bill-watch-warning")),true);
  const scrollOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(scrollOverflow<=3,"painel rompe a largura em "+width+"px: "+scrollOverflow);
  await page.locator(".balance-guide").screenshot({path:resolve(out,"balance_guide_"+width+".png")});
  await page.locator("#bill-watch").screenshot({path:resolve(out,"bill_watch_"+width+".png")});
  // Segundo cenário: pagar uma conta REAL na simulação e abrir o comprovante
  // após salvar e carregar a partida no navegador.
  const paid=createGame(width+10,"historical");
  paid.totalMinutes=30*DAY_MINUTES-1;
  paid.cash=1850;
  paid.energyAccrued=72.5;
  paid.employeePayrollAccrued=19.75;
  stepGame(paid,1);
  assert.equal(paid.lastPaidMonthlyBill.endDay,30);
  const settledContext=await browser.newContext({viewport:{width,height:920},isMobile:mobile,hasTouch:mobile});
  await settledContext.addInitScript(({key,state})=>{
   localStorage.setItem(key,JSON.stringify(state));localStorage.setItem("lhs.sound","off");
  },{key:GAME_SAVE_KEY,state:paid});
  const paidPage=await settledContext.newPage(),paidErrors=[];
  paidPage.on("pageerror",e=>paidErrors.push(String(e)));
  await paidPage.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const paidClick=async selector=>mobile?await paidPage.locator(selector).tap():
   await paidPage.locator(selector).click();
  await paidClick("#menu-continue");await paidClick("#open-admin");
  await paidClick('[data-admin-tab="finance"]');
  assert.match(await paidPage.locator("#last-bill-info").innerText(),/Último fechamento: mês 01\/1998/);
  assert.match(await paidPage.locator("#last-bill-info").innerText(),/caixa após pagamento/);
  assert.equal(await paidPage.locator("#last-bill-details").isVisible(),true);
  await paidClick("#last-bill-details summary");
  assert.equal(await paidPage.locator("#last-bill-details").evaluate(el=>el.open),true);
  for(const id of ["rent","internet","energy","maintenance","wages","total"])
   assert.match(await paidPage.locator("#last-bill-"+id).innerText(),/R\$/);
  assert.deepEqual([...errors,...paidErrors],[]);
  const settledOverflow=await paidPage.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(settledOverflow<=3,"comprovante rompe a largura em "+width+"px: "+settledOverflow);
  await paidPage.locator(".paid-bill-panel").screenshot({path:resolve(out,"paid_bill_"+width+".png")});
  await settledContext.close();
  reports.push({width,cash:386.49,netResult:-463.51,daysUntilBills:1,
   receiptTotal:paid.lastPaidMonthlyBill.total,warning:true,opened:true,scrollOverflow,settledOverflow});
  await context.close();
 }
 await writeFile(resolve(out,"balance_guide.json"),JSON.stringify({reports,passed:true},null,2));
 console.log(JSON.stringify({reports,passed:true}));
}finally{await browser?.close();server.kill();}
