/** Prepare only the API's original build inputs for Cloud Run --source.
 * Does not deploy, read credentials, overwrite a directory or include frontend assets. */
import {cpSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(import.meta.dirname,'..');
export function prepareBackendSource(destination){
 destination=resolve(destination);
 mkdirSync(destination,{recursive:false});
 for(const name of ['package.json','package-lock.json','tsconfig.json','donate-packages.mjs','cookie-items.mjs'])
  cpSync(resolve(root,name),resolve(destination,name));
 cpSync(resolve(root,'src'),resolve(destination,'src'),{recursive:true});
 mkdirSync(resolve(destination,'backend'));
 for(const name of readdirSync(resolve(root,'backend')).filter(n=>n.endsWith('.mjs')||/^package(?:-lock)?\.json$/.test(n)))
  cpSync(resolve(root,'backend',name),resolve(destination,'backend',name));
 cpSync(resolve(root,'backend/Dockerfile'),resolve(destination,'Dockerfile'));
 return destination;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2])throw Error('Pass a new destination directory');
 console.log(prepareBackendSource(process.argv[2]));
}
