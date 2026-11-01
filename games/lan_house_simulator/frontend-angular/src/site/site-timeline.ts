/** Fresh Angular institutional timeline. No React, game or network dependency. */
import {ChangeDetectionStrategy,Component,ElementRef,computed,inject,signal} from '@angular/core';

type Era=Readonly<{
 year:string;label:string;title:string;body:string;model:string;spec:string
}>;
const validModels=new Set(['crt','lcd','led','arena']);
function isEra(value:unknown):value is Era{
 if(value===null||typeof value!=='object')return false;
 const era=value as Record<string,unknown>;
 return ['year','label','title','body','model','spec']
  .every(key=>typeof era[key]==='string') &&
  typeof era['model']==='string'&&validModels.has(era['model']);
}
@Component({
 selector:'div[data-angular-site-timeline]',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 template:`
  <div class="era-tabs" aria-label="Explore as épocas">
   @for(era of eras;track era.year;let index=$index){
    <button type="button" class="era-tab" [attr.data-era]="index"
     [attr.aria-pressed]="selected()===index" aria-controls="era-panel"
     (click)="choose(index)">
     <span>{{era.year}}</span><small>{{era.label}}</small>
     <svg class="icon" width="24" height="24" aria-hidden="true" focusable="false">
      <use href="/assets/icons.svg#arrow"></use>
     </svg>
    </button>
   }
  </div>
  <div class="era-panel" id="era-panel" aria-live="polite">
   <div class="era-art">
    <img id="era-image" [src]="'/assets/pc-'+active().model+'.svg'"
     [alt]="'Ilustração de computador da época '+active().year"
     width="480" height="300" loading="lazy"/>
    <span class="era-stamp" id="era-year">{{active().year}}</span>
   </div>
   <p class="eyebrow" id="era-spec">{{active().spec}}</p>
   <h3 id="era-title">{{active().title}}</h3>
   <p id="era-copy">{{active().body}}</p>
  </div>
 `
})
export class SiteTimelineComponent{
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
 readonly eras:readonly Era[]=this.parseEras();
 readonly selected=signal(0);
 readonly active=computed(()=>this.eras[this.selected()]!);
 choose(index:number):void{
  if(Number.isInteger(index)&&index>=0&&index<this.eras.length)this.selected.set(index);
 }
 private parseEras():readonly Era[]{
  const json=this.host.getAttribute('data-era-list');
  if(!json)throw new Error('Dados da linha do tempo Angular ausentes');
  const value:unknown=JSON.parse(json);
  if(!Array.isArray(value)||value.length!==4||!value.every(isEra))
   throw new Error('Dados das eras da linha do tempo inválidos');
  return value;
 }
}
