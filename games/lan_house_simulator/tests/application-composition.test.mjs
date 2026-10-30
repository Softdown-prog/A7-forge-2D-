import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameApplication} from '../dist/js/application/gameApplication.js';
import {createGame,pcCount} from '../dist/js/sim/engine.js';
import {serializeSave,snapshotGameState} from '../dist/js/sim/saveTransfer.js';
import {GAME_SAVE_KEY} from '../dist/js/sim/types.js';
import {GAME_SAVE_BACKUP_KEY} from '../dist/js/sim/localSave.js';
import {cameraForGame} from '../dist/js/render/isometric.js';
import {createServiceAccessInspectionCache} from '../dist/js/ui/serviceAccessInspectionCache.js';

function fixture(initial){
 const data=new Map(initial?[[GAME_SAVE_KEY,JSON.stringify(initial)]]:[]),sounds=[];let fail=false;
 const store={getItem:key=>data.get(key)??null,setItem(key,value){if(fail)throw Error('quota');data.set(key,value);},removeItem:key=>data.delete(key)};
 const audio=Object.fromEntries(['income','soda','candy','printer','keyboard','mail'].map(name=>[name,(...args)=>sounds.push([name,...args])]));
 const app=createGameApplication({store,mailSeed:seed=>seed+17,audio,cameraForState:cameraForGame});
 return {app,data,sounds,failStorage:()=>{fail=true;}};
}
// Exercise the same long-lived contracts held by every panel, including indexes,
// revisions, layout and downloads. No port is recreated when the session swaps.
function panelQueries(p){
 const simple=['ps1AdminPort','ps1ShopDiscPort','ps1ShopPlacementPort','ps1ShopOfferPort','shopOverviewPort','classicGamesCatalogPort','gpuGamesCatalogPort','basicGamesLicenseStatusPort','noticeInboxPort','noticeInboxRevisionPort','eventLogPort','monthlyFinancePort','promotionStatusPort','financialAdminOverviewPort','staffStatusPort','hourlyPriceStatusPort','retailPriceStatusPort','fridayMeetupPort','nightTournamentHudPort'];
 return Object.fromEntries([
  ...simple.map(name=>[name,p[name].snapshot()]),
  ['hardware',p.hardwarePanelPort.snapshot(6,'ram','windows')],['monitors',p.lcdMonitorsPort.snapshot(6)],['gpu',p.gpuCatalogPort.snapshot(6)],
  ['windows',p.windowsLicensePort.rows()],['ledger',p.stationLedgerPort.rows()],['stations',p.stationRevisionPort.snapshot(p.status().year)],
  ['maintenance',p.adminPanelRevisionsPort.computerMaintenance('operations',6,'ram',[],true)],['downloads',p.gpuDownloadMetersPort.bandwidth()],['balance',[p.financialBalancePort.balance(),p.financialBalancePort.billWatch()]],['notices',p.noticeWindowStatusPort.snapshot(true)],
  ['pricing',[p.pricingInsightsPort.hourly(),p.pricingInsightsPort.energy()]],['services',[p.deskPricingPort.installed(),p.deskPricingPort.discs(),p.deskPricingPort.printing()]],
  ['merchandise',p.merchandisePort.overview('soda')],['prices',p.merchandisePort.details('soda',p.merchandisePort.suppliers[0].id,1)],
  ['computers',[p.pcOperationsPort.summary(),p.pcOperationsPort.rows()]],['commerce',p.commerceNetworkPort.snapshot()],
  ['catalog',p.catalog.map(item=>p.shopCatalogOffersPort.snapshot(item.id))],['shopRevision',p.shopCatalogRevisionPort.snapshot('building')],
  ['furniture',[p.placementActions.furniture(),p.placementActions.slots(),p.placementActions.annexSlots(),p.placementActions.walls('remove')]],
  ['layout',[p.layoutEditorPort.objects(),p.layoutEditorPort.partitions(),p.layoutEditorPort.bounds(),p.layoutEditorPort.camera()]],
  ['hud',[p.status(),p.liveStatus(),p.computerOperations(),p.timeWeather(),p.feedback(),p.accessIssues()]]
 ]);
}
test('startup keeps raw legacy saves and preferences outside the campaign',()=>{
 const legacy=createGame(898,'classic');delete legacy.pcHardware;delete legacy.pcLcdModels;
 const {app,data}=fixture(legacy);data.set('lhs.sound','off');
 assert.equal(app.session.startup.source,'primary');assert.equal(app.renderSource().rng,898);
 assert.deepEqual(snapshotGameState(app.renderSource()),snapshotGameState(legacy));
 app.session.persist();assert.deepEqual(JSON.parse(data.get(GAME_SAVE_KEY)),snapshotGameState(app.renderSource()));
 assert.equal(data.get('lhs.sound'),'off');
 assert.equal(JSON.parse(app.session.exportSnapshot().contents).format,'softdown-lan-house-save');
});
test('all retained panel ports resolve the newly imported campaign',()=>{
 const {app}=fixture(createGame(11,'historical')),ports=app.ports,old=app.renderSource(),before=JSON.stringify(old);
 const next=createGame(22,'classic');next.cash=20000;next.totalMinutes=720*42;next.expansionLevel=2;next.installedPcs=7;
 next.pcWear=[1,2,3,4,5,6,7];next.pcPoweredOff=[true,false,true,false,true,false,true];
 next.reputation=67;next.inventory.soda=19;
 const restore=app.session.prepareImport(serializeSave(next));assert.equal(app.renderSource(),old);restore();
 const expected=fixture(JSON.parse(JSON.stringify(app.renderSource()))).app;
 assert.equal(app.ports,ports);assert.equal(app.ports.stationActions.count(),7);
 const importedBeforeQueries=JSON.stringify(app.renderSource());
 assert.deepEqual(panelQueries(ports),panelQueries(expected.ports));
 assert.equal(JSON.stringify(app.renderSource()),importedBeforeQueries,'panel queries never mutate the imported save');
 assert.equal(ports.liveStatus().cash,20000);assert.equal(ports.hardwarePanelPort.snapshot(6,'ram').stations.length,7);
 assert.equal(JSON.stringify(old),before);
});
test('failed storage replacement leaves state, ports, events and listeners untouched',()=>{
 const x=fixture(createGame(33)),old=x.app.renderSource(),before=JSON.stringify(old),notifications=[];
 x.app.session.onReplaced(reason=>notifications.push(reason));
 x.app.frame.popupQueues.sales.push({amount:1,x:0,y:0,age:1});
 const restore=x.app.session.prepareImport(serializeSave(createGame(44)));x.failStorage();
 assert.throws(restore,/quota/);assert.equal(x.app.renderSource(),old);assert.equal(JSON.stringify(old),before);
 assert.equal(x.app.frame.popupQueues.sales.length,1);assert.deepEqual(notifications,[]);
 assert.equal(JSON.parse(x.data.get(GAME_SAVE_KEY)).rng,33);
});
test('cloud restore and new campaign share atomic replacement and transient cleanup',()=>{
 const x=fixture(createGame(55)),reasons=[];x.app.session.onReplaced(reason=>reasons.push(reason));
 const next=createGame(66);next.cash=7654;x.app.frame.popupQueues.payments.push({amount:1,x:0,y:0,age:0});
 const restore=x.app.account.prepareRestore(serializeSave(next));restore();
 assert.equal(x.app.ports.liveStatus().cash,7654);assert.equal(x.app.frame.popupQueues.payments.length,0);
 x.app.frame.dispatch(true,false);assert.deepEqual(x.sounds,[],'imported notices never replay their alert');
 x.app.session.newCampaign('historical');assert.equal(x.app.renderSource().mailScheduleSeed,72438);
 assert.equal(x.app.ports.status().pcCount,3);assert.deepEqual(reasons,['cloud','historical']);
 assert.equal(x.data.has(GAME_SAVE_BACKUP_KEY),false);
});
test('sixth, seventh and annex computer purchases execute through stable application commands',()=>{
 const x=fixture(createGame(77)),p=x.app.ports;x.app.renderSource().cash=50000;
 for(let expansion=0;expansion<2;expansion++){
  assert.equal(p.shopActions.purchase('expand').ok,true);
  assert.equal(p.shopActions.purchase('computer').ok,true);assert.equal(p.shopActions.purchase('computer').ok,true);
 }
 assert.equal(p.status().pcCount,7);const before=x.app.renderSource().cash;
 assert.equal(p.shopActions.purchase('computer').ok,false);assert.equal(x.app.renderSource().cash,before);
 assert.equal(p.shopActions.purchase('extend-east').ok,true);
 const slot=p.placementActions.availableAnnex()[0];assert.ok(slot);
 assert.equal(p.placementActions.installAnnex(slot.id).ok,true);assert.equal(pcCount(x.app.renderSource()),8);
 x.app.session.persist();const loaded=fixture(JSON.parse(x.data.get(GAME_SAVE_KEY))).app;
 assert.equal(loaded.ports.stationActions.count(),8);assert.deepEqual(loaded.ports.layoutEditorPort.objects(),p.layoutEditorPort.objects());
});
test('commands after import never mutate the abandoned campaign',()=>{
 const x=fixture(createGame(88)),old=x.app.renderSource(),before=JSON.stringify(old),next=createGame(99);next.cash=10000;
 x.app.session.prepareImport(serializeSave(next))();const p=x.app.ports;
 assert.equal(p.shopActions.purchase('expand').ok,true);assert.equal(p.shopActions.purchase('computer').ok,true);
 assert.equal(p.stationActions.power(0).ok,true);p.noticeActions.review();p.pricingPort.changeHourly(1);
 x.app.frame.advance(.4);x.app.session.persist();
 assert.equal(JSON.stringify(old),before);assert.equal(p.status().pcCount,4);
 assert.equal(JSON.parse(x.data.get(GAME_SAVE_KEY)).installedPcs,4);
});
test('presentation inspection invalidation discards values from the replaced save',()=>{
 let issues=['old'],now=0;const cache=createServiceAccessInspectionCache(()=>issues,()=>now);
 assert.deepEqual(cache.inspect(),['old']);issues=['new'];now=100;assert.deepEqual(cache.inspect(),['old']);
 cache.invalidate();assert.deepEqual(cache.snapshot(),[]);assert.deepEqual(cache.inspect(),['new']);
});
