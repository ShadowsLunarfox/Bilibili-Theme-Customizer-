import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

// Local regression using the inspected domestic nesting. Unlike the old glass
// tests, this measures panel/metadata bottoms, not just unchanged rectangles.
export function cardAlignmentFixture() {
  const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><path fill="#527a91" d="M0 0H640V360H0Z"/><circle fill="#ffe6ba" cx="475" cy="95" r="45"/><path fill="#204450" d="M0 340 140 140 310 280 430 160 640 340V360H0Z"/></svg>');
  const titles=['Short title','A two-line title with enough words to wrap naturally on the responsive video card',
    'A very long title that must retain the native two-line truncation even when many more words are supplied by asynchronous recommendation data. '.repeat(3)];
  const video=(i,native=false)=>`<div class="bili-video-card ${native?'native-title':''}" id="card-${i}"><div class="bili-video-card__wrap">
    <a class="bili-video-card__image--link" href="#video-${i}"><div class="bili-video-card__image"><div class="bili-video-card__image--wrap"><picture class="bili-video-card__cover"><img src="${image}" alt="Sharp native thumbnail"></picture></div></div></a>
    <div class="bili-video-card__info"><div class="bili-video-card__info--right"><h3 class="bili-video-card__info--tit"><a href="#video-${i}">${titles[i%3]}</a></h3>
      <div class="bili-video-card__info--bottom">${i%2?'<span class="native-badge">Following</span>':''}<a class="bili-video-card__info--owner" href="#uploader"><span class="bili-video-card__info--author">A native uploader with a potentially long name</span><span class="bili-video-card__info--date"> · Today</span></a></div></div></div></div></div>`;
  const cards=Array.from({length:17},(_,i)=>{
    const card=video(i,i<6);
    return i%3===0?`<div class="feed-card"><div class="bili-feed-card">${card}</div></div>`:
      i%3===1?`<div class="bili-feed-card">${card}</div>`:card;
  });
  cards.splice(4,0,`<div class="floor-single-card" id="floor"><div class="floor-card single-card"><div class="floor-card-inner">
    <div class="cover-container"><div class="cover-shim"><img src="${image}" alt="Native special cover"></div></div>
    <div class="info-container"><p class="title">Native special live/bangumi card</p><a class="sub-title" href="#creator">Creator</a></div></div><div class="layer"></div></div></div>`);
  cards.splice(8,0,'<div class="feed-card"><div class="bili-feed-card"><div class="bili-video-card" id="pending"><div class="bili-video-card__skeleton"><div class="bili-video-card__skeleton--cover"></div><div class="bili-video-card__skeleton--info"><div class="bili-video-card__skeleton--right">Native pending recommendation</div></div></div></div></div></div>');
  return `<!doctype html><html><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;font:14px/1.5 Arial;color:#18191c;background:#eef2f5}a{color:inherit;text-decoration:none}
    main{padding:24px}.container{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:20px;align-items:normal}
    @media(max-width:1399px){.container{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @media(max-width:1099px){.container{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(min-width:1900px){.container{grid-template-columns:repeat(6,minmax(0,1fr))}}
    .feed-card,.bili-feed-card,.bili-video-card{min-width:0}.bili-video-card{position:relative}.bili-video-card__wrap{background:#fff}
    .bili-video-card__image--link,.bili-video-card__image{display:block}.bili-video-card__image--wrap,.bili-video-card__skeleton--cover,.cover-shim{position:relative;padding-top:56.25%;border-radius:6px;background:#c8d2d8}
    .bili-video-card__cover,.cover-shim img{position:absolute;inset:0;width:100%;height:100%}.bili-video-card__cover img{width:100%;height:100%}
    .bili-video-card__info{display:flex;margin-top:10px}.bili-video-card__info--right{position:relative;flex:1;min-width:0}
    .bili-video-card__info--tit{font-size:14px;line-height:22px;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .native-title .bili-video-card__info{min-height:65px}.native-title .bili-video-card__info--tit{height:44px}
    .bili-video-card__info--bottom{display:flex;align-items:center;margin-top:4px;height:17px;font-size:12px}
    .bili-video-card__info--owner{display:flex;min-width:0}.bili-video-card__info--author{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.bili-video-card__info--date{white-space:nowrap;flex-shrink:0}
    .native-badge{flex-shrink:0;margin-right:4px;background:#ffe5d5;color:#b35425;border-radius:4px}
    .bili-video-card__skeleton--info{margin-top:10px;height:65px}.hide{display:none}
    .recommended-swipe{grid-column:span 2;grid-row:span 2;position:relative;min-height:0;border-radius:6px;background:linear-gradient(145deg,#263749,#578a91);color:white;padding:20px}
    .floor-card.single-card{display:flex;flex-direction:column;border:1px solid #ddd;border-radius:6px;position:relative}
    .single-card.floor-card .cover-container{position:relative;width:100%;height:100%;margin-bottom:10px}.info-container{display:flex;flex-direction:column;align-items:start;padding:0 12px 16px}
    .info-container .title{font-size:14px;line-height:22px;height:44px;margin:0 0 3px}.sub-title{line-height:17px}.floor-card-inner{background:#fff}
    .test-controls{padding:12px 24px}button{font:inherit}
  </style><script src="/bridge.js"></script><script src="/settings.js" defer></script><script src="/theme.js" defer></script><script src="/minimalist.js" defer></script><script src="/content.js" defer></script>
  <body><div class="test-controls">Video card row alignment — mixed title lengths, nested slots and a two-row carousel <button id="load">Load recommendation</button></div>
    <main class="recommended-container_floor-aside"><div class="container"><div class="recommended-swipe">Native featured carousel — 2 rows</div>${cards.join('')}</div></main>
    <script>document.querySelector('#load').onclick=()=>{const card=document.querySelector('#pending');card.replaceChildren(document.querySelector('#card-2 .bili-video-card__wrap').cloneNode(true));};</script></body></html>`;
}

