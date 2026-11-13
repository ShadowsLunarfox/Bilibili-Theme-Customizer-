import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

const nativeCSS=readFileSync(new URL('./fixtures/watch-native.css',import.meta.url),'utf8');
const editorCSS=readFileSync(new URL('./fixtures/comment-editor.css',import.meta.url),'utf8');
const richEditor=`<style>${editorCSS}</style><div id="input"><div class="brt-root"><div class="brt-placeholder">A readable floating comment editor</div><div class="brt-editor" contenteditable="true"><br></div></div></div>`;
const commentBox=`<style>
  :host{display:flex}#user-avatar{flex-shrink:0;width:80px;height:50px;display:flex;justify-content:center;align-items:center}
  #user-avatar img{width:48px;height:48px;border-radius:50%}#comment-area{position:relative;width:calc(100% - 80px)}#body{width:100%}
  #editor{width:100%;padding:8px 0;border:1px solid var(--line_regular);box-sizing:border-box;border-radius:6px;background:var(--bg3)}
  #editor:hover,#editor.active{background:var(--bg1);border-color:var(--graph_weak)}
  </style><div id="user-avatar"><img alt="Native avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23bf9e79'/%3E%3C/svg%3E"></div>
  <div id="comment-area"><div id="body"><div id="editor"><bili-comment-rich-textarea></bili-comment-rich-textarea></div></div></div>`;
const commentHeader=`<style>
  #navbar{display:flex;align-items:center;height:28px;margin-bottom:22px;color:var(--text1)}#title{display:flex;align-items:center}
  #title h2{margin:0;font-size:20px;font-weight:500}#count{margin:0 30px 0 6px;font-size:13px;color:var(--text3)}
  </style><div id="navbar"><div id="title"><h2>评论</h2><span id="count">1497</span></div><div>最热 · 最新</div></div><bili-comment-box></bili-comment-box>`;

const recommendation=(index)=>`<div class="video-page-card-small"><div class="card-box"><div class="pic-box"><div class="pic loaded" style="background:linear-gradient(135deg,#467a80,#a87158)"></div></div><div class="info"><a class="title" href="#recommendation-${index}">Readable recommendation ${index}: native sidebar spacing</a><div class="upname">Native creator</div><div class="playinfo">29.5万 · 3156</div></div></div></div>`;

