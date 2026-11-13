import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

export async function runWatchCommentChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/watch-native.html');
  await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "video" && !!document.querySelector("bili-comments").shadowRoot');
  const patch=async payload=>{
    const reply=await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})');
    assert.equal(reply.ok,true);await settle(page);await settle(page);
  };
  await patch({enabled:true,material:'glass',blur:18,opacity:58,textColor:'#ffffff'});
  const image=await page.evaluate(`(()=>{
    const c=document.createElement('canvas');c.width=1652;c.height=1100;const x=c.getContext('2d');
    for(let y=0;y<c.height;y+=8)for(let i=0;i<c.width;i+=8){x.fillStyle=(i/8+y/8)%2?'#fff':'#000';x.fillRect(i,y,8,8);}
    return c.toDataURL();
  })()`);
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/BACKGROUND",payload:{dataUrl:'+JSON.stringify(image)+',name:"Comment glass checkerboard"}})');
  await page.evaluate('window.scrollTo(0,850)');await settle(page);await settle(page);
  const state=()=>page.evaluate(`(()=>{
    const box=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const host=document.querySelector('bili-comments'),list=host.shadowRoot.querySelector('#contents');
    return {host:box(host),height:innerHeight,width:innerWidth,
      layers:[...document.querySelectorAll('[data-bc-surface-kind="comments"]')].map(n=>({...box(n),filter:getComputedStyle(n).backdropFilter,pointer:getComputedStyle(n).pointerEvents})),
      nativeFilter:getComputedStyle(host).backdropFilter,listFilter:getComputedStyle(list).backdropFilter,
      replies:[...list.children].map(n=>{const a=box(n),b=box(list);return [a.left-b.left,a.top-b.top,a.width,a.height];})};
  })()`);
  const frosted=await state();
  assert.equal(frosted.layers.length,1,'one frost behind the comments, shared across header and replies');
  assert.match(frosted.layers[0].filter,/blur\(18px\)/);
  assert.equal(frosted.layers[0].pointer,'none','paint cannot intercept comment interactions');
  assert.equal(frosted.nativeFilter,'none');assert.equal(frosted.listFilter,'none','native list acquires no backdrop containing block');
  const sample={x:Math.round(frosted.host.left+frosted.host.width*.8),y:200,size:32};
  const after=await page.screenshot();
  await page.evaluate(`(()=>{const n=document.createElement('style');n.id='test-no-comment-blur';n.dataset.bcOwned='test';n.textContent='[data-bc-surface-kind="comments"]{backdrop-filter:none!important}';document.head.append(n);})()`);
  await settle(page);const before=await page.screenshot();
  assert.deepEqual((await state()).replies,frosted.replies,'frost changes no reply geometry');
  const variance=async bytes=>page.evaluate(`(async()=>{
    const image=new Image();image.src='data:image/png;base64,${bytes.toString('base64')}';await image.decode();
    const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);
    const s=${JSON.stringify(sample)},pixels=x.getImageData(s.x,s.y,s.size,s.size).data,values=[];
    for(let i=0;i<pixels.length;i+=4)values.push((pixels[i]+pixels[i+1]+pixels[i+2])/3);
    const mean=values.reduce((a,b)=>a+b,0)/values.length;return values.reduce((a,b)=>a+(b-mean)**2,0)/values.length;
  })()`);
  const sharpVariance=await variance(before),blurVariance=await variance(after);
  assert.ok(sharpVariance>100,'baseline reproduces sharp wallpaper behind comments: '+sharpVariance);
  assert.ok(blurVariance<sharpVariance*.15,'rendered frost removes wallpaper detail: '+JSON.stringify({sharpVariance,blurVariance}));
  await page.evaluate('document.querySelector("#test-no-comment-blur").remove()');await settle(page);
  for(const width of [1024,1440,1920,2560]) {
    await page.resize(width,1100);
    for(const y of [0,700,1200,1800]) {
      await page.evaluate('window.scrollTo(0,'+y+')');await settle(page);await settle(page);
      const s=await state(),visible=s.host.bottom>0 && s.host.top<s.height;
      assert.equal(s.layers.length,visible?1:0,'no missing or offscreen comment frost');
      for(const layer of s.layers){
        assert.ok(layer.top>=0 && layer.bottom<=s.height && layer.height<=s.height,'blur stays within viewport');
        assert.ok(Math.abs(layer.top-Math.max(0,s.host.top))<1 && Math.abs(layer.bottom-Math.min(s.height,s.host.bottom))<1,'frost follows the visible comments on scroll');
        assert.ok(layer.left>=0 && layer.right<=s.width,'horizontal viewport bound');
      }
    }
  }
  await page.evaluate('document.querySelector("bili-comments").style.display="none"');await settle(page);await settle(page);
  assert.equal((await state()).layers.length,0,'hidden comments leave no blur sheet');
  await page.evaluate('document.querySelector("bili-comments").style.removeProperty("display")');await settle(page);await settle(page);
  await patch({material:'clear'});assert.equal((await state()).layers.length,0,'Clear removes comment frost');
  await patch({material:'glass'});
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:'reduce'}]},page.sessionId);await settle(page);
  for(const layer of (await state()).layers)assert.equal(layer.filter,'none','reduced transparency disables blur');
  await cdp.send('Emulation.setEmulatedMedia',{features:[]},page.sessionId);
  await patch({enabled:false});assert.equal((await state()).layers.length,0,'disabled theme removes frost');
  if(screenshots){
    await mkdir(screenshots,{recursive:true});
    await writeFile(join(screenshots,'comments-sharp.png'),before);await writeFile(join(screenshots,'comments-frosted.png'),after);
    await writeFile(join(screenshots,'comment-glass.json'),JSON.stringify({sharpVariance,blurVariance,frosted},null,2));
  }
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS comment frost: rendered wallpaper detail reduced, one viewport-bounded layer, native reply geometry/input, four widths/scrolling, hiding, reduced transparency, Clear and disabled cleanup');
}
