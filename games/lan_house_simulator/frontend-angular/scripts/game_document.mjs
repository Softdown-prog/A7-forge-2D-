/** Contracts shared by the standalone Angular build and browser QA. */
import assert from 'node:assert/strict';

export const ANGULAR_GAME_HOSTS=Object.freeze([
 'angular-save-transfer','angular-menu-preferences','angular-notice-inbox',
 'angular-time-weather','angular-player-account','angular-shop-overview',
 'angular-shop-catalog','angular-stock-workspace','angular-merchandise-catalog',
 'angular-finance-workspace','angular-prices-workspace',
 'angular-licenses-workspace','angular-consoles-workspace'
]);

export function assertAngularGameDocument(html){
 const entries=[...html.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)].map(match=>match[1]);
 assert.deepEqual(entries,['./js/privacyConsent.js','./__angular/main.js'],'Unexpected game boot scripts');
 assert.match(html,/href="\.\/__angular\/styles\.css"/,'Missing Angular stylesheet');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size,'No duplicate static DOM IDs');
 for(const id of ANGULAR_GAME_HOSTS) assert.ok(ids.includes(id),'Missing Angular game host: '+id);
}
