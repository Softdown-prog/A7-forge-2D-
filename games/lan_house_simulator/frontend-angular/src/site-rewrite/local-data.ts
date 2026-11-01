/** Sole owner of local save and sound controls in the new Angular site. */
import {ChangeDetectionStrategy,Component,OnInit,signal} from '@angular/core';

export const LOCAL_DATA_KEYS=Object.freeze({
 save:'lhs-save-v1',
 sound:'lhs.sound'
} as const);
export type LocalDataKind=keyof typeof LOCAL_DATA_KEYS;
export type LocalDataState='present'|'absent'|'blocked';

export function removeOwnedLocalData(storage:Pick<Storage,'removeItem'>,kind:LocalDataKind):void {
 if(!Object.hasOwn(LOCAL_DATA_KEYS,kind))throw new Error('Tipo de dado inválido');
 storage.removeItem(LOCAL_DATA_KEYS[kind]);
}
export function localDataState(storage:Pick<Storage,'getItem'>,kind:LocalDataKind):LocalDataState {
 if(!Object.hasOwn(LOCAL_DATA_KEYS,kind))throw new Error('Tipo de dado inválido');
 return storage.getItem(LOCAL_DATA_KEYS[kind])===null?'absent':'present';
}

@Component({
 selector:'lhs-local-data',
 standalone:true,
 changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./local-data.html'
})
export class LocalDataComponent implements OnInit {
 readonly saveStatus=signal<LocalDataState>('blocked');
 readonly soundStatus=signal<LocalDataState>('blocked');
 readonly pending=signal<LocalDataKind|null>(null);
 readonly message=signal('');
 ngOnInit():void{this.refresh();}
 refresh():void {
  try{
   const storage=window.localStorage;
   this.saveStatus.set(localDataState(storage,'save'));
   this.soundStatus.set(localDataState(storage,'sound'));
  }catch{
   this.saveStatus.set('blocked');
   this.soundStatus.set('blocked');
  }
 }
 request(kind:LocalDataKind,dialog:HTMLDialogElement):void {
  if(kind==='save'&&this.saveStatus()!=='present')return;
  if(kind==='sound'&&this.soundStatus()!=='present')return;
  this.message.set('');
  this.pending.set(kind);
  dialog.returnValue='cancel';
  try{dialog.showModal();}
  catch{this.pending.set(null);this.message.set('Não foi possível abrir a confirmação. Nenhum dado foi apagado.');}
 }
 onClose(dialog:HTMLDialogElement):void {
  const kind=this.pending();
  this.pending.set(null);
  if(!kind||dialog.returnValue!=='confirm')return;
  try{
   removeOwnedLocalData(window.localStorage,kind);
   this.refresh();
   this.message.set(kind==='save'
    ?'Partida local apagada. Seus arquivos baixados não foram alterados.'
    :'Preferência de som redefinida. Sua partida foi preservada.');
  }catch{
   this.refresh();
   this.message.set('O navegador não permitiu alterar os dados locais. Tente nas configurações deste site.');
  }
 }
}
