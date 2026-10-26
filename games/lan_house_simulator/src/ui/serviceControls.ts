import type {ServiceActionsPort} from "../application/serviceActionsPort.js";

/** Mantém a política legada: somente contratação/demissão bem-sucedida
 * persiste; os outros controles persistem após qualquer tentativa.
 */
export type ServiceSavePolicy="always"|"success";
export interface ServiceControlCallbacks {
 onResult(result:ReturnType<ServiceActionsPort["restock"]>,policy:ServiceSavePolicy):void;
}
/** Somente eventos do DOM. Não lê GameState nem aciona regras do motor. */
export function installServiceControls(
 port:ServiceActionsPort,callbacks:ServiceControlCallbacks,doc:Document=document
):void{
 const bind=(id:string,action:()=>ReturnType<ServiceActionsPort["restock"]>,policy:ServiceSavePolicy="always")=>{
  const element=doc.getElementById(id);
  element?.addEventListener("click",()=>{
   if(element instanceof HTMLButtonElement&&element.disabled)return;
   callbacks.onResult(action(),policy);
  });
 };
 bind("stock-soda",()=>port.restock("soda"));
 bind("stock-candy",()=>port.restock("candy"));
 bind("stock-snacks",()=>port.restock("snacks"));
 bind("supplier-up",()=>port.contractSupplier());
 bind("launch-promotion",()=>port.promote());
 bind("internet-up",()=>port.upgradeInternet());
 bind("internet-repair",()=>port.repairInternet());
 bind("license",()=>port.licenseGames());
 bind("clean-bins",()=>port.toggleEmployee("cleaner"),"success");
 bind("hire-technician",()=>port.toggleEmployee("technician"),"success");
 bind("clean-bins-now",()=>port.cleanNow());
}
