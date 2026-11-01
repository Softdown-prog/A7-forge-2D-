/** Presentation-only workspaces. All state changes delegate to TypeScript DOM controllers. */
import {Component,Directive,ChangeDetectionStrategy,ChangeDetectorRef,Input,OnInit,OnDestroy,OnChanges,inject,signal} from '@angular/core';

export const TASKS={
 computers:[
  {id:'operations',label:'Operação e reparos',desc:'Energia, desgaste e manutenção',icon:'▣'},
  {id:'hardware',label:'Peças e configuração',desc:'CPU, memória e kits',icon:'▥'},
  {id:'windows',label:'Windows por estação',desc:'Sistema e instalação',icon:'⊞'},
  {id:'monitors',label:'Monitores',desc:'CRT, LCD e evolução',icon:'▤'},
  {id:'ledger',label:'Receita por PC',desc:'Sessões e saldo parcial',icon:'R$'}],
 services:[
  {id:'staff',label:'Equipe e limpeza',desc:'Funcionários e atividades',icon:'♟'},
  {id:'network',label:'Internet e contrato',desc:'Conexão e manutenção',icon:'◎'},
  {id:'access',label:'Passagens',desc:'Caminhos livres no salão',icon:'↗'}],
 stock:[
  {id:'catalog',label:'Mercadorias',desc:'Produtos, preços e reposição',icon:'▦'},
  {id:'suppliers',label:'Fornecedores',desc:'Lotes e contratos comerciais',icon:'▤'},
  {id:'orders',label:'Entregas',desc:'Pedidos pendentes e recebimentos',icon:'▥'}],
 finance:[
  {id:'balance',label:'Caixa e contas',desc:'Receitas, despesas e pagamentos',icon:'R$'},
  {id:'usage',label:'Ocupação e resultado',desc:'Movimento da lan house e expansão',icon:'▤'},
  {id:'events',label:'Primeira sexta',desc:'Encontros e resultados de eventos',icon:'◉'},
  {id:'promotion',label:'Divulgação',desc:'Campanhas e anúncios',icon:'◎'},
  {id:'feedback',label:'Opiniões dos clientes',desc:'Satisfação e reclamações',icon:'☷'},
  {id:'restart',label:'Reiniciar partida',desc:'Ação permanente; exige confirmação',icon:'!'}],
 prices:[
  {id:'hourly',label:'Hora e pacotes',desc:'Tarifa dos computadores e sessões',icon:'R$'},
  {id:'insights',label:'Análise da tarifa',desc:'Procura, inflação e cenário',icon:'▥'},
  {id:'retail',label:'Produtos',desc:'Preços no balcão',icon:'▦'},
  {id:'printing',label:'Impressões',desc:'Preço das páginas e capacidade',icon:'▤'},
  {id:'discs',label:'Cópias CD / DVD',desc:'Serviço de cópia e custos',icon:'◎'}],
 licenses:[
  {id:'windows',label:'Windows por PC',desc:'Licenças por estação',icon:'⊞'},
  {id:'classic',label:'Jogos clássicos',desc:'Catálogo por geração',icon:'◉'},
  {id:'gpu',label:'Jogos com GPU',desc:'Títulos que exigem placa de vídeo',icon:'▣'}],
 consoles:[
  {id:'stations',label:'Bancadas',desc:'PS1 e PS2 instalados',icon:'▤'},
  {id:'pricing',label:'Preço por hora',desc:'Tarifas independentes dos PCs',icon:'R$'},
  {id:'discs',label:'Jogos PS1 / PS2',desc:'Mídias físicas por console',icon:'▦'}]
} as const;
type Area=keyof typeof TASKS;

