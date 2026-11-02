/** Read-only canonical import boundary for the independent Angular site. */
import {createRequire} from 'node:module';
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {dirname,extname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const site=resolve(root,'frontend-angular/src/site-rewrite');
const ts=createRequire(resolve(root,'frontend-angular/package.json'))('typescript');
const inside=value=>value===site||value.startsWith(site+sep);
const allowed=value=>value.startsWith('@angular/')||value==='rxjs'||value.startsWith('rxjs/');

export function auditSource(source,name){
 const issues=new Set();
 const current=resolve(site,name);
 if(!inside(current)||!name.endsWith('.ts'))return ['invalid-source-path'];
 const ast=ts.createSourceFile(current,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 if(ast.parseDiagnostics?.length)issues.add('invalid-typescript-syntax');
 const check=specifier=>{
  if(specifier.startsWith('.')){
   const target=resolve(dirname(current),specifier);
   if(!inside(target)){issues.add('legacy-or-outside-angular-import');return;}
   const ext=extname(target);
   if(ext&&!['.ts','.json'].includes(ext)){issues.add('unsupported-local-import');return;}
   const choices=ext?[target]:[target+'.ts',target+'.json',resolve(target,'index.ts')];
   if(!choices.some(x=>inside(x)&&existsSync(x)))issues.add('unresolved-angular-local-import');
  }else if(!allowed(specifier))issues.add('non-angular-dependency-import');
 };
 const walk=node=>{
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier){
   if(ts.isStringLiteralLike(node.moduleSpecifier))check(node.moduleSpecifier.text);
   else issues.add('nonliteral-module-import');
  }
  if(ts.isImportEqualsDeclaration(node))issues.add('commonjs-import-forbidden');
  if(ts.isCallExpression(node)){
   if(node.expression.kind===ts.SyntaxKind.ImportKeyword){
    if(node.arguments.length===1&&ts.isStringLiteralLike(node.arguments[0]))
     check(node.arguments[0].text);
    else issues.add('nonliteral-dynamic-import');
   }
   if(ts.isIdentifier(node.expression)&&node.expression.text==='require')
    issues.add('commonjs-require-forbidden');
  }
  ts.forEachChild(node,walk);
 };
 walk(ast);
 return [...issues].sort();
}

export function auditSite(){
 const scanned=[],findings=[];
 function scan(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const file=resolve(dir,entry.name);
   const name=relative(site,file).split(sep).join('/');
   if(entry.isSymbolicLink())findings.push({file:name,code:'symlink-in-angular-source'});
   else if(entry.isDirectory()&&entry.name!=='public')scan(file);
   else if(entry.isFile()&&name.endsWith('.ts')){
    scanned.push(name);
    for(const code of auditSource(readFileSync(file,'utf8'),name))
     findings.push({file:name,code});
   }
  }
 }
 scan(site);
 scanned.sort();
 findings.sort((a,b)=>a.file.localeCompare(b.file)||a.code.localeCompare(b.code));
 return {scanned,findings};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditSite();
 for(const finding of result.findings)console.error(finding.file+': '+finding.code);
 if(result.findings.length)process.exitCode=1;
 else console.log('Angular site imports checked: '+result.scanned.length+' modules.');
}
