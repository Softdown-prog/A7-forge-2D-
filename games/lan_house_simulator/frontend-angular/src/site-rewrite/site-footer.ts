import {ChangeDetectionStrategy,Component,input,output} from '@angular/core';
import {footerLinks,navigation} from './site-data';

/**
 * Footer UI owns its links and toggle presentation. SiteApp owns the
 * page-level reduced-motion policy and OS media-query lifecycle.
 */
@Component({
 selector:'lhs-site-footer',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-footer.html'
})
export class SiteFooterComponent{
 readonly footerLinks=footerLinks;
 readonly navigation=navigation;
 readonly reduceMotion=input.required<boolean>();
 readonly motionToggle=output<void>();
 requestMotionToggle():void{this.motionToggle.emit();}
}
