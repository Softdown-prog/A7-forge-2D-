// Follow the same responsive navigation available to a player.
export async function selectAdminArea(page,area){
 const select=page.locator('#admin-area');
 if(await select.isVisible())await select.selectOption(area);
 else await page.locator('[data-admin-tab="'+area+'"]').click();
}
export async function selectTask(page,area,task){
 await page.locator('#section-'+area+' [data-panel-choice="'+task+'"]').click();
}
