import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle,assertVisualOnlyCSS} from './layout-parity.mjs';

// Reproduces the live domestic carousel: a two-row grid item, an intrinsic
// hidden sizing shim (full first row, cover-only second row), absolute body,
// percentage-height VUI frames, and an auto-height media wrapper.
export function carouselAlignmentFixture() {
  const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="976" height="550"><path fill="#285774" d="M0 0H976V550H0Z"/><circle fill="#f5cf95" cx="730" cy="130" r="90"/><path fill="#1c3c42" d="M0 550 300 160 560 440 750 280 976 550Z"/></svg>');
  const skeleton='<div class="bili-video-card"><div class="bili-video-card__skeleton"><div class="bili-video-card__skeleton--cover"></div><div class="bili-video-card__skeleton--info"></div></div></div>';
  const video=i=>`<div class="feed-card"><div class="bili-feed-card"><div class="bili-video-card" id="video-${i}"><div class="bili-video-card__wrap"><a class="bili-video-card__image--link"><div class="bili-video-card__image--wrap"><picture class="bili-video-card__cover"><img src="${image}"></picture></div></a><div class="bili-video-card__info"><div class="bili-video-card__info--right"><h3 class="bili-video-card__info--tit">${i%2?'A long native title that wraps and keeps its existing two-line clamp':'Short native title'}</h3><div class="bili-video-card__info--bottom"><span class="bili-video-card__info--author">Uploader ${i}</span></div></div></div></div></div></div></div>`;
  return `<!doctype html><html><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;min-width:1100px;font:14px/1.5 Arial;background:#eef2f5}main{padding:24px}
    .container{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:20px}
    @media(max-width:1399px){.container{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .feed-card,.bili-feed-card,.bili-video-card{min-width:0}.bili-video-card__image--link{display:block}
    .bili-video-card__image--wrap,.bili-video-card__skeleton--cover{position:relative;padding-top:56.25%;border-radius:6px;background:#93aab8}
    .bili-video-card__cover{position:absolute;inset:0}.bili-video-card__cover img{width:100%;height:100%}
    .bili-video-card__info{display:flex;margin-top:10px;min-height:65px}.bili-video-card__info--right{flex:1;min-width:0}
    .bili-video-card__info--tit{height:44px;font-size:14px;line-height:22px;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .bili-video-card__info--bottom{height:17px;margin-top:4px;font-size:12px}
    .bili-video-card__skeleton--info{height:65px;margin-top:10px}
    .recommended-swipe{--cover-radio:56.25%;grid-column:1/3;grid-row:1/3}
    .recommended-swipe-core{position:relative;width:100%}
    .recommended-swipe-shim{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;opacity:0;visibility:hidden;pointer-events:none}
    .shim-card{height:0;padding-top:var(--cover-radio)}
    .recommended-swipe-body,.recommended-swipe-body-normal,.recommended-swipe-body-loading{position:absolute;inset:0}
    .recommended-swipe-body{display:flex;flex-direction:column;border-radius:6px;overflow:hidden;background:#18191c}
    .recommended-swipe-body-normal{display:flex;align-items:center;justify-content:center}
    .carousel,.carousel-container,.vui_carousel{position:relative;width:100%;height:100%}
    .vui_carousel__slides{display:flex;width:100%;height:100%;transition:transform .1s}
    .vui_carousel__slide{flex-shrink:0;width:100%;height:100%;overflow:hidden}
    .carousel-area{position:relative}.carousel-item{position:relative;display:block;width:100%;height:100%}
    .carousel-inner__img{position:relative;display:inline-flex;width:100%;height:100%}
    .vui_carousel .vui_carousel__slide img{width:100%;height:100%;display:block;object-fit:contain}
    .extension-tips-v2{display:none;position:absolute;top:0;left:0;width:100%;height:0;padding-top:var(--cover-radio);background:#252a30}
    .extension-tips-v2.using{display:block}.extension-tips-v2 span{position:absolute;top:45%;left:20%}
    .carousel-footer-mask{position:absolute;inset:auto 0 0;height:150px;background:linear-gradient(transparent,#111c)}
    .carousel-footer-text{position:absolute;bottom:42px;left:15px;line-height:25px;color:white}
    .carousel-dots{position:absolute;bottom:20px;left:15px;height:16px;display:flex;gap:5px}
    .carousel-dots-dot{width:8px;height:8px;background:white;border-radius:50%;opacity:.4}.carousel-dots-dot.is-active{opacity:1}
    .carousel-arrows{position:absolute;bottom:42px;right:15px;display:flex;gap:8px}.carousel-arrows button{width:28px;height:28px}
    .recommended-swipe-body-loading{display:none;place-items:center;color:white}.loading .recommended-swipe-body-normal{display:none}.loading .recommended-swipe-body-loading{display:grid}
  </style><script src="/bridge.js"></script><script src="/settings.js" defer></script><script src="/theme.js" defer></script><script src="/minimalist.js" defer></script><script src="/content.js" defer></script>
  <body><main class="recommended-container_floor-aside"><div class="container"><div class="recommended-swipe"><div class="recommended-swipe-core">
    <div class="recommended-swipe-shim">${skeleton}${skeleton}<div class="shim-card"></div><div class="shim-card"></div></div>
    <div class="recommended-swipe-body"><div class="recommended-swipe-body-loading">Loading</div><div class="recommended-swipe-body-normal"><div class="carousel"><div class="carousel-container"><div class="vui_carousel">
    <div class="vui_carousel__slides">${[0,1,2].map(i=>`<div class="vui_carousel__slide"><div class="carousel-area"><div class="carousel-area-img"><div class="extension-tips-v2"><span>Native blocked-media message</span></div><a class="carousel-item"><picture class="v-img carousel-inner__img"><img src="${image}" alt="Slide ${i}"></picture></a></div></div></div>`).join('')}</div>
    <div class="carousel-footer"><div class="carousel-footer-mask"></div><a class="carousel-footer-text">Featured title</a><div class="carousel-dots">${[0,1,2].map(i=>`<span class="carousel-dots-dot ${i===0?'is-active':''}"></span>`).join('')}</div></div><div class="carousel-arrows"><button id="prev">‹</button><button id="next">›</button></div>
    </div></div></div></div></div></div></div>${Array.from({length:14},(_,i)=>video(i)).join('')}</div></main>
    <script>let slide=0;function advance(d){slide=(slide+d+3)%3;document.querySelector('.vui_carousel__slides').style.transform='translateX(-'+slide*100+'%)';document.querySelectorAll('.carousel-dots-dot').forEach((n,i)=>n.classList.toggle('is-active',i===slide));}document.querySelector('#prev').onclick=()=>advance(-1);document.querySelector('#next').onclick=()=>advance(1);setInterval(()=>advance(1),1200);</script></body></html>`;
}

