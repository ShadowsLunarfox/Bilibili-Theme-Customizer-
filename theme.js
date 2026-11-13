/* Page classification and component-scoped CSS; no persistence or DOM writes. */
(() => {
  // CSS-module names retain these component prefixes across asset hash changes.
  const messagePart=(...names)=>`:is(${names.flatMap(name=>[`[class^="_${name}_"]`,`[class*=" _${name}_"]`]).join(',')})`;
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
      layout: ".video-container-v1, .video-container, #bilibili-player, .video-info-container",
      canvas: ".video-container-v1, .video-container, .left-container, .right-container, .video-page-container",
      surfaces: `.video-info-container, .video-toolbar, .video-toolbar-container, .up-panel-container, .up-info-container:not(:where(.up-panel-container *)), .video-pod,
        .base-video-sections-v1, .danmaku-box, .right-container .bui-collapse-wrap, .right-container .bpx-player-dm-wrap,
        .right-container .next-play:not(:has(.video-page-card-small)), .right-container :is(.recommend-list-v1,.recommend-list-pr) .rec-title,
        .video-page-card-small, .video-page-operator-card, .video-desc-container, #v_desc,
        .video-desc, .video-desc-v1, .video-desc-v2, .video-tag-container`,
      inner: ".desc-content, .desc-info, .video-info-detail, .video-info-title"
    },
    message: {
      layout: ".message-layout",
      canvas: "#message-pc-app, .message-layout, .message-main, .message-bg, .message-bgc",
      surfaces: `.message-aside, .message-header, .message-main .message-box-shadow,
        .im-container:not(:where(.message-box-shadow *))`,
      inner: ".message-sidebar, .message-content__wrapper, .message-content__inner"
    },
    space: {
      layout: ".space-main, .space-navbar, .space-header",
      canvas: ".space-main, .space-dynamic, .space-container",
      surfaces: `.space-navbar, .space-main .section-wrap,
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
    .search-popover, .v-popover-content, .vui_popover-content, .user-card-m-exp, .van-dialog, .van-popover,
    .van-popup, .bui-dropdown-items, .bili-mini-content-wp, .ant-modal-content,
    .ant-popover-inner, .ant-dropdown-menu, .el-dialog, .el-popover, .el-dropdown-menu,
    html[data-bc-page="message"] ${messagePart('ContextMenu','Modal','SettingMenu','MsgNotify__MoreDropdown','MsgAppointment__Menu')}`;
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
  // An inset rim preserves border widths. Native panels own their backdrop
  // filters; foreground text, images and player pixels remain unfiltered.
  const material = (level) => `
    background-color: var(--bc-glass-bg-${level}) !important; background-image: none !important;
    border-color: var(--bc-glass-border); border-radius: var(--bc-glass-radius);
    box-shadow: inset 0 0 0 1px var(--bc-glass-border), var(--bc-glass-shadow${level==='light'?'':'-'+level});`;
  const glassMaterial=material('light');
  const floating = popovers;
  // Native flyouts have their own positioned wrapper. They can extend beyond
  // a parent menu and need an independent backing, unlike its in-flow body.
  const submenuSurfaces = '.v-popover .v-popover-content, .v-popover-content.sub-links-item, .vui_popover-content';
  const navigation='.bili-header__bar, .bili-header__channel, .header-channel, .search-header, .search-sticky-header, .search-tabs, .space-navbar, .bili-dyn-list-tabs';
  // These positioned native containers own overflowing menus. Frosting the
  // container itself creates a backdrop root that cuts off a child's blur.
  // A CSS background pseudo-element keeps the frost below the contents without
  // introducing DOM overlays, measurements or scroll/resize synchronization.
  const glassMenuContainers='.bili-header__bar, .v-popover-content';
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
    // Light-DOM comments use their real lists; open shadow lists receive the
    // same CSS material through shadowCSS, with an unfiltered outer host.
    return {light:`${navigation},${toolbarButtons}${page==='message'?', .message-header':''}`,content:`${page==='video'?watchCommentGlass:comments}, ${tools}${content?', '+content:''}`,strong:popovers};
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
    if (hostname === "message.bilibili.com") return "message";
    if (/^\/opus(?:\/|$)/.test(pathname)) return "opus";
    if (/^\/read(?:\/|$)/.test(pathname)) return "article";
    if (/^\/(?:bangumi|anime|guochuang|movie|tv|variety|documentary)(?:\/|$)/.test(pathname)) return "bangumi";
    if (hostname === "t.bilibili.com") return "dynamic";
    if (hostname === "space.bilibili.com") return "space";
    if (hostname === "search.bilibili.com") return "search";
    if (/^\/video(?:\/|$)/.test(pathname)) return "video";
    if (hostname === "live.bilibili.com") return "live";
    // DOM fallback also handles layouts replaced without a route change.
    for (const name of ["message", "dynamic", "space", "search", "opus", "article", "live", "video", "bangumi", "home"]) {
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
  const watch='html[data-bc-enabled="true"][data-bc-page="video"] body';
  const watchComments=`${comments}, .left-container .reply-wrap, .left-container .reply-list, .left-container .comment-list`;
  const watchCommentGlass=`:is(${comments}):not(:has(.reply-list,.comment-list)),
    .left-container :is(.reply-header,.reply-list,.comment-list,.reply-box,.reply-box-wrap)`;
  // NANO injects its theme on html. Override its native auxiliary/sending
  // tokens at the dock instead of relying on individual BUI DOM wrappers.
  // These are separate from the playback/overlay controls' color tokens.
  const watchPlayerPalette=`
    --bpx-dmsend-main-bg: var(--bc-glass-bg-strong);
    --bpx-dmsend-input-bg: var(--bc-input-bg);
    --bpx-dmsend-input-font: var(--bc-foreground);
    --bpx-dmsend-info-font: var(--bc-secondary-color);
    --bpx-dmsend-hint-font: var(--bc-secondary-color);
    --bpx-dmsend-hint-icon: var(--bc-secondary-color);
    --bpx-dmsend-switch-icon: var(--bc-secondary-color);
    --bpx-dmsend-border: var(--bc-glass-border);
    --bpx-dmsend-disable-button-bg: var(--bc-control-bg);
    --bpx-dmsend-disable-button-text: var(--bc-disabled-color);
    --bpx-aux-header-bg: var(--bc-control-bg);
    --bpx-aux-header-font: var(--bc-foreground);
    --bpx-aux-header-icon: var(--bc-secondary-color);
    --bpx-aux-content-bg: transparent;
    --bpx-aux-content-font1: var(--bc-foreground);
    --bpx-aux-content-font2: var(--bc-secondary-color);
    --bpx-aux-content-font3: var(--bc-secondary-color);
    --bpx-aux-content-font4: var(--bc-secondary-color);
    --bpx-aux-content-font5: var(--bc-secondary-color);
    --bpx-aux-footer-bg: var(--bc-control-bg);
    --bpx-aux-footer-font: var(--bc-secondary-color);
    --bpx-aux-footer-font-hover: var(--bc-foreground);
    --bpx-aux-button-bg: var(--bc-input-bg);
    --bpx-aux-button-disabled-bg: var(--bc-control-bg);
    --bpx-aux-float-bg: var(--bc-glass-fallback-bg);
    --bpx-aux-float-hover-bg: var(--bc-hover-bg);
    --bpx-aux-float-icon: var(--bc-secondary-color);
    --bpx-aux-block-icon: var(--bc-secondary-color);
    --bpx-aux-cover-bg: var(--bc-control-bg);
    --bpx-aux-float-border: var(--bc-glass-border);
    --bpx-aux-line-border: var(--bc-glass-border);
    --bpx-aux-input-border: var(--bc-glass-border);`;
  const watchGraphPalette=`
    --graph_bg_thin: var(--bc-control-bg); --graph_bg_regular: var(--bc-input-bg);
    --graph_bg_thick: var(--bc-control-bg); --graph_bg_regular_float: var(--bc-control-bg);
    --graph_weak: var(--bc-control-bg); --graph_medium: var(--bc-hover-bg);
    --graph_icon: var(--bc-secondary-color); --text_link: var(--bc-link-color);`;
  const watchCSS=`
    ${watch} :is(.video-container-v1,.video-container) { ${palette} ${watchGraphPalette} }
    ${watch} .right-container {
      ${palette} ${watchGraphPalette} color: var(--bc-foreground);
      background: transparent !important; box-shadow: none !important;
    }
    ${watch} :is(.bpx-docker,.bpx-player-container,#danmukuBox) { ${watchPlayerPalette} }
    ${watch} .bpx-docker-minor {
      ${watchPlayerPalette} background: var(--bc-glass-bg-strong) !important; color: var(--bc-foreground);
      border-radius: var(--bc-glass-radius); box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    /* One continuous backing for the dock; nested native/profile surfaces
       otherwise compound their tints into an almost opaque black slab. */
    ${watch} .danmaku-box:has(.bpx-docker-minor),
    ${watch} .danmaku-box:has(.bpx-docker-minor) .danmaku-wrap,
    ${watch} .bpx-docker-minor :is(.bpx-player-dm-wrap,.bui-collapse-wrap,.bui-collapse-header,.bui-collapse-body) {
      background: transparent !important; box-shadow: none !important;
    }
    ${watch} .bpx-docker-minor .bpx-player-dm-btn-history { border-radius: 0 0 var(--bc-glass-radius) var(--bc-glass-radius); }
    ${watch} .bpx-player-sending-area::before { background: var(--bc-glass-border) !important; }
    ${watch} .bpx-player-dm-input::placeholder { color: var(--bc-placeholder-color) !important; opacity: 1; }
    ${watch} :where(${watchComments}) {
      ${watchGraphPalette}
      background: var(--bc-glass-bg-strong) !important; border-radius: var(--bc-glass-radius);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border); color: var(--bc-foreground);
    }
    /* The native custom element defaults to inline; its block shadow children
       otherwise paint outside the host's background. */
    ${watch} bili-comments { display: block; }
    ${watch} :where(${watchComments}) :where(${watchComments}) { background: transparent !important; box-shadow: none !important; }
    /* A classic comment mount may only contain the header, or use display:
       contents. Paint the real list when it exists, rather than relying on
       that mount's box. Shadow-root lists retain their host-level backing. */
    ${watch} :where(${watchComments}):has(.reply-list,.comment-list) { background: transparent !important; box-shadow: none !important; }
    ${watch} .left-container :is(.reply-list,.comment-list,.reply-header,.reply-box,.reply-box-wrap) {
      background: var(--bc-glass-bg-strong) !important; border-radius: var(--bc-glass-radius);
    }
    ${watch} .left-container :is(.reply-list,.comment-list) :is(.reply-list,.comment-list) { background: transparent !important; }
    ${watch} :is(${watchComments}) :is(.reply-info,.reply-time,.reply-info button) { color: var(--bc-secondary-color) !important; }
    ${watch} :is(.danmaku-box .bui-collapse-header,.danmaku-box .bui-collapse-body) {
      background: transparent !important; color: var(--bc-foreground) !important;
    }
    ${watch} .right-container :is(.bpx-player-auxiliary-area,.bui-collapse-header,.bui-collapse-body,.bui-list,.bui-list-wrap,.bui-list-item,.bui-list-header) {
      background: transparent !important; color: var(--bc-foreground) !important;
    }
    ${watch} .right-container :is(.bui-collapse-header,.bui-collapse-body):not(:where(.bui-collapse-wrap *,.danmaku-box *)) { background: var(--bc-glass-bg-content) !important; }
    ${watch} .right-container :is(.bpx-player-dm-list,.dm-info-row,.dm-info-dm,.dm-info-time,.dm-info-date) { background: transparent !important; color: var(--bc-foreground) !important; }
    ${watch} .right-container :is(.dm-info-time,.dm-info-date) { color: var(--bc-secondary-color) !important; }
    ${watch} .right-container .bui-list-item:hover { background: var(--bc-hover-bg) !important; }
    ${watch} .right-container :is(.bui-collapse-wrap,.bpx-player-dm-wrap) :is(button,[role="button"],[class^="bpx-player-dm-btn-"]) {
      background: var(--bc-input-bg) !important; color: var(--bc-foreground) !important;
    }
    ${watch} .right-container :is(.next-play,.recommend-header,.rec-title) { color: var(--bc-foreground) !important; text-shadow: var(--bc-text-shadow); }
    ${watch} :is(.video-toolbar-container,.video-toolbar) :is(.video-toolbar-left-item,.video-toolbar-right-item):not(.on):not(.active):not([aria-pressed="true"]) {
      color: var(--bc-secondary-color) !important;
    }
    ${watch} :is(.video-toolbar-container,.video-toolbar) :is(.video-toolbar-left-item,.video-toolbar-right-item):not(.on):not(.active):not([aria-pressed="true"]) :is(svg,path) {
      color: inherit; fill: currentColor;
    }
    ${watch} .video-tag-container :is(.tag,.tag-link,.tag-item) {
      background: var(--bc-control-bg) !important; color: var(--bc-foreground) !important;
      border-radius: var(--bc-control-radius);
      border-color: var(--bc-glass-border); box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    ${watch} .video-tag-container :is(.tag,.tag-link,.tag-item):hover { background: var(--bc-hover-bg) !important; }
    /* Native .tag is a floated wrapper around the rounded .tag-link. Paint
       the link, not the square wrapper, including nested topic/popover tags. */
    ${watch} .video-tag-container :is(.tag,.tag-item):has(.tag-link,.tag-item,.tag) {
      background: transparent !important; border-color: transparent; box-shadow: none;
    }
    ${watch} :is(.video-pod,.base-video-sections-v1) a:not(:where(.active,.on,[aria-current="true"],[aria-current="page"],.active *,.on *)) { color: var(--bc-foreground) !important; }
    ${watch} :is(.video-pod,.base-video-sections-v1) :is(a.active,a.on,a[aria-current="true"],a[aria-current="page"]) { color: var(--brand_blue,#00aeec) !important; }
    ${watch} .recommend-list-v1 .rec-footer {
      background: var(--bc-input-bg) !important; color: var(--bc-foreground) !important;
      box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    /* Only the danmaku sending strip is themed inside the player. Video,
       progress, playback menus and overlaid playback controls stay native. */
    ${watch} .bpx-player-sending-bar {
      background: var(--bc-glass-bg-strong) !important; color: var(--bc-foreground) !important;
    }
    ${watch} .bpx-player-sending-area { background: transparent !important; }
    ${watch} .bpx-player-sending-bar .bpx-player-sending-input { background: var(--bc-input-bg) !important; }
    ${watch} .bpx-player-sending-bar :is(.bui-input,.bui-input-wrap) { background: transparent !important; color: var(--bc-foreground) !important; border-color: var(--bc-glass-border); }
    ${watch} .bpx-player-sending-bar :is(.bui-input-input,.bui-input input,.bui-input textarea) { background: transparent !important; color: var(--bc-foreground) !important; }
    ${watch} .bpx-player-sending-bar :is(.bui-input-input,.bui-input input,.bui-input textarea)::placeholder { color: var(--bc-placeholder-color) !important; }
    ${watch} :is(.bpx-player-sending-input,.bpx-player-sending-input input,.bpx-player-sending-input textarea,.bpx-player-dm-switch) {
      background: transparent !important; color: var(--bc-foreground) !important;
    }
    ${watch} :is(.bpx-player-sending-input,.bpx-player-sending-input input,.bpx-player-sending-input textarea)::placeholder { color: var(--bc-placeholder-color) !important; }
    ${watch} .bpx-player-sending-bar :is(.bpx-player-video-info,.bpx-player-video-info-online,.bpx-player-dm-setting) { color: var(--bc-foreground) !important; }
    ${watch} .bpx-player-sending-bar :is(.bpx-player-dm-switch,.bpx-player-dm-setting) .bui-svg { color: var(--bc-foreground) !important; }
    ${watch} :is(.fixed-nav .nav-item,.fixed-sidenav-storage .fixed-sidenav-item,.fixed-tools > button) {
      background: var(--bc-glass-bg-strong) !important; color: var(--bc-foreground) !important; border-color: var(--bc-glass-border);
    }
    /* Match the homepage's single search shell on the watch page as well. */
    ${watch} .bili-header__bar :is(#nav-searchform,.nav-search-form) {
      background: var(--bc-input-bg) !important; box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    ${watch} .bili-header__bar :is(.center-search__bar:has(#nav-searchform,.nav-search-form),.nav-search-content,.nav-search-input) {
      background: transparent !important; box-shadow: none !important; border-color: transparent !important;
    }
    ${watch} .bili-header__bar :is(#nav-searchform,.nav-search-form):focus-within { outline: 2px solid var(--bc-focus); outline-offset: 2px; }
    ${watch} .bili-header__bar input:focus-visible { outline: none; }
  `;
  const watchLayoutCSS=`
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body :is(.video-info-container,.video-toolbar,.video-toolbar-container,.video-desc-container,.video-tag-container,.up-panel-container) {
      box-sizing: border-box; height: auto; padding: 16px;
    }
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body .video-info-container { padding-inline: 20px; }
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body .video-page-card-small { box-sizing: border-box; padding: 8px; }
    /* Let adjacent block margins collapse to one gap, including older watch
       pages that group the description/tags below the player in a wrapper. */
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body :is(.left-container,.left-container-under-player) > :is(.video-toolbar,.video-toolbar-container,.video-desc-container,.video-tag-container,#v_desc,#v_tag) { margin-block: 12px; }
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body :is(.left-container,.left-container-under-player) > :is(#comment,#commentapp,.comment-container) { margin-top: 12px; }
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body :is(#comment,#commentapp,.comment-container) > bili-comments { margin-top: 0; }
    /* UpInfo is normally inside UpPanel; only standalone variants need their
       own padding. Separate the creator from the next native sidebar module. */
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body .up-info-container:not(:where(.up-panel-container *)) { box-sizing: border-box; height: auto; padding: 16px; }
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body :is(.up-panel-container,.up-info-container:not(:where(.up-panel-container *))) { margin-bottom: 12px; }
    /* The native dock's bottom margin and the next section's top margin add
       across the above-modules wrapper. Let the next section own the gap. */
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body .right-container .danmaku-box { margin-bottom: 0; }
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body .right-container :is(.video-pod,.base-video-sections-v1,.recommend-list-v1,.recommend-list-pr) { margin-top: 12px; }
    /* Native next-play wraps its heading, first card and divider. Frost only
       the heading so that card has the same shell and inset as its siblings. */
    html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"] body .right-container :is(.recommend-list-v1,.recommend-list-pr) .rec-title { box-sizing: border-box; padding: 10px 12px; }
  `;
  const space='html[data-bc-enabled="true"][data-bc-page="space"] body';
  const spaceControls=`.radio-filter__item:not(:is(.active,.is-active,.selected,.is-selected,.radio-filter__item--active,.radio-filter__item--selected,[aria-checked="true"],[aria-selected="true"])),
    .section-wrap__header .vui_button:not(:is([class*="blue"],[class*="pink"],[class*="primary"]))`;
  const spaceGlass='html[data-bc-enabled="true"][data-bc-page="space"][data-bc-material="glass"] body';
  const spaceCSS=`
    /* The avatar overlaps this native banner row. A separate rounded panel
       starts below the avatar and draws an artificial edge through it. Keep
       the banner continuous; only the navigation/content below own panels. */
    ${space} .space-header .upinfo {
      background: transparent !important; border-color: transparent;
      border-radius: 0; box-shadow: none !important;
    }
    /* A fading banner footer supports the identity without boxing the avatar
       into a second card. Its native artwork remains visible above the fade. */
    ${spaceGlass} .space-header .upinfo {
      background: linear-gradient(180deg,transparent 0%,var(--bc-glass-bg-content) 42%,var(--bc-glass-bg-strong) 100%) !important;
    }
    ${spaceGlass} .space-header .header-upinfo { color: var(--bc-foreground); text-shadow: var(--bc-text-shadow); }
    ${spaceGlass} .space-header .header-upinfo :is(.header-name,.nickname,h1) { color: var(--bc-foreground); }
    ${spaceGlass} .space-header .header-upinfo :is(.header-sign,.header-signature,p) { color: var(--bc-secondary-color); }
    ${spaceGlass} .space-header .upinfo :is(.header-avatar-wrap,.header-avatar,.bili-avatar):not(:where(.header-avatar-wrap *,.header-avatar *,.bili-avatar *)) {
      border-radius: 50%; box-shadow: 0 0 0 3px var(--bc-glass-bg-strong),0 6px 20px rgba(0,0,0,.18);
    }
    ${spaceGlass} .space-header .operations .vui_button:not(:is([class*="blue"],[class*="pink"],[class*="primary"])) {
      background: var(--bc-control-bg) !important; color: var(--bc-foreground) !important;
      border-color: var(--bc-glass-border); border-radius: 10px;
      box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    ${spaceGlass} .space-header .operations .vui_button:not(:is([class*="blue"],[class*="pink"],[class*="primary"])):is(:hover,:focus-visible) {
      background: var(--bc-hover-bg) !important; border-color: var(--bc-glass-border-hover);
    }
    ${spaceGlass} .space-navbar {
      background: var(--bc-glass-bg-strong) !important; border-top-color: transparent;
      border-radius: 0 0 var(--bc-glass-radius) var(--bc-glass-radius);
      box-shadow: inset 0 -1px 0 var(--bc-glass-border),0 8px 24px rgba(0,0,0,.10);
    }
    /* Space uses both the site palette and VUI's separate palette. Updating
       only --text1 leaves pale native controls under the new light text. */
    ${space} :is(.space-main,.space-navbar,.space-header .upinfo) {
      ${palette} ${watchGraphPalette}
      --v_bg1: var(--bc-control-bg); --v_bg2: var(--bc-hover-bg); --v_bg3: var(--bc-selected-bg);
      --v_bg1_float: var(--bc-glass-bg-strong); --v_bg2_float: var(--bc-control-bg);
      --v_text1: var(--bc-foreground); --v_text2: var(--bc-secondary-color);
      --v_text3: var(--bc-secondary-color); --v_text4: var(--bc-disabled-color);
      --v_line_regular: var(--bc-glass-border); --v_line_light: var(--bc-glass-border);
      color: var(--bc-foreground);
    }
    ${space} .space-main .section-wrap :is(.section-wrap__header,.section-wrap__content) {
      background: transparent !important; box-shadow: none;
    }
    ${space} .space-main .section-wrap :is(${spaceControls}) {
      background: var(--bc-control-bg) !important; color: var(--bc-foreground) !important;
      border-color: var(--bc-glass-border); text-shadow: var(--bc-text-shadow);
    }
    ${space} .space-main .section-wrap :is(${spaceControls}):is(:hover,:focus-visible):not(:disabled):not([aria-disabled="true"]) {
      background: var(--bc-hover-bg) !important; border-color: var(--bc-glass-border-hover);
    }
    ${space} .space-main .section-wrap :is(${spaceControls}):focus-visible {
      outline: 2px solid var(--bc-focus); outline-offset: 2px;
    }
    ${space} .space-main :is(.top-video__title,.section-wrap__title) { color: var(--bc-foreground) !important; }
    ${space} .space-main :is(.top-video__desc,.top-video__meta) { color: var(--bc-secondary-color) !important; }
    /* A single search shell, matching the homepage. The global input rule
       otherwise paints a second dark rectangle inside the pale native form. */
    ${space} .bili-header__bar :is(#nav-searchform,.nav-search-form) {
      background: var(--bc-input-bg) !important; box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    ${space} .bili-header__bar :is(.center-search__bar:has(#nav-searchform,.nav-search-form),.nav-search-content,.nav-search-input) {
      background: transparent !important; box-shadow: none !important; border-color: transparent !important;
    }
    ${space} .bili-header__bar :is(#nav-searchform,.nav-search-form):focus-within { outline: 2px solid var(--bc-focus); outline-offset: 2px; }
    ${space} .bili-header__bar input:focus-visible { outline: none; }
  `;
  const spaceLayoutCSS=`
    /* Keep the identity within the footer instead of leaving the portrait
       lifted across its edge. The banner's outer footprint stays native. */
    ${spaceGlass} .space-header .upinfo {
      box-sizing: border-box; height: auto; min-height: 112px; padding-block: 16px;
    }
    ${spaceGlass} .space-header :is(.header-upinfo,.upinfo .header-avatar-wrap,.upinfo .header-avatar) { transform: none; }
    /* The native sections are borderless. Once painted as panels their cover,
       heading and controls need an inset, within the existing column width.
       Nested sections keep their own native spacing and share the backing. */
    html[data-bc-enabled="true"][data-bc-page="space"][data-bc-material="glass"] body .space-main .section-wrap:not(:where(.section-wrap *)) {
      box-sizing: border-box; padding: 20px;
    }
  `;
  const message='html[data-bc-enabled="true"][data-bc-page="message"] body';
  const messageOutgoing=messagePart('MsgTextIsMe','MsgUnknownIsMe');
  // Native elements own their glass everywhere. CSS follows layout, visibility
  // and scrolling; no separately positioned or measured paint nodes exist.
  const nativeGlassCSS=Object.keys(profiles).map(name=>{
    const scope=`html[data-bc-enabled="true"][data-bc-page="${name}"][data-bc-material="glass"] body`;
    const groups=surfaceGroups(name),content=`:is(${groups.content}):not(bili-comments)`;
    return Object.entries({content,light:groups.light,strong:groups.strong}).map(([level,targets])=>`
      ${scope} :where(${targets}) {
        backdrop-filter: var(--bc-glass-filter${level==='light'?'':'-'+level});
        -webkit-backdrop-filter: var(--bc-glass-filter${level==='light'?'':'-'+level});
      }
    `).join('\n')+`
      ${scope} :where(${groups.light},${content},${groups.strong}) :where(${content}),
      ${scope} :where(${groups.strong}) :where(${groups.strong}):not(:where(${submenuSurfaces})) {
        backdrop-filter: none; -webkit-backdrop-filter: none;
      }
    `;
  }).join('\n')+`
    html[data-bc-enabled="true"][data-bc-page="home"][data-bc-material="glass"] body :is(${homeVideoInfo}) {
      backdrop-filter: var(--bc-video-info-filter); -webkit-backdrop-filter: var(--bc-video-info-filter);
    }
    html[data-bc-enabled="true"][data-bc-material="glass"] body :is(${glassMenuContainers}) {
      isolation: isolate; backdrop-filter: none; -webkit-backdrop-filter: none;
    }
    html[data-bc-enabled="true"][data-bc-material="glass"] body :is(${glassMenuContainers})::before {
      content: ""; position: absolute; inset: 0; z-index: -1;
      pointer-events: none; border-radius: inherit;
      backdrop-filter: var(--bc-glass-filter-strong); -webkit-backdrop-filter: var(--bc-glass-filter-strong);
    }
    html[data-bc-enabled="true"][data-bc-material="glass"] body .bili-header__bar::before {
      backdrop-filter: var(--bc-glass-filter); -webkit-backdrop-filter: var(--bc-glass-filter);
    }
  `;
  const messageCSS=`
    /* The inbox is a separate app. Its RGB canvas colors and CSS-module chat
       panes otherwise sit above the extension wallpaper as opaque sheets. */
    ${message} .message-layout {
      ${palette} ${watchGraphPalette}
      --line_bold: var(--bc-glass-border-hover); color: var(--bc-foreground);
      scrollbar-color: var(--bc-glass-border-hover) transparent;
    }
    ${message} .message-header { ${material('light')} }
    ${message} .im-container ${messagePart('IM','ChatWindow','MessageList','InfiniteScroll')} {
      background: transparent !important; box-shadow: none;
    }
    ${message} .im-container ${messagePart('ChatFooter')} { background: var(--bc-control-bg); }
    ${message} .message-sidebar__item:is(:hover,:focus-visible) { background: var(--bc-hover-bg); border-radius: var(--bc-control-radius); }
    ${message} .message-sidebar__item.is-active { background: var(--bc-selected-bg); border-radius: var(--bc-control-radius); }
    ${message} .im-container ${messagePart('SessionItemIsActive')} { background: var(--bc-selected-bg) !important; }
    ${message} .im-container :is(${messagePart('SessionItemIsActive')},${messagePart('SessionItem')}:hover) ${messagePart('SessionItem__Message')} { color: var(--bc-foreground); }
    ${message} .im-container ${messagePart('ChatPlaceholder')} p { color: var(--bc-secondary-color) !important; }
    ${message} .im-container ${messagePart('SpinnerItem')}::after { background: var(--bc-secondary-color); }
    /* Bubble paint is a small inset inside the shared chat backing. Avatars,
       attached media, outgoing blue bubbles and sender role colors stay native. */
    ${message} .im-container ${messagePart('MsgText','MsgUnknown')}:not(${messageOutgoing}):not(:where(${messagePart('Msg__ContentUp')} *)),
    ${message} .im-container ${messagePart('MsgShare','MsgNotify')} {
      background: var(--bc-control-bg) !important; color: var(--bc-foreground);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    /* The native rich-text renderer can expose contenteditable display nodes.
       They are message contents, and must not receive the global input frame. */
    ${message} .im-container ${messagePart('MsgText','MsgUnknown','MsgShare','MsgNotify')} :is([contenteditable],${messagePart('RichText','MsgText__Content','MsgText__Tip')}) {
      background: transparent !important; border-color: transparent !important;
      box-shadow: none !important; outline: none !important;
    }
    ${message} .im-container ${messagePart('MsgText__Tip')}:not(:where(${messageOutgoing} *)) { color: var(--bc-secondary-color) !important; }
    ${message} .im-container ${messagePart('MessageSendBox')} :is(textarea,[contenteditable]) {
      background: transparent !important; border-color: transparent !important;
      box-shadow: none !important; outline: none !important;
    }
    ${message} .im-container ${messagePart('ChatFooter')}:focus-within { box-shadow: inset 0 2px 0 var(--bc-focus); }
    ${message} .im-container ${messageOutgoing},
    ${message} .im-container ${messagePart('Msg__ContentUp')} { color: var(--text_white,#fff) !important; }
    ${message} .im-container :is(${messageOutgoing},${messagePart('Msg__ContentUp')}) :is(p,a,${messagePart('RichText','RichText__Link','MsgText__Content','MsgText__Tip')}) {
      color: var(--text_white,#fff) !important;
    }
    ${message} ${messagePart('ContextMenu')} hr { background: var(--bc-glass-border); }
    ${message} ${messagePart('ContextMenu__Option')}:hover { background: var(--bc-hover-bg); }
    /* Match the single search shell on the other themed pages. */
    ${message} .bili-header__bar :is(#nav-searchform,.nav-search-form) {
      background: var(--bc-input-bg) !important; box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    ${message} .bili-header__bar :is(.center-search__bar:has(#nav-searchform,.nav-search-form),.nav-search-content),
    ${message} .bili-header__bar :is(#nav-searchform,.nav-search-form) input {
      background: transparent !important; box-shadow: none !important; border-color: transparent !important;
    }
    ${message} .bili-header__bar :is(#nav-searchform,.nav-search-form):focus-within { outline: 2px solid var(--bc-focus); outline-offset: 2px; }
    ${message} .bili-header__bar input:focus-visible { outline: none; }
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
    ${enabled}[data-bc-material] body :where(${floating}) {
      ${palette} ${watchGraphPalette} ${material('strong')}
      --v_bg1_float: var(--bc-glass-bg-strong); --v_bg2: var(--bc-control-bg); --v_bg3: var(--bc-hover-bg);
      --v_text1: var(--bc-foreground); --v_text2: var(--bc-secondary-color); --v_text3: var(--bc-secondary-color);
      --v_line_regular: var(--bc-glass-border);
      color: var(--bc-foreground, var(--bc-text-color));
    }
    ${enabled} body .v-popover-content > .avatar-panel-popover { background: transparent !important; }
    /* Profile menus can reapply a local native palette. Paint their actionable
       rows directly instead of relying on inherited graph colors. */
    ${enabled} body .avatar-panel-popover :is(.single-link-item,.logout-item),
    ${enabled} body .sub-links-item .single-link-item { color: var(--bc-foreground) !important; }
    ${enabled} body .avatar-panel-popover :is(.single-link-item,.logout-item):is(:hover,:focus-visible),
    ${enabled} body .sub-links-item .single-link-item:is(:hover,:focus-visible) { background: var(--bc-control-bg) !important; }
    ${enabled} body :is(.v-popover-content,.vui_popover-content).sub-links-item {
      background: var(--bc-glass-bg-strong) !important; color: var(--bc-foreground) !important;
      border-color: var(--bc-glass-border); box-shadow: inset 0 0 0 1px var(--bc-glass-border), var(--bc-glass-shadow-strong);
    }
    ${enabled} body :where(${floating}) :is(.vip-entry-containter,.vip-entry-container) { background: var(--bc-control-bg) !important; }
    ${enabled} body :where(${floating}) :is(.vip-entry-desc-subtitle,.avatar-panel-popover .level-item__text) { color: var(--bc-secondary-color) !important; }
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
    @supports not (backdrop-filter: blur(1px)) {
      ${enabled} {
        --bc-glass-bg-light: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-content: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-strong: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-bg: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-filter: none !important;
        --bc-glass-filter: none !important; --bc-glass-filter-content: none !important; --bc-glass-filter-strong: none !important;
      }
    }
    @media (prefers-reduced-transparency: reduce) {
      ${enabled} {
        --bc-glass-bg-light: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-content: var(--bc-glass-fallback-bg) !important;
        --bc-glass-bg-strong: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-bg: var(--bc-glass-fallback-bg) !important;
        --bc-video-info-filter: none !important;
        --bc-glass-filter: none !important; --bc-glass-filter-content: none !important; --bc-glass-filter-strong: none !important;
      }
    }
    /* Header popovers own their native material, including fallback.
       Search inside a floating header and nested popup bodies never blur twice. */
    ${enabled}[data-bc-material] body :where(${allContent},${navigation},${floating}) :where(${allContent}),
    ${enabled}[data-bc-material] body :where(${floating}) :where(${floating}):not(:where(${submenuSurfaces})) {
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
    ${enabled}[data-bc-page="home"] body :is(${homeVideoInfo}) :is(${homeInfoInner}) {
      background: transparent !important; border-color: transparent; border-radius: 0; box-shadow: none !important;
    }
    ${enabled}[data-bc-page="home"] body :is(${homeVideoInfo}) {
      background: var(--bc-video-info-bg) !important; background-image: none !important;
      border-color: transparent; border-radius: 0 0 var(--bc-card-radius) var(--bc-card-radius);
      box-shadow: inset 0 0 0 1px var(--bc-video-info-border);
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
    /* The existing category bar owns its material and native padding. */
    ${enabled}[data-bc-page="home"] body :is(.bili-header__channel,.header-channel) {
      ${glassMaterial} border-radius: var(--bc-category-radius);
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
  ` + watchCSS + watchLayoutCSS + spaceCSS + spaceLayoutCSS + messageCSS + nativeGlassCSS;
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
    :host-context(html[data-bc-enabled="true"][data-bc-page="video"]) { ${watchGraphPalette} }
    :is(#contents, #feed, #commentbox, #editor, #input, .reply-content, .comment-content, .content) {
      color: var(--bc-foreground, var(--bc-text-color)) !important; background-color: transparent !important;
    }
    :is(#comment-text, .rich-text, .text, .user-name) { color: var(--bc-foreground, var(--bc-text-color)) !important; text-shadow: var(--bc-text-shadow); }
    /* Frost the actual block list inside the shadow tree. Floating editors
       retain their native containing block instead of inheriting host frost. */
    :host(bili-comments) { background: transparent !important; box-shadow: none !important; }
    :host(bili-comments) :is(#contents,#feed,#header) { background: var(--bc-glass-bg-content) !important; }
    :host(bili-comments):host-context(html[data-bc-material="glass"]) :is(#contents,#feed,#header) {
      backdrop-filter: var(--bc-glass-filter-content); -webkit-backdrop-filter: var(--bc-glass-filter-content);
    }
    :host(bili-comments) #header:has(> bili-comments-header-renderer) { backdrop-filter: none; -webkit-backdrop-filter: none; }
    /* Paint the real block list, not inline/virtualized thread hosts. Keep the
       outer host clear so the list and header each receive exactly one tint. */
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"]) {
      background: transparent !important; box-shadow: none !important;
    }
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"]) :is(#contents,#header),
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"]) > bili-comments-header-renderer {
      background: var(--bc-glass-bg-strong) !important;
      border-radius: var(--bc-glass-radius);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"]) > bili-comments-header-renderer { display: block; }
    /* The native avatar column already supplies its left gutter. Inset the
       heading separately so the editor and reply avatars retain alignment. */
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) #header,
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) > bili-comments-header-renderer {
      box-sizing: border-box; padding: 16px;
    }
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) #header:has(> bili-comments-header-renderer),
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) > bili-comments-header-renderer { padding-left: 0; }
    :host(bili-comments-header-renderer):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) #navbar { box-sizing: border-box; padding-left: 16px; }
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) #contents { margin-top: 12px; }
    :host(bili-comments) #header > bili-comments-header-renderer { background: transparent !important; box-shadow: none !important; }
    :is(.pubdate, .time, .sub-reply-info, .reply-info) { color: var(--bc-secondary-color) !important; }
    a[href] { color: var(--bc-link-color); }
    :is(textarea, input:not([type]), input[type="text"], [contenteditable="true"], #input) {
      background-color: var(--bc-input-bg) !important; color: var(--bc-foreground, var(--bc-text-color)) !important;
      caret-color: var(--bc-foreground, var(--bc-text-color)); border-color: var(--bc-glass-border-hover);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border);
    }
    :is(input, textarea)::placeholder { color: var(--bc-placeholder-color) !important; opacity: 1; }
    :is(input, textarea, [contenteditable="true"]):focus-visible { outline: 2px solid var(--bc-focus); }
    /* The editor shell, rich-text #input wrapper and actual contenteditable
       are separate nodes. Only the shell owns the field tint and rim. */
    :host(bili-comment-box) #editor {
      background: var(--bc-input-bg) !important; border-color: var(--bc-glass-border);
      box-shadow: inset 0 0 0 1px var(--bc-glass-border); border-radius: var(--bc-control-radius);
    }
    :host(bili-comment-box) #editor:focus-within {
      border-color: transparent; box-shadow: 0 0 0 2px var(--bc-focus);
    }
    :host(bili-comment-box) :is(bili-comment-rich-textarea,bili-comment-textarea) {
      --bili-comment-textarea-bg: transparent;
    }
    :host(bili-comment-rich-textarea) :is(#input,.brt-editor),
    :host(bili-comment-textarea) #input {
      background: transparent !important; box-shadow: none !important; border-color: transparent;
    }
    /* Focus belongs to the rounded shell across the nested shadow roots.
       Standalone editors keep the generic accessible focus indicator. */
    :host(bili-comment-rich-textarea):host-context(bili-comment-box) :is(#input,.brt-editor):focus-visible,
    :host(bili-comment-textarea):host-context(bili-comment-box) #input:focus-visible { outline: none; }
    :host(bili-comment-rich-textarea) .brt-placeholder {
      color: var(--bc-placeholder-color) !important;
    }
    #limit-mask-wall::before { background: linear-gradient(transparent, var(--bc-popup-bg)) !important; }
    #limit-mask-wall::after { background: var(--bc-popup-bg) !important; }
    :host(bili-comments):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) :is(.fixed-reply-box,.fixed-replybox,#fixed-reply-box,#fixedbox) {
      background: var(--bc-glass-fallback-bg) !important;
    }
    :host(bili-comment-box):host-context(html[data-bc-enabled="true"][data-bc-page="video"][data-bc-material="glass"]) {
      background: transparent !important;
    }
    :host-context(html[data-bc-enabled="true"][data-bc-page="video"]) :is(.pubdate,.reply-info,.sub-reply-info) :is(button,a) { color: var(--bc-secondary-color) !important; }
    /* Current comment header teleports the editor into this wrapper on scroll.
       Its inner native element uses --bg1, so keep the backing there as well. */
    :host-context(html[data-bc-enabled="true"][data-bc-page="video"]) .bili-comments-bottom-fixed-wrapper {
      --bg1: var(--bc-glass-fallback-bg); background: var(--bc-glass-fallback-bg) !important;
    }
  `;
  globalThis.BiliThemePage = Object.freeze({ profiles, classify, css, shadowCSS, glassMaterial, navigationCSS, sampleBackdrop,surfaceGroups,submenuSurfaces,homeVideoInfo,homeVideoCover,homeCardLayoutCSS,homeCardSpacingCSS,homeCarouselCSS,watchLayoutCSS,spaceLayoutCSS,nativeGlassCSS,
    watchCommentGlass,layoutSelector: Object.values(profiles).map((p) => p.layout).filter(Boolean).join(", ") });
})();
