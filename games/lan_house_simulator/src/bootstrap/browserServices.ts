/** Platform capabilities are assembled here, outside simulation/application modules. */
// Resolve Storage inside each operation: its property getter can throw in private
// or restricted browsing before loadLocalSave/preference recovery can handle it.
export function browserSaveStore(storage:()=>Storage){return {getItem:(key:string)=>storage().getItem(key),setItem:(key:string,value:string)=>storage().setItem(key,value),removeItem:(key:string)=>storage().removeItem(key)};}
export function browserMailSeed(seed:number):number{
 return typeof crypto!=="undefined"&&typeof crypto.getRandomValues==="function"?crypto.getRandomValues(new Uint32Array(1))[0]??(seed>>>0):(Date.now()^Math.floor(Math.random()*0x100000000))>>>0;
}
