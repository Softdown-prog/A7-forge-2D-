import type {PricingPort,PriceDirection} from "../application/pricingPort.js";

export interface PricingControlCallbacks {
 onResult(result:ReturnType<PricingPort["changeHourly"]>):void;
 onMigration():void;
 confirmMigration():boolean;
 openRetailCatalogue():void;
}
/** Event binding only: no GameState, domain calculations, or direct save access.
 * Existing DOM IDs and delegated buttons remain stable on mobile. */
export function installPricingControls(
 port:PricingPort,callbacks:PricingControlCallbacks,doc:Document=document
):void{
 const on=(id:string,callback:()=>void)=>{
  const element=doc.getElementById(id);
  element?.addEventListener("click",()=>{
   if(element instanceof HTMLButtonElement&&element.disabled)return;
   callback();
  });
 };
 on("ps1-price-down",()=>callbacks.onResult(port.changePs1(-1)));
 on("ps1-price-up",()=>callbacks.onResult(port.changePs1(1)));
 on("price-down",()=>callbacks.onResult(port.changeHourly(-1)));
 on("price-up",()=>callbacks.onResult(port.changeHourly(1)));
 on("migrate-historical-pricing",()=>{
  if(!port.canMigrateHistorical()||!callbacks.confirmMigration())return;
  if(port.migrateHistorical())callbacks.onMigration();
 });
 doc.getElementById("print-price-controls")?.addEventListener("click",event=>{
  const target=event.target instanceof Element?event.target.closest("button[data-print-delta]"):null;
  if(!(target instanceof HTMLButtonElement)||target.disabled)return;
  const delta=Number(target.dataset.printDelta);
  if(![-1,-.5,.5,1].includes(delta))return;
  callbacks.onResult(port.changePrinting(Math.sign(delta) as PriceDirection,delta));
 });
 doc.getElementById("disc-copy-price-controls")?.addEventListener("click",event=>{
  const button=event.target instanceof Element?event.target.closest("button[data-disc-kind]"):null;
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  const kind=button.dataset.discKind,delta=Number(button.dataset.delta);
  if((kind!=="cd"&&kind!=="dvd")||![-1,1].includes(delta))return;
  callbacks.onResult(port.changeDisc(kind,delta as PriceDirection));
 });
 doc.getElementById("retail-price-controls")?.addEventListener("click",event=>{
  const target=event.target instanceof Element?event.target:null;
  if(!target)return;
  if(target.closest("#retail-full-catalog")){callbacks.openRetailCatalogue();return;}
  const button=target.closest("button");
  if(!(button instanceof HTMLButtonElement)||button.disabled)return;
  const item=button.dataset.item,delta=Number(button.dataset.delta);
  if((item!=="soda"&&item!=="candy"&&item!=="snacks")||![-1,1].includes(delta))return;
  callbacks.onResult(port.changeRetail(item,delta as PriceDirection));
 });
}
