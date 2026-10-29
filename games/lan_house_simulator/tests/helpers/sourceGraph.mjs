import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
export function sourceGraph(root=new URL('../../src/',import.meta.url)){
 const directory=resolve(root instanceof URL?root.pathname:root),files=[];
 function scan(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=resolve(dir,entry.name);if(entry.isDirectory())scan(file);else if(file.endsWith('.ts')&&!file.endsWith('.d.ts'))files.push(file);}}scan(directory);
 const graph=new Map();
 for(const file of files){
  const text=readFileSync(file,'utf8'),ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true),imports=[];
  for(const node of ast.statements){
   if(!(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))||!node.moduleSpecifier||!ts.isStringLiteral(node.moduleSpecifier))continue;
   const specifier=node.moduleSpecifier.text;
   const typeOnly=!!(node.isTypeOnly||ts.isImportDeclaration(node)&&(node.importClause?.isTypeOnly||node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)&&!node.importClause.name&&node.importClause.namedBindings.elements.every(x=>x.isTypeOnly)));
   imports.push({specifier,typeOnly,target:specifier.startsWith('.')?relative(directory,resolve(dirname(file),specifier.replace(/\.js$/,'.ts'))):null});
  }
  graph.set(relative(directory,file),{text,ast,imports});
 }
 return graph;
}
export function runtimeCycles(graph){
 let next=0;const ids=new Map(),low=new Map(),stack=[],active=new Set(),cycles=[];
 function visit(file){
  ids.set(file,next);low.set(file,next++);stack.push(file);active.add(file);
  for(const entry of graph.get(file).imports){const target=entry.target;if(entry.typeOnly||!graph.has(target))continue;
   if(!ids.has(target)){visit(target);low.set(file,Math.min(low.get(file),low.get(target)));}
   else if(active.has(target))low.set(file,Math.min(low.get(file),ids.get(target)));
  }
  if(low.get(file)===ids.get(file)){const component=[];let item;do{item=stack.pop();active.delete(item);component.push(item);}while(item!==file);if(component.length>1)cycles.push(component.sort());}
 }
 for(const file of graph.keys())if(!ids.has(file))visit(file);
 return cycles;
}
