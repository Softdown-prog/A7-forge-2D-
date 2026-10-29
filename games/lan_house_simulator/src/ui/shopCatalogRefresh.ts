/** UI-only refresh gate for the shop catalog. No simulation or DOM ownership.
 * All callbacks are consulted afresh when the panel is visited.
 */
export interface ShopCatalogRefreshOptions<Host> {
 readonly isOpen:()=>boolean;
 readonly host:()=>Host|null;
 readonly revision:()=>unknown;
 readonly changed:(revision:unknown,force:boolean)=>boolean;
 readonly render:(host:Host)=>void;
}
export function createShopCatalogRefresh<Host>(options:ShopCatalogRefreshOptions<Host>){
 return {
  refresh(force=true):void {
   if(!options.isOpen())return;
   const host=options.host();
   if(!host)return;
   if(!options.changed(options.revision(),force))return;
   options.render(host);
  }
 };
}
