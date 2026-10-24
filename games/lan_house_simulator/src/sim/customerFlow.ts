/** customerFlow.ts: módulo do runtime LHS; lógica executada por minuto do jogo. */
import type {Customer,GameState,Point} from "./types.js";
import {hardwareSatisfactionBonus} from "./economy.js";
import {AISLE_Y,COUNTER_QUEUE,computerSeat} from "./route.js";
import {counterQueueCustomers,counterQueueSlot,CUSTOMER_COLLISION_RADIUS} from "./checkoutQueue.js";
import {navigableRoute,canTraverseLocalStep} from "./navigation.js";
import {roomBounds} from "./room.js";
import {shouldShowCustomerSpeech,SPEECH_COOLDOWN_MINUTES} from "./customerDialogue.js";
import {crowdRoute} from "./crowdNavigation.js";
import {stationReadyForSessions} from "./stationPower.js";
import {gpuGamePlayableOnPc,gpuGameHourlyRate,preferredGpuGame} from "./gpuGames.js";
import {pcCount,entrance,pcPosition} from "./simulationState.js";
import {setTravel,moveRoute} from "./customerMotion.js";

export function startStanding(c: Customer, wantsSnack: boolean): void {
  c.stage = "standing";
  c.poseMinutes = 0;
  c.wantsSnack = wantsSnack;
}
export function isReserved(s: GameState, index: number): boolean {
  return s.customers.some(c =>
   (c.pcIndex===index&&["to_pc","sitting","using","standing"].includes(c.stage))||
   (c.multiplayerAssignedPc===index&&c.stage!=="leaving"));
}
/**
 * VIPs comparam QUALIDADE e distância navegável; clientes comuns mantêm
 * a seleção antiga do primeiro PC disponível. Não aumenta o fluxo de chegada,
 * nem muda preços, reservas, desgaste ou o caixa.
 * A distância efetiva é calculada pelos waypoints, respeitando salas/portas.
 * Empates favorecem o menor índice para não mudar os PCs básicos.
 */
