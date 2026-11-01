import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle,assertVisualOnlyCSS} from './layout-parity.mjs';

const nativeCSS=readFileSync(new URL('./fixtures/header-menus.css',import.meta.url),'utf8');

export function subpageMenusFixture(){
  const entry=(id,title,scope,body)=>`<div class="${id}-entry entry" ${scope}><button data-menu="${id}">${title}</button><div class="v-popover is-bottom" data-positioner="${id}" hidden style="left:auto;right:0"><div id="${id}-menu" class="v-popover-content ${id==='favorite'?'header-favorite-popover':id==='message'?'message-entry-popover':''}">${body}</div></div></div>`;
  return `<!doctype html><html><meta charset="utf-8"><style>
    :root{--bg1:#fff;--bg2:#f1f2f3;--bg3:#e3e5e7;--bg1_float:#fff;--graph_bg_thick:#e3e5e7;--text1:#18191c;--text2:#61666d;--text3:#9499a0;--text4:#c9ccd0;--text_white:#fff;--line_regular:#e3e5e7;--brand_blue:#00aeec;--brand_pink:#fb7299;--Pi5_u:#ff6699;--Ga7_u:#61666d;--Wh0_u:#fff;--v_bg1_float:#fff;--v_line_regular:#e3e5e7;--Ga0_s:#fff}
    body{margin:0;font:14px/1.5 Arial;background:linear-gradient(110deg,#f4eee0,#d5e3e4 40%,#153e3a)}
    ${nativeCSS}
    .bili-header__bar{position:fixed;top:0;left:0;right:0;height:64px;z-index:1002;display:flex;align-items:center;justify-content:center;gap:12px;background:white}
    .entry,.header-avatar-wrap{position:relative}.entry>button,.header-avatar-wrap>button{padding:6px 10px}
    .v-popover[hidden]{display:none!important}.header-avatar-wrap>.v-popover{left:0}
    .submenu-positioner{visibility:hidden;opacity:0;pointer-events:none;transform:translateY(-50%)}
    .v-popover-wrap:hover>.submenu-positioner,.v-popover-wrap:focus-within>.submenu-positioner{visibility:visible;opacity:1;pointer-events:auto}
    .sub-links-item{min-width:160px}.nickname-item{color:#fb7299}.vip-entry-containter{background:linear-gradient(120deg,#51425c,#42544e)}
    .header-avatar-wrap,.header-avatar-wrap *{box-sizing:border-box}.header-tabs-panel__content{padding:12px}
    #vui-positioner{position:absolute;top:100%;right:0;width:220px}#vui-menu{padding:12px}
    main{margin:100px 5%;min-height:1600px}main section{padding:20px;margin-bottom:20px;background:#fff;color:#18191c}
    .user-card-m-exp{min-height:0}a{text-decoration:none}.demo-thumbnail{width:120px;height:68px;background:#496d65}
  </style><script src="/bridge.js"></script><script src="/settings.js"></script><script src="/theme.js"></script><script src="/minimalist.js"></script><script src="/content.js"></script>
  <header class="bili-header"><nav class="bili-header__bar">
    <div class="header-avatar-wrap" data-v-8db90999><button data-menu="profile">Profile</button><div id="profile-positioner" class="v-popover is-bottom" data-positioner="profile" hidden><div id="profile-menu" class="v-popover-content"><div class="avatar-panel-popover">
      <a class="big-avatar"></a><a class="nickname-item" href="#profile">Native VIP name</a><div class="vip-item"><a class="vip-item__link">年度大会员</a></div>
      <div class="coins-item"><a><span class="coin-item__text">硬币:</span><span class="coin-item__num">976.5</span></a></div><div class="level-item"><div class="level-item__text">当前成长10315，距离升级还需要485</div></div>
      <div class="counts-item"><a class="single-count-item"><span class="count-num">348</span><span class="count-text">关注</span></a><a class="single-count-item"><span class="count-num">74</span><span class="count-text">粉丝</span></a></div>
      <div class="vip-entry-containter" data-v-324b7959><div><div class="vip-entry-desc-title" data-v-324b7959>10张漫读券待领</div><div class="vip-entry-desc-subtitle" data-v-324b7959>年卡福利！热门漫画免费读</div></div><a class="vip-entry-btn" data-v-324b7959 href="#vip">大会员中心</a></div>
      <div class="links-item"><a class="single-link-item" href="#account">个人中心</a><a class="single-link-item" href="#uploads">投稿管理</a>
        <div class="v-popover-wrap" id="services-wrap"><a class="single-link-item" id="services-trigger" tabindex="0">推荐服务 →</a><div class="v-popover is-right submenu-positioner"><div id="services-menu" class="v-popover-content sub-links-item"><a href="#live" class="single-link-item sub-link-item">直播中心</a><a href="#courses" class="single-link-item sub-link-item">我的课程</a><a href="#wallet" class="single-link-item sub-link-item">B币钱包</a><a href="#orders" class="single-link-item sub-link-item">订单中心</a></div></div></div>
      </div><div class="split-line"></div><div class="links-item"><div class="v-popover-wrap"><a class="single-link-item" id="theme-trigger" tabindex="0">主题: 浅色 →</a><div class="v-popover is-right submenu-positioner"><div id="theme-menu" class="v-popover-content sub-links-item"><a class="single-link-item sub-link-item" data-choice="dark" tabindex="0">深色</a><a class="single-link-item sub-link-item" data-choice="light" tabindex="0">浅色</a></div></div></div></div><div class="split-line"></div><div class="logout-item">退出登录</div><div class="user-card-m-exp"></div>
    </div></div></div></div>
    ${entry('message','Messages','data-v-ede673b2','<div class="message-inner-list"><a href="#reply" class="message-inner-list__item">回复我的 <span class="message-inner-list__item--num">11</span></a><a class="message-inner-list__item" href="#notice">系统消息</a></div>')}
    ${entry('favorite','Favorites','data-v-f2784278','<div class="favorite-panel-popover"><div class="favorite-panel-popover__nav"><div class="tab-item tab-item--active">默认收藏夹</div><div class="tab-item tab-item--normal"><span class="tab-item__title">稍后再看</span><span class="tab-item__num">8</span></div></div><div class="favorite-panel-popover__content"><div class="content-scroll content-scroll--nothing">暂无收藏</div><div class="content-bottom"><a class="content-bottom__btn content-bottom__btn--view">查看全部</a></div></div></div>')}
    ${entry('history','History','data-v-0dbbb37d','<div class="history-panel-popover"><div class="header-tabs-panel"><a class="header-tabs-panel__item header-tabs-panel__item--active">视频</a><a class="header-tabs-panel__item">直播</a></div><div class="header-tabs-panel__content"><div class="demo-thumbnail"></div><p>最近看过的视频</p><a class="view-all-history-btn">查看全部历史</a></div></div>')}
    ${entry('upload','Upload','data-v-5a5981f1','<div class="upload-panel-popover"><div class="upload-item-row"><a class="upload-item" href="#video"><span class="item-title">视频投稿</span></a><a class="upload-item" href="#article"><span class="item-title">专栏投稿</span></a></div></div>')}
    <div class="entry"><button data-menu="vui">Tooltip</button><div id="vui-positioner" data-positioner="vui" hidden><div id="vui-menu" class="vui_popover-content vui_tooltip">原生提示 / Native tooltip</div></div></div>
    <div class="entry"><button data-menu="search">Search</button><div class="v-popover is-bottom" data-positioner="search" hidden style="left:auto;right:0;width:300px"><div id="search-menu" class="nav-search-panel"><div class="search-panel"><input id="search-query" placeholder="搜索"><p>搜索历史</p><a href="#query">氮化镓充电器推荐</a></div></div></div></div>
  </nav></header><main id="page-content" class="bili-feed4"><section><h1>Native header menu audit</h1><p>Underlying content must not show through a flyout.</p><div class="demo-thumbnail"></div></section></main>
  <script>
    window.closeMenus=()=>{document.activeElement.blur?.();document.querySelectorAll('[data-positioner]').forEach(n=>n.hidden=true);};
    for(const n of document.querySelectorAll('[data-menu]'))n.onclick=()=>{const p=document.querySelector('[data-positioner="'+n.dataset.menu+'"]'),open=p.hidden;closeMenus();p.hidden=!open;};
    window.menuActions=0;document.querySelectorAll('.sub-link-item').forEach(n=>n.onclick=e=>{e.preventDefault();menuActions++;});
  </script></html>`;
}

