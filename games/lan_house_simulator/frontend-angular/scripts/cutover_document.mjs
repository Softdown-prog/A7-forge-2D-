/** Single deterministic Angular cutover transformation used by the real-game
 * browser test and the isolated static candidate. Never mutates source HTML.
 */
import assert from 'node:assert/strict';
const exactlyOne=(html,needle,replacement)=>{
 assert.equal(html.split(needle).length,2,'Expected exactly one HTML anchor: '+needle.slice(0,90));
 return html.replace(needle,replacement);
};
const bounded=(html,start,end,replacement)=>{
 const from=html.indexOf(start),to=from<0?-1:html.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'Missing Angular cutover boundary: '+start);
 return html.slice(0,from)+replacement+html.slice(to+end.length);
};
export const ANGULAR_CUTOVER_HOSTS=Object.freeze([
 'angular-save-transfer','angular-menu-preferences','angular-notice-inbox',
 'angular-time-weather','angular-player-account','angular-shop-overview',
 'angular-shop-catalog','angular-stock-workspace','angular-merchandise-catalog',
 'angular-finance-workspace','angular-prices-workspace',
 'angular-licenses-workspace','angular-consoles-workspace'
]);
export function createAngularCutoverDocument(original){
 const react='<script type="module" src="./js/react-entry.js"></script>';
 const nativeShop='<div id="shop-catalog" class="shop-grid"></div>';
 const nativeStock='<div id="merchandise-catalog"></div>';
 for(const anchor of [react,nativeShop,nativeStock])
  assert.equal(original.split(anchor).length,2,'One original anchor required: '+anchor);
 let html=bounded(original,
  '<div class="save-actions" aria-label="Transferir progresso">',
  '</p>','<div id="angular-save-transfer"></div>');
 html=bounded(html,'<div id="menu-settings"','</div>',
  '<div id="angular-menu-preferences"></div>');
 html=bounded(html,'<section id="notices" class="admin notice-inbox"',
  '</section>','<div id="angular-notice-inbox"></div>');
 html=bounded(html,'<details class="time-weather-panel" id="time-weather-panel">',
  '</details>','<div id="angular-time-weather"></div>');
 const overview='<p id="shop-cash"></p>',after='<nav id="react-shop-categories"';
 const from=html.indexOf(overview),to=html.indexOf(after,from+overview.length);
 assert.ok(from>=0&&to>from,'Shop organization must be replaceable');
 html=html.slice(0,from)+'<div id="angular-shop-overview"></div>\n      '+
  html.slice(to);
 html=exactlyOne(html,'</body>','<div id="angular-player-account"></div></body>');
 html=exactlyOne(html,'<h3>Produtos e estoque</h3>',
  '<h3>Produtos e estoque</h3><div id="angular-stock-workspace" class="angular-admin-workspace-root"></div>');
 html=exactlyOne(html,nativeStock,
  '<div id="merchandise-catalog"><div id="angular-merchandise-catalog"></div></div>');
 html=exactlyOne(html,'<h3>Investimento e finanças</h3>',
  '<h3>Investimento e finanças</h3><div id="angular-finance-workspace" class="angular-admin-workspace-root"></div>');
 for(const [title,id] of [
  ['Preços de venda','angular-prices-workspace'],
  ['Licenciamento de Windows','angular-licenses-workspace'],
  ['Videogames · PS1 (2002) e PS2 (2006)','angular-consoles-workspace']
 ]){
  const anchor='<h3>'+title+'</h3>';
  html=exactlyOne(html,anchor,anchor+'<div id="'+id+'" class="angular-admin-workspace-root"></div>');
 }
 html=exactlyOne(html,nativeShop,
  '<div id="angular-shop-catalog"></div>'+nativeShop);
 html=exactlyOne(html,react,
  '<script type="module" src="./__angular/main.js"></script>');
 html=exactlyOne(html,'</head>',
  '<link rel="stylesheet" href="./__angular/styles.css"/>'+
  // The legacy DOM is an imperative command port. It must not be in layout,
  // accessible by keyboard, or counted as a second visible catalogue.
  // Angular delegates actions through native button.click() on the kept DOM.
  '<style>#shop-catalog{display:none!important}'+
  '#angular-shop-catalog{display:block;min-width:0}</style></head>');
 assert.ok(!html.includes(react),'React bootstrap cannot be present');
 for(const id of ANGULAR_CUTOVER_HOSTS)
  assert.equal(html.split('id="'+id+'"').length,2,'One Angular host required: '+id);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const duplicates=[...new Set(ids.filter((v,i)=>ids.indexOf(v)!==i))];
 assert.deepEqual(duplicates,[],'No duplicate static DOM IDs');
 return html;
}
