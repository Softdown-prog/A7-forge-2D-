import {ChangeDetectionStrategy,Component,HostListener,input,signal} from '@angular/core';
import {navigation} from './site-data';
import type {SitePath} from './site-data';

/** One Angular owner for the header, route highlight and responsive menu. */
@Component({
 selector:'lhs-site-header',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-header.html',
 styles:[':host{display:block}']
})
export class SiteHeaderComponent{
 readonly path=input.required<SitePath>();
 readonly navigation=navigation;
 readonly openMenu=signal(false);
 toggleMenu():void{this.openMenu.update(value=>!value);}
 closeMenu():void{this.openMenu.set(false);}
 @HostListener('document:keydown.escape')
 onEscape():void{this.closeMenu();}
}
