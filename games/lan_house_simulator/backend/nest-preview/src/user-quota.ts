/**
 * Transactional quota adapter matching canonical Express:
 * rateLimits/{verified UID}, 30 requests/fixed minute, TTL now + 120 seconds.
 * Firebase Admin is intentionally not imported or initialized here.
 */
export interface UserQuotaPort{
 reserve(uid:string):Promise<void>;
}
export const USER_QUOTA_PORT=Symbol('LHS_USER_QUOTA_PORT');

export class QuotaExceededError extends Error{
 constructor(){super('Quota exhausted');}
}

/** Default is intentionally fail-closed; only explicit test fixtures can reserve. */
export const disabledUserQuota:UserQuotaPort={
 async reserve(_uid:string):Promise<void>{
  throw new Error('Quota store has not been configured');
 }
};

export interface QuotaDocumentRef{readonly path:string;}
export interface QuotaSnapshot{
 data():{readonly window?:number;readonly count?:number}|undefined;
}
export interface QuotaTransaction{
 get(ref:QuotaDocumentRef):Promise<QuotaSnapshot>;
 set(ref:QuotaDocumentRef,data:{
  readonly window:number;
  readonly count:number;
  readonly expiresAt:Date;
 }):void;
}
export interface TransactionalQuotaStore{
 collection(name:'rateLimits'):{doc(uid:string):QuotaDocumentRef};
 runTransaction<T>(operation:(tx:QuotaTransaction)=>Promise<T>):Promise<T>;
}

/** Pure adapter: injecting a store never opens a connection or starts the server. */
export function createTransactionalUserQuota(
 store:TransactionalQuotaStore,
 now:()=>number=Date.now
):UserQuotaPort{
 return {
  async reserve(uid:string):Promise<void>{
   if(typeof uid!=='string'||uid.length===0)
    throw new Error('Verified UID required for quota');
   const stamp=now();
   if(!Number.isFinite(stamp)||stamp<0)
    throw new Error('Invalid quota clock');
   const minute=Math.floor(stamp/60_000);
   const ref=store.collection('rateLimits').doc(uid);
   await store.runTransaction(async tx=>{
    const snapshot=await tx.get(ref);
    const state=snapshot.data();
    const count=state?.window===minute?state.count:0;
    if(typeof count!=='number'||!Number.isSafeInteger(count)||count<0)
     throw new Error('Corrupt quota state');
    if(count>=30)throw new QuotaExceededError();
    tx.set(ref,{window:minute,count:count+1,expiresAt:new Date(stamp+120_000)});
   });
  }
 };
}
