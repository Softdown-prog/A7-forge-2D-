/** DOM-only navigation for top-level administration areas.
 * Keeps game state, unlock rules and rendering injected by the caller.
 */
export interface AdminAreaTabs {
 activate(area:string):void;
}
export function createAdminAreaTabs(
 admin:HTMLElement,
 selectArea:(area:string)=>void,
 onChange:()=>void
):AdminAreaTabs {
 // Preserve the stable nodes and event listeners mounted in the original bootstrap.
 const tabs=Array.from(admin.querySelectorAll<HTMLButtonElement>("[data-admin-tab]"));
 const sections=Array.from(admin.querySelectorAll<HTMLElement>("[data-section]"));
 let selectedArea:string|null=null;
 function activate(area:string):void{
  selectArea(area);
  for(const button of tabs){
   const active=button.dataset.adminTab===area;
   button.classList.toggle("active",active);
   button.setAttribute("aria-selected",String(active));
   button.tabIndex=active?0:-1;
  }
  for(const section of sections)section.hidden=section.dataset.section!==area;
  if(selectedArea!==area){
   selectedArea=area;
   admin.ownerDocument.dispatchEvent(new CustomEvent('lhs:admin-area-selected',{detail:{area}}));
  }
 }
 for(const button of tabs)button.addEventListener("click",()=>{
  activate(button.dataset.adminTab??"prices");
  admin.scrollTop=0;
  onChange();
 });
 return {activate};
}
