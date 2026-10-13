import type { Costume, Customer, GameState, Item, Point, Result } from "./types.js";
import { DAY_MINUTES, OPEN_HOUR, SESSION_MINUTES } from "./types.js";
import { customerSatisfactionDelta, demandFactor, monthlyBills, sellItem, sessionRevenue } from "./economy.js";
import { COUNTER_QUEUE, VENDING_QUEUE, computerSeat, hallwayRoute } from "./route.js";
import { directionFromDelta } from "../render/direction.js";

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
    // PCs em linha paralela à parede do fundo; cadeira e teclado mantêm âncoras.
    { x: 2.20, y: 1.72 }, { x: 3.65, y: 1.72 }, { x: 5.00, y: 1.72 },
    { x: 7.2, y: 1.85 }, { x: 7.85, y: 2.95 },
    { x: 9.5, y: 1.85 }, { x: 9.85, y: 2.95 }
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
  if(distance>0.0001)c.facing=directionFromDelta(dx,dy,c.facing);
  if (distance <= speed) { c.x = c.target.x; c.y = c.target.y; return true; }
  c.x += dx / distance * speed;
  c.y += dy / distance * speed;
  return false;
}
function setTravel(c: Customer, destination: Point): void {
  const points = hallwayRoute({ x: c.x, y: c.y }, destination);
  c.target = points[0]!;
  c.route = points.slice(1);
}
function moveRoute(c: Customer): boolean {
  if (!move(c)) return false;
  const next = c.route?.shift();
  if (next) { c.target = next; return false; }
  return true;
}
function startStanding(c: Customer, wantsSnack: boolean): void {
  c.stage = "standing";
  c.poseMinutes = 0;
  c.wantsSnack = wantsSnack;
}
function isReserved(s: GameState, index: number): boolean {
  return s.customers.some(c => c.pcIndex === index && (c.stage === "to_pc" || c.stage === "sitting" || c.stage === "using" || c.stage === "standing"));
}
function sendHome(s: GameState, c: Customer): void {
  c.stage = "leaving"; c.pcIndex = null;
  setTravel(c, entrance(s));
}
function spawn(s: GameState): void {
  const e = entrance(s);
  const costume = COSTUMES[Math.floor(random(s) * COSTUMES.length)] ?? "regular";
  const c: Customer = {
    id: s.nextCustomerId++, x: e.x, y: e.y, facing:"north",
    stage: "arriving", target: { ...COUNTER_QUEUE },
    costume, pcIndex: null, usedMinutes: 0, waitingMinutes: 0,
    offlineWait: 0, happy: true
  };
  setTravel(c, COUNTER_QUEUE);
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
  setTravel(c, computerSeat(pcPosition(index)));
  const paid = sessionRevenue(s.pricePerHour);
  s.cash += paid; s.revenue += paid; s.served++;
  (s.paymentEffects??=[]).push({amount:paid,x:c.x,y:c.y});
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
      if (moveRoute(c)) c.stage = "waiting";
      return;
    case "waiting": tryServe(s, c); return;
    case "to_pc":
      if (moveRoute(c)) { c.stage = "sitting"; c.poseMinutes = 0; }
      return;
    case "sitting":
      c.poseMinutes = (c.poseMinutes ?? 0) + 1;
      if (c.poseMinutes >= 3) { c.stage = "using"; c.poseMinutes = 0; }
      return;
    case "using":
      if (!online(s)) {
        c.offlineWait++;
        if (c.offlineWait > 15) {
          c.happy = false;
          s.reputation = Math.max(10, s.reputation - 1.1);
          addLog(s, "Cliente saiu insatisfeito com a internet.");
          startStanding(c, false);
        }
        return;
      }
      c.usedMinutes++;
      if (c.usedMinutes >= SESSION_MINUTES) {
        const rating=customerSatisfactionDelta(s.pricePerHour,c.waitingMinutes,c.offlineWait);
        const impact=c.happy?rating:Math.min(0,rating);
        c.happy=impact>=0;
        s.reputation=Math.max(10,Math.min(100,s.reputation+impact));
        if(impact < -0.12)addLog(s,"Cliente avaliou mal: preço, espera ou conexão.");
        else if(impact >= 0.15)addLog(s,"Cliente elogiou a experiência na lan house.");
        startStanding(c, random(s) < 0.47);
      }
      return;
    case "standing":
      c.poseMinutes = (c.poseMinutes ?? 0) + 1;
      if (c.poseMinutes >= 3) {
        c.pcIndex = null;
        if (c.wantsSnack) {
          c.stage = "shopping";
          setTravel(c, VENDING_QUEUE);
        } else sendHome(s, c);
      }
      return;
    case "shopping":
      if (moveRoute(c)) resolvePurchase(s, c);
      return;
    case "leaving": moveRoute(c); return;
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
