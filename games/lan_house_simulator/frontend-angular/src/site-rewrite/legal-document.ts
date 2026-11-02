import {ChangeDetectionStrategy,Component,computed,input} from '@angular/core';
import {privacySections,termsSections} from './legal-content';
import type {SitePath} from './site-data';

/** One owner for the legal index and all document sections. */
@Component({
 selector:'lhs-legal-document',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./legal-document.html'
})
export class LegalDocumentComponent{
 readonly path=input.required<SitePath>();
 readonly sections=computed(()=>this.path()==='/termos/'?termsSections:privacySections);
}