@Directive()
abstract class Workspace implements OnInit,OnDestroy{
 abstract readonly area:Area;
 readonly selected=signal('');
 private readonly cdr=inject(ChangeDetectorRef);
 private readonly sync=(e:Event):void=>{
  const detail=(e as CustomEvent<{area:string;page:string}>).detail;
  if(detail?.area!==this.area||!TASKS[this.area].some(task=>task.id===detail.page))return;
  this.readNativeSelection();
 };
 /** Only the native TS controller decides which page is actually active.
  * Mark the zoneless OnPush view for a render after native DOM events. */
 private readNativeSelection():void{
  const active=document.getElementById('section-'+this.area)
   ?.querySelector<HTMLButtonElement>('.management-pages button[aria-pressed="true"]');
  const page=active?.dataset['panelChoice'];
  if(!page||!TASKS[this.area].some(task=>task.id===page))return;
  if(this.selected()!==page)this.selected.set(page);
  this.cdr.markForCheck();
 }
 ngOnInit():void {
  this.selected.set(TASKS[this.area][0].id);
  document.addEventListener('lhs:management-page-selected',this.sync);
  this.readNativeSelection();
 }
 ngOnDestroy():void {document.removeEventListener('lhs:management-page-selected',this.sync);}
 openTask(page:string):void{
  if(!TASKS[this.area].some(task=>task.id===page))return;
  const button=document.getElementById('section-'+this.area)
   ?.querySelector<HTMLButtonElement>('.management-pages button[data-panel-choice="'+page+'"]');
  if(button&&!button.disabled){
   button.click();
   // The controller handles the click synchronously; never assume a locked
   // request was accepted or update Angular to an unverified task.
   this.readNativeSelection();
  }
 }
}

type Station={id:string;label:string;disabled:boolean;selected:boolean};
@Component({selector:'lhs-station-switch',standalone:true,templateUrl:'./templates/station-switch.html',
 changeDetection:ChangeDetectionStrategy.OnPush})
