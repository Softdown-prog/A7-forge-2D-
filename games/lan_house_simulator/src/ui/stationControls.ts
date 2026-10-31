import type {StationActionsPort} from "../application/stationActionsPort.js";

export interface StationControlRoots {
 maintenance:HTMLElement;
 gpuCatalog:HTMLElement|null;
 gpuChoices:HTMLElement|null;
 windowsLicenses:HTMLElement|null;
}
export interface StationControlEvents {
 selectedStation():number;
 selectedGpu():number;
 selectStation(index:number):void;
 selectGpu(index:number):void;
 selectHardwareTab(tab:string):void;
 onResult(result:ReturnType<StationActionsPort["power"]>):void;
}
/** Somente seleção e delegação de cliques. Não lê nem modifica o estado do jogo.
 * O uso dos elementos e data-* originais preserva botões móveis e foco.
 */
export function installStationControls(
 roots:StationControlRoots,port:StationActionsPort,events:StationControlEvents
):void{
 const clicked=(event:Event):HTMLButtonElement|null=>{
  const button=event.target instanceof Element?event.target.closest("button"):null;
  return button instanceof HTMLButtonElement&&!button.disabled?button:null;
 };
 roots.gpuChoices?.addEventListener("click",event=>{
  const button=clicked(event);if(!button)return;
  const index=Number(button.dataset.gpuSelect);
  if(Number.isInteger(index)&&index>=0&&index<port.count())events.selectGpu(index);
 });
 roots.gpuCatalog?.addEventListener("click",event=>{
  const button=clicked(event);if(!button)return;
  const id=button.dataset.gpuBuy;
  if(id&&port.isGpuId(id))events.onResult(port.gpu(events.selectedGpu(),id));
 });
 roots.windowsLicenses?.addEventListener("click",event=>{
  const button=clicked(event);if(!button)return;
  if(button.dataset.linuxPc!==undefined){
   const index=Number(button.dataset.linuxPc),action=button.dataset.linuxAction;
   if(Number.isInteger(index)&&(action==="install"||action==="windows"))
    events.onResult(port.linux(index,action));
   return;
  }
  const index=Number(button.dataset.winPc),id=button.dataset.winEdition;
  if(Number.isInteger(index)&&id&&port.isWindowsEdition(id))
   events.onResult(port.windows(index,id));
 });
 roots.maintenance.addEventListener("click",event=>{
  const button=clicked(event);if(!button)return;
  if(button.dataset.lcdSelect!==undefined||button.dataset.hardwareSelect!==undefined){
   const index=Number(button.dataset.lcdSelect??button.dataset.hardwareSelect);
   if(Number.isInteger(index)&&index>=0&&index<port.count())events.selectStation(index);
   return;
  }
  if(button.dataset.hardwareTab!==undefined){
   const tab=button.dataset.hardwareTab;
   if(port.isHardwareTab(tab))events.selectHardwareTab(tab);
   return;
  }
  if(button.dataset.hardwareKit!==undefined){
   events.onResult(port.platform(events.selectedStation(),button.dataset.hardwareKit));return;
  }
  if(button.dataset.hardwarePart!==undefined){
   const kind=button.dataset.hardwareKind;
   if(kind&&port.isHardwareKind(kind))
    events.onResult(port.component(events.selectedStation(),kind,button.dataset.hardwarePart));
   return;
  }
  if(button.dataset.linuxPc!==undefined){
   const index=Number(button.dataset.linuxPc),action=button.dataset.linuxAction;
   if(Number.isInteger(index)&&(action==="install"||action==="windows"))
    events.onResult(port.linux(index,action));
   return;
  }
  if(button.dataset.winPc!==undefined){
   const index=Number(button.dataset.winPc),id=button.dataset.winEdition;
   if(Number.isInteger(index)&&id&&port.isWindowsEdition(id))
    events.onResult(port.windows(index,id));
   return;
  }
  if(button.dataset.lcdBuy!==undefined){
   const id=button.dataset.lcdBuy;
   if(port.isLcdId(id))events.onResult(port.lcd(events.selectedStation(),id));
   return;
  }
  if(button.dataset.pcPower!==undefined){
   events.onResult(port.power(Number(button.dataset.pcPower)));return;
  }
  if(button.dataset.pcRepair!==undefined){
   const index=Number(button.dataset.pcRepair);
   if(Number.isInteger(index))events.onResult(port.repair(index));
   return;
  }
  if(button.dataset.pcUpgrade!==undefined){
   const index=Number(button.dataset.pcUpgrade);
   if(Number.isInteger(index))events.onResult(port.upgrade(index));
  }
 });
}
