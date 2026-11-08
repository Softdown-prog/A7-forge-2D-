import {ChangeDetectionStrategy,Component,computed,input} from '@angular/core';
import type {SitePath} from '../site-data';
import {GAME_GUIDES,adjacentGuides,findGuideByPath,relatedGuidesFor} from './guide-content';

/** Canonical standalone Angular owner for every numbered player manual tutorial page. */
@Component({
 selector:'lhs-game-guide',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./guide-page.html'
})
export class GameGuideComponent{
 readonly path=input.required<SitePath>();
 readonly totalGuides=GAME_GUIDES.length;
 readonly guide=computed(()=>findGuideByPath(this.path()));
 readonly neighbors=computed(()=>{
  const current=this.guide();
  return current?adjacentGuides(current):{previous:null,next:null};
 });
 readonly related=computed(()=>{
  const current=this.guide();
  return current?relatedGuidesFor(current):[];
 });
}