async function measurements(page,{legacyMargins=false}={}) {
  return page.evaluate(`(()=>{
    if(${legacyMargins}){
      const style=document.createElement('style');style.id='legacy-feed-margins';
      style.textContent='main > .container > :nth-child(n+8){margin-top:40px}';document.head.append(style);
    }
    const grid=document.querySelector('main > .container'),gs=getComputedStyle(grid),rows=[];
    const record=n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
    for(const slot of grid.children){
      if(slot.matches('.recommended-swipe'))continue;
      const card=slot.matches('.bili-video-card,.floor-single-card')?slot:slot.querySelector('.bili-video-card,.floor-single-card');if(!card)continue;
      const info=card.querySelector(BiliThemePage.homeVideoInfo),cover=info?.parentElement.querySelector(BiliThemePage.homeVideoCover);if(!info||!cover)continue;
      const box=record(slot);let row=rows.find(r=>Math.abs(r.top-box.top)<1);if(!row){row={top:box.top,cards:[]};rows.push(row);}
      const metadata=card.querySelector('.bili-video-card__info--bottom'),title=card.querySelector('.bili-video-card__info--tit'),style=getComputedStyle(info);
      row.cards.push({id:card.id,normal:!card.matches('.floor-single-card'),slot:box,info:record(info),cover:record(cover),metadata:metadata?record(metadata):null,
        title:title?record(title):null,clamp:title?getComputedStyle(title).webkitLineClamp:null,
        spacing:{padding:[style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft],marginTop:style.marginTop}});
    }
    const delta=xs=>xs.length?Math.max(...xs)-Math.min(...xs):0;
    return {rows,viewportHeight:innerHeight,paint:[...document.querySelectorAll('[data-bc-surface-kind="video-info"]')].map(record),columns:gs.gridTemplateColumns,gap:gs.gap,gridRows:gs.gridTemplateRows,carousel:record(grid.querySelector('.recommended-swipe')),
      span:getComputedStyle(grid.querySelector('.recommended-swipe')).gridRow,
      normalDelta:Math.max(...rows.map(r=>delta(r.cards.filter(c=>c.normal&&c.metadata).map(c=>c.info.bottom)))),
      mixedDelta:Math.max(...rows.map(r=>delta(r.cards.map(c=>c.info.bottom)))),
      metadataDelta:Math.max(...rows.map(r=>delta(r.cards.filter(c=>c.metadata).map(c=>c.metadata.bottom))))};
  })()`);
}

async function guidedScreenshot(page,directory,name,state) {
  if(!directory)return;
  await page.evaluate(`(()=>{
    const state=${JSON.stringify(state)},ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.id='bc-test-guides';svg.dataset.bcOwned='test-guides';svg.setAttribute('width',innerWidth);svg.setAttribute('height',innerHeight);
    svg.style.cssText='position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    for(const [i,row] of state.rows.entries()){
      const bottoms=[...new Set(row.cards.map(c=>Math.round(c.info.bottom*100)/100))];
      for(const y of bottoms){const l=document.createElementNS(ns,'line');l.setAttribute('x1','24');l.setAttribute('x2',innerWidth-24);l.setAttribute('y1',y);l.setAttribute('y2',y);l.setAttribute('stroke','#ff6a35');l.setAttribute('stroke-dasharray','6 4');svg.append(l);}
      const t=document.createElementNS(ns,'text');t.setAttribute('x','28');t.setAttribute('y',Math.max(...bottoms)+12);t.setAttribute('fill','#ffba75');t.setAttribute('font-size','12');t.setAttribute('font-family','Arial');t.textContent='Row '+(i+1)+' panel delta: '+(Math.max(...bottoms)-Math.min(...bottoms)).toFixed(2)+'px';svg.append(t);
    }
    document.documentElement.append(svg);
  })()`);
  await writeFile(join(directory,name+'.png'),await page.screenshot());
  await page.evaluate('document.querySelector("#bc-test-guides").remove()');
}

