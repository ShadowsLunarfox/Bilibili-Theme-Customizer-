import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {liquidFixture} from './liquid.mjs';
import {measure,compare,settle,runParity} from './layout-parity.mjs';

// Domestic-home component structure and native selector specificity. These
// remain fixture styles; no site layout dimensions are copied into the theme.
export function homescreenFixture(BC) {
  return liquidFixture(BC)
    .replace('<form class="nav-search-form">','<div class="center-search__bar"><form id="nav-searchform" class="nav-search-form">')
    .replace('</form>','</form></div>')
    .replaceAll('<div class="bili-video-card__info">','<div class="bili-video-card__info"><div class="bili-video-card__info--right">')
    .replaceAll('</div></div></article>','</div></div></div></article>')
    .replace('Native featured carousel <a href="/video/BV-feature">▶</a>','<div class="carousel-footer"><p>Native featured carousel</p><a href="/video/BV-feature">▶</a></div>')
    .replace('</style>',`</style><style>
      .bili-header .bili-header__channel .channel-items__left :is(.channel-link,.channel-link__more){border-color:#ccd3d9;box-shadow:inset 0 0 0 1px #ccd3d9}
      .bili-header .center-search-container .center-search__bar{background:#ddd}
      .bili-header .center-search-container .center-search__bar #nav-searchform{background:#f1f2f3}
      .bili-header .center-search-container .center-search__bar #nav-searchform .nav-search-content .nav-search-input{background:#989d9f;color:white}
      .bili-video-card .bili-video-card__info{display:flex}.bili-video-card__info--right{flex:1;min-width:0}
      .recommended-swipe .carousel-footer{width:100%;padding:16px;background:#51416d;color:white}.carousel-footer p{margin:0}
    </style>`);
}

export async function runHomescreenChecks({cdp,base,until,screenshots,mode}) {
  const page=await cdp.page(base+'/homescreen.html');
  await page.activate();await page.resize(1920,1080);
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  const css=(selector,property)=>page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)}))[${JSON.stringify(property)}]`);
  const patch=async changes=>{
    const r=await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:${JSON.stringify(changes)}})`);
    assert.equal(r.ok,true);
    await until(page,changes.enabled===false?'!document.documentElement.hasAttribute("data-bc-enabled")':
      `document.documentElement.dataset.bcEnabled === "true" && document.documentElement.style.getPropertyValue('--bc-text-color') === '${r.data.settings.textColor}'`);
    await settle(page);
  };
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await patch({enabled:true});
  const wallpaper=await page.evaluate(`(()=>{const c=document.createElement('canvas');c.width=1920;c.height=1080;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,1920,1080);g.addColorStop(0,'#e7ece5');g.addColorStop(.3,'#719b91');g.addColorStop(1,'#102c28');x.fillStyle=g;x.fillRect(0,0,1920,1080);x.fillStyle='#31564b';for(let i=0;i<1920;i+=110){x.beginPath();x.moveTo(i,0);x.lineTo(i-100,850);x.lineTo(i+190,850);x.fill();}return c.toDataURL();})()`);
  await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:{dataUrl:${JSON.stringify(wallpaper)},name:'Local mixed-brightness landscape fixture'}})`);
  await until(page,'document.querySelector("#bc-theme-wallpaper")?.dataset.bcCustom === "true"');
  await settle(page);
  if(screenshots) {
    await mkdir(screenshots,{recursive:true});
    await writeFile(join(screenshots,`homescreen-${mode||'after'}.png`),await page.screenshot());
    await writeFile(join(screenshots,`homescreen-${mode||'after'}-metrics.json`),JSON.stringify(await measure(page),null,2));
  }
  if(mode==='before'){await page.close();return;}
  if(screenshots) {
    const previous=await readFile(join(screenshots,'homescreen-before-metrics.json'),'utf8').catch(e=>{if(e.code!=='ENOENT')throw e;});
    if(previous)compare(JSON.parse(previous),await measure(page),'reported homescreen keeps pre-fix geometry');
  }
  assert.equal(await css('#cat-channelTech','borderTopColor'),'rgba(0, 0, 0, 0)','native category specificity cannot restore boxed tabs');
  assert.equal(await css('#cat-channelTech','borderTopWidth'),'1px','native border width is retained');
  assert.equal(await css('#cat-channelTech','boxShadow'),'none');
  assert.equal(await css('.bili-header__channel','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('.bili-header__channel','boxShadow'),'none');
  await until(page,'document.querySelector("[data-bc-surface-kind=categories]") !== null');
  assert.equal(await page.evaluate(`(()=>{
    const outer=document.querySelector('.bili-header__channel').getBoundingClientRect();
    const paint=document.querySelector('[data-bc-surface-kind=categories]').getBoundingClientRect();
    const groups=[...document.querySelectorAll('.channel-icons,.channel-items__left,.channel-items__right')].map(n=>n.getBoundingClientRect());
    return paint.left>outer.left && paint.top>outer.top && paint.right<outer.right && paint.bottom<outer.bottom &&
      groups.every(r=>r.left>=paint.left-.1 && r.right<=paint.right+.1 && r.top>=paint.top-.1 && r.bottom<=paint.bottom+.1);
  })()`),true,'category frost contains the real navigation groups and excludes native outer padding');
  assert.notEqual(await css('#normal','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#normal .bili-video-card__info','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#normal .bili-video-card__info','boxShadow'),'none');
  for(const selector of ['#normal img','#normal picture','#normal']) {
    assert.equal(await css(selector,'filter'),'none');assert.equal(await css(selector,'backdropFilter'),'none');
  }
  assert.notEqual(await css('#nav-searchform','backgroundColor'),'rgba(0, 0, 0, 0)');
  for(const selector of ['.center-search__bar','.nav-search-content','#search'])assert.equal(await css(selector,'backgroundColor'),'rgba(0, 0, 0, 0)',selector+' does not add a second search backing');
  await page.evaluate('document.querySelector("#search").focus()');
  assert.equal(await css('#nav-searchform','outlineStyle'),'solid');
  assert.equal(await css('#search','outlineStyle'),'none','single focus ring on the shell');
  await page.type('home test');
  assert.equal(await page.evaluate('document.querySelector("#search").value'),'home test');
  await page.evaluate('document.querySelector("form").requestSubmit();document.querySelector("#avatar").click();document.querySelector("#more").click()');
  assert.equal(await page.evaluate('actions.search'),1);
  assert.notEqual(await css('.v-popover-content','display'),'none');
  assert.equal(await page.evaluate('document.querySelector(".more-menu").hidden'),false);
  assert.match(await css('.carousel-footer','backgroundColor'),/^rgba\(/,'native solid purple footer is replaced by the shared tint');
  await page.evaluate('document.querySelector("#avatar").click();document.querySelector(".more-menu").hidden=true;document.querySelector(".nav-search-panel").classList.remove("open");document.querySelector("#search").blur()');
  // Additional appearance assertions are exercised after the native geometry
  // comparison, independently of the before/after screenshot's theme state.
  await runParity({page,patch,artifacts:screenshots,label:'homescreen',navKeys:await page.evaluate('BiliTheme.NAV_ITEMS.map(n=>n.key)')});
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await page.close();
  console.log('  PASS domestic homescreen: inset category material, specificity-safe text tabs, unified cards/sharp media, single search shell/focus, native menus, carousel tint and responsive parity');
}
