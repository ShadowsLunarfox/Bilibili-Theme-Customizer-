import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function runReferenceChecks({cdp,base,until,screenshots}) {
  const page = await cdp.page(`${base}/minimalist.html`);
  await page.activate();
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  const css = (selector,property) => page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)}))[${JSON.stringify(property)}]`);
  const patch = async changes => {
    const response = await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:${JSON.stringify(changes)}})`);
    assert.equal(response.ok,true);
    await until(page,`document.documentElement.getAttribute('data-bc-min-options') === BiliThemeMinimalist.flags(${JSON.stringify(response.data.settings)}) && document.documentElement.style.getPropertyValue('--bc-text-color') === '${response.data.settings.textColor}'`);
    await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  };
  const popup = await cdp.page(`${base}/popup.html`);
  await until(popup,'!document.querySelector("#controls").disabled');
  await popup.evaluate('document.querySelector("#apply-reference").click()');
  await until(page,'document.documentElement.dataset.bcMinOptions?.includes("reference") && document.documentElement.dataset.bcMinOptions.includes("liquid")');
  await until(popup,'!document.querySelector("#reset").disabled');
  assert.equal(await popup.evaluate('document.querySelector("[name=minimalistHideBanner]").checked'),false);
  assert.equal(await popup.evaluate('document.querySelector("[name=minimalistHideCarousel]").checked'),false);
  assert.equal(await popup.evaluate('document.querySelector("[name=minimalistReferenceLayout]").checked'),true);
  await popup.close();
  await page.activate();
  assert.match(await css('#bc-theme-wallpaper','backgroundImage'),/radial-gradient/,'empty wallpaper uses the reference pastel backdrop');
  assert.notEqual(await css('.bili-header__banner','display'),'none');
  assert.equal(await css('.bili-header__bar','height'),'64px');
  assert.equal((await css('#first-grid','gridTemplateColumns')).split(' ').length,5);
  assert.equal(await css('#carousel','gridColumnStart'),'1');
  assert.equal(await css('#carousel','gridColumnEnd'),'span 3');
  assert.ok(parseFloat(await css('#carousel','height')) <= 300,'featured row remains compact like the reference');
  for(const id of ['normal','organic-wrapper','analytics']) {
    assert.equal(await css(`#${id}`,'gridColumnStart'),'4',`${id} enters the native-card rail`);
  }
  assert.equal((await css('#normal > .bili-video-card__wrap','gridTemplateColumns')).split(' ').length,2,'native inner card wrapper becomes a horizontal rail card');
  assert.equal(await css('#normal-0','gridColumnStart'),'auto','remaining videos keep normal grid placement');
  assert.match(await css('#bc-theme-header-glass','backdropFilter'), /blur\(22px\).*saturate/);
  assert.match(await css('#normal .bili-video-card__info','backdropFilter'), /blur\(22px\).*saturate/);
  assert.notEqual(await css('#normal .bili-video-card__info','backgroundImage'),'none');
  assert.equal(await page.evaluate('originalCards.every(n=>n.isConnected && document.getElementById(n.id)===n)'),true);
  await page.evaluate(`document.querySelector('#normal .bili-video-card__info').insertAdjacentHTML('beforeend','<span class="bili-video-card__info--ad">广告</span>')`);
  assert.equal(await css('#normal','display'),'none');
  assert.equal(await css('#normal-0','gridColumnStart'),'4','a late ad reflows the three-card rail');
  await page.evaluate('document.querySelector("#normal .bili-video-card__info--ad").remove()');
  assert.equal(await css('#normal-0','gridColumnStart'),'auto');
  await patch({minimalistHideCarousel:true});
  assert.equal(await css('#carousel','display'),'none');
  assert.equal(await css('#normal','gridColumnStart'),'auto','no empty rail when carousel is hidden');
  assert.equal(await css('#normal > .bili-video-card__wrap','display'),'block');
  await patch({minimalistHideCarousel:false,minimalistHideBanner:true});
  assert.equal(await css('.bili-header__banner','display'),'none');
  assert.equal(await css('.bili-header','paddingTop'),'64px','hidden hero still reserves header space');
  await patch({minimalistHideBanner:false,minimalistLiquidGlass:false});
  assert.equal(await css('#normal .bili-video-card__info','backgroundImage'),'none','liquid highlights fully disengage');
  await patch({minimalistLiquidGlass:true,material:'clear'});
  assert.equal(await css('#normal .bili-video-card__info','backdropFilter'),'blur(0px)','Clear stays clear');
  await patch({material:'glass'});
  for (const [width,columns] of [[1800,5],[1280,5],[950,3],[650,2],[420,1]]) {
    await page.resize(width,1000);
    assert.equal((await css('#first-grid','gridTemplateColumns')).split(' ').length,columns,`reference columns at ${width}`);
    assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`no reference overflow at ${width}`);
    if(width<1100) assert.equal(await css('#normal','gridColumnStart'),'auto','narrow view removes rail');
  }
  await page.resize(1440,1000);
  await page.reload();
  await until(page,'document.documentElement.dataset.bcMinOptions?.includes("reference")');
  assert.match(await css('#bc-theme-header-glass','backdropFilter'),/saturate/);
  await page.evaluate(`document.querySelector('#logo').click();document.querySelector('#normal h3 a').click();
    document.querySelector('#avatar').click();document.querySelector('#search').dispatchEvent(new Event('input'));`);
  assert.equal(await page.evaluate('actions.links'),2);
  assert.notEqual(await css('.nav-search-panel','display'),'none');
  assert.notEqual(await css('.v-popover-content','display'),'none');
  assert.equal(await css('.v-popover-content','borderRadius'),'16px');
  await patch({textColor:'#ffffff'});
  assert.equal(await css('#normal h3','color'),'rgb(255, 255, 255)','liquid palette honors custom text colors');
  await patch({textColor:'#232638',enabled:false});
  await until(page,'!document.querySelector("#bc-theme-header-glass")');
  assert.match(await css('.bili-header__bar','backdropFilter'),/saturate/,'standalone glass uses the native header');
  assert.match(await css('.bili-header__bar','backgroundColor'),/rgba/,'standalone glass retains safe translucency');
  await patch({enabled:true});
  await until(page,'document.querySelector("#bc-theme-header-glass") !== null');
  const gif='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:{dataUrl:'${gif}',name:'Keep my background'}})`);
  await until(page,'document.querySelector("#bc-theme-wallpaper")?.dataset.bcCustom === "true"');
  assert.match(await css('#bc-theme-wallpaper','backgroundImage'),/url\(/,'reference fallback never replaces a custom wallpaper');
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:null})");
  await until(page,'document.querySelector("#bc-theme-wallpaper")?.dataset.bcCustom === "false"');
  await page.evaluate("history.pushState({},'', '/video/BV-reference')");
  await until(page,'document.documentElement.dataset.bcPage === "video" && !document.documentElement.hasAttribute("data-bc-minimalist")');
  assert.equal(await css('#normal .bili-video-card__info','backgroundImage'),'none','reference glass disengages on a video route');
  await page.evaluate('history.back()');
  await until(page,'document.documentElement.dataset.bcMinimalist === "true"');
  if(screenshots) {
    // Colored landscape SVGs are local test artwork, not replacement site data
    // or a screenshot pasted over the production extension's user interface.
    await page.evaluate(`(()=>{
      const art=(hue)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500"><defs><linearGradient id="s" x2="0" y2="1"><stop stop-color="hsl('+hue+',55%,75%)"/><stop offset=".65" stop-color="#f9ceb9"/><stop offset="1" stop-color="#c0d9e2"/></linearGradient></defs><rect width="1200" height="500" fill="url(#s)"/><circle cx="800" cy="210" r="55" fill="#ffe5c6"/><path d="M0 380 210 240 360 340 550 210 780 360 980 280 1200 390V500H0Z" fill="hsl('+hue+',25%,55%)"/><path d="M0 430 170 370 420 410 720 350 1000 420 1200 360V500H0Z" fill="hsl('+hue+',24%,39%)"/><path d="M0 470Q500 400 1200 450V500H0Z" fill="#adc9d1"/></svg>');
      const banner=document.querySelector('.bili-header__banner');banner.style.backgroundImage='url("'+art(220)+'")';banner.textContent='';
      document.querySelectorAll('.bili-video-card img').forEach((img,i)=>img.src=art([215,250,170,30,195][i%5]));
      const carousel=document.querySelector('#carousel');carousel.style.background='center/cover url("'+art(255)+'")';carousel.style.display='flex';carousel.style.alignItems='end';carousel.textContent='Native featured carousel · 原生轮播推荐';
      document.querySelector('.nav-search-panel').classList.remove('open');document.querySelector('.v-popover-content').classList.remove('open');
    })()`);
    await mkdir(screenshots,{recursive:true});
    await writeFile(join(screenshots,'reference-liquid-desktop.png'),await page.screenshot());
    await page.resize(650,1000);
    await writeFile(join(screenshots,'reference-liquid-narrow.png'),await page.screenshot());
  }
  await patch({minimalistEnabled:false});
  assert.equal(await page.evaluate('document.documentElement.hasAttribute("data-bc-minimalist")'),false);
  assert.equal(await css('.bili-header__bar','height'),'64px');
  assert.equal(await css('#normal','gridColumnStart'),'auto');
  assert.doesNotMatch(await css('#bc-theme-wallpaper','backgroundImage'),/radial-gradient/,'turning the mode off restores the original empty wallpaper');
  assert.equal(await css('#normal .bili-video-card__info','backgroundImage'),'none');
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await page.close();
  console.log('  PASS reference/liquid: popup preset, native feature/three-card rail, late ads, five-column feed, original wrappers/events, independent switches, Clear, persistence, responsive fallback and restore');
}
