import type { GameState, Inventory, Item, Result } from "./types.js";
import { SESSION_MINUTES } from "./types.js";

export const ITEM_PRICES: Record<Item, number> = { soda: 8, candy: 5, snacks: 9 };
export function productPrice(s:GameState,item:Item):number {
 const value=s.retailPrices?.[item];
 return Number.isInteger(value)&&value!>=1&&value!<=40?value!:ITEM_PRICES[item];
}
export function setProductPrice(s:GameState,item:Item,value:number):Result {
 if(!Number.isInteger(value)||value<1||value>40)return {ok:false,message:"Preço permitido: R$ 1 a R$ 40."};
 (s.retailPrices??={...ITEM_PRICES})[item]=value;
 return {ok:true,message:"Preço de "+item+" alterado para R$ "+value+"."};
}
export function upgradeComputer(s:GameState,index:number):Result {
 const count=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)))+(s.annexPcs?.length??0);
 if(!Number.isInteger(index)||index<0||index>=count)return {ok:false,message:"PC inexistente."};
 const tier=s.pcTiers?.[index]??1;
 if(tier>=3)return {ok:false,message:"PC no nível máximo."};
 const cost=tier*240;
 if(s.cash<cost)return {ok:false,message:"Caixa insuficiente para upgrade: R$ "+cost+"."};
 s.cash-=cost;s.expenses+=cost;(s.pcTiers??=[])[index]=tier+1;
 return {ok:true,message:"PC "+(index+1)+" atualizado para hardware nível "+(tier+1)+": -R$ "+cost+"."};
}
/** Hardware de maior nível melhora a experiência, com bônus modesto e limitado. */
export function hardwareSatisfactionBonus(state:GameState,index:number):number {
 const tier=state.pcTiers?.[index]??1;
 return Number.isInteger(tier)&&tier>=2?Math.min(2,tier-1)*0.08:0;
}
export const ITEM_WHOLESALE: Record<Item, number> = { soda: 40, candy: 28, snacks: 48 };
export const ITEM_PACK: Record<Item, number> = { soda: 10, candy: 14, snacks: 12 };

export function demandFactor(price: number, reputation: number, internetOnline: boolean, rainy: boolean): number {
  const priceEffect = Math.max(0.22, Math.min(1.65, 1.2 - (price - 12) * 0.045));
  const repEffect = Math.max(0.5, Math.min(1.25, reputation / 75));
  const weatherEffect = rainy ? 0.8 : 1;
  return priceEffect * repEffect * weatherEffect * (internetOnline ? 1 : 0.12);
}
export function customerSatisfactionDelta(price:number,wait:number,offline:number):number {
  const penalty=Math.max(0,price-12)*0.012+Math.max(0,wait-5)*0.014+Math.min(0.55,Math.max(0,offline)*0.025);
  return Math.max(-0.9,Math.min(0.22,0.22-penalty));
}
export function sessionRevenue(hourly: number, minutes = SESSION_MINUTES): number {
  return Math.round(Math.max(0, hourly) * Math.max(0, minutes) / 60);
}
export function monthlyBills(state: Pick<GameState, "internetTier" | "expansionLevel">): number {
  const rent = 270 + state.expansionLevel * 170;
  const internet = 110 + (state.internetTier - 1) * 85;
  const energy = 85 + state.expansionLevel * 55;
  const maintenance = 75 + state.expansionLevel * 35;
  return rent + internet + energy + maintenance;
}
export function setHourlyPrice(state: GameState, amount: number): Result {
  if (!Number.isInteger(amount) || amount < 4 || amount > 40) return { ok: false, message: "Preço permitido: R$ 4 a R$ 40." };
  state.pricePerHour = amount;
  return { ok: true, message: "Preço alterado para R$ " + amount + "/h." };
}
export function supplierLevel(state: GameState):1|2 {
  return state.supplierTier===2?2:1;
}
export function wholesaleCost(state:GameState,item:Item):number {
  // O parceiro cobra taxa de adesão e reduz o valor de novos pedidos.
  return supplierLevel(state)===2?Math.round(ITEM_WHOLESALE[item]*0.8):ITEM_WHOLESALE[item];
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
