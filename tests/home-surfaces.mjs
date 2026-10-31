import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {homescreenFixture} from './homescreen.mjs';
import {measureNativeLayout as measure,compare,settle,runParity} from './layout-parity.mjs';

export function homeSurfacesFixture(BC) {
  return homescreenFixture(BC)
    .replace('<div class="channel-icons"><a href="/v/popular/all">热门</a></div>',`<div class="channel-icons">
      <a class="channel-icons__item" href="https://t.bilibili.com"><span class="icon-bg dynamic">动</span>动态</a>
      <a class="channel-icons__item" href="/v/popular/all"><span class="icon-bg popular">热</span>热门</a></div>`)
    .replace('<div class="palette-button-wrap"><button class="activity-entry" id="tool-promo">活动</button><button id="feedback">反馈</button><button id="top">↑</button></div>',`<div class="palette-button-outer"><div class="palette-button-wrap">
      <div class="watchlater-pip-button"><div class="watchlater-pip-button-inner-wrap"><button class="watchlater-pip-button-inner" id="pip">▶</button></div></div>
      <div class="native-spacer"></div><div class="storage-box"><button class="float-button" id="toolbar-more">⋯</button></div>
      <button class="float-button" id="feedback">反馈</button><button class="float-button" id="top">↑</button></div></div>
      <div id="tool-menu" role="menu" hidden>Native toolbar menu</div><button id="finish-loading">Finish native loading</button>
      <div id="opacity-holder" style="opacity:0"><div class="bili-popover__content" id="opacity-popup">Native hidden popup</div></div>`)
    .replace('</style>',`</style><style>
      .channel-icons{display:flex;gap:16px;background:#202930;border-radius:18px}
      .channel-icons__item{display:flex;flex-direction:column;align-items:center}.icon-bg{width:40px;height:40px;border-radius:50%}.dynamic{background:#ff9212}.popular{background:#f07775}
      .right-channel-container{display:flex;flex:1;gap:16px;align-items:center;position:relative;background:#172029;border-radius:16px}
      .bili-header .bili-header__channel .channel-items__right{position:relative;border-left:1px solid #555;padding-left:22px;background:#121820}
      .channel-items__right::before{content:'';position:absolute;left:-16px;top:0;width:16px;height:100%;background:#101720;box-shadow:inset 0 0 0 1px #101720}
      .channel-icons::before{content:'';position:absolute;width:8px;height:20px;background:#101720}
      #first-grid>.bili-video-card{align-self:stretch}
      .bili-video-card__wrap{position:relative}
      .bili-video-card__info{position:relative;margin-top:10px;background:linear-gradient(#ddd,#999)}
      .bili-video-card__info--right{background:#eee}
      .bili-video-card:hover>.bili-video-card__wrap,.bili-video-card.selected>.bili-video-card__wrap{background:#ccc}
      .bili-video-card:hover .bili-video-card__info,.bili-video-card.selected .bili-video-card__info--right{background:#111}
      .bili-video-card__wrap::before,.bili-video-card__info::after{content:'';position:absolute;inset:0;background:linear-gradient(#eee,#333);pointer-events:none}
      .bili-video-card__info--tit{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
      #ad .bili-video-card__info--right,#analytics .bili-video-card__info--right{min-height:145px}
      .bili-video-card__skeleton--cover{padding-top:56.25%;border-radius:6px;background:#f1f2f3}
      .bili-video-card__skeleton--info{margin-top:10px}.bili-video-card__skeleton--text{height:18px;margin:4px 0;background:#f1f2f3}.bili-video-card__skeleton--light{height:16px;width:50%;background:#f1f2f3}
      .native-pending{height:100px}.opaque-ad-placeholder{height:180px;background:white}
      .palette-button-outer{position:fixed;inset:0;z-index:10;pointer-events:none;transform:translateZ(0)}
      .palette-button-wrap{position:fixed;right:12px;bottom:20px;width:40px;pointer-events:auto}
      .palette-button-wrap button{box-sizing:border-box;width:40px;height:40px;border:1px solid #ddd;border-radius:8px;background:white;color:black;padding:0}
      .palette-button-wrap>*{margin-top:6px}.palette-button-wrap .native-spacer{height:70px;visibility:hidden}.storage-box{overflow:hidden;border-radius:8px}
      #tool-menu{position:fixed;right:60px;bottom:20px;width:150px;height:50px;z-index:11;background:white}
      #opacity-popup{position:fixed;right:80px;top:80px;width:140px;height:40px;z-index:20;background:white}
      #carousel{position:relative}.recommended-swipe-body{position:absolute;inset:0;background:var(--graph_bg_regular,#f1f2f3);border-radius:6px;color:var(--text4,#999)}
      .floor-card.single-card{position:relative;z-index:1;padding:0;border:1px solid #ddd;border-radius:6px;color:#18191c}
      .floor-card-inner{background:var(--bg1_float,#fff);border-radius:6px}.floor-card-inner:hover{background:var(--bg2_float,#eee)}
      .floor-card.single-card>.layer{position:absolute;inset:0;width:90%;height:100%;transform:translateY(6px);background:#e3e5e7;z-index:-1}
      .floor-card.single-card>.layer.tiny{width:80%;transform:translateY(12px);background:#f1f2f3;z-index:-2}
      .floor-card .cover-shim{position:relative;padding-top:56.25%}.floor-card .cover-shim img{position:absolute;inset:0;width:100%;height:100%}
      .floor-card .info-container{padding:0 12px 12px}.floor-card .title{height:44px;line-height:22px;margin:0}.floor-card .sub-title{color:var(--text3)}.floor-card .living{color:#ff6699}
      .bili-live-card{position:relative;min-width:0}.bili-live-card__image{position:relative;padding-top:56.25%;background:#f1f2f3}.bili-live-card__cover{position:absolute;inset:0}.bili-live-card__cover img{width:100%;height:100%}
      .bili-live-card__info{padding:12px;background:var(--bg1_float,#fff)}.bili-live-card__info--tit{font-size:14px;line-height:22px;height:44px;margin:0;color:var(--text1,#18191c)}
      .bili-live-card__info--author{color:var(--text3,#666)}.bili-live-card__info--living{color:#ff6699}.bili-live-card__skeleton.hide{display:none}.bili-live-card__skeleton--cover{padding-top:56.25%;background:#f1f2f3}
    </style>`)
    .replace('</body>',`<script>
      const left=document.querySelector('.channel-items__left'),right=document.querySelector('.channel-items__right');
      const categories=document.createElement('div');categories.className='right-channel-container';left.before(categories);categories.append(left,right);
      const grid=document.querySelector('#first-grid');
      grid.insertAdjacentHTML('beforeend','<div class="bili-video-card" id="native-loading"><div class="bili-video-card__skeleton loading_animation"><div class="bili-video-card__skeleton--cover"></div><div class="bili-video-card__skeleton--info"><p class="bili-video-card__skeleton--text"></p><p class="bili-video-card__skeleton--light"></p></div></div></div><div class="bili-video-card" id="pending-empty"><div class="native-pending"></div></div><div class="bili-feed-card" id="blocked-confirmed" data-is-ad="true"><div class="bili-video-card"><div class="opaque-ad-placeholder"></div></div></div>');
      window.loadingNode=document.querySelector('#native-loading');
      const failed=document.createElement('div');failed.id='failed-media';failed.className='bili-video-card';
      failed.append(document.querySelector('#normal .bili-video-card__wrap').cloneNode(true));grid.append(failed);
      failed.querySelector('img').src='/missing-thumbnail.png';
      const floor=document.createElement('div');floor.className='floor-single-card';floor.id='special-floor';
      floor.innerHTML='<div class="floor-card single-card"><div class="floor-card-inner"><div class="cover-shim"><img alt="Native special-card cover"></div><div class="info-container"><p class="title"><a href="/bangumi/play/ep123"><span class="living">直播中</span> Native special-card title</a></p><a class="sub-title" href="/space/123">Uploader</a></div></div><div class="layer"></div><div class="layer tiny"></div></div>';
      floor.querySelector('img').src=document.querySelector('#normal img').src;grid.append(floor);
      const live=document.createElement('div');live.className='bili-live-card';live.id='native-live';
      live.innerHTML='<div class="bili-live-card__skeleton hide"><div class="bili-live-card__skeleton--cover"></div></div><div class="bili-live-card__wrap"><a class="bili-live-card__image--link" href="https://live.bilibili.com/123"><div class="bili-live-card__image"><picture class="bili-live-card__cover"><img alt="Native live cover"></picture></div></a><div class="bili-live-card__info"><h3 class="bili-live-card__info--tit"><a href="https://live.bilibili.com/123"><span class="bili-live-card__info--living">直播中</span> Native live title</a></h3><a class="bili-live-card__info--author" href="/space/123">Creator</a></div></div>';
      live.querySelector('img').src=document.querySelector('#normal img').src;grid.append(live);
      document.querySelector('#finish-loading').addEventListener('click',()=>{loadingNode.replaceChildren(document.querySelector('#normal .bili-video-card__wrap').cloneNode(true));});
      document.querySelector('#toolbar-more').addEventListener('click',()=>{document.querySelector('#tool-menu').hidden=!document.querySelector('#tool-menu').hidden;});
      document.querySelector('#pip').addEventListener('click',()=>{window.pipClicks=(window.pipClicks||0)+1;});
      document.querySelector('#carousel').insertAdjacentHTML('afterbegin','<div class="recommended-swipe-body"><div class="recommended-swipe-body-error">Native blocked-media state</div></div>');
    </script></body>`);
}

