import {validateObjectPlacements} from "./editableObjects.js";
import type { Costume, Customer, GameState, Item, Point, Result } from "./types.js";
import { DAY_MINUTES, OPEN_HOUR, SESSION_MINUTES } from "./types.js";
import { customerSatisfactionDelta, demandFactor, monthlyBills, sellItem, sessionRevenue, hardwareSatisfactionBonus, energyCostPerMinute } from "./economy.js";
import {INITIAL_CASH,paidMonthlyBillReceipt,validPaidMonthlyBill} from "./financialClarity.js";
import { AISLE_Y, COUNTER_QUEUE, VENDING_QUEUE, computerSeat, hallwayRoute } from "./route.js";
import { counterQueueCustomers, counterQueueSlot, MAX_COUNTER_QUEUE, CUSTOMER_COLLISION_RADIUS } from "./checkoutQueue.js";
import { vendingApproach,purchaseApproach,type PlacedPoint } from "./layout.js";
import { productPrice } from "./economy.js";
import { directionFromDelta } from "../render/direction.js";
import { chooseSessionMinutes, initialNeeds, selectPurchase, tickNeeds, consumePurchase } from "./needs.js";
import {navigableRoute,canTraverseLocalStep} from "./navigation.js";
import {refreshRetailQueues,firstRetailCustomer} from "./retailQueue.js";
import {annexComputerPosition} from "./stations.js";
import {roomBounds} from "./room.js";
import {tickServices,pcUnderRepair,addWaste,dispatchHiredStaff} from "./services.js";
import {accrueEmployeeDay,validEmployeeState} from "./staff.js";
import {reviewNotices} from "./notices.js";
import {scheduleDecisions} from "./decisions.js";
import {serveDiscCopy,validDiscCopier,discWalkInDue,discWalkInKind,discReferencePrice,discCopiesToday,DISC_COPIES_PER_DAY} from "./discCopy.js";
import {servePrinting,validPrinterService,printWalkInDue,printReferencePrice,pagesPrintedToday,PRINT_PAGES_PER_DAY} from "./printService.js";
import {GAME_LAST_MINUTE,GAME_END_DAY,isSporadicMailId} from "./mailCalendar.js";
import {storyVisitorMultiplier,STORY_IDS,CHAIN_IDS} from "./storyEvents.js";

import {praiseLine,complaintLine} from "./customerDialogue.js";
import {vipArrivalEligible,vipReputationAdjustment,serviceReputationImpact} from "./vip.js";
import { promotionVisitorMultiplier } from "./promotion.js";
import {recordComputerUtilization,closeFinancialMonth} from "./financialReview.js";
import {recordPaidSession,recordStationMinute,validStationLedger} from "./stationAccounting.js";
import {crowdRoute} from "./crowdNavigation.js";
import {validLcdModels} from "./computerModels.js";
import {validHardwareState} from "./hardware.js";
import {stationPoweredOn,validStationPower} from "./stationPower.js";
import {WINDOWS_ERAS} from "./era.js";
import {clampPriceToEra,normalizedHourlyPrice} from "./historicalEconomy.js";
import {ps1Seat,ps1SeatApproach,ps1StationAvailable,ps1SessionPrice,ps1EnergyCostPerMinute,
 ps1SessionWear,ps1HourPrice,validPs1State,PS1_UNLOCK_YEAR} from "./ps1.js";
import {validGpuGameLicenses,validGpuGameInstalls,validGpuGameInstallJobs,tickGpuGameInstallations,gpuGameInstallJob,gpuGameSpec,gpuGamePlayableOnPc,gpuGameHourlyRate,gpuGameSessionPrice,wantsGpuGame,preferredGpuGame} from "./gpuGames.js";
import {recordGpuGameRequest,recordGpuGameSession,validGpuGameDemand} from "./gpuDemand.js";
import {validEraGameLicenses,eraGameVisitorMultiplier} from "./eraGames.js";

