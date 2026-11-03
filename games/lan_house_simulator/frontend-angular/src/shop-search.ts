/** Angular owner of product search and result counts.
 * All purchases, selected category and game economy stay in native TypeScript.
 * This component reads snapshots through the existing event bridge.
 */
import {ChangeDetectionStrategy,Component,DestroyRef,OnInit,inject,signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {fromEvent} from 'rxjs';
import {normalizeCatalogSearch,catalogSearchText} from './catalog-search';

@Component({
  selector:'lhs-shop-search',standalone:true,
  templateUrl:'./templates/shop-search.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ShopSearchComponent implements OnInit {
  readonly query=signal('');
  readonly counts=signal({visible:0,total:0});
  private host:HTMLElement|null=null;
  private nav:HTMLElement|null=null;
  private readonly destroyRef=inject(DestroyRef);
  // The native catalog rebuilds its cards on every refresh. Index once per
  // catalog-update event; input events must not re-read every text node.
  private nativeIndex:readonly {card:HTMLElement;text:string}[]=[];
  private projectedIndex:readonly string[]|null=null;
  private consolesPending=false;
  private lastPublishedQuery:string|null=null;

  private readonly receivedCards=(event:Event):void=>{
    const detail=(event as CustomEvent<{
      cards:readonly {label:string;category:string;description:string}[];
      consolesPending:boolean;
    }>).detail;
    if(!detail||!Array.isArray(detail.cards))return;
    this.projectedIndex=detail.cards.map(card=>
      catalogSearchText([card.label,card.category,card.description]));
    this.consolesPending=detail.consolesPending===true;
    this.apply();
  };
  private readonly updated=():void=>{
    this.indexNativeCards();
    this.apply();
  };
  private readonly categorySelected=():void=>{
    if(this.query()!=='')this.query.set('');
    this.apply();
  };
  ngOnInit():void {
    this.host=document.getElementById('shop-catalog');
    this.nav=document.getElementById('react-shop-categories');
    // Subscribe only while this Angular view exists; native ports remain authoritative.
    if(this.host)fromEvent<Event>(this.host,'lhs:shop-catalog-updated')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(this.updated);
    if(this.nav)fromEvent<Event>(this.nav,'lhs:shop-category-selected')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(this.categorySelected);
    fromEvent<Event>(document,'lhs:shop-cards-updated')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(this.receivedCards);
    this.indexNativeCards();
    this.apply();
  }
  onSearch(event:Event):void {
    if(!(event.target instanceof HTMLInputElement))return;
    const value=event.target.value;
    if(this.query()===value)return;
    this.query.set(value);
    this.apply();
  }
  clear():void {
    if(this.query()==='')return;
    this.query.set('');
    this.apply();
  }
  private indexNativeCards():void{
    if(!this.host)return;
    this.nativeIndex=Array.from(
      this.host.querySelectorAll<HTMLElement>(':scope > article.shop-card')
    ).map(card=>({
      card,
      text:catalogSearchText([
        card.querySelector('h3')?.textContent??'',
        card.querySelector('small')?.textContent??'',
        card.querySelector('p')?.textContent??''
      ])
    }));
  }
  private apply():void {
    if(!this.host)return;
    const currentQuery=this.query();
    const normalized=normalizeCatalogSearch(currentQuery);
    let visible=0;
    for(const {card,text} of this.nativeIndex){
      const matches=!normalized||text.includes(normalized);
      // Avoid redundant DOM writes that invalidate styling/layout.
      if(card.hidden===matches)card.hidden=!matches;
      if(matches)visible++;
    }
    let total=this.nativeIndex.length;
    // Angular projects only regular cards; console offers are still in the
    // native DOM, so count those instead of incorrectly announcing 0 results.
    if(document.getElementById('angular-shop-catalog')&&
       this.projectedIndex&&!this.consolesPending){
      total=this.projectedIndex.length;
      visible=this.projectedIndex.filter(text=>
        !normalized||text.includes(normalized)).length;
    }
    const previous=this.counts();
    if(previous.total!==total||previous.visible!==visible)
      this.counts.set({visible,total});
    // A new catalog snapshot doesn't change the search query. Let the
    // Angular catalog react to its own snapshot, without a second event.
    if(this.lastPublishedQuery!==currentQuery){
      this.lastPublishedQuery=currentQuery;
      document.dispatchEvent(new CustomEvent('lhs:angular-catalog-filter-updated',{
        detail:{query:currentQuery}
      }));
    }
  }
}
