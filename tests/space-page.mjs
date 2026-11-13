import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle,assertVisualOnlyCSS} from './layout-parity.mjs';

// Representative profile structure reproducing the reported unpadded sections,
// pale neutral controls and double-painted search. No account or network assets.
export function spacePageFixture(){
  const cover='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><path fill="#91b7bd" d="M0 0H640V360H0Z"/><path fill="#315e56" d="M0 300 180 90 340 240 470 100 640 300V360H0Z"/></svg>');
  return `<!doctype html><html><meta charset="utf-8"><style>
    :root{--bg1:#fff;--text1:#18191c;--text2:#61666d;--v_bg1:#fff;--v_text1:#18191c;--brand_blue:#00aeec}
    *{box-sizing:border-box}body{margin:0;min-width:1000px;min-height:1600px;font:14px/1.5 Arial;background:#eee;color:var(--text1)}
    a{color:inherit;text-decoration:none}button,input{font:inherit}button{cursor:pointer}
    .bili-header__bar{position:relative;z-index:1002;height:64px;display:flex;align-items:center;gap:24px;padding:0 28px;background:#fff}
    .center-search__bar{width:440px;margin:auto;background:#eee}.nav-search-form{display:flex;align-items:center;padding:8px;background:#eee;border:1px solid #ccc;border-radius:8px}
    .nav-search-content{flex:1;background:#ddd}.nav-search-input{width:100%;background:#aaa;border:0;outline:0}.nav-search-form button{background:transparent;border:0}
    .space-header{position:relative;height:220px;background:linear-gradient(120deg,#515a8f,#32304b);color:white}.upinfo{position:absolute;bottom:0;left:0;right:0;height:72px;padding:0 max(30px,8vw);display:flex;align-items:center;justify-content:space-between;background:transparent}
    .header-upinfo{display:flex;align-items:center;gap:20px;transform:translateY(-12px)}.header-avatar-wrap{position:relative;width:68px;height:68px;flex:none}.header-avatar-wrap img{display:block;width:100%;height:100%;border-radius:50%;border:2px solid white}.header-avatar-wrap .status-badge{position:absolute;right:-3px;bottom:0;border-radius:50%;background:#fb7299;color:white;padding:0 5px;border:2px solid white}
    .upinfo h1{margin:0;font-size:22px}.upinfo p{margin:4px 0 0}.operations{display:flex;align-items:center;gap:10px}.operations button{border:0;padding:8px 18px;background:#00aeec;color:#fff}.operations .vui_button:not(.vui_button--blue){background:linear-gradient(120deg,#555176,#464b66);color:white}.operations .more{padding-inline:12px}
    .space-navbar{padding:18px 8vw;background:#fff;display:flex;gap:30px}.space-navbar a.active{color:#00aeec}
    .space-main{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:32px;max-width:1500px;margin:30px auto;padding:0 24px;align-items:start}
    .section-wrap{margin-bottom:24px;background:var(--bg1)}.section-wrap__header{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}.section-wrap__title{font-size:22px;margin:0}
    .radio-filter{display:flex;gap:8px}.radio-filter__item,.vui_button{padding:6px 14px;border:1px solid #e3e5e7;border-radius:6px;color:var(--text1);background:#fff}
    .radio-filter__item.active,.vui_button.vui_button--blue{background:#00aeec;color:white}.radio-filter__item:disabled{opacity:.4;cursor:default}.vui_button{color:var(--v_text1);background:var(--v_bg1);margin-left:auto}
    .top-video{display:flex;gap:16px;padding-bottom:20px}.top-video__cover{width:32%;flex:none;align-self:start}.top-video img,.items img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px}
    .top-video__info{min-width:0}.top-video__title{font-size:20px;margin:0 0 12px;display:block}.top-video__desc,.top-video__meta{color:var(--text2)}
    .items{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}.items h3{font-size:14px;margin:8px 0}.items p{margin:4px 0;color:var(--text2)}
    .home-aside-section{padding:16px;margin-bottom:16px;background:white}.home-aside-section h2{font-size:18px;margin:0 0 12px}.home-aside-section p{margin:0}
    @media(max-width:1280px){.items{grid-template-columns:repeat(3,minmax(0,1fr))}}
  </style><script src="/bridge.js"></script><script src="/settings.js" defer></script><script src="/theme.js" defer></script><script src="/minimalist.js" defer></script><script src="/content.js" defer></script>
  <header class="bili-header__bar"><a href="#home">bilibili 首页</a><div class="center-search__bar"><form id="nav-searchform" class="nav-search-form"><div class="nav-search-content"><input id="search" class="nav-search-input" value="maimai"></div><button type="button">⌕</button></form></div><button>投稿</button></header>
  <div class="space-header"><div class="upinfo"><div class="header-upinfo"><a class="header-avatar-wrap" href="#profile"><img id="profile-avatar" src="${cover}" alt="Profile avatar"><span class="status-badge">大</span></a><div><h1>科技频道</h1><p>探索科技生活的未来</p></div></div><div class="operations"><button id="follow" class="vui_button vui_button--blue">关注</button><button class="vui_button" id="message">发消息</button><button class="vui_button more">⋮</button></div></div></div>
  <nav class="space-navbar"><a href="#home" class="active">主页</a><a href="#dynamic">动态</a><a href="#upload">投稿 999+</a><span>粉丝数 85.4万</span></nav>
  <main class="space-main"><div class="space-main__left"><section class="section-wrap" id="featured"><div class="section-wrap__content"><div class="top-video"><a href="#featured-video" class="top-video__cover"><img src="${cover}" alt="Featured cover"></a><div class="top-video__info"><a href="#featured-video" class="top-video__title">电脑和手机背后的故事</a><div class="top-video__meta">315.6万播放 · 1万评论</div><p class="top-video__desc">记录新鲜、有趣的科技故事，与你分享每一次发现。</p></div></div></div></section>
    <section class="section-wrap" id="videos"><div class="section-wrap__header"><h2 class="section-wrap__title">视频 · 619</h2><div class="radio-filter"><button id="latest" class="radio-filter__item active" aria-selected="true">最新发布</button><button id="popular" class="radio-filter__item" aria-selected="false">最多播放</button><button class="radio-filter__item" disabled>最多收藏</button></div><button id="more" class="vui_button">查看更多 ›</button><button id="primary-action" class="vui_button vui_button--blue">投稿</button></div>
    <div class="section-wrap__content items">${Array.from({length:10},(_,i)=>`<article><a href="#video-${i}"><img src="${cover}" alt="Video ${i}"><h3>科技生活与新鲜发现 · 第 ${i+1} 期</h3></a><p>11月8日</p></article>`).join('')}</div></section></div>
    <aside><section class="home-aside-section"><h2>直播间</h2><p>主播不在，开播时会在动态通知你哦～</p></section><section class="home-aside-section"><h2>公告</h2><p>常来玩呀～</p></section></aside></main>
  <script>window.spaceClicks=0;document.querySelector('#more').onclick=()=>spaceClicks++;document.querySelector('form').onsubmit=e=>e.preventDefault();document.querySelectorAll('.radio-filter__item:not(:disabled)').forEach(n=>n.onclick=()=>{document.querySelectorAll('.radio-filter__item').forEach(b=>{b.classList.toggle('active',b===n);b.setAttribute('aria-selected',b===n)});});</script></html>`;
}

