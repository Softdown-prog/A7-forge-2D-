/** customerDecisions.ts: módulo do runtime LHS; lógica executada por minuto do jogo. */
import {acceptsProduct,merchandiseStock,merchandisePrice,productSpec,productQuality,sellMerchandise} from "./merchandise.js";
import type {Customer,GameState} from "./types.js";
import {sessionRevenue} from "./economy.js";
import {computerSeat} from "./route.js";
import {counterQueueCustomers} from "./checkoutQueue.js";
import {purchaseApproach} from "./layout.js";
import {chooseSessionMinutes,selectPurchase,consumePurchase} from "./needs.js";
import {sessionPlan,shouldConsiderConsole,emergencyRetailChoice,debitVisitorBudget,preferredSessionLength,maxServiceWait,prefersConsole} from "./customerChoices.js";
import {navigableRoute,canTraverseLocalStep} from "./navigation.js";
import {addWaste} from "./services.js";
import {serveDiscCopy} from "./discCopy.js";
import {servePrinting} from "./printService.js";
import {complaintLine} from "./customerDialogue.js";
import {recordCustomerFeedback} from "./customerFeedback.js";
import {recordPaidSession} from "./stationAccounting.js";
import {ps1Seat,ps1SeatApproach,ps1OpenSeat,ps1SessionPrice} from "./ps1.js";
import {gpuGameSpec,gpuGamePlayableOnPc,gpuGameSessionPrice,preferredGpuGame} from "./gpuGames.js";
import {recordGpuGameSession} from "./gpuDemand.js";
import {pcCount,pcPosition,addLog,CLOSING_START_MINUTE,SESSION_FINISH_MINUTE,localMinute} from "./simulationState.js";
import {setTravel} from "./customerMotion.js";
import {chooseAvailablePc,customerSays,sendHome,leaveCounterForPc,queueVisualEvent} from "./customerFlow.js";
import {waitForMultiplayerFriends} from "./multiplayerVisitors.js";

