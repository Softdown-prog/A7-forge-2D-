import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

/** Guard against silently dropping post-merge PS1/PS2/Top Games validation.
 * The YAML remains the source of truth; this test never dispatches Actions.
 */
test("integrated console gameplay runs after main merges and on PR changes",()=>{
 const src=readFileSync(new URL("../../../.github/workflows/lhs-ps2-gameplay.yml",import.meta.url),"utf8");
 assert.match(src,/\bon:\s*\n\s*workflow_dispatch:\s*\n\s*pull_request:/);
 assert.match(src,/\n\s*push:\s*\n\s*branches:\s*\[main\]/);
 assert.match(src,/\n\s*concurrency:\s*\n\s*group:\s*lhs-ps2-gameplay-/);
 assert.match(src,/cancel-in-progress:\s*\$\{\{ github\.event_name == 'pull_request' \}\}/);
 assert.match(src,/node --test tests\/ps2-\*\.test\.mjs tests\/ps1-\*\.test\.mjs/);
 assert.match(src,/node --test tests\/top-games-\*\.test\.mjs tests\/linux-forum-1999\.test\.mjs/);
 assert.match(src,/node scripts\/verify_ps2_gameplay\.mjs/);
 assert.match(src,/node scripts\/render_ps1_admin\.mjs/);
});
