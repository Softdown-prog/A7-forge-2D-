import type {GameState} from "../sim/types.js";
import {annexComputerSlots,availableAnnexComputers} from "../sim/stations.js";
import {linuxMachineSpec} from "../sim/linuxMachines.js";
import {linuxUnlocked} from "../sim/linuxQuest.js";
import {MAX_EXTENSION_LEVEL} from "../sim/room.js";

/** Explica as compras sem alterar o estado da partida. */
export function shopPlacementStatus(s:GameState,id:string):string|null{
 const cap=3+s.expansionLevel*2;
 const installed=Math.max(3,Math.min(cap,s.installedPcs??cap));
 if(id==="computer"||linuxMachineSpec(id)){
  const intro=linuxMachineSpec(id)?
   (linuxUnlocked(s)?"Linux pronto para uso. Modelo físico próprio; não substitui computadores Windows. ":"Conclua a missão do Fórum Linux até agosto de 1999. "):"";
  const free=cap-installed;
  return intro+"Área principal: "+installed+"/"+cap+" PCs · "+free+
   (free===1?" vaga livre.":" vagas livres.")+
   (free===0?" Amplie a área principal para liberar mais duas.":" A posição é definida automaticamente.");
 }
 if(id==="computer-annex"){
  const total=annexComputerSlots(s).length,free=availableAnnexComputers(s).length;
  if(total===0)return "Sem vagas na ampliação. Primeiro amplie à esquerda, direita ou fundos.";
  return "Ampliações: "+(total-free)+"/"+total+" vagas ocupadas · "+free+
   (free===1?" vaga livre.":" vagas livres.")+
   (free===0?" Amplie outra direção para abrir uma vaga.":" Você escolhe a posição no mapa.");
 }
 if(id==="expand"){
  const level=s.expansionLevel;
  return "Área principal: largura "+(8+2*level)+" · ampliação "+level+"/2."+
   (level>=2?" Limite atingido.":" Próxima compra: +2 de largura e +2 vagas de PC, sem sorteio.");
 }
 const wings={"extend-west":["west","esquerda"],"extend-east":["east","direita"],"extend-north":["north","fundos"]} as const;
 if(id in wings){
  const [direction,name]=wings[id as keyof typeof wings];
  const level=s.roomExtensions?.[direction]??0;
  return "Expansões para "+name+": "+level+"/"+MAX_EXTENSION_LEVEL+
   (level>=MAX_EXTENSION_LEVEL?". Limite atingido.":". Próxima compra: +2 de espaço e 1 vaga para PC.");
 }
 return null;
}
export function shopPurchaseButtonText(id:string,full:boolean,poor:boolean,price:number,isFurniture=false):string{
 if(full){
  if(id==="computer"||linuxMachineSpec(id))return "Sem vaga na área principal";
  if(id==="computer-annex")return "Sem vaga na ampliação";
  if(id==="expand")return "Limite da área principal";
  if(id.startsWith("extend-"))return "Limite nesta direção";
  return isFurniture?"Sem espaço livre":"Limite atingido";
 }
 if(poor)return "Caixa insuficiente · R$ "+price;
 if(id==="computer")return "Instalar PC · R$ "+price;
 if(linuxMachineSpec(id))return "Comprar estação Linux · R$ "+price;
 if(id==="computer-annex")return "Escolher vaga · R$ "+price;
 if(id==="expand"||id.startsWith("extend-"))return "Ampliar · R$ "+price;
 return "Comprar · R$ "+price;
}
