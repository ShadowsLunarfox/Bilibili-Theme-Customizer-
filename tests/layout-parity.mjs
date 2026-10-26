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
export async function measure(page) {
  return page.evaluate(`(()=>{
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
  })()`);
}

export function compare(before,after,label) {
  const differences=[]; let maximum=0;
  function walk(a,b,path='') {
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
    function visit(rules){for(const r of rules){
      if(r.cssRules)visit(r.cssRules);
      if(!r.style)continue;
      if(/#bc-theme-|\\.bc-theme-(popover|surface)-glass/.test(r.selectorText) && !r.selectorText.includes(' body '))continue;
      for(const p of r.style){
        if(p.startsWith('--')||/^(background($|-)|color$|border-(color$|.+-color$|radius$|.+-radius$)|box-shadow$|text-shadow$|text-decoration($|-)|caret-color$|outline($|-)|opacity$|transition($|-))/.test(p))continue;
        if(p==='display'&&r.style[p]==='none'&&/data-bc-(min-options|hidden|channel-layout)/.test(r.selectorText))continue;
        if(p==='visibility'&&r.style[p]==='hidden'&&r.selectorText.includes('data-bc-min-options'))continue;
        violations.push({selector:r.selectorText,property:p,value:r.style[p]});
      }
    }}
    for(const s of document.querySelectorAll('style[data-bc-owned="style"]'))visit(s.sheet.cssRules);
    return violations;
  })()`);
  assert.deepEqual(violations,[],'theme CSS must contain only appearance and explicitly requested hiding');
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
    const before=await measure(page);
    if(artifacts)await writeFile(join(artifacts,`${label}-${width}-native.png`),await page.screenshot());
    await patch(on);await settle(page);
    await assertVisualOnlyCSS(page);
    const after=await measure(page);
    if(artifacts)await writeFile(join(artifacts,`${label}-${width}-glass.png`),await page.screenshot());
    const maximum=compare(before,after,`${label} ${width}px`);
    assert.equal(await page.evaluate('parityBodyChildren.length===document.body.children.length && parityBodyChildren.every((n,i)=>document.body.children[i]===n)'),true,'native body children and order preserved');
    await patch(off);await settle(page);
    compare(before,await measure(page),`${label} ${width}px restored`);
    rows.push({width,maximum,before,after});
  }
  const sweep=[];
  if(continuous) {
    // Traverse the same native resizing sequence, then compare with glass on.
    // These samples are deliberately unrelated to any presumed site breakpoints.
    const sizes=[];for(let w=1024;w<=2560;w+=32)sizes.push(w);
    sizes.push(...sizes.slice(0,-1).reverse());
    const native=[];
    for(const w of sizes){await page.resize(w,1000);await settle(page);native.push(await measure(page));}
    await patch(on);
    for(let i=0;i<sizes.length;i++){
      await page.resize(sizes[i],1000);await settle(page);
      sweep.push({width:sizes[i],maximum:compare(native[i],await measure(page),`${label} sweep ${sizes[i]}px`)});
    }
  }
  const report={label,widths,rows,sweep,missing:Object.keys(selectors).filter(k=>!rows[0].before.components[k].length)};
  if(artifacts)await writeFile(join(artifacts,`${label}-metrics.json`),JSON.stringify(report,null,2));
  await page.resize(1440,1000);
  console.log(`  PASS ${label}: native/glass/restored geometry at ${widths.join('/')}px; ${sweep.length} continuous resize samples`);
  return report;
}
