import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from '@typescript/typescript6';

// Structural checks refer to the adapter that owns the behavior. Runtime tests
// exercise the contracts independently of these source-location assertions.
export const sourceModule=path=>readFileSync(new URL('../../src/'+path,import.meta.url),'utf8');
const compact=text=>text.replace(/\s+/g,'');
export function assertSourceCall(path,callee,args){
 const ast=ts.createSourceFile(path,sourceModule(path),ts.ScriptTarget.Latest,true),calls=[];
 function visit(node){if(ts.isCallExpression(node)&&compact(node.expression.getText(ast))===callee)calls.push(node);ts.forEachChild(node,visit);}visit(ast);
 assert.ok(calls.length,path+' must call '+callee);
 if(args)assert.ok(calls.some(node=>args.every((value,index)=>value===null||compact(node.arguments[index]?.getText(ast)??'')===compact(value))),path+': arguments of '+callee);
}
export function assertCallsInOrder(path,callees){
 const ast=ts.createSourceFile(path,sourceModule(path),ts.ScriptTarget.Latest,true),calls=[];
 function visit(node){if(ts.isCallExpression(node))calls.push(compact(node.expression.getText(ast)));ts.forEachChild(node,visit);}visit(ast);
 let after=-1;for(const callee of callees){const next=calls.indexOf(callee,after+1);assert.ok(next>after,path+': '+callee+' after '+callees.slice(0,callees.indexOf(callee)).join(', '));after=next;}
}
export function assertCompositionAdaptersExclude(pattern){
 for(const path of ['ui/gamePanels.ts','ui/runtimeControls.ts','ui/runtimeSessionController.ts','ui/runtimeLoop.ts','ui/placementController.ts','bootstrap/bootstrapGame.ts']){
  const text=sourceModule(path);
  if(typeof pattern==='string')assert.ok(!text.includes(pattern),path+': '+pattern);
  else assert.doesNotMatch(text,pattern,path);
 }
}
