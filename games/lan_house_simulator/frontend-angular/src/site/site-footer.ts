/** Standalone Angular footer, including reduced-motion preference handling. */
import {ChangeDetectionStrategy,Component,ElementRef,OnDestroy,OnInit,inject,signal} from '@angular/core';

@Component({
 selector:'footer[data-angular-site-footer]',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-footer.html'
})
export class SiteFooterComponent implements OnInit,OnDestroy {
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
 private readonly preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 readonly edition=this.host.getAttribute('data-edition')??'EDIÇÃO WEB';
 readonly paused=signal(false);
 private readonly onPreference=(event:MediaQueryListEvent):void=>{this.setPaused(event.matches);};
 ngOnInit():void{
  this.setPaused(this.preference.matches);
  this.preference.addEventListener('change',this.onPreference);
 }
 ngOnDestroy():void{
  this.preference.removeEventListener('change',this.onPreference);
 }
 toggleMotion():void{
  this.setPaused(!this.paused());
 }
 private setPaused(value:boolean):void{
  this.paused.set(value);
  document.body.classList.toggle('reduce-motion',value);
 }
}
