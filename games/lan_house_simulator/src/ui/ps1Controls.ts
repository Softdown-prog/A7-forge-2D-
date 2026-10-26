import type {Ps1ActionsPort} from "../application/ps1ActionsPort.js";
export type Ps1SavePolicy="always"|"success";
export interface Ps1ControlRoots {stations:HTMLElement|null;shopCatalog:HTMLElement|null}
/** DOM-only PS1 events, preserving existing mobile selectors and click data-*. */
export function installPs1Controls(
 roots:Ps1ControlRoots,port:Ps1ActionsPort,
 onResult:(result:ReturnType<Ps1ActionsPort["buyDisc"]>,policy:Ps1SavePolicy)=>void
):void{
 roots.shopCatalog?.addEventListener("click",event=>{
  const button=event.target instanceof Element?event.target.closest("button[data-buy-ps1-disc]"):null;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  const id=button.dataset.buyPs1Disc;if(id)onResult(port.buyDisc(id),"always");
 });
 roots.stations?.addEventListener("change",event=>{
  const input=event.target;
  if(!(input instanceof HTMLSelectElement)||input.dataset.ps1Slot===undefined)return;
  const i=Number(input.dataset.ps1Slot);if(!Number.isInteger(i)||i<0||i>=port.stationCount())return;
  const result=port.insertDisc(i,input.value);
  if(!result.ok)input.value=port.discAt(i);
  onResult(result,"success");
 });
 roots.stations?.addEventListener("click",event=>{
  const button=event.target instanceof Element?event.target.closest("button[data-ps1-repair], button[data-ps1-second-seat]"):null;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  const extra=button.dataset.ps1SecondSeat!==undefined;
  const i=Number(extra?button.dataset.ps1SecondSeat:button.dataset.ps1Repair);
  if(!Number.isInteger(i))return;
  onResult(extra?port.secondSeat(i):port.repairControls(i),"success");
 });
}
