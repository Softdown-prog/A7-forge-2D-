/** Angular owns the account dialog DOM only; authentication, Cookies and saves
 * remain under the existing TypeScript AccountGamePort / cloud controller. */
import {ChangeDetectionStrategy,Component} from '@angular/core';

@Component({
  selector:'lhs-account-shell',standalone:true,
  templateUrl:'./templates/account-shell.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class AccountShellComponent {}
