import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle,assertVisualOnlyCSS} from './layout-parity.mjs';

const pages={
  home:['bili-feed4','bili-video-card__info'],dynamic:['bili-dyn-home','bili-dyn-item'],
  video:['video-container','video-desc-container'],space:['space-main','section-wrap'],
  search:['search-page','user-item'],article:['article-page','article-container'],
  opus:['opus-detail','opus-detail-content'],bangumi:['bangumi-container','bangumi-info'],
  live:['live-room-app','room-info-ctnr'],message:['message-layout','message-box-shadow'],other:['unknown-page','native-panel']
};

export function crossPageGlassFixture(name){
  const [layout,panel]=pages[name]||[];assert.ok(layout);
  let content=`<section id="page-panel" class="${panel}"><div class="panel-probe"></div><div class="native-anchor"><button id="menu-trigger">Options</button><div id="page-menu" class="bili-popover__content" role="menu"><div class="menu-probe"></div><button id="submenu-trigger">More</button><div id="nested-menu" class="van-popover" role="menu"><div class="menu-probe"></div><button id="menu-action">Native action</button></div></div></div><span id="native-fixed">Fixed</span></section>`;
  if(name==='home')content=`<div class="bili-video-card"><div class="bili-video-card__wrap">${content}</div></div>`;
  if(name==='message')content=`<main class="message-main">${content}</main>`;
  return `<!doctype html><html><meta charset="utf-8"><style>
    body{margin:0;min-height:1600px;font:14px/1.5 Arial}#detail{position:fixed;inset:0;z-index:-1;background:repeating-conic-gradient(#fff 0% 25%,#000 0% 50%) 0 0/12px 12px}
    .test-layout{padding:100px 160px}#page-panel{box-sizing:border-box;width:440px;height:240px;background:#fff;color:#18191c;padding:24px}
    #page-panel.authored-sticky{position:sticky;top:90px}#page-panel.authored-fixed{position:fixed;left:160px;top:100px}
    .panel-probe{height:64px}.native-anchor{position:relative}.bili-popover__content,.van-popover{box-sizing:border-box;position:absolute;width:220px;height:170px;padding:16px;background:#fff;border-radius:8px;z-index:10}
    #page-menu{left:350px;top:30px}#nested-menu{left:210px;top:110px}.menu-probe{height:64px}
    #page-menu::before{content:"";position:absolute;top:-6px;left:20px;width:12px;height:12px;transform:rotate(45deg);background:rgb(180,70,90)}
    #native-fixed{position:fixed;right:8px;bottom:8px;background:#fb7299;color:#fff}button{font:inherit;cursor:pointer}#page-menu[hidden],#nested-menu[hidden]{display:none}
  </style><script src="/bridge.js"></script><script src="/settings.js" defer></script><script src="/theme.js" defer></script><script src="/minimalist.js" defer></script><script src="/content.js" defer></script>
  <body><div id="detail"></div><div class="${layout} test-layout">${content}</div><script>
    window.actions=0;document.querySelector('#menu-action').onclick=()=>actions++;
    document.querySelector('#menu-trigger').onclick=()=>document.querySelector('#page-menu').hidden=!document.querySelector('#page-menu').hidden;
  </script></body></html>`;
}

