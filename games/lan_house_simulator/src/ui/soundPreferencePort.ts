/** Browser preference for menu sound, independent of the game save.
 * Storage access is injected so blocked localStorage never prevents startup.
 */
export interface SoundPreferenceStorage {
 readonly get:(key:string)=>string|null;
 readonly set:(key:string,value:string)=>void;
}
export interface SoundPreferenceOutput {
 setEnabled(enabled:boolean):void;
}
export function createSoundPreferencePort(storage:SoundPreferenceStorage){
 const key="lhs.sound";
 return {
  read():boolean{
   try{return storage.get(key)!=="off";}catch{return true;}
  },
  update(enabled:boolean,mixer:SoundPreferenceOutput):void{
   // Audio must switch even if private mode or quota prevents persistence.
   mixer.setEnabled(enabled);
   try{storage.set(key,enabled?"on":"off");}catch{}
  }
 };
}
