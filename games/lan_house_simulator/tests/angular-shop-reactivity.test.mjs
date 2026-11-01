import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const src=(path)=>readFileSync(new URL('../frontend-angular/src/'+path,import.meta.url),'utf8');
const compiler=ts.transpileModule(src('catalog-search.ts'),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}
});
const search=await import('data:text/javascript;base64,'+
 Buffer.from(compiler.outputText).toString('base64'));

test('normalized shop index handles accents and preserves native phrase matching',()=>{
 const prepared=search.catalogSearchText(['CÓPIAS de CD','Console PS2']);
 assert.equal(prepared,'copias de cd console ps2');
 assert.ok(prepared.includes(search.normalizeCatalogSearch('cópias')));
 assert.ok(search.catalogSearchMatch('Console PS2',['Cópias de CD','Console PS2']));
 assert.ok(!search.catalogSearchMatch('PS2 console',['Cópias de CD','Console PS2']));
 assert.ok(search.catalogSearchMatch('',['Cópias de CD']));
});

test('Angular re-indexes on catalog refresh but never on each keystroke',()=>{
 const component=src('components.ts');
 const block=component.slice(component.indexOf('export class ShopSearchComponent'));
 const index=block.slice(block.indexOf('private indexNativeCards'),block.indexOf('private apply():void'));
 const apply=block.slice(block.indexOf('private apply():void'));
 assert.match(block,/private readonly updated=\(\):void=>\{\s*this\.indexNativeCards\(\);\s*this\.apply\(\)/);
 assert.match(block,/this\.projectedIndex=detail\.cards\.map/);
 assert.match(block,/if\(this\.query\(\)===value\)return/);
 assert.match(index,/querySelectorAll<HTMLElement>/);
 assert.doesNotMatch(apply,/querySelectorAll|querySelector\(/);
 assert.match(apply,/if\(card\.hidden===matches\)card\.hidden=!matches/);
 assert.match(apply,/this\.lastPublishedQuery!==currentQuery/);
 assert.match(apply,/!this\.consolesPending/);
});

test('Angular cart and finance state remain delegated to the authoritative DOM',()=>{
 const component=src('components.ts');
 const block=component.slice(component.indexOf('export class ShopSearchComponent'));
 assert.doesNotMatch(block,/fetch\(|localStorage|createGame\(|buyPs1\(|buyPs2\(/);
 assert.match(block,/lhs:shop-catalog-updated/);
 assert.match(block,/lhs:shop-cards-updated/);
 assert.match(block,/lhs:angular-catalog-filter-updated/);
});
