/** Enforce independent browser-game feature folders, following Terrania ADR 0045. */
import ts from "@typescript/typescript6";
import {posix} from "node:path";

export const RENDER_FAMILIES=["posters","retail","computers","actors"];
const sharedPosterFiles=new Set(["types.ts","primitives.ts","crtScene.ts","registry.ts"]);
const sharedActorFiles=new Set(["types.ts","registry.ts","rigPrimitives.ts","rigState.ts","femaleRig.ts","head.ts","arms.ts","legs.ts","headset.ts"]);

/** Collect static, re-exported, side-effect and literal dynamic imports. */
export function importSpecifiers(source){
 const syntax=ts.createSourceFile("feature.ts",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const imports=new Set();
 function visit(node){
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&
    node.moduleSpecifier&&ts.isStringLiteralLike(node.moduleSpecifier))
   imports.add(node.moduleSpecifier.text);
  if(ts.isCallExpression(node)&&node.arguments.length===1&&ts.isStringLiteralLike(node.arguments[0])&&
    (node.expression.kind===ts.SyntaxKind.ImportKeyword||
      ts.isIdentifier(node.expression)&&node.expression.text==="require"))
   imports.add(node.arguments[0].text);
  ts.forEachChild(node,visit);
 }
 visit(syntax);
 return [...imports];
}
function resolveLocal(from,specifier){
 if(!specifier.startsWith("."))return null;
 const destination=posix.normalize(posix.join(posix.dirname(from),specifier));
 return destination.replace(/\.(?:mjs|cjs|jsx?|tsx?)$/,".ts");
}
function family(path){
 const match=/^render\/(posters|retail|computers|actors)\//.exec(path);
 return match?.[1]??null;
}
function isTopLevel(path,folder){
 return path.startsWith("render/"+folder+"/")&&!path.slice(("render/"+folder+"/").length).includes("/");
}
/**
 * Source map keys are paths relative to src/. A shared root-level painter may
 * compose multiple features; the individual feature files must not depend on siblings.
 */
export function featureBoundaryViolations(sources){
 const failures=[];
 for(const [from,source] of sources){
  const own=family(from),file=posix.basename(from);
  for(const specifier of importSpecifiers(source)){
   const target=resolveLocal(from,specifier);
   if(!target)continue;
   const other=family(target),targetFile=posix.basename(target);
   if(own&&other&&own!==other){
    failures.push(from+" -> "+target+": independent render families must use shared root adapters");
   }else if(own==="posters"&&other==="posters"&&
     isTopLevel(from,"posters")&&!sharedPosterFiles.has(file)&&
     isTopLevel(target,"posters")&&!sharedPosterFiles.has(targetFile)&&from!==target){
    failures.push(from+" -> "+target+": poster artwork cannot depend on another poster");
   }else if(own==="actors"&&other==="actors"&&
     isTopLevel(from,"actors")&&!sharedActorFiles.has(file)&&
     isTopLevel(target,"actors")&&!sharedActorFiles.has(targetFile)&&from!==target){
    failures.push(from+" -> "+target+": actor appearance cannot depend on another appearance");
   }else if(from.startsWith("sim/stories/definitions/")&&target.startsWith("sim/stories/definitions/")&&from!==target){
    failures.push(from+" -> "+target+": story definition cannot import a sibling definition");
   }
  }
 }
 return failures;
}
