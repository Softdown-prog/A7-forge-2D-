import type { Costume, Customer, GameState, Item, Point, Result } from "./types.js";
import { DAY_MINUTES, OPEN_HOUR, SESSION_MINUTES } from "./types.js";
import { customerSatisfactionDelta, demandFactor, monthlyBills, sellItem, sessionRevenue, hardwareSatisfactionBonus, energyCostPerMinute } from "./economy.js";
import { AISLE_Y, COUNTER_QUEUE, VENDING_QUEUE, computerSeat, hallwayRoute } from "./route.js";
import { counterQueueCustomers, counterQueueSlot, MAX_COUNTER_QUEUE, CUSTOMER_COLLISION_RADIUS } from "./checkoutQueue.js";
import { vendingApproach } from "./layout.js";
import { productPrice } from "./economy.js";
import { directionFromDelta } from "../render/direction.js";
import { chooseSessionMinutes, initialNeeds, selectPurchase, tickNeeds, consumePurchase } from "./needs.js";
import {navigableRoute,canTraverseLocalStep} from "./navigation.js";
import {annexComputerPosition} from "./stations.js";
import {roomBounds} from "./room.js";
import {tickServices,pcUnderRepair,addWaste} from "./services.js";
import {reviewNotices} from "./notices.js";
import {scheduleDecisions} from "./decisions.js";
import {vipArrivalEligible,vipReputationAdjustment,serviceReputationImpact} from "./vip.js";
import { promotionVisitorMultiplier } from "./promotion.js";
import {recordComputerUtilization,closeFinancialMonth} from "./financialReview.js";
import {crowdRoute} from "./crowdNavigation.js";
import {validLcdModels} from "./computerModels.js";

