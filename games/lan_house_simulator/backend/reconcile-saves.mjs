import {pathToFileURL} from 'node:url';

const MIN_AGE_MS=24*60*60*1000;
const SAVE_PATH=/^users\/([^/]+)\/slots\/main\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.json$/;

// Only the API writes this namespace: new immutable UUID object, then slot CAS.
// An upload cannot remain in flight for 24h (API timeout: 30s). Old objects are
// never promoted again. Recheck live pointers for EACH deletion, without cache.
export async function reconcileSaves({bucket,db,apply=false,now=Date.now(),maxObjects=500,pageToken}) {
 if(!Number.isFinite(now)||!Number.isSafeInteger(maxObjects)||maxObjects<1||maxObjects>5000)throw Error('Invalid reconciliation bounds.');
 const cutoff=now-MIN_AGE_MS;
 const result={mode:apply?'apply':'dry-run',scanned:0,candidates:0,deleted:0,referenced:0,recent:0,unsafe:0,changed:0,nextPageToken:null};
 let query={prefix:'users/',autoPaginate:false,maxResults:Math.min(100,maxObjects),...(pageToken?{pageToken}:{})};
 while(query&&result.scanned<maxObjects){
  const [files,next]=await bucket.getFiles(query);
  for(const file of files){
   result.scanned++;
   const match=SAVE_PATH.exec(file.name);
   const {generation,timeCreated,updated}=file.metadata||{};
   const createdAt=Date.parse(timeCreated),updatedAt=Date.parse(updated);
   if(!match||!/^\d+$/.test(String(generation||''))||!Number.isFinite(createdAt)||!Number.isFinite(updatedAt)){result.unsafe++;continue;}
   if(createdAt>=cutoff||updatedAt>=cutoff){result.recent++;continue;}
   // Any read error aborts the run; never interpret unavailable metadata as empty.
   const snapshot=await db.collection('accounts').doc(match[1]).collection('slots').doc('main').get();
   const slot=snapshot.data();
   const validPointer=pointer=>typeof pointer?.object==='string'&&SAVE_PATH.exec(pointer.object)?.[1]===match[1];
   if(snapshot.exists&&(!validPointer(slot?.main)||(slot.backup!=null&&!validPointer(slot.backup)))){result.unsafe++;continue;}
   if(slot?.main?.object===file.name||slot?.backup?.object===file.name){result.referenced++;continue;}
   result.candidates++;
   if(apply){
    try{
     // Bind the precondition to the File instance (Storage SDK delete API).
     await bucket.file(file.name,{preconditionOpts:{ifGenerationMatch:generation}}).delete();
     result.deleted++;
    }catch(error){
     if(error.code===404||error.code===412){result.changed++;continue;}
     throw error;
    }
   }
  }
  result.nextPageToken=next?.pageToken||null;
  query=next?.pageToken?{...query,pageToken:next.pageToken,maxResults:Math.min(100,maxObjects-result.scanned)}:null;
 }
 return result;
}

async function main(){
 const args=process.argv.slice(2);
 const apply=args.includes('--apply');
 if(args.some(arg=>arg!=='--apply'))throw Error('Only --apply is supported; default is dry-run.');
 const projectId=process.env.GOOGLE_CLOUD_PROJECT;
 const database=process.env.FIRESTORE_DATABASE_ID;
 const bucketName=process.env.SAVES_BUCKET;
 if(!projectId||!database||!bucketName)throw Error('Explicit project, database and bucket are required.');
 const {initializeApp,applicationDefault}=await import('firebase-admin/app');
 const {getFirestore}=await import('firebase-admin/firestore');
 const {Storage}=await import('@google-cloud/storage');
 initializeApp({credential:applicationDefault(),projectId});
 const db=getFirestore(database);
 try{
  const result=await reconcileSaves({bucket:new Storage({projectId}).bucket(bucketName),db,apply,pageToken:process.env.RECONCILE_PAGE_TOKEN});
  console.log(JSON.stringify({event:'save_reconciliation',...result}));
 }finally{await db.terminate();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 main().catch(()=>{console.error(JSON.stringify({event:'save_reconciliation_failed'}));process.exitCode=1;});
}
