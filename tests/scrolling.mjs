import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

export async function runScrollingChecks({cdp,base,until,screenshots,baseline=false}) {
  const page=await cdp.page(base+'/home-surfaces.html');await page.activate();await page.resize(1440,1000);
  await until(page,'document.documentElement.dataset.bcPage === "home" && !!window.loadingNode');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await settle(page);
  await page.evaluate(`(()=>{
    const grid=document.querySelector('#first-grid'),live=document.querySelector('#native-live');
    // The official live card reserves space with a visibility-hidden skeleton,
    // overlays an absolute wrap, and gives its caption a fixed native height.
    live.classList.add('bili-live-card__short');
    live.querySelector('.bili-live-card__skeleton').innerHTML='<div class="bili-live-card__skeleton--cover"></div><div class="bili-live-card__skeleton--info"></div>';
    live.querySelector('.bili-live-card__info').innerHTML='<div class="bili-live-card__info--text"><h3 class="bili-live-card__info--tit"><span class="bili-live-card__info--living">直播中</span> Native live title</h3><a class="bili-live-card__info--uname"><span class="bili-live-card__info--author">Native live uploader</span></a></div>';
    const css=document.createElement('style');css.textContent='.bili-live-card__skeleton.hide{display:block;visibility:hidden}.bili-live-card__skeleton--info{height:68px;margin-top:10px}.bili-live-card__wrap{position:absolute;top:0;left:0;width:100%}.bili-live-card__wrap.hide{display:none}.bili-live-card .bili-live-card__info{height:42px}.bili-live-card__info--text{position:relative;flex:1}.bili-live-card__short .bili-live-card__info--tit{height:22px}.bili-live-card__info--uname{display:inline-flex;flex:1;margin-top:4px;line-height:16px}';document.head.append(css);
    grid.insertBefore(live,grid.children[3]);
    for(let i=0;i<120;i++){const card=document.querySelector('#normal').cloneNode(true);card.removeAttribute('id');grid.append(card);}
    globalThis.scrollCounts={rects:0,styles:0,cardRects:0,writes:0,feedWrites:0};globalThis.countScrollWork=false;
    const box=Element.prototype.getBoundingClientRect,computed=window.getComputedStyle;
    Element.prototype.getBoundingClientRect=function(...args){if(countScrollWork){scrollCounts.rects++;if(this.matches('.bili-video-card__image--wrap,.bili-video-card__info,.bili-live-card__info'))scrollCounts.cardRects++;}return box.apply(this,args);};
    window.getComputedStyle=function(...args){if(countScrollWork)scrollCounts.styles++;return computed.apply(this,args);};
    const writes=new MutationObserver(records=>{if(countScrollWork)for(const r of records){if(r.target.matches?.('[data-bc-owned]'))scrollCounts.writes++;if(r.attributeName==='data-bc-feed-margin'||r.target.hasAttribute?.('data-bc-feed-margin'))scrollCounts.feedWrites++;}});
    writes.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['style','data-bc-feed-margin']});
  })()`);await settle(page);await settle(page);
  const liveBounds=()=>page.evaluate(`(()=>{const n=document.querySelector('#native-live'),info=n.querySelector('.bili-live-card__info'),meta=n.querySelector('.bili-live-card__info--uname');return {infoBottom:info.getBoundingClientRect().bottom,metadataBottom:meta.getBoundingClientRect().bottom,slotBottom:n.getBoundingClientRect().bottom};})()`);
  const live=await liveBounds();
  if(!baseline){
    for(const width of [1024,1280,1440,1600,1920,2560]){
      await page.resize(width,1000);await settle(page);await settle(page);const b=await liveBounds();
      assert.ok(b.metadataBottom<=b.infoBottom-11,width+': live uploader stays inside padded glass');
      assert.ok(Math.abs(b.infoBottom-b.slotBottom)<=1,width+': live panel fills its grid slot');
    }
    await page.resize(1440,1000);await settle(page);await settle(page);
    await page.evaluate('document.querySelector("#native-live .bili-live-card__wrap").classList.add("hide");document.querySelector("#native-live .bili-live-card__skeleton").classList.remove("hide")');await settle(page);
    assert.equal(await page.evaluate('getComputedStyle(document.querySelector("#native-live .bili-live-card__skeleton")).display'),'flex','native loading skeleton remains visible');
    await page.evaluate('document.querySelector("#native-live .bili-live-card__wrap").classList.remove("hide");document.querySelector("#native-live .bili-live-card__skeleton").classList.add("hide")');await settle(page);await settle(page);
  }
  const report=await page.evaluate(`(async()=>{
    let maxDrift=0;const frames=[];let last=performance.now();
    const inspect=()=>{const counting=countScrollWork;countScrollWork=false;
      const layers=[...document.querySelectorAll('[data-bc-surface-kind="video-info"]')];
      for(const info of [...document.querySelectorAll('.bili-video-card__wrap > .bili-video-card__info')].slice(0,5)){
        const r=info.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight)continue;
        const layer=layers.find(n=>Math.abs(n.getBoundingClientRect().left-r.left)<1&&Math.abs(n.getBoundingClientRect().width-r.width)<1&&Math.abs(n.getBoundingClientRect().bottom-r.bottom)<100);
        if(layer)maxDrift=Math.max(maxDrift,Math.abs(layer.getBoundingClientRect().bottom-r.bottom));
      }countScrollWork=counting;
    };
    const listener=()=>inspect();document.addEventListener('scroll',listener,{capture:true,passive:true});
    countScrollWork=true;
    for(let i=0;i<48;i++){
      window.scrollTo(0,i*2);document.querySelector('#normal .bili-video-card__stats').style.opacity=i%2?'.99':'1';
      await new Promise(r=>requestAnimationFrame(r));const now=performance.now();frames.push(now-last);last=now;
    }
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));countScrollWork=false;
    document.removeEventListener('scroll',listener,true);
    return {...scrollCounts,maxDrift,frames};
  })()`);
  if(!baseline){assert.ok(report.maxDrift<=1,'glass follows cards during scroll events: '+report.maxDrift);assert.ok(report.cardRects<200,'small scrolls/preview opacity changes must not rescan all feed cards: '+report.cardRects);assert.equal(report.feedWrites,0,'scrolling does not rewrite card margins');}
  if(!baseline){
    const wrapperWork=await page.evaluate(`(async()=>{
      scrollCounts.cardRects=0;countScrollWork=true;
      for(let i=0;i<24;i++){document.querySelector('#normal .bili-video-card__wrap').style.opacity=i%2?'.99':'1';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}
      countScrollWork=false;return scrollCounts.cardRects;
    })()`);
    assert.ok(wrapperWork<120,'one card state change only measures that card: '+wrapperWork);
    await page.evaluate('document.querySelector("#normal .bili-video-card__wrap").style.marginTop="13px"');await settle(page);await settle(page);
    assert.equal(await page.evaluate('getComputedStyle(document.querySelector("#normal .bili-video-card__wrap")).marginTop'),'0px','late wrapper margins still repair');
    await page.evaluate('document.querySelector("#normal .bili-video-card__wrap").style.removeProperty("margin-top")');await settle(page);
    for(const y of [450,900,1800,3200,0]){
      await page.evaluate('window.scrollTo(0,'+y+')');await settle(page);await settle(page);
      const missing=await page.evaluate(`(()=>{
        const layers=[...document.querySelectorAll('[data-bc-surface-kind="video-info"]')].map(n=>n.getBoundingClientRect());
        return [...document.querySelectorAll('.bili-video-card__wrap > .bili-video-card__info')].filter(n=>{
          const r=n.getBoundingClientRect();return r.width&&r.bottom>0&&r.top<innerHeight&&!layers.some(p=>Math.abs(p.left-r.left)<1&&Math.abs(p.right-r.right)<1&&Math.abs(p.bottom-r.bottom)<1);
        }).length;
      })()`);
      assert.equal(missing,0,'newly visible rows have aligned glass at scroll '+y);
      assert.ok(await page.evaluate('document.querySelectorAll(".bc-theme-surface-glass").length')<80,'offscreen cards do not retain blur layers');
    }
    await page.evaluate('document.querySelector(".bili-header__banner").style.height="300px"');await settle(page);await settle(page);
    assert.equal(await page.evaluate(`(()=>{const r=document.querySelector('#normal .bili-video-card__info').getBoundingClientRect();return [...document.querySelectorAll('[data-bc-surface-kind="video-info"]')].some(n=>{const p=n.getBoundingClientRect();return Math.abs(p.left-r.left)<1&&Math.abs(p.bottom-r.bottom)<1;});})()`),true,'document layout shifts refresh cached card positions');
    await page.evaluate('document.querySelector(".bili-header__banner").style.removeProperty("height")');await settle(page);await settle(page);
  }
  if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,baseline?'scroll-before.json':'scroll-after.json'),JSON.stringify({live,...report},null,2));await writeFile(join(screenshots,baseline?'scroll-before.png':'scroll-after.png'),await page.screenshot());}
  console.log('  '+(baseline?'BASELINE':'PASS')+' scrolling: '+report.cardRects+' card rect reads, '+report.styles+' style reads, '+report.writes+' glass writes, '+report.feedWrites+' margin writes, '+report.maxDrift+'px drift');
  await page.close();
}
