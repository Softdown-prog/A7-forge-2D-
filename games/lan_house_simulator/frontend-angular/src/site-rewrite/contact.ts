import {ChangeDetectionStrategy,Component} from '@angular/core';

/** Institutional contact information; no requests, data collection or legacy JS. */
@Component({
 selector:'lhs-contact',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./contact.html'
})
export class ContactComponent{}
