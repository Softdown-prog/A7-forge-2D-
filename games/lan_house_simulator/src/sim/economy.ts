import type { GameState, Inventory, Item, Result } from "./types.js";
import { SESSION_MINUTES } from "./types.js";
import {gameYear,INTERNET_ERAS,internetUnlockYear} from "./era.js";
import {gpuBonus,gpuSpec,installedGpu} from "./gpu.js";
import {startRepair} from "./services.js";
import {lcdSpec,installedLcd} from "./computerModels.js";
import {buyPlatform,componentSatisfactionBonus,hardwareFor,hardwareLoadWatts} from "./hardware.js";
import {allowableHourlyPrice,annualHourlyCeiling,priceIndex,yearFromMinutes,
  sessionPrice,MIN_HOURLY_PRICE} from "./historicalEconomy.js";

/** Valores iniciais de 1998 no universo do jogo; inflação vem do IPCA. */
export const ITEM_PRICES: Record<Item, number> = { soda: 1.5, candy: 1, snacks: 2 };
export function productPrice(s:GameState,item:Item):number {
 const value=s.retailPrices?.[item];
 return Number.isFinite(value)&&value!>=.25&&value!<=100?value!:
  Math.round(ITEM_PRICES[item]*priceIndex(yearFromMinutes(s.totalMinutes))*100)/100;
}
export function setProductPrice(s:GameState,item:Item,value:number):Result {
 if(!Number.isFinite(value)||value<.25||value>100||Math.round(value*100)!==value*100)
 return {ok:false,message:"Preço permitido: R$ 0,25 a R$ 100,00, em centavos."};
 (s.retailPrices??={...ITEM_PRICES})[item]=value;
 return {ok:true,message:"Preço de "+item+" alterado para R$ "+value+"."};
}
export function upgradeComputer(s:GameState,index:number):Result {
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(!Number.isInteger(index)||index<0||index>=count)return {ok:false,message:"PC inexistente."};
 const tier=s.pcTiers?.[index]??1;
 if(tier>=3)return {ok:false,message:"PC no nível máximo."};
 if(s.pcComponents?.[index])return buyPlatform(s,index,tier===1?"platform00":"platform03");
 const unlockYear=tier===1?2000:2003;
 if(gameYear(s)<unlockYear)return {ok:false,message:"Hardware nível "+(tier+1)+" chega em "+unlockYear+"."};
 const cost=tier*240;
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para upgrade: R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;(s.pcTiers??=[])[index]=tier+1;
 return {ok:true,message:"PC "+(index+1)+" atualizado para hardware nível "+(tier+1)+": -R$ "+cost+"."};
}
/** Hardware de maior nível melhora a experiência, com bônus modesto e limitado. */
export function hardwareSatisfactionBonus(state:GameState,index:number):number {
 const tier=state.pcTiers?.[index]??1;
 return (Number.isInteger(tier)?componentSatisfactionBonus(state,index):0)+gpuBonus(state,index)+
   (lcdSpec(installedLcd(state,index))?.bonus??0);
}
export const ITEM_WHOLESALE: Record<Item, number> = { soda: 7, candy: 7, snacks: 12 };
export const ITEM_PACK: Record<Item, number> = { soda: 10, candy: 14, snacks: 12 };

export function demandFactor(price: number, reputation: number, internetOnline: boolean, rainy: boolean): number {
  // Até R$ 18/h, manter a curva aprovada. Acima disso a resistência ao
  // sobrepreço é progressiva: cobrar R$ 26 ou mais não deve virar uma
  // estratégia dominante só porque cada sessão paga mais.
  const usualPriceEffect=Math.max(0.22,Math.min(1.65,1.2-(price-12)*0.045));
  const excessivePremium=Math.max(0,price-18);
  const priceEffect=usualPriceEffect*Math.pow(0.84,excessivePremium);
  const repEffect = Math.max(0.5, Math.min(1.25, reputation / 75));
  const weatherEffect = rainy ? 0.8 : 1;
  return priceEffect * repEffect * weatherEffect * (internetOnline ? 1 : 0.12);
}
export function customerSatisfactionDelta(price:number,wait:number,offline:number):number {
  // Uma tarifa excessiva também afeta a avaliação de quem conseguiu
  // entrar, não apenas quem desistiu na porta. Bons upgrades continuam
  // compensando parte da frustração na avaliação final da estação.
  const excessivePremium=Math.max(0,price-18);
  const penalty=Math.max(0,price-12)*0.012+excessivePremium*.015+
    Math.max(0,wait-5)*0.014+Math.min(0.55,Math.max(0,offline)*0.025);
  return Math.max(-0.9,Math.min(0.22,0.22-penalty));
}
export function sessionRevenue(hourly: number, minutes = SESSION_MINUTES): number {
  return sessionPrice(hourly,minutes);
}
/** Consumo fictício por minuto aberto: instalações ociosas usam standby e clientes aumentam carga.
 * Tarifa sobe gradualmente com os anos; hardware mais avançado gasta mais por estação.
 * Em saves antigos, energyAccrued não existe: conta projetada mantém compatibilidade.
 */
