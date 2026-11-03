import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCatalogSearch,catalogSearchMatch} from '../src/react/catalogSearch.mjs';

const src=(path)=>readFileSync(new URL('../frontend-angular/src/'+path,import.meta.url),'utf8');
const angularSearch=src('catalog-search.ts');

test('normalized shop index handles accents and preserves native phrase matching',()=>{
 // Exercise the deployed legacy matcher and assert Angular's independent
 // TypeScript helper follows the same accent-insensitive phrase contract.
 assert.equal(normalizeCatalogSearch('CÓPIAS de CD'),'copias de cd');
 assert.ok(catalogSearchMatch('cópias',['CÓPIAS de CD','Console PS2']));
 assert.ok(catalogSearchMatch('Console PS2',['Cópias de CD','Console PS2']));
 assert.ok(!catalogSearchMatch('PS2 console',['Cópias de CD','Console PS2']));
 assert.ok(catalogSearchMatch('',['Cópias de CD']));
 assert.match(angularSearch,/export function catalogSearchText\(/);
 assert.match(angularSearch,/normalizeCatalogSearch\(parts\.join\(' '\)\)/);
 assert.match(angularSearch,/replace\(\/\[\\u0300-\\u036f\]\/g, ''\)/);
});

test('Standalone Angular shop search module is the only owner of catalogue filtering',()=>{
 const entry=src('main.ts'),search=src('shop-search.ts'),legacy=src('components.ts');
 assert.match(entry,/import \{ShopSearchComponent\} from '\.\/shop-search'/);
 assert.match(search,/export class ShopSearchComponent implements OnInit/);
 assert.doesNotMatch(legacy,/export class ShopSearchComponent/);
});

test('Angular re-indexes on catalog refresh but never on each keystroke',()=>{
 const component=src('shop-search.ts');
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
 const component=src('shop-search.ts');
 const block=component.slice(component.indexOf('export class ShopSearchComponent'));
 assert.doesNotMatch(block,/fetch\(|localStorage|createGame\(|buyPs1\(|buyPs2\(/);
 assert.match(block,/lhs:shop-catalog-updated/);
 assert.match(block,/lhs:shop-cards-updated/);
 assert.match(block,/lhs:angular-catalog-filter-updated/);
});
