import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const widths = [1024,1280,1366,1440,1600,1920,2560];
export const selectors = {
  header:'.bili-header__bar', search:'.center-search-container', searchForm:'.nav-search-form,.center-search__bar',
  banner:'.bili-header__banner', categories:'.bili-header__channel', stickyCategories:'.header-channel',
  category:'.channel-link,.channel-link__more', categoryGrid:'.channel-items__left',
  feed:'.bili-feed4,.bili-feed4-layout', grid:'.recommended-container_floor-aside > .container,.recommended-container_overseas > .container,.feed2 > .container',
  carousel:'.recommended-swipe', card:'.bili-video-card', thumbnail:'.bili-video-card__image--wrap',
  cardSurface:'.bili-video-card > .bili-video-card__wrap,.bili-video-card > .bili-video-card__skeleton',
  floorSurface:'.floor-single-card > .floor-card.single-card > .floor-card-inner',
  liveSurface:'.bili-live-card > .bili-live-card__wrap,.bili-live-card > .bili-live-card__skeleton',
  title:'.bili-video-card__info--tit', info:'.bili-video-card__info',
  profile:'.right-entry', popup:'.v-popover-content,.nav-search-panel',
  searchHeader:'.search-header', video:'.video-container,#bilibili-player,.bpx-player-container',
  content:'.bili-dyn-item,.bili-dyn-publishing,.section-wrap,.home-aside-section,.right-container,.video-desc-container,.user-item',
  comments:'bili-comments,.comment-container,.reply-container', input:'input,textarea,[contenteditable="true"]'
};
export const noFilters = {minimalistHideAds:false,minimalistHideBanner:false,minimalistHideCarousel:false,
  minimalistHideDecorations:false,minimalistToolbar:false,minimalistCompactCategories:false};
export const settle = page => page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');

// Compare actual site rules and rectangles, never assumed Bilibili dimensions.
export async function measure(page,{cardSpacing=true}={}) {
  return page.evaluate(`(()=>{
    const sheet=document.querySelector('style[data-bc-owned="style"]'),original=sheet?.textContent;
    // Isolate the requested caption padding and feed margin corrections when
    // auditing the old native-layout contract. Restore before paint; actual
    // row gaps and bounds are checked independently with the full CSS active.
    const margins=${cardSpacing}?[]:[...document.querySelectorAll('[data-bc-feed-margin]')].map(node=>[node,node.getAttribute('data-bc-feed-margin')]);
    for(const [node] of margins)node.removeAttribute('data-bc-feed-margin');
    if(!${cardSpacing} && sheet)sheet.textContent=original.replace(BiliThemePage.homeCardSpacingCSS,'');
    try {
    const properties='display position top right bottom left width height min-width max-width min-height max-height margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left border-top-width border-right-width border-bottom-width border-left-width box-sizing gap row-gap column-gap grid-template-columns grid-template-rows grid-column-start grid-column-end grid-row-start grid-row-end grid-auto-flow flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self justify-content order aspect-ratio font-family font-size font-weight line-height letter-spacing white-space overflow overflow-x overflow-y visibility z-index transform filter backdrop-filter contain isolation'.split(' ');
    const components={};
    for(const [name,selector] of Object.entries(${JSON.stringify(selectors)})) {
      components[name]=[...document.querySelectorAll(selector)].slice(0,12).map(n=>{
        const r=n.getBoundingClientRect(),s=getComputedStyle(n);
        return {rect:[r.x,r.y,r.width,r.height],style:Object.fromEntries(properties.map(p=>[p,s.getPropertyValue(p)]))};
      });
    }
    return {viewport:[innerWidth,innerHeight,devicePixelRatio],overflow:document.documentElement.scrollWidth,
      body:[document.body.getBoundingClientRect().width,document.body.scrollWidth],components,
      bannerArtwork:[...document.querySelectorAll('.bili-header__banner,.bili-header__banner *')].map(n=>{
        const s=getComputedStyle(n);return {tag:n.tagName,class:n.getAttribute('class'),src:n.getAttribute('src'),background:s.backgroundImage,display:s.display,visibility:s.visibility,opacity:s.opacity};
      }).filter(n=>n.src||n.background!=='none')};
    } finally {
      if(sheet && sheet.textContent!==original)sheet.textContent=original;
      for(const [node,value] of margins)node.setAttribute('data-bc-feed-margin',value);
    }
  })()`);
}

