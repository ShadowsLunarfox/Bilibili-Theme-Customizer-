import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {homescreenFixture} from './homescreen.mjs';
import {measure,compare,settle,widths} from './layout-parity.mjs';

export function filteredLayoutFixture(BC) {
  // Domestic slots are divs. Native nth-of-type rules count hidden ad slots;
  // a gap-only fixture cannot reproduce their 0/40/24px margin transitions.
  return homescreenFixture(BC).replaceAll('<article','<div').replaceAll('</article>','</div>')
    .replace('<span class="bili-video-card__info--creative-ad">推广</span>','')
    .replace('<span class="bili-video-card__info--ad">广告</span></div></div></div></div></div>','</div></div></div></div></div>')
    .replace('<div class="bili-feed-ad" id="ad-slot">Explicit ad slot</div>','')
    .replace('id="normal-0" class="bili-video-card"','id="normal-0" class="bili-video-card" data-is-ad="true"')
    .replace('id="normal-1" class="bili-video-card"','id="normal-1" class="bili-video-card" data-is-ad="true"')
    .replace('</style>',`</style><style>
      #first-grid{gap:20px;grid-template-columns:repeat(5,minmax(0,1fr))}
      #first-grid>*:nth-of-type(n+8){margin-top:40px}
      #first-grid>*:nth-of-type(n+13){margin-top:24px}
      @media(max-width:1399px){
        #first-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
        #first-grid>*:nth-of-type(n+6){margin-top:40px}
        #first-grid>*:nth-of-type(n+13){margin-top:22px}
      }
    </style>`);
}

export function nestedLayoutFixture(BC) {
  return filteredLayoutFixture(BC).replace('</style>',`</style><style>
    .recommended-container_floor-aside .container .floor-single-card:first-of-type{margin-top:40px}
  </style>`).replace('</body>',`<script>
    const grid=document.querySelector('#first-grid');
    for(const card of [...grid.children])if(card.matches('.bili-video-card')){
      const slot=document.createElement('div');slot.className='feed-card';slot.id=card.id+'-slot';
      const inner=document.createElement('div');inner.className='bili-feed-card';
      card.before(slot);slot.append(inner);inner.append(card);
    }
    document.querySelector('#analytics').parentElement.classList.add('floor-single-card');
  </script></body>`);
}