export async function runSpacePageChecks({cdp,base,until,screenshots}){
  const page=await cdp.page(base+'/space-page.html');await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "space"');
  const patch=async payload=>{assert.equal((await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})')).ok,true);await settle(page);await settle(page);};
  const css=(s,p)=>page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(s)}))[${JSON.stringify(p)}]`);
  const geometry=()=>page.evaluate(`(()=>{const box=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};return {columns:getComputedStyle(document.querySelector('.space-main')).gridTemplateColumns,gap:getComputedStyle(document.querySelector('.space-main')).gap,aside:box(document.querySelector('aside')),sections:[...document.querySelectorAll('.section-wrap')].map(n=>n.getBoundingClientRect().width),overflow:document.documentElement.scrollWidth,tracks:getComputedStyle(document.querySelector('.items')).gridTemplateColumns.split(' ').length};})()`);
  const profile=()=>page.evaluate(`(()=>{const selectors=['.space-header','.upinfo','.header-upinfo','#profile-avatar','.status-badge'];return selectors.map(s=>{const n=document.querySelector(s),r=n.getBoundingClientRect(),c=getComputedStyle(n);return {selector:s,rect:[r.x,r.y,r.width,r.height],position:c.position,transform:c.transform,filter:c.filter,backdropFilter:c.backdropFilter,...(s!=='.upinfo'?{background:c.backgroundImage,borderRadius:c.borderRadius}:{})};});})()`);
  const assertProfile=async before=>{
    const after=await profile();assert.deepEqual(after[0],before[0],'banner artwork and outer footprint stay native');
    for(const s of ['#profile-avatar','.status-badge']){
      const a=after.find(n=>n.selector===s),b=before.find(n=>n.selector===s);
      assert.deepEqual({...a,rect:[a.rect[0],...a.rect.slice(2)]},{...b,rect:[b.rect[0],...b.rect.slice(2)]},s+' retains its native size, horizontal alignment and sharp appearance');
    }
  };
  const assertBanner=async()=>{
    assert.equal(await css('.upinfo','backgroundColor'),'rgba(0, 0, 0, 0)','footer uses a fading background');
    assert.match(await css('.upinfo','backgroundImage'),/linear-gradient/);assert.equal(await css('.upinfo','boxShadow'),'none');
    assert.equal(await css('.space-navbar','borderTopLeftRadius'),'0px','navigation joins the banner without a rounded top seam');
    assert.notEqual(await css('.header-avatar-wrap','boxShadow'),'none','portrait has a separate rim');
    assert.ok(await page.evaluate(`(()=>{const row=document.querySelector('.upinfo').getBoundingClientRect(),avatar=document.querySelector('#profile-avatar').getBoundingClientRect(),name=document.querySelector('.header-upinfo h1').getBoundingClientRect(),ops=document.querySelector('.operations').getBoundingClientRect();return avatar.top-row.top>=12&&row.bottom-avatar.bottom>=12&&name.right<=ops.left&&![...document.querySelectorAll('.bc-theme-surface-glass')].some(n=>{const r=n.getBoundingClientRect();return Math.abs(r.x-row.x)<1&&Math.abs(r.y-row.y)<1&&Math.abs(r.width-row.width)<1&&Math.abs(r.height-row.height)<1;});})()`),'portrait has breathing room, identity/actions do not overlap, and no second glass layer cuts through them');
  };
  const capture=async name=>{if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}};
  await patch({enabled:false,minimalistEnabled:false});const native=await geometry(),nativeProfile=await profile();await capture('space-native');
  await patch({enabled:true,material:'glass',textColor:'#ffffff',opacity:58});await assertVisualOnlyCSS(page);
  assert.deepEqual(await geometry(),native,'columns, gaps, section widths, sidebar and overflow stay native');
  await assertProfile(nativeProfile);await assertBanner();
  for(const s of ['#featured','#videos'])assert.equal(await css(s,'padding'),'20px','glass has an internal inset');
  assert.equal(await css('.nav-search-input','backgroundColor'),'rgba(0, 0, 0, 0)','search input shares the outer shell');
  assert.notEqual(await css('#nav-searchform','backgroundColor'),'rgba(0, 0, 0, 0)','search shell remains readable');
  for(const s of ['#latest','#follow','#primary-action'])assert.equal(await css(s,'backgroundColor'),'rgb(0, 174, 236)',s+' keeps its native action state');
  assert.equal(await css('#message','backgroundImage'),'none','neutral profile actions no longer use the native purple gradient');
  assert.equal(await css('button:disabled','opacity'),'0.4','disabled styling retained');
  await capture('space-glass');
  // Check actual composited contrast with bright and dark custom wallpapers,
  // in both foreground directions; include the neutral button's own paint.
  for(const [ink,wallpaper] of [['#ffffff','#ffffff'],['#111111','#000000']]){
    const image=await page.evaluate(`(()=>{const c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');x.fillStyle='${wallpaper}';x.fillRect(0,0,8,8);return c.toDataURL();})()`);
    await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/BACKGROUND",payload:{dataUrl:'+JSON.stringify(image)+',name:"Profile contrast"}})');await patch({textColor:ink});
    await until(page,'document.querySelector("#bc-theme-wallpaper")?.dataset.bcCustom === "true"');await settle(page);
    const ratios=await page.evaluate(`(()=>{const rgb=s=>s.match(/[\\d.]+/g).map(Number),over=(bg,paint)=>bg.map((v,i)=>v*(1-(paint[3]??1))+paint[i]*(paint[3]??1)),lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);return ['#popular','#more'].map(s=>{const n=document.querySelector(s),paints=[];for(let p=n;p&&p!==document.body;p=p.parentElement)paints.unshift(rgb(getComputedStyle(p).backgroundColor));const bg=paints.reduce(over,${wallpaper==='#ffffff'?'[255,255,255]':'[0,0,0]'}),a=lum(rgb(getComputedStyle(n).color).slice(0,3)),b=lum(bg);return {selector:s,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});})()`);
    for(const {selector,ratio} of ratios)assert.ok(ratio>=4.5,selector+' contrast '+ratio);
  }
  await page.evaluate('document.querySelector("#popular").click();document.querySelector("#more").click()');
  assert.equal(await css('#popular','backgroundColor'),'rgb(0, 174, 236)','newly selected sort stays blue');
  assert.notEqual(await css('#latest','backgroundColor'),'rgb(0, 174, 236)','old sort becomes neutral');
  assert.equal(await page.evaluate('spaceClicks'),1,'more button handler preserved');
  await page.evaluate('document.querySelector("#search").focus()');await page.type(' test');assert.ok((await page.evaluate('document.querySelector("#search").value')).includes('test'));
  for(const width of [1024,1280,1440,1920,2560]){
    await page.resize(width,1100);await patch({enabled:false});const before=await geometry(),beforeProfile=await profile();await patch({enabled:true});assert.deepEqual(await geometry(),before,'profile grid at '+width);
    await assertProfile(beforeProfile);await assertBanner();
    assert.ok(await page.evaluate(`(()=>{const p=document.querySelector('#videos').getBoundingClientRect(),h=document.querySelector('.section-wrap__header').getBoundingClientRect(),images=[...document.querySelectorAll('.space-main img')];return h.left-p.left>=20&&p.right-h.right>=20&&images.every(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return Math.abs(r.width/r.height-16/9)<.01&&s.filter==='none'&&s.backdropFilter==='none';});})()`),'content inset and sharp 16:9 covers at '+width);
  }
  await page.resize(1652,1100);await patch({material:'clear'});assert.equal(await css('#videos','padding'),'0px','Clear restores native spacing');
  assert.deepEqual(await profile(),nativeProfile,'Clear restores original profile spacing and position');
  await patch({enabled:false});assert.equal(await css('#videos','padding'),'0px');assert.equal(await css('#more','backgroundColor'),'rgb(255, 255, 255)','disable restores native control paint');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS profile sections: fading hero, contained portrait/rim, connected navigation, quiet actions, native banner/media, inset, contrast, selected/disabled states, search, interactions, responsive grid and restoration');
}