async function measure(page) {
  return page.evaluate(`(()=>{
    const q=s=>document.querySelector(s),box=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const grid=q('main > .container'),gs=getComputedStyle(grid),slot=q('.recommended-swipe'),body=q('.recommended-swipe-body');
    const cards=[...grid.querySelectorAll('.feed-card')].map(e=>({slot:box(e),cover:box(e.querySelector('.bili-video-card__image--wrap')),info:box(e.querySelector('.bili-video-card__info')),title:box(e.querySelector('h3')),metadata:box(e.querySelector('.bili-video-card__info--bottom')),clamp:getComputedStyle(e.querySelector('h3')).webkitLineClamp}));
    const tops=[...new Set(cards.map(c=>c.cover.top))].sort((a,b)=>a-b),row2=cards.filter(c=>Math.abs(c.cover.top-tops[1])<1);
    return {width:innerWidth,columns:gs.gridTemplateColumns,rows:gs.gridTemplateRows,gap:gs.gap,span:getComputedStyle(slot).gridRow,slot:box(slot),core:box(q('.recommended-swipe-core')),body:box(body),row2:row2.map(c=>c.info.bottom),delta:Math.max(...row2.map(c=>Math.abs(c.info.bottom-body.getBoundingClientRect().bottom))),cards,
      media:box(q('.carousel-area-img')),image:box(q('.carousel-item img')),imageFit:getComputedStyle(q('.carousel-item img')).objectFit,imageFilter:getComputedStyle(q('.carousel-item img')).filter,
      controls:['.carousel-footer-text','.carousel-dots','.carousel-arrows'].map(s=>box(q(s))),active:[...document.querySelectorAll('.carousel-dots-dot')].findIndex(e=>e.classList.contains('is-active'))};
  })()`);
}

