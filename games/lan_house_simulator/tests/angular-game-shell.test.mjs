import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const file=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("Angular owns menu and topbar while Canvas has a separate entry",()=>{
 const source=file("index.html"),entry=file("frontend-angular/src/main.ts");
 for(const id of ["lhs-menu-actions","lhs-topbar-actions","lhs-menu-tour","game"])
  assert.ok(source.includes('id="'+id+'"'),id);
 assert.match(source,/src="\.\/__angular\/main\.js"/);
 assert.doesNotMatch(source,/<script type="module" src="\.\/js\/main\.js"/);
 assert.match(entry,/js\/main\.js/);
});
test("Angular menu is ready after its event controllers initialize, without a RAF gate",()=>{
 const source=file("src/bootstrap/bootstrapGame.ts");
 const css=file("style.css");
 assert.match(css,/html:not\(\[data-game-ready="true"\]\) #lhs-menu-actions/);
 assert.match(source,/installRuntimeControls\(/);
 assert.match(source,/installWindowNavigation\(\);session\.showMenu\(\);loop\.start\(\);/);
 assert.match(source,/document\.documentElement\.dataset\.gameReady="true"/);
 assert.ok(source.indexOf('document.documentElement.dataset.gameReady="true"')>
  source.indexOf('installWindowNavigation();session.showMenu();loop.start();'));
 assert.doesNotMatch(source,/requestAnimationFrame\(\(\)=>win\.requestAnimationFrame/);
});
test("the standalone game ships the UI and engine locally",()=>{
 for(const asset of ["__angular/main.js","__angular/styles.css","js/main.js"])
  assert.ok(existsSync(new URL("../dist/"+asset,import.meta.url)),asset);
 assert.doesNotMatch(file("dist/__angular/main.js"),/https:\/\/(unpkg|esm\.sh|cdn\.jsdelivr)/);
 assert.match(file("dist/index.html"),/src="\.\/__angular\/main\.js"/);
 assert.ok(!existsSync(new URL("../dist/js/react-entry.js",import.meta.url)));
});
