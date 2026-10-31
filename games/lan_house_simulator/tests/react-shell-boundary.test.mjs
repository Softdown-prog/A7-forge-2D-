import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const file=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("React owns the menu and topbar without replacing the Canvas simulation",()=>{
 const source=file("index.html"),js=file("src/react/entry.jsx");
 assert.match(source,/id="react-menu-actions"/);
 assert.match(source,/id="react-topbar-actions"/);
 assert.match(source,/id="react-menu-tour"/);
 assert.doesNotMatch(source,/<script type="module" src="\.\/js\/main\.js"/);
 assert.match(source,/src="\.\/js\/react-entry\.js"/);
 for(const id of ["menu-new","menu-continue","menu-account","menu-options",
    "open-admin","open-shop","open-notices","open-menu","open-account","notices-count"])
  assert.match(js,new RegExp('id="'+id+'"'),"DOM controllers still have their own stable ID: "+id);
 assert.match(js,/flushSync/);
 assert.match(js,/import\("\.\/main\.js"\)/);
 assert.match(source,/id="game"/);
 assert.match(file("src/bootstrap/bootstrapGame.ts"),/dataset\.gameReady="true"/);
 assert.match(js,/createRoot/);
 assert.doesNotMatch(js,/createGame|requestAnimationFrame|setInterval/);
});
test("React bundle ships locally and the original TypeScript bootstrap stays external",()=>{
 assert.ok(existsSync(new URL("../dist/js/react-entry.js",import.meta.url)));
 const js=file("dist/js/react-entry.js");
 assert.match(js,/main\.js/);
 assert.ok(js.length>5000);
 assert.doesNotMatch(js,/https:\/\/(unpkg|esm\.sh|cdn\.jsdelivr)/);
 assert.match(file("dist/index.html"),/react-entry\.js/);
});
