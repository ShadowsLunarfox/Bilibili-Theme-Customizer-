/* Page classification and component-scoped CSS; no persistence or DOM writes. */
(() => {
  const profiles = Object.freeze({
    home: {
      layout: ".bili-feed4, .bili-feed4-layout, .recommended-container_floor-aside, .bili-header__channel",
      canvas: "#i_cecream, .bili-feed4, .bili-feed4-layout, .feed2, .recommended-container_floor-aside",
      surfaces: ".bili-video-card__info, .video-card__info",
      inner: ".bili-video-card__info--bottom, .bili-video-card__info--tit"
    },
    dynamic: {
      layout: ".bili-dyn-home, .bili-dyn-home--member, .bili-dyn-home--visitor, .bili-dyn-publishing",
      canvas: ".bili-dyn-home, .bili-dyn-home--member, .bili-dyn-home--visitor, .bili-dyn-home__main, .bili-dyn-list",
      surfaces: `.bili-dyn-item, .bili-dyn-publishing, .bili-dyn-my-info, .bili-dyn-live-users,
        .bili-dyn-topic-list, .bili-dyn-up-list, .bili-dyn-list-tabs, .bili-dyn-sidebar,
        .bili-dyn-recommend`,
      inner: `.bili-dyn-item__main, .bili-dyn-item__header, .bili-dyn-item__body, .bili-dyn-item__footer,
        .bili-dyn-content, .bili-dyn-content__orig, .bili-dyn-publishing__content,
        .bili-dyn-publishing__input, .bili-dyn-publishing__text-area, .bili-dyn-publishing__title,
        .bili-dyn-live-users__container, .bili-dyn-topic-list__container`
    },
    video: {
      layout: ".video-container, #bilibili-player, .video-info-container",
      canvas: ".video-container, .left-container, .right-container, .video-page-container",
      surfaces: `.right-container, .video-info-container, .video-toolbar, .up-info-container, .video-pod,
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
    .nav-search-panel, .search-panel, .search-suggest,
    .search-popover, .v-popover-content, .user-card-m-exp, .van-dialog, .van-popover,
    .van-popup, .bui-dropdown-items, .bili-mini-content-wp, .ant-modal-content,
    .ant-popover-inner, .ant-dropdown-menu, .el-dialog, .el-popover, .el-dropdown-menu`;
  const comments = `.comment-container:not(:has(bili-comments)), #commentapp:not(:has(bili-comments)),
    #comment:not(:has(bili-comments)), .reply-warp:not(:has(bili-comments)),
    .reply-container:not(:has(bili-comments)), bili-comments`;
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
    --bg1: transparent; --bg2: var(--bc-control-bg); --bg3: var(--bc-hover-bg);
    --bg1_float: var(--bc-glass-bg-strong); --bg2_float: var(--bc-control-bg);
    --text1: var(--bc-foreground, var(--bc-text-color)); --text2: var(--bc-secondary-color);
    --text3: var(--bc-secondary-color); --text4: var(--bc-disabled-color);
    --line_regular: var(--bc-glass-border); --line_light: var(--bc-glass-border);`;
  // A painted rim avoids adding border width to native boxes. Background blur
  // lives in owned layers so native containing blocks and media stay untouched.
  const material = (level) => `
    background-color: var(--bc-glass-bg-${level}) !important; background-image: none !important;
    border-color: var(--bc-glass-border); border-radius: var(--bc-glass-radius);
    box-shadow: inset 0 0 0 1px var(--bc-glass-border), var(--bc-glass-shadow${level==='light'?'':'-'+level});`;
  const glassMaterial=material('light');
  const floating = popovers;
  const navigation='.bili-header__bar, .bili-header__channel, .header-channel, .search-header, .search-sticky-header, .search-tabs, .space-navbar, .bili-dyn-list-tabs';
  const tools='.fixed-tool-panel, .float-nav';
  const toolbarButtons=`.palette-button-wrap > button, .palette-button-wrap .watchlater-pip-button-inner,
    .palette-button-wrap .flexible-roll-btn-inner, .palette-button-wrap .flexible-btn-inner,
    .palette-button-wrap .float-button, .palette-button-wrap .top-btn, .palette-button-wrap .roll-btn`;
  const homeCards='.bili-video-card, .bili-live-card, .video-card:has(> .video-card__info)';
  const homeShells=`.bili-video-card > .bili-video-card__wrap, .bili-video-card > .bili-video-card__skeleton,
    .bili-live-card > .bili-live-card__wrap, .bili-live-card > .bili-live-card__skeleton,
    .video-card:has(> .video-card__info), .floor-single-card > .floor-card.single-card > .floor-card-inner`;
  // Direct information children only: wrappers can include media, stretch to a
  // grid row, or contain hidden carousel sizing skeletons.
  const homeVideoInfo=`.bili-video-card > .bili-video-card__wrap > .bili-video-card__info,
    .bili-video-card > .bili-video-card__skeleton > .bili-video-card__skeleton--info,
    .bili-live-card > .bili-live-card__wrap > .bili-live-card__info,
    .bili-live-card > .bili-live-card__skeleton > .bili-live-card__skeleton--info,
    .video-card > .video-card__info,
    .floor-single-card > .floor-card.single-card > .floor-card-inner > .info-container`;
  const homeVideoCover='.bili-video-card__image--wrap, .bili-video-card__skeleton--cover, .bili-live-card__image, .bili-live-card__skeleton--cover, .video-card__image--wrap, .cover-shim';
  const homeInfoInner=`.bili-video-card__info--right, .bili-video-card__info--tit, .bili-video-card__info--bottom,
    .bili-live-card__info--text, .bili-live-card__info--tit, .video-card__info--title`;
  const allContent=[comments,tools,'.bili-video-card__info,.video-card__info',...Object.values(profiles).map(p=>p.surfaces).filter(Boolean)].join(',');
  function surfaceGroups(page) {
    const content=page==='home'?`${homeVideoInfo}, .recommended-swipe .recommended-swipe-body`:profiles[page]?.surfaces;
    return {light:`${navigation},${toolbarButtons}`,content:`${comments},${tools}${content?', '+content:''}`,strong:popovers};
  }
  // Native elements retain every dimension, border width, font metric, layout,
  // overflow rule and breakpoint. Only appearance is changed here.
  function navigationCSS(scope) {
    return `
      ${scope} body .bili-header__bar {
        ${palette} color: var(--bc-foreground, var(--bc-text-color));
        ${glassMaterial}
      }
      ${scope} body .bili-header__bar :where(.left-entry-main,.left-entry,.right-entry) > li > a {
        color: var(--bc-foreground, var(--bc-text-color)); text-shadow: var(--bc-text-shadow);
      }
      ${scope} body .bili-header__bar > a { color: var(--bc-foreground, var(--bc-text-color)); }
      ${scope} body .bili-header__bar :where(.left-entry-main,.left-entry,.right-entry) > li > a:hover { color: var(--bc-link-color); }
      ${scope} body .bili-header__bar :where(.right-entry__outside,.right-entry-text) { color: var(--bc-foreground, var(--bc-text-color)); }
      ${scope} body .bili-header__bar :where(.nav-search-form,.center-search__bar) {
        background: var(--bc-input-bg) !important; border-color: var(--bc-glass-border-hover);
        border-radius: var(--bc-glass-radius); box-shadow: inset 0 0 0 1px var(--bc-glass-border);
      }
      ${scope} body .bili-header__bar .nav-search-content {
        background: transparent !important; box-shadow: none;
      }
      ${scope} body .bili-header__bar :where(.nav-search-form,.nav-search-content) input {
        color: var(--bc-foreground, var(--bc-text-color)); text-shadow: var(--bc-text-shadow);
      }
      ${scope} body .bili-header__bar input::placeholder { color: var(--bc-placeholder-color); }
      ${scope} body .bili-header__bar :where(.nav-search-btn,.nav-search-form > button) {
        background: transparent; color: var(--bc-foreground, var(--bc-text-color)); border-color: transparent;
      }
      ${scope} body :where(.bili-header__channel,.header-channel) { ${palette} color: var(--bc-foreground, var(--bc-text-color)); }
      ${scope} body .bili-header__channel {
        ${glassMaterial}
      }
      ${scope} body :where(.bili-header__channel,.header-channel) :where(
        .channel-icons,.channel-items__left,.channel-items__right,.header-channel-fixed-left,
        .header-channel-fixed-list,.header-channel-fixed-bottom-list,.header-channel-fixed-side-list
      ) { background: transparent !important; box-shadow: none; }
      ${scope} body :where(.bili-header__channel,.header-channel) :where(.channel-link,.channel-link__more,.channel-item) {
        color: var(--bc-foreground, var(--bc-text-color)) !important; text-shadow: var(--bc-text-shadow);
        border-color: transparent; border-radius: 7px; background: transparent !important; box-shadow: none;
      }
      ${scope} body :where(.bili-header__channel,.header-channel) :where(.channel-link,.channel-link__more,.channel-item):hover { background: var(--bc-hover-bg) !important; }
      ${scope} body :where(.bili-header__channel,.header-channel) :where(.channel-link,.channel-link__more,.channel-item):is(.active,[aria-current="page"],[aria-selected="true"]) { background: var(--bc-selected-bg) !important; }
      ${scope} body :where(.bili-header__channel,.header-channel) a { color: var(--bc-foreground, var(--bc-text-color)); }
    `;
  }
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
    return hostname === "www.bilibili.com" && ["/", "/en", "/zh-Hans"].includes(pathname) ? "home" : "other";
  }

  const enabled = 'html[data-bc-enabled="true"]';
  const homeGrid=`${enabled}[data-bc-page="home"] body :is(.recommended-container_floor-aside,.recommended-container_overseas,.feed2) > .container`;
  // Select actual card slots, never the multi-row carousel or its sizing shims.
  const homeCardSlot=`${homeGrid} > :is(.feed-card,.bili-feed-card,.bili-video-card,.bili-live-card,.floor-single-card):has(.bili-video-card__wrap,.bili-video-card__skeleton,.bili-live-card__wrap,.bili-live-card__skeleton,.floor-card.single-card)`;
  const visibleCard=':not(.hide):not(.hidden):not([hidden])';
  const homeCardLayoutCSS=`
    /* Carry the grid track's stretch through each verified block wrapper.
       Intrinsic media/content still size the track; no card height is imposed. */
    ${homeCardSlot}${visibleCard} { align-self: stretch; }
    ${homeCardSlot}${visibleCard},
    ${homeCardSlot} :is(.bili-feed-card,.bili-video-card,.bili-live-card,.floor-single-card,
      .bili-video-card__wrap,.bili-video-card__skeleton,.bili-live-card__wrap,.bili-live-card__skeleton,
      .floor-card.single-card,.floor-card-inner)${visibleCard} {
      display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0;
    }
    ${homeCardSlot} :is(.bili-video-card__wrap,.bili-video-card__skeleton,.bili-live-card__wrap,.bili-live-card__skeleton,.floor-card-inner) > :is(
      .bili-video-card__image--link,.bili-video-card__image--wrap,.bili-video-card__skeleton--cover,
      .bili-live-card__image--link,.bili-live-card__skeleton--cover,.cover-container,.cover-shim) {
      flex: 0 0 auto;
    }
    ${homeCardSlot} :is(.bili-video-card__wrap > .bili-video-card__info,.bili-video-card__skeleton > .bili-video-card__skeleton--info,
      .bili-live-card__wrap > .bili-live-card__info,.bili-live-card__skeleton > .bili-live-card__skeleton--info) {
      flex: 1 0 auto;
    }
    ${homeCardSlot} .bili-live-card__wrap > .bili-live-card__info:has(> .bili-live-card__info--text) { display: flex; }
    ${homeCardSlot} :is(.bili-video-card__info > .bili-video-card__info--right:has(> .bili-video-card__info--bottom),.bili-live-card__info > .bili-live-card__info--text) {
      display: flex; flex-direction: column; justify-content: space-between; flex: 1 1 auto; min-height: 0;
    }
    ${homeCardSlot} .floor-card-inner > .info-container {
      display: flex; flex-direction: column; justify-content: space-between; flex: 1 0 auto;
    }
    /* The native special-card cover is height:100%. Inside a stretched flex
       shell that consumes the entire row and pushes its caption outside it.
       Let the existing ratio shim supply the media height, as on video cards. */
    ${homeCardSlot} .floor-card-inner > .cover-container { height: auto; }
    ${homeCardSlot} :is(.bili-video-card__info--right > .bili-video-card__info--tit,.bili-video-card__info--right > .bili-video-card__info--bottom,
      .bili-live-card__info--text > .bili-live-card__info--tit,.bili-live-card__info--text > .bili-live-card__info--uname,
      .info-container > .title,.info-container > .sub-title) { flex-shrink: 0; }
  `;
  // Caption padding belongs inside the glass, rather than between the cover
  // and an unpadded text block. Restrict this to real feed slots so the
  // carousel's hidden sizing cards retain their native intrinsic dimensions.
  const homeCardSpacingScope=`${enabled}[data-bc-material="glass"][data-bc-page="home"] body :is(.recommended-container_floor-aside,.recommended-container_overseas,.feed2) > .container > :is(.feed-card,.bili-feed-card,.bili-video-card,.bili-live-card,.video-card,.floor-single-card)`;
  const homeCardSpacingCSS=`
    ${homeCardSpacingScope} :is(${homeVideoInfo}) {
      box-sizing: border-box; min-width: 0; margin-top: 0;
      padding: var(--bc-card-info-padding);
    }
    ${homeCardSpacingScope} .floor-card-inner > .cover-container { margin-bottom: 0; }
    /* Live cards use an absolute loaded wrap and an invisible sizing skeleton.
       Put the loaded content in flow so its padded title/uploader can size the
       row, and let the caption grow past the site's one-line fixed height. */
    ${homeCardSpacingScope} :is(.bili-live-card > .bili-live-card__wrap) { position: relative; }
    ${homeCardSpacingScope} :is(.bili-live-card:has(> .bili-live-card__wrap:not(.hide):not([hidden])) > .bili-live-card__skeleton.hide) { display: none; }
    ${homeCardSpacingScope} .bili-live-card__wrap > .bili-live-card__info { height: auto; }
    ${homeCardSpacingScope} .bili-live-card__info--text > .bili-live-card__info--uname { flex-grow: 0; }
  `;
  // Domestic carousel only. Its grid placement is already correct; the native
  // hidden shim omits row 2's information area, leaving the auto-height core
  // shorter than its allocated tracks. Carry that existing stretch inward.
  const homeCarousel=`${enabled}[data-bc-page="home"] body .recommended-container_floor-aside > .container > .recommended-swipe:has(> .recommended-swipe-core > .recommended-swipe-body)`;
  const homeCarouselCSS=`
    ${homeCarousel} { display: flex; flex-direction: column; min-height: 0; }
    ${homeCarousel} > .recommended-swipe-core { flex: 1 1 auto; min-height: 0; }
    /* The body/VUI frames already fill the core. Complete only the missing
       media-height chain; native footer/controls remain over the image. */
    ${homeCarousel} .carousel-area,
    ${homeCarousel} .carousel-area > .carousel-area-img { height: 100%; }
    ${homeCarousel} .carousel-item > .carousel-inner__img { display: block; }
    ${homeCarousel} .carousel-item > .carousel-inner__img > img { object-fit: cover; }
    ${homeCarousel} .carousel-area-img > .extension-tips-v2.using { height: 100%; padding-top: 0; }
  `;
  const css = Object.entries(profiles).map(([name, profile]) => {
    const scope = `${enabled}[data-bc-page="${name}"] body`;
    const surfaces = `${comments}${profile.surfaces ? `, ${profile.surfaces}` : ""}`;
    const area = `${scope} :where(${surfaces})`;
    return `
      ${profile.canvas ? `${scope} :where(${profile.canvas}) { background: transparent !important; }` : ""}
      ${area} {
        ${palette} ${material('content')}
         color: var(--bc-foreground, var(--bc-text-color));
      }
      ${profile.inner ? `${area} :where(${profile.inner}) { background: transparent !important; box-shadow: none; }` : ""}
      ${area} :where(${primary}):not(:where(${protectedNodes})), ${area}:where(${primary}) {
        color: var(--bc-foreground, var(--bc-text-color)) !important; text-shadow: var(--bc-text-shadow);
      }
      ${area} :where(${secondary}):not(:where(${protectedNodes})) { color: var(--bc-secondary-color) !important; text-shadow: var(--bc-text-shadow); }
      ${area} a[href]:not(:where(${protectedNodes})):not(:has(img,svg,video)) { color: var(--bc-link-color); text-shadow: var(--bc-text-shadow); }
      ${area} a[href]:not(:where(${protectedNodes})):hover { text-decoration: underline; }
      ${area} :where(${textInputs}):not(:where(${players}, :is(${players}) *)) {
        color: var(--bc-foreground, var(--bc-text-color)) !important; caret-color: var(--bc-foreground, var(--bc-text-color));
        background: var(--bc-input-bg) !important; border-color: var(--bc-glass-border-hover);
        box-shadow: inset 0 0 0 1px var(--bc-glass-border); text-shadow: var(--bc-text-shadow);
      }
      ${area} :where(input,textarea)::placeholder { color: var(--bc-placeholder-color); opacity: 1; }
      ${area} :where(${textInputs}):focus-visible { outline: 2px solid var(--bc-focus); outline-offset: 2px; }
    `;
  }).join("\n") + navigationCSS(enabled) + homeCardLayoutCSS + homeCardSpacingCSS + homeCarouselCSS + `
    ${enabled} { background-color: #101927; }
    /* The fixed wallpaper is an owned, out-of-flow paint layer. */
    ${enabled} body { background: transparent !important; }
    ${enabled}:not([data-bc-page="other"]) body > :where(#app,#i_cecream) { background: transparent !important; }
    ${enabled} #bc-theme-wallpaper {
      display: block; position: fixed; inset: 0; z-index: -2; pointer-events: none;
      background-color: #101927; background-position: center; background-size: cover; background-repeat: no-repeat;
    }
    ${enabled}[data-bc-coverage="all"] body :where(.bili-header,.home-container) { background-color: transparent !important; }
    ${enabled}[data-bc-material] body :where(${navigation}) { ${palette} ${material('light')} color: var(--bc-foreground, var(--bc-text-color)); }
    ${enabled} body :where(${tools}) { ${palette} ${material('content')} color: var(--bc-foreground, var(--bc-text-color)); }
    /* The toolbar wrapper contains hidden controls and reserved native space.
       Paint the actual button shells, never a continuous rail behind them. */
    ${enabled} body .palette-button-wrap,
    ${enabled} body .palette-button-wrap :is(.storage-box,.storable-items) {
      background: transparent !important; box-shadow: none !important; border-color: transparent;
    }
    ${enabled} body :is(${toolbarButtons}) {
      ${palette} ${material('light')} border-radius: var(--bc-control-radius);
      color: var(--bc-foreground, var(--bc-text-color));
    }
    ${enabled} body :is(${toolbarButtons}):is(:hover,:focus-visible) {
      border-color: var(--bc-glass-border-hover); box-shadow: inset 0 0 0 1px var(--bc-glass-border-hover), var(--bc-glass-shadow);
    }
    ${enabled}[data-bc-material] body :where(${floating}) { ${palette} ${material('strong')} color: var(--bc-foreground, var(--bc-text-color)); }
    ${enabled} body :where(${floating}) :where(input,textarea) {
      color: var(--bc-foreground, var(--bc-text-color)); background: var(--bc-input-bg); border-color: var(--bc-glass-border-hover);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border); text-shadow: var(--bc-text-shadow);
    }
    ${enabled} body :where(${floating}) :where(p,a,li,label,input) { text-shadow: var(--bc-text-shadow); }
    ${enabled}[data-bc-page="dynamic"] .bili-dyn-publishing [contenteditable][data-placeholder]:empty::before {
      color: var(--bc-placeholder-color) !important; text-shadow: var(--bc-text-shadow);
    }
    ${enabled} body :where(.bili-modal-mask,.bili-dialog-mask,.bili-popup-mask,.bili-mask,.v-modal,.ant-modal-mask,.el-overlay,.van-overlay,.login-mask,.bili-mini-mask),
    ${enabled} body dialog::backdrop { background: rgba(0,0,0,.24); }
    ${enabled} body :where(.bili-video-card,.bili-video-card__wrap,.feed-card) {
      background: transparent !important; box-shadow: none;
    }
    ${enabled} body :where(.bili-video-card__info,.video-card__info) { ${material('content')} color: var(--bc-foreground, var(--bc-text-color)); }
    ${enabled} body :where(.bili-video-card__info--tit,.video-card__info--title) a { color: var(--bc-foreground, var(--bc-text-color)) !important; text-shadow: var(--bc-text-shadow); }
    /* Only the native metadata strip receives a localized contrast gradient. */
    ${enabled} body .bili-video-card__stats { background: linear-gradient(transparent,rgba(0,0,0,.5)); color: white; text-shadow: 0 1px 2px rgba(0,0,0,.7); }
    ${enabled} :where(#bc-theme-header-glass,#bc-theme-channel-glass,.bc-theme-popover-glass,.bc-theme-surface-glass) {
      display: none; position: fixed; pointer-events: none; background: transparent;
      backdrop-filter: var(--bc-glass-filter); -webkit-backdrop-filter: var(--bc-glass-filter);
    }
    ${enabled} .bc-theme-surface-glass[data-bc-level="content"] { backdrop-filter: var(--bc-glass-filter-content); -webkit-backdrop-filter: var(--bc-glass-filter-content); }
    /* One measured paint layer per verified information container. Its bounds
       include the native thumbnail/title gap, never the image or grid slot. */
    ${enabled}[data-bc-page="home"] .bc-theme-surface-glass[data-bc-surface-kind="video-info"] {
      background: var(--bc-video-info-bg);
      backdrop-filter: var(--bc-video-info-filter); -webkit-backdrop-filter: var(--bc-video-info-filter);
      box-shadow: inset 0 0 0 1px var(--bc-video-info-border);
    }
    ${enabled} :where(.bc-theme-popover-glass,.bc-theme-surface-glass[data-bc-level="strong"]) { backdrop-filter: var(--bc-glass-filter-strong); -webkit-backdrop-filter: var(--bc-glass-filter-strong); }
    @supports not (backdrop-filter: blur(1px)) {
      ${enabled} {
        --bc-glass-bg-light: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-content: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-strong: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-bg: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-filter: none !important;
      }
      ${enabled} :where(#bc-theme-header-glass,#bc-theme-channel-glass,.bc-theme-popover-glass,.bc-theme-surface-glass) { backdrop-filter: none; -webkit-backdrop-filter: none; }
    }
    @media (prefers-reduced-transparency: reduce) {
      ${enabled} {
        --bc-glass-bg-light: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-content: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-strong: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-bg: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-filter: none !important;
      }
      ${enabled} :where(#bc-theme-header-glass,#bc-theme-channel-glass,.bc-theme-popover-glass,.bc-theme-surface-glass) { backdrop-filter: none; -webkit-backdrop-filter: none; }
    }
    /* Header popovers use independent external material, including fallback.
       Search inside a floating header and nested popup bodies never blur twice. */
    ${enabled}[data-bc-material] body :where(${allContent},${navigation},${floating}) :where(${allContent}),
    ${enabled}[data-bc-material] body :where(${floating}) :where(${floating}) {
      background: transparent !important; box-shadow: none;
    }
    ${enabled} body :where(${textInputs}):not(:where(${players}, :is(${players}) *)) {
      background-color: var(--bc-input-bg) !important; border-color: var(--bc-glass-border-hover);
      color: var(--bc-foreground, var(--bc-text-color)); box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    ${enabled} body :where(${textInputs})::placeholder { color: var(--bc-placeholder-color); opacity: 1; }
    ${enabled} body :where(${textInputs}):focus-visible { outline: 2px solid var(--bc-focus); outline-offset: 2px; border-color: var(--bc-glass-border-hover); }
    ${enabled} body :where(${floating},${tools}):hover { border-color: var(--bc-glass-border-hover); box-shadow: inset 0 0 0 1px var(--bc-glass-border-hover), var(--bc-glass-shadow-strong); }
    ${enabled} body .palette-button-wrap > :where(button,.top-btn,.roll-btn) {
      background-color: var(--bc-input-bg); color: var(--bc-foreground, var(--bc-text-color)); border-color: var(--bc-glass-border);
    }
    ${enabled} body .palette-button-wrap > :where(button,.top-btn,.roll-btn):hover { background-color: var(--bc-hover-bg); border-color: var(--bc-glass-border-hover); }
    /* Native shells and structural information children must not stack tints
       beneath the one information paint layer, including hover/selected states. */
    ${enabled}[data-bc-page="home"] body :where(${homeCards}) {
      ${palette} --graph_bg_regular: var(--bc-skeleton-cover-bg);
      background: transparent !important; box-shadow: none; border-radius: var(--bc-card-radius);
    }
    ${enabled}[data-bc-page="home"] body :is(${homeShells}) {
      ${palette} background: transparent !important; box-shadow: none !important;
      color: var(--bc-foreground, var(--bc-text-color));
    }
    ${enabled}[data-bc-page="home"] body .floor-single-card > .floor-card.single-card {
      ${palette} --graph_bg_regular: var(--bc-skeleton-cover-bg);
      background: transparent !important; border-color: transparent; box-shadow: none;
      color: var(--bc-foreground, var(--bc-text-color));
    }
    ${enabled}[data-bc-page="home"] body .floor-single-card > .floor-card.single-card > .layer {
      background: transparent !important; border-color: transparent; box-shadow: none;
    }
    ${enabled}[data-bc-page="home"] body :is(${homeVideoInfo}),
    ${enabled}[data-bc-page="home"] body :is(${homeVideoInfo}) :is(${homeInfoInner}) {
      background: transparent !important; border-color: transparent; border-radius: 0; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body :is(${homeShells},${homeVideoInfo})::before,
    ${enabled}[data-bc-page="home"] body :is(${homeShells},${homeVideoInfo})::after {
      background: transparent !important; box-shadow: none !important; border-color: transparent;
    }
    ${enabled}[data-bc-page="home"] body :is(.bili-video-card,.bili-live-card) :is(.bili-video-card__skeleton--cover,.bili-video-card__image--wrap,.bili-live-card__skeleton--cover,.bili-live-card__image) {
      background-color: var(--bc-skeleton-cover-bg);
    }
    ${enabled}[data-bc-page="home"] body :is(.bili-video-card,.bili-live-card) :is(.bili-video-card__skeleton--text,.bili-video-card__skeleton--light,.bili-live-card__skeleton--text,.bili-live-card__skeleton--light) {
      background-color: var(--bc-skeleton-line-bg);
    }
    ${enabled}[data-bc-page="home"] body :is(.bili-video-card,.bili-live-card) .loading_animation :is(.bili-video-card__skeleton--cover,.bili-video-card__skeleton--text,.bili-video-card__skeleton--light,.bili-live-card__skeleton--cover,.bili-live-card__skeleton--text,.bili-live-card__skeleton--light)::after {
      background-image: linear-gradient(-45deg,transparent 25%,var(--bc-skeleton-highlight) 45%,transparent 65%);
    }
    /* Native failed/blocked-media placeholders use these variables too. Tint
       their existing state without guessing obfuscated classes or hiding it. */
    ${enabled}[data-bc-page="home"] body .recommended-swipe {
      ${palette} --graph_bg_regular: var(--bc-glass-bg-content); --text4: var(--bc-secondary-color);
    }
    /* Native category padding still reserves exactly the same space. The owned
       material below follows the union of its real groups, not the full wrapper. */
    ${enabled}[data-bc-page="home"] body :is(.bili-header__channel,.header-channel) {
      background: transparent !important; border-color: transparent !important; border-radius: 0; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body :is(.bili-header__channel,.header-channel) :is(.channel-link,.channel-link__more,.channel-item) {
      border-color: transparent !important; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body :is(.bili-header__channel,.header-channel) :is(
      .channel-icons,.right-channel-container,.channel-items__left,.channel-items__right,
      .header-channel-fixed-left,.header-channel-fixed-list,.header-channel-fixed-bottom-list,.header-channel-fixed-side-list
    ) {
      background: transparent !important; border-color: transparent !important; border-radius: 0; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body :is(.bili-header__channel,.header-channel) :is(
      .channel-icons,.right-channel-container,.channel-items__left,.channel-items__right,
      .header-channel-fixed-left,.header-channel-fixed-list,.header-channel-fixed-bottom-list,.header-channel-fixed-side-list
    )::before,
    ${enabled}[data-bc-page="home"] body :is(.bili-header__channel,.header-channel) :is(
      .channel-icons,.right-channel-container,.channel-items__left,.channel-items__right,
      .header-channel-fixed-left,.header-channel-fixed-list,.header-channel-fixed-bottom-list,.header-channel-fixed-side-list
    )::after {
      background: transparent !important; border-color: transparent !important; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body :is(.bili-header__channel,.header-channel) .channel-items__right {
      border-left-color: var(--bc-border) !important;
    }
    ${enabled}[data-bc-page="home"] :is(.bc-theme-surface-glass,#bc-theme-channel-glass)[data-bc-surface-kind="categories"] {
      ${material('light')}
    }
    ${enabled}[data-bc-page="home"] body .recommended-swipe .carousel-footer {
      background: var(--bc-glass-bg-content) !important; color: var(--bc-foreground, var(--bc-text-color)); box-shadow: none;
    }
    ${enabled}[data-bc-page="home"] body .recommended-swipe .carousel-footer-mask {
      background: linear-gradient(transparent,var(--bc-glass-bg-content)) !important;
    }
    ${enabled}[data-bc-page="home"] body .recommended-swipe .carousel-footer :where(p,a,.carousel-footer-title,.carousel-footer-subtitle) {
      color: var(--bc-foreground, var(--bc-text-color)); text-shadow: var(--bc-text-shadow);
    }
    /* Exactly one search shell. Native #nav-searchform and input specificity
       previously left a pale outer form and a dark rectangle behind its text. */
    ${enabled}[data-bc-page="home"] body .bili-header__bar :is(#nav-searchform,.nav-search-form,.center-search__bar:not(:has(#nav-searchform,.nav-search-form))) {
      background: var(--bc-input-bg) !important; border-color: var(--bc-glass-border-hover);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border); color: var(--bc-foreground, var(--bc-text-color));
    }
    ${enabled}[data-bc-page="home"] body .bili-header__bar :is(.center-search__bar:has(#nav-searchform,.nav-search-form),.nav-search-content,.nav-search-input) {
      background: transparent !important; border-color: transparent !important; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body .bili-header__bar :is(#nav-searchform,.nav-search-form) input {
      background: transparent !important; color: var(--bc-foreground, var(--bc-text-color)) !important; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body .bili-header__bar :is(#nav-searchform,.nav-search-form) input::placeholder { color: var(--bc-placeholder-color) !important; }
    ${enabled}[data-bc-page="home"] body .bili-header__bar :is(#nav-searchform,.nav-search-form):focus-within {
      outline: 2px solid var(--bc-focus); outline-offset: 2px; border-color: var(--bc-glass-border-hover);
    }
    ${enabled}[data-bc-page="home"] body .bili-header__bar :is(#nav-searchform,.nav-search-form) input:focus-visible { outline: none; }
    @media (prefers-reduced-motion: no-preference) {
      ${enabled} body :where(.channel-link,.channel-item,.nav-search-form) { transition: background-color .14s ease, border-color .14s ease; }
    }
    @media (prefers-reduced-motion: reduce) { ${enabled} body :where(.channel-link,.channel-item,.nav-search-form) { transition: none; } }
  `;
  async function sampleBackdrop(source) {
    try {
      const image = typeof source === "string" ? new Image() : source;
      if (typeof source === "string") { image.src = source; await image.decode(); }
      const canvas = document.createElement("canvas"); canvas.width = 24; canvas.height = 24;
      const context = canvas.getContext("2d", {willReadFrequently:true});
      context.drawImage(image,0,0,24,24);
      const {data}=context.getImageData(0,0,24,24); const sums=[0,0,0],samples=[];
      for(let i=0;i<data.length;i+=4) if(data[i+3]>128) {
        const rgb=[data[i],data[i+1],data[i+2]];
        for(let c=0;c<3;c++)sums[c]+=rgb[c];
        samples.push(rgb);
      }
      if(!samples.length)return undefined;
      samples.sort((a,b)=>(a[0]*.2126+a[1]*.7152+a[2]*.0722)-(b[0]*.2126+b[1]*.7152+b[2]*.0722));
      // Protect text against bright/dark wallpaper regions as well as its mean.
      return {mean:sums.map(v=>Math.round(v/samples.length)),dark:samples[Math.floor((samples.length-1)*.05)],bright:samples[Math.floor((samples.length-1)*.95)]};
    } catch { return undefined; }
  }
  const shadowCSS = `
    :host { ${palette} }
    :is(#contents, #feed, #commentbox, #editor, #input, .reply-content, .comment-content, .content) {
      color: var(--bc-foreground, var(--bc-text-color)) !important; background-color: transparent !important;
    }
    :is(#comment-text, .rich-text, .text, .user-name) { color: var(--bc-foreground, var(--bc-text-color)) !important; text-shadow: var(--bc-text-shadow); }
    :is(.pubdate, .time, .sub-reply-info, .reply-info) { color: var(--bc-secondary-color) !important; }
    a[href] { color: var(--bc-link-color); }
    :is(textarea, input:not([type]), input[type="text"], [contenteditable="true"], #input) {
      background-color: var(--bc-input-bg) !important; color: var(--bc-foreground, var(--bc-text-color)) !important;
      caret-color: var(--bc-foreground, var(--bc-text-color)); border-color: var(--bc-glass-border-hover);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    :is(input, textarea)::placeholder { color: var(--bc-placeholder-color) !important; opacity: 1; }
    :is(input, textarea, [contenteditable="true"]):focus-visible { outline: 2px solid var(--bc-focus); }
    #limit-mask-wall::before { background: linear-gradient(transparent, var(--bc-popup-bg)) !important; }
    #limit-mask-wall::after { background: var(--bc-popup-bg) !important; }
  `;
  globalThis.BiliThemePage = Object.freeze({ profiles, classify, css, shadowCSS, glassMaterial, navigationCSS, sampleBackdrop,surfaceGroups,homeVideoInfo,homeVideoCover,homeCardLayoutCSS,homeCardSpacingCSS,homeCarouselCSS,
    layoutSelector: Object.values(profiles).map((p) => p.layout).filter(Boolean).join(", ") });
})();