export function chooseAvailablePc(s:GameState,c:Customer):number|undefined {
 // Turmas mantêm reserva de um PC específico; os demais clientes não
 // conseguem ocupar a máquina enquanto cada amigo aguarda na fila.
 if(c.multiplayerAssignedPc!==undefined){
  const pc=c.multiplayerAssignedPc;
  return stationReadyForSessions(s,pc)?pc:undefined;
 }
 let fallback:number|undefined,baseQuality=0,baseDistance=0;
 let preferred:number|undefined,bestGain=0;
 const origin={x:c.x,y:c.y};
 // O título pedido governa a seleção: uma GPU capaz de rodar OUTRO
 // jogo não satisfaz a preferência. Clientes de saves antigos que ainda
 // não possuem preferência mantêm a lógica anterior de prioridade premium.
 if(c.gpuGamer){
  for(let i=0;i<pcCount(s);i++){
   if(isReserved(s,i)||!stationReadyForSessions(s,i))continue;
   const playable=c.preferredGpuGame
    ?gpuGamePlayableOnPc(s,i,c.preferredGpuGame)
    :gpuGameHourlyRate(s,i)>s.pricePerHour;
   if(playable&&navigableRoute(s,origin,computerSeat(pcPosition(i,s))))return i;
  }
 }
 for(let i=0;i<pcCount(s);i++){
  if(isReserved(s,i)||!stationReadyForSessions(s,i))continue;
  const destination=computerSeat(pcPosition(i,s));
  const route=navigableRoute(s,origin,destination);
  if(!route)continue;
  // A escolha inicial é sempre o primeiro PC acessível, para manter a
  // fila e a circulação aprovadas antes desta melhoria.
  if(fallback===undefined && !c.vip&&c.preference!=="comfort")return i;
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
export function queueVisualEvent<T>(queue:T[]|undefined,item:T):T[]{
 const out=queue??[];
 out.push(item);
 if(out.length>48)out.splice(0,out.length-48);
 return out;
}
// Controle visual isolado: não persiste no save nem modifica RNG, filas ou reputação.
const lastSpeechMinute=new WeakMap<GameState,number>();
export function customerSays(s:GameState,c:Customer,text:string,kind:"complaint"|"praise"="complaint"):void {
  const last=lastSpeechMinute.get(s);
  if(last!==undefined&&s.totalMinutes>=last&&s.totalMinutes-last<SPEECH_COOLDOWN_MINUTES)return;
  if(!shouldShowCustomerSpeech(c.id,text,s.totalMinutes,kind))return;
  lastSpeechMinute.set(s,s.totalMinutes);
  s.speechEffects=queueVisualEvent(s.speechEffects,{text,x:c.x,y:c.y,kind});
}
export function sendHome(s: GameState, c: Customer): void {
  c.stage = "leaving"; c.pcIndex = null; c.multiplayerAssignedPc=undefined; c.ps1StationIndex=undefined; c.ps1SeatIndex=undefined; c.queueIndex=undefined;
  delete c.doorwayYielding;
  delete c.desiredProduct;
  c.stalledMinutes=0;
  c.retailQueueItem=undefined;c.retailQueueIndex=undefined;
  const door=entrance(s);
  if(!setTravel(s,c,door)){
    // Quando uma divisória recém-fechada impede o planejamento estático,
    // não seguir o alvo antigo da fila/compra antes de tentar a saída.
    // O motor mantém a colisão e replaneja sem atravessar paredes ou corpos.
    c.target=door;c.route=[];
    c.nextCrowdRetryMinute=s.totalMinutes;
  }
}
/** Avança cada cliente uma casa quando a primeira posição é liberada. */
export function refreshCounterQueue(s:GameState):void {
  const line=counterQueueCustomers(s);
  for(let index=0;index<line.length;index++){
    const c=line[index]!,previousIndex=c.queueIndex;
    if(previousIndex===index)continue;
    const dest=counterQueueSlot(index,s);
    c.queueIndex=index;
    if(c.doorwayYielding)continue;
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
export function leaveCounterForPc(s:GameState,c:Customer,destination:Point):boolean {
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
export function entranceAvailable(s:GameState,entry:Point):boolean{
 return !s.customers.some(c=>Math.hypot(c.x-entry.x,c.y-entry.y)<CUSTOMER_COLLISION_RADIUS+.1);
}
/** Recover old saves as well as preventing a new arrival from sealing the exit.
 * A short, collision-tested walk moves the newcomer off the shared doorstep.
 * It remains in its FIFO position and resumes its real counter route afterward. */
export function yieldDoorway(s:GameState,c:Customer):boolean{
 const entry=entrance(s),near=Math.hypot(c.x-entry.x,c.y-entry.y)<=(c.doorwayYielding ? .8 : .45);
 const outgoing=s.customers.some(other=>other.id!==c.id&&other.stage==="leaving"&&
  Math.hypot(other.x-entry.x,other.y-entry.y)<(c.doorwayYielding?1.5:.8));
 if(c.doorwayYielding&&(!near||!outgoing)){
  const index=counterQueueCustomers(s).findIndex(other=>other.id===c.id);
  if(index>=0&&!setTravel(s,c,counterQueueSlot(index,s)))return true;
  delete c.doorwayYielding;
  if(index>=0)c.queueIndex=index;
  return false;
 }
 if(!near||!outgoing)return false;
 if(!c.doorwayYielding){
  const b=roomBounds(s);
  refuge:for(const side of [1,-1])for(const dy of [.375,.625,-.375]){
   const goal={x:Math.max(b.minX+.125,Math.min(b.maxX-.125,entry.x+side*.375)),
    y:Math.max(b.minY+.125,Math.min(b.maxY-.125,entry.y+dy))};
   if(Math.hypot(goal.x-entry.x,goal.y-entry.y)<CUSTOMER_COLLISION_RADIUS+.08)continue;
   const path=crowdRoute(s,c,goal,.25);
   if(!path?.length)continue;
   c.target=path[0]!;c.route=path.slice(1);c.doorwayYielding=true;break refuge;
  }
 }
 if(!c.doorwayYielding)return false;
 moveRoute(s,c);return true;
}
