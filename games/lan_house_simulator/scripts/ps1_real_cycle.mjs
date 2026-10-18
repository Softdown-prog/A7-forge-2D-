// Fixture determinística: o motor real percorre corredor, cadeira, sessão e saída.
// O Scene Forge usa o resultado; nenhuma animação do caminho é inventada.
import {createGame,stepGame,pcCount} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {buyPs1Station,ps1PlacementSlots,ps1StationPoint,ps1Seat,ps1SeatApproach} from "../dist/js/sim/ps1.js";
import {navigableRoute,canTraverseLocalStep} from "../dist/js/sim/navigation.js";

const clonePoint=p=>({x:p.x,y:p.y});
const snapshot=c=>({
  stage:c.stage,x:c.x,y:c.y,target:clonePoint(c.target),
  facing:c.facing??"north",poseMinutes:c.poseMinutes??0,
  usedMinutes:c.usedMinutes,sessionMinutes:c.sessionMinutes??0,
  ps1StationIndex:c.ps1StationIndex
});

export function simulatePs1RealCycle(){
 const s=createGame(314,"historical");
 s.totalMinutes=4*360*DAY_MINUTES+18;
 s.cash=5000;
 // Com todos os PCs desligados, não surgem NPCs extras enquanto a única
 // cadeira estiver reservada. O PS1 permanece independente da internet.
 s.pcPoweredOff=Array.from({length:pcCount(s)},()=>true);
 s.offlineUntil=s.totalMinutes+500;
 s.inventory={soda:0,candy:0,snacks:0};
 const slot=ps1PlacementSlots(s)[0];
 if(!slot)throw Error("Sem slot PS1 no salão real");
 const purchase=buyPs1Station(s,slot.id);
 if(!purchase.ok)throw Error(purchase.message);
 const point=ps1StationPoint(s,0),seat=ps1Seat(s,0),side=ps1SeatApproach(s,0);
 if(!point||!seat||!side)throw Error("Bancada PS1 sem geometria");
 const path=navigableRoute(s,{x:1.55,y:2.56},side);
 const tail=canTraverseLocalStep(s,side,seat)?[seat]:navigableRoute(s,side,seat);
 if(!path?.length||!tail?.length)throw Error("A cadeira PS1 não é alcançável pela rota real");
 // Acompanhamos os últimos waypoints da rota que parte do caixa.
 // Não exibimos o caixa na filmagem e não simulamos pagamento.
 const first=Math.max(0,path.length-5);
 const from=first>0?path[first-1]:{x:1.55,y:2.56};
 const remaining=[...path.slice(first),...tail];
 const customer={
  id:5,x:from.x,y:from.y,target:clonePoint(remaining[0]),
  route:remaining.slice(1).map(clonePoint),stage:"to_pc",facing:"north",
  pcIndex:null,ps1StationIndex:0,costume:"regular",
  usedMinutes:0,sessionMinutes:12,waitingMinutes:0,
  offlineWait:0,happy:true,wallet:20,
  needs:{thirst:0,hunger:0,energy:100}
 };
 s.customers=[customer];s.nextCustomerId=6;
 const timeline=[snapshot(customer)];
 let exited=false;
 for(let minute=0;minute<240;minute++){
  stepGame(s,1);
  const current=s.customers.find(c=>c.id===5);
  if(!current){exited=true;break;}
  timeline.push(snapshot(current));
 }
 const stages=new Set(timeline.map(f=>f.stage));
 for(const stage of ["to_pc","sitting","using","standing","leaving"]){
  if(!stages.has(stage))throw Error("Motor PS1 não alcançou '"+stage+"'; atual "+
   JSON.stringify(timeline.at(-1)));
 }
 if(!exited)throw Error("Cliente PS1 não chegou à saída após 240 minutos; atual "+
  JSON.stringify(timeline.at(-1)));
 if(timeline.some(f=>f.stage==="using"&&f.ps1StationIndex!==0))
  throw Error("A sessão perdeu a reserva do videogame");
 if(s.ps1Stations[0].wear<=0)throw Error("Sessão PS1 sem desgaste real do controle");
 return {timeline,point,seat,side,minutes:timeline.length-1,
  wear:s.ps1Stations[0].wear,exited,
  stationCount:s.ps1Stations.length,
  stages:[...stages]};
}
