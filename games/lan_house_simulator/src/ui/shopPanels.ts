/** Shop category selection is kept in the existing DOM adapter.
 * React only paints the buttons; purchase and stock rules stay in game ports.
 */
export function shopCategory(id:string):string{
 if(id==='ps1')return 'consoles';
 if(id==='expand'||id==='wall'||id==='door'||id.startsWith('extend-'))return 'building';
 if(['poster','plant','table'].includes(id))return 'decoration';
 return 'equipment';
}
export function installShopPanels(shop:HTMLElement,onChange:()=>void){
 let current='equipment';
 const element=shop.querySelector<HTMLElement>('#react-shop-categories');
 if(!element)throw new Error('React shop navigation is missing');
 const nav:HTMLElement=element;
 // The Angular template already owns its guidance disclosure. Moving those
 // nodes out of an Angular view would break its DOM ownership.
 if(!shop.querySelector('#angular-shop-overview')){
  const help=Array.from(shop.querySelectorAll('.shop-organize-help'));
  const details=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='Como ampliar e reorganizar';details.className='shop-guide';
  details.append(summary,...help);nav.before(details);
 }
 function select(id:string){
  current=id;
  // Keep the rendered React tabs in sync even for programmatic selections.
  nav.dispatchEvent(new CustomEvent<string>('lhs:shop-category-selected',{detail:id}));
 }
 nav.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target.closest<HTMLButtonElement>('[data-shop-category]'):null;
  if(!target||!nav.contains(target))return;
  const id=target.dataset.shopCategory;
  if(!id||target.disabled)return;
  select(id);shop.scrollTop=0;onChange();
 });
 select(current);
 return {current:()=>current,select};
}
