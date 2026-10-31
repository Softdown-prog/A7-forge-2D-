/**
 * Angular 22 presentation for the settings and save-transfer controls.
 * Browser events and game behavior are exclusively handled by
 * installMenuControls and installSaveFileControls (TypeScript).
 * No save parser, sound preference store or game imports belong here.
 */
import {ChangeDetectionStrategy,Component} from '@angular/core';

@Component({
  selector:'lhs-save-transfer',
  standalone:true,
  templateUrl:'./templates/save-transfer.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class SaveTransferComponent {}

@Component({
  selector:'lhs-menu-preferences',
  standalone:true,
  templateUrl:'./templates/menu-preferences.html',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class MenuPreferencesComponent {}
