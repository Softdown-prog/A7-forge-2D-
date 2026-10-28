import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createGame,isValidSave,visitorArrivalChance} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {priceIndex} from "../dist/js/sim/historicalEconomy.js";
import {licenseGames,basicGamesLicenseCost,BASIC_GAMES_LICENSE_COST_1998} from "../dist/js/sim/economy.js";
import {licenseWindows} from "../dist/js/sim/era.js";
import {licenseEraGame,eraGameVisitorMultiplier} from "../dist/js/sim/eraGames.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {withStationOff} from "./station-power-fixture.mjs";

const money=n=>Math.round(n*100)/100;

test("regularização básica é taxa única em ambos os modos e nunca cobra duas vezes",()=>{
  for(const mode of ["classic","historical"]){
    const s=createGame(16,mode);
    const cost=basicGamesLicenseCost(s),before=s.cash,expense=s.expenses;
    assert.equal(cost,BASIC_GAMES_LICENSE_COST_1998);
    assert.equal(licenseGames(s).ok,true);
    assert.equal(s.licensedGames,true);
    assert.equal(s.cash,money(before-cost));
    assert.equal(s.expenses,money(expense+cost));
    assert.equal(licenseGames(s).ok,false,"não renova nem recobra ao clicar");
    assert.equal(s.cash,money(before-cost));
    assert.equal(s.expenses,money(expense+cost));
    s.totalMinutes=2*360*DAY_MINUTES;
    assert.equal(licenseGames(s).ok,false,"não renova ao virar o ano");
    assert.equal(s.cash,money(before-cost));
    const restored=parseImportedSave(serializeSave(s));
    assert.equal(isValidSave(restored),true);
    assert.equal(restored.licensedGames,true);
    assert.equal(licenseGames(restored).ok,false,"save antigo não perde regularização");
    assert.equal(restored.cash,money(before-cost));
  }
});

test("nova regularização acompanha o IPCA do ano apenas no modo histórico",()=>{
  for(const year of [1998,1999,2005,2025,2030]){
    const s=createGame(16,"historical");
    s.totalMinutes=(year-1998)*360*DAY_MINUTES;
    const cost=money(BASIC_GAMES_LICENSE_COST_1998*priceIndex(year));
    assert.equal(basicGamesLicenseCost(s),cost,String(year));
    s.cash=cost-0.01;
    const expenses=s.expenses;
    assert.equal(licenseGames(s).ok,false);
    assert.equal(s.cash,cost-0.01);
    assert.equal(s.expenses,expenses);
    s.cash=cost;
    assert.equal(licenseGames(s).ok,true);
    assert.equal(money(s.cash),0);
    assert.equal(money(s.expenses-expenses),cost);
  }
  const classic=createGame();
  classic.totalMinutes=32*360*DAY_MINUTES;
  assert.equal(basicGamesLicenseCost(classic),450,"modo clássico preserva preço legado");
});

test("regularizar não cria procura; licenciar título específico gera só o bônus esperado",()=>{
  const s=createGame(60,"historical");
  s.cash=10000;
  const before=visitorArrivalChance(s,0);
  assert.equal(licenseGames(s).ok,true);
  assert.equal(eraGameVisitorMultiplier(s),1);
  assert.equal(visitorArrivalChance(s,0),before);
  assert.equal(withStationOff(s,0,()=>licenseWindows(s,0,"win98")).ok,true);
  assert.equal(licenseEraGame(s,"turbo-98").ok,true);
  assert.equal(eraGameVisitorMultiplier(s),1.015);
  assert.ok(Math.abs(visitorArrivalChance(s,0)/before-1.015)<1e-10);
});

test("UI oculta contrato concluído e apresenta preços e avisos atualizados",()=>{
  const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const projection=readFileSync(new URL("../src/application/basicGamesLicenseStatusPort.ts",import.meta.url),"utf8");
  const visual=readFileSync(new URL("../src/ui/basicGamesLicenseStatusPanel.ts",import.meta.url),"utf8");
  assert.ok(main.includes("renderBasicGamesLicenseStatus(basicGamesLicenseStatusPort.snapshot(),setText,document)"));
  assert.ok(projection.includes("buttonHidden:game.licensedGames"));
  assert.ok(projection.includes("buttonDisabled:game.cash<fee"));
  assert.ok(visual.includes("button.hidden=status.buttonHidden"));
  assert.ok(visual.includes("button.disabled=status.buttonDisabled"));
  assert.ok(main.includes('basicGamesLicenseCost(game)'));
  assert.ok(main.includes('action.textContent="Regularizar jogos · "+basicGamesLicenseCost(game).toLocaleString'));
  assert.ok(html.includes("taxa única para o estabelecimento, sem renovação anual"));
  assert.equal(html.includes('id="license" class="slice">Licenciar jogos R$ 450'),false);
});