export async function runSubpageMenuChecks({cdp,base,until,screenshots}){
  const page=await cdp.page(base+'/subpage-menus.html');await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  const patch=async payload=>{await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})');await settle(page);await settle(page);};
  const open=async id=>{await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:1090},page.sessionId);await page.evaluate('closeMenus();document.querySelector(\'[data-positioner="'+id+'"]\').hidden=false');await settle(page);await settle(page);};
  const capture=async name=>{if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}};
  const css=(s,p)=>page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(s)}))[${JSON.stringify(p)}]`);
  const geometry=()=>page.evaluate(`['#profile-menu','#services-trigger','#services-menu','#theme-trigger','#theme-menu'].map(s=>{const n=document.querySelector(s),r=n.getBoundingClientRect(),c=getComputedStyle(n);return [r.x,r.y,r.width,r.height,c.position,c.fontSize,c.lineHeight,c.overflow,c.transform];})`);
  const focusSub=async id=>{await page.evaluate('document.querySelector("#'+id+'-trigger").focus()');await until(page,'getComputedStyle(document.querySelector("#'+id+'-menu").parentElement).opacity === "1"');await settle(page);};
  const layerAt=selector=>page.evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return [...document.querySelectorAll('.bc-theme-popover-glass,.bc-theme-surface-glass')].filter(n=>{const b=n.getBoundingClientRect();return Math.abs(b.x-r.x)<1&&Math.abs(b.y-r.y)<1&&Math.abs(b.width-r.width)<1&&Math.abs(b.height-r.height)<1;}).length;})()`);
  const rgb=c=>c.match(/[\d.]+/g).map(Number),over=(paint,base)=>{const p=rgb(paint),a=p[3]??1;return p.slice(0,3).map((v,i)=>v*a+base[i]*(1-a));};
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const readable=async(selector,backing,wallpaper)=>{
    const colors=await page.evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,paints=[];for(let p=n;p&&p!==document.body;p=p.parentElement){const b=p.getBoundingClientRect();if(x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom)paints.unshift(getComputedStyle(p).backgroundColor);}return paints;})()`);
    const color=await css(selector,'color'),panel=colors.reduce((base,paint)=>over(paint,base),wallpaper),ratio=contrast(rgb(color),panel);
    assert.ok(ratio>=4.5,selector+' readable over '+backing+': '+JSON.stringify({color,colors,ratio}));
  };
  await patch({enabled:false,minimalistEnabled:false});await open('profile');const native=await geometry();
  const vipColor=await css('.vip-item__link','color'),vipBG=await css('.vip-item__link','backgroundColor');
  await patch({enabled:true,material:'glass',opacity:58,textColor:'#ffffff'});await assertVisualOnlyCSS(page);
  await open('profile');await focusSub('services');await until(page,'document.querySelectorAll(".bc-theme-popover-glass").length === 2');
  assert.deepEqual(await geometry(),native,'profile and flyout native size/position/type/overflow preserved');
  assert.equal(await css('.avatar-panel-popover','backgroundColor'),'rgba(0, 0, 0, 0)','profile body shares its one backing');
  assert.equal(await css('.user-card-m-exp','backgroundColor'),'rgba(0, 0, 0, 0)','in-flow nested body does not gain a second tint');
  assert.notEqual(await css('#services-menu','backgroundColor'),'rgba(0, 0, 0, 0)','out-of-parent submenu has its own backing');
  assert.equal(await layerAt('#services-menu'),1,'one blur layer follows the flyout bounds');
  assert.equal(await css('.vip-item__link','color'),vipColor);assert.equal(await css('.vip-item__link','backgroundColor'),vipBG);
  await page.evaluate('document.querySelector("#services-menu a").click()');assert.equal(await page.evaluate('menuActions'),1);
  // Exercise the native pale-hover state with a real browser pointer.
  const point=await page.evaluate('(()=>{const r=document.querySelector("#services-trigger").getBoundingClientRect();return {x:r.x+20,y:r.y+r.height/2};})()');
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',...point},page.sessionId);await page.evaluate('new Promise(r=>setTimeout(r,350))');
  assert.notEqual(await css('#services-trigger','backgroundColor'),'rgb(227, 229, 231)','hover no longer leaves a pale native button');
  await readable('#services-trigger','#profile-menu',[255,255,255]);
  await capture('profile-services');await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:1090},page.sessionId);await focusSub('theme');await capture('profile-theme');
  // A component-local native palette and an intermediate content wrapper
  // reproduce the supplied white trigger / transparent flyout combination.
  await open('profile');
  await page.evaluate(`(()=>{const triggerWrap=document.querySelector('#services-wrap');triggerWrap.style.setProperty('--graph_bg_thick','#e3e5e7');const menu=document.querySelector('#services-menu'),wrap=document.createElement('div');wrap.id='submenu-content-wrap';menu.before(wrap);wrap.append(menu);})()`);
  await focusSub('services');
  const wrappedPoint=await page.evaluate('(()=>{const r=document.querySelector("#services-trigger").getBoundingClientRect();return {x:r.x+20,y:r.y+r.height/2};})()');
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',...wrappedPoint},page.sessionId);await page.evaluate('new Promise(r=>setTimeout(r,350))');
  assert.notEqual(await css('#services-trigger','backgroundColor'),'rgb(227, 229, 231)','component-local graph colors cannot restore the pale trigger');
  assert.notEqual(await css('#services-menu','backgroundColor'),'rgba(0, 0, 0, 0)','an intermediate content wrapper cannot clear the flyout backing');
  assert.equal(await layerAt('#services-menu'),1,'wrapped flyout still has one matching layer');
  await capture('profile-variant-after');
  await page.evaluate(`(()=>{document.querySelector('#services-wrap').style.removeProperty('--graph_bg_thick');const wrap=document.querySelector('#submenu-content-wrap');wrap.replaceWith(...wrap.childNodes);})()`);
  for(const [ink,wallpaper] of [['#ffffff',[255,255,255]],['#111111',[0,0,0]]]){
    const image=await page.evaluate(`(()=>{const c=document.createElement('canvas');c.width=120;c.height=80;const x=c.getContext('2d');x.fillStyle='rgb(${wallpaper.join(',')})';x.fillRect(0,0,120,80);return c.toDataURL();})()`);
    await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/BACKGROUND",payload:{dataUrl:'+JSON.stringify(image)+',name:"Menu audit"}})');await patch({textColor:ink});
    await until(page,'Number(document.documentElement.style.getPropertyValue("--bc-glass-bg-content").match(/[\\d.]+/g)[3]) > .5');
    for(const [name,className] of [['home','bili-feed4'],['video','video-container-v1'],['search','search-page'],['dynamic','bili-dyn-home'],['space','space-main']]){
      await page.evaluate('history.pushState({},"","/menus/'+name+'");document.querySelector("#page-content").className='+JSON.stringify(className));await until(page,'document.documentElement.dataset.bcPage === "'+name+'"');
      await open('profile');await focusSub('services');await readable('#services-menu a','#services-menu',wallpaper);await readable('.level-item__text','#profile-menu',wallpaper);await readable('.vip-entry-desc-subtitle','#profile-menu',wallpaper);
      await focusSub('theme');await readable('#theme-menu a','#theme-menu',wallpaper);
      for(const [menu,selector] of [['message','.message-inner-list__item'],['favorite','.tab-item__num'],['history','.view-all-history-btn'],['upload','.upload-item .item-title'],['search','#search-query'],['vui','#vui-menu']]){await open(menu);await readable(selector,'#'+menu+'-menu',wallpaper);}
    }
  }
  await patch({textColor:'#ffffff'});await open('message');assert.equal(await css('.message-inner-list__item--num','backgroundColor'),'rgb(250, 90, 87)','notification badge stays native');
  await open('favorite');assert.equal(await css('.tab-item--active','backgroundColor'),'rgb(0, 174, 236)','selected folder stays blue');await capture('favorites');
  await open('search');await page.evaluate('document.querySelector("#search-query").focus()');await page.type('充电器');assert.equal(await page.evaluate('document.querySelector("#search-query").value'),'充电器','search input still edits');
  for(const width of [1024,1440,1920,2560]){await page.resize(width,1100);await open('profile');await focusSub('services');assert.equal(await layerAt('#services-menu'),1);}
  // Popups can also be portaled outside the header. The same two surfaces work.
  await page.resize(1652,1100);await page.evaluate(`const portal=document.createElement('div');portal.id='portal';portal.className='bili-header header-avatar-wrap';portal.setAttribute('data-v-8db90999','');portal.style.cssText='position:fixed;left:40%;top:70px;z-index:1002';portal.append(document.querySelector('#profile-positioner'));document.body.append(portal);`);await settle(page);await settle(page);await focusSub('services');await until(page,'document.querySelectorAll(".bc-theme-surface-glass").length >= 2');assert.equal(await layerAt('#services-menu'),1);
  await page.evaluate('window.scrollTo(0,500)');await settle(page);await settle(page);assert.equal(await layerAt('#services-menu'),1,'flyout layer follows scrolling');await capture('portaled-services');
  await patch({material:'clear'});assert.equal(await css('#services-menu','backgroundColor'),'rgba(0, 0, 0, 0)');
  await page.evaluate('document.querySelector(".bili-header__bar > .header-avatar-wrap").append(document.querySelector("#profile-positioner"));document.querySelector("#portal").remove();window.scrollTo(0,0)');await patch({enabled:false});await open('profile');assert.deepEqual(await geometry(),native,'disabling restores native menu geometry');
  assert.equal(await css('#services-menu','backgroundColor'),'rgb(255, 255, 255)');await until(page,'!document.querySelector("[data-bc-owned]")');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS subpage menus: profile/services/theme, messages, favorites, history, upload, search and VUI; five page contexts, white/dark ink contrast, native geometry/states, four widths, nested/portaled glass, input/actions, scrolling, Clear and restore');
}
