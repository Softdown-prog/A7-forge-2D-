#!/usr/bin/env node
/**
 * Static inventory of the Angular game hosts and browser scenarios.
 * String markers do not establish a passing browser run.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const game=path.resolve(import.meta.dirname,"../..");
const read=relative=>fs.readFileSync(path.join(game,relative),"utf8");
const uniq=values=>[...new Set(values)].sort();
const list=(source,re)=>uniq([...source.matchAll(re)].map(match=>match[1]));
export const checks=[
 {id:"console-purchases",name:"PS1/PS2 stations, media and save persistence",
  scope:"integrated-browser",need:["#angular-ps1-placement","#angular-ps2-placement",
   "save.ps1Stations","save.ps2Stations","restored.ps2Games"]},
 {id:"menu-save-transfer",name:"Angular save export, import and unique IDs",
  scope:"integrated-browser",need:["#angular-save-transfer #save-export",
   "#angular-save-transfer #save-import-file","exported.exportVersion",
   "restoredFromFile.ps1Stations"]},
 {id:"sound-preferences",name:"Angular sound preference with real local storage",
  scope:"integrated-browser",need:["#angular-menu-preferences #option-sound",
   "localStorage.getItem('lhs.sound')"]},
 {id:"admin-workspaces",name:"Angular administration navigation and workspaces",
  scope:"integrated-browser",need:["#angular-admin-area-navigation",
   "#angular-service-workspace","page-services-network",
   "#angular-computer-workspace","page-computers-hardware"]},
 {id:"desktop-mobile-touch",name:"Desktop 1280 and mobile 414/360 with touch",
  scope:"integrated-browser",need:["[1280,414,360]","isMobile:mobile","hasTouch:mobile"]},
 {id:"disabled-purchases",name:"Disabled PS2 offer cannot make a purchase",
  scope:"integrated-browser",need:["ps2.isDisabled()","No locked PS2 purchase"]},
 {id:"hud-weather",name:"Live Angular calendar and weather UI in the real game",
  scope:"integrated-browser",need:["#angular-time-weather","#time-weather-date",
   "#weather-hud"]},
 {id:"mail-inbox",name:"Real inbox, letter windows and mail actions",
  scope:"integrated-browser",need:["#angular-notice-inbox","#notices",
   "aria-expanded"]},
 {id:"layout-editor",name:"Touch furniture placement, rotate, remove and confirm",
  scope:"integrated-browser",need:["#layout-editor","#layout-rotate",
   "#layout-confirm","#layout-remove"]},
 {id:"shop-search",name:"Real game search, category switch and empty results",
  scope:"integrated-browser",need:["#lhs-shop-query","Nenhum cartão"]},
 {id:"keyboard-focus",name:"Keyboard focus, Escape and accessible admin dialogs",
  scope:"integrated-browser",need:["page.keyboard","Escape","focus"]},
 {id:"admin-task-navigation",name:"Angular prices, Windows licensing and PS1/PS2 task navigation",
  scope:"integrated-browser",need:["adminTaskMatrix",
   "Angular task forwards native",
   "Only one native task page shown",
   "Navigation alone cannot purchase another PS1 disc",
   "Console navigation cannot purchase stations"]},
 {id:"finance-navigation",name:"Angular finance pages, safe native restart and mobile layout",
  scope:"integrated-browser",need:["#angular-finance-workspace",
   "#page-finance-","financeSnapshot.ps1Stations",
   "#reset-game","Finance navigation cannot reset PS2 stations"]},
 {id:"stock-management",name:"Real Angular stock catalog, native pricing, orders and save",
  scope:"integrated-browser",need:["#angular-merchandise-catalog",
   "#merchandise-order","#merchandise-price-form",
   "#page-stock-suppliers","stockManagementResults",
   "restored.merchandise.orders.length"]},
 {id:"account-donation",name:"Site account and donation links under Angular cutover",
  scope:"integrated-browser",need:["#player-account","/donate/","Firebase"]},
 {id:"privacy-consent",name:"Privacy banner accept/reject through Angular cutover",
  scope:"integrated-browser",need:["#privacy-accept","#privacy-reject"]},
 {id:"mail-preview",name:"Angular inbox preview renders snapshots",
  scope:"preview-only",need:["angular-notice-inbox"]},
 {id:"weather-preview",name:"Angular HUD/weather preview renders snapshots",
  scope:"preview-only",need:["angular-time-weather"]},
 {id:"shop-catalog-preview",name:"Angular catalog delegates to native buttons",
  scope:"preview-only",need:["angular-console-shop","One native delegated action",
   "Caixa insuficiente"]}
];
export function auditMigration(sources){
 const {published,angularEntry,angularPreview,integratedQa,previewQa,angularWorkflow}=sources;
 const angularScript=/src=["']\.\/__angular\/main\.js["']/.test(published);
 const previewIds=new Set(list(angularPreview,/\bid=["']([^"']+)["']/g));
 const gameIds=new Set(list(published,/\bid=["']([^"']+)["']/g));
 const shellHosts=list(angularEntry,/\['(lhs-[^']+)',\s*[A-Z][A-Za-z0-9]+\]/g);
 const hosts=uniq([
  ...shellHosts,
  ...list(angularEntry,/\['(angular-[^']+)',\s*[A-Z][A-Za-z0-9]+\]/g),
  ...list(angularEntry,/getElementById\('(angular-[^']+)'\)/g)
 ]);
 const missingInGame=hosts.filter(id=>!gameIds.has(id));
 const missingInPreview=shellHosts.filter(id=>!previewIds.has(id));
 const checkResults=checks.map(({id,name,scope,need})=>{
  const testedSource=scope==="preview-only"?previewQa:integratedQa;
  const absent=need.filter(term=>!testedSource.includes(term));
  return {id,name,scope,status:absent.length?"not-evidenced-in-script":"script-evidence-found",
   missingMarkers:absent};
 });
 const blockers=[];
 if(!angularScript)blockers.push({id:"angular-game-entry",priority:"critical",
  description:"The standalone document must bootstrap Angular"});
 if(missingInGame.length||missingInPreview.length)
  blockers.push({id:"angular-hosts",priority:"critical",
   description:"One or more Angular hosts are missing"});
 const missingIntegrated=checkResults.filter(x=>x.scope==="integrated-browser"&&
  x.status==="not-evidenced-in-script");
 if(missingIntegrated.length)blockers.push({
  id:"untested-integrated-flows",priority:"high",
  description:missingIntegrated.length+" integrated browser scenarios lack evidence in the current QA script"});
 const angularWorkflowPresent=/verify_integrated_game\.mjs/.test(angularWorkflow)&&
  /verify_catalog_preview\.mjs/.test(angularWorkflow);
 if(!angularWorkflowPresent)blockers.push({id:"angular-workflow",priority:"critical",
  description:"Dedicated Angular browser QA steps not both present"});
 return {
  schemaVersion:2,kind:"angular-game-audit",
  status:blockers.length?"not-ready":"manual-review-required",
  decision:"no-merge-no-deploy",
  game:{angularScript},
  hosts:{registered:hosts,missingInGame,missingInPreview},
  browserQa:{workflowPresent:angularWorkflowPresent,
   checks:checkResults,
   evidenced:checkResults.filter(x=>x.status==="script-evidence-found").length,
   missing:checkResults.filter(x=>x.status==="not-evidenced-in-script").length,
   caveat:"String markers indicate script coverage only, NOT proof of passing browser behavior. See Actions results."},
  blockers,
  nextSteps:[
   "Confirm stock management in an actual mobile device; review save/cloud flows separately",
   "Review account/donation navigation with live services only in a separately approved environment",
   "Run integrated browser QA for the commit being reviewed"
  ]
 };
}
/** Only include scenario evidence that is statically imported AND invoked by
 * the integrated Chromium runner. A detached test file is not test coverage.
 */
