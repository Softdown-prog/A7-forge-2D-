/** DOM-only updates for administration and shop windows.
 * No simulation, persistence or event listeners belong in this layer.
 */
export type AdminTextWriter=(id:string,value:string)=>void;
const HIDDEN_SECTION=".admin-section[hidden],.management-page[hidden]";

export function createVisibleAdminTextWriter(
 doc:Pick<Document,"getElementById">
):AdminTextWriter {
 return (id,value)=>{
  const node=doc.getElementById(id);
  if(node&&!node.closest(HIDDEN_SECTION)&&node.textContent!==value)
   node.textContent=value;
 };
}

export function formatAdminMoney(amount:number):string {
 return "R$ "+amount.toLocaleString("pt-BR");
}

export function renderAdminWindowVisibility(
 admin:Pick<HTMLElement,"hidden">,open:boolean
):void {
 admin.hidden=!open;
}

export function renderShopWindowVisibility(
 shop:Pick<HTMLElement,"hidden">|null,
 open:boolean,
 doc:Pick<Document,"querySelector">
):void {
 if(shop)shop.hidden=!open;
 const button=doc.querySelector<HTMLButtonElement>("#open-shop");
 if(button)button.setAttribute("aria-expanded",String(open));
}

export function renderAdminDisclosure(
 controls:Pick<HTMLElement,"setAttribute">,
 open:boolean
):void {
 controls.setAttribute("aria-expanded",String(open));
}