export function tryServe(s: GameState, c: Customer): void {
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
  // Decisão executada uma vez por minuto no balcão, nunca por frame.
  // Serviços de impressão e cópia continuam exclusivos e independentes.
  const remaining=SESSION_FINISH_MINUTE-localMinute(s);
  if(remaining<30||localMinute(s)>=CLOSING_START_MINUTE){sendHome(s,c);return;}
  if(c.multiplayerVisitId!==undefined&&waitForMultiplayerFriends(s,c))return;
  const wanted=preferredSessionLength(c,c.sessionMinutes??chooseSessionMinutes(c,s.economyVersion===2));
  const pcCandidate=chooseAvailablePc(s,c);
  // O console pode atender inclusive um visitante que encontrou todos os
  // PCs ocupados. Só contratar quando houver CD, cadeira e trajeto livres.
  const consoleIndex=c.multiplayerVisitId===undefined&&shouldConsiderConsole(c,pcCandidate)?(s.ps1Stations??[]).findIndex((_,i)=>{
    const number=ps1OpenSeat(s,i);
    if(number===null)return false;
    const side=ps1SeatApproach(s,i,number),seat=ps1Seat(s,i,number);
    return !!side&&!!seat&&!!navigableRoute(s,{x:c.x,y:c.y},side)&&
      (canTraverseLocalStep(s,side,seat)||!!navigableRoute(s,side,seat));
  }): -1;
  const consoleSeatNumber=consoleIndex>=0?ps1OpenSeat(s,consoleIndex):null;
  const consoleSeat=consoleIndex>=0&&consoleSeatNumber!==null?
    ps1Seat(s,consoleIndex,consoleSeatNumber):null;
  const consoleSide=consoleIndex>=0&&consoleSeatNumber!==null?
    ps1SeatApproach(s,consoleIndex,consoleSeatNumber):null;
  const consoleMinutes=consoleSeat&&consoleSide
    ?sessionPlan(c,wanted,remaining,minutes=>ps1SessionPrice(s,minutes)):null;
  const index=pcCandidate;
  const pcQuote=(minutes:number)=>index===undefined?Infinity:
    s.economyVersion===2
      ?gpuGameSessionPrice(s,index,minutes,!!c.gpuGamer,c.preferredGpuGame)
      :sessionRevenue(s.pricePerHour,minutes,false);
  const pcMinutes=index===undefined?null:sessionPlan(c,wanted,remaining,pcQuote);
  if(consoleSeat&&consoleSide&&consoleMinutes!==null&&prefersConsole(c,pcMinutes,consoleMinutes,pcQuote,
    minutes=>ps1SessionPrice(s,minutes))){
    if(leaveCounterForPc(s,c,consoleSide)){
      // Entrar na bancada pela lateral impede cruzar a TV/mesa.
      const tail=canTraverseLocalStep(s,consoleSide,consoleSeat)
       ?[consoleSeat]:navigableRoute(s,consoleSide,consoleSeat)!;
      c.route=[...(c.route??[]),...tail];
      c.sessionMinutes=consoleMinutes;
      const paid=ps1SessionPrice(s,consoleMinutes);
      c.pcIndex=null;c.ps1StationIndex=consoleIndex;c.ps1SeatIndex=consoleSeatNumber??0;
      c.queueIndex=undefined;c.stage="to_pc";s.counterBusyUntil=s.totalMinutes+3;
      debitVisitorBudget(c,paid);
      s.cash+=paid;s.revenue+=paid;s.served++;
      s.ps1Sessions=(s.ps1Sessions??0)+1;s.ps1Revenue=Math.round(((s.ps1Revenue??0)+paid)*100)/100;
      s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:paid,x:c.x,y:c.y});
      addLog(s,"Cliente pagou R$ "+paid.toFixed(2)+" por "+c.sessionMinutes+
        " minutos de PlayStation 1 na bancada "+(consoleIndex+1)+
        (consoleSeatNumber===1?" (segundo jogador).":"."));
      return;
    }
  }
  // O caixa só cobra uma opção viável. Caso o console esteja ocupado ou
  // fora do orçamento, o PC ainda pode atender normalmente.
  if(index===undefined||pcMinutes===null){
    const queueFullTimeout=index===undefined&&++c.waitingMinutes<=maxServiceWait(c);
    if(queueFullTimeout)return;
    const snack=emergencyRetailChoice(s,c);
    if(snack&&setTravel(s,c,purchaseApproach(snack,s))){
      c.desiredItem=snack;c.stage="shopping";c.queueIndex=undefined;
      customerSays(s,c,"Vou aproveitar para comprar um lanche.","praise");
      return;
    }
    s.lostCustomers++;
    const priorReputation=s.reputation;
    s.reputation=Math.max(10,s.reputation-0.4);
    recordCustomerFeedback(s,c,index===undefined?"espera":"preco","desistencia",priorReputation);
    customerSays(s,c,index===undefined?complaintLine("queue",c.id):"Hoje não cabe no meu orçamento.");
    sendHome(s,c);return;
  }
  if(!leaveCounterForPc(s,c,computerSeat(pcPosition(index,s)))){
    c.waitingMinutes++;
    return; // Não cobrar se a sala não for acessível.
  }
  c.sessionMinutes=pcMinutes;
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
  debitVisitorBudget(c,paid);
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
  if(c.multiplayerVisitId!==undefined&&s.multiplayerVisit?.id===c.multiplayerVisitId&&
    s.multiplayerVisit.memberIds.every(id=>s.customers.some(friend=>friend.id===id&&friend.pcIndex!==null))){
   addLog(s,"A turma de "+s.multiplayerVisit.size+
    " amigos pagou e foi para computadores diferentes jogar Setor Zero.");
  }
}
export function resolvePurchase(s: GameState, c: Customer): void {
  const chosen=c.desiredProduct??c.desiredItem??"soda",spec=productSpec(chosen);
  if(!spec||!acceptsProduct(s,c,chosen)){
    customerSays(s,c,merchandiseStock(s,chosen)<=0?"Produto esgotado!":"Está muito caro ou já comprei.");
    sendHome(s,c);return;
  }
  const value=merchandisePrice(s,chosen),quality=productQuality(s,chosen);
  const result=sellMerchandise(s,chosen);
  if(result.ok){
    c.wallet=Math.round(Math.max(0,(c.wallet??18)-value)*100)/100;
    consumePurchase(c,spec.category,spec.relief*quality);
    c.retailConsumption={product:chosen,untilMinute:s.totalMinutes+16};
    // A venda já tem efeito visual e sonoro próprio; não criar um balão por produto.
    c.happy=quality>=1;
    s.saleEffects=queueVisualEvent(s.saleEffects,{item:spec.category,amount:value,x:c.x,y:c.y});
    addWaste(s,spec.category==="soda"?5:3);addLog(s,result.message);
    const next=selectPurchase(c,s.inventory,s);
    if(next&&setTravel(s,c,purchaseApproach(next,s))){c.desiredItem=next;return;}
  }
  sendHome(s, c);
}
