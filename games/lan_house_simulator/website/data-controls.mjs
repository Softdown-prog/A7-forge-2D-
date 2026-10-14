// Only these application-owned keys may be deleted. No localStorage.clear().
export const DATA_KEYS = Object.freeze({save:"lhs-save-v1",sound:"lhs.sound"});
export function deleteLocalData(storage,kind){
 if(!Object.hasOwn(DATA_KEYS,kind))throw new Error("Dado não reconhecido");
 storage.removeItem(DATA_KEYS[kind]);
}