export function integratedQaEvidence(entry=read("frontend-angular/scripts/verify_integrated_game.mjs")){
 const portions=[entry];
 const imports=[...entry.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]\.\/integrated-qa\/([\w-]+\.mjs)['"];?$/gm)];
 for(const match of imports){
  const bindings=match[1].split(",").map(item=>item.trim().split(/\s+as\s+/).at(-1));
  if(!bindings.every(name=>new RegExp("\\bawait\\s+"+name+"\\s*\\(").test(entry)))continue;
  portions.push(read("frontend-angular/scripts/integrated-qa/"+match[2]));
 }
 return portions.join("\n");
}
export function readCurrentSources(){
 return {published:read("index.html"),angularEntry:read("frontend-angular/src/main.ts"),
  angularPreview:read("frontend-angular/src/index.html"),
  integratedQa:integratedQaEvidence(),
  previewQa:read("frontend-angular/scripts/verify_catalog_preview.mjs"),
  angularWorkflow:fs.readFileSync(path.resolve(game,"../../.github/workflows/lhs-angular-ui-preview.yml"),"utf8")};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=auditMigration(readCurrentSources());
 const flag=process.argv.indexOf("--output");
 if(flag!==-1){
  const filename=process.argv[flag+1];
  if(!filename)throw Error("Missing --output path");
  const target=path.resolve(filename);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(report,null,2)+"\n");
 }
 console.log(JSON.stringify({kind:report.kind,status:report.status,hosts:report.hosts.registered.length,
  missingInGame:report.hosts.missingInGame,browserEvidence:report.browserQa.evidenced,
  browserGaps:report.browserQa.missing,blockers:report.blockers.map(x=>x.id)}));
}
