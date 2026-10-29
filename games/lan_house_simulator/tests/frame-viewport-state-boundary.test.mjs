import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createFrameViewportState} from "../dist/js/ui/frameViewportState.js";

function fixture(){
 const calls=[],canvas={kind:"game-canvas"},queries=[];
 let onIntersect;
 const coarse={matches:false},reduced={matches:false};
 const makeObserver=callback=>{
  onIntersect=callback;
  calls.push("observer");
  return {observe:target=>calls.push(["observe",target])};
 };
 const media=query=>{
  queries.push(query);
  return query==="(pointer:coarse)"?coarse:reduced;
 };
 const state=createFrameViewportState(canvas,makeObserver,media);
 return {canvas,calls,queries,coarse,reduced,state,intersect:entries=>onIntersect(entries)};
}
test("inicia visível até primeiro evento do IntersectionObserver",()=>{
 const x=fixture();assert.equal(x.state.visible(),true);
});
test("registra exatamente um observer no Canvas original",()=>{
 const x=fixture();
 assert.equal(x.calls.length,2);
 assert.deepEqual(x.calls[0],"observer");
 assert.deepEqual(x.calls[1],["observe",x.canvas]);
});
test("consulta as duas media queries na ordem original",()=>{
 const x=fixture();
 assert.deepEqual(x.queries,["(pointer:coarse)","(prefers-reduced-motion: reduce)"]);
});
test("evento de interseção verdadeiro mantém desenho visível",()=>{
 const x=fixture();x.intersect([{isIntersecting:true}]);
 assert.equal(x.state.visible(),true);
});
test("evento de interseção falso impede desenho de cena",()=>{
 const x=fixture();x.intersect([{isIntersecting:false}]);
 assert.equal(x.state.visible(),false);
});
test("interseção restaurada torna a cena visível novamente",()=>{
 const x=fixture();x.intersect([{isIntersecting:false}]);
 x.intersect([{isIntersecting:true}]);assert.equal(x.state.visible(),true);
});
test("lista de IntersectionObserver vazia é interpretada como invisível",()=>{
 const x=fixture();x.intersect([]);
 assert.equal(x.state.visible(),false);
});
test("entrada sem isIntersecting é interpretada como invisível",()=>{
 const x=fixture();x.intersect([{}]);
 assert.equal(x.state.visible(),false);
});
test("apenas primeira entrada determina visibilidade, como antes",()=>{
 const x=fixture();x.intersect([{isIntersecting:false},{isIntersecting:true}]);
 assert.equal(x.state.visible(),false);
});
test("pointer coarse começa falso e acompanha mudanças do navegador",()=>{
 const x=fixture();assert.equal(x.state.coarsePointer(),false);
 x.coarse.matches=true;assert.equal(x.state.coarsePointer(),true);
 x.coarse.matches=false;assert.equal(x.state.coarsePointer(),false);
});
test("preferência reduzir movimento acompanha mudanças do navegador",()=>{
 const x=fixture();assert.equal(x.state.reducedMotion(),false);
 x.reduced.matches=true;assert.equal(x.state.reducedMotion(),true);
 x.reduced.matches=false;assert.equal(x.state.reducedMotion(),false);
});
test("preferência de movimento não afeta detecção de toque",()=>{
 const x=fixture();x.reduced.matches=true;
 assert.equal(x.state.coarsePointer(),false);
 x.coarse.matches=true;assert.equal(x.state.reducedMotion(),true);
});
test("mídia e interseção não ficam presos em snapshot antigo",()=>{
 const x=fixture(),state=x.state;
 x.intersect([{isIntersecting:false}]);
 x.coarse.matches=true;x.reduced.matches=true;
 assert.deepEqual([state.visible(),state.coarsePointer(),state.reducedMotion()],[false,true,true]);
});
test("novas instalações preservam seus próprios observers e media queries",()=>{
 const a=fixture(),b=fixture();
 a.intersect([{isIntersecting:false}]);a.coarse.matches=true;
 assert.equal(a.state.visible(),false);assert.equal(b.state.visible(),true);
 assert.equal(a.state.coarsePointer(),true);assert.equal(b.state.coarsePointer(),false);
});
test("nenhuma mutação da simulação ou chamada de render é feita no adaptador",()=>{
 const src=readFileSync(new URL("../src/ui/frameViewportState.ts",import.meta.url),"utf8");
 assert.doesNotMatch(src,/from\s*["']\.\.\/(?:sim|render|audio|application)\//);
 assert.doesNotMatch(src,/\b(GameState|stepGame|requestAnimationFrame|localStorage|drawScene)\b/);
});
test("bootstrap injeta APIs no receptor certo e usa informações vivas no frame",()=>{
 const src=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
 assert.match(src,/createFrameViewportState\(canvas,callback=>new IntersectionObserver\(callback\),query=>window\.matchMedia\(query\)\)/);
 assert.match(src,/visible:frameViewport\.visible\(\)/);
 assert.match(src,/coarse:frameViewport\.coarsePointer\(\)/);
 assert.match(src,/reduceMotion:frameViewport\.reducedMotion\(\)/);
 assert.match(src,/hidden:document\.hidden/);
});