export async function runHomeSurfaceChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/home-surfaces.html');
  await page.activate();await page.resize(1920,2400);
  await until(page,'document.documentElement.dataset.bcPage === "home" && !!window.loadingNode');
  const css=(selector,property,pseudo)=>page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)}),${JSON.stringify(pseudo||null)})[${JSON.stringify(property)}]`);
  const patch=async changes=>{
    const result=await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:${JSON.stringify(changes)}})`);
    assert.equal(result.ok,true);
    await until(page,`document.documentElement.hasAttribute('data-bc-enabled')===${result.data.settings.enabled} &&
      document.documentElement.hasAttribute('data-bc-minimalist')===${result.data.settings.minimalistEnabled}`);
    await settle(page);
  };
  const capture=async name=>{
    if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}
  };
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await patch({enabled:false,minimalistEnabled:false});
  const native=await measure(page);
  await capture('home-surfaces-native');
  await patch({enabled:true});
  compare(native,await measure(page),'surface ownership preserves outer geometry',{cardStretch:true});
  for(const selector of ['.channel-icons','.right-channel-container','.channel-items__left','.channel-items__right','.palette-button-wrap','.storage-box']) {
    assert.equal(await css(selector,'backgroundColor'),'rgba(0, 0, 0, 0)',selector+' has no nested slab');
    assert.equal(await css(selector,'boxShadow'),'none');
  }
  for(const selector of ['.channel-icons','.channel-items__right'])assert.equal(await css(selector,'backgroundColor','::before'),'rgba(0, 0, 0, 0)','native pseudo-element cannot paint a seam');
  assert.equal(await css('.channel-items__right','borderLeftWidth'),'1px','native separator width');
  assert.equal(await css('.icon-bg.dynamic','backgroundColor'),'rgb(255, 146, 18)','native icon color remains');
  await until(page,'document.querySelectorAll("[data-bc-surface-kind=categories]").length===1');
  assert.equal(await page.evaluate(`(()=>{const a=document.querySelector('.channel-icons').getBoundingClientRect(),b=document.querySelector('.channel-items__right').getBoundingClientRect(),g=document.querySelector('[data-bc-surface-kind=categories]').getBoundingClientRect();return g.left<a.left && g.top<a.top && g.right>b.right && g.bottom>a.bottom;})()`),true,'one padded owned paint surface contains both ends');
  assert.equal(await page.evaluate(`(()=>{
    const outer=document.querySelector('.bili-header__channel').getBoundingClientRect(),g=document.querySelector('[data-bc-surface-kind=categories]').getBoundingClientRect();
    const groups=[...document.querySelectorAll('.channel-icons,.channel-items__left,.channel-items__right')].map(n=>n.getBoundingClientRect());
    const near=(a,b)=>Math.abs(a-b)<1/64;
    return near(g.left,Math.max(outer.left,Math.min(...groups.map(r=>r.left))-12)) &&
      near(g.right,Math.min(outer.right,Math.max(...groups.map(r=>r.right))+12)) &&
      near(g.top,Math.max(outer.top,Math.min(...groups.map(r=>r.top))-12)) &&
      near(g.bottom,Math.min(outer.bottom,Math.max(...groups.map(r=>r.bottom))+12));
  })()`),true,'category glass has 12px breathing room bounded by its native wrapper');
  assert.equal(await css('#normal','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#normal > .bili-video-card__wrap','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#normal .bili-video-card__info','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#special-floor .floor-card','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#special-floor .floor-card-inner','backgroundColor'),'rgba(0, 0, 0, 0)');
  for(const selector of ['#special-floor .layer','#special-floor .layer.tiny'])assert.equal(await css(selector,'backgroundColor'),'rgba(0, 0, 0, 0)','native decorative backplates cannot paint opaque stacks');
  assert.equal(await css('#special-floor .title','color'),'rgb(255, 255, 255)');
  assert.equal(await css('#special-floor .living','color'),'rgb(255, 102, 153)','native live status color remains');
  assert.equal(await css('#native-live','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#native-live > .bili-live-card__wrap','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#native-live .bili-live-card__info','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#native-live .bili-live-card__info--tit','color'),'rgb(255, 255, 255)');
  assert.equal(await css('#native-live .bili-live-card__info--living','color'),'rgb(255, 102, 153)');
  assert.notEqual(await css('#native-live .bili-live-card__skeleton--cover','backgroundColor'),'rgb(241, 242, 243)');
  assert.equal(await page.evaluate(`(()=>{const a=document.querySelector('#normal').getBoundingClientRect(),b=document.querySelector('#normal > .bili-video-card__wrap').getBoundingClientRect();return Math.abs(a.bottom-b.bottom)<1;})()`),true,'the wrapper now fills its grid item instead of leaving unused row space');
  const infoPaint=async()=>page.evaluate(`(()=>{
    const layers=[...document.querySelectorAll('[data-bc-surface-kind="video-info"]')];
    return ['#normal','#native-loading','#special-floor','#native-live'].map(selector=>{
      const card=document.querySelector(selector),info=card.querySelector(BiliThemePage.homeVideoInfo);
      const cover=info.parentElement.querySelector(BiliThemePage.homeVideoCover).getBoundingClientRect(),r=info.getBoundingClientRect();
      const matches=layers.filter(n=>{const b=n.getBoundingClientRect();return Math.abs(b.left-cover.left)<1 && Math.abs(b.top-cover.bottom)<1 && Math.abs(b.right-cover.right)<1 && Math.abs(b.bottom-r.bottom)<1;});
      const s=matches.length===1?getComputedStyle(matches[0]):null;
      return {selector,count:matches.length,bg:s?.backgroundColor,filter:s?.backdropFilter,radius:s?.borderRadius};
    });
  })()`);
  await until(page,'document.querySelector("[data-bc-surface-kind=video-info]") !== null');
  const paint=await infoPaint();
  for(const panel of paint) {
    assert.equal(panel.count,1,'exactly one glass region joins the cover and ends at its information block: '+panel.selector);
    assert.equal(panel.bg,paint[0].bg,'normal, loading, live and special cards share one tint');
    assert.equal(panel.filter,'blur(14px) saturate(1.4)');
    assert.equal(panel.radius,'0px 0px 10px 10px');
  }
  for(const selector of ['#normal .bili-video-card__info--right','#normal .bili-video-card__info']) {
    assert.equal(await css(selector,'backgroundImage'),'none');
    assert.equal(await css(selector,'backgroundColor'),'rgba(0, 0, 0, 0)');
  }
  assert.equal(await css('#normal .bili-video-card__info--tit','webkitLineClamp'),'2');
  assert.equal(await css('#normal .bili-video-card__wrap','backgroundColor','::before'),'rgba(0, 0, 0, 0)');
  assert.equal(await css('#normal .bili-video-card__info','backgroundColor','::after'),'rgba(0, 0, 0, 0)');
  const point=await page.evaluate('(()=>{const r=document.querySelector("#normal .bili-video-card__info").getBoundingClientRect();return {x:r.x+10,y:r.y+10};})()');
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point},page.sessionId);
  await settle(page);
  assert.equal(await css('#normal > .bili-video-card__wrap','backgroundColor'),'rgba(0, 0, 0, 0)','native hover cannot paint a second surface');
  assert.deepEqual(await infoPaint(),paint,'hover retains the same information material and bounds');
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0},page.sessionId);
  await page.evaluate('document.querySelector("#normal").classList.add("selected")');
  await settle(page);
  assert.equal(await css('#normal .bili-video-card__info--right','backgroundColor'),'rgba(0, 0, 0, 0)');
  assert.deepEqual(await infoPaint(),paint,'selected retains the same material');
  await page.evaluate('document.querySelector("#normal").classList.remove("selected")');
  for(const selector of ['#normal img','#normal .bili-video-card__image--wrap','#normal > .bili-video-card__wrap']) {
    assert.equal(await css(selector,'filter'),'none');assert.equal(await css(selector,'backdropFilter'),'none');
  }
  assert.notEqual(await css('#native-loading .bili-video-card__skeleton--cover','backgroundColor'),'rgb(241, 242, 243)');
  assert.notEqual(await css('#native-loading .bili-video-card__skeleton--text','backgroundColor'),'rgb(241, 242, 243)');
  assert.notEqual(await css('.recommended-swipe-body','backgroundColor'),'rgb(241, 242, 243)','native blocked-media fill uses the shared tint');
  for(const selector of ['#pip','#toolbar-more','#feedback','#top'])assert.notEqual(await css(selector,'backgroundColor'),'rgba(0, 0, 0, 0)',selector+' is its own glass surface');
  await until(page,`(()=>{const b=document.querySelector('#pip').getBoundingClientRect();return [...document.querySelectorAll('.bc-theme-surface-glass')].some(n=>{const r=n.getBoundingClientRect();return Math.abs(r.left-b.left)<1&&Math.abs(r.top-b.top)<1&&getComputedStyle(n).zIndex==='9';});})()`);
  await page.evaluate('document.querySelector("#pip").click();document.querySelector("#toolbar-more").click()');
  assert.equal(await page.evaluate('window.pipClicks'),1);
  assert.equal(await page.evaluate('document.querySelector("#tool-menu").hidden'),false);
  await page.evaluate('document.querySelector("#toolbar-more").click();document.querySelector("#normal .bili-video-card__image--wrap").dispatchEvent(new Event("mouseenter"))');
  assert.equal(await page.evaluate('document.querySelector("#normal .preview-overlay").hidden'),false);
  await page.evaluate('document.querySelector("#normal .preview-overlay").hidden=true');
  await patch({minimalistEnabled:true,minimalistHideAds:true,minimalistHideBanner:false});
  assert.equal(await css('#blocked-confirmed','display'),'none','confirmed ad outer slot is removed');
  for(const selector of ['#native-loading','#pending-empty'])assert.notEqual(await css(selector,'display'),'none','pending legitimate content survives filtering');
  assert.notEqual(await css('.recommended-swipe-body-error','display'),'none','a media-error state is not an ad signal');
  await until(page,'document.querySelector("#failed-media img").complete && document.querySelector("#failed-media img").naturalWidth===0');
  assert.notEqual(await css('#failed-media','display'),'none','a failed image is not an ad signal');
  await patch({minimalistEnabled:false});
  await page.evaluate('document.querySelector("#finish-loading").click()');
  await until(page,'document.querySelector("#native-loading > .bili-video-card__wrap")!==null');
  assert.equal(await page.evaluate('window.loadingNode===document.querySelector("#native-loading")'),true,'native loading node is preserved');
  await settle(page);
  for(const panel of await infoPaint())assert.equal(panel.count,1,'loading transition leaves one content-bounded panel');
  assert.equal(await css('#native-loading > .bili-video-card__wrap','backgroundColor'),'rgba(0, 0, 0, 0)','loaded shell never adds another tint');
  for(const [name,color] of [['bright','#ffffff'],['dark','#101820']]) {
    await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:{name:${JSON.stringify(name)},dataUrl:(()=>{const c=document.createElement('canvas');c.width=40;c.height=40;const x=c.getContext('2d');x.fillStyle=${JSON.stringify(color)};x.fillRect(0,0,40,40);return c.toDataURL();})()}})`);
    await settle(page);await capture('home-surfaces-'+name);
    assert.equal(await css('#normal h3 a','color'),'rgb(255, 255, 255)');
  }
  await patch({material:'clear'});
  for(const selector of ['#pip','#normal > .bili-video-card__wrap','#native-loading > .bili-video-card__wrap'])assert.equal(await css(selector,'backgroundColor'),'rgba(0, 0, 0, 0)');
  await patch({material:'glass'});
  const popupLayer=()=>page.evaluate(`(()=>{const b=document.querySelector('#opacity-popup').getBoundingClientRect();return [...document.querySelectorAll('.bc-theme-surface-glass[data-bc-level=strong]')].some(n=>{const r=n.getBoundingClientRect();return Math.abs(r.left-b.left)<1&&Math.abs(r.top-b.top)<1;});})()`);
  assert.equal(await popupLayer(),false,'an invisible ancestor cannot leave an owned glass rectangle');
  await page.evaluate('document.querySelector("#opacity-holder").style.opacity="1"');
  await until(page,`(()=>{const b=document.querySelector('#opacity-popup').getBoundingClientRect();return [...document.querySelectorAll('.bc-theme-surface-glass[data-bc-level=strong]')].some(n=>{const r=n.getBoundingClientRect();return Math.abs(r.left-b.left)<1&&Math.abs(r.top-b.top)<1;});})()`);
  await page.evaluate('document.querySelector("#opacity-holder").style.opacity="0"');
  await settle(page);assert.equal(await popupLayer(),false);
  const parity=await runParity({page,patch,artifacts:screenshots,label:'home-surfaces',navKeys:await page.evaluate('BiliTheme.NAV_ITEMS.map(n=>n.key)'),continuous:false});
  for(const row of parity.rows) {
    const surfaces=[...row.after.components.cardSurface,...row.after.components.floorSurface,...row.after.components.liveSurface].filter(s=>s.rect[2]&&s.rect[3]);
    for(let i=0;i<surfaces.length;i++)for(let j=i+1;j<surfaces.length;j++) {
      const [x,y,w,h]=surfaces[i].rect,[a,b,c,d]=surfaces[j].rect;
      const overlapX=Math.min(x+w,a+c)-Math.max(x,a),overlapY=Math.min(y+h,b+d)-Math.max(y,b);
      assert.ok(overlapX<1||overlapY<1,'card paint shells cannot overlap at '+row.width+'px');
    }
  }
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await page.close();
  console.log('  PASS homepage surfaces: single category frost/no pseudo seams, content-bounded cards, preserved skeleton/loading/media, individual toolbar glass/actions, confirmed ad slots, light/dark/Clear and native geometry');
}
