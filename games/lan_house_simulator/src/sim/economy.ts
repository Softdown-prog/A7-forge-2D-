import type { GameState, Inventory, Item, Result } from "./types.js";
import { SESSION_MINUTES } from "./types.js";

export const ITEM_PRICES: Record<Item, number> = { soda: 8, candy: 5, snacks: 9 };
export const ITEM_WHOLESALE: Record<Item, number> = { soda: 40, candy: 28, snacks: 48 };
export const ITEM_PACK: Record<Item, number> = { soda: 10, candy: 14, snacks: 12 };

export function demandFactor(price: number, reputation: number, internetOnline: boolean, rainy: boolean): number {
  const priceEffect = Math.max(0.22, Math.min(1.65, 1.2 - (price - 12) * 0.045));
  const repEffect = Math.max(0.5, Math.min(1.25, reputation / 75));
  const weatherEffect = rainy ? 0.8 : 1;
  return priceEffect * repEffect * weatherEffect * (internetOnline ? 1 : 0.12);
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
  const value = ITEM_PRICES[item];
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
  return { ok: true, message: "Nova área com mais dois computadores! -R$ " + cost + "." };
}
export function cloneInventory(stock: Inventory): Inventory {
  return { soda: stock.soda, candy: stock.candy, snacks: stock.snacks };
}
