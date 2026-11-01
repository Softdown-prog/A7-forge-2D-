/** Pure presentation: Angular creates the stock form once, while the
 * native MerchandisePort remains the authority for every purchase, price,
 * delivery and save. No framework code crosses into the simulation. */
import {ChangeDetectionStrategy,Component} from '@angular/core';

@Component({
 selector:'lhs-merchandise-catalog',standalone:true,
 templateUrl:'./templates/merchandise-catalog.html',
 changeDetection:ChangeDetectionStrategy.OnPush
})
export class MerchandiseCatalogComponent {}
