import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");

test("React presents shop categories; TypeScript remains the controller",()=>{
 const html=file("index.html"),entry=file("src/react/entry.jsx"),ui=file("src/react/managementUi.jsx"),adapter=file("src/ui/shopPanels.ts");
 assert.match(html,/id="react-shop-categories"/);
 assert.match(entry,/\["react-shop-categories",<ShopCategories\/>\]/);
 for(const id of ["equipment","consoles","building","decoration"]){
  assert.match(ui,new RegExp('id:"'+id+'"'));
 }
 assert.match(ui,/lhs:shop-category-selected/);
 assert.match(adapter,/lhs:shop-category-selected/);
 assert.match(adapter,/data-shop-category/);
 assert.match(adapter,/onChange\(\)/);
 assert.match(adapter,/shop\.scrollTop=0/);
 assert.doesNotMatch(ui,/\b(createGame|requestAnimationFrame|localStorage|purchase\(|save\()\b/);
});

test("React shortcuts delegate to live admin and shop controls",()=>{
 const html=file("index.html"),entry=file("src/react/entry.jsx"),ui=file("src/react/managementUi.jsx");
 for(const id of ["react-quick-deck","react-admin-shortcuts"]){
  assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(entry,new RegExp('"'+id+'"'));
 }
 for(const target of ["open-admin","open-shop","data-admin-tab","data-panel-choice"]){
  assert.ok(ui.includes(target),target);
 }
 for(const area of ["finance","stock","services","computers"]){
  assert.match(ui,new RegExp('area:"'+area+'"'));
 }
 assert.match(ui,/if\(task\.disabled\)/);
 assert.match(ui,/\brole="status"/);
 assert.doesNotMatch(ui,/from ["'][.][.][/]sim|from ["'][.][.][/]application/);
});

test("Visual-only enhancements keep Canvas and game bootstrap untouched",()=>{
 const index=file("index.html");
 assert.match(index,/id="game"[^>]*width="1000" height="610"/);
 assert.match(index,/src="\.\/js\/react-entry\.js"/);
 assert.ok(!index.includes('src="./js/main.js"'));
 assert.match(file("style.css"),/react-admin-shortcuts-grid/);
 assert.match(file("website/site.css"),/Website visual refresh: presentation only/);
});
