/* Homepage-only progressive layout. No node replacement, observers, network
   interception, or title/author heuristics. CSS handles newly inserted cards and
   late ad labels automatically; content.js owns lifecycle and SPA detection. */
(() => {
  const BC = globalThis.BiliTheme;
  const scope = 'html[data-bc-minimalist="true"][data-bc-page="home"]';
  const option = key => `${scope}[data-bc-min-options~="${key}"]`;
  const reference = option('reference');
  const liquid = option('liquid');
  const feed = ':is(.recommended-container_floor-aside, .feed2)';
  const grids = ':is(.recommended-container_floor-aside > .container, .recommended-container_floor-aside, .feed2 > .container, .feed2)';
  const cards = ':is(.bili-video-card, .feed-card, .floor-single-card)';
  // Require direct known feed children, so outer layouts and unrelated grids
  // (player, menus, comments, search) never become recommendation grids.
  const grid = `${grids}:has(> :is(.bili-video-card, .feed-card, .recommended-swipe, .floor-single-card))`;
  const adMarkers = ':is(.bili-video-card__info--ad, .bili-video-card__info--creative-ad, .bili-video-card__info--ad-label)';
  const adCard = `:is(.bili-video-card, .floor-single-card):is(.is-ad, [data-is-ad="true"], [data-ad-id]:not([data-ad-id=""])),
    :is(.bili-video-card, .floor-single-card):has(${adMarkers})`;
  // Hide the grid slot itself, not just its interior. Unknown wrappers stay
  // untouched rather than walking ancestors and risking removal of a feed.
  const adSlots = `${adCard},
    .feed-card:has(> :is(.bili-video-card, .floor-single-card):is(.is-ad, [data-is-ad="true"], [data-ad-id]:not([data-ad-id=""]))),
    .feed-card:has(> :is(.bili-video-card, .floor-single-card) ${adMarkers}),
    .feed-card:has(> ${adMarkers})`;
  const unwantedNav = BC.NAV_GROUPS.find(group => group.key === 'topLeft').items
    .filter(entry => !['topHome', 'topAnime', 'topLive'].includes(entry.key))
    .flatMap(entry => [entry.selector, entry.selector.replaceAll(".left-entry-main", ".left-entry")]).join(', ');
  const categoryRules = BC.MINIMALIST_CATEGORIES.map(entry => {
    // Keep the More popover's links intact; only filter the main channel row.
    const selector = entry.selector.replaceAll('.header-channel a.channel-item',
      '.header-channel .header-channel-fixed-list > a.channel-item');
    return `${option('categories')}:not([data-bc-min-categories~="${entry.key}"]) :is(${selector}) { display: none !important; }`;
  }).join('\n');
  // CSS sibling counting excludes explicit ads, including their grid wrappers.
  // Native cards become a compact rail beside the native carousel; nothing is
  // copied, moved, or replaced, and late ad labels update the count automatically.
  const editorialGrid = `${grid}:has(> .recommended-swipe)`;
  const rail = `${editorialGrid} > :nth-child(-n+3 of ${cards}:not(:is(${adSlots})))`;
  const glass = `
    background-color: rgba(var(--bc-surface-rgb), var(--bc-surface-alpha));
    background-image: linear-gradient(135deg, rgba(255,255,255,.26), rgba(255,255,255,0) 48%, rgba(255,255,255,.08)) !important;
    backdrop-filter: blur(var(--bc-blur)) saturate(1.4);
    -webkit-backdrop-filter: blur(var(--bc-blur)) saturate(1.4);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.58), inset 0 -1px 0 var(--bc-border), 0 6px 22px rgba(18,30,50,.045);`;
  const css = `
    /* A standalone mode uses opaque local surfaces for contrast; with the theme
       on, its wallpaper veil and existing material/blur variables remain in use. */
    ${scope} { --bc-min-radius: 10px; --bc-min-panel: rgba(var(--bc-surface-rgb), var(--bc-surface-alpha)); }
    ${scope}:not([data-bc-enabled="true"]) { --bc-min-panel: rgb(var(--bc-surface-rgb)); }
    ${option('ads')} ${feed} :is(${adSlots}),
    ${option('ads')} ${feed} > :is(.bili-feed-ad, .ad-floor-exp),
    ${option('ads')} ${feed} > .container > :is(.bili-feed-ad, .ad-floor-exp) { display: none !important; }
    ${option('banner')} .bili-header > .bili-header__banner { display: none !important; }
    ${option('banner')} .bili-header { height: auto; min-height: 0; }
    ${option('banner')}:not([data-bc-min-options~="nav"]) .bili-header { padding-top: 64px; }
    ${option('carousel')} ${feed} .recommended-swipe { display: none !important; }
    ${option('decorations')} ${feed} :is(.recommended-container__title-decoration, .feed-roll-decoration, .activity-decoration) { display: none !important; }

    /* The original header links, form, avatar and popovers retain their nodes
       and event handlers. Never clip the bar: its menus render outside it. */
    ${option('nav')} .bili-header { padding-top: 56px; }
    ${option('nav')} .bili-header__bar {
      position: fixed; inset: 0 0 auto; width: 100%; box-sizing: border-box;
      height: 56px; min-height: 56px; padding: 0 24px;
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(160px, min(480px, 34vw)) minmax(0, 1fr);
      align-items: center; gap: 16px; z-index: 1002;
      background-color: var(--bc-min-panel) !important;
      color: var(--bc-text-color); box-shadow: none;
    }
    /* Existing theme glass is placed below the bar; do not blur menus twice. */
    ${option('nav')}:not([data-bc-enabled="true"]) .bili-header__bar {
      backdrop-filter: blur(var(--bc-blur)); -webkit-backdrop-filter: blur(var(--bc-blur));
    }
    ${option('nav')} .bili-header__bar :is(.left-entry-main, .left-entry, .right-entry) {
      display: flex; align-items: center; gap: 12px; margin: 0; padding: 0; flex-shrink: 0;
    }
    ${option('nav')} .bili-header__bar .right-entry { margin-left: auto; justify-self: end; }
    ${option('nav')} .bili-header__bar :is(.left-entry-main, .left-entry) > li > a,
    ${option('nav')} .bili-header__bar .right-entry .right-entry-text { color: var(--bc-text-color); }
    ${option('nav')} :is(${unwantedNav}) { display: none !important; }
    ${option('nav')} .bili-header__bar .center-search-container {
      grid-column: 2; width: 100%; min-width: 140px; max-width: 480px; margin-inline: auto;
    }
    ${option('nav')} .bili-header__bar .nav-search-form {
      border-radius: var(--bc-min-radius); box-shadow: none;
      background-color: var(--bc-control-bg); color: var(--bc-text-color);
    }
    ${option('nav')} .bili-header__bar .nav-search-input { color: var(--bc-text-color); }
    ${option('nav')} .bili-header__bar .nav-search-input::placeholder { color: var(--bc-placeholder-color); }
    ${option('nav')} .bili-header__bar :is(.nav-search-panel, .v-popover-content) {
      --bg1: var(--bc-popup-bg); --text1: var(--bc-text-color); --text2: var(--bc-secondary-color);
      color: var(--bc-text-color);
    }
    ${scope}:not([data-bc-enabled="true"])[data-bc-min-options~="nav"] .bili-header__bar :is(.nav-search-panel, .v-popover-content) {
      background-color: var(--bc-popup-bg);
    }

    ${option('categories')} :is(.bili-header__channel, .header-channel) {
      height: auto; min-height: 0; padding-block: 12px; gap: 12px;
    }
    ${option('categories')} .bili-header__channel { display: flex; align-items: center; }
    ${option('categories')} .bili-header__channel .channel-items__left {
      display: flex; flex-wrap: wrap; gap: 8px; margin: 0; flex: 1; width: auto;
    }
    ${option('categories')} .bili-header__channel .channel-items__right { display: none !important; }
    ${option('categories')} .bili-header__channel .channel-icons { display: flex; gap: 8px; }
    ${option('categories')} .bili-header__channel .channel-icons__item { margin: 0; }
    ${option('categories')} :is(.header-channel-fixed-list, .header-channel-fixed-bottom-list) {
      display: flex; flex-wrap: wrap; gap: 8px; height: auto;
    }
    ${option('categories')} :is(.channel-items__left > .channel-link, .channel-link__more,
      .header-channel-fixed-list > .channel-item) {
      box-sizing: border-box; width: auto; min-width: 54px; height: 30px; padding: 4px 12px;
      border: 0; border-radius: 8px; line-height: 22px;
      background-color: var(--bc-min-panel); color: var(--bc-text-color);
    }
    ${categoryRules}

    /* Narrowly targeted feed grids. Native preview overlays and metadata remain. */
    ${option('ads')} ${grid} { grid-auto-flow: row dense; }
    ${option('ads')} ${grid} > ${cards} { grid-area: auto; }
    ${option('grid')} ${grid} {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
      grid-auto-flow: row dense; gap: 24px 18px; align-items: start;
      width: 100%; box-sizing: border-box;
    }
    ${option('grid')} ${grid} > ${cards} {
      min-width: 0; width: auto; margin: 0; grid-area: auto;
    }
    ${option('grid')} ${grid} > .recommended-swipe { grid-column: span 2; grid-row: span 2; min-width: 0; min-height: 0; width: 100%; height: auto; align-self: stretch; }
    ${option('grid')} ${feed} .bili-video-card { border: 0; border-radius: var(--bc-min-radius); box-shadow: none; }
    ${option('grid')} ${feed} .bili-video-card__image--wrap {
      display: block; position: relative; width: 100%; height: auto; padding-top: 0;
      aspect-ratio: 16 / 9; border-radius: var(--bc-min-radius); overflow: hidden;
    }
    ${option('grid')} ${feed} .bili-video-card__image--wrap :is(picture, .bili-video-card__image) { width: 100%; height: 100%; }
    ${option('grid')} ${feed} .bili-video-card__image--wrap img { width: 100%; height: 100%; object-fit: cover; }
    ${option('grid')} ${feed} .bili-video-card__info {
      padding: 10px 6px 8px; border: 0; border-radius: 0 0 var(--bc-min-radius) var(--bc-min-radius);
      background-color: var(--bc-min-panel) !important; box-shadow: none;
      color: var(--bc-text-color);
    }
    ${option('grid')} ${feed} .bili-video-card__info--tit {
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
      overflow: hidden; height: auto; min-height: 42px; max-height: 42px;
      margin: 0 0 6px; font-size: 15px; font-weight: 500; line-height: 21px;
      color: var(--bc-text-color);
    }
    ${option('grid')} ${feed} .bili-video-card__info--tit a { color: inherit; }
    ${option('grid')} ${feed} :is(.bili-video-card__info--author, .bili-video-card__info--date) {
      font-size: 12px; line-height: 18px; color: var(--bc-secondary-color);
    }
    ${option('grid')} ${feed} .bili-video-card__stats { font-size: 12px; }
    ${option('grid')} ${feed} .bili-video-card:hover .bili-video-card__info { outline: 1px solid var(--bc-border); outline-offset: -1px; }
    ${option('toolbar')} .palette-button-wrap { width: 40px; }
    ${option('toolbar')} .palette-button-wrap > :is(.download-entry, .activity-entry, .ad-entry) { display: none !important; }
    ${option('toolbar')} .palette-button-wrap > button { border-radius: 8px; box-shadow: none; }
    @media (min-width: 1600px) {
      ${option('grid')} ${grid} { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    }
    @media (max-width: 1099px) {
      ${option('grid')} ${grid} { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      ${option('nav')} .bili-header__bar { gap: 10px; padding-inline: 12px; }
      ${option('nav')} .bili-header__bar .right-entry { gap: 8px; }
      ${option('nav')} .bili-header__bar .right-entry .right-entry-text { display: none; }
    }
    @media (max-width: 799px) {
      ${option('grid')} ${grid} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; }
      ${option('nav')} .bili-header { padding-top: 100px; }
      ${option('nav')} .bili-header__bar { display: flex; height: 100px; flex-wrap: wrap; align-content: center; gap: 8px; }
      ${option('nav')} .bili-header__bar .center-search-container { order: 3; flex: 1 1 100%; max-width: none; }
      ${option('nav')} .bili-header__bar :is(.left-entry, .left-entry-main, .right-entry) { gap: 6px; }
      ${option('categories')} .bili-header__channel { flex-wrap: wrap; }
    }
    @media (max-width: 479px) {
      ${option('grid')} ${grid} { grid-template-columns: minmax(0, 1fr); }
      ${option('grid')} ${grid} > .recommended-swipe { grid-column: auto; grid-row: auto; aspect-ratio: 16 / 9; }
    }
    /* Reference composition: native hero, airy category strip, feature + rail,
       followed by five-column recommendations. Text/media come from Bilibili. */
    ${reference} { --bc-min-radius: 16px; }
    ${reference} #bc-theme-wallpaper[data-bc-custom="false"] {
      --bc-min-empty-wallpaper: radial-gradient(ellipse at 12% 20%, #fce2eb 0%, transparent 54%),
        radial-gradient(ellipse at 90% 6%, #dce9fa 0%, transparent 55%), linear-gradient(140deg, #f9f9fc, #eef3fa);
    }
    ${reference} .bili-feed4 {
      max-width: 1600px; margin-inline: auto; padding: 24px clamp(20px, 3.8vw, 64px) 48px;
      box-sizing: border-box;
    }
    ${reference}[data-bc-min-options~="nav"] .bili-header { padding-top: 64px; }
    ${reference}[data-bc-min-options~="nav"]:not([data-bc-min-options~="banner"]) .bili-header { padding-top: 0; }
    ${reference}:not([data-bc-min-options~="banner"]) .bili-header > .bili-header__banner {
      height: clamp(250px, 25vw, 380px); min-height: 0;
      background-position: center; background-size: cover;
    }
    ${reference}[data-bc-min-options~="nav"] .bili-header__bar { height: 64px; min-height: 64px; padding-inline: clamp(20px, 3.8vw, 64px); }
    ${reference}[data-bc-min-options~="nav"] .nav-search-form { min-height: 40px; padding-inline: 18px; border: 1px solid var(--bc-border); border-radius: 999px; }
    ${reference}[data-bc-min-options~="nav"] .bili-header__bar :is(.left-entry-main, .left-entry) > .home-page-entry > a { color: var(--bc-accent); }
    ${reference}[data-bc-min-options~="categories"] .bili-header__channel {
      max-width: 1472px; margin: 12px auto 0; padding: 12px 20px; border-radius: 18px;
      width: calc(100% - clamp(40px, 7.6vw, 128px)); box-sizing: border-box; gap: 20px;
    }
    ${reference}[data-bc-min-options~="categories"] .channel-items__left { justify-content: space-between; gap: 6px; }
    ${reference}[data-bc-min-options~="categories"] :is(.channel-items__left > .channel-link, .channel-link__more) {
      flex: 0 0 auto; background-color: transparent; min-width: 0; padding: 5px 10px; border-radius: 999px;
      font-size: 13px; height: 32px; white-space: nowrap;
    }
    ${reference} :is(.channel-link, .channel-icons__item):is(:hover, .active, [aria-current="page"]) {
      background-color: color-mix(in srgb, var(--bc-accent) 13%, transparent);
      color: var(--bc-link-color);
    }
    ${reference}[data-bc-min-options~="grid"] ${grid} { gap: 24px 14px; }
    ${reference}[data-bc-min-options~="grid"] ${feed} .bili-video-card__info { padding: 10px 8px; }
    ${reference}[data-bc-min-options~="grid"] ${feed} .bili-video-card__info--tit { font-size: 14px; font-weight: 500; }
    ${reference} ${feed} :is(.feed-header, .recommended-container__title) { color: var(--bc-text-color); margin-block: 28px 16px; }
    @media (min-width: 1100px) {
      ${reference}[data-bc-min-options~="grid"] ${grid} { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    }
    @media (min-width: 1100px) {
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) ${editorialGrid} {
        grid-template-rows: repeat(3, calc((clamp(240px, 20vw, 300px) - 48px) / 3));
      }
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) ${editorialGrid} > .recommended-swipe {
        grid-column: 1 / span 3; grid-row: 1 / span 3; min-height: 0; aspect-ratio: auto;
        border-radius: 18px; overflow: hidden;
      }
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) ${rail} {
        grid-column: 4 / -1; min-width: 0; align-self: center;
      }
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) :is(${rail}, ${rail} > .bili-video-card, ${rail} .bili-video-card__wrap) {
        display: grid; grid-template-columns: clamp(96px, 9vw, 128px) minmax(0, 1fr); gap: 12px; align-items: center;
      }
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) :is(${rail}.feed-card,
        ${rail}:has(> .bili-video-card__wrap), ${rail} > .bili-video-card:has(> .bili-video-card__wrap)) { display: block; }
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) ${rail} .bili-video-card__info { padding: 6px 8px; }
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) ${rail} .bili-video-card__info--tit { font-size: 13px; line-height: 17px; min-height: 34px; max-height: 34px; margin-bottom: 4px; }
      ${reference}[data-bc-min-options~="grid"]:not([data-bc-min-options~="carousel"]) ${rail} :is(.bili-video-card__info--author, .bili-video-card__info--date) { font-size: 11px; line-height: 14px; }
    }
    /* Liquid material is opt-in, scoped to the homepage and honors Clear mode.
       Header/popup glass uses the existing external layers to avoid double blur. */
    ${liquid}:not([data-bc-enabled="true"])[data-bc-material="glass"] {
      --bc-min-panel: rgba(var(--bc-surface-rgb), max(var(--bc-wallpaper-veil), var(--bc-surface-alpha)));
    }
    ${liquid}[data-bc-material="glass"] #bc-theme-header-glass,
    ${liquid}[data-bc-material="glass"] #bc-theme-channel-glass { ${glass} }
    ${liquid}[data-bc-material="glass"] #bc-theme-header-glass { backdrop-filter: blur(var(--bc-blur)) saturate(1.4) !important; }
    ${liquid}[data-bc-enabled="true"][data-bc-material="glass"] .bili-header__bar { background-color: transparent !important; }
    ${liquid}[data-bc-material="glass"]:not([data-bc-enabled="true"]) .bili-header__bar { ${glass} }
    ${liquid}[data-bc-material="glass"] .bili-header__channel { ${glass} background-color: var(--bc-min-panel) !important; }
    ${liquid}[data-bc-material="glass"] .bili-header__channel :is(.channel-link, .channel-link__more) { backdrop-filter: none; }
    ${liquid}[data-bc-material="glass"][data-bc-min-options~="grid"] ${feed} .bili-video-card__info {
      ${glass}
      background-color: var(--bc-min-panel) !important;
      backdrop-filter: blur(var(--bc-blur)) saturate(1.4) !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) saturate(1.4) !important;
      border-radius: 0 0 var(--bc-min-radius) var(--bc-min-radius);
    }
    ${liquid}[data-bc-material="glass"] .bili-header__bar .nav-search-form {
      background: linear-gradient(135deg, rgba(255,255,255,.34), rgba(255,255,255,.08)), var(--bc-control-bg);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
    }
    ${liquid}[data-bc-material="glass"] .bc-theme-popover-glass {
      ${glass}
      backdrop-filter: blur(var(--bc-blur)) saturate(1.4) !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) saturate(1.4) !important;
    }
    ${liquid}[data-bc-material="glass"] .bili-header__bar :is(.nav-search-panel, .v-popover-content) {
      background-color: var(--bc-min-panel) !important; border-radius: 16px;
    }
    ${liquid}[data-bc-material="glass"] ${feed} .bili-video-card:hover .bili-video-card__info {
      outline: none; box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 8px 24px rgba(18,30,50,.09);
    }
    @media (prefers-reduced-motion: no-preference) {
      ${liquid} ${feed} .bili-video-card__info { transition: box-shadow .18s ease, background-color .18s ease; }
    }
    @media (max-width: 799px) {
      ${reference}[data-bc-min-options~="nav"] .bili-header__bar { height: 100px; min-height: 100px; }
      ${reference}[data-bc-min-options~="nav"][data-bc-min-options~="banner"] .bili-header { padding-top: 100px; }
      ${reference}[data-bc-min-options~="categories"] .bili-header__channel { gap: 8px; padding: 10px 12px; }
      ${reference}[data-bc-min-options~="categories"] .channel-items__left { justify-content: flex-start; }
      ${reference}[data-bc-min-options~="grid"] ${grid} { gap: 20px 12px; }
    }
    @supports not (backdrop-filter: blur(1px)) {
      ${liquid} :is(.bili-header__bar, .bili-header__channel, .bili-video-card__info) { background-color: var(--bc-popup-bg) !important; }
    }
    @media (prefers-reduced-transparency: reduce) {
      ${liquid} { --bc-min-panel: var(--bc-popup-bg); }
      ${liquid} :is(#bc-theme-header-glass, #bc-theme-channel-glass, .bc-theme-popover-glass) { background-color: var(--bc-popup-bg) !important; }
    }
  `;
  function isHome(url, page) {
    const { hostname, pathname } = new URL(url);
    // Explicit Bilibili URL guard prevents stale home DOM after a SPA route
    // transition (and channel pages) from receiving homepage-only rules.
    return page === 'home' && (!/(^|\.)bilibili\.com$/.test(hostname) ||
      (hostname === 'www.bilibili.com' && pathname === '/'));
  }
  function flags(settings) {
    return [['ads', 'minimalistHideAds'], ['banner', 'minimalistHideBanner'],
      ['nav', 'minimalistCompactNav'], ['categories', 'minimalistCompactCategories'],
      ['carousel', 'minimalistHideCarousel'], ['toolbar', 'minimalistToolbar'],
      ['grid', 'minimalistGrid'], ['decorations', 'minimalistHideDecorations'],
      ['reference', 'minimalistReferenceLayout'], ['liquid', 'minimalistLiquidGlass']]
      .filter(([, key]) => settings[key]).map(([flag]) => flag).join(' ');
  }
  globalThis.BiliThemeMinimalist = Object.freeze({ css, isHome, flags });
})();