export function energyCostPerMinute(state:Pick<GameState,"totalMinutes"|"expansionLevel"> & Partial<GameState>,active?:number):number {
 const original=Math.max(3,Math.min(3+state.expansionLevel*2,state.installedPcs??(3+state.expansionLevel*2)));
 const count=original+(state.annexPcs?.length??0);
 const busy=active??(state.customers??[]).filter(c=>c.stage==="using").length;
 const year=Math.floor(Math.max(0,state.totalMinutes)/(720*360));
 const tariff=priceIndex(1998+year);
 const base=(65+state.expansionLevel*15)/(30*720);
 let hardware=0;
 for(let i=0;i<count;i++){
   const tier=Math.max(1,Math.min(3,state.pcTiers?.[i]??1));
   const load=state.pcComponents?.[i]?hardwareLoadWatts(hardwareFor(state,i))/68:1+(tier-1)*.42;
   hardware+=0.0007*load+0.0014*(gpuSpec(installedGpu(state as GameState,i))?.power??0)-
     (lcdSpec(installedLcd(state,i))?.powerSaving??0);
 }
 const averageTier=count?Array.from({length:count},(_,i)=>Math.max(1,Math.min(3,state.pcTiers?.[i]??1)))
   .reduce((sum,tier)=>sum+(1+(tier-1)*0.42),0)/count:1;
 return tariff*(base+hardware+Math.min(count,Math.max(0,busy))*0.0030*averageTier);
}
export function energyMonthlyEstimate(state:Pick<GameState,"internetTier"|"expansionLevel"> & Partial<GameState>):number {
 return Math.round(energyCostPerMinute({...state,totalMinutes:state.totalMinutes??0},state.customers?.filter(c=>c.stage==="using").length??0)*30*720);
}
export function monthlyBills(state: Pick<GameState, "internetTier" | "expansionLevel"> & Partial<GameState>): number {
 const factor=priceIndex(yearFromMinutes(state.totalMinutes??0));
 const rent = Math.round((270 + state.expansionLevel * 170)*factor);
 const internet = Math.round((110 + (state.internetTier - 1) * 85)*factor);
 // Ao fechar o mês, usar o consumo acumulado; para saves antigos, projetar.
 const energy = state.energyAccrued!==undefined?Math.round(state.energyAccrued):energyMonthlyEstimate(state);
 const maintenance = Math.round((75 + state.expansionLevel * 35)*factor);
 return rent + internet + energy + maintenance;
}
export function setHourlyPrice(state: GameState, amount: number): Result {
  const ceiling=allowableHourlyPrice(state);
  if(!Number.isFinite(amount)||amount<MIN_HOURLY_PRICE||amount>ceiling||
     Math.abs(amount*4-Math.round(amount*4))>1e-8)
   return {ok:false,message:"Tarifa permitida: R$ "+MIN_HOURLY_PRICE.toFixed(2)+
    " a R$ "+ceiling.toFixed(2)+"/h. Teto do ano: R$ "+
    annualHourlyCeiling(yearFromMinutes(state.totalMinutes)).toFixed(2)+
    "/h; limitado também pela idade das máquinas e do Windows."};
  state.pricePerHour = amount;
  return {ok:true,message:"Tarifa alterada para R$ "+amount.toFixed(2)+"/h."};
}
export function supplierLevel(state: GameState):1|2 {
  return state.supplierTier===2?2:1;
}
export function wholesaleCost(state:GameState,item:Item):number {
  // O parceiro cobra taxa de adesão e reduz o valor de novos pedidos.
  const normal=ITEM_WHOLESALE[item]*priceIndex(yearFromMinutes(state.totalMinutes));
 return Math.round(100*normal*(supplierLevel(state)===2?.8:1))/100;
}
export function contractSupplier(state:GameState):Result {
  if(supplierLevel(state)===2)return {ok:false,message:"Fornecedor parceiro já contratado."};
  const fee=180;
  if(state.cash<fee)return {ok:false,message:"Caixa insuficiente para fornecedor parceiro: R$ "+fee+"."};
  state.cash-=fee;state.expenses+=fee;state.supplierTier=2;
  return {ok:true,message:"Fornecedor parceiro contratado: -R$ 180. Novos lotes custam 20% menos."};
}
export function stockItem(state: GameState, item: Item): Result {
  const cost = wholesaleCost(state,item);
  if (state.cash < cost) return { ok: false, message: "Caixa insuficiente para repor " + item + "." };
  state.cash -= cost; state.expenses += cost;
  state.inventory[item] += ITEM_PACK[item];
  return { ok: true, message: "Estoque de " + item + " reposto: -" + cost + " reais." };
}
export function sellItem(state: GameState, item: Item): Result {
  if (state.inventory[item] <= 0) return { ok: false, message: "Produto esgotado: " + item };
  state.inventory[item]--;
  const value = productPrice(state,item);
  state.cash += value; state.revenue += value; state.purchases++;
  return { ok: true, message: "Venda de " + item + ": +R$ " + value + "." };
}
export function licenseGames(state: GameState): Result {
  if (state.licensedGames) return { ok: false, message: "Catálogo já regularizado." };
  if (state.cash < 450) return { ok: false, message: "São necessários R$ 450 para licenciar os jogos." };
  state.cash -= 450; state.expenses += 450; state.licensedGames = true;
  return { ok: true, message: "Catálogo de jogos licenciado: -R$ 450." };
}
/** Serviço emergencial: tem custo real e só pode ser comprado durante uma falha. */
export function repairInternet(state: GameState): Result {
  if(state.totalMinutes>=state.offlineUntil) return {ok:false,message:"A internet já está funcionando."};
  const cost=75+25*(state.internetTier-1);
  if(state.cash<cost) return {ok:false,message:"Caixa insuficiente para reparo: R$ "+cost+"."};
  state.cash-=cost;state.expenses+=cost;
  state.offlineUntil=state.totalMinutes;
  return {ok:true,message:"Técnico restabeleceu a internet: -R$ "+cost+"."};
}
export function upgradeInternet(state: GameState): Result {
  if (state.internetTier >= 3) return { ok: false, message: "Internet já está no nível máximo." };
  const nextTier=state.internetTier+1;
  const year=internetUnlockYear(nextTier);
  if(gameYear(state)<year)return {ok:false,message:"Internet "+INTERNET_ERAS[nextTier-1]!.name+" disponível a partir de "+year+"."};
  const cost = 250 * state.internetTier;
  if (state.cash < cost) return { ok: false, message: "Caixa insuficiente para internet: R$ " + cost + "." };
  state.cash -= cost; state.expenses += cost; state.internetTier++;
  return { ok: true, message: "Internet melhorada para nível " + state.internetTier + ": -R$ " + cost + "." };
}
export function expandShop(state: GameState): Result {
  if (state.expansionLevel >= 2) return { ok: false, message: "Expansão máxima do protótipo." };
  const cost = 650 + state.expansionLevel * 450;
  if (state.cash < cost) return { ok: false, message: "Caixa insuficiente para expansão: R$ " + cost + "." };
  state.cash -= cost; state.expenses += cost; state.expansionLevel++;
  return { ok: true, message: "Salão ampliado: duas posições para novos computadores! -R$ " + cost + "." };
}
export function cloneInventory(stock: Inventory): Inventory {
  return { soda: stock.soda, candy: stock.candy, snacks: stock.snacks };
}

/** Reparo por estação: sem cobrança se o PC já estiver íntegro. */
export function repairComputer(state:GameState,index:number):Result {
 // Reparo físico agora exige visita do técnico; compatibilidade do comando existente.
 return startRepair(state,index);
}
/* old direct repair retired */
function legacyRepairComputer(state:GameState,index:number):Result {
 const count=Math.max(3,Math.min(3+state.expansionLevel*2,state.installedPcs??(3+state.expansionLevel*2)))+(state.annexPcs?.length??0);
 if(!Number.isInteger(index)||index<0||index>=count)return {ok:false,message:"Computador inexistente."};
 const wear=Math.max(0,Math.min(100,state.pcWear?.[index]??0));
 if(wear<1)return {ok:false,message:"PC "+(index+1)+" não precisa de reparo."};
 const cost=20+Math.ceil(wear*0.7);
 if(state.cash<cost)return {ok:false,message:"Caixa insuficiente para reparar PC "+(index+1)+": R$ "+cost+"."};
 state.cash-=cost;state.expenses+=cost;
 (state.pcWear??=[])[index]=0;
 return {ok:true,message:"PC "+(index+1)+" reparado: -R$ "+cost+"."};
}
