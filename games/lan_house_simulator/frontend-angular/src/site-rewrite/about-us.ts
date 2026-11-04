import {ChangeDetectionStrategy,Component} from '@angular/core';

/** The canonical Angular owner for the independent-studio overview. */
@Component({
 selector:'lhs-about-us',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./about-us.html'
})
export class AboutUsComponent{}
