/** New standalone site header: the navigation itself remains its own Angular component. */
import {ChangeDetectionStrategy,Component} from '@angular/core';
import {SiteNavigationComponent} from './site-navigation';

@Component({
 selector:'header[data-angular-site-header]',
 standalone:true,
 imports:[SiteNavigationComponent],
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./site-header.html'
})
export class SiteHeaderComponent {}
