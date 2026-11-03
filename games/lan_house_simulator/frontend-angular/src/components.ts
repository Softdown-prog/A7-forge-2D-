import {
  ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {fromEvent} from 'rxjs';
import { navigateToArea } from './navigation';

@Component({
  selector: 'lhs-menu-actions', standalone: true,
  templateUrl: './templates/menu-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuActionsComponent {}

const CHAPTERS = [
  {id:'abrir',label:'01 · Comece pequeno',title:'Sua primeira lan house',
   body:'Três computadores, um balcão e muita vontade de crescer. Ajuste os preços e conquiste os primeiros clientes.',
   note:'1998 · O começo de tudo'},
  {id:'crescer',label:'02 · Faça crescer',title:'Cada decisão muda o salão',
   body:'Organize as mesas, amplie o espaço e cuide de cada estação. A evolução acontece diante dos seus olhos.',
   note:'Gestão · Layout · Expansão'},
  {id:'historia',label:'03 · Viva a época',title:'A internet tem uma história',
   body:'Do correio às novas tecnologias, descubra eventos e mudanças ao longo de uma campanha que atravessa décadas.',
   note:'Evolução · Oportunidades · Memórias'}
] as const;

@Component({
  selector:'lhs-menu-tour', standalone:true,
  templateUrl:'./templates/menu-tour.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class MenuTourComponent {
  readonly chapters = CHAPTERS;
  readonly selected = signal<string>(CHAPTERS[0].id);
  readonly chapter = computed(() => CHAPTERS.find(x=>x.id===this.selected()) ?? CHAPTERS[0]);
}

@Component({
  selector:'lhs-header-actions', standalone:true,
  templateUrl:'./templates/header-actions.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class HeaderActionsComponent {}

const SHOP_CATEGORIES = [
  {id:'equipment',label:'Computadores e serviços',icon:'▣',hint:'Equipar o salão'},
  {id:'consoles',label:'Videogames e CDs',icon:'◇',hint:'Diversão por época'},
  {id:'building',label:'Construção',icon:'▦',hint:'Expandir o espaço'},
  {id:'decoration',label:'Decoração',icon:'✦',hint:'Dar personalidade'}
] as const;
@Component({
  selector:'lhs-shop-categories',standalone:true,
  templateUrl:'./templates/shop-categories.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ShopCategoriesComponent {
  readonly categories=SHOP_CATEGORIES;
  readonly current=signal('equipment');
  private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
  constructor(){
    // Native TypeScript remains command owner; only its confirmed selection updates Angular.
    // RxJS cleans up this listener when the Angular host is destroyed.
    fromEvent<CustomEvent<string>>(this.host.nativeElement,'lhs:shop-category-selected')
      .pipe(takeUntilDestroyed())
      .subscribe(event=>{
        const id=event.detail;
        if(typeof id==='string'&&SHOP_CATEGORIES.some(category=>category.id===id))
          this.current.set(id);
      });
  }
}

type QuickAction={id:string;label:string;detail:string;area?:string;page?:string;shop?:boolean;icon:string};
const QUICK_ACTIONS:QuickAction[]=[
  {id:'cash',label:'Finanças',detail:'Caixa e contas',area:'finance',page:'balance',icon:'R$'},
  {id:'stock',label:'Estoque',detail:'Repor produtos',area:'stock',page:'suppliers',icon:'▥'},
  {id:'staff',label:'Serviços',detail:'Equipe e internet',area:'services',page:'staff',icon:'⚙'},
  {id:'computers',label:'Computadores',detail:'Operação e reparos',area:'computers',page:'operations',icon:'▣'},
  {id:'shop',label:'Compras',detail:'Equipar o salão',shop:true,icon:'+'}
];
@Component({
  selector:'lhs-quick-deck',standalone:true,
  templateUrl:'./templates/quick-deck.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class QuickDeckComponent {
  readonly actions=QUICK_ACTIONS;
  open(action:QuickAction):void {
    if(action.shop)document.getElementById('open-shop')?.click();
    else if(action.area)navigateToArea(action.area,action.page);
  }
}

type AdminShortcut={label:string;hint:string;area:string;page:string;icon:string};
const ADMIN_SHORTCUTS:AdminShortcut[]=[
  {label:'Repor estoque',hint:'Bebidas e alimentos',area:'stock',page:'suppliers',icon:'▥'},
  {label:'Mercadorias',hint:'Catálogo e vendas',area:'stock',page:'catalog',icon:'▤'},
  {label:'Preços',hint:'Hora e pacotes',area:'prices',page:'hourly',icon:'R$'},
  {label:'Equipe',hint:'Funcionários e limpeza',area:'services',page:'staff',icon:'⚙'},
  {label:'Internet',hint:'Planos e contrato',area:'services',page:'network',icon:'◎'},
  {label:'Receita por PC',hint:'Resultado das estações',area:'computers',page:'ledger',icon:'▣'}
];
@Component({
  selector:'lhs-admin-shortcuts',standalone:true,
  templateUrl:'./templates/admin-shortcuts.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class AdminShortcutsComponent {
  readonly actions=ADMIN_SHORTCUTS;
  readonly message=signal('');
  open(action:AdminShortcut):void {
    this.message.set(navigateToArea(action.area,action.page) ?? '');
  }
}
