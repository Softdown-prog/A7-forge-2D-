// Fixture explícita de alta lotação; todas as obras passam pelas APIs pagas.
import {createGame} from "../dist/js/sim/engine.js";
import {expandDirection} from "../dist/js/sim/room.js";
import {buildWall,installInteriorDoor} from "../dist/js/sim/walls.js";
import {installAnnexComputer} from "../dist/js/sim/stations.js";
import {counterQueueSlot} from "../dist/js/sim/checkoutQueue.js";

export function circulationScenario(seed=1998){
 const s=createGame(seed);
 // Capital de teste declarado; não é uma campanha econômica iniciada com R$ 850.
 s.cash=10000;s.pricePerHour=8;s.reputation=95;s.licensedGames=true;
 const requireOk=result=>{if(!result.ok)throw Error(result.message);};
 for(const wing of ["north","north","east","west"])requireOk(expandDirection(s,wing));
 const partitions=[
  ...Array.from({length:8},(_,x)=>({axis:"x",x,y:-2})),
  ...Array.from({length:6},(_,y)=>({axis:"y",x:8,y})),
  ...Array.from({length:6},(_,y)=>({axis:"y",x:0,y}))
 ];
 for(const wall of partitions)requireOk(buildWall(s,wall));
 for(const door of [{axis:"x",x:5,y:-2},{axis:"y",x:8,y:4},{axis:"y",x:0,y:4}])
  requireOk(installInteriorDoor(s,door));
 for(const id of ["pc-north-1","pc-north-2","pc-east-1","pc-west-1"])
  requireOk(installAnnexComputer(s,id));
 // PCs iniciais indisponíveis para obrigar o atendimento dos quatro anexos.
 s.pcWear[0]=s.pcWear[1]=s.pcWear[2]=100;
 s.customers=Array.from({length:8},(_,index)=>{
  const at=counterQueueSlot(index);
  return {id:index+1,stage:"waiting",queueIndex:index,x:at.x,y:at.y,
   target:{...at},route:[],costume:index%3===0?"vampire":"regular",
   facing:"north",pcIndex:null,usedMinutes:0,sessionMinutes:45,waitingMinutes:0,offlineWait:0,happy:true,
   needs:{hunger:35,thirst:60,energy:75},wallet:30};
 });
 s.nextCustomerId=9;
 return s;
}
