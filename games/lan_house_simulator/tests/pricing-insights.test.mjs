import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createGame} from "../dist/js/sim/engine.js";
import {setHourlyPrice,demandFactor} from "../dist/js/sim/economy.js";
import {hourlyPriceInsight} from "../dist/js/sim/pricingInsights.js";

test("indicador deriva exatamente da curva econômica real em preços intermediários",()=>{
 const s=createGame(112233);
 for(const price of [4,12,18,20,22,24,26,40]){
  assert.equal(setHourlyPrice(s,price).ok,true);
  const insight=hourlyPriceInsight(s);
  const expected=Math.round(100*demandFactor(price,s.reputation,true,false)/demandFactor(12,s.reputation,true,false));
  assert.equal(insight.relativeDemandPercent,expected);
  assert.ok(insight.relativeDemandPercent>0);
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
