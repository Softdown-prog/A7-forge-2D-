/**
 * Angular presentation only. Read-only cards come from the existing UI
 * composer, which reads authoritative application shop quotes.
 * Purchase actions stay in installShopControls (TypeScript).
 */
import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,signal} from '@angular/core';
interface Card{
 readonly id:string;readonly label:string;readonly category:string;
 readonly description:string;readonly icon:string;readonly artworkSrc:string|null;
 readonly buttonText:string;readonly buttonTitle:string;readonly disabled:boolean;
 readonly placementHint:string|null;readonly ownedText:string|null;
}
interface Catalog{
 readonly category:string;readonly cards:readonly Card[];
 readonly consolesPending:boolean;
}
const EMPTY:Catalog={category:'equipment',cards:[],consolesPending:false};

@Component({
 selector:'lhs-shop-catalog',
 standalone:true,
 templateUrl:'./templates/shop-catalog.html',
 changeDetection:ChangeDetectionStrategy.OnPush
})
export class ShopCatalogComponent implements OnInit,OnDestroy {
 readonly catalog=signal<Catalog>(EMPTY);
 private readonly receive=(event:Event):void=>{
  const detail=(event as CustomEvent<Catalog>).detail;
  if(detail&&typeof detail.category==='string'&&Array.isArray(detail.cards))
   this.catalog.set(detail);
 };
 ngOnInit():void{document.addEventListener('lhs:shop-cards-updated',this.receive);}
 ngOnDestroy():void{document.removeEventListener('lhs:shop-cards-updated',this.receive);}
 // During migration the existing catalog is the authoritative command target.
 // Forward clicks to its real data-buy buttons. We do not call simulation APIs.
 purchase(id:string):void {
  const catalog=document.getElementById('shop-catalog');
  const target=Array.from(catalog?.querySelectorAll<HTMLButtonElement>('button[data-buy]')??[])
   .find(button=>button.dataset['buy']===id&&!button.disabled);
  target?.click();
 }
}
