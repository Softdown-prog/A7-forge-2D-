import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal
} from '@angular/core';
import { catalogSearchMatch } from './catalog-search';
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
export class ShopCategoriesComponent implements OnInit,OnDestroy {
  readonly categories=SHOP_CATEGORIES;
  readonly current=signal('equipment');
  private nav:HTMLElement|null=null;
  private readonly selected=(event:Event)=>{
    const value=(event as CustomEvent<string>).detail;
    if(SHOP_CATEGORIES.some(x=>x.id===value))this.current.set(value);
  };
  ngOnInit():void {
    this.nav=document.getElementById('react-shop-categories');
    this.nav?.addEventListener('lhs:shop-category-selected',this.selected);
  }
  ngOnDestroy():void { this.nav?.removeEventListener('lhs:shop-category-selected',this.selected); }
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

@Component({
  selector:'lhs-shop-search',standalone:true,
  templateUrl:'./templates/shop-search.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ShopSearchComponent implements OnInit,OnDestroy {
  readonly query=signal('');
  readonly counts=signal({visible:0,total:0});
  private host:HTMLElement|null=null;
  private nav:HTMLElement|null=null;
  private readonly updated=()=>this.apply();
  private readonly categorySelected=()=>{
    this.query.set('');
    this.apply();
  };
  ngOnInit():void {
    this.host=document.getElementById('shop-catalog');
    this.nav=document.getElementById('react-shop-categories');
    this.host?.addEventListener('lhs:shop-catalog-updated',this.updated);
    this.nav?.addEventListener('lhs:shop-category-selected',this.categorySelected);
    this.apply();
  }
  ngOnDestroy():void {
    this.host?.removeEventListener('lhs:shop-catalog-updated',this.updated);
    this.nav?.removeEventListener('lhs:shop-category-selected',this.categorySelected);
  }
  onSearch(event:Event):void {
    if(event.target instanceof HTMLInputElement) {
      this.query.set(event.target.value);
      this.apply();
    }
  }
  clear():void {this.query.set('');this.apply();}
  private apply():void {
    if(!this.host)return;
    const cards=Array.from(this.host.querySelectorAll<HTMLElement>(':scope > article.shop-card'));
    let visible=0;
    for(const card of cards){
      const parts=[
        card.querySelector('h3')?.textContent ?? '',
        card.querySelector('small')?.textContent ?? '',
        card.querySelector('p')?.textContent ?? ''
      ];
      const matches=catalogSearchMatch(this.query(),parts);
      card.hidden=!matches;
      if(matches)visible++;
    }
    const current=this.counts();
    if(current.total!==cards.length||current.visible!==visible){
      this.counts.set({visible,total:cards.length});
    }
  }
}
