import type { Costume, Customer, GameState, Item, Point, Result } from "./types.js";
import { DAY_MINUTES, OPEN_HOUR, SESSION_MINUTES } from "./types.js";
import { demandFactor, monthlyBills, sellItem, sessionRevenue } from "./economy.js";

const COSTUMES: Costume[] = ["regular", "regular", "regular", "regular", "clown", "vampire", "stitched-monster", "rabbit", "mouse-mascot"];
export function createGame(seed = 72421): GameState {
  return {
    version: 1, totalMinutes: 0, leftoverMinutes: 0, rng: seed >>> 0,
    cash: 850, revenue: 0, expenses: 0, reputation: 75,
    pricePerHour: 12, internetTier: 1, offlineUntil: 0, licensedGames: false,
    expansionLevel: 0, inventory: { soda: 12, candy: 15, snacks: 10 },
    customers: [], nextCustomerId: 1, served: 0, lostCustomers: 0, purchases: 0,
    weather: "sun", eventLog: ["Dia 1: a Lan House Simulator abriu as portas!"]
  };
}
export function dayNumber(s: GameState): number { return Math.floor(s.totalMinutes / DAY_MINUTES) + 1; }
export function displayTime(s: GameState): string {
  const value = OPEN_HOUR * 60 + s.totalMinutes % DAY_MINUTES;
  return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
}
export function online(s: GameState): boolean { return s.totalMinutes >= s.offlineUntil; }
export function pcCount(s: GameState): number { return 3 + s.expansionLevel * 2; }
export function roomWidth(s: GameState): number { return 7 + s.expansionLevel * 2; }
export function entrance(s: GameState): Point { return { x: roomWidth(s) - 0.5, y: 5.35 }; }
export function pcPosition(i: number): Point {
  const positions: Point[] = [
    { x: 2.25, y: 3.05 }, { x: 3.75, y: 2.65 }, { x: 5.1, y: 2.2 },
    { x: 7.2, y: 2.2 }, { x: 8.3, y: 3.6 },
    { x: 9.5, y: 2.2 }, { x: 10.5, y: 3.6 }
  ];
  return positions[i] ?? positions[0];
}
function random(s: GameState): number {
  s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
  return s.rng / 0x100000000;
}
export function addLog(s: GameState, message: string): void {
  s.eventLog.unshift("D" + dayNumber(s) + " " + displayTime(s) + " · " + message);
  s.eventLog = s.eventLog.slice(0, 14);
}
export function applyResult(s: GameState, result: Result): Result {
  addLog(s, result.message);
  return result;
}
function move(c: Customer, speed = 0.38): boolean {
  const dx = c.target.x - c.x, dy = c.target.y - c.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= speed) { c.x = c.target.x; c.y = c.target.y; return true; }
  c.x += dx / distance * speed;
  c.y += dy / distance * speed;
  return false;
}
function isReserved(s: GameState, index: number): boolean {
  return s.customers.some(c => c.pcIndex === index && (c.stage === "to_pc" || c.stage === "using"));
}
function sendHome(s: GameState, c: Customer): void {
  c.stage = "leaving"; c.target = entrance(s); c.pcIndex = null;
}
function spawn(s: GameState): void {
  const e = entrance(s);
  const costume = COSTUMES[Math.floor(random(s) * COSTUMES.length)] ?? "regular";
  const c: Customer = {
    id: s.nextCustomerId++, x: e.x, y: e.y,
    stage: "arriving", target: { x: 1.8, y: 1.65 },
    costume, pcIndex: null, usedMinutes: 0, waitingMinutes: 0,
    offlineWait: 0, happy: true
  };
  s.customers.push(c);
}
function tryServe(s: GameState, c: Customer): void {
  const index = Array.from({ length: pcCount(s) }, (_, i) => i).find(i => !isReserved(s, i));
  if (index === undefined) {
    c.waitingMinutes++;
    if (c.waitingMinutes > 25) {
      s.lostCustomers++; s.reputation = Math.max(10, s.reputation - 0.4);
      sendHome(s, c);
    }
    return;
  }
  c.pcIndex = index;
  c.stage = "to_pc";
  c.target = pcPosition(index);
  const paid = sessionRevenue(s.pricePerHour);
  s.cash += paid; s.revenue += paid; s.served++;
  addLog(s, "Cliente pagou R$ " + paid + " por 45 minutos.");
}
function resolvePurchase(s: GameState, c: Customer): void {
  const items: Item[] = ["soda", "candy", "snacks"];
  const chosen = items[Math.floor(random(s) * items.length)] ?? "soda";
  const result = sellItem(s, chosen);
  if (result.ok) addLog(s, result.message);
  sendHome(s, c);
}
function advanceCustomer(s: GameState, c: Customer): void {
  switch (c.stage) {
    case "arriving":
      if (move(c)) c.stage = "waiting";
      return;
    case "waiting": tryServe(s, c); return;
    case "to_pc":
      if (move(c)) c.stage = "using";
      return;
    case "using":
      if (!online(s)) {
        c.offlineWait++;
        if (c.offlineWait > 15) {
          c.happy = false;
          s.reputation = Math.max(10, s.reputation - 1.1);
          addLog(s, "Cliente saiu insatisfeito com a internet.");
          sendHome(s, c);
        }
        return;
      }
      c.usedMinutes++;
      if (c.usedMinutes >= SESSION_MINUTES) {
        s.reputation = Math.min(100, s.reputation + (c.happy ? 0.08 : 0));
        if (random(s) < 0.47) {
          c.stage = "shopping";
          c.pcIndex = null;
          c.target = { x: 5.65, y: 1.05 };
        } else sendHome(s, c);
      }
      return;
    case "shopping":
      if (move(c)) resolvePurchase(s, c);
      return;
    case "leaving": move(c); return;
  }
}
function nextDay(s: GameState): void {
  s.customers = [];
  s.weather = random(s) < 0.27 ? "rain" : "sun";
  s.offlineUntil = Math.min(s.offlineUntil, s.totalMinutes);
  addLog(s, s.weather === "rain" ? "Dia chuvoso: demanda menor e rede instável." : "Novo dia: portas abertas.");
  if (dayNumber(s) > 1 && (dayNumber(s) - 1) % 30 === 0) {
    const bill = monthlyBills(s);
    s.cash -= bill; s.expenses += bill;
    addLog(s, "Contas do mês pagas: -R$ " + bill + " (aluguel, internet, energia, manutenção).");
  }
  if (!s.licensedGames && random(s) < 0.06) {
    const fine = 180;
    s.cash -= fine; s.expenses += fine; s.reputation = Math.max(10, s.reputation - 4);
    addLog(s, "Fiscalização encontrou jogos sem licença: multa de R$ 180.");
  }
  if (s.cash < 0) addLog(s, "Atenção: caixa negativo. Reorganize a operação!");
}
function advanceMinute(s: GameState): void {
  s.totalMinutes++;
  if (s.totalMinutes % DAY_MINUTES === 0) { nextDay(s); return; }
  if (s.offlineUntil === s.totalMinutes) addLog(s, "A internet voltou!");
  if (online(s)) {
    const chance = (s.weather === "rain" ? 0.00065 : 0.00015) / Math.sqrt(s.internetTier);
    if (random(s) < chance) {
      const duration = Math.max(7, 36 - s.internetTier * 8);
      s.offlineUntil = s.totalMinutes + duration;
      addLog(s, "Internet caiu! Previsão de reparo: " + duration + " minutos do jogo.");
    }
  }
  const occupied = s.customers.filter(c => c.stage === "using" || c.stage === "to_pc").length;
  if (s.customers.length < 14) {
    const factor = demandFactor(s.pricePerHour, s.reputation, online(s), s.weather === "rain");
    const congestion = occupied >= pcCount(s) ? 0.38 : 1;
    if (random(s) < 0.052 * factor * congestion) spawn(s);
  }
  for (const c of s.customers) advanceCustomer(s, c);
  const e = entrance(s);
  s.customers = s.customers.filter(c => c.stage !== "leaving" || Math.hypot(c.x - e.x, c.y - e.y) > 0.001);
}
export function stepGame(s: GameState, deltaMinutes: number): void {
  if (!Number.isFinite(deltaMinutes) || deltaMinutes <= 0) return;
  s.leftoverMinutes += Math.min(deltaMinutes, 120);
  while (s.leftoverMinutes >= 1) { s.leftoverMinutes--; advanceMinute(s); }
}
export function isValidSave(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<GameState>;
  return v.version === 1 && Number.isFinite(v.totalMinutes) && Number.isFinite(v.cash) &&
    Number.isFinite(v.rng) && Number.isFinite(v.pricePerHour) &&
    v.inventory !== undefined && ["soda", "candy", "snacks"].every(k => Number.isFinite(v.inventory?.[k as Item])) &&
    Array.isArray(v.customers) && Array.isArray(v.eventLog) &&
    Number.isInteger(v.internetTier) && Number.isInteger(v.expansionLevel);
}
