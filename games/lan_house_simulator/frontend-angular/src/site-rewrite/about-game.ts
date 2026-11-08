import {ChangeDetectionStrategy,Component} from '@angular/core';
import {GAME_GUIDES,GAME_GUIDE_GROUPS} from './game-guides/guide-content';

/** The canonical Angular owner for the institutional game overview and player manual index. */
@Component({
 selector:'lhs-about-game',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./about-game.html'
})
export class AboutGameComponent{
 readonly guideGroups=GAME_GUIDE_GROUPS;
 readonly totalGuides=GAME_GUIDES.length;
}
