// Follow the Angular controls available to a player at each viewport width.
export async function selectAdminArea(page,area){
 const tab=page.locator('#angular-admin-area-navigation [data-angular-admin-tab="'+area+'"]');
 await tab.click();
 await page.locator('#section-'+area).waitFor();
}
export function taskControl(page,area,task){
 return page.locator('#section-'+area+' [data-angular-task][aria-controls="page-'+area+'-'+task+'"]');
}
export async function selectTask(page,area,task){
 await taskControl(page,area,task).click();
 await page.locator('#page-'+area+'-'+task).waitFor();
}
