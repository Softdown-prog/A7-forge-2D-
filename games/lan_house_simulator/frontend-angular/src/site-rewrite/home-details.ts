import {ChangeDetectionStrategy,Component} from '@angular/core';
import {faq} from './site-data';
@Component({selector:'lhs-home-details',standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./home-details.html'})
export class HomeDetailsComponent{
 readonly homeFaq=faq.slice(0,3);
}
