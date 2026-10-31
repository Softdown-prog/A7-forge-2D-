/**
 * Angular presentation of the original shop-overview read model.
 * Pricing, placement, demolition, purchases and saves stay in TypeScript.
 */
import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,signal} from '@angular/core';

interface ShopOverviewView{
 readonly organizeText:string;
 readonly demolishText:string;
 readonly demolishDisabled:boolean;
 readonly cashText:string;
}
const INITIAL:ShopOverviewView={
 organizeText:'Organizar salão',
 demolishText:'Remover paredes e portas',
 demolishDisabled:true,
 cashText:'Carregando informações do salão...'
};

@Component({
 selector:'lhs-shop-overview',
 standalone:true,
 templateUrl:'./templates/shop-overview.html',
 changeDetection:ChangeDetectionStrategy.OnPush
})
export class ShopOverviewComponent implements OnInit,OnDestroy {
 readonly view=signal<ShopOverviewView>(INITIAL);
 private readonly receive=(event:Event):void=>{
  const detail=(event as CustomEvent<ShopOverviewView>).detail;
  if(!detail || typeof detail.cashText!=='string' ||
     typeof detail.organizeText!=='string' ||
     typeof detail.demolishText!=='string' ||
     typeof detail.demolishDisabled!=='boolean')return;
  this.view.set(detail);
 };
 ngOnInit():void{
  document.addEventListener('lhs:shop-overview-updated',this.receive);
 }
 ngOnDestroy():void{
  document.removeEventListener('lhs:shop-overview-updated',this.receive);
 }
 // Button handlers remain in the original TypeScript UI controllers.
}
