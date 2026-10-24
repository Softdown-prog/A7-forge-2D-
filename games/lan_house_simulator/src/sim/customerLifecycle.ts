/** customerLifecycle.ts: módulo do runtime LHS; lógica executada por minuto do jogo. */
import type {Customer,GameState} from "./types.js";
import {SESSION_MINUTES} from "./types.js";
import {customerSatisfactionDelta,hardwareSatisfactionBonus} from "./economy.js";
import {vendingApproach,purchaseApproach} from "./layout.js";
import {selectPurchase} from "./needs.js";
import {preferenceSatisfactionAdjustment,preferenceSessionComment} from "./customerChoices.js";
import {firstRetailCustomer} from "./retailQueue.js";
import {praiseLine,complaintLine} from "./customerDialogue.js";
import {vipReputationAdjustment,serviceReputationImpact} from "./vip.js";
import {recordCustomerFeedback,sessionFeedbackReason} from "./customerFeedback.js";
import {normalizedHourlyPrice} from "./historicalEconomy.js";
import {ps1SessionWear,ps1HourPrice} from "./ps1.js";
import {online,pcWear,pcBroken,addLog,CLOSING_START_MINUTE,localMinute} from "./simulationState.js";
import {setTravel,moveRoute} from "./customerMotion.js";
import {navigableRoute} from "./navigation.js";
import {startStanding,customerSays,sendHome,yieldDoorway,queueVisualEvent} from "./customerFlow.js";
import {tryServe,resolvePurchase} from "./customerDecisions.js";
import {startMultiplayerRound,multiplayerRoundActive} from "./multiplayerVisitors.js";

export function advanceCustomer(s: GameState, c: Customer): void {
  switch (c.stage) {
    case "arriving":{
      if(c.doorwayYielding&&yieldDoorway(s,c))return;
      if(localMinute(s)>=CLOSING_START_MINUTE)return;
      const before={x:c.x,y:c.y};
      if(moveRoute(s,c))c.stage="waiting";
      else if(Math.hypot(c.x-before.x,c.y-before.y)<.005)yieldDoorway(s,c);
      return;
    }
    case "waiting": if(localMinute(s)<CLOSING_START_MINUTE)tryServe(s, c);return;
    case "to_pc":
      if (moveRoute(s,c)) { c.stage = "sitting"; c.poseMinutes = 0; }
      return;
    case "sitting":
      c.poseMinutes = (c.poseMinutes ?? 0) + 1;
      // Sem esta barreira cada um iniciava um jogo individual ao sentar.
      // startMultiplayerRound altera TODOS os integrantes no mesmo minuto.
      if(startMultiplayerRound(s,c))return;
      if (c.poseMinutes >= 3) {
        c.stage = "using"; c.poseMinutes = 0;
        if(c.pcIndex!==null)s.keyboardEffects=queueVisualEvent(s.keyboardEffects,{customerId:c.id,pcIndex:c.pcIndex});
      }
      return;
    case "using":
      if (c.ps1StationIndex===undefined&&!multiplayerRoundActive(s,c)&&!online(s)) {
        c.offlineWait++;
        if (c.offlineWait > 15) {
          c.happy = false;
          const priorReputation=s.reputation;
          s.reputation = Math.max(10, s.reputation - 1.1);
          recordCustomerFeedback(s,c,"internet","conexao",priorReputation);
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
        const profileAdjustment=preferenceSatisfactionAdjustment(c,{
          hourlyPrice:paidHourly,hardwareBonus:bonus,consoleSession
        });
        const rating=Math.max(-.9,Math.min(0.30,customerSatisfactionDelta(paidHourly,c.waitingMinutes,c.offlineWait)+
          bonus+vipReputationAdjustment(c,bonus,paidHourly)+profileAdjustment));
        const impact=c.happy?serviceReputationImpact(s.reputation,paidHourly,bonus,rating):Math.min(0,rating);
        c.happy=impact>=0;
        const priorReputation=s.reputation;
        s.reputation=Math.max(10,Math.min(100,s.reputation+impact));
        recordCustomerFeedback(s,c,sessionFeedbackReason(c,{
          price:paidHourly,hardwareBonus:bonus,consoleSession
        }),"sessao",priorReputation);
        if(impact < -0.12){
          addLog(s,"Cliente avaliou mal: preço, espera ou conexão.");
          const message=c.offlineWait>0
            ?complaintLine("slow-internet",c.id)
            :preferenceSessionComment(c,profileAdjustment,false)??
              complaintLine(c.waitingMinutes>5?"wait":"price",c.id);
          customerSays(s,c,message);
        }
        else if(impact >= 0.15){
          addLog(s,"Cliente elogiou a experiência na lan house.");
          customerSays(s,c,preferenceSessionComment(c,profileAdjustment,true)??praiseLine(c.id),"praise");
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
        c.pcIndex = null;c.ps1StationIndex=undefined;c.ps1SeatIndex=undefined;
        if (c.wantsSnack) {
          // Uma obra pode isolar a prateleira depois de a sessão terminar.
          // Não iniciar uma compra sem caminho: cliente ficaria preso na
          // posição do PC e ocuparia a fila da loja para sempre.
          const destination=c.desiredItem?purchaseApproach(c.desiredItem,s):vendingApproach("soda",s);
          if(setTravel(s,c,destination))c.stage="shopping";
          else sendHome(s,c);
        } else sendHome(s, c);
      }
      return;
    case "shopping":
      if(localMinute(s)>=CLOSING_START_MINUTE)return; // Balcão encerrou as vendas; aguarda liberação para sair.
      // Obras/realocações durante a caminhada podem inutilizar a rota antiga.
      // Não expulsar por congestionamento temporário de corpos: só desistir
      // quando a navegação estática também não alcança o produto.
      if((c.stalledMinutes??0)>=12&&
         !navigableRoute(s,{x:c.x,y:c.y},purchaseApproach(c.desiredItem??"soda",s))){
        sendHome(s,c);return;
      }
      if (moveRoute(s,c)&&firstRetailCustomer(s,c.desiredItem??"soda")===c.id&&Math.hypot(c.x-purchaseApproach(c.desiredItem??"soda",s).x,c.y-purchaseApproach(c.desiredItem??"soda",s).y)<.05) resolvePurchase(s, c);
      return;
    case "leaving": moveRoute(s,c); return;
  }
}
/** Não apagar clientes remanescentes ao virar o dia: concluem a saída fisicamente. */
