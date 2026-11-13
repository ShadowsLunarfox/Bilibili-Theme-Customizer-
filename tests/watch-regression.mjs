import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {watchPageFixture} from './watch-page.mjs';
import {settle} from './layout-parity.mjs';

export function watchVariantFixture(){
  const rows=Array.from({length:18},(_,i)=>`<div class="bui-list-item"><span class="dm-info-time">01:${String(i).padStart(2,'0')}</span><span class="dm-info-dm">Native danmaku message ${i}</span><span class="dm-info-date">09-17 21:00</span></div>`).join('');
  const comments=Array.from({length:9},(_,i)=>`<div class="reply-item"><span class="vip-badge">Native author · LV6</span><p class="reply-content">Readable classic comment and reply ${i}</p><div class="reply-info"><span class="reply-time">19小时前</span><button>赞 46</button><button>回复</button></div></div>`).join('');
  return watchPageFixture()
    .replace('</style>',`</style><style>
      .bpx-player-sending-input .bui-input,.bpx-player-sending-input .bui-input-wrap{background:#f1f2f3;color:#61666d}.bpx-player-sending-input .bui-input-input{background:#f1f2f3;color:#61666d}
      .bpx-player-auxiliary-area{margin:16px 0}.bui-collapse-wrap,.bpx-player-dm-wrap{background:#fff}.bui-collapse-header{background:#fff;color:#fff}.bui-collapse-body{background:#fff}.bui-list-item{display:grid;grid-template-columns:44px 1fr 92px;gap:8px;padding:6px 10px;background:#fff;color:#18191c;font-size:12px}.dm-info-dm{color:#18191c;background:#fff}.dm-info-time,.dm-info-date{color:#61666d}.bpx-player-dm-btn-history{width:100%;border:0;background:#f1f2f3;color:#61666d;padding:8px}
      .next-play{color:#18191c;display:flex;justify-content:space-between;margin:22px 0 10px}.comment-container{margin:24px 0;background:#fff}.reply-header{padding:18px 16px}.reply-list{background:#fff}.reply-item{padding:20px 16px;border-bottom:1px solid #ddd}.reply-content{margin:10px 0}.reply-info{color:#9499a0}.reply-info button{background:transparent;color:#9499a0;border:0}.vip-badge{color:#fb7299}
    </style>`)
    .replace('<div class="bpx-player-sending-input"><input id="danmaku-input" placeholder="发个友善的弹幕见证当下"></div>','<div class="bpx-player-sending-input"><div class="bui-input-wrap"><div class="bui-input"><input class="bui-input-input" id="danmaku-input" placeholder="发个友善的弹幕见证当下"></div></div></div>')
    .replace('<div class="danmaku-box"><div class="bui-collapse-header">','<div class="bpx-player-auxiliary-area"><div class="bui-collapse-wrap"><div class="bui-collapse-header">')
    .replace('<div class="bui-collapse-body" hidden>Native danmaku list</div></div>',`<div class="bui-collapse-body" hidden><div class="bpx-player-dm-wrap"><div class="bui-list">${rows}</div><button class="bpx-player-dm-btn-history">查看历史弹幕</button></div></div></div></div>`)
    .replace('<div class="recommend-list-v1">','<div class="next-play"><span>接下来播放</span><span>自动连播</span></div><div class="recommend-list-v1">')
    .replace('<div id="commentapp"><bili-comments></bili-comments></div>',`<div id="commentapp"><section id="comment" class="comment-container"><div class="reply-warp"><div class="reply-header">评论 1497 · 最热 · 最新</div><div class="reply-list">${comments}</div></div></section></div>`);
}

