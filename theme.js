/* Page classification and component-scoped CSS; no persistence or DOM writes. */
(() => {
  const profiles = Object.freeze({
    home: {
      layout: ".bili-feed4, .bili-feed4-layout, .recommended-container_floor-aside, .bili-header__channel",
      canvas: "#i_cecream, .bili-feed4, .bili-feed4-layout, .feed2, .recommended-container_floor-aside",
      surfaces: ".bili-video-card__info, .video-card__info, .floor-single-card",
      inner: ".bili-video-card__info--bottom, .bili-video-card__info--tit"
    },
    dynamic: {
      layout: ".bili-dyn-home, .bili-dyn-home--member, .bili-dyn-home--visitor, .bili-dyn-publishing",
      canvas: ".bili-dyn-home, .bili-dyn-home--member, .bili-dyn-home--visitor, .bili-dyn-home__main, .bili-dyn-list",
      surfaces: `.bili-dyn-item, .bili-dyn-publishing, .bili-dyn-my-info, .bili-dyn-live-users,
        .bili-dyn-topic-list, .bili-dyn-up-list, .bili-dyn-list-tabs, .bili-dyn-sidebar,
        .bili-dyn-recommend, .bili-dyn-banner`,
      inner: `.bili-dyn-item__main, .bili-dyn-item__header, .bili-dyn-item__body, .bili-dyn-item__footer,
        .bili-dyn-content, .bili-dyn-content__orig, .bili-dyn-publishing__content,
        .bili-dyn-publishing__input, .bili-dyn-publishing__text-area, .bili-dyn-publishing__title,
        .bili-dyn-live-users__container, .bili-dyn-topic-list__container`
    },
    video: {
      layout: ".video-container, #bilibili-player, .video-info-container",
      canvas: ".video-container, .left-container, .right-container, .video-page-container",
      surfaces: `.video-info-container, .video-toolbar, .up-info-container, .video-pod,
        .video-page-card-small, .video-page-operator-card, .video-desc-container, #v_desc,
        .video-desc, .video-desc-v1, .video-desc-v2, .video-tag-container`,
      inner: ".desc-content, .desc-info, .video-info-detail, .video-info-title"
    },
    space: {
      layout: ".space-main, .space-navbar, .space-header",
      canvas: ".space-main, .space-dynamic, .space-container",
      surfaces: `.space-header .upinfo, .space-navbar, .space-main .section-wrap,
        .space-main .home-aside-section, .space-main .space-dynamic-inner,
        .space-main .dynamic-aside-section, .space-main .side-nav,
        .space-main .upload-content, .space-main .subscribe-content, .space-main .space-lists,
        .space-main .relation-aside, .space-main .follow-main, .space-main .login-tip`,
      inner: ".space-main .bili-dyn-item, .space-main .bili-video-card__info, .space-main .video-card__info"
    },
    search: {
      layout: ".search-page, .search-all-list, .search-page-wrapper",
      canvas: ".search-page, .search-page-wrapper, .search-all-list, .search-content, .search-body",
      surfaces: ".search-header, .search-tabs, .search-filter, .search-sticky-header, .bili-video-card__info, .video-item .info, .user-item, .media-item",
      inner: ".search-header .search-input-container, .search-filter .filter-item"
    },
    article: {
      layout: ".article-container, .article-holder, .article-detail",
      canvas: ".article-detail, .article-page, .read-container",
      surfaces: ".article-container, .article-holder, .article-up-info, .article-recommend",
      inner: ".article-container .article-holder, .article-container .article-content"
    },
    opus: {
      layout: ".opus-detail, .opus-module-content, .opus-detail-content",
      canvas: ".opus-detail, .opus-detail-container",
      surfaces: ".opus-detail-content, .opus-module-content, .opus-side, .opus-up-info",
      inner: ".opus-detail-content .opus-module-content, .opus-module-content .bili-rich-text"
    },
    bangumi: {
      layout: ".bangumi-player, .bangumi-info, .bangumi-media, .media-info",
      canvas: ".bangumi-container, .media-container, .bangumi-player, .main-container",
      surfaces: ".media-info, .bangumi-info, .bangumi-media, .season-list, .episode-list, .recommend-list",
      inner: ".media-info .media-desc, .bangumi-info .desc"
    },
    live: {
      layout: "#live-player, .live-room-app",
      canvas: ".live-room-app, .room-bg, .room-background",
      surfaces: ".room-info-ctnr, .chat-history-panel, .chat-control-panel, .aside-area",
      inner: ".chat-history-list"
    },
    other: { layout: "", canvas: "", surfaces: "", inner: "" }
  });
  const players = "#bilibili-player, .bpx-player-container, .bilibili-player, #live-player";
  const protectedNodes = `${players}, :is(${players}) *, svg, svg *, img, picture, video, canvas,
    .iconfont, [class*="iconfont"], .bili-icon, [class*="badge"], [class*="progress"],
    :is([class*="badge"], [class*="progress"]) *,
    .bili-dyn-card-video__cover, .bili-video-card__image, .bili-dyn-item__avatar,
    button, button *, [role="button"], [role="button"] *, [data-bc-owned]`;
  const popovers = `dialog, [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"],
    [role="tooltip"], [popover]:popover-open, .bili-dialog__content, .bili-popup__content,
    .bili-popover__content, .bili-header__popover-content, .bili-dialog:not(:has(.bili-dialog__content)),
    .bili-popup:not(:has(.bili-popup__content)), .bili-popover:not(:has(.bili-popover__content)),
    .bili-header__popover:not(:has(.bili-header__popover-content)), .bili-tooltip, .bili-toast,
    .nav-search-panel, .nav-search-content, .search-panel, .search-suggest, .search-result,
    .search-popover, .v-popover-content, .user-card-m-exp, .van-dialog, .van-popover,
    .van-popup, .bui-dropdown-items, .bili-mini-content-wp, .ant-modal-content,
    .ant-popover-inner, .ant-dropdown-menu, .el-dialog, .el-popover, .el-dropdown-menu`;
  const comments = `.comment-container:not(:has(bili-comments)), #commentapp:not(:has(bili-comments)),
    #comment:not(:has(bili-comments)), .reply-warp:not(:has(bili-comments)),
    .reply-container:not(:has(bili-comments)), bili-comments`;
  const shared = `.bili-header__channel, ${comments}, ${popovers}`;
  const primary = `h1, h2, h3, h4, h5, h6, p, .bili-rich-text, .bili-dyn-content__orig,
    .bili-dyn-title, .bili-dyn-title__text, .bili-dyn-content__text, .bili-dyn-card-video__title,
    .bili-dyn-live-users__title, .bili-dyn-topic-list__title, .bili-dyn-publishing__title,
    .bili-video-card__info--tit, .video-card__info--title, .video-title, .video-info-title,
    .desc-content, .desc-info, .dyn-orig-author__name, .bili-dyn-item__author__name,
    .bili-dyn-item__author__name span, .bili-dyn-live-users__item__uname, .bili-dyn-topic-list__item__name,
    .article-title, .article-content, .opus-module-content, .opus-module-title, .media-title`;
  const secondary = `.bili-dyn-item__time, .bili-dyn-item__author__desc, .bili-dyn-item__desc,
    .bili-dyn-item__footer, .bili-dyn-item__footer__action, .bili-dyn-item__footer__action__text,
    .bili-dyn-card-video__desc, .bili-dyn-live-users__item__desc, .bili-dyn-topic-list__item__desc,
    .bili-video-card__info--author, .bili-video-card__info--date, .video-info-detail,
    .video-card__info--author, .pubdate, .article-meta, .opus-module-author__pub__time`;
  const textInputs = `input:not([type]), input[type="text"], input[type="search"],
    input[type="password"], input[type="email"], input[type="number"], textarea,
    select, [contenteditable="true"], [contenteditable=""]`;
  const palette = `
    --bg1: transparent; --bg2: var(--bc-control-bg); --bg3: rgba(var(--bc-surface-rgb), .3);
    --bg1_float: var(--bc-popup-bg); --bg2_float: var(--bc-control-bg);
    --text1: var(--bc-text-color); --text2: var(--bc-secondary-color);
    --text3: var(--bc-secondary-color); --text4: var(--bc-disabled-color);
    --line_regular: var(--bc-border); --line_light: var(--bc-border);`;

  function classify(url, matches = () => false) {
    const { hostname, pathname } = new URL(url);
    if (/^\/opus(?:\/|$)/.test(pathname)) return "opus";
    if (/^\/read(?:\/|$)/.test(pathname)) return "article";
    if (/^\/(?:bangumi|anime|guochuang|movie|tv|variety|documentary)(?:\/|$)/.test(pathname)) return "bangumi";
    if (hostname === "t.bilibili.com") return "dynamic";
    if (hostname === "space.bilibili.com") return "space";
    if (hostname === "search.bilibili.com") return "search";
    if (/^\/video(?:\/|$)/.test(pathname)) return "video";
    if (hostname === "live.bilibili.com") return "live";
    // DOM fallback also handles layouts replaced without a route change.
    for (const name of ["dynamic", "space", "search", "opus", "article", "live", "video", "bangumi", "home"]) {
      if (matches(profiles[name].layout)) return name;
    }
    return hostname === "www.bilibili.com" && pathname === "/" ? "home" : "other";
  }

  const enabled = 'html[data-bc-enabled="true"]';
  const css = Object.entries(profiles).map(([name, profile]) => {
    const scope = `${enabled}[data-bc-page="${name}"] body`;
    const surfaces = `${shared}${profile.surfaces ? `, ${profile.surfaces}` : ""}`;
    const area = `${scope} :where(${surfaces})`;
    return `
      ${profile.canvas ? `${scope} :is(${profile.canvas}) { background-color: transparent !important; background-image: none !important; }` : ""}
      ${area} {
        ${palette}
        background-color: rgba(var(--bc-surface-rgb), var(--bc-surface-alpha)) !important;
        background-image: none !important;
        -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
        backdrop-filter: blur(var(--bc-blur)) !important;
        color: var(--bc-text-color);
      }
      ${area} :where(${surfaces}) {
        background-color: transparent !important;
        -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
      }
      ${profile.inner ? `${area} :is(${profile.inner}) { background-color: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }` : ""}
      ${area} :where(${primary}):not(:where(${protectedNodes})),
      ${area}:where(${primary}) { color: var(--bc-text-color) !important; }
      ${area} :where(${secondary}):not(:where(${protectedNodes})) { color: var(--bc-secondary-color) !important; }
      ${area} a[href]:not(:where(${protectedNodes})):not(:has(img, svg, video)) { color: var(--bc-link-color); }
      ${area} a[href]:not(:where(${protectedNodes})):not(:has(img, svg, video)):hover { color: var(--bc-link-color); text-decoration: underline; }
      ${area} :is(${textInputs}):not(:where(${players}, :is(${players}) *)) {
        color: var(--bc-text-color) !important; caret-color: var(--bc-text-color);
        background-color: var(--bc-control-bg) !important;
        border-color: var(--bc-border);
      }
      ${area} :is(input, textarea)::placeholder {
        color: var(--bc-placeholder-color) !important; opacity: 1;
      }
      ${area} :is(${textInputs}):focus-visible { outline: 2px solid var(--bc-focus); outline-offset: 2px; }
    `;
  }).join("\n") + `
    ${enabled} { background-color: #101927 !important; }
    ${enabled} body { background-color: transparent !important; background-image: none !important; isolation: isolate !important; }
    ${enabled}:not([data-bc-page="other"]) body > #app,
    ${enabled}:not([data-bc-page="other"]) body > #i_cecream { background-color: transparent !important; }
    ${enabled} #bc-theme-wallpaper {
      all: initial !important; display: block !important; position: fixed !important;
      inset: 0 !important; z-index: -1 !important; pointer-events: none !important;
      background-color: #101927 !important; background-position: center !important;
      background-size: cover !important; background-repeat: no-repeat !important;
    }
    ${enabled} #bc-theme-wallpaper::after {
      content: ""; position: absolute; inset: 0;
      background-color: rgba(var(--bc-surface-rgb), var(--bc-wallpaper-veil));
    }
    ${enabled}[data-bc-coverage="all"] body :is(.bili-header, .bili-header__banner, .home-container) {
      background-color: transparent !important;
    }
    ${enabled}[data-bc-page="dynamic"] .bili-dyn-publishing :is(${textInputs}),
    ${enabled} :is(.reply-box, .reply-box-textarea, .comment-send) :is(${textInputs}) {
      background-color: transparent !important; box-shadow: none;
    }
    ${enabled}[data-bc-page="dynamic"] .bili-dyn-publishing [contenteditable][data-placeholder]:empty::before {
      color: var(--bc-placeholder-color) !important; opacity: 1;
    }
    ${enabled} body :is(${popovers}) {
      background-color: var(--bc-popup-bg) !important; border-color: var(--bc-border);
    }
    ${enabled} body :is(${popovers}) :is(${popovers}) { background-color: transparent !important; }
    ${enabled} body :is(.bili-modal-mask, .bili-dialog-mask, .bili-popup-mask, .bili-mask,
      .v-modal, .ant-modal-mask, .el-overlay, .van-overlay, .login-mask, .bili-mini-mask),
    ${enabled} body dialog::backdrop { background: rgba(4, 9, 18, .4) !important; backdrop-filter: none !important; }
    ${enabled} body :is(.comment-container, #commentapp, #comment, .reply-warp, .reply-container):has(bili-comments) {
      background-color: transparent !important; backdrop-filter: none !important;
    }
    ${enabled} body bili-comments { display: block; }
    ${enabled} body .bili-header__bar { ${palette} background-color: transparent !important; isolation: isolate; }
    ${enabled} body .bili-header__bar .left-entry-main > li > a { color: var(--bc-text-color); }
    ${enabled} body .bili-header__bar :is(.nav-search-form, .nav-search-input) {
      color: var(--bc-text-color); background-color: var(--bc-control-bg) !important;
    }
    ${enabled} body .bili-header__bar .nav-search-input::placeholder { color: var(--bc-placeholder-color); opacity: 1; }
    ${enabled}[data-bc-material="glass"] body .bili-header__bar :is(.v-popover-content, .nav-search-panel, .nav-search-content) {
      -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
    }
    ${enabled} body :is(#bc-theme-header-glass, #bc-theme-channel-glass, .bc-theme-popover-glass) {
      all: initial !important; display: none !important; position: fixed !important;
      box-sizing: border-box !important; pointer-events: none !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important; backdrop-filter: blur(var(--bc-blur)) !important;
      background-color: rgba(var(--bc-surface-rgb), var(--bc-header-alpha)) !important;
    }
    ${enabled} body .bc-theme-popover-glass { background-color: transparent !important; }
    ${enabled}[data-bc-material="clear"] body .bili-header__bar { background-color: transparent !important; }
  `;

  const shadowCSS = `
    :host { ${palette} }
    :host(bili-comments) { background-color: rgba(var(--bc-surface-rgb), var(--bc-surface-alpha)) !important; }
    :is(#contents, #feed, #commentbox, #editor, #input, .reply-content, .comment-content, .content) {
      color: var(--bc-text-color) !important; background-color: transparent !important;
    }
    :is(#comment-text, .rich-text, .text, .user-name) { color: var(--bc-text-color) !important; }
    :is(.pubdate, .time, .sub-reply-info, .reply-info) { color: var(--bc-secondary-color) !important; }
    a[href] { color: var(--bc-link-color); }
    :is(textarea, input:not([type]), input[type="text"], [contenteditable="true"], #input) {
      background-color: transparent !important; color: var(--bc-text-color) !important;
      caret-color: var(--bc-text-color); border-color: var(--bc-border);
    }
    :is(input, textarea)::placeholder { color: var(--bc-placeholder-color) !important; opacity: 1; }
    :is(input, textarea, [contenteditable="true"]):focus-visible { outline: 2px solid var(--bc-focus); }
    #limit-mask-wall::before { background: linear-gradient(transparent, var(--bc-popup-bg)) !important; }
    #limit-mask-wall::after { background: var(--bc-popup-bg) !important; }
  `;
  globalThis.BiliThemePage = Object.freeze({ profiles, classify, css, shadowCSS,
    layoutSelector: Object.values(profiles).map((p) => p.layout).filter(Boolean).join(", ") });
})();
