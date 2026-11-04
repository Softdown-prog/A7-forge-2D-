import {ChangeDetectionStrategy,Component} from '@angular/core';

/** The canonical Angular owner for the institutional game overview. */
@Component({
 selector:'lhs-about-game',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./about-game.html'
})
export class AboutGameComponent{}
