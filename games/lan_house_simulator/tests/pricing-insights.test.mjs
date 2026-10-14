import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createGame} from "../dist/js/sim/engine.js";
import {setHourlyPrice,demandFactor,sessionRevenue} from "../dist/js/sim/economy.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {hourlyPriceInsight,hourlyPriceScenarios,energyYearOutlook} from "../dist/js/sim/pricingInsights.js";

test("indicador deriva exatamente da curva econômica real em preços intermediários",()=>{
 const s=createGame(112233);
 for(const price of [4,12,18,20,22,24,26,40]){
  assert.equal(setHourlyPrice(s,price).ok,true);
  const insight=hourlyPriceInsight(s);
  const expected=Math.round(100*demandFactor(price,s.reputation,true,false)/demandFactor(12,s.reputation,true,false));
  assert.equal(insight.relativeDemandPercent,expected);
  assert.ok(insight.relativeDemandPercent>=0,"uma taxa pequena pode arredondar para zero");
  if(price>18)assert.match(insight.caution,/sobrepreço/);
 }
});
test("preço maior reduz procura relativa e preço de referência é 100%",()=>{
 const s=createGame();
 const ratios=[12,18,20,22,24,26].map(p=>{s.pricePerHour=p;return hourlyPriceInsight(s).relativeDemandPercent;});
 assert.equal(ratios[0],100);
 assert.ok(ratios.every((x,i)=>i===0||x<ratios[i-1]));
 s.pricePerHour=26;
 assert.equal(hourlyPriceInsight(s).assessment,"desfavorável");
 s.pricePerHour=12;
 assert.equal(hourlyPriceInsight(s).assessment,"positiva");
});
test("sem efeito colateral sobre reputação, RNG, receita, fila e saves antigos",()=>{
 const s=createGame(139),before=JSON.stringify(s);
 for(let i=0;i<10;i++)hourlyPriceInsight(s);
 assert.equal(JSON.stringify(s),before);
 delete s.pcTiers;delete s.pcGpus;
 assert.equal(hourlyPriceInsight(s).relativeDemandPercent,100);
 s.weather="rain";s.offlineUntil=500;
 assert.equal(hourlyPriceInsight(s).relativeDemandPercent,100);
 s.pricePerHour=22;
 assert.ok(hourlyPriceInsight(s).relativeDemandPercent<100);
});
test("painel de preços e render principal integram os três indicadores",()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 for(const id of ["price-demand-insight","price-satisfaction-insight","price-caution"]){
  assert.ok(html.includes('id="'+id+'"'));
  assert.ok(main.includes('setText("'+id+'"'));
 }
 assert.ok(html.includes("Não é previsão de faturamento"));
});


test("comparador respeita limites e deriva procura e valor de sessão das regras reais",()=>{
 const s=createGame(789),original=JSON.stringify(s);
 for(const price of [4,12,18,22,26,40]){
  s.pricePerHour=price;
  const before=JSON.stringify(s),options=hourlyPriceScenarios(s);
  const ref=demandFactor(price,s.reputation,true,false);
  const ticket=sessionRevenue(price);
  assert.equal(options.find(x=>x.delta===0).demandIndex,100);
  assert.equal(options.find(x=>x.delta===0).grossIntakeIndex,100);
  assert.equal(options.length,price===4||price===40?2:3);
  for(const item of options){
   const factor=demandFactor(item.price,s.reputation,true,false);
   assert.equal(item.demandIndex,Math.round(100*factor/ref));
   assert.equal(item.grossIntakeIndex,Math.round(100*factor*sessionRevenue(item.price)/(ref*ticket)));
  }
  assert.equal(JSON.stringify(s),before,"comparação não deve escrever na partida");
 }
 assert.equal(original.includes('"pricePerHour":12'),true);
 s.weather="rain";s.offlineUntil=10000;
 const rainy=hourlyPriceScenarios(s);
 assert.equal(rainy.find(x=>x.delta===0).grossIntakeIndex,100);
});

test("virada anual: +3% de tarifa energética até teto, sem modificar economia ou save",()=>{
 const s=createGame(92),original=JSON.stringify(s);
 const initial=energyYearOutlook(s);
 assert.deepEqual(initial,{currentYear:1998,nextYear:1999,changePercent:3});
 s.totalMinutes=13*360*DAY_MINUTES;
 const year2011=energyYearOutlook(s);
 assert.deepEqual(year2011,{currentYear:2011,nextYear:2012,changePercent:3});
 s.totalMinutes=25*360*DAY_MINUTES;
 const capped=energyYearOutlook(s);
 assert.deepEqual(capped,{currentYear:2023,nextYear:2024,changePercent:0});
 assert.equal(original.includes('"pricePerHour":12'),true);
 assert.equal(s.pricePerHour,12);
 assert.equal(s.retailPrices.soda,8);
});

test("painel mostra cenários legíveis e o custo da virada sem ações econômicas automáticas",()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const html=readFileSync(resolve(root,"index.html"),"utf8");
 const main=readFileSync(resolve(root,"src/main.ts"),"utf8");
 for(const id of ["price-scenario-lower","price-scenario-current","price-scenario-higher","energy-year-outlook"]){
  assert.ok(html.includes('id="'+id+'"'),"id visual: "+id);
  assert.ok(main.includes('setText("'+id+'"'),"integração: "+id);
 }
 assert.match(html,/não prevê lucro, clientes atendidos ou faturamento real/);
 assert.ok(main.includes("hourlyPriceScenarios(game)"));
 assert.ok(main.includes("energyYearOutlook(game)"));
});
