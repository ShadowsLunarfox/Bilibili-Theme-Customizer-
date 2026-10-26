// Representative public component structures. No live account data or network assets.
const editor = `<section class="bili-dyn-publishing"><input class="bili-dyn-publishing__title" id="title-input" placeholder="标题 / Title">
  <div class="bili-dyn-publishing__content"><div class="bili-dyn-publishing__input">
  <div id="editor" contenteditable="true" data-placeholder="分享你的想法 / Share your thoughts"></div></div></div>
  <div class="bili-dyn-publishing__action"><button id="emoji">☺</button><button id="upload">＋</button>
  <button class="publish-button" id="publish">发布 / Publish</button><button class="publish-button" disabled>Disabled</button></div></section>`;
const card = (classes) => `<section class="${classes}" id="readable-card"><div class="bili-dyn-item__main">
  <h2 id="primary" class="bili-dyn-title__text">跨页面主题 / Cross-page theme</h2>
  <p class="bili-dyn-content__orig">动态正文、链接与图片应保持清晰。 <a id="link" href="#details">Read more</a></p>
  <div id="secondary" class="bili-dyn-item__time">10 分钟前 / 10 minutes ago</div>
  <div class="bili-dyn-content"><div class="bili-dyn-card-video" id="media-cover"><img id="thumbnail" alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='90'%3E%3Crect width='260' height='90' fill='%23b2cddd'/%3E%3C/svg%3E">
  <span id="status" class="status-badge">LIVE</span><span class="progress-track" id="progress"></span></div></div>
  <div class="bili-dyn-item__footer"><span class="bili-dyn-item__footer__action__text">转发 · 评论 · 赞</span>
    <svg class="native-status" id="status-svg" width="14" height="14"><path fill="currentColor" d="M0 0H14V14Z"/></svg>
    <i id="status-icon" class="iconfont native-status">♥</i></div></div></section>`;
const layouts = {
  home: `<main class="bili-feed4"><div class="bili-header__channel">首页频道 / Home</div>${card("bili-video-card__info")}</main>`,
  dynamic: `<main class="bili-dyn-home--member"><aside><section class="bili-dyn-my-info"><h2>我的动态</h2></section>
    <section class="bili-dyn-live-users"><h2 class="bili-dyn-live-users__title">正在直播 / Following</h2><div class="bili-dyn-live-users__item__uname">关注的 UP 主</div></section></aside>
    <div class="bili-dyn-home__main">${editor}${card("bili-dyn-item")}</div>
    <aside><section class="bili-dyn-topic-list"><h2 class="bili-dyn-topic-list__title">热门话题 / Trending</h2><div class="bili-dyn-topic-list__item__name">今日话题</div></section></aside></main>`,
  video: `<main class="video-container">${card("video-desc-container")}<div class="bpx-player-container"><span id="player-control">▶</span><video></video></div></main>`,
  space: `<main class="space-main"><nav class="space-navbar">投稿 · 动态</nav>${card("section-wrap")}</main>`,
  search: `<main class="search-page"><section class="search-header"><input placeholder="搜索 / Search"></section>${card("user-item")}</main>`,
  article: `<main class="article-page">${card("article-container")}</main>`,
  opus: `<main class="opus-detail">${card("opus-detail-content")}<section class="opus-module-content"><p>图文内容</p></section></main>`,
  bangumi: `<main class="bangumi-container">${card("bangumi-info")}<section class="episode-list">选集 / Episodes</section></main>`,
  live: `<main class="live-room-app">${card("room-info-ctnr")}<div id="live-player">Native player</div></main>`,
  other: `<main id="app" style="background:white;color:#18191c"><div id="native-content">Native content remains readable</div></main>`
};