function aligned(state,label) {
  assert.ok(state.normalDelta<=2,label+': normal panel bottoms differ by '+state.normalDelta);
  assert.ok(state.mixedDelta<=2,label+': mixed panel bottoms differ by '+state.mixedDelta);
  assert.ok(state.metadataDelta<=2,label+': metadata bottoms differ by '+state.metadataDelta);
  for(const [i,row] of state.rows.entries())for(const card of row.cards) {
    assert.deepEqual(card.spacing.padding,['10px','12px','12px','12px'],label+': consistent caption inset '+card.id);
    assert.equal(card.spacing.marginTop,'0px',label+': cover gap belongs inside glass');
    assert.ok(Math.abs(card.cover.width/card.cover.height-16/9)<.01,label+': thumbnail ratio '+card.id);
    assert.ok(card.info.left>=card.cover.left-1 && card.info.right<=card.cover.right+1,label+': padding stays inside thumbnail width');
    assert.ok(card.info.bottom<=card.slot.bottom+1/64,label+': panel outside slot '+card.id);
    assert.ok(card.info.bottom<=(state.rows[i+1]?.top??Infinity),label+': collision with next row');
    if(i>0){
      const gap=row.top-Math.max(...state.rows[i-1].cards.map(c=>c.slot.bottom));
      assert.ok(Math.abs(gap-parseFloat(state.gap))<=1,label+': rows use only the native grid gap, got '+gap);
    }
    if(card.title){
      assert.equal(card.clamp,'2',label+': native two-line clamp');
      assert.ok(card.title.left>=card.info.left+12-1/64 && card.title.right<=card.info.right-12+1/64,label+': title clear of side edges');
      assert.ok(card.title.top>=card.cover.bottom+10-1/64,label+': title clear of cover');
    }
    if(card.metadata) {
      assert.ok(card.metadata.right<=card.info.right+1,label+': metadata width');
      assert.ok(card.metadata.left>=card.info.left+12-1/64 && card.metadata.right<=card.info.right-12+1/64,label+': metadata clear of side edges');
      assert.ok(card.metadata.bottom<=card.info.bottom-12+1/64,label+': metadata clear of rounded bottom');
      assert.ok(card.title.bottom+4<=card.metadata.top+1/64,label+': native title/metadata gap');
    }
    if(card.info.top<state.viewportHeight&&card.info.bottom>0) {
      const matches=state.paint.filter(p=>Math.abs(p.left-card.cover.left)<1&&Math.abs(p.right-card.cover.right)<1&&Math.abs(p.top-card.cover.bottom)<1&&Math.abs(p.bottom-card.info.bottom)<1);
      assert.equal(matches.length,1,label+': one glass layer covers the full expanded information area '+card.id);
    }
  }
}

