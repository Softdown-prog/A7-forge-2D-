/** Distinct purchasable Linux-ready physical computer models introduced in August 1999.
 * These are game-fiction catalog models, not claims of real branded machines.
 */
import type {GameState} from "./types.js";
export const LINUX_MACHINE_CATALOG=[
 {id:"linux-lab-99",name:"Bancada Linux 99",cost:440,year:1999,bonus:.015,
  description:"PC completo de estudo: gabinete de aço cinza, CRT e teclado para terminal e editores. Linux pré-instalado."},
 {id:"linux-dev-99",name:"Estação Programador 99",cost:610,year:1999,bonus:.05,
  description:"Kit completo de desenvolvimento: gabinete reforçado, monitor CRT grafite e mesa técnica. Linux pré-instalado."}
] as const;
export type LinuxMachineId=(typeof LINUX_MACHINE_CATALOG)[number]["id"];
export function linuxMachineSpec(id:string){return LINUX_MACHINE_CATALOG.find(m=>m.id===id);}
export function linuxMachineFor(s:Pick<GameState,"pcLinuxModels">,index:number):LinuxMachineId|null{
 const id=s.pcLinuxModels?.[index];return id&&linuxMachineSpec(id)?id as LinuxMachineId:null;
}
export function validLinuxMachines(value:unknown):boolean{
 return value===undefined||(Array.isArray(value)&&value.length<=200&&
  value.every(v=>v===null||typeof v==="string"&&!!linuxMachineSpec(v)));
}
