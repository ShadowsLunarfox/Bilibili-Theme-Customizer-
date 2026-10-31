import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { minimalistFixture } from "./minimalist.mjs";
import { measureNativeLayout as measure,compare,settle,runParity } from "./layout-parity.mjs";

export function liquidFixture(BC) {
  // Native dark-mode backing layers and a nested search field reproduce the
  // solid panels in the reported homepage without depending on a live account.
  const landscape = (hue) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560"><defs><linearGradient id="s" x2="1" y2="1"><stop stop-color="hsl(${hue},45%,58%)"/><stop offset="1" stop-color="#e9bfab"/></linearGradient></defs><path fill="url(#s)" d="M0 0H1000V560H0Z"/><circle cx="760" cy="140" r="65" fill="#ffedd4"/><path d="M0 420 180 230 370 370 580 190 800 390 1000 260V560H0Z" fill="hsl(${hue},28%,38%)"/><path d="M0 460Q300 330 550 470T1000 420V560H0Z" fill="hsl(${hue},32%,25%)"/></svg>`);
  let cover = 0;
  return minimalistFixture(BC).replace(/src="data:image\/svg\+xml,[^"]*"/g,
    () => `src="${landscape([210, 265, 160, 25, 195][cover++ % 5])}"`).replace("</style>", `
    .bili-header__banner { background:center/cover url('${landscape(155)}') }
    .recommended-container_floor-aside>.container,.feed2>.container { grid-template-columns:repeat(5,minmax(0,1fr)); gap:24px 18px }
    .bili-video-card__info--tit { font-size:14px; line-height:22px; height:66px }
    .recommended-swipe { height:auto; align-self:stretch; background:center/cover url('${landscape(245)}'); display:flex; align-items:end }
    .bili-header__bar { background:linear-gradient(#263819,#101710) }
    .bili-header__channel { background:#07090c }
    .bili-video-card__wrap { background:#050709 }
    .nav-search-content { flex:1; background:#000; border-radius:6px }
    .nav-search-form { background:#ddd; border-radius:8px }
    .nav-search-form .nav-search-input { background:#000; color:white }
    .channel-link,.channel-link__more { background:#f6f7f8; color:#ccc }
    .channel-items__right { background:#080b0d }
  </style>`).replace('<input id="search" class="nav-search-input" placeholder="搜索">',
    '<div class="nav-search-content"><input id="search" class="nav-search-input" placeholder="搜索"></div>');
}