const COSTUMES: Costume[] = ["regular", "regular", "regular", "regular", "clown", "vampire", "stitched-monster", "rabbit", "mouse-mascot"];
/** Encerrar de forma gradual: últimos visitantes até 20h30, início da saída às 21h. */
export const LAST_ADMISSION_MINUTE = DAY_MINUTES-90;
export const CLOSING_START_MINUTE = DAY_MINUTES-60;
const SESSION_FINISH_MINUTE = DAY_MINUTES-30; // Últimas sessões terminam até 21h30.
const localMinute = (s:GameState):number => s.totalMinutes%DAY_MINUTES;
export function createGame(seed=72421,economyMode:"classic"|"historical"="classic"):GameState {
  return {
    version: 1, totalMinutes: 0, leftoverMinutes: 0, rng: seed >>> 0,
    mailScheduleSeed:seed>>>0,mailStartDay:1,mailSeenIds:[],
    cash: INITIAL_CASH, revenue: 0, expenses: 0, reputation: 75,
    monthPcUsedMinutes:0,monthPcCapacityMinutes:0,monthRevenueBase:0,monthExpensesBase:0,
    pricePerHour:economyMode==="historical"?2.5:12,
    ...(economyMode==="historical"?{economyVersion:2 as const}:{retailPrices:{soda:8,candy:5,snacks:9}}),
    pcTiers:[1,1,1], pcGpus:[null,null,null], internetTier: 1, offlineUntil: 0, licensedGames: false,
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
export function pcPosition(i: number,s?:GameState): PlacedPoint {
 const custom=s?.objectPlacements?.find(p=>p.id==="pc:"+i);if(custom)return {...custom};
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
  const origin={x:c.x,y:c.y};
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
    if(canTraverseLocalStep(s,{x:c.x,y:c.y},desired)&&canTraverseLocalStep(s,origin,desired)&&canCustomerOccupy(s,c,desired)){
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
        if(canTraverseLocalStep(s,{x:c.x,y:c.y},alternative)&&canTraverseLocalStep(s,origin,alternative)&&canCustomerOccupy(s,c,alternative)){
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
export const EXIT_REACH_DISTANCE=.32;
function moveRoute(s:GameState,c: Customer): boolean {
  const before=Math.hypot(c.x-c.target.x,c.y-c.target.y);
  if (!move(s,c)) {
    const after=Math.hypot(c.x-c.target.x,c.y-c.target.y);
    // Um desvio local pode ficar oscilando diante de uma fila compacta.
    // Replanejar até o destino final permite contornar também o waypoint ocupado.
    if(after>=before-.005&&s.totalMinutes>=(c.nextCrowdRetryMinute??0)){
      c.nextCrowdRetryMinute=s.totalMinutes+4;
      // Uma sessão de console sempre termina pela lateral da cadeira.
      // Replanejar diretamente até o assento poderia mandar o visitante
      // atravessar novamente a bancada/TV após encontrar outra pessoa.
      const seat=c.ps1StationIndex!==undefined&&c.stage==="to_pc"
        ?ps1Seat(s,c.ps1StationIndex):null;
      const side=c.ps1StationIndex!==undefined&&c.stage==="to_pc"
        ?ps1SeatApproach(s,c.ps1StationIndex):null;
      if(seat&&side&&!canTraverseLocalStep(s,side,seat))return false;
      const destination=seat&&side?side:(c.route?.at(-1)??c.target);
      const path=crowdRoute(s,c,destination);
      if(path?.length){
        c.target=path[0]!;
        c.route=[...path.slice(1),...(seat&&side&&canTraverseLocalStep(s,side,seat)?[seat]:[])];
      }
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
 // O título pedido governa a seleção: uma GPU capaz de rodar OUTRO
 // jogo não satisfaz a preferência. Clientes de saves antigos que ainda
 // não possuem preferência mantêm a lógica anterior de prioridade premium.
 if(c.gpuGamer){
  for(let i=0;i<pcCount(s);i++){
   if(isReserved(s,i)||pcBroken(s,i)||!stationPoweredOn(s,i)||gpuGameInstallJob(s,i))continue;
   const playable=c.preferredGpuGame
    ?gpuGamePlayableOnPc(s,i,c.preferredGpuGame)
    :gpuGameHourlyRate(s,i)>s.pricePerHour;
   if(playable&&navigableRoute(s,origin,computerSeat(pcPosition(i,s))))return i;
  }
 }
 for(let i=0;i<pcCount(s);i++){
  if(isReserved(s,i)||pcBroken(s,i)||!stationPoweredOn(s,i)||gpuGameInstallJob(s,i))continue;
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
  c.stage = "leaving"; c.pcIndex = null; c.ps1StationIndex=undefined; c.queueIndex=undefined;
  c.retailQueueItem=undefined;c.retailQueueIndex=undefined;
  if(!setTravel(s,c,entrance(s)))c.route=[entrance(s)];
}
/** Avança cada cliente uma casa quando a primeira posição é liberada. */
function refreshCounterQueue(s:GameState):void {
  const line=counterQueueCustomers(s);
  for(let index=0;index<line.length;index++){
    const c=line[index]!,previousIndex=c.queueIndex;
    if(previousIndex===index)continue;
    const dest=counterQueueSlot(index,s);
    c.queueIndex=index;
    // Saves antigos: a pessoa já estava parada no ponto de atendimento.
    if(c.stage==="waiting"&&previousIndex===undefined&&index===0)continue;
    if(Math.hypot(c.x-dest.x,c.y-dest.y)<0.05){
      c.stage="waiting";c.target=dest;c.route=[];continue;
    }
    const previous=previousIndex===undefined?null:counterQueueSlot(previousIndex,s);
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
  if(s.objectPlacements?.some(p=>p.id==="counter"))return setTravel(s,c,destination);
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
    stage: "arriving", target: counterQueueSlot(queueIndex,s),queueIndex,
    costume, vip:vipArrivalEligible(s,s.nextCustomerId-1),
    gpuGamer:wantsGpuGame(s,s.nextCustomerId-1),
    preferredGpuGame:preferredGpuGame(s,s.nextCustomerId-1),
    pcIndex: null, usedMinutes: 0, waitingMinutes: 0,
    offlineWait: 0, happy: true,
    needs:initialNeeds(s.nextCustomerId-1),wallet:
    (s.economyVersion===2?5:12)+Math.floor(random(s)*(s.economyVersion===2?14:18))
  };
  if(!setTravel(s,c,c.target))return;
  if(c.preferredGpuGame)recordGpuGameRequest(s,c.preferredGpuGame);
  s.customers.push(c);
}
/** Clientes avulsos de impressão usam a mesma fila e saída física dos demais,
 * mas não reservam PCs nem recebem cobrança por sessão. */
function spawnPrintWalkIn(s:GameState):void {
 const queueIndex=counterQueueCustomers(s).length;
 if(queueIndex>=MAX_COUNTER_QUEUE)return;
 const entry=entrance(s);
 if(s.customers.some(c=>Math.hypot(c.x-entry.x,c.y-entry.y)<CUSTOMER_COLLISION_RADIUS+.1))return;
 const id=s.nextCustomerId;
 const seed=(Math.imul(id,2654435761)^(s.totalMinutes>>>0))>>>0;
 const reference=printReferencePrice(s);
 const wallet=s.economyVersion===2?Math.round(Math.max(5,reference*(2+seed%5))*100)/100:12+seed%17;
 // Quem nem sequer pode pagar uma página não ocupa espaço de quem veio jogar.
 if(wallet<(s.printer?.price??Infinity))return;
 const c:Customer={id,x:entry.x,y:entry.y,facing:"north",stage:"arriving",
  target:counterQueueSlot(queueIndex,s),queueIndex,costume:"regular",
  serviceRequest:"printing",wallet,pcIndex:null,usedMinutes:0,waitingMinutes:0,
  offlineWait:0,happy:true};
 if(!setTravel(s,c,c.target))return;
 s.nextCustomerId++;
 s.customers.push(c);
}
/** Outro tipo de visitante avulso; usa exatamente a mesma navegação e fila da impressão. */
function spawnDiscWalkIn(s:GameState):void {
 const queueIndex=counterQueueCustomers(s).length;
 if(queueIndex>=MAX_COUNTER_QUEUE)return;
 const entry=entrance(s);
 if(s.customers.some(c=>Math.hypot(c.x-entry.x,c.y-entry.y)<CUSTOMER_COLLISION_RADIUS+.1))return;
 const id=s.nextCustomerId,kind=discWalkInKind(id),copier=s.discCopier;
 if(!copier)return;
 const seed=(Math.imul(id,2246822519)^s.totalMinutes)>>>0;
 const wallet=Math.max(6,Math.round(discReferencePrice(s,kind)*(3+seed%4)));
 if(wallet<copier.prices[kind])return;
 const c:Customer={id,x:entry.x,y:entry.y,facing:"north",stage:"arriving",
  target:counterQueueSlot(queueIndex,s),queueIndex,costume:"regular",
  serviceRequest:"disc-copy",wallet,pcIndex:null,usedMinutes:0,waitingMinutes:0,
  offlineWait:0,happy:true};
 if(!setTravel(s,c,c.target))return;
 s.nextCustomerId++;s.customers.push(c);
}
function tryServe(s: GameState, c: Customer): void {
  if(counterQueueCustomers(s)[0]?.id!==c.id||s.totalMinutes<(s.counterBusyUntil??0)){
    c.waitingMinutes++;return;
  }
  if(c.serviceRequest==="printing"){
    // O atendente só imprime quando há espaço na fila e tempo de expediente.
    if(localMinute(s)>=CLOSING_START_MINUTE){sendHome(s,c);return;}
    const result=servePrinting(s,c);
    if(result){
      s.counterBusyUntil=s.totalMinutes+3;
      addLog(s,"Cliente avulso imprimiu "+result.pages+" página(s): +R$ "+result.revenue+" · papel/tinta -R$ "+result.cost+".");
      s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:result.revenue,x:c.x,y:c.y});
      s.printEffects=queueVisualEvent(s.printEffects,{customerId:c.id});
    }else{
      addLog(s,"Cliente de impressão saiu sem atendimento.");
    }
    sendHome(s,c);
    return;
  }
  if(c.serviceRequest==="disc-copy"){
    if(localMinute(s)>=CLOSING_START_MINUTE){sendHome(s,c);return;}
    const result=serveDiscCopy(s,c);
    if(result){
      s.counterBusyUntil=s.totalMinutes+3;
      addLog(s,"Cliente avulso copiou "+result.quantity+" "+result.kind.toUpperCase()+"(s): +R$ "+result.revenue+" · mídias -R$ "+result.cost+".");
      s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:result.revenue,x:c.x,y:c.y});
    }else{
      addLog(s,"Cliente de cópias saiu sem atendimento.");
    }
    sendHome(s,c);
    return;
  }
  // Em 2002 as bancadas de videogame passam a dividir o público com PCs.
  // Um em cada cinco visitantes não gamers prefere console; nunca há
  // reservas extras nem sorteio novo. Só cobra quando a rota existe.
  // Quando todos os PCs estão desligados, o console continua sendo
  // um serviço independente: qualquer visitante pode escolhê-lo.
  // Com PCs ligados, manter a preferência histórica de 1 em 5.
  const poweredPcs=Array.from({length:pcCount(s)},(_,i)=>i).some(i=>stationPoweredOn(s,i));
  const consoleIndex=((!c.gpuGamer&&c.id%5===0)||!poweredPcs)?(s.ps1Stations??[]).findIndex((_,i)=>{
    if(!ps1StationAvailable(s,i))return false;
    const side=ps1SeatApproach(s,i),seat=ps1Seat(s,i);
    return !!side&&!!seat&&!!navigableRoute(s,{x:c.x,y:c.y},side)&&
      (canTraverseLocalStep(s,side,seat)||!!navigableRoute(s,side,seat));
  }): -1;
  const consoleSeat=consoleIndex>=0?ps1Seat(s,consoleIndex):null;
  const consoleSide=consoleIndex>=0?ps1SeatApproach(s,consoleIndex):null;
  if(consoleSeat&&consoleSide){
    const remaining=SESSION_FINISH_MINUTE-localMinute(s);
    if(remaining<30||localMinute(s)>=CLOSING_START_MINUTE){sendHome(s,c);return;}
    c.sessionMinutes??=chooseSessionMinutes(c,s.economyVersion===2);
    if(c.sessionMinutes>remaining)c.sessionMinutes=
      ([240,180,120,90,60,45,30] as number[]).find(n=>n<=remaining)??30;
    if(leaveCounterForPc(s,c,consoleSide)){
      // Já na lateral da bancada, entrar pela frente da cadeira em linha
      // direta. A rota padrão pelo corredor faria o ator voltar e atravessar a TV.
      const tail=canTraverseLocalStep(s,consoleSide,consoleSeat)
       ?[consoleSeat]:navigableRoute(s,consoleSide,consoleSeat)!;
      c.route=[...(c.route??[]),...tail];
      const paid=ps1SessionPrice(s,c.sessionMinutes);
      c.pcIndex=null;c.ps1StationIndex=consoleIndex;
      c.queueIndex=undefined;c.stage="to_pc";s.counterBusyUntil=s.totalMinutes+3;
      s.cash+=paid;s.revenue+=paid;s.served++;
      s.ps1Sessions=(s.ps1Sessions??0)+1;s.ps1Revenue=Math.round(((s.ps1Revenue??0)+paid)*100)/100;
      s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:paid,x:c.x,y:c.y});
      addLog(s,"Cliente pagou R$ "+paid.toFixed(2)+" por "+c.sessionMinutes+
        " minutos de PlayStation 1 na bancada "+(consoleIndex+1)+".");
      return;
    }
  }
  const index=chooseAvailablePc(s,c);
  if (index === undefined) {
    c.waitingMinutes++;
    if (c.waitingMinutes > (c.vip?19:25)) {
      s.lostCustomers++; s.reputation = Math.max(10, s.reputation - 0.4);
      customerSays(s,c,complaintLine("queue",c.id));
      sendHome(s, c);
    }
    return;
  }
  // Uma sessão nova só é cobrada se tiver duração para terminar antes da saída final.
  const available=SESSION_FINISH_MINUTE-localMinute(s);
  if(available<30 || localMinute(s)>=CLOSING_START_MINUTE){sendHome(s,c);return;}
  c.sessionMinutes??=chooseSessionMinutes(c,s.economyVersion===2);
  if(c.sessionMinutes>available)c.sessionMinutes=
    ([240,180,120,90,60,45,30] as number[]).find(n=>n<=available)??30;
  if(!leaveCounterForPc(s,c,computerSeat(pcPosition(index,s)))){
    c.waitingMinutes++;
    return; // Não cobrar se a sala não for acessível.
  }
  c.pcIndex=index;
  c.queueIndex=undefined;
  c.stage="to_pc";
  s.counterBusyUntil=s.totalMinutes+3;
  const regular=sessionRevenue(s.pricePerHour,c.sessionMinutes,s.economyVersion===2);
  const paid=s.economyVersion===2
   ?gpuGameSessionPrice(s,index,c.sessionMinutes,!!c.gpuGamer,c.preferredGpuGame)
   :regular;
  c.gpuGameCharged=paid>regular;
  if(c.preferredGpuGame)recordGpuGameSession(s,c.preferredGpuGame,
   gpuGamePlayableOnPc(s,index,c.preferredGpuGame),paid-regular);
  s.cash += paid; s.revenue += paid; s.served++;
  recordPaidSession(s,index,pcCount(s),paid,!!c.vip);
  addLog(s, "Cliente pagou R$ " + paid + " por " + c.sessionMinutes + " minutos."+
   (c.gpuGameCharged
    ?" Sessão GPU: "+(c.preferredGpuGame?gpuGameSpec(c.preferredGpuGame)?.name??"jogo avançado":"jogo avançado")+"."
    :""));
  const copy=serveDiscCopy(s,c);
  if(copy){
   addLog(s,"Cliente pediu "+copy.quantity+" cópia(s) de "+copy.kind.toUpperCase()+": +R$ "+copy.revenue+" · mídia -R$ "+copy.cost+".");
  }
  const printing=servePrinting(s,c);
  if(printing){
   addLog(s,"Cliente imprimiu "+printing.pages+" página(s): +R$ "+printing.revenue+" · papel/tinta -R$ "+printing.cost+".");
   s.printEffects=queueVisualEvent(s.printEffects,{customerId:c.id});
  }
  s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:paid+(copy?.revenue??0)+(printing?.revenue??0),x:c.x,y:c.y});
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
      if(next&&setTravel(s,c,purchaseApproach(next,s))){
        c.desiredItem=next;return;
      }
    }
  }
  sendHome(s, c);
}
function advanceCustomer(s: GameState, c: Customer): void {
  switch (c.stage) {
    case "arriving":
      if(localMinute(s)<CLOSING_START_MINUTE&&moveRoute(s,c))c.stage="waiting";
      return;
    case "waiting": if(localMinute(s)<CLOSING_START_MINUTE)tryServe(s, c);return;
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
      if (c.ps1StationIndex===undefined&&!online(s)) {
        c.offlineWait++;
        if (c.offlineWait > 15) {
          c.happy = false;
          s.reputation = Math.max(10, s.reputation - 1.1);
          addLog(s, "Cliente saiu insatisfeito com a internet.");
          customerSays(s,c,complaintLine("outage",c.id));
          startStanding(c, false);
        }
        return;
      }
      c.usedMinutes++;
      // Sessões de PlayStation são independentes de PC e da internet.
      // O controle do PS1 se desgasta, mas a sessão em curso termina.
      if(c.ps1StationIndex!==undefined)ps1SessionWear(s,c.ps1StationIndex);
      else if(c.pcIndex!==null)(s.pcWear??=[])[c.pcIndex]=
        Math.min(100,pcWear(s,c.pcIndex)+(0.045 / (s.pcTiers?.[c.pcIndex]??1)));
      if (c.usedMinutes >= (c.sessionMinutes??SESSION_MINUTES)) {
        const consoleSession=c.ps1StationIndex!==undefined;
        const bonus=consoleSession?0:hardwareSatisfactionBonus(s,c.pcIndex??-1);
        // Consoles e computadores têm tabelas de preço independentes.
        // A satisfação do cliente PS1 usa a tarifa que ele realmente pagou.
        const paidHourly=normalizedHourlyPrice(s,consoleSession?ps1HourPrice(s):s.pricePerHour);
        const rating=Math.max(-.9,Math.min(0.30,customerSatisfactionDelta(paidHourly,c.waitingMinutes,c.offlineWait)+
          bonus+vipReputationAdjustment(c,bonus,paidHourly)));
        const impact=c.happy?serviceReputationImpact(s.reputation,paidHourly,bonus,rating):Math.min(0,rating);
        c.happy=impact>=0;
        s.reputation=Math.max(10,Math.min(100,s.reputation+impact));
        if(impact < -0.12){
          addLog(s,"Cliente avaliou mal: preço, espera ou conexão.");
          customerSays(s,c,complaintLine(c.offlineWait>0?"slow-internet":c.waitingMinutes>5?"wait":"price",c.id));
        }
        else if(impact >= 0.15){
          addLog(s,"Cliente elogiou a experiência na lan house.");
          customerSays(s,c,praiseLine(c.id),"praise");
        }
        c.desiredItem=selectPurchase(c,s.inventory,s);
        startStanding(c,c.desiredItem!==null);
      }
      return;
    case "standing":
      if(localMinute(s)>=CLOSING_START_MINUTE)return; // Aguarda sua vez na dispersão da saída.
      c.poseMinutes = (c.poseMinutes ?? 0) + 1;
      if (c.poseMinutes >= 3) {
        if(c.pcIndex!==null && pcBroken(s,c.pcIndex))addLog(s,"PC "+(c.pcIndex+1)+" precisa de manutenção.");
        c.pcIndex = null;c.ps1StationIndex=undefined;
        if (c.wantsSnack) {
          c.stage = "shopping";
          setTravel(s,c,c.desiredItem?purchaseApproach(c.desiredItem,s):vendingApproach("soda",s));
        } else sendHome(s, c);
      }
      return;
    case "shopping":
      if(localMinute(s)>=CLOSING_START_MINUTE)return; // Balcão encerrou as vendas; aguarda liberação para sair.
      if (moveRoute(s,c)&&firstRetailCustomer(s,c.desiredItem??"soda")===c.id&&Math.hypot(c.x-purchaseApproach(c.desiredItem??"soda",s).x,c.y-purchaseApproach(c.desiredItem??"soda",s).y)<.05) resolvePurchase(s, c);
      return;
    case "leaving": moveRoute(s,c); return;
  }
}
/** Não apagar clientes remanescentes ao virar o dia: concluem a saída fisicamente. */
function nextDay(s: GameState): void {
  for(const c of s.customers)if(c.stage!=="leaving")sendHome(s,c);
  // Na virada, máquina que envelheceu pode perder competitividade.
  if(clampPriceToEra(s))addLog(s,"Tarifa ajustada ao teto da época e aos computadores disponíveis.");
  s.weather = random(s) < 0.27 ? "rain" : "sun";
  s.offlineUntil = Math.min(s.offlineUntil, s.totalMinutes);
  addLog(s, s.weather === "rain" ? "Dia chuvoso: demanda menor e rede instável." : "Novo dia: portas abertas.");
  if (dayNumber(s) > 1 && (dayNumber(s) - 1) % 30 === 0) {
    // A conta encerra o mês que acabou, não antecipa o índice do mês seguinte.
    const closingState={...s,totalMinutes:Math.max(0,s.totalMinutes-1)};
    const bill=monthlyBills(closingState);
    const energy=Math.round(s.energyAccrued??0);
    const wages=s.employeePayrollAccrued??0;
    const cashAfterPayment=s.cash-bill;
    // Registrar as parcelas antes de limpar os acumuladores de energia/salários.
    const paidReceipt=paidMonthlyBillReceipt(closingState,dayNumber(s)-1,bill,cashAfterPayment);
    s.cash -= bill; s.expenses += bill;
    s.lastPaidMonthlyBill=paidReceipt;
    s.energyAccrued=0;
    s.employeePayrollAccrued=0;
    s.employeeWorkedDays={cleaner:0,technician:0};
    closeFinancialMonth(s);
    addLog(s, "Contas do mês pagas: -R$ " + bill + " (energia R$ "+energy+"; salários R$ "+wages+"; aluguel, internet e manutenção).");
  }
  // A diária do novo dia só entra depois do fechamento mensal anterior.
  accrueEmployeeDay(s);
  reviewNotices(s);
  scheduleDecisions(s);
  // Infrações dependem de cartas e prazos relativos, nunca de multas aleatórias diárias.
  if (s.cash < 0) addLog(s, "Atenção: caixa negativo. Reorganize a operação!");
}
export function visitorArrivalChance(s:GameState,occupied:number):number {
  // Não bloquear o público de console quando todos os PCs estão apagados.
  // O serviço PS1 não depende da internet e só admite clientes se há cadeira livre.
  const poweredPcs=Array.from({length:pcCount(s)},(_,i)=>i).filter(i=>stationPoweredOn(s,i)).length;
  const consoleCapacity=(s.ps1Stations??[]).filter((_,i)=>ps1StationAvailable(s,i)).length;
  if(!poweredPcs&&!consoleCapacity)return 0;
  if(localMinute(s)>=LAST_ADMISSION_MINUTE||
    (localMinute(s)<10&&s.customers.some(c=>c.stage==="leaving")))return 0;
  const consoleOnly=poweredPcs===0;
  const rate=normalizedHourlyPrice(s,consoleOnly?ps1HourPrice(s):s.pricePerHour);
  const factor=demandFactor(rate,s.reputation,consoleOnly||online(s),s.weather==="rain");
  const congestion=occupied>=poweredPcs+(s.ps1Stations?.length??0)?0.38:1;
  return 0.052*factor*promotionVisitorMultiplier(s)*storyVisitorMultiplier(s)*eraGameVisitorMultiplier(s)*congestion;
}
/** Dispensa em pequenos grupos: fila e compras primeiro, sessões até 21h30. */
function prepareClosing(s:GameState):void {
 const minute=localMinute(s);
 if(minute<CLOSING_START_MINUTE)return;
 const exit=entrance(s);
 const active=(c:Customer)=>c.stage==="using"||c.stage==="sitting"||c.stage==="to_pc";
 const candidates=s.customers.filter(c=>c.stage!=="leaving").sort((a,b)=>{
   if(active(a)!==active(b))return active(a)?1:-1;
   return Math.hypot(a.x-exit.x,a.y-exit.y)-Math.hypot(b.x-exit.x,b.y-exit.y)||a.id-b.id;
 });
 // Poucos clientes por vez: um a cada dois minutos no começo, um por
 // minuto depois das 21h20. Evita uma debandada quando muitos PCs desocupam.
 if(minute<CLOSING_START_MINUTE+20&&(minute-CLOSING_START_MINUTE)%2!==0)return;
 const next=candidates.find(c=>
   !active(c)||minute>=SESSION_FINISH_MINUTE||c.usedMinutes>=(c.sessionMinutes??SESSION_MINUTES));
 if(next)sendHome(s,next);
}
function advanceMinute(s: GameState): void {
  if(s.totalMinutes>=GAME_LAST_MINUTE)return;
  // Cobrar o consumo real por minuto: cada PC ligado usa standby; ocupados consomem mais.
  // Acumular inclusive o último minuto antes da virada mensal.
  const energyExpense=energyCostPerMinute(s)+ps1EnergyCostPerMinute(s);
  s.energyAccrued=(s.energyAccrued??0)+energyExpense;
  recordComputerUtilization(s);
  recordStationMinute(s,pcCount(s),energyExpense);
  s.totalMinutes++;
  if(s.economyVersion===2&&s.totalMinutes===4*360*DAY_MINUTES)
    addLog(s,"2002: chegaram os videogames! A loja agora oferece bancada com PlayStation 1, TV de tubo e cadeira.");
  for(const installed of tickGpuGameInstallations(s))
    addLog(s,"Download concluído: "+gpuGameSpec(installed.id)?.name+" no PC "+(installed.pc+1)+".");
  if(s.totalMinutes===GAME_LAST_MINUTE)addLog(s,"Fim de 2030: calendário da campanha concluído.");
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
  dispatchHiredStaff(s);
  // Uma visita contratual ainda ativa após a virada do dia ganha uma só diária
  // no novo dia, também quando o jogo retoma um save intermediário.
  accrueEmployeeDay(s);
  tickServices(s);
  prepareClosing(s);
  const occupied = s.customers.filter(c => c.stage === "using" || c.stage === "to_pc").length;
  const admission=visitorArrivalChance(s,occupied);
  if (s.customers.length < 14 && admission>0 && random(s)<admission)spawn(s);
  // Outra fonte de movimento comercial: sem PC, sem receita passiva e sem RNG adicional.
  if(s.customers.length<14&&printWalkInDue(s)&&pagesPrintedToday(s)<PRINT_PAGES_PER_DAY)spawnPrintWalkIn(s);
  if(s.customers.length<14&&discWalkInDue(s)&&discCopiesToday(s)<DISC_COPIES_PER_DAY)spawnDiscWalkIn(s);
  if(localMinute(s)<CLOSING_START_MINUTE){
    refreshCounterQueue(s);
    refreshRetailQueues(s);
  }
  // Remover cada cliente assim que atravessa a soleira, liberando a porta
  // antes do próximo. Dar prioridade a quem já está saindo e está mais perto.
  const exit=entrance(s);
  const order=[...s.customers].sort((a,b)=>
    a.stage==="leaving"&&b.stage!=="leaving"?-1:
    a.stage!=="leaving"&&b.stage==="leaving"?1:
    a.stage==="leaving"&&b.stage==="leaving"?
      Math.hypot(a.x-exit.x,a.y-exit.y)-Math.hypot(b.x-exit.x,b.y-exit.y):a.id-b.id);
  for(const c of order){
    tickNeeds(c);advanceCustomer(s,c);
    if(c.stage==="leaving"&&Math.hypot(c.x-exit.x,c.y-exit.y)<=EXIT_REACH_DISTANCE){
      const index=s.customers.indexOf(c);if(index>=0)s.customers.splice(index,1);
    }
  }
  if(s.totalMinutes%70===0)addWaste(s,2);
}
export function stepGame(s: GameState, deltaMinutes: number): void {
  if (!Number.isFinite(deltaMinutes) || deltaMinutes <= 0) return;
  if(s.totalMinutes>=GAME_LAST_MINUTE){s.totalMinutes=GAME_LAST_MINUTE;s.leftoverMinutes=0;return;}
  s.leftoverMinutes += Math.min(deltaMinutes, 120);
  while (s.leftoverMinutes >= 1 && s.totalMinutes<GAME_LAST_MINUTE) {
    s.leftoverMinutes--;advanceMinute(s);
  }
  if(s.totalMinutes>=GAME_LAST_MINUTE)s.leftoverMinutes=0;
}
export function isValidSave(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<GameState>;
  const metrics=[v.monthPcUsedMinutes,v.monthPcCapacityMinutes,v.lastMonthPcUsedMinutes,
    v.lastMonthPcCapacityMinutes,v.monthRevenueBase,v.monthExpensesBase,v.lastMonthRevenue,v.lastMonthExpenses];
  return validEmployeeState(v) && validStationPower(v) && validPs1State(v) && validPaidMonthlyBill(v.lastPaidMonthlyBill,v) && (v.economyVersion===undefined||v.economyVersion===2) && validDiscCopier(v) && validPrinterService(v) && validHardwareState(v) && validGpuGameLicenses(v.licensedGpuGames,v) && validGpuGameInstalls(v.gpuGameInstalls,v) && validGpuGameInstallJobs(v.gpuGameInstallJobs,v) && validGpuGameDemand(v.gpuGameDemand) && validEraGameLicenses(v.licensedEraGames,v) && validLcdModels(v.pcLcdModels) && validStationLedger(v.stationLedger) &&
    (v.stationLedger===undefined||v.stationLedger.length<=pcCount(v as GameState)) &&
    (v.pcWindows===undefined||(Array.isArray(v.pcWindows)&&v.pcWindows.length<=200&&v.pcWindows.every(id=>id===null||WINDOWS_ERAS.some(w=>w.id===id)))) &&
    metrics.every(n=>n===undefined||(Number.isFinite(n)&&n>=0&&n<=1e9)) &&
    v.version === 1 && Number.isFinite(v.totalMinutes) && Number.isFinite(v.cash) &&
    Number.isFinite(v.rng) && Number.isFinite(v.pricePerHour) &&
    v.inventory !== undefined && ["soda", "candy", "snacks"].every(k => Number.isFinite(v.inventory?.[k as Item])) &&
    Array.isArray(v.customers) && v.customers.every(c=>!!c&&
      [c.purchasedDrink,c.purchasedFood,c.gpuGamer,c.gpuGameCharged,c.discCopyChecked,c.printChecked].every(flag=>flag===undefined||typeof flag==="boolean")&&
      (c.preferredGpuGame===undefined||(c.gpuGamer===true&&gpuGameSpec(c.preferredGpuGame)!==undefined))&&
      (c.serviceRequest===undefined||c.serviceRequest==="printing"||c.serviceRequest==="disc-copy")&&
      (c.ps1StationIndex===undefined||(Number.isInteger(c.ps1StationIndex)&&c.ps1StationIndex>=0&&
        c.ps1StationIndex<(v.ps1Stations?.length??0)&&c.pcIndex===null))&&
      (c.nextCrowdRetryMinute===undefined||(Number.isInteger(c.nextCrowdRetryMinute)&&c.nextCrowdRetryMinute>=0&&c.nextCrowdRetryMinute<=1e9))&&
      (c.retailQueueItem===undefined||["soda","candy","snacks"].includes(c.retailQueueItem))&&
      (c.retailQueueIndex===undefined||(Number.isInteger(c.retailQueueIndex)&&c.retailQueueIndex>=0&&c.retailQueueIndex<14))) && Array.isArray(v.eventLog) &&
    Number.isInteger(v.internetTier) && Number.isInteger(v.expansionLevel) &&
    (v.energyAccrued===undefined || (Number.isFinite(v.energyAccrued)&&v.energyAccrued>=0)) &&
    (v.binFill===undefined || (Array.isArray(v.binFill)&&v.binFill.length===2&&v.binFill.every(n=>Number.isFinite(n)&&n>=0&&n<=100))) &&
    (v.overflowWaste===undefined||(Number.isFinite(v.overflowWaste)&&v.overflowWaste>=0&&v.overflowWaste<=1000)) &&
    (v.mailScheduleSeed===undefined||(Number.isInteger(v.mailScheduleSeed)&&v.mailScheduleSeed>=0&&v.mailScheduleSeed<=0xffffffff)) &&
    (v.mailStartDay===undefined||(Number.isInteger(v.mailStartDay)&&v.mailStartDay>=1&&v.mailStartDay<=GAME_END_DAY)) &&
    (v.y2kNoticeDelivered===undefined||typeof v.y2kNoticeDelivered==="boolean") &&
    (v.mailSeenIds===undefined||(Array.isArray(v.mailSeenIds)&&v.mailSeenIds.length<=8&&
      new Set(v.mailSeenIds).size===v.mailSeenIds.length&&v.mailSeenIds.every(id=>isSporadicMailId(id)))) &&
    (v.storySeenIds===undefined||(Array.isArray(v.storySeenIds)&&v.storySeenIds.length<=STORY_IDS.length&&
      new Set(v.storySeenIds).size===v.storySeenIds.length&&
      v.storySeenIds.every(id=>STORY_IDS.some(key=>key===id)))) &&
    (v.storyRecords===undefined||(Array.isArray(v.storyRecords)&&v.storyRecords.length<=STORY_IDS.length+4&&
      new Set(v.storyRecords.map(r=>r.id)).size===v.storyRecords.length&&
      v.storyRecords.every(r=>!!r&&CHAIN_IDS.some(id=>id===r.id)&&
       typeof r.choice==="string"&&r.choice.length<=80&&
       (r.choiceLabel===undefined||(typeof r.choiceLabel==="string"&&r.choiceLabel.length<=200))&&
       ["good","mixed","bad"].includes(r.outcome)&&["pending","awaiting","ending","done"].includes(r.stage)&&
       Number.isInteger(r.dueDay)&&r.dueDay>=1&&r.dueDay<=1e7&&
       (r.followupChoice===undefined||(typeof r.followupChoice==="string"&&r.followupChoice.length<=80))&&
       (r.followupLabel===undefined||(typeof r.followupLabel==="string"&&r.followupLabel.length<=200))&&
       (r.finalOutcome===undefined||["good","mixed","bad"].includes(r.finalOutcome))))) &&
    (v.storyVisitorEffects===undefined||(Array.isArray(v.storyVisitorEffects)&&v.storyVisitorEffects.length<=32&&
      v.storyVisitorEffects.every(e=>!!e&&typeof e.id==="string"&&e.id.length<=100&&
       Number.isFinite(e.factor)&&e.factor>=0.5&&e.factor<=1.5&&
       Number.isInteger(e.untilDay)&&e.untilDay>=1&&e.untilDay<=1e7))) &&

    (v.notices===undefined || (Array.isArray(v.notices)&&v.notices.every(n=>typeof n.id==="string"&&typeof n.title==="string"&&typeof n.body==="string"&&typeof n.read==="boolean"))) &&
    [v.electricalInspectionSeen,v.electricalWiringRegularized,v.electricalExtensionUsed,v.electricalInspectionFineApplied]
      .every(flag=>flag===undefined||typeof flag==="boolean") &&
    (v.electricalDeadlineDay===undefined || (Number.isInteger(v.electricalDeadlineDay)&&v.electricalDeadlineDay>=1&&v.electricalDeadlineDay<=1e7)) &&
    (v.promotionDay===undefined || (Number.isInteger(v.promotionDay)&&v.promotionDay>=1&&v.promotionDay<=Math.floor(v.totalMinutes! / DAY_MINUTES)+1)) && validateObjectPlacements(v as GameState);
}
