export interface AccountProfile {email:string;emailVerified:boolean}
export interface AccountClient {
 signIn(email:string,password:string):Promise<AccountProfile>;
 signOut():void;
 restore():Promise<AccountProfile|null>;
 hasSession():boolean;
 api(path:string,body?:object,retried?:boolean,headers?:Record<string,string>):Promise<unknown>;
}
export function createAccountClient(config:{apiUrl:string;firebaseApiKey:string}):AccountClient;
