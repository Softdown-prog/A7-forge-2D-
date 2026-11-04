import {ChangeDetectionStrategy,Component,ElementRef,HostListener,inject,input,signal,viewChild} from '@angular/core';
import {navigation} from './site-data';
import type {SitePath} from './site-data';

/** One Angular owner for the header, route highlight and responsive menu. */
@Component({
 selector:'lhs-site-header',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-header.html'
})
export class SiteHeaderComponent{
 readonly path=input.required<SitePath>();
 readonly navigation=navigation;
 readonly openMenu=signal(false);
 private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
 private readonly toggle=viewChild<ElementRef<HTMLButtonElement>>('menuToggle');
 toggleMenu():void{this.openMenu.update(value=>!value);}
 closeMenu():void{this.openMenu.set(false);}
 @HostListener('document:keydown.escape')
 onEscape():void{
  if(!this.openMenu())return;
  this.closeMenu();this.toggle()?.nativeElement.focus();
 }
 @HostListener('document:pointerdown',['$event'])
 onPointerDown(event:PointerEvent):void{
  if(event.target instanceof Node&&!this.host.nativeElement.contains(event.target))this.closeMenu();
 }
 @HostListener('window:resize')
 onResize():void{if(innerWidth>800)this.closeMenu();}
}
