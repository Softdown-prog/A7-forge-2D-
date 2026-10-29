import {sourceModule,assertCompositionAdaptersExclude} from "./helpers/composition.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createGame,isValidSave} from "../dist/js/sim/engine.js";
import {hourlyPriceInsight,hourlyPriceScenarios,energyYearOutlook} from "../dist/js/sim/pricingInsights.js";
import {allowableHourlyPrice} from "../dist/js/sim/historicalEconomy.js";
import {serializeSave,parseImportedSave} from "../dist/js/sim/saveTransfer.js";
import {createPricingInsightsPort} from "../dist/js/application/pricingInsightsPort.js";
import {renderHourlyPricingInsights,renderEnergyYearOutlook} from "../dist/js/ui/pricingInsightsPanel.js";
const currency=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
test("cotação clássica expõe os mesmos números do motor sem alterar o save",()=>{
 const s=createGame(9123,"classic");
 s.pricePerHour=12;
 const port=createPricingInsightsPort(()=>s),before=JSON.stringify(s),view=port.hourly();
 const report=hourlyPriceInsight(s),scenarios=hourlyPriceScenarios(s);
 const at=delta=>scenarios.find(x=>x.delta===delta);
 assert.equal(view.demand,"Procura relativa pelo modelo: "+report.relativeDemandPercent+"% (R$ 12/h = 100%).");
 assert.equal(view.satisfaction,"Avaliação estimada em PC básico, sem espera ou queda: "+report.assessment+".");
 assert.equal(view.caution,report.caution);
 assert.equal(view.lower,"Reduzir R$ 2 · R$ "+at(-2).price+"/h · procura "+
  at(-2).demandIndex+"% · receita bruta potencial "+at(-2).grossIntakeIndex+"%");
 assert.equal(view.current,"Manter · R$ "+at(0).price+"/h · procura "+
  at(0).demandIndex+"% · receita bruta potencial "+at(0).grossIntakeIndex+"%");
 assert.equal(view.higher,"Aumentar R$ 2 · R$ "+at(2).price+"/h · procura "+
  at(2).demandIndex+"% · receita bruta potencial "+at(2).grossIntakeIndex+"%");
 assert.equal(JSON.stringify(s),before);
});
test("limites de tarifa mostram cenário indisponível sem mudar preço",()=>{
 const s=createGame(9124,"classic"),port=createPricingInsightsPort(()=>s);
 s.pricePerHour=4;
 assert.equal(port.hourly().lower,"Reduzir R$ 2 · fora do teto de "+currency(allowableHourlyPrice(s))+"/h.");
 s.pricePerHour=40;
 assert.equal(port.hourly().higher,"Aumentar R$ 2 · fora do teto de "+currency(allowableHourlyPrice(s))+"/h.");
 assert.equal(s.pricePerHour,40);
});
test("modo histórico preserva casas decimais, IPCA e consulta sem efeitos",()=>{
 const s=createGame(9125,"historical"),port=createPricingInsightsPort(()=>s);
 const original=JSON.stringify(s),pricing=port.hourly(),outlook=port.energy();
 assert.match(pricing.current,/R\$ [0-9]+\.[0-9]{2}\/h/);
 assert.match(pricing.lower,/Reduzir R\$ 0,50/);
 assert.match(pricing.higher,/Aumentar R\$ 0,50/);
 const expected=energyYearOutlook(s);
 assert.equal(outlook.label,"IPCA na virada "+expected.currentYear+" → "+expected.nextYear+
  ": "+(expected.changePercent>0?"+":"")+expected.changePercent.toLocaleString("pt-BR")+
  "% aplicado ao custo energético e às demais contas indexadas, mantendo as máquinas iguais.");
 assert.equal(JSON.stringify(s),original);
});
test("projeção clássica de energia mantém o texto original, sem aplicar inflação",()=>{
 const s=createGame(9126,"classic"),original=JSON.stringify(s);
 const view=createPricingInsightsPort(()=>s).energy(),reference=energyYearOutlook(s);
 assert.equal(view.label,"Energia na virada "+reference.currentYear+" → "+reference.nextYear+
  ": +"+reference.changePercent.toLocaleString("pt-BR")+
  "% de tarifa, mantendo os mesmos PCs e a carga ociosa. Demais contas fixas não recebem inflação automática.");
 assert.equal(JSON.stringify(s),original);
});
test("troca de save mantém porta ligada à instância atual",()=>{
 let s=createGame(9127,"historical");
 const port=createPricingInsightsPort(()=>s),old=s,before=JSON.stringify(s);
 s=parseImportedSave(serializeSave(s));s.pricePerHour=1.5;
 assert.match(port.hourly().current,/R\$ 1\.50\/h/);
 assert.equal(JSON.stringify(old),before);
 assert.equal(isValidSave(s),true);
});
test("componente só atualiza os textos existentes, sem recriar DOM",()=>{
 const s=createGame(9128,"historical"),port=createPricingInsightsPort(()=>s);
 const seen=new Map(),setText=(id,value)=>seen.set(id,value);
 renderHourlyPricingInsights(port.hourly(),setText);
 renderEnergyYearOutlook(port.energy(),setText);
 assert.deepEqual([...seen.keys()],[
  "price-demand-insight","price-satisfaction-insight","price-caution",
  "price-scenario-lower","price-scenario-current","price-scenario-higher","energy-year-outlook"
 ]);
 assert.ok(seen.get("price-scenario-current").startsWith("Manter"));
});
test("separação das camadas conserva a aba e o cálculo de demanda no motor",()=>{
 const root=new URL("../src/",import.meta.url);
 const app=readFileSync(new URL("application/pricingInsightsPort.ts",root),"utf8");
 const ui=readFileSync(new URL("ui/pricingInsightsPanel.ts",root),"utf8");
 const section=readFileSync(new URL("ui/adminPricingSections.ts",root),"utf8");
 assert.doesNotMatch(app,/\b(document|window|HTMLElement|HTMLButtonElement)\b/);
 assert.doesNotMatch(ui,/from\s*["']\.\.\/sim\//);
 assert.doesNotMatch(ui,/\bGameState\b|replaceChildren|innerHTML|addEventListener/);
 assert.ok(sourceModule("ui/gamePanels.ts").includes("active:page=>managementPanels.active(\"prices\",page)"));
 assert.ok(section.includes('options.active("insights")'));
 assert.ok(sourceModule("application/gamePorts.ts").includes("createPricingInsightsPort(getState)"));
 assert.ok(section.includes("renderHourlyPricingInsights(options.insights.hourly(),options.setText)"));
 assert.ok(section.includes("renderEnergyYearOutlook(options.insights.energy(),options.setText)"));
 assertCompositionAdaptersExclude(/\bhourlyPriceInsight\(/);
 assertCompositionAdaptersExclude(/\bhourlyPriceScenarios\(/);
 assertCompositionAdaptersExclude(/\benergyYearOutlook\(/);
});
