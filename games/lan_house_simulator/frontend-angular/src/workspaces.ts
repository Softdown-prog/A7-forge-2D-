/** Presentation-only workspaces. All state changes delegate to TypeScript DOM controllers. */
import {Component,Directive,ChangeDetectionStrategy,Input,OnInit,OnDestroy,OnChanges,signal} from '@angular/core';

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
  {id:'access',label:'Passagens',desc:'Caminhos livres no salão',icon:'↗'}]
} as const;
type Area=keyof typeof TASKS;

@Directive()
abstract class Workspace implements OnInit,OnDestroy{
 abstract readonly area:Area;
 readonly selected=signal('');
 private readonly sync=(e:Event)=>{
  const detail=(e as CustomEvent<{area:string;page:string}>).detail;
  if(detail?.area===this.area&&TASKS[this.area].some(task=>task.id===detail.page))
   this.selected.set(detail.page);
 };
 ngOnInit():void {
  this.selected.set(TASKS[this.area][0].id);
  document.addEventListener('lhs:management-page-selected',this.sync);
  const active=document.querySelector<HTMLElement>('#section-'+this.area+' > .management-pages [aria-pressed="true"]');
  if(active?.dataset['panelChoice'])this.selected.set(active.dataset['panelChoice']);
 }
 ngOnDestroy():void {document.removeEventListener('lhs:management-page-selected',this.sync);}
 openTask(page:string):void{
  if(!TASKS[this.area].some(task=>task.id===page))return;
  const button=document.getElementById('section-'+this.area)
   ?.querySelector<HTMLButtonElement>('.management-pages button[data-panel-choice="'+page+'"]');
  if(button&&!button.disabled)button.click();
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
}
@Component({selector:'lhs-service-workspace',standalone:true,
 templateUrl:'./templates/service-workspace.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ServiceWorkspaceComponent extends Workspace{
 readonly area='services' as const;
 readonly tasks=TASKS.services;
}