export async function runCardAlignmentChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/card-alignment.html');
  await page.activate();
  await until(page,'document.documentElement.dataset.bcPage === "home" && !!document.querySelector("#pending")');
  const captionSpacing=()=>page.evaluate(`(()=>{const s=getComputedStyle(document.querySelector('#card-0 .bili-video-card__info'));return [s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft,s.marginTop];})()`);
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:{enabled:false}})');await settle(page);
  const nativeSpacing=await captionSpacing();
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');
  await until(page,'document.documentElement.dataset.bcEnabled === "true"');
  await settle(page);
  await page.evaluate('globalThis.cardAlignmentCSS=document.querySelector("style[data-bc-owned=style]").textContent');
  const toggle=async active=>{await page.evaluate(`document.querySelector('style[data-bc-owned=style]').textContent=${active?'cardAlignmentCSS':"cardAlignmentCSS.replace(BiliThemePage.homeCardLayoutCSS,'')"}`);await settle(page);};
  const reports=[];
  if(screenshots)await mkdir(screenshots,{recursive:true});
  for(const width of [1024,1280,1440,1600,1920,2560]) {
    await page.resize(width,1400);await toggle(false);
    const before=await measurements(page);
    assert.ok(before.normalDelta>2,'baseline must reproduce the actual missing stretch chain');
    await guidedScreenshot(page,screenshots,'cards-'+width+'-before',before);
    await toggle(true);const after=await measurements(page);aligned(after,width+'px');
    assert.equal(after.columns,before.columns,'official column widths retained');
    assert.equal(after.gap,before.gap,'official grid gaps retained');
    assert.equal(after.span,before.span,'carousel retains its native row span');
    assert.equal(after.gridRows,before.gridRows,'stretch fills the existing grid tracks');
    assert.deepEqual(after.carousel,before.carousel,'carousel dimensions retained');
    const allBefore=before.rows.flatMap(r=>r.cards),allAfter=after.rows.flatMap(r=>r.cards);
    for(const card of allAfter)assert.deepEqual(card.cover,allBefore.find(c=>c.id===card.id).cover,'native thumbnail rectangle retained');
    await guidedScreenshot(page,screenshots,'cards-'+width+'-after',after);
    if(width===1440){
      await page.evaluate("document.querySelector('style[data-bc-owned=style]').textContent=cardAlignmentCSS.replace(BiliThemePage.homeCardSpacingCSS,'')");await settle(page);
      const unspaced=await measurements(page),card=unspaced.rows.flatMap(r=>r.cards).find(c=>c.id==='card-0');
      assert.equal(card.title.left,card.info.left,'baseline reproduces text flush against glass');
      assert.equal(card.metadata.bottom,card.info.bottom,'baseline reproduces metadata flush against bottom');
      await guidedScreenshot(page,screenshots,'spacing-1440-before',unspaced);
      await toggle(true);await guidedScreenshot(page,screenshots,'spacing-1440-after',after);
    }
    reports.push({width,before,after});
  }
  await page.evaluate('document.querySelector("#load").click()');
  await until(page,'document.querySelector("#pending > .bili-video-card__wrap") !== null');
  await settle(page);aligned(await measurements(page),'async loading');
  for(const width of [1600,1024,2560,1280,1920,1440]){await page.resize(width,1400);await settle(page);aligned(await measurements(page),'resize after loading '+width);}
  const withLegacyMargins=await measurements(page,{legacyMargins:true});
  const nativeGaps=withLegacyMargins.rows.slice(1).map((r,i)=>r.top-Math.max(...withLegacyMargins.rows[i].cards.map(c=>c.slot.bottom)));
  assert.ok(nativeGaps.some(g=>g>=60-1/64),'reproduce a common 40px top margin plus 20px grid gap');
  await settle(page);await settle(page);aligned(await measurements(page),'legacy common row margins');
  await guidedScreenshot(page,screenshots,'rows-1440-after',await measurements(page));
  await page.evaluate(`for(const card of document.querySelectorAll('.bili-video-card:has(> .bili-video-card__wrap)')){
    const pending=document.createElement('div');pending.className='bili-video-card__skeleton hide';pending.innerHTML='<div class="bili-video-card__skeleton--cover"></div>';card.prepend(pending);
  }`);
  await settle(page);await settle(page);aligned(await measurements(page),'hidden skeletons do not prevent margin repair');
  for(const width of [1024,1280,1600,1920,2560,1440]){await page.resize(width,1400);await settle(page);await settle(page);aligned(await measurements(page),'legacy margins resized '+width);}
  await page.evaluate('document.querySelector("#legacy-feed-margins").remove()');await settle(page);
  for(const layout of ['feed2','recommended-container_overseas']){
    await page.evaluate(`document.querySelector('main').className=${JSON.stringify('bili-feed4 '+layout)}`);await settle(page);aligned(await measurements(page),layout+' spacing');
  }
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:{material:"clear"}})');await settle(page);
  assert.deepEqual(await captionSpacing(),nativeSpacing,'Clear restores native caption spacing');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:{enabled:false}})');await settle(page);
  assert.deepEqual(await captionSpacing(),nativeSpacing,'disabled theme restores native caption spacing');
  const text=reports.map(r=>`| ${r.width} | ${r.before.normalDelta.toFixed(2)} | ${r.after.normalDelta.toFixed(2)} | ${r.before.mixedDelta.toFixed(2)} | ${r.after.mixedDelta.toFixed(2)} |`).join('\n');
  if(screenshots){
    await writeFile(join(screenshots,'card-alignment-metrics.json'),JSON.stringify(reports,null,2));
    await writeFile(join(screenshots,'CARD-ALIGNMENT.md'),'# Card bottom alignment\n\nLocal browser fixture using the inspected domestic DOM. Before removes only the added structural CSS; glass stays enabled in both states. Orange horizontal guides mark panel bottoms.\n\n| Width | Normal before (px) | Normal after (px) | Mixed before (px) | Mixed after (px) |\n| --- | --- | --- | --- | --- |\n'+text+'\n\nAlso passed metadata alignment, native thumbnail rectangles/ratios, exact grid columns/tracks/gaps and carousel dimensions/span, async skeleton replacement, and resizing after loading.\n');
  }
  console.log('  PASS card alignment: padded captions, native percentage-height special covers, exact row gaps, common 40px margins, six widths, loading/resizing, Clear/disable and sharp media');
  console.log(text);
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');
  await page.close();
}
