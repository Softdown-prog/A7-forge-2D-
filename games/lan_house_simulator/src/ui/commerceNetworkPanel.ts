/** Updates existing admin texts and buttons without replacing nodes or listeners. */
import type {CommerceNetworkView} from "../application/commerceNetworkPort.js";

export function renderCommerceNetworkPanel(
 view:CommerceNetworkView,
 setText:(id:string,value:string)=>void,
 doc:Pick<Document,"querySelector">
):void{
 setText("supplier-status",view.supplierStatus);
 const supplier=doc.querySelector<HTMLButtonElement>("#supplier-up");
 if(supplier)supplier.disabled=view.supplierUpgradeDisabled;
 setText("stock-soda",view.stockSoda);
 setText("stock-candy",view.stockCandy);
 setText("stock-snacks",view.stockSnacks);
 setText("internet",view.internetStatus);
 const internetUp=doc.querySelector<HTMLButtonElement>("#internet-up");
 if(internetUp){
  internetUp.disabled=view.internetUpgradeDisabled;
  internetUp.textContent=view.internetUpgradeLabel;
 }
 const repair=doc.querySelector<HTMLButtonElement>("#internet-repair");
 if(repair){
  repair.disabled=view.internetRepairDisabled;
  repair.textContent=view.internetRepairLabel;
 }
}