const COSTUMES: Costume[] = ["regular", "regular", "regular", "regular", "clown", "vampire", "stitched-monster", "rabbit", "mouse-mascot"];
export function createGame(seed = 72421): GameState {
  return {
    version: 1, totalMinutes: 0, leftoverMinutes: 0, rng: seed >>> 0,
    cash: 850, revenue: 0, expenses: 0, reputation: 75,
    monthPcUsedMinutes:0,monthPcCapacityMinutes:0,monthRevenueBase:0,monthExpensesBase:0,
    pricePerHour: 12, retailPrices:{soda:8,candy:5,snacks:9}, pcTiers:[1,1,1], pcGpus:[null,null,null], internetTier: 1, offlineUntil: 0, licensedGames: false,
    expansionLevel: 0, roomExtensions:{west:0,east:0,south:0,north:0}, installedPcs:3, furniture:{poster:0,plant:0,table:0}, pcWear: [0,0,0], inventory: { soda: 12, candy: 15, snacks: 10 },
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
export function legacyPcCount(s:GameState):number{
 return Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??(3+s.expansionLevel*2)));
}
export function pcCount(s:GameState):number{return legacyPcCount(s)+(s.annexPcs?.length??0);}
export function pcWear(s:GameState,index:number):number { return Math.min(100,Math.max(0,s.pcWear?.[index]??0)); }
export function pcBroken(s:GameState,index:number):boolean { return pcWear(s,index)>=100||pcUnderRepair(s,index); }
export function roomWidth(s: GameState): number { return 8 + s.expansionLevel * 2; }
export function entrance(_s: GameState): Point {return {x:7.5,y:5.35};}
export function pcPosition(i: number,s?:GameState): Point {
 if(s&&i>=legacyPcCount(s)){
   const installed=s.annexPcs?.[i-legacyPcCount(s)];
   if(installed){const pos=annexComputerPosition(s,installed.slotId);if(pos)return pos;}
 }
  const positions: Point[] = [
    // Três PCs iniciais alinhados à parede do fundo; prateleira de salgadinhos movida para a lateral.
    { x: 2.20, y: 1.10 }, { x: 3.65, y: 1.10 }, { x: 5.00, y: 1.10 },
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
/** Verificação contra os outros corpos, independente da escala do Canvas. */
export function canCustomerOccupy(s:GameState,c:Customer,at:Point):boolean {
  return s.customers.every(other=>{
    if(other===c || other.id===c.id)return true;
    const current=Math.hypot(c.x-other.x,c.y-other.y);
    const next=Math.hypot(at.x-other.x,at.y-other.y);
    // Saves antigos podem conter sobreposição: permitir apenas passos que afastem.
    return next>=CUSTOMER_COLLISION_RADIUS ||
      (current<CUSTOMER_COLLISION_RADIUS&&next>current+0.0001);
  });
}
function move(s:GameState,c:Customer,speed=0.38):boolean {
  const dx=c.target.x-c.x,dy=c.target.y-c.y;
  const distance=Math.hypot(dx,dy);
  if(distance<=0.005){
    if(!canTraverseLocalStep(s,c,c.target)||!canCustomerOccupy(s,c,c.target))return false;
    c.x=c.target.x;c.y=c.target.y;return true;
  }
  c.facing=directionFromDelta(dx,dy,c.facing);
  // Subpassos impedem troca de lado atravessando o corpo do outro.
  const count=Math.ceil(Math.min(speed,distance)/0.10);
  const length=Math.min(speed,distance)/count;
  for(let i=0;i<count;i++){
    const vx=c.target.x-c.x,vy=c.target.y-c.y,remaining=Math.hypot(vx,vy);
    if(remaining<=0.005)break;
    const nx=vx/remaining,ny=vy/remaining,step=Math.min(length,remaining);
    const desired={x:c.x+nx*step,y:c.y+ny*step};
    if(canTraverseLocalStep(s,{x:c.x,y:c.y},desired)&&canCustomerOccupy(s,c,desired)){
      c.x=desired.x;c.y=desired.y;continue;
    }
    // Desvio local seguro inclusive em salas divididas: testar cada movimento
    // contra as divisórias antes de tentar contornar outros visitantes.
    {
      const bounds=roomBounds(s);
      for(const sign of [c.id%2===0?1:-1,c.id%2===0?-1:1]){
        const alternative={x:c.x+nx*step*0.65-ny*0.17*sign,
          y:c.y+ny*step*0.65+nx*0.17*sign};
        if(alternative.x<=bounds.minX+0.12||alternative.x>=bounds.maxX-0.12||
          alternative.y<=bounds.minY+0.12||alternative.y>=bounds.maxY-0.12)continue;
        if(canTraverseLocalStep(s,{x:c.x,y:c.y},alternative)&&canCustomerOccupy(s,c,alternative)){
          c.x=alternative.x;c.y=alternative.y;break;
        }
      }
    }
    return false; // Caso contrário, aguardar o outro passar.
  }
  if(Math.hypot(c.target.x-c.x,c.target.y-c.y)<=0.005){
    if(!canTraverseLocalStep(s,c,c.target)||!canCustomerOccupy(s,c,c.target))return false;
    c.x=c.target.x;c.y=c.target.y;return true;
  }
  return false;
}
function setTravel(s:GameState,c:Customer,destination:Point):boolean{
 const points=navigableRoute(s,{x:c.x,y:c.y},destination);
 if(!points?.length)return false;
 c.target=points[0]!;c.route=points.slice(1);
 return true;
}
function moveRoute(s:GameState,c: Customer): boolean {
  const before=Math.hypot(c.x-c.target.x,c.y-c.target.y);
  if (!move(s,c)) {
    const after=Math.hypot(c.x-c.target.x,c.y-c.target.y);
    // Um desvio local pode ficar oscilando diante de uma fila compacta.
    // Replanejar até o destino final permite contornar também o waypoint ocupado.
    if(after>=before-.005){
      const path=crowdRoute(s,c,c.route?.at(-1)??c.target);
      if(path?.length){c.target=path[0]!;c.route=path.slice(1);}
    }
    return false;
  }
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
/**
 * VIPs comparam QUALIDADE e distância navegável; clientes comuns mantêm
 * a seleção antiga do primeiro PC disponível. Não aumenta o fluxo de chegada,
 * nem muda preços, reservas, desgaste ou o caixa.
 * A distância efetiva é calculada pelos waypoints, respeitando salas/portas.
 * Empates favorecem o menor índice para não mudar os PCs básicos.
 */
export function chooseAvailablePc(s:GameState,c:Customer):number|undefined {
 let fallback:number|undefined,baseQuality=0,baseDistance=0;
 let preferred:number|undefined,bestGain=0;
 const origin={x:c.x,y:c.y};
 for(let i=0;i<pcCount(s);i++){
  if(isReserved(s,i)||pcBroken(s,i))continue;
  const destination=computerSeat(pcPosition(i,s));
  const route=navigableRoute(s,origin,destination);
  if(!route)continue;
  // A escolha inicial é sempre o primeiro PC acessível, para manter a
  // fila e a circulação aprovadas antes desta melhoria.
  if(fallback===undefined && !c.vip)return i;
  const quality=hardwareSatisfactionBonus(s,i);
  // Computar o trajeto real apenas se o visitante tem preferência VIP.
  let distance=0,previous=origin;
  for(const point of route){
   distance+=Math.hypot(point.x-previous.x,point.y-previous.y);
   previous=point;
  }
  if(fallback===undefined){
   fallback=i;baseQuality=quality;baseDistance=distance;continue;
  }
  // Nunca alterar o PC por empate de qualidade: evita desvio sem vantagem.
  if(quality<=baseQuality+0.00001)continue;
  const detour=Math.max(0,distance-baseDistance);
  const benefit=(quality-baseQuality)*110-detour;
  if(benefit>bestGain+1e-6){preferred=i;bestGain=benefit;}
 }
 return preferred??fallback;
}
/** Eventos de apresentação nunca devem crescer indefinidamente quando
 * o navegador está em segundo plano ou o motor roda em modo headless.
 * A UI continua consumindo a fila via splice(0) a cada render. */
function queueVisualEvent<T>(queue:T[]|undefined,item:T):T[]{
 const out=queue??[];
 out.push(item);
 if(out.length>48)out.splice(0,out.length-48);
 return out;
}
function customerSays(s:GameState,c:Customer,text:string,kind:"complaint"|"praise"="complaint"):void {
  s.speechEffects=queueVisualEvent(s.speechEffects,{text,x:c.x,y:c.y,kind});
}
function sendHome(s: GameState, c: Customer): void {
  c.stage = "leaving"; c.pcIndex = null; c.queueIndex=undefined;
  if(!setTravel(s,c,entrance(s)))c.route=[entrance(s)];
}
/** Avança cada cliente uma casa quando a primeira posição é liberada. */
function refreshCounterQueue(s:GameState):void {
  const line=counterQueueCustomers(s);
  for(let index=0;index<line.length;index++){
    const c=line[index]!,previousIndex=c.queueIndex;
    if(previousIndex===index)continue;
    const dest=counterQueueSlot(index);
    c.queueIndex=index;
    // Saves antigos: a pessoa já estava parada no ponto de atendimento.
    if(c.stage==="waiting"&&previousIndex===undefined&&index===0)continue;
    if(Math.hypot(c.x-dest.x,c.y-dest.y)<0.05){
      c.stage="waiting";c.target=dest;c.route=[];continue;
    }
    const previous=previousIndex===undefined?null:counterQueueSlot(previousIndex);
    if(previous&&previousIndex===index+1&&Math.hypot(c.x-previous.x,c.y-previous.y)<0.10){
      c.target=dest;c.route=[];c.stage="arriving";
    }else if(setTravel(s,c,dest)){
      c.stage="arriving";
    }else{
      c.queueIndex=undefined; // Recalcular caso alguma divisória bloqueie a passagem.
    }
  }
}

/** A saída lateral do caixa não cruza a coluna de pessoas aguardando. */
function leaveCounterForPc(s:GameState,c:Customer,destination:Point):boolean {
  const outside={x:2.46,y:COUNTER_QUEUE.y},aisle={x:2.46,y:AISLE_Y};
  // Uma divisória em outro cômodo não deve fazer o cliente pago retornar pela
  // coluna da fila. Usar a saída lateral se os dois segmentos forem livres.
  const onward=navigableRoute(s,aisle,destination);
  if(!onward?.length||!canTraverseLocalStep(s,c,outside)||
     !canTraverseLocalStep(s,outside,aisle))return setTravel(s,c,destination);
  c.target=outside;c.route=[aisle,...onward];
  return true;
}
function spawn(s: GameState): void {
  const queueIndex=counterQueueCustomers(s).length;
  if(queueIndex>=MAX_COUNTER_QUEUE)return;
  const e = entrance(s);
  // Entrada e saída compartilham a soleira: não materializar um novo corpo
  // em cima de quem está atravessando a porta.
  if(s.customers.some(c=>Math.hypot(c.x-e.x,c.y-e.y)<CUSTOMER_COLLISION_RADIUS+.1))return;
  const costume = COSTUMES[Math.floor(random(s) * COSTUMES.length)] ?? "regular";
  const c: Customer = {
    id: s.nextCustomerId++, x: e.x, y: e.y, facing:"north",
    stage: "arriving", target: counterQueueSlot(queueIndex),queueIndex,
    costume, vip:vipArrivalEligible(s,s.nextCustomerId-1), pcIndex: null, usedMinutes: 0, waitingMinutes: 0,
    offlineWait: 0, happy: true,
    needs:initialNeeds(s.nextCustomerId-1),wallet:12+Math.floor(random(s)*18)
  };
  if(!setTravel(s,c,c.target))return;
  s.customers.push(c);
}
function tryServe(s: GameState, c: Customer): void {
  if(counterQueueCustomers(s)[0]?.id!==c.id||s.totalMinutes<(s.counterBusyUntil??0)){
    c.waitingMinutes++;return;
  }
  const index=chooseAvailablePc(s,c);
  if (index === undefined) {
    c.waitingMinutes++;
    if (c.waitingMinutes > (c.vip?19:25)) {
      s.lostCustomers++; s.reputation = Math.max(10, s.reputation - 0.4);
      customerSays(s,c,"Que fila enorme!");
      sendHome(s, c);
    }
    return;
  }
  c.sessionMinutes??=chooseSessionMinutes(c);
  if(!leaveCounterForPc(s,c,computerSeat(pcPosition(index,s)))){
    c.waitingMinutes++;
    return; // Não cobrar se a sala não for acessível.
  }
  c.pcIndex=index;
  c.queueIndex=undefined;
  c.stage="to_pc";
  s.counterBusyUntil=s.totalMinutes+3;
  const paid = sessionRevenue(s.pricePerHour,c.sessionMinutes);
  s.cash += paid; s.revenue += paid; s.served++;
  s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:paid,x:c.x,y:c.y});
  addLog(s, "Cliente pagou R$ " + paid + " por " + c.sessionMinutes + " minutos.");
}
function resolvePurchase(s: GameState, c: Customer): void {
  const items: Item[] = ["soda", "candy", "snacks"];
  const chosen = c.desiredItem ?? (items[Math.floor(random(s) * items.length)] ?? "soda");
  // Não comprar algo indisponível ou que excede o orçamento pessoal.
  if(c.desiredItem && (s.inventory[chosen]<=0 || (c.wallet??18)<productPrice(s,chosen))){
    customerSays(s,c,s.inventory[chosen]<=0?"Produto esgotado!":"Está muito caro!");
    sendHome(s,c);return;
  }
  const result = sellItem(s, chosen);
  if (result.ok){
    if(c.desiredItem){
      c.wallet=Math.max(0,(c.wallet??18)-productPrice(s,chosen));
      consumePurchase(c,chosen);
    }
    s.saleEffects=queueVisualEvent(s.saleEffects,{item:chosen,amount:productPrice(s,chosen),x:c.x,y:c.y});
    addWaste(s,chosen==="soda"?5:3);
    addLog(s,result.message);
    // Uma bebida não elimina a fome. Permitir o outro grupo se necessário,
    // com dinheiro restante, estoque e rota reais; nunca repetir um grupo.
    if(c.desiredItem){
      const next=selectPurchase(c,s.inventory,s);
      if(next&&setTravel(s,c,next==="soda"?vendingApproach("soda"):vendingApproach("candy"))){
        c.desiredItem=next;return;
      }
    }
  }
  sendHome(s, c);
}
function advanceCustomer(s: GameState, c: Customer): void {
  switch (c.stage) {
    case "arriving":
      if (moveRoute(s,c)) c.stage = "waiting";
      return;
    case "waiting": tryServe(s, c); return;
    case "to_pc":
      if (moveRoute(s,c)) { c.stage = "sitting"; c.poseMinutes = 0; }
      return;
    case "sitting":
      c.poseMinutes = (c.poseMinutes ?? 0) + 1;
      if (c.poseMinutes >= 3) {
        c.stage = "using"; c.poseMinutes = 0;
        if(c.pcIndex!==null)s.keyboardEffects=queueVisualEvent(s.keyboardEffects,{customerId:c.id,pcIndex:c.pcIndex});
      }
      return;
    case "using":
      if (!online(s)) {
        c.offlineWait++;
        if (c.offlineWait > 15) {
          c.happy = false;
          s.reputation = Math.max(10, s.reputation - 1.1);
          addLog(s, "Cliente saiu insatisfeito com a internet.");
          customerSays(s,c,"Internet caiu!");
          startStanding(c, false);
        }
        return;
      }
      c.usedMinutes++;
      // Desgaste avança apenas durante uso; falha só bloqueia NOVAS reservas.
      (s.pcWear??=[])[c.pcIndex??-1]=Math.min(100,pcWear(s,c.pcIndex??-1)+(0.045 / (s.pcTiers?.[c.pcIndex??-1]??1)));
      if (c.usedMinutes >= (c.sessionMinutes??SESSION_MINUTES)) {
        const bonus=hardwareSatisfactionBonus(s,c.pcIndex??-1);
        const rating=Math.max(-.9,Math.min(0.30,customerSatisfactionDelta(s.pricePerHour,c.waitingMinutes,c.offlineWait)+bonus+vipReputationAdjustment(c,bonus,s.pricePerHour)));
        const impact=c.happy?serviceReputationImpact(s.reputation,s.pricePerHour,bonus,rating):Math.min(0,rating);
        c.happy=impact>=0;
        s.reputation=Math.max(10,Math.min(100,s.reputation+impact));
        if(impact < -0.12){
          addLog(s,"Cliente avaliou mal: preço, espera ou conexão.");
          customerSays(s,c,c.offlineWait>0?"Internet lenta!":c.waitingMinutes>5?"Demorou demais!":"Está caro!");
        }
        else if(impact >= 0.15){
          addLog(s,"Cliente elogiou a experiência na lan house.");
          customerSays(s,c,"Curti demais!","praise");
        }
        c.desiredItem=selectPurchase(c,s.inventory,s);
        startStanding(c,c.desiredItem!==null);
      }
      return;
    case "standing":
      c.poseMinutes = (c.poseMinutes ?? 0) + 1;
      if (c.poseMinutes >= 3) {
        if(c.pcIndex!==null && pcBroken(s,c.pcIndex))addLog(s,"PC "+(c.pcIndex+1)+" precisa de manutenção.");
        c.pcIndex = null;
        if (c.wantsSnack) {
          c.stage = "shopping";
          setTravel(s,c,c.desiredItem==="soda"?vendingApproach("soda"):c.desiredItem?vendingApproach("candy"):VENDING_QUEUE);
        } else sendHome(s, c);
      }
      return;
    case "shopping":
      if (moveRoute(s,c)) resolvePurchase(s, c);
      return;
    case "leaving": moveRoute(s,c); return;
  }
}
function nextDay(s: GameState): void {
  s.customers = [];
  s.weather = random(s) < 0.27 ? "rain" : "sun";
  s.offlineUntil = Math.min(s.offlineUntil, s.totalMinutes);
  addLog(s, s.weather === "rain" ? "Dia chuvoso: demanda menor e rede instável." : "Novo dia: portas abertas.");
  if (dayNumber(s) > 1 && (dayNumber(s) - 1) % 30 === 0) {
    const bill = monthlyBills(s);
    const energy=Math.round(s.energyAccrued??0);
    s.cash -= bill; s.expenses += bill;
    s.energyAccrued=0;
    closeFinancialMonth(s);
    addLog(s, "Contas do mês pagas: -R$ " + bill + " (incluindo energia R$ "+energy+"; aluguel, internet e manutenção).");
  }
  reviewNotices(s);
  scheduleDecisions(s);
  // Fiscalização aleatória apenas antes da autuação formal; impedir multa recorrente pelo mesmo fato.
  if (!s.licensedGames && !s.copyrightNoticeFine && random(s) < 0.06) {
    const fine = 180;
    s.cash -= fine; s.expenses += fine; s.reputation = Math.max(10, s.reputation - 4);
    addLog(s, "Fiscalização encontrou jogos sem licença: multa de R$ 180.");
  }
  if (s.cash < 0) addLog(s, "Atenção: caixa negativo. Reorganize a operação!");
}
export function visitorArrivalChance(s:GameState,occupied:number):number {
  const factor=demandFactor(s.pricePerHour,s.reputation,online(s),s.weather==="rain");
  const congestion=occupied>=pcCount(s)?0.38:1;
  return 0.052*factor*promotionVisitorMultiplier(s)*congestion;
}
function advanceMinute(s: GameState): void {
  // Cobrar o consumo real por minuto: cada PC ligado usa standby; ocupados consomem mais.
  // Acumular inclusive o último minuto antes da virada mensal.
  s.energyAccrued=(s.energyAccrued??0)+energyCostPerMinute(s);
  recordComputerUtilization(s);
  s.totalMinutes++;
  if(s.totalMinutes===1)reviewNotices(s);
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
  tickServices(s);
  const occupied = s.customers.filter(c => c.stage === "using" || c.stage === "to_pc").length;
  if (s.customers.length < 14) {
    if (random(s) < visitorArrivalChance(s,occupied)) spawn(s);
  }
  refreshCounterQueue(s);
  for (const c of s.customers) { tickNeeds(c); advanceCustomer(s, c); }
  if(s.totalMinutes%70===0)addWaste(s,2);
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
  const metrics=[v.monthPcUsedMinutes,v.monthPcCapacityMinutes,v.lastMonthPcUsedMinutes,
    v.lastMonthPcCapacityMinutes,v.monthRevenueBase,v.monthExpensesBase,v.lastMonthRevenue,v.lastMonthExpenses];
  return validLcdModels(v.pcLcdModels) && metrics.every(n=>n===undefined||(Number.isFinite(n)&&n>=0&&n<=1e9)) &&
    v.version === 1 && Number.isFinite(v.totalMinutes) && Number.isFinite(v.cash) &&
    Number.isFinite(v.rng) && Number.isFinite(v.pricePerHour) &&
    v.inventory !== undefined && ["soda", "candy", "snacks"].every(k => Number.isFinite(v.inventory?.[k as Item])) &&
    Array.isArray(v.customers) && v.customers.every(c=>!!c&&
      [c.purchasedDrink,c.purchasedFood].every(flag=>flag===undefined||typeof flag==="boolean")) && Array.isArray(v.eventLog) &&
    Number.isInteger(v.internetTier) && Number.isInteger(v.expansionLevel) &&
    (v.energyAccrued===undefined || (Number.isFinite(v.energyAccrued)&&v.energyAccrued>=0)) &&
    (v.binFill===undefined || (Array.isArray(v.binFill)&&v.binFill.length===2&&v.binFill.every(n=>Number.isFinite(n)&&n>=0&&n<=100))) &&
    (v.notices===undefined || (Array.isArray(v.notices)&&v.notices.every(n=>typeof n.id==="string"&&typeof n.title==="string"&&typeof n.body==="string"&&typeof n.read==="boolean"))) &&
    (v.promotionDay===undefined || (Number.isInteger(v.promotionDay)&&v.promotionDay>=1&&v.promotionDay<=Math.floor(v.totalMinutes! / DAY_MINUTES)+1));
}