export class StationSwitchComponent implements OnInit,OnChanges,OnDestroy{
 @Input() page='operations';
 readonly stations=signal<Station[]>([]);
 private host:HTMLElement|null=null;
 private observer:MutationObserver|null=null;
 get chosen():string{return this.stations().find(x=>x.selected)?.label??'Selecione uma estação';}
 ngOnInit():void{
  this.host=document.getElementById('pc-maintenance');
  if(!this.host)return;
  this.observer=new MutationObserver(()=>this.read());
  this.observer.observe(this.host,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','disabled']});
  this.read();
 }
 ngOnChanges():void{this.read();}
 ngOnDestroy():void{this.observer?.disconnect();}
 private read():void{
  if(!this.host||!['hardware','windows','monitors'].includes(this.page)){
   if(this.stations().length)this.stations.set([]);return;
  }
  const selector=this.page==='monitors'?'button[data-lcd-select]':'button[data-hardware-select]';
  const attr=this.page==='monitors'?'lcdSelect':'hardwareSelect';
  const stations=Array.from(this.host.querySelectorAll<HTMLButtonElement>(selector)).map(button=>({
   id:button.dataset[attr]??'',label:button.textContent?.trim()??'',
   selected:button.getAttribute('aria-pressed')==='true',disabled:button.disabled
  })).filter(x=>x.id);
  if(JSON.stringify(stations)!==JSON.stringify(this.stations()))this.stations.set(stations);
 }
 select(station:Station):void{
  if(station.disabled)return;
  const attr=this.page==='monitors'?'data-lcd-select':'data-hardware-select';
  const original=Array.from(this.host?.querySelectorAll<HTMLButtonElement>('button['+attr+']')??[])
   .find(button=>button.getAttribute(attr)===station.id);
  if(original&&!original.disabled)original.click();
 }
}

@Component({selector:'lhs-computer-workspace',standalone:true,imports:[StationSwitchComponent],
 templateUrl:'./templates/computer-workspace.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ComputerWorkspaceComponent extends Workspace{
 readonly area='computers' as const;
 readonly tasks=TASKS.computers;
 readonly installed=signal<number|null>(null);
 private readonly receiveComputer=(event:Event):void=>{
  const view=(event as CustomEvent<{installed:number}>).detail;
  if(!view||!Number.isInteger(view.installed)||view.installed<0)return;
  if(this.installed()!==view.installed)this.installed.set(view.installed);
 };
 override ngOnInit():void{
  super.ngOnInit();
  document.addEventListener('lhs:admin-computers-updated',this.receiveComputer);
 }
 override ngOnDestroy():void{
  document.removeEventListener('lhs:admin-computers-updated',this.receiveComputer);
  super.ngOnDestroy();
 }
}
@Component({selector:'lhs-service-workspace',standalone:true,
 templateUrl:'./templates/service-workspace.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ServiceWorkspaceComponent extends Workspace{
 readonly area='services' as const;
 readonly tasks=TASKS.services;
}

/** Navigation only. The native controller decides whether the advanced
 * catalogue is available in this year; Angular mirrors that disabled flag
 * and forwards clicks to the original management panel. */
@Component({selector:'lhs-stock-workspace',standalone:true,
 templateUrl:'./templates/stock-workspace.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class StockWorkspaceComponent extends Workspace{
 readonly area='stock' as const;
 readonly tasks=TASKS.stock;
 readonly catalogLocked=signal(true);
 readonly summary=signal<{year:number;available:number}|null>(null);
 private readonly receiveStock=(event:Event):void=>{
  const view=(event as CustomEvent<{year:number;available:number}>).detail;
  if(!view||!Number.isInteger(view.year)||!Number.isInteger(view.available))return;
  const old=this.summary();
  if(!old||old.year!==view.year||old.available!==view.available)this.summary.set(view);
  // The native controller updates unlock buttons before publishing the view.
  this.syncLock();
 };
 override ngOnInit():void{
  super.ngOnInit();
  document.addEventListener('lhs:admin-stock-updated',this.receiveStock);
  this.syncLock();
 }
 override ngOnDestroy():void{
  document.removeEventListener('lhs:admin-stock-updated',this.receiveStock);
  super.ngOnDestroy();
 }
 private syncLock():void{
  const original=document.querySelector<HTMLButtonElement>(
   '#section-stock .management-pages button[data-panel-choice="catalog"]');
  const locked=!original||original.disabled;
  if(this.catalogLocked()!==locked)this.catalogLocked.set(locked);
 }
}

/** Finance navigation is a presentation-only command proxy.
 * The native manager owns panel selection and restart confirmation.
 * Angular never modifies cash, balance, payments or the saved game. */
@Component({selector:'lhs-finance-workspace',standalone:true,
 templateUrl:'./templates/finance-workspace.html',
 changeDetection:ChangeDetectionStrategy.OnPush})
export class FinanceWorkspaceComponent extends Workspace{
 readonly area='finance' as const;
 readonly tasks=TASKS.finance;
 readonly summary=signal<{cash:string;bills:string;served:string}|null>(null);
 private readonly receiveFinance=(event:Event):void=>{
  const view=(event as CustomEvent<{cash:string;bills:string;served:string}>).detail;
  if(!view||typeof view.cash!=='string'||typeof view.bills!=='string'||
     typeof view.served!=='string')return;
  const old=this.summary();
  if(!old||old.cash!==view.cash||old.bills!==view.bills||old.served!==view.served)
   this.summary.set(view);
 };
 override ngOnInit():void{
  super.ngOnInit();
  document.addEventListener('lhs:admin-finance-updated',this.receiveFinance);
 }
 override ngOnDestroy():void{
  document.removeEventListener('lhs:admin-finance-updated',this.receiveFinance);
  super.ngOnDestroy();
 }
}

/** These three layouts delegate navigation to the same native TypeScript
 * management controller. Monetary operations, unlocks, and save ownership
 * remain outside Angular; this is purely a presentation replacement. */
@Component({selector:'lhs-prices-workspace',standalone:true,
 templateUrl:'./templates/admin-task-workspace.html',
 changeDetection:ChangeDetectionStrategy.OnPush})
export class PricesWorkspaceComponent extends Workspace{
 readonly area='prices' as const;
 readonly tasks=TASKS.prices;
 readonly eyebrow='PREÇOS E TARIFAS';
 readonly heading='Valores dos serviços';
 readonly summary='Consulte as tarifas e os preços. Regras históricas e ajustes continuam na simulação.';
}
@Component({selector:'lhs-licenses-workspace',standalone:true,
 templateUrl:'./templates/admin-task-workspace.html',
 changeDetection:ChangeDetectionStrategy.OnPush})
export class LicensesWorkspaceComponent extends Workspace{
 readonly area='licenses' as const;
 readonly tasks=TASKS.licenses;
 readonly eyebrow='SISTEMAS E LICENÇAS';
 readonly heading='Windows e biblioteca de jogos';
 readonly summary='Consulte as licenças por computador e os jogos disponíveis por geração.';
}
@Component({selector:'lhs-consoles-workspace',standalone:true,
 templateUrl:'./templates/admin-task-workspace.html',
 changeDetection:ChangeDetectionStrategy.OnPush})
export class ConsolesWorkspaceComponent extends Workspace{
 readonly area='consoles' as const;
 readonly tasks=TASKS.consoles;
 readonly eyebrow='VIDEO GAMES';
 readonly heading='Bancadas, tarifas e mídias';
 readonly summary='Administre o PS1 e o PS2 sem modificar a lógica dos consoles.';
}
