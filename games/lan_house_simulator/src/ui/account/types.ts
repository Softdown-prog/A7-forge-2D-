export interface CloudConfig {enabled:boolean;apiUrl:string;firebaseApiKey:string}
export interface WalletEntry {id:string;type:string;delta:number;itemId:string|null;at:string|null;mode?:string}
export interface Account {
 uid:string;cookiesBalance:number;cookiesSpentTotal:number;
 entitlements:string[];transactions:WalletEntry[];historyLimit?:number
}
export interface ServerItem {name?:string;cookies:number;unlockYear?:number}
export interface StoreConfig {
 paymentsEnabled:boolean;paymentsMode?:"sandbox"|"production";
 packages?:Record<string,{cookies:number;priceCents:number}>;
 items?:Record<string,ServerItem>
}
export type Tab="summary"|"catalog"|"inventory"|"history"|"cloud";