export async function runWatchRegressionChecks({cdp,base,until,screenshots,baseline=false}){
  const page=await cdp.page(base+'/watch-variant.html');await page.activate();await page.resize(1652,1100);
  await until(page,'document.documentElement.dataset.bcPage === "video" && !!document.querySelector(".reply-list")');
  const patch=async payload=>{await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:'+JSON.stringify(payload)+'})');await settle(page);await settle(page);};
  const css=(s,p)=>page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(s)}))[${JSON.stringify(p)}]`);
  const capture=async name=>{if(screenshots){await mkdir(screenshots,{recursive:true});await writeFile(join(screenshots,name+'.png'),await page.screenshot());}};
  const geometry=()=>page.evaluate(`(()=>{const root=document.querySelector('#comment').getBoundingClientRect();return [...document.querySelectorAll('#comment .reply-item')].map(n=>{const r=n.getBoundingClientRect();return [r.left-root.left,r.top-root.top,r.width,r.height];});})()`);
  await patch({enabled:false});const nativeGeometry=await geometry();
  await patch({enabled:true,material:'glass'});
  if(baseline){await page.evaluate('document.querySelector("#collapse").click()');await settle(page);await capture('variant-before-list');await page.evaluate('window.scrollTo(0,1100)');await settle(page);await capture('variant-before-comments');await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();return;}
  const transparent='rgba(0, 0, 0, 0)',white=c=>c==='rgb(255, 255, 255)'||c==='rgb(241, 242, 243)';
  assert.notEqual(await css('.reply-list','backgroundColor'),transparent,'the actual classic reply list always has a readable backing');
  assert.equal(await css('#commentapp','backgroundColor'),transparent,'mount does not stack another tint over the list');
  assert.equal(await css('.reply-warp','backgroundColor'),transparent,'nested comment containers do not stack tints');
  assert.deepEqual(await geometry(),nativeGeometry,'native reply spacing, positions and dimensions retained');
  assert.equal(await css('#commentapp','backdropFilter'),'none','no full-list blur');
  assert.equal(white(await css('.bui-input','backgroundColor')),false,'BUI input wrapper loses the white slab');
  assert.equal(await css('.bui-input-input','backgroundColor'),transparent,'native input is clear inside its one shell');
  assert.equal(white(await css('.bui-collapse-header','backgroundColor')),false,'collapse header is themed without danmaku-box ancestor');
  assert.notEqual(await css('.next-play','color'),'rgb(24, 25, 28)','next-play labels remain readable');
  await page.evaluate('document.querySelector("#collapse").click()');await settle(page);await settle(page);
  for(const selector of ['.bui-collapse-wrap','.bui-collapse-body','.bui-list','.bui-list-item','.bpx-player-dm-btn-history'])assert.equal(white(await css(selector,'backgroundColor')),false,selector+' has no native white background');
  assert.notEqual(await css('.dm-info-dm','color'),'rgb(24, 25, 28)','list messages use readable ink');
  assert.equal(await css('.vip-badge','color'),'rgb(251, 114, 153)','author status colors stay native');
  await page.evaluate('document.querySelector("#danmaku-input").focus()');await page.type('BUI field still edits');assert.equal(await page.evaluate('document.querySelector("#danmaku-input").value'),'BUI field still edits');
  await capture('variant-after-list');
  await page.evaluate('const wrapper=document.querySelector(".bui-collapse-wrap");wrapper.replaceWith(...wrapper.childNodes)');await settle(page);await settle(page);
  assert.notEqual(await css('.bui-collapse-header','backgroundColor'),transparent,'unwrapped sidebar header has its own backing');
  assert.notEqual(await css('.bpx-player-dm-wrap','backgroundColor'),transparent,'unwrapped danmaku list has its own backing');
  for(const width of [1024,1280,1440,1652,1920,2560]){
    await page.resize(width,1100);await settle(page);assert.notEqual(await css('.reply-list','backgroundColor'),transparent);
    await page.evaluate('window.scrollTo(0,1500)');await settle(page);await settle(page);assert.ok(await page.evaluate('document.querySelectorAll(".bc-theme-surface-glass").length===0'),'no giant comment blur layer');
  }
  await page.resize(1652,1100);await page.evaluate('window.scrollTo(0,1100)');await settle(page);await capture('variant-after-comments');
  await page.evaluate('document.querySelector("#commentapp").style.display="contents"');await settle(page);assert.notEqual(await css('.reply-list','backgroundColor'),transparent,'display-contents mount cannot remove the list backing');
  await page.evaluate('document.querySelector("#commentapp").after(document.querySelector(".reply-list"))');await settle(page);assert.notEqual(await css('.reply-list','backgroundColor'),transparent,'a standalone light-DOM reply list keeps its own backing');
  await patch({material:'clear'});assert.equal(await css('#commentapp','backgroundColor'),transparent,'Clear preserves explicit transparency');
  await patch({enabled:false});assert.equal(await css('.bui-collapse-header','backgroundColor'),'rgb(255, 255, 255)','native header restored');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
  console.log('  PASS watch regressions: light-DOM comments, native reply geometry, nested BUI input, expanded auxiliary list/history, next-play labels, six widths, scrolling, Clear and restore');
}
