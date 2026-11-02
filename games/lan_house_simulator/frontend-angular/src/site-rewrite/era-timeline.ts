import {ChangeDetectionStrategy,Component,computed,signal} from '@angular/core';
import {eras} from './site-data';

/** The timeline controls only its own presentation; it does not alter game time. */
@Component({
 selector:'lhs-era-timeline',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./era-timeline.html',
 styles:[':host{display:block}']
})
export class EraTimelineComponent{
 readonly eras=eras;
 readonly era=signal(0);
 readonly selectedEra=computed(()=>this.eras[this.era()]!);
 selectEra(index:number):void{
  if(Number.isInteger(index)&&index>=0&&index<this.eras.length)
   this.era.set(index);
 }
}
