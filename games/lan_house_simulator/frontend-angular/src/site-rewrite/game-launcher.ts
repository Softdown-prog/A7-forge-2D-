import {ChangeDetectionStrategy,Component} from '@angular/core';

/** A normal same-origin navigation keeps Canvas and its controls in a full document. */
@Component({
 selector:'lhs-game-launcher',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./game-launcher.html'
})
export class GameLauncherComponent{}
