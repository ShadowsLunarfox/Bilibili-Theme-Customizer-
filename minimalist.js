/* Appearance and explicit filtering only. Bilibili owns all native geometry.
   Legacy grid/compact-navigation flags remain in storage but cannot set layout. */
(() => {
  const BC=globalThis.BiliTheme;
  const scope='html[data-bc-minimalist="true"][data-bc-page="home"]';
  const option=key=>`${scope}[data-bc-min-options~="${key}"]`;
  const feed=':is(.recommended-container_floor-aside,.feed2)';
  const adMarkers=':is(.bili-video-card__info--ad,.bili-video-card__info--creative-ad,.bili-video-card__info--ad-label)';
  const adCard=`:is(.bili-video-card,.floor-single-card):is(.is-ad,[data-is-ad="true"],[data-ad-id]:not([data-ad-id=""])),
    :is(.bili-video-card,.floor-single-card):has(${adMarkers})`;
  const adSlots=`${adCard},
    .feed-card:has(> :is(.bili-video-card,.floor-single-card):is(.is-ad,[data-is-ad="true"],[data-ad-id]:not([data-ad-id=""]))),
    .feed-card:has(> :is(.bili-video-card,.floor-single-card) ${adMarkers}),
    .feed-card:has(> .bili-feed-card > :is(.bili-video-card,.floor-single-card):is(.is-ad,[data-is-ad="true"],[data-ad-id]:not([data-ad-id=""]))),
    .feed-card:has(> .bili-feed-card > :is(.bili-video-card,.floor-single-card) ${adMarkers}),
    .feed-card:has(> ${adMarkers})`;
  const categoryRules=BC.MINIMALIST_CATEGORIES.map(entry=>{
    const selector=entry.selector.replaceAll('.header-channel a.channel-item','.header-channel .header-channel-fixed-list > a.channel-item');
    return `${option('categories')}:not([data-bc-min-categories~="${entry.key}"]) :is(${selector}) { display: none !important; }`;
  }).join('\n');
  const css=globalThis.BiliThemePage.navigationCSS(`${scope}:not([data-bc-enabled="true"])`) + `
    /* Visibility is the only structural exception, explicitly chosen by the
       user. Hide the registered ad slot itself; native auto-placement fills it. */
    ${option('ads')} ${feed} :is(${adSlots}),
    ${option('ads')} ${feed} > :is(.bili-feed-ad,.ad-floor-exp),
    ${option('ads')} ${feed} > .container > :is(.bili-feed-ad,.ad-floor-exp) { display: none !important; }
    /* Keep the site's banner footprint: its absolute header still needs that
       native space even when the banner artwork is explicitly hidden. */
    ${option('banner')} .bili-header > .bili-header__banner { visibility: hidden !important; }
    ${option('carousel')} ${feed} .recommended-swipe,
    ${option('decorations')} ${feed} :is(.recommended-container__title-decoration,.feed-roll-decoration,.activity-decoration),
    ${option('toolbar')} .palette-button-wrap > :is(.download-entry,.activity-entry,.ad-entry) { display: none !important; }
    ${categoryRules}
    html[data-bc-enabled="true"][data-bc-page="home"][data-bc-min-options~="reference"] #bc-theme-wallpaper[data-bc-custom="false"] {
      --bc-min-empty-wallpaper: radial-gradient(ellipse at 12% 20%,#fce2eb 0%,transparent 54%),
        radial-gradient(ellipse at 90% 6%,#dce9fa 0%,transparent 55%),linear-gradient(140deg,#f9f9fc,#eef3fa);
    }
    ${scope}:not([data-bc-enabled="true"]) .bili-header__bar { background-color: var(--bc-glass-bg) !important; }
  `;
  function isHome(url,page) {
    const {hostname,pathname}=new URL(url);
    return page==='home' && (!/(^|\.)bilibili\.com$/.test(hostname) ||
      (hostname==='www.bilibili.com' && ['/', '/en', '/zh-Hans'].includes(pathname)));
  }
  function flags(settings) {
    return [['ads','minimalistHideAds'],['banner','minimalistHideBanner'],['categories','minimalistCompactCategories'],
      ['carousel','minimalistHideCarousel'],['toolbar','minimalistToolbar'],['decorations','minimalistHideDecorations'],
      ['reference','minimalistReferenceLayout'],['liquid','minimalistLiquidGlass']]
      .filter(([,key])=>settings[key]).map(([flag])=>flag).join(' ');
  }
  globalThis.BiliThemeMinimalist=Object.freeze({css,isHome,flags});
})();
