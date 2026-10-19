/** A QA scenario must make a legitimate cookie choice before clicking behind the notice. */
export async function dismissPrivacyNotice(page,mobile=false){
 const banner=page.locator('#privacy-banner');
 if(!await banner.isVisible())return;
 const reject=page.locator('#privacy-reject');
 if(mobile)await reject.tap();else await reject.click();
 await banner.waitFor({state:'hidden'});
}
