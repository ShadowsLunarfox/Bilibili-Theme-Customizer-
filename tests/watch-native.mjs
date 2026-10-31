import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

const nativeCSS=readFileSync(new URL('./fixtures/watch-native.css',import.meta.url),'utf8');

export function nativeWatchFixture(){
  return `<!doctype html><html><meta charset="utf-8"><style>
    :root{--bg1:#fff;--bg3:#f1f2f3;--graph_bg_regular:#f1f2f3;--graph_bg_thick:#e3e5e7;--text1:#18191c;--text2:#61666d;--text3:#9499a0;--graph_icon:#61666d;--brand_blue:#00aeec}
    body{margin:0;font:15px/1.6 Arial;background:linear-gradient(120deg,#fff,#e5d2b0 45%,#123d3c)}
    .video-container-v1{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;margin:80px 5%}
    .video-info-container{height:80px}.video-info-container h1{font-size:18px;margin:0}
    #playerWrap{margin-top:8px}.bpx-player-container{background:black;color:white}.bpx-player-video-wrap{height:280px;display:grid;place-items:center;background:#203d3b}.bpx-player-control-wrap{height:35px;background:#000;color:white}
    .bpx-player-sending-bar{align-items:center}.bpx-player-video-inputbar{display:flex;align-items:center}.bpx-player-video-inputbar-wrap{flex:1}
    #send{background:#00aeec;color:white;border:0;height:30px}.bui-collapse-body[hidden]{display:none}
    #danmukuBox{margin-top:16px}.bpx-player-dm-container{height:390px;overflow:auto}.bpx-player-dm-btn-history{display:block!important}
    .up-info-container{padding:16px}.upinfo-btn-panel .follow-btn{border:0;padding:8px 20px;border-radius:6px}.video-pod{margin-top:14px;padding:16px}.subscribe-btn{padding:6px 12px;border:0}
    .video-container-v1 #comment{margin-top:24px;z-index:0;position:relative}
  </style><script src="/bridge.js"></script><script src="/settings.js"></script><script src="/theme.js"></script><script src="/minimalist.js"></script><script src="/content.js"></script>
  <main class="video-container-v1"><div class="left-container">
    <div class="video-info-container"><h1>Native watch components · 弹幕与评论</h1></div>
    <div id="playerWrap"><div id="bilibili-player"><div class="bpx-docker bpx-docker-major"><div class="bpx-player-container" data-revision="1">
      <div class="bpx-player-video-wrap">Native video area</div><div class="bpx-player-control-wrap">▶ 00:26 / 27:00</div>
      <div class="bpx-player-sending-area"><div class="bpx-player-sending-bar"><span class="bpx-player-video-info">268人正在看</span><div class="bpx-player-video-inputbar"><div class="bpx-player-video-inputbar-wrap"><input class="bpx-player-dm-input" placeholder="发个友善的弹幕见证当下"></div><button id="send">发送</button></div></div></div>
    </div></div></div></div>
    <div id="comment"><bili-comments></bili-comments></div>
  </div><aside class="right-container">
    <div class="up-info-container"><p>教日语的木子学姐</p><div class="upinfo-btn-panel"><button class="follow-btn following" data-v-f1b16cb6>已关注</button></div></div>
    <div id="danmukuBox" class="danmaku-box"><div class="danmaku-wrap"><div class="bpx-docker bpx-docker-minor"><div class="bpx-player-auxiliary" data-revision="1"><div class="bpx-player-collapse"><div class="bui-collapse"><div class="bui-collapse-header"><div class="bpx-player-filter" role="button" tabindex="0">弹幕列表 ⌄</div></div><div class="bui-collapse-body"><div class="bpx-player-dm-wrap"><div class="bpx-player-dm-container">${Array.from({length:32},(_,i)=>`<div class="dm-info-row"><span class="dm-info-time">01:${String(i).padStart(2,'0')}</span><span class="dm-info-dm">さ · Readable danmaku ${i}</span><span class="dm-info-date">05-13 02:19</span></div>`).join('')}</div><div class="bpx-player-dm-btn-history">查看历史弹幕</div></div></div></div></div></div></div></div></div>
    <div class="video-pod"><div class="video-pod__header"><div class="header-bottom"><div class="right"><button class="subscribe-btn subscribed" data-v-172405b0>已订阅</button></div></div></div></div>
  </aside></main>
  <script>
    // Comment elements and CSS contracts from bili-comments bee9afe43a,
    // built 2026-10-22. The real root has no display:block declaration.
    customElements.define('bili-comment-rich-textarea',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block}#input{color:var(--text1);background:var(--bili-comment-textarea-bg,transparent)}</style><div id="input" contenteditable="true">A readable floating comment editor</div>';}});
    customElements.define('bili-comment-box',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block}#editor{background:var(--graph_bg_thin);border:1px solid var(--line_regular);border-radius:6px;padding:12px}</style><div id="editor"><bili-comment-rich-textarea></bili-comment-rich-textarea></div>';}});
    customElements.define('bili-comments-header-renderer',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML='<style>#navbar{display:flex;height:28px;margin-bottom:22px;color:var(--text1)}#count{color:var(--text3)}</style><div id="navbar">评论 <span id="count">1497 · 最热 · 最新</span></div><bili-comment-box></bili-comment-box>';}});
    customElements.define('bili-comment-replies-renderer',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block}#contents{padding:16px 0;color:var(--text1)}.reply-info{color:var(--text3)}</style><div id="contents">看大众生活水平，要看中位数收入。<div class="reply-info">19小时前 · 赞 46 · 回复</div></div>';}});
    customElements.define('bili-comments',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML='<style>:host{-webkit-font-smoothing:antialiased}#contents{padding-top:14px;position:relative}</style><bili-comments-header-renderer></bili-comments-header-renderer><div id="contents">'+Array.from({length:14},()=>'<bili-comment-replies-renderer></bili-comment-replies-renderer>').join('')+'</div>';}});
    document.querySelector('.bui-collapse-header').onclick=()=>{const n=document.querySelector('.bui-collapse-body');n.hidden=!n.hidden;};
    window.teleportEditor=()=>{const root=document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot,box=root.querySelector('bili-comment-box'),r=box.getBoundingClientRect(),wrap=document.createElement('div');wrap.className='bili-comments-bottom-fixed-wrapper';Object.assign(wrap.style,{position:'fixed',bottom:'0',left:r.left+'px',width:r.width+'px',zIndex:'1'});const inner=document.createElement('div');Object.assign(inner.style,{padding:'15px 0',position:'relative',backgroundColor:'var(--bg1)',borderTop:'0.5px solid var(--graph_bg_thick)'});inner.append(box);wrap.append(inner);root.append(wrap);};
  </script></html>`;
}