export const measureNativeLayout=page=>measure(page,{cardSpacing:false});

export function compare(before,after,label,{cardStretch=false}={}) {
  const differences=[]; let maximum=0;
  function walk(a,b,path='') {
    // Only the requested homepage card stretch may change internal height/flex
    // properties. Grid tracks/gaps, media rectangles, widths, title metrics,
    // surrounding components and disabled-state restoration remain strict.
    if(cardStretch && /^\.components\.(card|cardSurface|floorSurface|liveSurface|info)\.\d+\.(rect\.3|style\.(height|min-height|display|flex-direction|flex-grow|flex-shrink|flex-basis|align-self|justify-content))$/.test(path))return;
    if(cardStretch && /^\.components\.(thumbnail|title)\.\d+\.style\.flex-shrink$/.test(path))return;
    // Chromium reports automatic minimums as `auto` once a block becomes a
    // flex item, even when the resulting box dimensions remain identical.
    if(cardStretch && /^\.components\.(card|cardSurface|floorSurface|liveSurface|info|thumbnail|title)\.\d+\.style\.min-(width|height)$/.test(path) &&
        [a,b].every(v=>['0px','auto'].includes(v)))return;
    if(typeof a==='number'&&typeof b==='number') {
      const delta=Math.abs(a-b);maximum=Math.max(maximum,delta);
      if(delta>1/64)differences.push({path,before:a,after:b,delta});
    } else if(a&&typeof a==='object'&&b&&typeof b==='object') {
      for(const key of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[key],b[key],`${path}.${key}`);
    } else if(a!==b)differences.push({path,before:a,after:b});
  }
  walk(before,after);
  assert.deepEqual(differences,[],`${label}: native geometry changed`);
  return maximum;
}

export async function assertVisualOnlyCSS(page) {
  const violations=await page.evaluate(`(()=>{
    const violations=[];
    const spacing=new CSSStyleSheet();spacing.replaceSync(BiliThemePage.homeCardSpacingCSS);
    const spacingRules=new Map([...spacing.cssRules].map(r=>[r.selectorText,r.style.cssText]));
    function visit(rules){for(const r of rules){
      if(r.cssRules)visit(r.cssRules);
      if(!r.style)continue;
      if(spacingRules.get(r.selectorText)===r.style.cssText)continue;
      if(/#bc-theme-|\\.bc-theme-(popover|surface)-glass/.test(r.selectorText) && !r.selectorText.includes(' body '))continue;
      for(const p of r.style){
        if(p.startsWith('--')||/^(background($|-)|color$|border-(color$|.+-color$|radius$|.+-radius$)|box-shadow$|text-shadow$|text-decoration($|-)|caret-color$|outline($|-)|opacity$|transition($|-))/.test(p))continue;
        if(p==='display'&&r.style[p]==='none'&&/data-bc-(min-options|hidden|channel-layout)/.test(r.selectorText))continue;
        if(p==='visibility'&&r.style[p]==='hidden'&&r.selectorText.includes('data-bc-min-options'))continue;
        if(r.selectorText.startsWith('html[data-bc-enabled="true"][data-bc-page="home"] body .recommended-container_floor-aside > .container > .recommended-swipe:has(> .recommended-swipe-core > .recommended-swipe-body)') &&
            ((p==='display'&&['flex','block'].includes(r.style[p]))||(p==='flex-direction'&&r.style[p]==='column')||
             (p==='min-height'&&r.style[p]==='0px')||(p==='flex-grow'&&r.style[p]==='1')||
             (p==='flex-shrink'&&r.style[p]==='1')||(p==='flex-basis'&&r.style[p]==='auto')||
             (p==='height'&&r.style[p]==='100%')||(p==='object-fit'&&r.style[p]==='cover')||
             (p==='padding-top'&&r.style[p]==='0px')))continue;
        if(r.selectorText.startsWith('html[data-bc-enabled="true"][data-bc-page="home"] body :is(.recommended-container_floor-aside, .recommended-container_overseas, .feed2) > .container > ') &&
            r.selectorText.includes(':has(.bili-video-card__wrap, .bili-video-card__skeleton, .bili-live-card__wrap, .bili-live-card__skeleton, .floor-card.single-card)') &&
            ((p==='display'&&r.style[p]==='flex')||(p==='flex-direction'&&r.style[p]==='column')||
             (p==='align-self'&&r.style[p]==='stretch')||(p==='justify-content'&&r.style[p]==='space-between')||
             (p==='height'&&r.style[p]==='auto'&&r.selectorText.endsWith('.floor-card-inner > .cover-container'))||
             (p==='min-height'&&r.style[p]==='0px')||(p==='flex-grow'&&['0','1'].includes(r.style[p]))||
             (p==='flex-shrink'&&['0','1'].includes(r.style[p]))||(p==='flex-basis'&&r.style[p]==='auto')))continue;
        if(p==='margin-top'&&r.style[p]==='var(--bc-feed-margin-top)'&&
            r.selectorText==='html[data-bc-page="home"]:is([data-bc-enabled="true"], [data-bc-minimalist="true"]) .recommended-container_floor-aside > .container [data-bc-feed-margin]')continue;
        violations.push({selector:r.selectorText,property:p,value:r.style[p]});
      }
    }}
    for(const s of document.querySelectorAll('style[data-bc-owned="style"]'))visit(s.sheet.cssRules);
    return violations;
  })()`);
  assert.deepEqual(violations,[],'theme CSS must contain only appearance, explicit hiding and the scoped homepage margin correction');
}