export async function runNestedLayoutChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/nested-layout.html');
  await page.activate();await page.resize(1920,1080);
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  const patch=async changes=>{
    const r=await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:${JSON.stringify(changes)}})`);
    assert.equal(r.ok,true);
    await until(page,`document.documentElement.hasAttribute('data-bc-enabled')===${r.data.settings.enabled} &&
      document.documentElement.hasAttribute('data-bc-minimalist')===${r.data.settings.minimalistEnabled}`);
    await settle(page);
  };
  const media=()=>page.evaluate(`(()=>{
    const rows=[];
    for(const slot of document.querySelector('#first-grid').children){
      if(getComputedStyle(slot).display==='none')continue;
      const cover=slot.querySelector('.bili-video-card__image--wrap');if(!cover)continue;
      const r=cover.getBoundingClientRect(),s=slot.getBoundingClientRect();
      const origin=s.top-parseFloat(getComputedStyle(slot).marginTop);
      let row=rows.find(row=>Math.abs(row.origin-origin)<1);
      if(!row){row={origin,covers:[]};rows.push(row);}
      row.covers.push({top:r.top,width:r.width,height:r.height});
    }
    return rows;
  })()`);
  const aligned=async label=>{
    for(const row of await media()) {
      assert.ok(Math.max(...row.covers.map(c=>c.top))-Math.min(...row.covers.map(c=>c.top))<1,label);
      for(const c of row.covers)assert.ok(Math.abs(c.width/c.height-16/9)<.01,'native thumbnail ratio');
    }
  };
  await patch({enabled:false,minimalistEnabled:false});
  const original=await measure(page);
  const nativeRows=await media();
  assert.ok(nativeRows.some(row=>Math.max(...row.covers.map(c=>c.top))-Math.min(...row.covers.map(c=>c.top))>=40),
    'native nested wrapper reproduces the displacement with no hidden slots');
  if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,'nested-layout-before.png'),await page.screenshot());}
  await patch({enabled:true});
  await aligned('theme alone aligns nested covers');
  const tops=await page.evaluate(`['nested-ad','organic','analytics'].map(id=>document.querySelector('#'+id+' .bili-video-card__image--wrap').getBoundingClientRect().top)`);
  assert.ok(Math.max(...tops)-Math.min(...tops)<1,'second row rightmost cover matches its two neighbors');
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector("#analytics").parentElement).marginTop'),'0px','remove the excess inner margin instead of adding a negative slot margin');
  assert.equal(await page.evaluate('[...document.querySelectorAll("[data-bc-feed-margin]")].every(n=>parseFloat(getComputedStyle(n).marginTop)>=0)'),true);
  const fixed=await measure(page);
  assert.deepEqual(fixed.components.thumbnail.map(t=>t.rect.slice(2)),original.components.thumbnail.map(t=>t.rect.slice(2)),'native image sizes remain intact');
  if(screenshots)await writeFile(join(screenshots,'nested-layout-after.png'),await page.screenshot());
  for(const width of widths){await page.resize(width,1000);await settle(page);await aligned('nested width '+width);}
  await patch({minimalistEnabled:true,minimalistHideAds:true});await aligned('nested filtered covers');
  await patch({enabled:false});await aligned('nested filters without wallpaper');
  await patch({enabled:true,minimalistEnabled:false,material:'clear'});await aligned('Clear without filters');
  await page.evaluate('document.querySelector("#analytics").parentElement.style.marginTop="56px"');
  await settle(page);await aligned('late nested margin changes');
  await page.evaluate('document.querySelector("#analytics").parentElement.style.removeProperty("margin-top")');
  await settle(page);await aligned('restored nested margin');
  // Match the live profile: another blocker hides slots 5/9 while this
  // extension's homepage filters are disabled. The theme still repairs rows.
  await page.evaluate(`for(const i of [4,8])document.querySelector('#first-grid').children[i].style.display='none'`);
  await settle(page);await aligned('external blocker with homepage filters disabled');
  await page.evaluate(`for(const i of [4,8]){
    const n=document.querySelector('#first-grid').children[i];n.style.removeProperty('display');
    if(!n.getAttribute('style'))n.removeAttribute('style');
  }`);
  await settle(page);await aligned('external blocker restored');
  await page.resize(1920,1080);await settle(page);
  await patch({enabled:false,minimalistEnabled:false});
  compare(original,await measure(page),'disabling restores native nested sizing');
  assert.equal(await page.evaluate('document.querySelectorAll("[data-bc-feed-margin]").length'),0);
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await page.close();
  console.log('  PASS nested homepage sizing: 40px mismatch without filters, external blocker, seven widths, native thumbnails/inner margins, late margins, Clear and restoration');
}

export async function runFilteredLayoutChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/filtered-layout.html');
  await page.activate();
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  const patch=async changes=>{
    const r=await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:${JSON.stringify(changes)}})`);
    assert.equal(r.ok,true);
    await until(page,`document.documentElement.getAttribute('data-bc-min-options')===BiliThemeMinimalist.flags(${JSON.stringify(r.data.settings)}) &&
      document.documentElement.hasAttribute('data-bc-minimalist')===${r.data.settings.minimalistEnabled}`);
    await settle(page);
  };
  const rows=()=>page.evaluate(`(()=>{
    const rows=[];
    for(const n of document.querySelector('#first-grid').children){
      const s=getComputedStyle(n),r=n.getBoundingClientRect();
      if(s.display==='none'||n.matches('.recommended-swipe'))continue;
      const origin=r.top-parseFloat(s.marginTop);
      let row=rows.find(row=>Math.abs(row.origin-origin)<1);
      if(!row){row={origin,tops:[],margins:[]};rows.push(row);}
      row.tops.push(r.top);row.margins.push(s.marginTop);
    }
    return rows;
  })()`);
  const aligned=async label=>{
    const measured=await rows();
    assert.ok(measured.some(row=>row.tops.length>1),'multiple cards share a row');
    for(const row of measured)assert.ok(Math.max(...row.tops)-Math.min(...row.tops)<1,label+': '+JSON.stringify(row));
  };
  const capture=async name=>{
    if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}
  };
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await patch({minimalistEnabled:false});
  await page.resize(1920,1080);await settle(page);
  const native=await measure(page);
  const children=await page.evaluate('[...document.querySelector("#first-grid").children].map(n=>n.id)');
  await patch({minimalistEnabled:true,minimalistHideAds:true,minimalistHideBanner:false});
  await until(page,'document.querySelector("[data-bc-feed-margin]")!==null');
  await aligned('filtered desktop');
  for(const ids of [['organic-wrapper','analytics','normal-2'],['normal-3','normal-4','normal-5','normal-6','normal-7']]) {
    const tops=await page.evaluate(`${JSON.stringify(ids)}.map(id=>document.getElementById(id).getBoundingClientRect().top)`);
    assert.ok(Math.max(...tops)-Math.min(...tops)<1,'the reported second and third rows align');
  }
  // Removing only our margin corrections exposes the original screenshot bug.
  const broken=await page.evaluate(`(()=>{
    for(const n of document.querySelectorAll('[data-bc-feed-margin]'))n.removeAttribute('data-bc-feed-margin');
    const a=document.querySelector('#organic-wrapper').getBoundingClientRect(),b=document.querySelector('#normal-2').getBoundingClientRect();
    return Math.abs(a.top-b.top);
  })()`);
  assert.ok(broken>=40,'fixture reproduces the displaced second-row card');
  await page.resize(1919,1080);await settle(page);await aligned('restored correction');
  await capture('filtered-layout-after');
  for(const width of widths){await page.resize(width,1000);await settle(page);await aligned('width '+width);}
  await patch({material:'clear',enabled:false});await aligned('filters without wallpaper');
  await patch({minimalistHideCarousel:true});await aligned('carousel hidden');
  await patch({minimalistHideCarousel:false});
  await page.evaluate('document.querySelector("#normal-3").setAttribute("data-is-ad","true")');
  await settle(page);await aligned('late ad attribute');
  await page.evaluate('document.querySelector("#normal-3").removeAttribute("data-is-ad")');
  await settle(page);await aligned('ad attribute removed');
  await patch({enabled:true,material:'glass',minimalistHideAds:false});
  assert.equal(await page.evaluate('document.querySelectorAll("[data-bc-feed-margin]").length'),0,'already aligned rows need no compensation');
  assert.equal(await page.evaluate('[...document.querySelectorAll("#first-grid > *")].some(n=>n.hasAttribute("style"))'),false,'original absence of inline styles is restored');
  await patch({minimalistEnabled:false});
  await page.resize(1920,1080);await settle(page);
  compare(native,await measure(page),'filter removal restores all native margins');
  assert.deepEqual(await page.evaluate('[...document.querySelector("#first-grid").children].map(n=>n.id)'),children,'native children stay in place');
  await patch({minimalistEnabled:true,minimalistHideAds:true});
  await page.evaluate('history.pushState({},"","/video/BV-filter-test");dispatchEvent(new PopStateEvent("popstate"))');
  await until(page,'document.documentElement.dataset.bcPage === "video"');
  await settle(page);
  assert.equal(await page.evaluate('document.querySelectorAll("[data-bc-feed-margin]").length'),0,'SPA navigation cleans corrections');
  assert.equal(await page.evaluate('[...document.querySelectorAll("#first-grid > *")].some(n=>n.style.getPropertyValue("--bc-feed-margin-top"))'),false);
  await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/RESET'})");
  await page.close();
  console.log('  PASS filtered native rows: reproduced 40px displacement, aligned at seven widths, resize/late ads/Clear/carousel, restoration and SPA cleanup');
}
