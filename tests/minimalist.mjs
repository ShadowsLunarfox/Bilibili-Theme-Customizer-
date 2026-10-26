import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runParity } from './layout-parity.mjs';

const cover = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23314b63'/%3E%3Ccircle cx='240' cy='60' r='35' fill='%2363d5ff'/%3E%3C/svg%3E";
const card = (id, badge = '', extra = '') => `<article id="${id}" class="bili-video-card" ${extra}><div class="bili-video-card__wrap">
  <a class="bili-video-card__image--wrap" href="/video/BV-${id}"><picture><img src="${cover}" alt="Video thumbnail"></picture>
    <div class="bili-video-card__stats"><span>1.2万播放</span><span>08:24</span></div><div class="preview-overlay" hidden>Native preview</div></a>
  <div class="bili-video-card__info"><h3 class="bili-video-card__info--tit"><a href="/video/BV-${id}">广告设计与科技：这是普通视频标题，不是广告判据 / A long normal video title</a></h3>
    <a class="bili-video-card__info--author" href="/space/123">商业摄影 UP</a><span class="bili-video-card__info--date"> · 昨天</span>${badge}</div></div></article>`;

export function minimalistFixture(BC) {
  const categories = BC.MINIMALIST_CATEGORIES.map(entry => entry.key === 'channelMore'
    ? '<div class="channel-link__more" id="more" tabindex="0">更多<div class="more-menu" hidden><a href="/c/food/">Food</a></div></div>'
    : `<a class="channel-link" id="cat-${entry.key}" href="${/href\*="([^"]+)"/.exec(entry.selector)[1]}">${entry.zh}</a>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;font:14px/1.5 Arial;background:#f5f6f7;color:#18191c}a{color:inherit;text-decoration:none}
    .bili-header{height:auto}.bili-header__banner{height:160px;background:#405781}.bili-header__bar{position:absolute;top:0;width:100%;height:64px;display:flex;align-items:center;justify-content:space-between;z-index:1002;padding:0 24px;background:#eee}
    .left-entry-main,.right-entry{display:flex;list-style:none;gap:12px;padding:0}.center-search-container{position:relative;flex:1;max-width:400px}.nav-search-form{display:flex;padding:6px}.nav-search-input{width:100%;background:transparent;border:0}.nav-search-panel,.v-popover-content{position:absolute;top:100%;display:none;padding:20px;min-width:180px;background:white}.right-entry li{position:relative}.nav-search-panel.open,.v-popover-content.open{display:block}
    .bili-header__channel{display:flex;padding:20px 24px;gap:12px}.channel-items__left{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;flex:1}.channel-link,.channel-link__more{position:relative;background:white;text-align:center;border:1px solid #ddd}.more-menu{position:absolute;background:var(--bc-popup-bg);z-index:1003;min-width:100px}
    .bili-feed4{padding:24px}.recommended-container_floor-aside>.container,.feed2>.container{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}.feed2{margin-top:30px}.bili-video-card{min-width:0}.bili-video-card__image--wrap{position:relative;display:block;padding-top:56.25%}.bili-video-card__image--wrap picture{position:absolute;inset:0}.bili-video-card__image--wrap img{width:100%;height:100%}.bili-video-card__stats{position:absolute;bottom:4px;color:white;left:6px;right:6px;display:flex;justify-content:space-between}.bili-video-card__info{background:white;padding:12px}.bili-video-card__info--tit{font-size:18px;line-height:24px;height:72px;margin:0}.recommended-swipe{grid-column:span 2;grid-row:span 2;height:260px;background:#42617a;color:white;border-radius:10px;padding:20px}.preview-overlay{position:absolute;inset:0;background:#244e68;color:white}.palette-button-wrap{position:fixed;right:0;bottom:0}.bili-feed-ad{height:120px;background:#fae}.recommended-container__title-decoration{height:20px}main{min-height:1500px}
  </style><script src="/bridge.js"></script><script src="/settings.js" defer></script><script src="/theme.js" defer></script><script src="/minimalist.js" defer></script><script src="/content.js" defer></script></head><body>
  <header class="bili-header"><div class="bili-header__banner">活动横幅</div><nav class="bili-header__bar">
    <ul class="left-entry-main"><li class="home-page-entry"><a id="logo" href="/">Bilibili 首页</a></li><li class="left-entry__item"><a href="/anime/">番剧</a></li><li class="left-entry__item"><a href="https://live.bilibili.com">直播</a></li><li class="left-entry__item" id="shop"><a href="https://show.bilibili.com">会员购</a></li></ul>
    <div class="center-search-container"><form class="nav-search-form"><input id="search" class="nav-search-input" placeholder="搜索"><button>⌕</button></form><div class="nav-search-panel">Search suggestions</div></div>
    <ul class="right-entry"><li><button id="avatar">头像</button><div class="v-popover-content">Account menu</div></li>${['消息','动态','收藏','历史','投稿'].map((name,i)=>`<li><a id="right-${i}" href="#right-${i}">${name}</a></li>`).join('')}</ul></nav>
    <div class="bili-header__channel"><div class="channel-icons"><a href="/v/popular/all">热门</a></div><div class="channel-items__left">${categories}</div><div class="channel-items__right">活动</div></div></header>
  <main class="bili-feed4"><div class="recommended-container_floor-aside"><div class="container" id="first-grid">
    <div class="recommended-swipe" id="carousel">Native featured carousel <a href="/video/BV-feature">▶</a></div>
    ${card('normal')}${card('ad', '<span class="bili-video-card__info--ad">广告</span>')}
    <div class="feed-card" id="ad-wrapper">${card('wrapped-ad','<span class="bili-video-card__info--creative-ad">推广</span>')}</div>
    <div class="feed-card" id="nested-ad-wrapper"><div class="bili-feed-card">${card('nested-ad','<span class="bili-video-card__info--ad">广告</span>')}</div></div>
    <div class="feed-card" id="organic-wrapper">${card('organic','','data-ad-id=""')}</div>
    ${card('analytics','','data-is-ad="false"')}<div class="bili-feed-ad" id="ad-slot">Explicit ad slot</div>
    ${Array.from({length:8},(_,i)=>card(`normal-${i}`)).join('')}
  </div><div class="recommended-container__title-decoration" id="decoration">Decorative heading</div></div>
  <div class="feed2"><div class="container" id="second-grid">${card('second-normal')}${card('second-ad','','data-is-ad="true"')}</div></div>
  <div class="ordinary-content" id="outside-ad"><span class="bili-video-card__info--ad">An unrelated label outside the recommendation feed</span></div></main>
  <div class="palette-button-wrap"><button class="activity-entry" id="tool-promo">活动</button><button id="feedback">反馈</button><button id="top">↑</button></div>
  <script>
    window.actions={links:0,preview:0,search:0};window.originalCards=[...document.querySelectorAll('.bili-video-card')];
    document.querySelectorAll('a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();actions.links++}));
    document.querySelectorAll('.bili-video-card__image--wrap').forEach(a=>a.addEventListener('mouseenter',()=>{a.querySelector('.preview-overlay').hidden=false;actions.preview++}));
    document.querySelector('#search').addEventListener('input',()=>document.querySelector('.nav-search-panel').classList.add('open'));
    document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();actions.search++});
    document.querySelector('#avatar').addEventListener('click',()=>document.querySelector('.v-popover-content').classList.toggle('open'));
    document.querySelector('#more').addEventListener('click',()=>document.querySelector('.more-menu').hidden=false);
    document.querySelector('#top').addEventListener('click',()=>window.scrollTo(0,0));
  </script></body></html>`;
}

export async function runMinimalistChecks({ cdp, base, until, screenshots, mp4 }) {
  const page = await cdp.page(`${base}/minimalist.html`);
  await page.activate();
  await until(page, 'document.documentElement.dataset.bcPage === "home"');
  const css = (selector, prop) => page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)}))[${JSON.stringify(prop)}]`);
  const patch = async changes => {
    const result = await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:${JSON.stringify(changes)}})`);
    assert.equal(result.ok, true);
    // Wait for the content script's asynchronous storage subscription to render.
    const settings = result.data.settings;
    await until(page, settings.enabled || settings.minimalistEnabled
      ? `document.documentElement.getAttribute('data-bc-min-options') === BiliThemeMinimalist.flags(${JSON.stringify(settings)}) && document.documentElement.style.getPropertyValue('--bc-text-color') === '${settings.textColor}'`
      : '!document.documentElement.hasAttribute("data-bc-min-options")');
    await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  };
  await runParity({page,patch,artifacts:screenshots,label:'fixture',navKeys:await page.evaluate('BiliTheme.NAV_ITEMS.map(n=>n.key)')});
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await until(page,'!document.documentElement.hasAttribute("data-bc-minimalist")');
  const baseline = { display: await css('#first-grid','gridTemplateColumns'), gap: await css('#first-grid','gap'), title: await css('#normal h3','fontSize') };
  assert.equal(await page.evaluate('document.documentElement.hasAttribute("data-bc-minimalist")'),false);
  await patch({minimalistEnabled:true});
  await until(page, 'document.documentElement.dataset.bcMinimalist === "true"');
  for (const id of ['ad','ad-wrapper','nested-ad-wrapper','ad-slot','second-ad']) assert.equal(await css(`#${id}`,'display'),'none',id);
  for (const id of ['normal','organic-wrapper','analytics','outside-ad']) assert.notEqual(await css(`#${id}`,'display'),'none',id);
  assert.equal(await css('.bili-header__banner','visibility'),'hidden');
  assert.equal(await css('.bili-header__banner','height'),'160px','hidden artwork retains native header space');
  assert.equal(await page.evaluate('document.querySelector(".bili-header__channel").getBoundingClientRect().bottom <= document.querySelector("#first-grid").getBoundingClientRect().top'),true,'category flow cannot overlap feed');
  assert.notEqual(await css('#carousel','display'),'none');
  assert.equal(await css('.bili-header__bar','height'),'64px');
  assert.equal((await css('#first-grid','gridTemplateColumns')).split(' ').length,3);
  assert.equal((await css('#second-grid','gridTemplateColumns')).split(' ').length,3);
  assert.equal(await page.evaluate('originalCards.every(n=>n.isConnected && document.getElementById(n.id)===n)'),true);

  await patch({minimalistGrid:false,minimalistCompactNav:false,minimalistHideBanner:false});
  await until(page, 'getComputedStyle(document.querySelector(".bili-header__banner")).display !== "none"');
  assert.equal(await css('#first-grid','gridTemplateColumns'),baseline.display);
  assert.equal(await css('.bili-header__bar','height'),'64px');
  assert.equal(await css('#ad','display'),'none','ad hiding remains independently enabled');
  await patch({minimalistGrid:true,minimalistCompactNav:true,minimalistHideBanner:true});

  // New nodes and late attributes/labels are handled by CSS, with no rescans.
  await page.evaluate(`document.querySelector('#first-grid').insertAdjacentHTML('beforeend',${JSON.stringify(card('late'))});
    document.querySelector('#late .bili-video-card__info').insertAdjacentHTML('beforeend','<span class="bili-video-card__info--ad">广告</span>');
    document.querySelector('#analytics').setAttribute('data-is-ad','true');`);
  assert.equal(await css('#late','display'),'none');
  assert.equal(await css('#analytics','display'),'none');
  await page.evaluate(`document.querySelector('#late .bili-video-card__info--ad').remove();document.querySelector('#analytics').setAttribute('data-is-ad','false')`);
  assert.notEqual(await css('#late','display'),'none');
  assert.notEqual(await css('#analytics','display'),'none');
  await patch({minimalistHideAds:false});
  await until(page, 'getComputedStyle(document.querySelector("#ad-wrapper")).display !== "none"');
  await patch({minimalistHideAds:true,minimalistHideCarousel:true,minimalistHideDecorations:true,minimalistToolbar:true,minimalistCompactCategories:true});
  await until(page, 'getComputedStyle(document.querySelector("#carousel")).display === "none"');
  assert.equal(await css('#decoration','display'),'none');
  assert.equal(await css('#tool-promo','display'),'none');
  assert.notEqual(await css('#feedback','display'),'none');
  assert.equal(await css('#cat-channelFood','display'),'none');
  assert.notEqual(await css('#cat-channelGames','display'),'none');
  await patch({minimalistCategory_channelFood:true,channelGames:true});
  await until(page, 'getComputedStyle(document.querySelector("#cat-channelFood")).display !== "none"');
  assert.equal(await css('#cat-channelGames','display'),'none','existing navigation hide wins');
  await page.evaluate('document.querySelector("#more").click()');
  assert.equal(await page.evaluate('document.querySelector(".more-menu").hidden'),false);
  assert.notEqual(await css('.more-menu a','display'),'none');

  await page.evaluate(`document.querySelector('#logo').click();document.querySelector('#normal h3 a').click();
    document.querySelector('#search').value='test';document.querySelector('#search').dispatchEvent(new Event('input'));
    document.querySelector('form').requestSubmit();document.querySelector('#avatar').click();
    document.querySelector('#normal .bili-video-card__image--wrap').dispatchEvent(new Event('mouseenter'));`);
  assert.deepEqual(await page.evaluate('actions'),{links:2,search:1,preview:1});
  assert.notEqual(await css('.nav-search-panel','display'),'none');
  assert.notEqual(await css('.v-popover-content','display'),'none');
  assert.equal(await page.evaluate('document.querySelector("#normal .preview-overlay").hidden'),false);
  await page.evaluate(`window.scrollTo(0,400)`);
  assert.equal(await page.evaluate('document.querySelector(".bili-header__bar").getBoundingClientRect().top'),-400);
  await page.evaluate('document.querySelector("#top").click()');

  // With ads and carousel removed, every visible slot packs consecutively.
  assert.equal(await page.evaluate(`(()=>{const nodes=[...document.querySelector('#first-grid').children].filter(n=>getComputedStyle(n).display!=='none');
    const a=nodes[0].getBoundingClientRect(),b=nodes[1].getBoundingClientRect();return a.top===b.top && Math.abs(b.left-a.right-30)<1})()`),true);
  for (const [width,columns] of [[1800,3],[1300,3],[950,3]]) {
    await page.resize(width,1000);
    assert.equal((await css('#first-grid','gridTemplateColumns')).split(' ').length,columns,`width ${width}`);
    const ratio = await page.evaluate(`(()=>{const r=document.querySelector('#normal .bili-video-card__image--wrap').getBoundingClientRect();return r.width/r.height})()`);
    assert.ok(Math.abs(ratio-16/9)<0.01,`16:9 at ${width}`);

  }
  await page.resize(1440,1000);
  for (const material of ['glass','clear']) for (const color of ['#ffffff','#111111','#777777','#ff0000']) {
    await patch({material,textColor:color,opacity:0,blur:0});
    assert.equal(await page.evaluate('document.documentElement.dataset.bcMinimalist'), 'true');
    assert.equal(await css('#normal h3','color'), `rgb(${[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(', ')})`);
  }
  await patch({textColor:'#ffffff',material:'glass',opacity:58,blur:14});
  const png = await page.evaluate(`(()=>{const c=document.createElement('canvas');c.width=32;c.height=18;c.getContext('2d').fillRect(0,0,32,18);return c.toDataURL('image/png')})()`);
  const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  for (const dataUrl of [png,gif,mp4]) {
    const result = await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:{dataUrl:${JSON.stringify(dataUrl)},name:'minimalist background'}})`);
    assert.equal(result.ok,true);
    const isVideo = dataUrl === mp4;
    await until(page, `document.querySelector('#bc-theme-wallpaper')?.dataset.bcVideo === '${isVideo}'`);
    assert.equal(await page.evaluate('document.documentElement.dataset.bcMinimalist'),'true');
    assert.equal(await css('#ad','display'),'none');
  }
  const video = 'testShadows["bc-theme-wallpaper"].querySelector("video")';
  await until(page, `${video}.readyState >= 2 && !${video}.paused`);
  const source = await page.evaluate(`${video}.src`);
  await patch({minimalistEnabled:false});
  assert.equal(await page.evaluate(`${video}.src`),source,'turning minimalist off preserves the wallpaper video');
  await patch({minimalistEnabled:true});
  assert.equal(await page.evaluate(`${video}.src`),source);
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:null})");
  await until(page,'document.querySelector("#bc-theme-wallpaper")?.dataset.bcVideo === "false"');
  if (screenshots) {
    await page.evaluate(`document.querySelector('.nav-search-panel').classList.remove('open');
      document.querySelector('.v-popover-content').classList.remove('open');document.querySelector('.more-menu').hidden=true;
      document.querySelector('#normal .preview-overlay').hidden=true;document.querySelector('#search').value='';`);
    await mkdir(screenshots,{recursive:true});
    await writeFile(join(screenshots,'minimalist-desktop.png'),await page.screenshot());
    await page.resize(650,1000);
    await writeFile(join(screenshots,'minimalist-narrow.png'),await page.screenshot());
    await page.resize(1440,1000);
  }
  await page.reload();
  await until(page, 'document.documentElement.dataset.bcMinimalist === "true"');
  assert.equal(await css('#ad','display'),'none');
  assert.equal(await css('#cat-channelGames','display'),'none');
  await patch({enabled:false});
  await until(page, '!document.querySelector("#bc-theme-wallpaper")');
  assert.equal(await css('#ad','display'),'none','minimalist works without wallpaper theme');
  await patch({enabled:true,minimalistEnabled:false,channelGames:false});
  await until(page, '!document.documentElement.hasAttribute("data-bc-minimalist")');
  assert.deepEqual({display:await css('#first-grid','gridTemplateColumns'),gap:await css('#first-grid','gap'),title:await css('#normal h3','fontSize')},baseline);
  assert.notEqual(await css('#ad','display'),'none');
  assert.notEqual(await css('.bili-header__banner','display'),'none');
  assert.notEqual(await css('#carousel','display'),'none');
  assert.equal(await page.evaluate('originalCards.every(n=>n.isConnected)'),true);
  await patch({minimalistEnabled:true});
  await page.evaluate("history.pushState({},'', '/video/BV-test')");
  await until(page, 'document.documentElement.dataset.bcPage === "video" && !document.documentElement.hasAttribute("data-bc-minimalist")');
  assert.notEqual(await css('#ad','display'),'none','stale home DOM receives no minimalist rules on a video route');
  await page.evaluate('history.back()');
  await until(page,'document.documentElement.dataset.bcMinimalist === "true"');
  for (const name of ['dynamic','video','space','search','bangumi','opus','article','live']) {
    await page.navigate(`${base}/matrix/${name}`);
    await until(page,`document.documentElement.dataset.bcPage === '${name}'`);
    assert.equal(await page.evaluate('document.documentElement.hasAttribute("data-bc-minimalist")'),false,name);
  }
  await patch({enabled:false,minimalistEnabled:false});
  await until(page, 'document.querySelectorAll("[data-bc-owned]").length === 0');
  assert.equal(await page.evaluate('document.documentElement.hasAttribute("data-bc-page")'),false);
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await page.close();
  console.log('  PASS minimalist: conservative/late ads, native grid and native positioning, original links/search/menus/preview, category priority, independent options, theme colors, persistence, restore and SPA/page isolation');
}