export async function runNativeWatchChecks({cdp,base,until,screenshots}){
  // Optional one-off verification with the full downloaded official bundle.
  // This uses an isolated test tab and never touches the user's browser.
  if(process.env.BC_TEST_REAL_COMMENT_BUNDLE){
    const probe=await cdp.page(base+'/blank.html');
    await probe.evaluate(await readFile(process.env.BC_TEST_REAL_COMMENT_BUNDLE,'utf8'));
    const native=await probe.evaluate(`(()=>{const n=document.createElement('bili-comments');document.body.append(n);return {defined:!!customElements.get('bili-comments'),display:getComputedStyle(n).display};})()`);
    assert.equal(native.defined,true);assert.equal(native.display,'inline','official root needs a block backing');
    console.log('  Verified official comment bundle: bili-comments defaults to inline');await probe.close();
  }
  const page=await cdp.page(base+'/watch-native.html');await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "video" && !!document.querySelector("bili-comments").shadowRoot');
  const patch=async payload=>{const r=await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})');assert.equal(r.ok,true);await settle(page);await settle(page);};
  const screenshot=async name=>{if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}};
  await patch({enabled:false,minimalistEnabled:false});
  // NANO's native sheet/theme can arrive after the content script.
  const nativeTheme={'bpx-aux-header-bg':'var(--graph_bg_regular)','bpx-aux-content-bg':'var(--bg1)','bpx-aux-header-font':'var(--text1)','bpx-aux-header-icon':'var(--graph_icon)','bpx-aux-content-font1':'var(--text1)','bpx-aux-content-font2':'var(--text2)','bpx-aux-footer-bg':'var(--graph_bg_regular)','bpx-dmsend-main-bg':'var(--bg1)','bpx-dmsend-input-bg':'var(--bg3)','bpx-dmsend-input-font':'var(--text1)'};
  await page.evaluate(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(nativeCSS+'\nhtml{'+Object.entries(nativeTheme).map(([k,v])=>'--'+k+':'+v).join(';')+'}')};document.head.append(s);})()`);
  const snapshot=()=>page.evaluate(`(()=>{
    const read=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {color:s.color,bg:s.backgroundColor,filter:s.backdropFilter,display:s.display,width:r.width,height:r.height};};
    const selectors=['.bpx-docker-minor','.bui-collapse-header','.bpx-player-dm-wrap','.dm-info-dm','.dm-info-time','.bpx-player-dm-btn-history','.bpx-player-video-inputbar','.bpx-player-dm-input','.follow-btn','.subscribe-btn','.bpx-player-video-wrap','.bpx-player-control-wrap','bili-comments'];
    const root=document.querySelector('bili-comments').shadowRoot,header=root.querySelector('bili-comments-header-renderer').shadowRoot;
    return {nodes:Object.fromEntries(selectors.map(s=>[s,read(document.querySelector(s))])),header:read(header.querySelector('#navbar')),count:read(header.querySelector('#count')),reply:read(root.querySelector('bili-comment-replies-renderer').shadowRoot.querySelector('#contents')),fixed:header.querySelector('.bili-comments-bottom-fixed-wrapper')&&read(header.querySelector('.bili-comments-bottom-fixed-wrapper')),fixedInner:header.querySelector('.bili-comments-bottom-fixed-wrapper')&&read(header.querySelector('.bili-comments-bottom-fixed-wrapper > div'))};
  })()`);
  const native=await snapshot();assert.equal(native.nodes['bili-comments'].display,'inline');
  assert.ok(await page.evaluate('document.querySelector("bili-comments").getClientRects().length > 1'),'native host paints disconnected inline fragments around its block children');
  const wallpaper=async color=>{
    const image=await page.evaluate(`(()=>{const c=document.createElement('canvas');c.width=240;c.height=160;const x=c.getContext('2d');x.fillStyle=${JSON.stringify(color)};x.fillRect(0,0,240,160);return c.toDataURL();})()`);
    await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/BACKGROUND",payload:{dataUrl:'+JSON.stringify(image)+',name:"Contrast test"}})');
  };
  await wallpaper('#ffffff');
  await patch({enabled:true,material:'glass',opacity:58,blur:18,textColor:'#ffffff'});
  await until(page,'Number(document.documentElement.style.getPropertyValue("--bc-glass-bg-content").match(/[\\d.]+/g)[3]) > .6');
  await until(page,'!!document.querySelector("bili-comments").shadowRoot.querySelector("bili-comments-header-renderer").shadowRoot.querySelector("style[data-bc-owned]")');
  const dark=await snapshot();
  assert.equal(dark.nodes['.bpx-player-dm-wrap'].bg,'rgba(0, 0, 0, 0)','nested dock content shares its backing without stacked dark tints');
  assert.equal(dark.nodes['bili-comments'].display,'block');assert.ok(dark.nodes['bili-comments'].height>1000,'one host backing covers every reply');
  const rgb=s=>s.match(/[\d.]+/g).map(Number);
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const over=(paint,base)=>{const p=rgb(paint),a=p[3]??1;return p.slice(0,3).map((v,i)=>v*a+base[i]*(1-a));};
  for(const [state,wallpaper] of [[dark,[255,255,255]]]){
    const panel=over(state.nodes['.bpx-docker-minor'].bg,wallpaper);
    for(const selector of ['.dm-info-dm','.dm-info-time','.bpx-player-dm-btn-history'])assert.ok(ratio(rgb(state.nodes[selector].color),panel)>=4.5,selector+' contrast on bright wallpaper');
    const backing=over(state.nodes['bili-comments'].bg,wallpaper);
    for(const key of ['header','count','reply'])assert.ok(ratio(rgb(state[key].color),backing)>=4.5,key+' contrast on bright wallpaper');
    assert.ok(ratio(rgb(state.nodes['.bpx-player-dm-input'].color),over(state.nodes['.bpx-player-video-inputbar'].bg,over(await page.evaluate('getComputedStyle(document.querySelector(".bpx-player-sending-bar")).backgroundColor'),wallpaper)))>=4.5);
  }
  for(const s of ['.follow-btn','.subscribe-btn'])assert.notEqual(dark.nodes[s].bg,native.nodes[s].bg,s+' has a matching themed background');
  for(const s of ['.bpx-player-video-wrap','.bpx-player-control-wrap'])assert.deepEqual(dark.nodes[s],native.nodes[s],s+' stays native');
  await page.evaluate('document.querySelector(".bpx-player-dm-input").focus()');await page.type('さ · native danmaku input');
  assert.equal(await page.evaluate('document.querySelector(".bpx-player-dm-input").value'),'さ · native danmaku input');
  await screenshot('native-watch-list');
  await page.evaluate('document.querySelector(".bui-collapse-header").click()');assert.equal(await page.evaluate('document.querySelector(".bui-collapse-body").hidden'),true);
  await page.evaluate('document.querySelector(".bui-collapse-header").click()');
  // Both docks can be reparented by the player. Their palette travels with them.
  await page.evaluate('document.body.append(document.querySelector(".bpx-docker-minor"))');const moved=await snapshot();assert.equal(moved.nodes['.dm-info-dm'].color,dark.nodes['.dm-info-dm'].color);assert.equal(moved.nodes['.bpx-docker-minor'].bg,dark.nodes['.bpx-docker-minor'].bg);
  await page.evaluate('document.querySelector(".danmaku-wrap").append(document.querySelector(".bpx-docker-minor"));window.scrollTo(0,900);teleportEditor()');await settle(page);await settle(page);
  const fixed=await snapshot();assert.ok(rgb(fixed.fixed.bg)[3]>=.94);assert.equal(fixed.fixedInner.bg,fixed.fixed.bg,'native inline --bg1 backing follows the floating wrapper');
  await screenshot('native-watch-comments');
  const editor=await page.evaluate(`(()=>{const r=document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot;const e=r.querySelector('bili-comment-box').shadowRoot.querySelector('bili-comment-rich-textarea').shadowRoot.querySelector('#input');e.focus();return getComputedStyle(e).color;})()`);assert.equal(editor,'rgb(255, 255, 255)');await page.type(' · editable');
  for(const width of [1024,1440,1920,2560]){await page.resize(width,1100);await settle(page);assert.ok((await snapshot()).nodes['bili-comments'].height>1000);}
  await wallpaper('#000000');await patch({textColor:'#111111'});await until(page,'Number(document.documentElement.style.getPropertyValue("--bc-glass-bg-content").match(/[\\d.]+/g)[3]) > .5');const light=await snapshot();const lightPanel=over(light.nodes['.bpx-docker-minor'].bg,[0,0,0]);assert.ok(ratio(rgb(light.nodes['.dm-info-dm'].color),lightPanel)>=4.5,'dark ink palette has readable contrast');
  await patch({material:'clear'});assert.equal((await snapshot()).nodes['.bpx-docker-minor'].bg,'rgba(0, 0, 0, 0)');
  await page.resize(1652,1100);
  await page.evaluate(`(()=>{const r=document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot;r.append(r.querySelector('bili-comment-box'));r.querySelector('.bili-comments-bottom-fixed-wrapper').remove();window.scrollTo(0,0);})()`);
  await patch({enabled:false});const restored=await snapshot();assert.deepEqual(restored.nodes,native.nodes,'disabling restores native color and dimensions');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS current NANO CSS: actual inputbar/dock classes, contrast, subscribed controls, inline comment host, floating editor, reparenting, native media, Clear and restore');
}