export async function runLiquidChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/liquid.html');
  await page.activate();
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  const css=(selector,prop)=>page.evaluate('getComputedStyle(document.querySelector('+JSON.stringify(selector)+'))['+JSON.stringify(prop)+']');
  const patch=async changes=>{
    const r=await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(changes)+'})');
    assert.equal(r.ok,true);
    await until(page,changes.enabled===false?'!document.documentElement.hasAttribute("data-bc-enabled")':
      'document.documentElement.dataset.bcEnabled === "true" && document.documentElement.style.getPropertyValue("--bc-text-color") === '+JSON.stringify(r.data.settings.textColor));
    await settle(page);
  };
  const capture=async name=>{if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}};
  const reset=async()=>{await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await until(page,'document.documentElement.dataset.bcEnabled === "true" && !document.documentElement.hasAttribute("data-bc-minimalist")');await settle(page);};
  await reset();await patch({enabled:false});
  const original=await measure(page);
  const images=await page.evaluate('[...document.images].map(i=>i.src)');
  const backing=await css('#normal > .bili-video-card__wrap','backgroundColor');
  await capture('frosted-native');await patch({enabled:true});
  compare(original,await measure(page),'frosted homepage outer geometry',{cardStretch:true});
  await until(page,'document.querySelector(".bc-theme-surface-glass[data-bc-level=content]") !== null');
  await until(page,'document.querySelector("[data-bc-surface-kind=video-info]") !== null');
  for(const selector of ['.bili-header__bar','[data-bc-surface-kind=video-info]','.nav-search-form'])assert.notEqual(await css(selector,'backgroundColor'),'rgba(0, 0, 0, 0)',selector+' has tinted glass');
  await until(page,'document.querySelector("[data-bc-surface-kind=categories]") !== null');
  assert.notEqual(await css('[data-bc-surface-kind=categories]','backgroundColor'),'rgba(0, 0, 0, 0)');
  for(const selector of ['#normal img','#normal .bili-video-card__info','.bili-header__bar','.bili-header__channel'])assert.equal(await css(selector,'backdropFilter'),'none','no native containing-block change: '+selector);
  assert.equal(await css('#normal img','filter'),'none');
  assert.deepEqual(await page.evaluate('[...document.images].map(i=>i.src)'),images);
  assert.match(await css('#bc-theme-header-glass','backdropFilter'),/blur\(12px\)/);
  assert.match(await css('[data-bc-surface-kind=video-info]','backdropFilter'),/blur\(14px\)/);
  assert.equal(await css('#normal .bili-video-card__info','borderTopWidth'),'0px','painted rim preserves native border width');
  assert.equal(await css('#cat-channelTech','borderTopWidth'),'1px');
  await page.evaluate('document.querySelector("#avatar").click();document.querySelector("#search").dispatchEvent(new Event("input"))');
  await until(page,'document.querySelectorAll(".bc-theme-popover-glass").length===2');
  assert.match(await css('.bc-theme-popover-glass','backdropFilter'),/blur\(20px\)/);
  const alphas=await page.evaluate('(["--bc-glass-bg-light","--bc-glass-bg-content","--bc-glass-bg-strong"]).map(k=>Number(document.documentElement.style.getPropertyValue(k).match(/[\\d.]+/g)[3]))');
  assert.ok(alphas[0]<alphas[1]&&alphas[1]<alphas[2],'three distinct tint strengths');
  assert.notEqual(await css('.v-popover-content','backgroundColor'),'rgba(0, 0, 0, 0)');
  await capture('frosted-home-menus');
  await page.evaluate('document.querySelector("#avatar").click();document.querySelector(".nav-search-panel").classList.remove("open")');
  let darkAlpha;
  for(const [name,color] of [['dark','#121b25'],['bright','#f7f8fc']]) {
    const image=await page.evaluate('(()=>{const c=document.createElement("canvas");c.width=1600;c.height=1000;const x=c.getContext("2d");x.fillStyle='+JSON.stringify(color)+';x.fillRect(0,0,1600,1000);x.globalAlpha=.15;x.fillStyle="'+(name==='bright'?'#7d9bc2':'#7ed6ca')+'";for(let i=0;i<1600;i+=70)x.fillRect(i,0,20,1000);return c.toDataURL();})()');
    await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/BACKGROUND",payload:{dataUrl:'+JSON.stringify(image)+',name:'+JSON.stringify(name)+'}})');
    await until(page,'document.querySelector("#bc-theme-wallpaper")?.dataset.bcCustom === "true"');
    await until(page,name==='bright'?'Number(document.documentElement.style.getPropertyValue("--bc-glass-bg-content").match(/[\\d.]+/g)[3]) > .6':'document.documentElement.style.getPropertyValue("--bc-glass-bg-content").includes("0.46")');
    const alpha=Number((await css('[data-bc-surface-kind=video-info]','backgroundColor')).match(/[\d.]+/g)[3]);
    if(name==='dark')darkAlpha=alpha;else assert.ok(alpha>darkAlpha,'bright wallpaper strengthens panels');
    assert.equal(await css('#normal h3 a','color'),'rgb(255, 255, 255)','white foreground stays stable; tint adapts first');
    assert.equal(await page.evaluate('document.documentElement.style.getPropertyValue("--bc-wallpaper-veil")'),'0');
    compare(original,await measure(page),'wallpaper tint preserves geometry',{cardStretch:true});
    await capture('frosted-home-'+name);
  }
  const frosted=await page.screenshot();
  await page.evaluate('[...document.querySelectorAll(".bc-theme-surface-glass")].forEach(n=>n.style.backdropFilter="none")');
  await settle(page);
  const tintOnly=await page.screenshot();
  await page.evaluate('[...document.querySelectorAll(".bc-theme-surface-glass")].forEach(n=>n.style.removeProperty("backdrop-filter"))');
  await settle(page);
  const blurDifference=await page.evaluate(`(async()=>{
    const read=async data=>{const i=new Image();i.src='data:image/png;base64,'+data;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);return x;};
    const a=await read(${JSON.stringify(frosted.toString('base64'))}),b=await read(${JSON.stringify(tintOnly.toString('base64'))});
    const r=document.querySelector('[data-bc-surface-kind=categories]').getBoundingClientRect();
    const x=Math.round(r.x+r.width/4),y=Math.round(r.bottom-10),w=Math.round(r.width/2);
    const p=a.getImageData(x,y,w,2).data,q=b.getImageData(x,y,w,2).data;let sum=0;
    for(let i=0;i<p.length;i++)if(i%4!==3)sum+=Math.abs(p[i]-q[i]);return sum/(w*2*3);
  })()`);
  assert.ok(blurDifference>.1,'background texture is visibly blurred beneath the category tint');
  await patch({enabled:false});
  await page.evaluate('document.querySelector(".bili-header__channel").style.backdropFilter="blur(3px)"');
  const nativeFrost=await measure(page);
  await patch({enabled:true});
  await until(page,`(()=>{
    const n=document.querySelector('[data-bc-surface-kind=categories]');
    return n && getComputedStyle(n).backdropFilter==='none';
  })()`);
  compare(nativeFrost,await measure(page),'pre-existing native backdrop containing block retained',{cardStretch:true});
  assert.equal(await css('.bili-header__channel','backdropFilter'),'blur(3px)');
  await page.evaluate('document.querySelector(".bili-header__channel").style.removeProperty("backdrop-filter")');
  await page.evaluate(`(()=>{
    const s=document.createElement('style');s.id='hover-fixture-style';
    s.textContent='#hover-fixture{position:fixed;right:30px;bottom:30px;z-index:2000}#hover-popup{position:absolute;bottom:100%;right:0;width:180px;height:50px;opacity:0;transition:opacity .1s}#hover-fixture:hover #hover-popup{opacity:1}';
    document.head.append(s);
    const n=document.createElement('div');n.id='hover-fixture';n.innerHTML='<button>Hover menu</button><div id="hover-popup" class="van-popover">CSS-only popup</div>';document.body.append(n);
  })()`);
  const point=await page.evaluate('(()=>{const r=document.querySelector("#hover-fixture button").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point},page.sessionId);
  await until(page,`(()=>{const r=document.querySelector('#hover-popup').getBoundingClientRect();return [...document.querySelectorAll('.bc-theme-surface-glass[data-bc-level=strong]')].some(n=>Math.abs(n.getBoundingClientRect().top-r.top)<1 && getComputedStyle(n).backdropFilter.includes('20px'));})()`);
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0},page.sessionId);
  await until(page,'getComputedStyle(document.querySelector("#hover-popup")).opacity === "0"');
  await page.evaluate('document.querySelector("#hover-fixture").remove();document.querySelector("#hover-fixture-style").remove()');
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-reduced-transparency',value:'reduce'}]},page.sessionId);
  await settle(page);
  assert.equal(await css('#bc-theme-header-glass','backdropFilter'),'none');
  assert.match(await css('[data-bc-surface-kind=video-info]','backgroundColor'),/0\.94/);
  assert.equal(await css('[data-bc-surface-kind=video-info]','backdropFilter'),'none');
  assert.equal(await css('#cat-channelTech','transitionDuration'),'0s');
  await cdp.send('Emulation.setEmulatedMedia',{features:[]},page.sessionId);
  await page.evaluate('(()=>{const s=document.querySelector("style[data-bc-owned=style]");globalThis.originalFrostCSS=s.textContent;s.textContent=s.textContent.replace("@supports not (backdrop-filter: blur(1px))","@supports (display: block)");})()');
  await settle(page);
  assert.match(await css('[data-bc-surface-kind=video-info]','backgroundColor'),/0\.94/);
  assert.equal(await css('[data-bc-surface-kind=video-info]','backdropFilter'),'none');
  assert.equal(await css('#bc-theme-header-glass','backdropFilter'),'none');
  await page.evaluate('document.querySelector("style[data-bc-owned=style]").textContent=originalFrostCSS');
  await patch({material:'clear'});
  assert.equal(await css('#normal .bili-video-card__info','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await page.evaluate('document.querySelectorAll(".bc-theme-surface-glass").length'),0);
  await patch({enabled:false});assert.equal(await css('#normal > .bili-video-card__wrap','backgroundColor'),backing);
  await reset();
  for(const name of ['search','video','space','dynamic']) {
    await page.navigate(base+'/matrix/'+name);
    await until(page,'document.documentElement.dataset.bcPage === '+JSON.stringify(name));
    await until(page,'document.querySelector(".bc-theme-surface-glass[data-bc-level=content]") !== null');
    assert.notEqual(await css('#readable-card','backgroundColor'),'rgba(0, 0, 0, 0)',name+' content is frosted');
    assert.equal(await css('#readable-card','backdropFilter'),'none');
    assert.notEqual(await css('bili-comments','backgroundColor'),'rgba(0, 0, 0, 0)',name+' comments are frosted');
    assert.equal(await css('#thumbnail','filter'),'none');
    if(name==='video'){
      assert.notEqual(await css('.right-container','backgroundColor'),'rgba(0, 0, 0, 0)');
      assert.equal(await css('.bpx-player-container','backgroundColor'),'rgb(0, 0, 0)');
      assert.equal(await css('#player-control','color'),'rgb(255, 128, 0)');
    }
    if(name==='space')assert.notEqual(await css('.home-aside-section','backgroundColor'),'rgba(0, 0, 0, 0)');
    const shadow=await page.evaluate('(()=>{const s=document.querySelector("bili-comments").shadowRoot;const t=s.querySelector("textarea");t.focus();t.value="frosted reply";return {bg:getComputedStyle(t).backgroundColor,value:t.value,focus:s.activeElement===t};})()');
    assert.notEqual(shadow.bg,'rgba(0, 0, 0, 0)');assert.equal(shadow.focus,true);
    await page.evaluate('document.querySelector("#search").focus();document.querySelector("#menu-toggle").click()');
    await page.type('frosted search');
    assert.equal(await page.evaluate('document.querySelector("#search").value'),'frosted search');
    await capture('frosted-'+name);
    await runParity({page,patch,artifacts:screenshots,label:name,continuous:false});
    await reset();
  }
  await page.close();
  console.log('  PASS frosted glass: three tint/blur levels, adaptive opacity, input/comment/sidebar readability, sharp media, native geometry on four page types, reduced preferences, fallback and Clear');
}
