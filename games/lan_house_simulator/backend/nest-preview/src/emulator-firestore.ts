import {randomUUID} from 'node:crypto';
import type {Firestore} from 'firebase-admin/firestore';
import {createTransactionalUserQuota} from './user-quota.js';
import type {QuotaDocumentRef,QuotaSnapshot,QuotaTransaction,TransactionalQuotaStore,UserQuotaPort} from './user-quota.js';

/** This is the ONLY SDK connection point in the preview, and is never used by bootstrap/main. */
const EMULATOR_PROJECT='demo-lhs-nest-quota';

export function assertLocalFirestoreEmulatorAllowed(env:NodeJS.ProcessEnv=process.env):void{
 if(env.NODE_ENV==='production')
  throw new Error('NestJS Firestore emulator is disabled in production');
 if(env.LHS_NEST_EMULATOR_ENABLED!=='1')
  throw new Error('NestJS Firestore emulator requires explicit test opt-in');
 if(env.GOOGLE_APPLICATION_CREDENTIALS)
  throw new Error('Service-account credentials are forbidden for this emulator test');
 const match=/^127\.0\.0\.1:([1-9]\d{0,4})$/.exec(env.FIRESTORE_EMULATOR_HOST??'');
 const port=Number(match?.[1]);
 if(!match||!Number.isSafeInteger(port)||port<1024||port>65535)
  throw new Error('Firestore emulator must use a local loopback port');
}

/** Adapt only the transaction API already exercised by the quota logic. */
function scopedFirestoreStore(db:Firestore):TransactionalQuotaStore{
 const doc=(ref:QuotaDocumentRef)=>{
  if(!/^rateLimits\/[^/]+$/.test(ref.path))
   throw new Error('Unexpected Firestore quota document path');
  return db.doc(ref.path);
 };
 return {
  collection(name){
   if(name!=='rateLimits')throw new Error('Unexpected Firestore quota collection');
   return {doc(uid){
    if(!uid||uid.includes('/'))throw new Error('Invalid verified UID document ID');
    return {path:'rateLimits/'+uid};
   }};
  },
  runTransaction<T>(operation:(tx:QuotaTransaction)=>Promise<T>):Promise<T>{
   return db.runTransaction(async sdkTx=>{
    const adapter:QuotaTransaction={
     async get(ref){
      const snapshot=await sdkTx.get(doc(ref));
      return {data:()=>snapshot.data() as ReturnType<QuotaSnapshot['data']>};
     },
     set(ref,value):void{sdkTx.set(doc(ref),value);}
    };
    return operation(adapter);
   });
  }
 };
}

export interface LocalFirestoreQuotaConnection{
 readonly quota:UserQuotaPort;
 /** Available only to the isolated integration test to inspect emulator writes. */
 readonly firestore:Firestore;
 close():Promise<void>;
}

/** Explicit opt-in and loopback checks precede any Firebase Admin SDK import. */
export async function openLocalFirestoreQuota(
 now:()=>number=Date.now
):Promise<LocalFirestoreQuotaConnection>{
 assertLocalFirestoreEmulatorAllowed();
 const [{initializeApp,deleteApp},{getFirestore}]=await Promise.all([
  import('firebase-admin/app'),import('firebase-admin/firestore')
 ]);
 const app=initializeApp({projectId:EMULATOR_PROJECT},
  'lhs-nest-quota-emulator-'+randomUUID());
 try{
  const firestore=getFirestore(app);
  return {
   quota:createTransactionalUserQuota(scopedFirestoreStore(firestore),now),
   firestore,
   close:async():Promise<void>=>{await deleteApp(app);}
  };
 }catch(error){
  await deleteApp(app);
  throw error;
 }
}