export async function runParity({page,patch,artifacts,label='fixture',navKeys=[],continuous=true}) {
  const preferences=Object.fromEntries(navKeys.map(key=>[key,false]));
  const off={...preferences,...noFilters,enabled:false,minimalistEnabled:false};
  const on={enabled:true,minimalistEnabled:true,minimalistCompactNav:true,minimalistGrid:true,
    minimalistReferenceLayout:true,minimalistLiquidGlass:true,material:'glass'};
  await patch(off);await settle(page);
  await page.evaluate(`void(globalThis.parityBodyChildren=[...document.body.children])`);
  const rows=[];
  if(artifacts)await mkdir(artifacts,{recursive:true});
  for(const width of widths) {
    await page.resize(width,1000);await settle(page);
    const before=await measureNativeLayout(page);
    if(artifacts)await writeFile(join(artifacts,`${label}-${width}-native.png`),await page.screenshot());
    await patch(on);await settle(page);
    await assertVisualOnlyCSS(page);
    const after=await measureNativeLayout(page);
    if(artifacts)await writeFile(join(artifacts,`${label}-${width}-glass.png`),await page.screenshot());
    const maximum=compare(before,after,`${label} ${width}px`,{cardStretch:true});
    assert.equal(await page.evaluate('parityBodyChildren.length===document.body.children.length && parityBodyChildren.every((n,i)=>document.body.children[i]===n)'),true,'native body children and order preserved');
    await patch(off);await settle(page);
    compare(before,await measureNativeLayout(page),`${label} ${width}px restored`);
    rows.push({width,maximum,before,after});
  }
  const sweep=[];
  if(continuous) {
    // Traverse the same native resizing sequence, then compare with glass on.
    // These samples are deliberately unrelated to any presumed site breakpoints.
    const sizes=[];for(let w=1024;w<=2560;w+=32)sizes.push(w);
    sizes.push(...sizes.slice(0,-1).reverse());
    const native=[];
    for(const w of sizes){await page.resize(w,1000);await settle(page);native.push(await measureNativeLayout(page));}
    await patch(on);
    for(let i=0;i<sizes.length;i++){
      await page.resize(sizes[i],1000);await settle(page);
      sweep.push({width:sizes[i],maximum:compare(native[i],await measureNativeLayout(page),`${label} sweep ${sizes[i]}px`,{cardStretch:true})});
    }
  }
  const report={label,widths,rows,sweep,missing:Object.keys(selectors).filter(k=>!rows[0].before.components[k].length)};
  if(artifacts)await writeFile(join(artifacts,`${label}-metrics.json`),JSON.stringify(report,null,2));
  await page.resize(1440,1000);
  console.log(`  PASS ${label}: native/glass/restored geometry at ${widths.join('/')}px; ${sweep.length} continuous resize samples`);
  return report;
}
