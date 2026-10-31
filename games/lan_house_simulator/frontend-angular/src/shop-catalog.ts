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
interface ConsoleGame {
 readonly id:string;readonly title:string;readonly genre:string;readonly copies:number;
 readonly buttonText:string;readonly disabled:boolean;readonly cover:string|null;
}
interface Slot{readonly id:string;readonly label:string;}
interface ConsoleView{
 readonly ps1:{readonly offerText:string;readonly offerDisabled:boolean;
  readonly slots:readonly Slot[];readonly selected:string|null;
  readonly artwork:string|null;readonly discs:readonly ConsoleGame[]|null};
 readonly ps2:{readonly benchText:string;readonly benchDisabled:boolean;
  readonly slots:readonly Slot[];readonly games:readonly ConsoleGame[];
  readonly artwork:string|null};
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
 readonly consoles=signal<ConsoleView|null>(null);
 readonly ps1Slot=signal('');
 readonly ps2Slot=signal('');
 private readonly receive=(event:Event):void=>{
  const detail=(event as CustomEvent<Catalog>).detail;
  if(detail&&typeof detail.category==='string'&&Array.isArray(detail.cards))
   this.catalog.set(detail);
 };
 private readonly receiveConsoles=(event:Event):void=>{
  const detail=(event as CustomEvent<ConsoleView>).detail;
  if(!detail?.ps1||!detail.ps2)return;
  this.consoles.set(detail);
  this.ps1Slot.set(detail.ps1.selected??'');
  this.ps2Slot.set(document.querySelector<HTMLSelectElement>(
   '#shop-catalog #ps2-placement')?.value??detail.ps2.slots[0]?.id??'');
 };
 ngOnInit():void{
  document.addEventListener('lhs:shop-cards-updated',this.receive);
  document.addEventListener('lhs:shop-consoles-updated',this.receiveConsoles);
 }
 ngOnDestroy():void{
  document.removeEventListener('lhs:shop-cards-updated',this.receive);
  document.removeEventListener('lhs:shop-consoles-updated',this.receiveConsoles);
 }
 // During migration the existing catalog is the authoritative command target.
 // Forward clicks to its real data-buy buttons. We do not call simulation APIs.
 private forward(attribute:'buyPs1Disc'|'buyPs2Game',id:string):void{
  const catalog=document.getElementById('shop-catalog');
  // Preserve the original delegated purchase listener and its disabled state.
  const button=Array.from(catalog?.querySelectorAll<HTMLButtonElement>(
   attribute==='buyPs1Disc'?'button[data-buy-ps1-disc]':'button[data-buy-ps2-game]')??[])
   .find(node=>node.dataset[attribute]===id&&!node.disabled);
  button?.click();
 }
 buyPs1Disc(id:string):void{this.forward('buyPs1Disc',id);}
 buyPs2Game(id:string):void{this.forward('buyPs2Game',id);}
 selectPs1(id:string):void{
  const select=document.querySelector<HTMLSelectElement>('#shop-catalog #ps1-placement');
  const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>(
   '#shop-catalog .ps1-location-selector button'));
  if(!select||buttons.length!==2)return;
  const slots=Array.from(select.options).map(o=>o.value);
  const current=slots.indexOf(select.value),target=slots.indexOf(id);
  if(current<0||target<0||!slots.length)return;
  for(let i=0;i<(target-current+slots.length)%slots.length;i++)buttons[1]?.click();
  this.ps1Slot.set(select.value);
 }
 selectPs2(id:string):void{
  const select=document.querySelector<HTMLSelectElement>('#shop-catalog #ps2-placement');
  if(!select||!Array.from(select.options).some(o=>o.value===id))return;
  select.value=id;this.ps2Slot.set(id);
 }
 onPs1Change(event:Event):void{
  if(event.target instanceof HTMLSelectElement)this.selectPs1(event.target.value);
 }
 onPs2Change(event:Event):void{
  if(event.target instanceof HTMLSelectElement)this.selectPs2(event.target.value);
 }
 buyPs1():void{this.purchase('ps1');}
 buyPs2():void{this.purchase('ps2');}
 purchase(id:string):void {
  const catalog=document.getElementById('shop-catalog');
  const target=Array.from(catalog?.querySelectorAll<HTMLButtonElement>('button[data-buy]')??[])
   .find(button=>button.dataset['buy']===id&&!button.disabled);
  target?.click();
 }
}