export async function runCrossPageGlassChecks({cdp,base,until,screenshots}){
  for(const name of Object.keys(pages)){
    const page=await cdp.page(base+'/page-glass/'+name);await page.activate();await page.resize(1440,1000);
    await until(page,'document.documentElement.dataset.bcPage === '+JSON.stringify(name));
    const patch=async payload=>{await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})');await settle(page);await settle(page);};
    const geometry=()=>page.evaluate(`['#page-panel','.native-anchor','#page-menu','#nested-menu','#native-fixed'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.x,r.y,r.width,r.height];})`);
    const arrow=()=>page.evaluate(`(()=>{const s=getComputedStyle(document.querySelector('#page-menu'),'::before');return [s.content,s.width,s.height,s.transform,s.backgroundColor];})()`);
    await patch({enabled:false,minimalistEnabled:false});const native=await geometry(),nativeArrow=await arrow();
    await patch({enabled:true,material:'glass',opacity:58,blur:18,textColor:'#ffffff'});
    const samples=await page.evaluate(`['#page-panel > .panel-probe','#page-menu > .menu-probe','#nested-menu > .menu-probe'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {selector:s,x:Math.round(r.x+r.width/2-16),y:Math.round(r.y+16),size:32};})`);
    const pixels=async bytes=>page.evaluate(`(async()=>{const i=new Image();i.src='data:image/png;base64,${bytes.toString('base64')}';await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);return ${JSON.stringify(samples)}.map(s=>{const d=x.getImageData(s.x,s.y,s.size,s.size).data,v=[];for(let j=0;j<d.length;j+=4)v.push((d[j]+d[j+1]+d[j+2])/3);const mean=v.reduce((a,b)=>a+b,0)/v.length;return {selector:s.selector,mean,variance:v.reduce((a,b)=>a+(b-mean)**2,0)/v.length};});})()`);
    const frosted=await page.screenshot();
    await page.evaluate(`(()=>{const s=document.createElement('style');s.id='sharp-control';s.textContent='html body *,html body *::before,html body *::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';document.head.append(s);})()`);await settle(page);
    const sharp=await page.screenshot(),before=await pixels(sharp),after=await pixels(frosted);
    await page.evaluate('document.querySelector("#sharp-control").remove()');
    if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'-frosted.png'),frosted);await writeFile(join(screenshots,name+'-sharp.png'),sharp);await writeFile(join(screenshots,name+'-glass.json'),JSON.stringify({before,after},null,2));}
    for(let i=name==='other'?1:0;i<samples.length;i++){
      assert.ok(before[i].variance>100,name+' sharp control contains wallpaper detail '+JSON.stringify(before[i]));
      assert.ok(after[i].variance<before[i].variance*.15,name+' actual frost on page panel and overflowing menus '+JSON.stringify({before:before[i],after:after[i]}));
      assert.ok(Math.abs(after[i].mean-before[i].mean)<3,name+' keeps one tint');
    }
    assert.deepEqual(await geometry(),native,name+' preserves panel, anchored menus and fixed descendant geometry');
    assert.deepEqual(await arrow(),nativeArrow,name+' keeps native menu arrow');
    await assertVisualOnlyCSS(page);
    for(const position of ['sticky','fixed']){
      await page.evaluate('document.querySelector("#page-panel").classList.add("authored-'+position+'")');await settle(page);
      assert.equal(await page.evaluate('getComputedStyle(document.querySelector("#page-panel")).position'),position,name+' preserves authored '+position+' position');
      const fixed=await page.evaluate('(()=>{const r=document.querySelector("#native-fixed").getBoundingClientRect();return [r.right,r.bottom];})()');
      const box=native.at(-1);assert.deepEqual(fixed,[box[0]+box[2],box[1]+box[3]],name+' fixed descendant stays relative to viewport');
      await page.evaluate('document.querySelector("#page-panel").classList.remove("authored-'+position+'")');
    }
    await page.evaluate('document.querySelector("#menu-action").click()');assert.equal(await page.evaluate('actions'),1);
    assert.equal(await page.evaluate('document.querySelectorAll("#bc-theme-header-glass,#bc-theme-channel-glass,.bc-theme-surface-glass,.bc-theme-popover-glass").length'),0);
    await patch({material:'clear'});assert.deepEqual(await geometry(),native,name+' Clear geometry');
    await patch({enabled:false});assert.deepEqual(await geometry(),native,name+' restored geometry');
    await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  }
  console.log('  PASS cross-page rendered frost: eleven page types, panel/overflowing menu/submenu, native arrows and fixed coordinates, interactions, no overlays, Clear and restore');
}
