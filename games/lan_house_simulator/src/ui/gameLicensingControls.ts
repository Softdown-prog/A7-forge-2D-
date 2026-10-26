import type {GameLicensingPort} from "../application/gameLicensingPort.js";
export interface GameLicensingRoots {eraGames:HTMLElement|null;gpuGames:HTMLElement|null}
/** UI-only delegated events: cancel > install all > toggle install > purchase. */
export function installGameLicensingControls(
 roots:GameLicensingRoots,port:GameLicensingPort,
 onResult:(result:ReturnType<GameLicensingPort["licenseEra"]>)=>void
):void{
 roots.eraGames?.addEventListener("click",event=>{
  const button=event.target instanceof Element?event.target.closest("button[data-era-game-buy]"):null;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  const id=button.dataset.eraGameBuy;if(id)onResult(port.licenseEra(id));
 });
 roots.gpuGames?.addEventListener("click",event=>{
  const button=event.target instanceof Element?event.target.closest("button"):null;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  const d=button.dataset;
  if(d.gpuGameCancel){
   const i=Number(d.gpuGamePc);if(Number.isInteger(i))onResult(port.cancelDownload(i,d.gpuGameCancel));
   return;
  }
  if(d.gpuGameInstallAll){onResult(port.installAvailable(d.gpuGameInstallAll));return;}
  if(d.gpuGameInstall){
   const i=Number(d.gpuGamePc);if(Number.isInteger(i))onResult(port.toggleInstallation(i,d.gpuGameInstall));
   return;
  }
  if(d.gpuGameBuy)onResult(port.licenseGpu(d.gpuGameBuy));
 });
}
