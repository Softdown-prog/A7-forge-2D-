/** Validate the browser shell once; controllers receive stable, typed roots. */
export function locateGameElements(document:Document){
 const required=<T extends HTMLElement>(selector:string):T=>{
  const element=document.querySelector<T>(selector);
  if(!element)throw new Error("DOM do jogo incompleto: "+selector);
  return element;
 };
 const canvas=required<HTMLCanvasElement>("#game");
 return {document,canvas,
  admin:required<HTMLElement>("#admin"),events:required<HTMLElement>("#events"),status:required<HTMLElement>("#status"),controls:required<HTMLElement>("#open-admin"),
  shop:document.querySelector<HTMLElement>("#shop"),shopCatalog:document.querySelector<HTMLElement>("#shop-catalog"),
  startScreen:required<HTMLElement>("#start-screen"),gameApp:required<HTMLElement>("#game-app"),continueButton:required<HTMLButtonElement>("#menu-continue"),settingsPanel:required<HTMLElement>("#menu-settings"),soundToggle:required<HTMLInputElement>("#option-sound"),
  importFile:required<HTMLInputElement>("#save-import-file"),saveMessage:required<HTMLElement>("#save-message"),exportButton:required<HTMLButtonElement>("#save-export"),
  autosaveState:document.querySelector<HTMLElement>("#autosave-state"),autosaveIndicator:document.querySelector<HTMLElement>(".hud-autosave"),
  menuCanvas:document.querySelector<HTMLCanvasElement>("#menu-scene"),
  noticesList:document.querySelector<HTMLElement>("#notices-list"),maintenancePanel:required<HTMLElement>("#pc-maintenance"),
  gpuList:document.getElementById("gpu-catalog"),gpuPcChoice:document.getElementById("gpu-pc-choice"),licensePanel:document.getElementById("windows-license-list"),gpuGamePanel:document.getElementById("gpu-game-catalog"),eraGamePanel:document.getElementById("era-game-catalog"),
  retailControls:document.getElementById("retail-price-controls"),discControls:document.getElementById("disc-copy-price-controls"),printControls:document.getElementById("print-price-controls"),
  placementToolbar:document.getElementById("placement-toolbar"),placementHelp:document.getElementById("placement-help"),stage:canvas.closest<HTMLElement>(".stage")
 };
}
export type GameElements=ReturnType<typeof locateGameElements>;
