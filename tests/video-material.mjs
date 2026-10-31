import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {settle} from './layout-parity.mjs';

async function state(page) {
  return page.evaluate(`(()=>{
    const box=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const layers=[...document.querySelectorAll('[data-bc-surface-kind="video-info"]')];
    const cards=[...document.querySelectorAll('.bili-video-card__wrap > .bili-video-card__info')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.top>0&&r.bottom<innerHeight;}).slice(0,6).map(info=>{
      const r=box(info),matches=layers.filter(n=>{const p=n.getBoundingClientRect();return Math.abs(p.left-r.left)<1&&Math.abs(p.bottom-r.bottom)<1;});
      const s=matches[0]?getComputedStyle(matches[0]):null,meta=info.querySelector('.bili-video-card__info--bottom');
      return {box:r,metadata:box(meta),cover:box(info.parentElement.querySelector('.bili-video-card__image--wrap')),
        material:s?{backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,backdropFilter:s.backdropFilter,opacity:s.opacity,borderRadius:s.borderRadius}:null,
        count:matches.length,nativeFilter:getComputedStyle(info.parentElement.querySelector('img')).filter};
    });
    return {width:innerWidth,height:innerHeight,cards};
  })()`);
}

// Decode screenshots in the isolated local test page; inspect the native 4px
// gap above metadata so neither text nor badge pixels skew the surface sample.
async function pixels(page,bytes,width,cards) {
  return page.evaluate(`(async()=>{
    const image=new Image();image.src='data:image/${bytes[0]===0xff?'jpeg':'png'};base64,${bytes.toString('base64')}';await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const scale=image.width/${width},cards=${JSON.stringify(cards)};
    const samples=cards.map(c=>{
      const r=c.box,m=c.metadata,x=Math.floor((r.left+r.width/2-3)*scale),y=Math.floor((m.top-2)*scale);
      const data=ctx.getImageData(x,y,Math.max(1,Math.round(6*scale)),1).data;
      return [0,1,2].map(channel=>{const values=[];for(let i=channel;i<data.length;i+=4)values.push(data[i]);values.sort((a,b)=>a-b);return values[Math.floor(values.length/2)];});
    });
    return {samples,spread:Math.max(...[0,1,2].map(c=>Math.max(...samples.map(p=>p[c]))-Math.min(...samples.map(p=>p[c]))))};
  })()`);
}

function oneMaterial(snapshot) {
  assert.ok(snapshot.cards.length>=3,'at least three ordinary video variants visible');
  assert.equal(new Set(snapshot.cards.map(c=>JSON.stringify(c.material))).size,1,'all ordinary panels share the same computed material');
  for(const c of snapshot.cards){assert.equal(c.count,1,'one paint layer');assert.equal(c.nativeFilter,'none','sharp thumbnail');}
}

