import {ChangeDetectionStrategy,Component,signal} from '@angular/core';

/**
 * Angular owns only the game-launching UI. The Canvas runtime stays in its
 * isolated /game/ iframe, with its own simulation, storage and input handlers.
 */
@Component({
 selector:'lhs-game-launcher',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./game-launcher.html',
 styles:[':host{display:block}']
})
export class GameLauncherComponent{
 readonly open=signal(false);
 launch():void{this.open.set(true);}
}
