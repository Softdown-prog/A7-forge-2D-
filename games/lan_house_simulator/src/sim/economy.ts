import {merchandisePrice,setMerchandisePrice,orderMerchandise,sellMerchandise,quoteOrder,CLASSIC_PRICES,CLASSIC_WHOLESALE,PRODUCTS} from "./merchandise.js";
import type { GameState, Inventory, Item, Result } from "./types.js";
import {SESSION_MINUTES} from "./types.js";
import {gameYear,INTERNET_ERAS,internetUnlockYear} from "./eraCatalog.js";
import {gpuBonus,gpuSpec,installedGpu} from "./gpu.js";
import {startRepair} from "./services.js";
import {lcdSpec,installedLcd} from "./computerModels.js";
import {buyPlatform,componentSatisfactionBonus,hardwareFor,hardwareLoadWatts} from "./hardware.js";
import {stationUpgradeIssue,stationPoweredOn} from "./stationPower.js";
import {allowableHourlyPrice,annualHourlyCeiling,priceIndex,yearFromMinutes,
  sessionPrice,MIN_HOURLY_PRICE,isHistorical} from "./historicalEconomy.js";

/** Valores iniciais de 1998 no universo do jogo; inflação vem do IPCA. */
export const ITEM_PRICES: Record<Item, number> = CLASSIC_PRICES;
export const HISTORICAL_ITEM_PRICES=Object.fromEntries(PRODUCTS.slice(0,3).map(p=>[p.id,p.price])) as Record<Item,number>;
export function productPrice(s:GameState,item:Item):number {return merchandisePrice(s,item);}
export function setProductPrice(s:GameState,item:Item,value:number):Result {return setMerchandisePrice(s,item,value);}
export function upgradeComputer(s:GameState,index:number):Result {
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(!Number.isInteger(index)||index<0||index>=count)return {ok:false,message:"PC inexistente."};
 const issue=stationUpgradeIssue(s,index);if(issue)return {ok:false,message:issue};
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
export const ITEM_WHOLESALE: Record<Item, number> = CLASSIC_WHOLESALE;
export const HISTORICAL_ITEM_WHOLESALE=Object.fromEntries(PRODUCTS.slice(0,3).map(p=>[p.id,p.packCost])) as Record<Item,number>;
export const ITEM_PACK=Object.fromEntries(PRODUCTS.slice(0,3).map(p=>[p.id,p.pack])) as Record<Item,number>;

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
export function sessionRevenue(hourly:number,minutes=SESSION_MINUTES,historical=false):number{
 return historical?sessionPrice(hourly,minutes):
  Math.round(Math.max(0,hourly)*Math.max(0,minutes)/60);
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
 const tariff=isHistorical(state as GameState)?priceIndex(1998+year):Math.pow(1.03,Math.min(25,year));
 const base=(65+state.expansionLevel*15)/(30*720);
 let hardware=0;
 for(let i=0;i<count;i++){
   if(!stationPoweredOn(state,i))continue;
   const tier=Math.max(1,Math.min(3,state.pcTiers?.[i]??1));
   const load=state.pcComponents?.[i]?hardwareLoadWatts(hardwareFor(state,i))/68:1+(tier-1)*.42;
   hardware+=0.0007*load+0.0014*(gpuSpec(installedGpu(state as GameState,i))?.power??0)-
     (lcdSpec(installedLcd(state,i))?.powerSaving??0);
 }
 const powered=Array.from({length:count},(_,i)=>i).filter(i=>stationPoweredOn(state,i));
 const averageTier=powered.length?powered.map(i=>Math.max(1,Math.min(3,state.pcTiers?.[i]??1)))
   .reduce((sum,tier)=>sum+(1+(tier-1)*0.42),0)/powered.length:1;
 return tariff*(base+hardware+Math.min(powered.length,Math.max(0,busy))*0.0030*averageTier);
}
export function energyMonthlyEstimate(state:Pick<GameState,"internetTier"|"expansionLevel"> & Partial<GameState>):number {
 return Math.round(energyCostPerMinute({...state,totalMinutes:state.totalMinutes??0},state.customers?.filter(c=>c.stage==="using").length??0)*30*720);
}
export function monthlyBills(state: Pick<GameState, "internetTier" | "expansionLevel"> & Partial<GameState>): number {
 const factor=isHistorical(state as GameState)?priceIndex(yearFromMinutes(state.totalMinutes??0)):1;
 const rent = Math.round((270 + state.expansionLevel * 170)*factor);
 const internet = Math.round((110 + (state.internetTier - 1) * 85)*factor);
 // Ao fechar o mês, usar o consumo acumulado; para saves antigos, projetar.
 const energy = state.energyAccrued!==undefined?Math.round(state.energyAccrued):energyMonthlyEstimate(state);
 const maintenance = Math.round((75 + state.expansionLevel * 35)*factor);
 const wages=Math.round((state.employeePayrollAccrued??0)*100)/100;
  return Math.round((rent+internet+energy+maintenance+wages)*100)/100;
}
export function setHourlyPrice(state: GameState, amount: number): Result {
  if(!isHistorical(state)){
   if(!Number.isInteger(amount)||amount<4||amount>40)return {ok:false,message:"Preço permitido: R$ 4 a R$ 40."};
   state.pricePerHour=amount;
   return {ok:true,message:"Preço alterado para R$ "+amount+"/h."};
  }
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
  return quoteOrder(state,item,supplierLevel(state)===2?"partner":"basic");
}

export function contractSupplier(state:GameState):Result {
  if(supplierLevel(state)===2)return {ok:false,message:"Fornecedor parceiro já contratado."};
  const fee=180;
  if(state.cash<fee)return {ok:false,message:"Caixa insuficiente para fornecedor parceiro: R$ "+fee+"."};
  state.cash-=fee;state.expenses+=fee;state.supplierTier=2;
  return {ok:true,message:"Fornecedor parceiro contratado: -R$ 180. Novos lotes custam 20% menos."};
}
export function stockItem(state:GameState,item:Item):Result {
 return orderMerchandise(state,item,supplierLevel(state)===2?"partner":"basic");
}
export function sellItem(state:GameState,item:Item):Result {return sellMerchandise(state,item);}
/** Taxa única de regularização básica; novas compras acompanham o índice monetário.
 * Saves já regularizados permanecem válidos e nunca são cobrados novamente.
 */
export const BASIC_GAMES_LICENSE_COST_1998=450;
export function basicGamesLicenseCost(state:Pick<GameState,"totalMinutes"|"economyVersion">):number{
  return isHistorical(state)
    ? Math.round(BASIC_GAMES_LICENSE_COST_1998*priceIndex(yearFromMinutes(state.totalMinutes))*100)/100
    : BASIC_GAMES_LICENSE_COST_1998;
}
export function licenseGames(state:GameState):Result {
  if(state.licensedGames)return {ok:false,message:"Catálogo já regularizado. Licença permanente, sem renovação."};
  const cost=basicGamesLicenseCost(state);
  const text=cost.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  if(state.cash<cost)return {ok:false,message:"Caixa insuficiente: regularização dos jogos custa "+text+"."};
  state.cash-=cost;state.expenses+=cost;state.licensedGames=true;
  return {ok:true,message:"Catálogo de jogos regularizado por taxa única: -"+text+". Licença permanente."};
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
