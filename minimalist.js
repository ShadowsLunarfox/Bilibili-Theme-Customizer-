/* Appearance and explicit filtering. Native grids remain in charge of layout;
   their row gaps replace legacy top margins on homepage card wrappers. */
(() => {
  const BC=globalThis.BiliTheme;
  const scope='html[data-bc-minimalist="true"][data-bc-page="home"]';
  const option=key=>`${scope}[data-bc-min-options~="${key}"]`;
  const feed=':is(.recommended-container_floor-aside,.feed2)';
  const adMarkers=':is(.bili-video-card__info--ad,.bili-video-card__info--creative-ad,.bili-video-card__info--ad-label)';
  const adCard=`:is(.feed-card,.bili-feed-card,.bili-video-card,.bili-live-card,.floor-single-card):is(.is-ad,[data-is-ad="true"],[data-ad-id]:not([data-ad-id=""])),
    :is(.feed-card,.bili-feed-card,.bili-video-card,.bili-live-card,.floor-single-card):has(${adMarkers})`;
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
    /* Hide only explicitly selected slots; native auto-placement fills them.
       The scoped row correction below also handles nested native margins. */
    ${option('ads')} ${feed} :is(${adSlots}),
    ${option('ads')} ${feed} > :is(.bili-feed-ad,.ad-floor-exp),
    ${option('ads')} ${feed} > .container > :is(.bili-feed-ad,.ad-floor-exp) { display: none !important; }
    /* Keep the site's banner footprint: its absolute header still needs that
       native space even when the banner artwork is explicitly hidden. */
    ${option('banner')} .bili-header > .bili-header__banner { visibility: hidden !important; }
    ${option('carousel')} ${feed} .recommended-swipe,
    ${option('decorations')} ${feed} :is(.recommended-container__title-decoration,.feed-roll-decoration,.activity-decoration),
    ${option('toolbar')} .palette-button-wrap > :is(.download-entry,.activity-entry,.ad-entry) { display: none !important; }
    html[data-bc-page="home"]:is([data-bc-enabled="true"],[data-bc-minimalist="true"]) .recommended-container_floor-aside > .container [data-bc-feed-margin] {
      margin-top: var(--bc-feed-margin-top) !important;
    }
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
  function createFeedLayout() {
    const gridSelector='.recommended-container_floor-aside > .container';
    const cards='.feed-card,.bili-feed-card,.bili-video-card,.floor-single-card,.bili-live-card';
    const covers=globalThis.BiliThemePage.homeVideoCover;
    const layoutNodes=`${gridSelector},${cards},${covers},.bili-video-card__wrap,.bili-video-card__skeleton,.bili-live-card__wrap,.bili-live-card__skeleton,.floor-card,.floor-card-inner,.cover-container`;
    const previousStyle=document.createElement('i').style;
    const saved=new Map(),grids=new Set();
    let enabled=false,frame=0,body;
    const resize=new ResizeObserver(schedule);
    const mutations=new MutationObserver(records=>{
      const relevant=n=>n.nodeType===1 && (n.matches(layoutNodes)||n.querySelector(layoutNodes));
      const changed=r=>{
        if(!r.target.closest?.('.recommended-container_floor-aside')||!r.target.matches(layoutNodes))return false;
        if(r.attributeName!=='style')return true;
        previousStyle.cssText=r.oldValue||'';
        return ['margin','margin-top','display','position'].some(key=>previousStyle.getPropertyValue(key)!==r.target.style.getPropertyValue(key));
      };
      if(records.some(r=>r.type==='attributes'
        ? changed(r)
        : [...r.addedNodes,...r.removedNodes].some(relevant)))schedule();
    });
    function restore() {
      for(const [node,original] of saved) {
        if(original.attribute===null)node.removeAttribute('data-bc-feed-margin');
        else node.setAttribute('data-bc-feed-margin',original.attribute);
        if(original.value)node.style.setProperty('--bc-feed-margin-top',original.value,original.priority);
        else node.style.removeProperty('--bc-feed-margin-top');
        if(original.style===null && !node.getAttribute('style'))node.removeAttribute('style');
      }
      saved.clear();
    }
    function watch() {
      body=document.body;
      if(body)mutations.observe(body,{childList:true,subtree:true,attributes:true,attributeOldValue:true,
        attributeFilter:['class','style','hidden','data-is-ad','data-ad-id']});
    }
    function reconcile() {
      frame=0;
      mutations.disconnect();
      // Read the site's current margins, including after a breakpoint change.
      // Restore and measure in one frame so the intermediate state never paints.
      restore();
      const found=new Set(document.querySelectorAll(gridSelector));
      for(const grid of found) {
        if(!grids.has(grid)){grids.add(grid);resize.observe(grid);}
      }
      for(const grid of grids)if(!found.has(grid)){resize.unobserve(grid);grids.delete(grid);}
      // Old nth-of-type rules add 40px/24px on top of the grid's row gap.
      // Equal margins on a whole row are excess spacing too. Clear positive
      // margins along each real cover's wrapper chain, including collapsed
      // nested margins, while retaining native tracks, gaps and media ratios.
      for(let pass=0;pass<6;pass++) {
        const changes=new Map();
        for(const grid of found) {
          const slots=[...grid.children].map(node=>({node,style:getComputedStyle(node)}));
          const layout=getComputedStyle(grid);
          if(layout.display!=='grid' || !['normal','stretch','start'].includes(layout.alignItems) ||
              layout.gridAutoFlow!=='row')continue;
          for(const {node,style} of slots) {
            if(!node.matches(cards)||style.display==='none'||!['static','relative'].includes(style.position))continue;
            // Only single-row, normally aligned cards can share this correction.
            if(!['auto','normal','stretch','start'].includes(style.alignSelf)||
                /span\s+(?:[2-9]|\d{2,})/.test(style.gridRow)||
                Number(style.gridRowEnd)-Number(style.gridRowStart)>1)continue;
            const cover=(node.matches(covers)?[node]:[...node.querySelectorAll(covers)])
              .find(part=>{const r=part.getBoundingClientRect();return r.width&&r.height;});
            if(!cover)continue;
            const visual=cover.getBoundingClientRect();
            if(!visual.width||!visual.height)continue;
            for(let part=cover;part&&node.contains(part);part=part.parentElement) {
              const margin=parseFloat(getComputedStyle(part).marginTop)||0;
              if(margin>0)changes.set(part,0);
              if(part===node)break;
            }
          }
        }
        if(!changes.size)break;
        for(const [node,margin] of changes) {
          if(!saved.has(node))saved.set(node,{attribute:node.getAttribute('data-bc-feed-margin'),style:node.getAttribute('style'),
            value:node.style.getPropertyValue('--bc-feed-margin-top'),priority:node.style.getPropertyPriority('--bc-feed-margin-top')});
          node.style.setProperty('--bc-feed-margin-top',`${margin}px`);
          node.setAttribute('data-bc-feed-margin','');
        }
      }
      watch();
    }
    function schedule() {if(enabled&&!frame)frame=requestAnimationFrame(reconcile);}
    function stop() {
      enabled=false;
      if(frame)cancelAnimationFrame(frame);
      frame=0;mutations.disconnect();resize.disconnect();grids.clear();body=null;restore();
      window.removeEventListener('resize',schedule);
    }
    function update(active) {
      if(!active){stop();return;}
      const starting=!enabled || body!==document.body;
      enabled=true;
      if(body!==document.body){mutations.disconnect();watch();}
      if(starting){window.addEventListener('resize',schedule);schedule();}
    }
    return {update,stop};
  }
  globalThis.BiliThemeMinimalist=Object.freeze({css,isHome,flags,createFeedLayout});
})();
