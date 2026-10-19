/** Small task pages keep each management area navigable without a long catalog.
 * Existing nodes are moved once, preserving IDs, listeners and the save format. */
type Page={id:string;label:string;nodes:Element[]};
export function installManagementPanels(admin:HTMLElement,onChange:()=>void){
 const selections=new Map<string,string>();
 const selectors=new Map<string,(id:string)=>void>();
 const $=(id:string)=>document.getElementById(id)!;
 const following=(start:Element,end:Element|null=null):Element[]=>{
  const nodes:Element[]=[];let node:Element|null=start;
  while(node&&node!==end){nodes.push(node);node=node.nextElementSibling;}return nodes;
 };
 const headingFor=(node:Element):Element=>{let heading=node.previousElementSibling;while(heading&&heading.tagName!=='H3')heading=heading.previousElementSibling;return heading!;};
 function mount(area:string,pages:Page[],dynamic?:HTMLElement){
  const root=$('section-'+area),nav=document.createElement('nav');
  nav.className='management-pages';nav.setAttribute('aria-label','Painéis de '+(root.querySelector('h3')?.textContent??area));
  root.querySelector('h3')?.after(nav);
  const controls:HTMLButtonElement[]=[],panes:HTMLElement[]=[];
  for(const page of pages){
   const pane=document.createElement('section');pane.className='management-page';pane.id='page-'+area+'-'+page.id;
   pane.dataset.managementPage=page.id;pane.setAttribute('aria-label',page.label);pane.hidden=true;
   pane.append(...page.nodes);root.append(pane);panes.push(pane);
   const button=document.createElement('button');button.type='button';button.className='slice';
   button.dataset.panelChoice=page.id;button.setAttribute('aria-controls',pane.id);button.textContent=page.label;
   button.addEventListener('click',()=>{select(page.id);admin.scrollTop=0;onChange();});
   controls.push(button);nav.append(button);
  }
  function select(id:string){
   selections.set(area,id);
   for(const [i,pane] of panes.entries()){
    const active=pages[i]!.id===id;pane.hidden=!active;controls[i]!.setAttribute('aria-pressed',String(active));
    // One delegated maintenance host, mounted only in the selected task page.
    if(active&&dynamic&&id!=='ledger')pane.append(dynamic);
   }
   if(dynamic)dynamic.hidden=id==='ledger';
  }
  selectors.set(area,select);select(pages[0]!.id);
 }
 const prices=$('section-prices'),insight=prices.querySelector('.price-insight')!;
 const packageList=$('session-package-prices'),packages=[packageList.previousElementSibling!,packageList];
 const hourly=following(prices.querySelector('h3')!.nextElementSibling!,insight);
 packages.forEach(node=>node.remove());
 mount('prices',[
  {id:'hourly',label:'Hora e pacotes',nodes:[...hourly,...packages]},
  {id:'insights',label:'Análise da tarifa',nodes:[insight]},
  {id:'retail',label:'Produtos',nodes:[$('retail-price-controls')]},
  {id:'printing',label:'Impressões',nodes:[$('print-service-panel')]},
  {id:'discs',label:'Cópias CD / DVD',nodes:[$('disc-copy-panel')]}
 ]);
 for(const [page,text] of [['printing','Compre a impressora na loja para oferecer este serviço.'],['discs','Compre a copiadora na loja, disponível a partir de 2001.']]){
  const empty=document.createElement('p');empty.className='management-empty';empty.textContent=text;
  $('page-prices-'+page).append(empty);
 }
 mount('stock',[
  {id:'catalog',label:'Mercadorias',nodes:[$('stock'),$('merchandise-catalog')]},
  {id:'suppliers',label:'Fornecedores',nodes:[$('merchandise-suppliers'),$('supplier-status'),$('supplier-up').closest('.action-row')!]},
  {id:'orders',label:'Entregas',nodes:[$('merchandise-orders')]}
 ]);
 const computers=$('section-computers');
 mount('computers',[
  {id:'operations',label:'Operação e reparos',nodes:[]},
  {id:'hardware',label:'Peças e configuração',nodes:[]},
  {id:'windows',label:'Windows',nodes:[]},
  {id:'monitors',label:'Monitores',nodes:[]},
  {id:'ledger',label:'Receita por PC',nodes:[computers.querySelector('.station-ledger-panel')!]}
 ],$('pc-maintenance'));
 const serviceRoot=$('section-services'),access=serviceRoot.querySelector('.service-access-review')!;
 const network=following($('internet'));
 const staff=Array.from(serviceRoot.children).filter(node=>node!==serviceRoot.querySelector('h3')&&node!==access&&!network.includes(node));
 mount('services',[
  {id:'staff',label:'Equipe e limpeza',nodes:staff},
  {id:'network',label:'Internet e contrato',nodes:network},
  {id:'access',label:'Passagens',nodes:[access]}
 ]);
 const licenseRoot=$('section-licenses'),classicHeading=headingFor($('era-game-catalog')),gpuHeading=headingFor($('gpu-game-catalog'));
 const windows=following(licenseRoot.querySelector('h3')!.nextElementSibling!,classicHeading),classic=following(classicHeading,gpuHeading),advanced=following(gpuHeading);
 mount('licenses',[
  {id:'windows',label:'Windows por PC',nodes:windows},
  {id:'classic',label:'Jogos clássicos',nodes:classic},
  {id:'gpu',label:'Jogos com GPU',nodes:advanced}
 ]);
 const finance=$('section-finance');
 mount('finance',[
  {id:'balance',label:'Caixa e contas',nodes:[admin.querySelector('.balance-guide')!,$('bill-watch'),...following($('finance'),finance.querySelector('.finance-usage'))]},
  {id:'usage',label:'Ocupação e resultado',nodes:[finance.querySelector('.finance-usage')!,$('expansion')]},
  {id:'promotion',label:'Divulgação',nodes:[finance.querySelector('.promotion-panel')!]},
  {id:'feedback',label:'Opiniões dos clientes',nodes:[$('customer-feedback-panel')]},
  {id:'restart',label:'Reiniciar partida',nodes:[$('reset-game').closest('.action-row')!]}
 ]);
 const consoleRoot=$('section-consoles'),discs=consoleRoot.querySelector('.ps1-disc-admin')!;
 const consolePricing=following($('ps1-overview').nextElementSibling!,discs);
 mount('consoles',[
  {id:'stations',label:'Bancadas',nodes:[$('ps1-stations')]},
  {id:'pricing',label:'Preço por hora',nodes:consolePricing},
  {id:'discs',label:'Acervo de CDs',nodes:[discs]}
 ]);
 const summary=document.createElement('details');summary.className='management-summary';summary.open=!matchMedia('(max-width:700px)').matches;
 const summaryTitle=document.createElement('summary');summaryTitle.id='management-summary-value';summaryTitle.textContent='Visão geral do negócio';
 const metrics=admin.querySelector('.admin-summary')!;metrics.before(summary);summary.append(summaryTitle,metrics);
 const areaLabel=document.createElement('label');areaLabel.className='management-area';areaLabel.textContent='Área da administração';
 const areaSelect=document.createElement('select');areaSelect.id='admin-area';
 for(const button of Array.from(admin.querySelectorAll<HTMLButtonElement>('[data-admin-tab]'))){
  const option=document.createElement('option');option.value=button.dataset.adminTab!;option.textContent=button.textContent;areaSelect.append(option);
 }
 areaSelect.addEventListener('change',()=>{admin.querySelector<HTMLButtonElement>('[data-admin-tab="'+areaSelect.value+'"]')?.click();admin.scrollTop=0;});
 areaLabel.append(areaSelect);admin.querySelector('.admin-title')?.after(areaLabel);
 return {
  select:(area:string,page:string)=>selectors.get(area)?.(page),
  current:(area:string)=>selections.get(area),
  active:(area:string,page:string)=>selections.get(area)===page,
  syncArea:(area:string)=>{if(areaSelect.value!==area)areaSelect.value=area;}
 };
}
