export { ANNEX_PC_COST,annexComputerPosition,AnnexComputerSlot,annexComputerSlots,availableAnnexComputers,validAnnexComputers } from "./stationLayout.js";
import { fixedLayoutObjects,layoutPlacementIssue } from "./layoutGeometry.js";
import { navigableRoute } from "./navigation.js";
import { computerSeat,counterQueue } from "./route.js";
import { emptyStationAccount } from "./stationAccounting.js";
import { ANNEX_PC_COST,annexComputerSlots,availableAnnexComputers } from "./stationLayout.js";
import type { GameState,Result } from "./types.js";
export function installAnnexComputer(s:GameState,slotId:string):Result{
 if(!availableAnnexComputers(s).some(slot=>slot.id===slotId))
   return {ok:false,message:"Posição de PC indisponível nesta ampliação."};
 if(s.cash<ANNEX_PC_COST)return {ok:false,message:"Caixa insuficiente para instalar computador."};
 const slot=annexComputerSlots(s).find(p=>p.id===slotId)!;
 if(!navigableRoute(s,counterQueue(s),computerSeat(slot.position)))
  return {ok:false,message:"Esta sala precisa de uma passagem acessível antes de instalar o PC."};
 const legacy=Math.max(3,Math.min(3+s.expansionLevel*2,s.installedPcs??3+s.expansionLevel*2));
 const index=legacy+(s.annexPcs?.length??0);
 const candidate={...s,annexPcs:[...(s.annexPcs??[]),{slotId}]};
 const object=fixedLayoutObjects(candidate).find(o=>o.id==="pc:"+index)!;
 if(layoutPlacementIssue(candidate,object))return {ok:false,message:"O espaço desse PC está ocupado por um objeto ou divisória. Reorganize o salão."};
 s.cash-=ANNEX_PC_COST;s.expenses+=ANNEX_PC_COST;
 (s.annexPcs??=[]).push({slotId});
 if(s.stationLedger){
  while(s.stationLedger.length<index)s.stationLedger.push(emptyStationAccount());
  s.stationLedger[index]=emptyStationAccount();
 }
 (s.pcTiers??=[])[index]=1;
 (s.pcGpus??=[])[index]=null;
 // Estação do anexo não herda jogos das estações que já existiam.
 if(s.gpuGameInstalls)
  s.gpuGameInstalls=Array.from({length:index+1},(_,i)=>[...(s.gpuGameInstalls?.[i]??[])]);
 if(s.pcPoweredOff)s.pcPoweredOff[index]=false;
 if(s.pcLcdModels)s.pcLcdModels[index]=null;
 if(s.pcComponents)s.pcComponents[index]=null;
 (s.pcWear??=[])[index]=0;
 return {ok:true,message:"PC instalado no anexo: -R$ "+ANNEX_PC_COST+"."};
}
