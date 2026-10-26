import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRuntime } from './runtime.mjs';
import { runParity } from './layout-parity.mjs';

export async function runOfficialParity({ cdp, until, artifacts='tests/artifacts/native-parity' }) {
  const page = await cdp.page('about:blank');
  const documents=[],styles=new Map();
  const listener = ({data}) => {
    const message=JSON.parse(data);
    if(message.sessionId!==page.sessionId || message.method!=='Network.responseReceived')return;
    if(message.params.type==='Document')documents.push({url:message.params.response.url,status:message.params.response.status});
    if(message.params.type==='Stylesheet')styles.set(message.params.requestId,message.params.response.url);
  };
  cdp.socket.addEventListener('message',listener);
  try {
    await cdp.send('Network.enable',{},page.sessionId);
    await cdp.send('Network.setUserAgentOverride',{userAgent:await page.evaluate('navigator.userAgent'),acceptLanguage:'zh-CN,zh;q=0.9,en;q=0.8'},page.sessionId);
    await page.navigate('https://www.bilibili.com/');
    await until(page,'document.readyState==="complete" && !!document.querySelector(".bili-header__bar") && !!document.querySelector(".bili-video-card img")');
    await page.evaluate('document.fonts.ready.then(()=>true)');
    await page.evaluate('Promise.all([...document.images].slice(0,20).map(i=>i.decode().catch(()=>{})))');
    // Dismiss only the native first-visit translation notice; no account actions.
    await page.evaluate(`(()=>{const start=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()==='Start');if(start)start.click();})()`);
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:950},page.sessionId);
    const access=await page.evaluate('({url:location.href,title:document.title,styles:[...document.styleSheets].map(s=>s.href).filter(Boolean),zoom:visualViewport.scale,dpr:devicePixelRatio})');
    access.documents=documents;
    await mkdir(artifacts,{recursive:true});
    await writeFile(join(artifacts,'official-access.json'),JSON.stringify(access,null,2));
    await writeFile(join(artifacts,'official-dom.json'),JSON.stringify(await page.evaluate(`({
      gridAncestors:[...document.querySelectorAll('.bili-video-card')].slice(0,1).map(n=>{const a=[];while(n){a.push({tag:n.tagName,class:n.className,display:getComputedStyle(n).display});n=n.parentElement;}return a;}),
      search:[...document.querySelectorAll('input')].map(n=>({class:n.className,parent:n.parentElement.className})),
      banner:[...document.querySelectorAll('.bili-header__banner,.bili-header__banner *')].slice(0,25).map(n=>({tag:n.tagName,class:n.getAttribute('class'),style:n.getAttribute('style'),html:n.tagName==='DIV'?n.innerHTML.slice(0,300):'',z:getComputedStyle(n).zIndex})),
      dialogs:[...document.querySelectorAll('button,[role="dialog"]')].map(n=>({tag:n.tagName,class:n.className,text:n.textContent.trim().slice(0,100)})).slice(0,40)
    })`),null,2));
    const media=[];
    for(const [id,url] of styles) {
      if(!access.styles.includes(url))continue;
      try {
        const response=await cdp.send('Network.getResponseBody',{requestId:id},page.sessionId);
        const css=response.base64Encoded?Buffer.from(response.body,'base64').toString():response.body;
        media.push({url,conditions:[...new Set([...css.matchAll(/@media\s*([^{}]+)\{/g)].map(m=>m[1]))]});
        await writeFile(join(artifacts,`official-${media.length}.css`),css);
      } catch(error) {media.push({url,error:error.message});}
    }
    await writeFile(join(artifacts,'official-media-queries.json'),JSON.stringify(media,null,2));
    const rt=createRuntime();
    const snapshot=(await rt.send(rt.BC.MESSAGE.GET)).data;
    snapshot.settings={...snapshot.settings,enabled:false,minimalistEnabled:false};
    const {frameTree}=await cdp.send('Page.getFrameTree',{},page.sessionId);
    const {executionContextId}=await cdp.send('Page.createIsolatedWorld',{frameId:frameTree.frame.id,worldName:'Bilibili theme parity'},page.sessionId);
    const isolated=async expression=>{
      const r=await cdp.send('Runtime.evaluate',{expression,contextId:executionContextId,awaitPromise:true,returnByValue:true},page.sessionId);
      if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
      return r.result.value;
    };
    await isolated(`globalThis.paritySnapshot=${JSON.stringify(snapshot)};globalThis.parityListeners=new Set();
      globalThis.chrome={runtime:{sendMessage:async()=>({ok:true,data:paritySnapshot})},storage:{onChanged:{addListener:f=>parityListeners.add(f),removeListener:f=>parityListeners.delete(f)}}};`);
    for(const file of ['settings.js','theme.js','minimalist.js','content.js']) {
      await isolated(`${await readFile(new URL('../'+file,import.meta.url),'utf8')}\n//# sourceURL=bc-parity/${file}`);
    }
    const patch=async changes=>{
      await isolated(`(()=>{const oldValue=paritySnapshot.settings;
        const newValue=BiliTheme.settings({...oldValue,...${JSON.stringify(changes)},revision:oldValue.revision+1});
        paritySnapshot={...paritySnapshot,settings:newValue};
        for(const f of parityListeners)f({'bc.settings':{oldValue,newValue}},'local');})()`);
      await until(page,changes.enabled===false?'!document.documentElement.hasAttribute("data-bc-enabled")':'document.documentElement.dataset.bcEnabled==="true"');
    };
    const report=await runParity({page,patch,artifacts,label:'official',navKeys:rt.BC.NAV_ITEMS.map(n=>n.key)});
    const maximum=Math.max(...report.rows.map(r=>r.maximum),...report.sweep.map(r=>r.maximum));
    assert.equal(maximum,0);
    const dimensions=report.rows.map(r=>{
      const c=r.before.components,g=c.grid[0],t=c.thumbnail[0];
      const columns=g?.style['grid-template-columns'].match(/[\d.]+px/g)?.length;
      return `| ${r.width} | ${g?.rect[2]} / ${g?.rect[0]} | ${columns} / ${g?.style.gap} | ${t?.rect.slice(2).join(' × ')} | ${c.header[0]?.rect[3]} / ${c.search[0]?.rect[2]} | ${r.before.overflow} |`;
    }).join('\n');
    const overflow=report.rows.filter(r=>r.before.overflow>r.width);
    const nativeDetails=`\n\n## Measured native dimensions (identical with glass)\n\nAll values are CSS pixels. Container width / left inset, column count / gap, thumbnail width × height, header height / search width, and document scroll width come directly from computed styles and rectangles.\n\n| Viewport | Feed grid width / left | Columns / gap | Thumbnail | Header / search | Scroll width |\n| --- | --- | --- | --- | --- | --- |\n${dimensions}\n\n${overflow.length?`Native overflow was already present at ${overflow.map(r=>`${r.width}px (scroll width ${r.before.overflow}px)`).join(', ')}. The official stylesheet's minimum-width behavior is preserved; the theme introduces zero additional overflow.`:'No horizontal overflow was observed in either state.'}\n`;
    const summary=`# Official responsive parity\n\nReference: ${access.url} (${documents.at(-1)?.status}); zoom ${access.zoom}, DPR ${access.dpr}.\n\nThe requested root URL redirected to this official regional variant. Production scripts ran in a separate JavaScript world; native site scripts, DOM children, CSS and responsive rules were retained. No account or persistent browser profile was used.\n\n| Viewport | Maximum geometry delta | Evidence |\n| --- | --- | --- |\n${report.rows.map(r=>`| ${r.width}px | ${r.maximum}px | [Native](official-${r.width}-native.png) / [Glass](official-${r.width}-glass.png) |`).join('\n')}\n\n${report.sweep.length} resize samples, 32px steps from 1024 to 2560 and back: maximum delta ${maximum}px. Compared containers, margins, header/search/categories, grid tracks/gaps, cards/thumbs/titles, carousel spans, visibility, overflow, font metrics and containing-block properties, followed by a restored-native check at each requested width. Legacy layout flags were enabled during the glass check.\n\nSelectors absent in the delivered variant: ${report.missing.join(', ')||'none'}. Absent components cannot be claimed as live-verified; local fixtures cover those separately.\n\nActual stylesheet media queries: [official-media-queries.json](official-media-queries.json). Full [before/after metrics](official-metrics.json) and downloaded CSS are saved alongside this report.\n\nThis verifies the delivered variant at the measured sizes; other account/A-B variants and browser zoom levels require separate checks.\n`;
    await writeFile(join(artifacts,'REPORT.md'),summary+nativeDetails);
    console.log(`  Official reference ${access.url}; max delta ${maximum}px; absent: ${report.missing.join(', ')}`);
  } finally { cdp.socket.removeEventListener('message',listener);await page.close(); }
}
