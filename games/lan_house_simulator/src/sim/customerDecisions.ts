/** customerDecisions.ts: módulo do runtime LHS; lógica executada por minuto do jogo. */
import {acceptsProduct,merchandiseStock,merchandisePrice,productSpec,productQuality,sellMerchandise} from "./merchandise.js";
import type {Customer,GameState} from "./types.js";
import {sessionRevenue} from "./economy.js";
import {computerSeat} from "./route.js";
import {counterQueueCustomers} from "./checkoutQueue.js";
import {purchaseApproach} from "./layout.js";
import {chooseSessionMinutes,selectPurchase,consumePurchase} from "./needs.js";
import {sessionPlan,emergencyRetailChoice,debitVisitorBudget,preferredSessionLength,maxServiceWait,prefersConsole} from "./customerChoices.js";
import {navigableRoute,canTraverseLocalStep} from "./navigation.js";
import {addWaste} from "./services.js";
import {serveDiscCopy} from "./discCopy.js";
import {servePrinting} from "./printService.js";
import {complaintLine} from "./customerDialogue.js";
import {recordCustomerFeedback} from "./customerFeedback.js";
import {recordPaidSession} from "./stationAccounting.js";
import {chooseConsoleSession} from "./consoleService.js";
import {isLinuxPc} from "./linuxQuest.js";
import {gpuGameSpec,gpuGamePlayableOnPc,gpuGameSessionPrice} from "./gpuGames.js";
import {recordGpuGameSession} from "./gpuDemand.js";
import {pcCount,pcPosition,addLog,CLOSING_START_MINUTE,SESSION_FINISH_MINUTE,localMinute} from "./simulationState.js";
import {setTravel} from "./customerMotion.js";
import {chooseAvailablePc,customerSays,sendHome,leaveCounterForPc,queueVisualEvent} from "./customerFlow.js";
import {waitForMultiplayerFriends} from "./multiplayerVisitors.js";

export function tryServe(s: GameState, c: Customer): void {
  if(c.stage!=="waiting")return;
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
  // Todos os amigos compram o MESMO tempo de partida, negociado antes
  // da primeira cobrança. Clientes normais conservam a escolha individual.
  const group=s.multiplayerVisit?.id===c.multiplayerVisitId?s.multiplayerVisit:undefined;
  const wanted=group?.sessionMinutes??preferredSessionLength(c,
    c.sessionMinutes??chooseSessionMinutes(c,s.economyVersion===2));
  const pcCandidate=chooseAvailablePc(s,c);
  // O console pode atender inclusive um visitante que encontrou todos os
  // PCs ocupados. Só contratar quando houver CD, cadeira e trajeto livres.
  const console=chooseConsoleSession(s,c,wanted,remaining,pcCandidate);
  const index=pcCandidate;
  const pcQuote=(minutes:number)=>index===undefined?Infinity:
    s.economyVersion===2
      ?gpuGameSessionPrice(s,index,minutes,!!c.gpuGamer,c.preferredGpuGame)
      :sessionRevenue(s.pricePerHour,minutes,false);
  const pcMinutes=index===undefined?null:sessionPlan(c,wanted,remaining,pcQuote);
  if(console&&prefersConsole(c,pcMinutes,console.minutes,pcQuote,m=>console.hourly*m/60)){
    if(leaveCounterForPc(s,c,console.side)){
      const tail=canTraverseLocalStep(s,console.side,console.seat)
       ?[console.seat]:navigableRoute(s,console.side,console.seat)!;
      c.route=[...(c.route??[]),...tail];c.sessionMinutes=console.minutes;
      const {paid,generation,index,number}=console;
      c.pcIndex=null;
      if(generation==="ps1"){c.ps1StationIndex=index;c.ps1SeatIndex=number;}
      else {c.ps2StationIndex=index;c.ps2SeatIndex=number;}
      c.consolePaidHourly=console.hourly;
      c.queueIndex=undefined;c.stage="to_pc";s.counterBusyUntil=s.totalMinutes+3;
      debitVisitorBudget(c,paid);
      s.cash=Math.round((s.cash+paid)*100)/100;s.revenue=Math.round((s.revenue+paid)*100)/100;s.served++;
      if(generation==="ps1"){
       s.ps1Sessions=(s.ps1Sessions??0)+1;s.ps1Revenue=Math.round(((s.ps1Revenue??0)+paid)*100)/100;
      }else{
       s.ps2Sessions=(s.ps2Sessions??0)+1;s.ps2Revenue=Math.round(((s.ps2Revenue??0)+paid)*100)/100;
      }
      s.paymentEffects=queueVisualEvent(s.paymentEffects,{amount:paid,x:c.x,y:c.y});
      addLog(s,"Cliente pagou R$ "+paid.toFixed(2)+" por "+c.sessionMinutes+
        " minutos de "+(generation==="ps1"?"PlayStation 1":"PlayStation 2")+" na bancada "+(index+1)+
        (number===1?" (segundo jogador).":"."));
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
  if(isLinuxPc(s,index)){
   s.linuxSessions=(s.linuxSessions??0)+1;
   s.linuxRevenue=Math.round(((s.linuxRevenue??0)+paid)*100)/100;
  }
  addLog(s, "Cliente pagou R$ " + paid + " por " + c.sessionMinutes + " minutos."+
   (isLinuxPc(s,index)?" Estação Linux"+(c.linuxEnthusiast?" · estudante do fórum.":"."):"")+
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
   s.multiplayerVisit.paid=true;
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