export function nativeWatchFixture(){
  return `<!doctype html><html><meta charset="utf-8"><style>
    :root{--bg1:#fff;--bg3:#f1f2f3;--graph_bg_regular:#f1f2f3;--graph_bg_thick:#e3e5e7;--text1:#18191c;--text2:#61666d;--text3:#9499a0;--graph_icon:#61666d;--brand_blue:#00aeec;--line_regular:#e3e5e7}
    body{margin:0;font:15px/1.6 Arial;background:linear-gradient(120deg,#fff,#e5d2b0 45%,#123d3c)}
    .video-container-v1{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;margin:80px 5%}
    .video-info-container{height:80px}.video-info-container h1{font-size:18px;margin:0}
    #playerWrap{margin-top:8px}.bpx-player-container{background:black;color:white}.bpx-player-video-wrap{height:280px;display:grid;place-items:center;background:#203d3b}.bpx-player-control-wrap{height:35px;background:#000;color:white}
    .bpx-player-sending-bar{align-items:center}.bpx-player-video-inputbar{display:flex;align-items:center}.bpx-player-video-inputbar-wrap{flex:1}
    #send{background:#00aeec;color:white;border:0;height:30px}.bui-collapse-body[hidden]{display:none}
    .bpx-player-dm-container{height:390px;overflow:auto}.bpx-player-dm-btn-history{display:block!important}
    .upinfo-btn-panel .follow-btn{border:0;padding:8px 20px;border-radius:6px}.video-pod{margin-top:14px;padding:16px}.subscribe-btn{padding:6px 12px;border:0}
    a{text-decoration:none}.up-info--left{width:48px;height:48px;border-radius:50%;background:#bf9e79}.info .upname{color:var(--text2);font-size:12px}
    .video-container-v1 #comment{margin-top:24px;z-index:0;position:relative}
  </style><script src="/bridge.js"></script><script src="/settings.js"></script><script src="/theme.js"></script><script src="/minimalist.js"></script><script src="/content.js"></script>
  <main class="video-container-v1"><div class="left-container">
    <div class="video-info-container"><h1>Native watch components · 弹幕与评论</h1></div>
    <div id="playerWrap"><div id="bilibili-player"><div class="bpx-docker bpx-docker-major"><div class="bpx-player-container" data-revision="1">
      <div class="bpx-player-video-wrap">Native video area</div><div class="bpx-player-control-wrap">▶ 00:26 / 27:00</div>
      <div class="bpx-player-sending-area"><div class="bpx-player-sending-bar"><span class="bpx-player-video-info">268人正在看</span><div class="bpx-player-video-inputbar"><div class="bpx-player-video-inputbar-wrap"><input class="bpx-player-dm-input" placeholder="发个友善的弹幕见证当下"></div><button id="send">发送</button></div></div></div>
    </div></div></div></div>
    <div class="video-tag-container"><div class="tag-panel"><div class="tag"><a class="tag-link" href="#tag">Windows 11</a></div><div class="tag"><div class="popover-reference"><a class="tag-link" href="#topic">Tiny 11</a></div></div></div></div>
    <div id="comment"><bili-comments></bili-comments></div>
  </div><aside class="right-container">
    <div class="up-panel-container"><div class="up-info-container" data-v-70067303><div class="up-info--left" data-v-70067303></div><div class="up-info--right" data-v-70067303><p>教日语的木子学姐</p><div class="upinfo-btn-panel"><button class="follow-btn following" data-v-f1b16cb6>已关注</button></div></div></div></div>
    <div class="video-pod-above-modules" data-v-17d386a9><div class="video-pod-above-modules__inner" data-v-17d386a9>
    <div id="danmukuBox" class="danmaku-box" data-v-17d386a9><div class="danmaku-wrap" data-v-17d386a9><div class="bpx-docker bpx-docker-minor"><div class="bpx-player-auxiliary" data-revision="1"><div class="bpx-player-collapse"><div class="bui-collapse"><div class="bui-collapse-header"><div class="bpx-player-filter" role="button" tabindex="0">弹幕列表 ⌄</div></div><div class="bui-collapse-body"><div class="bpx-player-dm-wrap"><div class="bpx-player-dm-container">${Array.from({length:32},(_,i)=>`<div class="dm-info-row"><span class="dm-info-time">01:${String(i).padStart(2,'0')}</span><span class="dm-info-dm">さ · Readable danmaku ${i}</span><span class="dm-info-date">05-13 02:19</span></div>`).join('')}</div><div class="bpx-player-dm-btn-history">查看历史弹幕</div></div></div></div></div></div></div></div></div>
    </div></div>
    <div class="video-pod"><div class="video-pod__header"><div class="header-bottom"><div class="right"><button class="subscribe-btn subscribed" data-v-172405b0>已订阅</button></div></div></div></div>
    <div class="recommend-list-v1" data-v-081b3bbd><div class="next-play" data-v-081b3bbd><div class="rec-title" data-v-081b3bbd><span class="title-txt" data-v-081b3bbd>接下来播放</span><div class="continuous-btn"><span class="txt">自动连播</span><input type="checkbox" checked aria-label="自动连播"></div></div>${recommendation(1)}<div class="split-line" data-v-081b3bbd></div></div><div class="rec-list" data-v-081b3bbd>${recommendation(2)}${recommendation(3)}</div></div>
  </aside></main>
  <script>
    // Comment elements and CSS contracts from bili-comments bee9afe43a,
    // built 2026-10-22. The real root has no display:block declaration.
    customElements.define('bili-comment-rich-textarea',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(richEditor)};const editor=this.shadowRoot.querySelector('.brt-editor'),placeholder=this.shadowRoot.querySelector('.brt-placeholder');editor.addEventListener('input',()=>{placeholder.hidden=!!editor.textContent;});}});
    customElements.define('bili-comment-box',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(commentBox)};}});
    customElements.define('bili-comments-header-renderer',class extends HTMLElement{connectedCallback(){if(this.shadowRoot)return;this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(commentHeader)};}});
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
    const read=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {color:s.color,bg:s.backgroundColor,filter:s.backdropFilter,display:s.display,width:r.width,height:r.height,radius:s.borderRadius};};
    const selectors=['.bpx-docker-minor','.bui-collapse-header','.bpx-player-dm-wrap','.dm-info-dm','.dm-info-time','.bpx-player-dm-btn-history','.bpx-player-video-inputbar','.bpx-player-dm-input','.follow-btn','.subscribe-btn','.bpx-player-video-wrap','.bpx-player-control-wrap','bili-comments','.up-panel-container','.up-info-container','.next-play','.rec-title','.next-play .video-page-card-small','.rec-list .video-page-card-small','.pic-box'];
    const root=document.querySelector('bili-comments').shadowRoot,header=root.querySelector('bili-comments-header-renderer').shadowRoot;
    return {nodes:Object.fromEntries(selectors.map(s=>[s,read(document.querySelector(s))])),comments:read(root.querySelector('#contents')),header:read(header.querySelector('#navbar')),count:read(header.querySelector('#count')),reply:read(root.querySelector('bili-comment-replies-renderer').shadowRoot.querySelector('#contents')),fixed:header.querySelector('.bili-comments-bottom-fixed-wrapper')&&read(header.querySelector('.bili-comments-bottom-fixed-wrapper')),fixedInner:header.querySelector('.bili-comments-bottom-fixed-wrapper')&&read(header.querySelector('.bili-comments-bottom-fixed-wrapper > div'))};
  })()`);
  const native=await snapshot();assert.equal(native.nodes['bili-comments'].display,'inline');
  const editorState=()=>page.evaluate(`(()=>{
    const root=document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot;
    const box=root.querySelector('bili-comment-box'),shell=box.shadowRoot.querySelector('#editor');
    const rich=shell.querySelector('bili-comment-rich-textarea').shadowRoot;
    const backing=root.host.parentElement?.id==='header'?root.host.parentElement:root.host;
    const h=backing.getBoundingClientRect(),nav=root.querySelector('#navbar').getBoundingClientRect(),title=root.querySelector('#title').getBoundingClientRect();
    const field=shell.getBoundingClientRect(),avatar=box.shadowRoot.querySelector('#user-avatar img').getBoundingClientRect();
    const read=n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {background:s.backgroundColor,shadow:s.boxShadow,border:s.borderColor,outline:s.outlineStyle,radius:s.borderRadius,width:r.width,height:r.height};};
    return {shell:read(shell),wrapper:read(rich.querySelector('#input')),input:read(rich.querySelector('.brt-editor')),
      placeholder:read(rich.querySelector('.brt-placeholder')),position:getComputedStyle(rich.querySelector('.brt-placeholder')).position,
      hidden:rich.querySelector('.brt-placeholder').hidden,focused:rich.activeElement===rich.querySelector('.brt-editor'),
      gutters:{titleLeft:title.left-h.left,top:nav.top-h.top,right:h.right-field.right,bottom:h.bottom-field.bottom,avatarLeft:avatar.left-h.left}};
  })()`);
  const nativeEditor=await editorState();
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
  const themedEditor=await editorState();
  assert.deepEqual(themedEditor.gutters,{titleLeft:16,top:16,right:16,bottom:16,avatarLeft:nativeEditor.gutters.avatarLeft},'heading/editor clear the rounded corners while native avatars remain aligned');
  // The official component wraps its renderer in #header; some variants mount
  // it directly. Both must have one gutter rather than two nested insets.
  await page.evaluate(`(()=>{const root=document.querySelector('bili-comments').shadowRoot,renderer=root.querySelector('bili-comments-header-renderer'),header=document.createElement('div');header.id='header';renderer.before(header);header.append(renderer);})()`);
  for(const width of [1024,1440,1920,2560]){
    await page.resize(width,1100);await settle(page);await settle(page);
    assert.deepEqual((await editorState()).gutters,themedEditor.gutters,width+' wrapped header has the same insets without shifting avatars');
  }
  await page.resize(1652,1100);await settle(page);await screenshot('native-watch-comment-corners');
  await page.evaluate(`(()=>{const root=document.querySelector('bili-comments').shadowRoot,header=root.querySelector('#header');header.before(header.querySelector('bili-comments-header-renderer'));header.remove();})()`);await settle(page);
  for(const key of ['wrapper','input']){
    assert.equal(themedEditor[key].background,'rgba(0, 0, 0, 0)',key+' adds no second field tint');
    assert.equal(themedEditor[key].shadow,'none',key+' adds no second field rim');
    assert.equal(themedEditor[key].width,nativeEditor[key].width-16,key+' accommodates the requested right gutter');
    assert.equal(themedEditor[key].height,nativeEditor[key].height,key+' retains native height');
  }
  assert.notEqual(themedEditor.shell.background,'rgba(0, 0, 0, 0)','one tinted editor shell');
  assert.equal(themedEditor.position,'absolute','native placeholder stays over the empty field');
  assert.equal(themedEditor.hidden,false);
  const clickPoint=await page.evaluate(`(()=>{const root=document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot;
    const r=root.querySelector('bili-comment-box').shadowRoot.querySelector('bili-comment-rich-textarea').shadowRoot.querySelector('.brt-editor').getBoundingClientRect();return {x:r.left+20,y:r.top+r.height/2};})()`);
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...clickPoint},page.sessionId);
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...clickPoint},page.sessionId);
  await settle(page);
  const checkFocus=async label=>{
    const focused=await editorState();
    assert.equal(focused.focused,true,label+' focuses the real nested editor');
    assert.equal(focused.input.outline,'none',label+' has no square inner focus outline');
    assert.equal(focused.wrapper.outline,'none',label+' has no wrapper outline');
    assert.match(focused.shell.shadow,/0px 0px 0px 2px/,label+' shows one focus ring on the outer shell');
    assert.notEqual(focused.shell.radius,'0px',label+' focus ring follows the rounded shell');
    for(const key of ['shell','wrapper','input']){
      assert.equal(focused[key].width,themedEditor[key].width,label+' keeps '+key+' width');
      assert.equal(focused[key].height,themedEditor[key].height,label+' keeps '+key+' height');
    }
  };
  await checkFocus('Mouse click');await screenshot('native-watch-editor-mouse-focus');
  await page.evaluate('[...document.querySelectorAll(".tag-link")].at(-1).focus()');
  await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9},page.sessionId);
  await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9},page.sessionId);
  await settle(page);await checkFocus('Keyboard Tab');await screenshot('native-watch-editor-keyboard-focus');
  await page.evaluate('document.querySelector(".bpx-player-dm-input").focus()');
  assert.equal((await editorState()).shell.shadow,themedEditor.shell.shadow,'blurring restores the normal field border');
  assert.equal(dark.nodes['bili-comments'].bg,'rgba(0, 0, 0, 0)','outer comments host does not compound list tint');
  assert.notEqual(dark.comments.bg,'rgba(0, 0, 0, 0)','actual block list owns the readable backing');
  const headerBacking=await page.evaluate('(()=>{const n=document.querySelector("bili-comments").shadowRoot.querySelector("bili-comments-header-renderer"),r=n.getBoundingClientRect();return {height:r.height,bg:getComputedStyle(n).backgroundColor};})()');
  assert.ok(headerBacking.height>=themedEditor.shell.height,'header backing contains its block editor');
  assert.notEqual(headerBacking.bg,'rgba(0, 0, 0, 0)','header keeps its own readable backing');
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".tag")).backgroundColor'),'rgba(0, 0, 0, 0)','floated tag wrapper stays clear');
  await until(page,'getComputedStyle(document.querySelector(".tag-link")).borderRadius === "8px"');
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector(".tag-link")).borderRadius'),'8px','actual tag link has a rounded surface');
  assert.notEqual(await page.evaluate('getComputedStyle(document.querySelector(".tag-link")).backgroundColor'),'rgba(0, 0, 0, 0)','nested tag link owns its tint');
  assert.equal(dark.nodes['.up-info-container'].bg,'rgba(0, 0, 0, 0)','nested creator info shares one panel');
  assert.equal(dark.nodes['.next-play'].bg,'rgba(0, 0, 0, 0)','next-play is a section rather than a second card');
  assert.equal(dark.nodes['.next-play .video-page-card-small'].bg,dark.nodes['.rec-list .video-page-card-small'].bg,'first recommendation shares the other cards tint');
  assert.equal(dark.nodes['.next-play .video-page-card-small'].height,dark.nodes['.rec-list .video-page-card-small'].height,'first recommendation shares the other cards padding');
  assert.notEqual(dark.nodes['.rec-title'].bg,'rgba(0, 0, 0, 0)','autoplay heading keeps a readable backing');
  assert.equal(dark.nodes['.bpx-docker-minor'].radius,'16px');
  assert.equal(dark.nodes['.pic-box'].width,native.nodes['.pic-box'].width);assert.equal(dark.nodes['.pic-box'].height,native.nodes['.pic-box'].height);
  assert.equal(dark.nodes['.bpx-player-dm-wrap'].bg,'rgba(0, 0, 0, 0)','nested dock content shares its backing without stacked dark tints');
  assert.equal(dark.nodes['bili-comments'].display,'block');assert.ok(dark.nodes['bili-comments'].height>1000,'block host contains the complete reply list');
  const rgb=s=>s.match(/[\d.]+/g).map(Number);
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const over=(paint,base)=>{const p=rgb(paint),a=p[3]??1;return p.slice(0,3).map((v,i)=>v*a+base[i]*(1-a));};
  for(const [state,wallpaper] of [[dark,[255,255,255]]]){
    const panel=over(state.nodes['.bpx-docker-minor'].bg,wallpaper);
    for(const selector of ['.dm-info-dm','.dm-info-time','.bpx-player-dm-btn-history'])assert.ok(ratio(rgb(state.nodes[selector].color),panel)>=4.5,selector+' contrast on bright wallpaper');
    const backing=over(state.comments.bg,wallpaper);
    for(const key of ['header','count','reply'])assert.ok(ratio(rgb(state[key].color),backing)>=4.5,key+' contrast on bright wallpaper');
    assert.ok(ratio(rgb(state.nodes['.bpx-player-dm-input'].color),over(state.nodes['.bpx-player-video-inputbar'].bg,over(await page.evaluate('getComputedStyle(document.querySelector(".bpx-player-sending-bar")).backgroundColor'),wallpaper)))>=4.5);
  }
  for(const s of ['.follow-btn','.subscribe-btn'])assert.notEqual(dark.nodes[s].bg,native.nodes[s].bg,s+' has a matching themed background');
  for(const s of ['.bpx-player-video-wrap','.bpx-player-control-wrap'])assert.deepEqual(dark.nodes[s],native.nodes[s],s+' stays native');
  await page.evaluate('document.querySelector(".bpx-player-dm-input").focus()');await page.type('さ · native danmaku input');
  assert.equal(await page.evaluate('document.querySelector(".bpx-player-dm-input").value'),'さ · native danmaku input');
  await screenshot('native-watch-list');
  await page.evaluate('document.querySelector(".bui-collapse-header").click()');assert.equal(await page.evaluate('document.querySelector(".bui-collapse-body").hidden'),true);
  await settle(page);await settle(page);
  const gaps=await page.evaluate(`(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();return {creator:box('#danmukuBox').top-box('.up-panel-container').bottom,heading:box('.next-play .video-page-card-small').top-box('.rec-title').bottom,card:box('.rec-list .video-page-card-small').top-box('.next-play .video-page-card-small').bottom,clipped:getComputedStyle(document.querySelector('.bpx-docker-minor')).overflow};})()`);
  assert.equal(gaps.creator,12,'creator and dock have a deliberate gap');assert.equal(gaps.heading,12,'autoplay header is separate from the first card');assert.ok(gaps.card>=12);assert.equal(gaps.clipped,'visible','native dock menus are not clipped by rounded corners');
  await page.evaluate('document.querySelector(".video-pod").hidden=true');await settle(page);await settle(page);
  assert.equal(await page.evaluate('document.querySelector(".rec-title").getBoundingClientRect().top-document.querySelector("#danmukuBox").getBoundingClientRect().bottom'),12,'single-video sidebar does not double the gap below danmaku');
  await screenshot('native-watch-single-video');
  await page.evaluate('document.querySelector(".video-pod").hidden=false');await settle(page);await settle(page);
  await screenshot('native-watch-sidebar');
  await page.evaluate('document.querySelector(".bui-collapse-header").click()');
  // Both docks can be reparented by the player. Their palette travels with them.
  await page.evaluate('document.body.append(document.querySelector(".bpx-docker-minor"))');const moved=await snapshot();assert.equal(moved.nodes['.dm-info-dm'].color,dark.nodes['.dm-info-dm'].color);assert.equal(moved.nodes['.bpx-docker-minor'].bg,dark.nodes['.bpx-docker-minor'].bg);
  await page.evaluate('document.querySelector(".danmaku-wrap").append(document.querySelector(".bpx-docker-minor"));window.scrollTo(0,900);teleportEditor()');await settle(page);await settle(page);
  const fixed=await snapshot();assert.ok(rgb(fixed.fixed.bg)[3]>=.94);assert.equal(fixed.fixedInner.bg,fixed.fixed.bg,'native inline --bg1 backing follows the floating wrapper');
  await screenshot('native-watch-comments');
  const editor=await page.evaluate(`(()=>{const r=document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot;const e=r.querySelector('bili-comment-box').shadowRoot.querySelector('bili-comment-rich-textarea').shadowRoot.querySelector('.brt-editor');e.focus();return getComputedStyle(e).color;})()`);assert.equal(editor,'rgb(255, 255, 255)');await page.type(' · editable');
  assert.equal((await editorState()).hidden,true,'native placeholder hides when typing');
  for(const width of [1024,1440,1920,2560]){await page.resize(width,1100);await settle(page);assert.ok((await snapshot()).nodes['bili-comments'].height>1000);}
  await wallpaper('#000000');await patch({textColor:'#111111'});await until(page,'Number(document.documentElement.style.getPropertyValue("--bc-glass-bg-content").match(/[\\d.]+/g)[3]) > .5');const light=await snapshot();const lightPanel=over(light.nodes['.bpx-docker-minor'].bg,[0,0,0]);assert.ok(ratio(rgb(light.nodes['.dm-info-dm'].color),lightPanel)>=4.5,'dark ink palette has readable contrast');
  await patch({material:'clear'});assert.equal((await snapshot()).nodes['.bpx-docker-minor'].bg,'rgba(0, 0, 0, 0)');
  await page.resize(1652,1100);
  await page.evaluate(`(()=>{const r=document.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer').shadowRoot;r.append(r.querySelector('bili-comment-box'));r.querySelector('.bili-comments-bottom-fixed-wrapper').remove();window.scrollTo(0,0);})()`);
  await patch({enabled:false});const restored=await snapshot();assert.deepEqual(restored.nodes,native.nodes,'disabling restores native color and dimensions');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS current NANO CSS: sidebar shells/spacing, rounded dock, actual inputbar/dock classes, contrast, subscribed controls, inline comment host, floating editor, reparenting, native media, Clear and restore');
}
