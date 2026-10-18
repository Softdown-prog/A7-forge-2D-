const categories=[['equipment','Computadores e serviços'],['consoles','Videogames e CDs'],['building','Construção'],['decoration','Decoração']] as const;
export function shopCategory(id:string):string{
 if(id==='ps1')return 'consoles';
 if(id==='expand'||id==='wall'||id==='door'||id.startsWith('extend-'))return 'building';
 if(['poster','plant','table'].includes(id))return 'decoration';
 return 'equipment';
}
export function installShopPanels(shop:HTMLElement,onChange:()=>void){
 let current='equipment';
 const nav=document.createElement('nav');nav.className='shop-categories';nav.setAttribute('aria-label','Categorias da loja');
 const buttons=categories.map(([id,label])=>{
  const button=document.createElement('button');button.type='button';button.className='slice';button.textContent=label;button.dataset.shopCategory=id;
  button.addEventListener('click',()=>{select(id);shop.scrollTop=0;onChange();});nav.append(button);return button;
 });
 shop.querySelector('#shop-catalog')?.before(nav);
 const help=Array.from(shop.querySelectorAll('.shop-organize-help'));
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Como ampliar e reorganizar';details.className='shop-guide';
 details.append(summary,...help);nav.before(details);
 function select(id:string){current=id;buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.shopCategory===id)));}
 select(current);
 return {current:()=>current,select};
}
