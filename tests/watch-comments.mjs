import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

export async function runWatchCommentChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/watch-native.html');await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "video" && !!document.querySelector("bili-comments").shadowRoot');
  const patch=async payload=>{assert.equal((await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})')).ok,true);await settle(page);await settle(page);};
  await patch({enabled:true,material:'glass',blur:18,opacity:58,textColor:'#ffffff'});
  const image=await page.evaluate(`(()=>{const c=document.createElement('canvas');c.width=1652;c.height=1100;const x=c.getContext('2d');for(let y=0;y<c.height;y+=8)for(let i=0;i<c.width;i+=8){x.fillStyle=(i/8+y/8)%2?'#fff':'#000';x.fillRect(i,y,8,8);}return c.toDataURL();})()`);
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/BACKGROUND",payload:{dataUrl:'+JSON.stringify(image)+',name:"Comment glass checkerboard"}})');
  await page.evaluate('window.scrollTo(0,850)');await settle(page);await settle(page);
  const state=()=>page.evaluate(`(()=>{const box=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const host=document.querySelector('bili-comments'),list=host.shadowRoot.querySelector('#contents');return {host:box(host),list:box(list),nativeFilter:getComputedStyle(host).backdropFilter,listFilter:getComputedStyle(list).backdropFilter,overlays:document.querySelectorAll('#bc-theme-header-glass,#bc-theme-channel-glass,.bc-theme-surface-glass,.bc-theme-popover-glass').length,replies:[...list.children].map(n=>{const a=box(n),b=box(list);return [a.left-b.left,a.top-b.top,a.width,a.height];})};})()`);
  const frosted=await state();assert.equal(frosted.overlays,0);assert.equal(frosted.nativeFilter,'none','host does not trap fixed editors');assert.match(frosted.listFilter,/blur\(18px\)/,'actual shadow list owns the frost');
  const sample={x:Math.round(frosted.list.left+frosted.list.width*.8),y:Math.max(80,Math.min(1000,Math.round(frosted.list.top+30))),size:32};
  const after=await page.screenshot();
  await page.evaluate(`(()=>{const n=document.createElement('style');n.id='test-no-comment-blur';n.textContent='#contents,#header{backdrop-filter:none!important}';document.querySelector('bili-comments').shadowRoot.append(n);})()`);await settle(page);const before=await page.screenshot();
  assert.deepEqual((await state()).replies,frosted.replies,'native frost does not change reply layout');
  const variance=async bytes=>page.evaluate(`(async()=>{const i=new Image();i.src='data:image/png;base64,${bytes.toString('base64')}';await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);const s=${JSON.stringify(sample)},pixels=x.getImageData(s.x,s.y,s.size,s.size).data,v=[];for(let i=0;i<pixels.length;i+=4)v.push((pixels[i]+pixels[i+1]+pixels[i+2])/3);const m=v.reduce((a,b)=>a+b,0)/v.length;return v.reduce((a,b)=>a+(b-m)**2,0)/v.length;})()`);
  const sharpVariance=await variance(before),blurVariance=await variance(after);assert.ok(sharpVariance>100,'sharp wallpaper baseline '+sharpVariance);assert.ok(blurVariance<sharpVariance*.15,'native CSS frost visibly removes wallpaper detail '+JSON.stringify({sharpVariance,blurVariance}));
  await page.evaluate('document.querySelector("bili-comments").shadowRoot.querySelector("#test-no-comment-blur").remove()');
  for(const width of [1024,1440,1920,2560]){await page.resize(width,1100);for(const y of [0,700,1200,1800]){await page.evaluate('window.scrollTo(0,'+y+')');await settle(page);const s=await state();assert.equal(s.overlays,0);assert.match(s.listFilter,/blur\(/);}}
  await page.evaluate('document.querySelector("bili-comments").style.display="none"');await settle(page);assert.equal((await state()).overlays,0);await page.evaluate('document.querySelector("bili-comments").style.removeProperty("display")');
  await patch({material:'clear'});assert.equal((await state()).listFilter,'none');await patch({material:'glass'});
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]},page.sessionId);await settle(page);assert.equal((await state()).listFilter,'none');await cdp.send('Emulation.setEmulatedMedia',{features:[]},page.sessionId);
  await patch({enabled:false});assert.equal((await state()).listFilter,'none');assert.equal((await state()).overlays,0);
  if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,'comments-sharp.png'),before);await writeFile(join(screenshots,'comments-frosted.png'),after);await writeFile(join(screenshots,'comment-glass.json'),JSON.stringify({sharpVariance,blurVariance,frosted},null,2));}
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();console.log('  PASS comment frost: rendered native CSS blur, unchanged replies, unfiltered host/fixed editors, four widths, scrolling, no overlays, reduced transparency, Clear and restoration');
}