export async function auditLiveMaterialImages(page,directory='tests/artifacts/live-material') {
  const report=[];
  for(const stage of ['before','after']) {
    const audits=await readFile(join(directory,stage+'-metrics.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
    for(const audit of audits) {
      const width=audit.viewport[0],bytes=await readFile(join(directory,stage+'-'+width+'.jpg'));
      const cards=audit.rows.slice(0,2).flatMap(r=>r.cards).filter(c=>c.material&&c.metadata&&c.box.top>0&&c.box.bottom<audit.viewport[1]);
      if(!cards.length)continue;
      const pixel=await pixels(page,bytes,width,cards);
      report.push({stage,width,maximumBottomDelta:Math.max(...audit.rows.slice(0,2).map(r=>r.bottomDelta)),materialCount:new Set(cards.map(c=>JSON.stringify(c.material))).size,
        cards:cards.map((c,i)=>({title:c.title,rgb:pixel.samples[i],material:c.material})),pixelSpread:pixel.spread});
    }
  }
  if(report.length)await writeFile(join(directory,'rendered-material-pixels.json'),JSON.stringify(report,null,2));
  return report;
}

export async function runVideoMaterialChecks({cdp,base,until,screenshots}) {
  const page=await cdp.page(base+'/card-alignment.html');await page.activate();
  await until(page,'document.documentElement.dataset.bcPage === "home"');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await settle(page);
  const report=[];
  if(screenshots)await mkdir(screenshots,{recursive:true});
  for(const width of [1440,1600,1920]) {
    await page.resize(width,1000);await settle(page);
    await page.evaluate(`(()=>{
      const infos=[...document.querySelectorAll('.bili-video-card__info')],a=infos[0].getBoundingClientRect(),b=infos[1].getBoundingClientRect();
      const cut=(a.right+b.left)/2;
      document.querySelector('#bc-theme-wallpaper').style.backgroundImage='linear-gradient(to right,#fff 0px,#fff '+cut+'px,#000 '+cut+'px,#000 100%)';
      globalThis.glassVideoFilter=document.documentElement.style.getPropertyValue('--bc-video-info-filter');
      document.documentElement.style.setProperty('--bc-video-info-filter','blur(14px) contrast(0.15) brightness(0.25)');
    })()`);await settle(page);
    const before=await state(page);oneMaterial(before);const beforeShot=await page.screenshot();const beforePixels=await pixels(page,beforeShot,width,before.cards);
    assert.ok(beforePixels.spread<=8,'old filter reproduces the near-black slabs regardless of wallpaper');
    await page.evaluate("document.documentElement.style.setProperty('--bc-video-info-filter',glassVideoFilter)");await settle(page);
    const after=await state(page);oneMaterial(after);const afterShot=await page.screenshot();const afterPixels=await pixels(page,afterShot,width,after.cards);
    assert.ok(afterPixels.spread>40,'translucent glass preserves visible wallpaper variation: '+JSON.stringify(afterPixels));
    assert.ok(Math.max(...afterPixels.samples.flat())>Math.max(...beforePixels.samples.flat())+40,'bright wallpaper is visible instead of crushed to black');
    assert.deepEqual(after.cards.map(c=>[c.box,c.metadata,c.cover]),before.cards.map(c=>[c.box,c.metadata,c.cover]),'material correction changes no geometry');
    assert.equal(after.cards[0].material.backgroundColor,before.cards[0].material.backgroundColor,'the fix does not just strengthen the tint');
    assert.equal(after.cards[0].material.backdropFilter,'blur(14px) saturate(1.4)');
    if(screenshots){await writeFile(join(screenshots,'material-'+width+'-before.png'),beforeShot);await writeFile(join(screenshots,'material-'+width+'-after.png'),afterShot);}
    const p=after.cards[0].box;
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.left+10,y:p.top+10},page.sessionId);await settle(page);
    const hovered=await state(page);oneMaterial(hovered);assert.deepEqual(hovered,after,'hover cannot permanently change material or geometry');
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0},page.sessionId);
    report.push({width,beforePixels,afterPixels,before,after});
  }
  await page.evaluate('document.querySelector("#load").click()');await settle(page);await settle(page);oneMaterial(await state(page));
  await page.evaluate('window.scrollTo(0,500)');await settle(page);await settle(page);oneMaterial(await state(page));
  await page.evaluate('window.scrollTo(0,0);chrome.runtime.sendMessage({type:"BC_THEME/PATCH",payload:{textColor:"#111111"}})');await settle(page);await settle(page);
  const dark=await state(page);oneMaterial(dark);assert.equal(dark.cards[0].material.backdropFilter,'blur(14px) saturate(1.4)');
  assert.match(dark.cards[0].material.backgroundColor,/rgba\(246, 249, 247,/,'saved dark ink uses the adaptive light tint');
  if(screenshots)await writeFile(join(screenshots,'video-material-metrics.json'),JSON.stringify(report,null,2));
  console.log('  PASS video material: wallpaper remains visible through one shared translucent tint, no brightness/contrast/inversion, unchanged geometry, hover, late data, scroll and dark ink');
  await page.evaluate('chrome.runtime.sendMessage({type:"BC_THEME/RESET"})');await page.close();
}
