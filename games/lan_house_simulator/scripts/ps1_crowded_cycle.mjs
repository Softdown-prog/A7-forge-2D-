// Cena com dois consoles e dois clientes: posições calculadas pelo jogo.
// NPCs andam simultaneamente no mesmo salão e saem pela porta original.
import {createGame,pcCount,stepGame,canCustomerOccupy,entrance} from "../dist/js/sim/engine.js";
import {DAY_MINUTES} from "../dist/js/sim/types.js";
import {buyPs1Station,ps1PlacementSlots,ps1StationPoint,ps1Seat,ps1SeatApproach} from "../dist/js/sim/ps1.js";
import {navigableRoute,canTraverseLocalStep} from "../dist/js/sim/navigation.js";
import {CUSTOMER_COLLISION_RADIUS} from "../dist/js/sim/checkoutQueue.js";

const copy=p=>({x:p.x,y:p.y});
function snapshot(c){return c&&{
 id:c.id,x:c.x,y:c.y,stage:c.stage,facing:c.facing??"north",
 poseMinutes:c.poseMinutes??0,ps1StationIndex:c.ps1StationIndex,
 usedMinutes:c.usedMinutes
};}
export function simulatePs1CrowdedCycle(){
 const s=createGame(291,"historical");
 s.totalMinutes=4*360*DAY_MINUTES+24;
 s.cash=5000;
 s.pcPoweredOff=Array.from({length:pcCount(s)},()=>true);
 s.offlineUntil=s.totalMinutes+300;
 s.inventory={soda:0,candy:0,snacks:0};
 // Obstáculo fixo no corredor frontal: desvio tem que respeitar parede.
 // A bancada continua acessível pelo lado, sem atravessar o segmento.
 s.interiorWalls=[{axis:"x",x:1,y:4}];
 const slots=ps1PlacementSlots(s);
 if(slots.length<2)throw Error("PS1: salão sem duas posições disponíveis");
 const first=slots[0];
 const second=slots.find(v=>v.id!==first.id&&Math.hypot(v.x-first.x,v.y-first.y)>=1.65);
 if(!second)throw Error("PS1: posições independentes indisponíveis");
 for(const slot of [first,second]){
  const purchase=buyPs1Station(s,slot.id);
  if(!purchase.ok)throw Error(purchase.message);
 }
 const stations=[0,1].map(i=>({
  point:ps1StationPoint(s,i),seat:ps1Seat(s,i),side:ps1SeatApproach(s,i)
 }));
 if(stations.some(o=>!o.point||!o.seat||!o.side))
  throw Error("PS1: bancada sem cadeira ou corredor");
 // Ambos entram já no salão, de lugares diferentes. Nenhum teletransporte.
 // Um cliente chega da esquerda, outro da direita, com circulação sobreposta.
 const customers=stations.map((o,i)=>{
  const from={x:o.side.x+(i===0?-.35:.35),y:o.side.y-(i===0?2.4:1.15)};
  const approach=navigableRoute(s,from,o.side);
  const tail=canTraverseLocalStep(s,o.side,o.seat)
   ?[o.seat]:navigableRoute(s,o.side,o.seat);
  if(!approach?.length||!tail?.length)
   throw Error("PS1: corredor ou cadeira "+i+" inacessível");
  const route=[...approach,...tail];
  const c={id:5+i,x:from.x,y:from.y,stage:"to_pc",
   target:copy(route[0]),route:route.slice(1).map(copy),
   pcIndex:null,ps1StationIndex:i,costume:"regular",
   facing:i===0?"east":"west",usedMinutes:0,sessionMinutes:16,
   waitingMinutes:0,offlineWait:0,happy:true,wallet:20,
   needs:{thirst:0,hunger:0,energy:100}};
  return c;
 });
 const originGap=Math.hypot(customers[0].x-customers[1].x,customers[0].y-customers[1].y);
 if(originGap<CUSTOMER_COLLISION_RADIUS+.1)throw Error("NPCs começaram sobrepostos");
 s.customers=customers;s.nextCustomerId=7;
 // Verifica a regra de ocupação com o próprio motor, sem mover ninguém.
 if(canCustomerOccupy(s,customers[0],copy(customers[1])))
  throw Error("Motor aceitou ocupação sobre outro cliente");
 const ids=customers.map(c=>c.id);
 const history=[{minute:0,customers:customers.map(snapshot)}];
 const stages=new Map(ids.map(id=>[id,new Set(["to_pc"])]));
 const exits=new Map(),minGap={value:Infinity};
 for(let minute=1;minute<=220;minute++){
  stepGame(s,1);
  const active=ids.map(id=>s.customers.find(c=>c.id===id));
  const record=active.map(snapshot);
  history.push({minute,customers:record});
  active.forEach((c,i)=>{
   if(c)stages.get(ids[i]).add(c.stage);
   else if(!exits.has(ids[i]))exits.set(ids[i],minute);
  });
  if(active.every(Boolean)){
   const a=active[0],b=active[1];
   const gap=Math.hypot(a.x-b.x,a.y-b.y);
   minGap.value=Math.min(minGap.value,gap);
   if(gap<CUSTOMER_COLLISION_RADIUS-.025)
    throw Error("NPCs sobrepostos no minuto "+minute+": "+gap);
   if(a.ps1StationIndex===b.ps1StationIndex&&
      ["to_pc","sitting","using","standing"].includes(a.stage)&&
      ["to_pc","sitting","using","standing"].includes(b.stage))
    throw Error("Dois clientes reservaram a mesma bancada");
  }
  if(exits.size===2)break;
 }
 for(const id of ids){
  if(!exits.has(id))throw Error("Cliente "+id+" não saiu; "+
   JSON.stringify(history.at(-1)));
  for(const stage of ["to_pc","sitting","using","standing","leaving"])
   if(!stages.get(id).has(stage))throw Error("Cliente "+id+" sem etapa "+stage);
 }
 if(s.ps1Stations.some(p=>p.wear<=0))throw Error("Há controle sem desgaste após uso");
 return {stations,history,ids,exits:Object.fromEntries(exits),
  stages:Object.fromEntries([...stages].map(([id,v])=>[id,[...v]])),
  minGap:minGap.value,minutes:history.at(-1).minute,
  wear:s.ps1Stations.map(p=>p.wear),exit:entrance(s),walls:s.interiorWalls};
}
