import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {nativeWatchFixture} from './watch-native.mjs';
import {settle} from './layout-parity.mjs';

const nativeCSS=readFileSync(new URL('./fixtures/watch-native.css',import.meta.url),'utf8');
const slots=[['special-promo','video-page-special-card-small'],['game-promo','video-page-game-card-small'],
  ['small-ad','video-card-ad-small'],['slide_ad','slide-ad-exp'],['floor-ad','ad-floor-exp'],
  ['bottom-ad','right-bottom-banner'],['marked-ad','video-page-card-small'],['tracked-ad','video-page-card-small']];

// Current watch source separates spec.card/spec.game promotions from ordinary
// VideoCardSmall and curated archive recommendations. The screenshot's special
// card has a title/description, with no uploader, duration or play statistics.
export function watchAdsFixture(){
  const promotions=slots.map(([id,className])=>`<div id="${id}" class="${className}" data-watch-promotion ${id==='marked-ad'?'data-is-ad="true"':''} data-v-7627ded0><div class="card-box" data-v-7627ded0><a class="pic-box" href="#promotion" data-v-7627ded0></a><div class="info" data-v-7627ded0><p class="title">体素光追实机！这画面像真的</p><div class="desc">点击即玩！</div>${id==='tracked-ad'?'<div class="ad-report">Sponsored</div>':''}</div></div></div>`).join('');
  return nativeWatchFixture()
    .replace('</style>',nativeCSS+`
      [data-watch-promotion]{margin-bottom:12px}[data-watch-promotion] .card-box{display:flex;gap:10px}
      [data-watch-promotion] .pic-box{width:141px;height:80px;flex:none;background:linear-gradient(45deg,#aeb8a9,#697e83);border-radius:6px}
      [data-watch-promotion] p{margin:0}[data-watch-promotion] .desc{font-size:12px}
    </style>`)
    .replace('<div class="rec-list" data-v-081b3bbd>','<div class="rec-list" data-v-081b3bbd>'+promotions)
    .replace('</aside>','<div id="curated-video" class="video-page-operator-card-small">Curated archive recommendation</div><div id="unmarked-video" class="video-page-card-small" data-is-ad="false" data-ad-id="">广告制作教程 · ordinary video</div></aside>');
}

export async function runWatchAdChecks({cdp,base,until,screenshots}){
  const page=await cdp.page(base+'/watch-ads.html');await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "video"');
  const patch=async payload=>{const r=await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})');assert.equal(r.ok,true);await settle(page);await settle(page);};
  const visible=()=>page.evaluate('Object.fromEntries([...document.querySelectorAll("[data-watch-promotion]")].map(n=>[n.id,!!n.getClientRects().length]))');
  const allHidden=async()=>assert.ok(Object.values(await visible()).every(v=>!v),'all confirmed ad/promotion slots are hidden');
  const allVisible=async()=>assert.ok(Object.values(await visible()).every(Boolean),'ads restore when filtering is off');
  const capture=async name=>{if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}};
  const recommendations=()=>page.evaluate(`(()=>{const box=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};return [...document.querySelectorAll('.recommend-list-v1 .video-page-card-small:not([data-watch-promotion]),#curated-video,#unmarked-video')].map(box);})()`);
  const media=()=>page.evaluate(`['.bpx-player-video-wrap','.bpx-player-control-wrap'].map(s=>{const n=document.querySelector(s),r=n.getBoundingClientRect(),c=getComputedStyle(n);return [r.width,r.height,c.color,c.backgroundColor,c.filter,c.backdropFilter];})`);
  await patch({enabled:false,minimalistEnabled:false,minimalistHideAds:true});await allVisible();const nativeMedia=await media();
  await page.evaluate(`window.originalRecommendations=[...document.querySelectorAll('.recommend-list-v1 .video-page-card-small')];window.originalLink=document.querySelector('.next-play .title');window.linkClicks=0;originalLink.addEventListener('click',e=>{e.preventDefault();linkClicks++;});document.querySelector('.rec-list .video-page-card-small:not([data-watch-promotion]) .title').textContent='RTX Remix 现已登陆《我的世界》 · 广告制作教程';`);
  await patch({enabled:true,material:'glass',minimalistEnabled:false,minimalistHideAds:false});await capture('watch-ads-before');
  await patch({minimalistHideAds:true});await allHidden();
  assert.equal(await page.evaluate('document.documentElement.hasAttribute("data-bc-minimalist")'),false,'watch ads do not require homepage filters');
  assert.deepEqual(await media(),nativeMedia,'player media and playback controls stay native');
  for(const s of ['.next-play .video-page-card-small','.rec-list .video-page-card-small:not([data-watch-promotion])','#curated-video','#unmarked-video'])assert.equal(await page.evaluate(`!!document.querySelector(${JSON.stringify(s)}).getClientRects().length`),true,s+' stays visible');
  await page.evaluate('originalLink.click()');assert.equal(await page.evaluate('linkClicks'),1,'recommendation link listeners survive');
  const hiddenLayout=await recommendations();
  // Hiding a slot must occupy exactly the same space as removing that slot.
  await page.evaluate(`window.savedAdSlots=[...document.querySelectorAll('[data-watch-promotion]')].map(n=>[n,n.nextSibling]);savedAdSlots.forEach(([n])=>n.remove());`);await settle(page);
  assert.deepEqual(await recommendations(),hiddenLayout,'removed ads leave no row, margin or placeholder gap');
  await page.evaluate(`for(const [n,next] of [...savedAdSlots].reverse())document.querySelector('.rec-list').insertBefore(n,next);`);await settle(page);await allHidden();
  await capture('watch-ads-after');
  // Site content and explicit ad flags can arrive after initial rendering.
  await page.evaluate(`const late=document.createElement('div');late.id='late-promo';late.className='video-page-special-card-small';late.dataset.watchPromotion='';late.textContent='Late promotion';document.querySelector('.rec-list').prepend(late);`);await allHidden();
  await page.evaluate('document.querySelector("#unmarked-video").dataset.adId="late-ad"');
  assert.equal(await page.evaluate('document.querySelector("#unmarked-video").getClientRects().length'),0,'late explicit marker hides its complete card');
  await page.evaluate('document.querySelector("#unmarked-video").dataset.adId=""');
  assert.equal(await page.evaluate('!!document.querySelector("#unmarked-video").getClientRects().length'),true,'empty marker restores the card');
  for(const width of [1024,1440,1920,2560]){await page.resize(width,1100);await settle(page);await allHidden();}
  await patch({material:'clear'});await allHidden();
  await patch({enabled:false,minimalistEnabled:true});await allHidden();
  await patch({minimalistHideAds:false});await allVisible();
  await patch({enabled:true,minimalistHideAds:true});
  await page.evaluate('history.pushState({},"","/opus/123")');await until(page,'document.documentElement.dataset.bcPage === "opus"');await allVisible();
  await page.evaluate('history.pushState({},"","/video/BV-test")');await until(page,'document.documentElement.dataset.bcPage === "video"');await allHidden();
  assert.equal(await page.evaluate('originalRecommendations.every(n=>n.isConnected) && originalLink===document.querySelector(".next-play .title")'),true,'native nodes are preserved');
  await patch({enabled:false,minimalistEnabled:false});await allVisible();
  await until(page,'!document.querySelector("[data-bc-owned]")');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS watch ads: native promotion slots, no gaps, preserved ordinary/curated recommendations and player, late ads/markers, four widths, Clear, theme/filter-only, toggle and SPA restoration');
}