function aligned(s,label) {
  assert.ok(s.delta<=2,label+': carousel bottom differs from row 2 by '+s.delta);
  assert.equal(s.body.bottom,s.slot.bottom,label+': body fills allocated grid area');
  assert.equal(s.media.height,s.body.height,label+': no empty media strip');
  assert.equal(s.image.height,s.body.height,label+': image fills frame');
  assert.equal(s.imageFit,'cover');assert.equal(s.imageFilter,'none');
  for(const c of s.controls)assert.ok(c.top>=s.body.top&&c.bottom<=s.body.bottom,label+': controls inside frame');
  const row3=s.cards.filter(c=>c.cover.top>s.row2[0]);
  assert.ok(row3.every(c=>c.cover.top>=s.body.bottom+19),label+': next row cannot overlap');
}

export async function runCarouselAlignmentChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/carousel-alignment.html');await page.activate();
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await settle(page);
  await page.evaluate('globalThis.carouselCSS=document.querySelector("style[data-bc-owned=style]").textContent');
  const toggle=async active=>{await page.evaluate(`document.querySelector('style[data-bc-owned=style]').textContent=${active?'carouselCSS':"carouselCSS.replace(BiliThemePage.homeCarouselCSS,'')"}`);await settle(page);};
  const reports=[];if(screenshots)await mkdir(screenshots,{recursive:true});
  for(const width of [1024,1280,1440,1600,1920,1652]) {
    await page.resize(width,1100);await toggle(false);const before=await measure(page);
    assert.ok(before.delta>=73,'baseline must reproduce the native cover-only shim gap');
    await toggle(true);const after=await measure(page);aligned(after,width+'px');
    for(const key of ['columns','rows','gap','span','slot','cards'])assert.deepEqual(after[key],before[key],width+': unchanged '+key);
    reports.push({width,before,after});
  }
  await assertVisualOnlyCSS(page);
  const initial=await measure(page);await page.evaluate('document.querySelector("#next").click()');await settle(page);
  const manual=await measure(page);assert.notEqual(manual.active,initial.active);aligned(manual,'manual next');
  await until(page,'!document.querySelectorAll(".carousel-dots-dot")['+manual.active+'].classList.contains("is-active")');
  aligned(await measure(page),'automatic slide');
  await page.evaluate('document.querySelector(".recommended-swipe-body").classList.add("loading")');await settle(page);
  assert.equal((await measure(page)).body.bottom,initial.body.bottom,'loading body fills same grid area');
  await page.evaluate('document.querySelector(".recommended-swipe-body").classList.remove("loading"); document.querySelectorAll(".extension-tips-v2").forEach(n=>n.classList.add("using"))');await settle(page);
  aligned(await measure(page),'blocked media');
  assert.equal(await page.evaluate('document.querySelector(".extension-tips-v2").getBoundingClientRect().height'),initial.body.height,'blocked-media state fills frame');
  await page.evaluate('setTimeout(()=>document.querySelector("#video-10 h3").textContent="Asynchronously loaded recommendation",50)');
  await until(page,'document.querySelector("#video-10 h3").textContent.startsWith("Asynchronously")');
  for(const width of [1920,1024,1600,1280,1652,1440]){await page.resize(width,1100);await settle(page);aligned(await measure(page),'resize after async '+width);}
  if(screenshots)await writeFile(join(screenshots,'carousel-alignment-metrics.json'),JSON.stringify(reports,null,2));
  console.log('  PASS carousel alignment: six widths, native shim reproduction, exact ordinary-card/grid parity, full-frame sharp media, controls, manual/automatic slides, loading/blocked/async and resize');
  console.log(reports.map(r=>`    ${r.width}px: ${r.before.delta.toFixed(2)}px -> ${r.after.delta.toFixed(2)}px`).join('\n'));
  await page.close();
}
