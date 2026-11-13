import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

// Computed blur is insufficient: a backdrop-filter on an ancestor can prevent
// an overflowing menu from sampling the page, despite its own computed blur.
export async function runGlassConsistencyChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/subpage-menus.html');await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  const patch=async payload=>{await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})');await settle(page);await settle(page);};
  await patch({enabled:true,material:'glass',opacity:58,blur:18,textColor:'#ffffff'});
  await page.evaluate(`(()=>{
    const detail=document.createElement('div');detail.id='frost-detail';detail.style.cssText='position:fixed;inset:0;pointer-events:none;background:repeating-conic-gradient(#fff 0% 25%,#000 0% 50%) 0 0 / 12px 12px';document.body.prepend(detail);
    document.querySelector('main').style.visibility='hidden';
    const manga=document.createElement('div');manga.className='v-popover is-bottom-start';manga.style.left='1100px';manga.innerHTML='<div id="manga-menu" class="v-popover-content" style="width:380px;padding:16px"><div class="frost-probe" style="height:64px"></div><div class="manga-panel-popover"><h2>人气漫画</h2><p>Native manga menu</p></div></div>';document.querySelector('.bili-header__bar').append(manga);
    for(const id of ['profile','services']){const p=document.createElement('div');p.className='frost-probe';p.style.cssText='height:64px;min-width:80px';document.querySelector('#'+id+'-menu').prepend(p);}
    document.querySelector('#profile-positioner').hidden=false;document.querySelector('#services-trigger').focus();
  })()`);
  await until(page,'getComputedStyle(document.querySelector("#services-menu").parentElement).opacity === "1"');await settle(page);
  const samples=await page.evaluate(`[{selector:'.bili-header__bar',x:20,y:16,size:32},...['#profile-menu','#services-menu','#manga-menu'].map(s=>{const r=document.querySelector(s+' > .frost-probe').getBoundingClientRect();return {selector:s,x:Math.round(r.x+r.width/2-16),y:Math.round(r.y+16),size:32};})]`);
  const variance=async bytes=>page.evaluate(`(async()=>{
    const i=new Image();i.src='data:image/png;base64,${bytes.toString('base64')}';await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);
    return ${JSON.stringify(samples)}.map(s=>{const d=x.getImageData(s.x,s.y,s.size,s.size).data,v=[];for(let j=0;j<d.length;j+=4)v.push((d[j]+d[j+1]+d[j+2])/3);const m=v.reduce((a,b)=>a+b,0)/v.length;return {selector:s.selector,mean:m,variance:v.reduce((a,b)=>a+(b-m)**2,0)/v.length};});
  })()`);
  const frosted=await page.screenshot();
  await page.evaluate(`(()=>{const s=document.createElement('style');s.id='test-sharp-glass';s.textContent='html body :is(.bili-header__bar,.v-popover-content),html body :is(.bili-header__bar,.v-popover-content)::before{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';document.head.append(s);})()`);await settle(page);
  const sharp=await page.screenshot(),before=await variance(sharp),after=await variance(frosted);
  if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,'menus-sharp.png'),sharp);await writeFile(join(screenshots,'menus-frosted.png'),frosted);await writeFile(join(screenshots,'glass-consistency.json'),JSON.stringify({before,after},null,2));}
  for(let i=0;i<samples.length;i++){
    assert.ok(before[i].variance>100,'busy page is visible in sharp control: '+JSON.stringify(before[i]));
    assert.ok(after[i].variance<before[i].variance*.15,'menu visibly frosts page detail: '+JSON.stringify({before:before[i],after:after[i]}));
    assert.ok(Math.abs(after[i].mean-before[i].mean)<3,'frost retains the saved tint without doubling it');
  }
  await page.evaluate('document.querySelector("#test-sharp-glass").remove()');
  assert.equal(await page.evaluate('document.querySelectorAll("#bc-theme-header-glass,#bc-theme-channel-glass,.bc-theme-surface-glass,.bc-theme-popover-glass").length'),0,'no dynamic overlays');
  const filters=()=>page.evaluate(`['.bili-header__bar','#profile-menu','#services-menu','#manga-menu'].map(s=>{const n=document.querySelector(s);return {parent:getComputedStyle(n).backdropFilter,paint:getComputedStyle(n,'::before').backdropFilter,content:getComputedStyle(n,'::before').content};})`);
  for(const s of await filters()){assert.equal(s.parent,'none','menu ancestors introduce no backdrop root');assert.match(s.paint,/blur\(/);}
  await patch({blur:0});for(const s of await filters())assert.equal(s.paint,'none','zero blur disables CSS frost');
  await patch({blur:18});await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]},page.sessionId);await settle(page);
  for(const s of await filters())assert.equal(s.paint,'none','reduced transparency disables CSS frost');
  await cdp.send('Emulation.setEmulatedMedia',{features:[]},page.sessionId);
  await patch({material:'clear'});for(const s of await filters()){assert.equal(s.paint,'none');assert.ok(['none','normal'].includes(s.content),'Clear removes generated backing');}
  await patch({enabled:false});for(const s of await filters())assert.ok(['none','normal'].includes(s.content),'disabled theme restores native pseudo-elements');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS rendered glass consistency: header, profile, overflowing submenu and manga menu frost busy page detail; no dynamic overlays, zero blur, reduced transparency, Clear and restoration');
}
