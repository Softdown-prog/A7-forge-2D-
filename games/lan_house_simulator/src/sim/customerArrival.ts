/** customerArrival.ts: módulo do runtime LHS; lógica executada por minuto do jogo. */
import type {Customer,GameState} from "./types.js";
import {counterQueueCustomers,counterQueueSlot,MAX_COUNTER_QUEUE} from "./checkoutQueue.js";
import {initialNeeds} from "./needs.js";
import {visitorPreference} from "./customerChoices.js";
import {discWalkInKind,discReferencePrice} from "./discCopy.js";
import {printReferencePrice} from "./printService.js";
import {vipArrivalEligible} from "./vip.js";
import {priceIndex,yearFromMinutes} from "./historicalEconomy.js";
import {wantsGpuGame,preferredGpuGame} from "./gpuGames.js";
import {recordGpuGameRequest} from "./gpuDemand.js";
import {entrance,random,COSTUMES} from "./simulationState.js";
import {setTravel} from "./customerMotion.js";
import {entranceAvailable} from "./customerFlow.js";

export function spawn(s: GameState): void {
  const queueIndex=counterQueueCustomers(s).length;
  if(queueIndex>=MAX_COUNTER_QUEUE)return;
  const e = entrance(s);
  // Entrada e saída compartilham a soleira: não materializar um novo corpo
  // em cima de quem está atravessando a porta.
  if(!entranceAvailable(s,e))return;
  const costume = COSTUMES[Math.floor(random(s) * COSTUMES.length)] ?? "regular";
  const c: Customer = {
    id: s.nextCustomerId++, x: e.x, y: e.y, facing:"north",
    stage: "arriving", target: counterQueueSlot(queueIndex,s),queueIndex,
    costume, vip:vipArrivalEligible(s,s.nextCustomerId-1),
    gpuGamer:wantsGpuGame(s,s.nextCustomerId-1),
    preferredGpuGame:preferredGpuGame(s,s.nextCustomerId-1),
    pcIndex: null, usedMinutes: 0, waitingMinutes: 0,
    offlineWait: 0, happy: true, budgetAware:true,
    preference:visitorPreference(s.nextCustomerId-1,s.mailScheduleSeed??0),
    needs:initialNeeds(s.nextCustomerId-1),wallet:
    Math.round(((s.economyVersion===2?5:12)+Math.floor(random(s)*(s.economyVersion===2?14:18)))*
      (s.economyVersion===2?priceIndex(yearFromMinutes(s.totalMinutes)):1)*100)/100
  };
  if(!setTravel(s,c,c.target))return;
  if(c.preferredGpuGame)recordGpuGameRequest(s,c.preferredGpuGame);
  s.customers.push(c);
}
/** Clientes avulsos de impressão usam a mesma fila e saída física dos demais,
 * mas não reservam PCs nem recebem cobrança por sessão. */
export function spawnPrintWalkIn(s:GameState):void {
 const queueIndex=counterQueueCustomers(s).length;
 if(queueIndex>=MAX_COUNTER_QUEUE)return;
 const entry=entrance(s);
 if(!entranceAvailable(s,entry))return;
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
export function spawnDiscWalkIn(s:GameState):void {
 const queueIndex=counterQueueCustomers(s).length;
 if(queueIndex>=MAX_COUNTER_QUEUE)return;
 const entry=entrance(s);
 if(!entranceAvailable(s,entry))return;
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