export function compatibilityFixture(name) {
  if (!Object.hasOwn(layouts, name)) throw new Error("Unknown test layout");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root {--bg1:#fff;--text1:#18191c;--text2:#61666d;--text3:#9499a0}
    body {margin:0;background:#f1f2f3;color:var(--text1);font:15px/1.6 Arial,"Microsoft Yahei",sans-serif}
    main {max-width:1120px;margin:90px auto;display:flex;gap:18px;align-items:flex-start}
    main>div {flex:1} aside {width:220px;flex:none} section {background:var(--bg1);padding:20px;border-radius:8px;margin:0 0 16px;max-width:620px;box-sizing:border-box}
    h2 {font-size:18px;margin:0 0 10px} p {margin:10px 0} .bili-dyn-item__main,.bili-dyn-publishing__content {background:var(--bg1)}
    .bili-dyn-title__text {color:var(--text1)} .bili-dyn-item__time {color:var(--text3)}
    input,textarea,[contenteditable] {font:inherit;padding:8px;min-height:32px;border:1px solid #aaa;background:#fff;color:#18191c}
    #editor {min-height:90px;width:100%;box-sizing:border-box} #editor:empty::before {content:attr(data-placeholder);color:#9499a0}
    button {padding:6px 14px;border:1px solid #bbb;border-radius:5px;background:#eee;color:#18191c;cursor:pointer}
    button:hover {filter:brightness(.94)} button:disabled {opacity:.4;cursor:default}
    .publish-button {background:rgb(0,174,236);color:rgb(255,255,255)}
    #media-cover {position:relative;width:260px;background:rgb(31,41,51)} #thumbnail {display:block;width:260px;height:90px}
    #status {position:absolute;right:0;bottom:0;background:rgb(230,30,50);color:rgb(255,255,255);padding:0 4px}
    .native-status {color:rgb(230,30,50)} .progress-track {display:block;width:60%;height:3px;background:rgb(0,174,236)}
    .bpx-player-container {background:black;color:rgb(255,128,0);min-width:260px;min-height:180px}
    .bili-header__bar {position:fixed;top:0;left:0;right:0;height:60px;z-index:1002;display:flex;gap:30px;align-items:center;padding:0 20px}
    .nav-search-panel {position:absolute;top:60px;left:200px;width:280px;display:none}
    .v-popover-content {display:none;position:absolute;right:20px;top:60px;padding:20px;width:200px}
    .bili-dyn-publishing__action {display:flex;gap:8px;margin-top:10px}
  </style><script src="/bridge.js"></script><script src="/settings.js" defer></script>
    <script src="/theme.js" defer></script><script src="/content.js" defer></script></head><body>
    <header class="bili-header__bar"><a href="#home">Bilibili</a><form class="nav-search-form"><input id="search" class="nav-search-input" placeholder="搜索 / Search"></form>
    <button id="menu-toggle">菜单 / Menu</button><div id="menu" class="v-popover-content" role="menu"><p>菜单内容 / Menu</p><input id="menu-input" placeholder="筛选 / Filter"></div></header>
    ${layouts[name]}
    <div id="commentapp"><bili-comments></bili-comments></div>
    <script>
      window.testClicks=0;document.querySelectorAll('button:not(:disabled)').forEach(b=>b.addEventListener('click',()=>window.testClicks++));
      document.querySelector('#menu-toggle').addEventListener('click',()=>{document.querySelector('#menu').style.display='block'});
      document.querySelector('form').addEventListener('submit',e=>e.preventDefault());
      customElements.define('bili-comments',class extends HTMLElement {connectedCallback(){if(!this.shadowRoot)this.attachShadow({mode:'open'}).innerHTML=
        '<style>:host{--bg1:#fff;--text1:#18191c}#contents{background:var(--bg1);color:var(--text1);padding:20px}textarea{background:white}.native-status{color:rgb(230,30,50)}</style><div id="contents"><span id="comment-text">评论 / Comment</span><textarea placeholder="回复 / Reply"></textarea><svg class="native-status" width="10" height="10"><path fill="currentColor" d="M0 0H10V10Z"/></svg></div>'}});
    </script></body></html>`;
}
