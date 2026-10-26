import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function runCompatibilityMatrix({ cdp, base, until, mp4, screenshots }) {
  const page = await cdp.page(`${base}/matrix/dynamic`);
  await page.activate();
  await until(page, 'document.documentElement.dataset.bcPage === "dynamic"');
  const backgrounds = await page.evaluate(`(() => {
    const image = (color) => { const c=document.createElement('canvas');c.width=32;c.height=32;
      c.getContext('2d').fillStyle=color;c.getContext('2d').fillRect(0,0,32,32);return c.toDataURL('image/png'); };
    return ['', image('#ffffff'), image('#000000'), 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'];
  })()`);
  backgrounds.push(mp4);
  let cases = 0;
  for (const name of ["dynamic", "home", "video", "space", "search", "article", "opus", "bangumi", "live", "other"]) {
    await page.navigate(`${base}/matrix/${name}`);
    await until(page, `document.documentElement.dataset.bcPage === '${name}'`);
    const result = await page.evaluate(`(async () => {
      const backgrounds=${JSON.stringify(backgrounds)};
      const errors=[];let cases=0;
      const assert=(ok,label)=>{if(!ok)errors.push(label)};
      const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const get=(selector,property)=>getComputedStyle(document.querySelector(selector))[property];
      const rgb=(value)=>value.match(/[\\d.]+/g).map(Number);
      const lum=(rgb)=>{const c=rgb.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
      const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
      const composite=(under,over)=>under.map((v,i)=>v*(1-(over[3]??1))+over[i]*(over[3]??1));
      const root=document.documentElement;
      for(const material of ['glass','clear']) for(const coverage of ['all','panels']) {
        for(let b=0;b<backgrounds.length;b++) {
          const color=['#ffffff','#111111','#777777','#ff0000'][b%4];
          await chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:{enabled:true,material,coverage,textColor:color,opacity:b===1?0:58,blur:b===2?0:14}});
          await chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:backgrounds[b]?{dataUrl:backgrounds[b],name:'matrix'}:null});
          await frame();
          const label='${name}/'+material+'/'+coverage+'/'+b;
          assert(document.querySelectorAll('style[data-bc-owned="style"]').length===1,label+': duplicate CSS');
          assert(document.querySelectorAll('#bc-theme-wallpaper').length===1,label+': duplicate wallpaper');
          const primary=document.querySelector('#primary');
          if(primary) {
            const base=rgb('rgb('+root.style.getPropertyValue('--bc-surface-rgb')+')');
            const alpha=Number(root.style.getPropertyValue('--bc-wallpaper-veil'));
            const worst=base[0]===0?[255,255,255]:[0,0,0];
            let background=composite(worst,[...base,alpha]);
            const ancestors=[];for(let e=primary;e&&e!==document.body;e=e.parentElement)ancestors.unshift(e);
            for(const e of ancestors)background=composite(background,rgb(getComputedStyle(e).backgroundColor));
            assert(ratio(rgb(getComputedStyle(primary).color),background)>=4.5-0.01,label+': primary contrast');
            assert(ratio(rgb(get('#secondary','color')),background)>=4.5-0.01,label+': secondary contrast');
            assert(get('#status','backgroundColor')==='rgb(230, 30, 50)',label+': badge background');
            assert(get('#status','color')==='rgb(255, 255, 255)',label+': badge text');
            assert(get('#status-svg','color')==='rgb(230, 30, 50)',label+': SVG status');
            assert(get('#status-icon','color')==='rgb(230, 30, 50)',label+': font status');
            assert(get('#progress','backgroundColor')==='rgb(0, 174, 236)',label+': progress');
            assert(get('#media-cover','backgroundColor')==='rgb(31, 41, 51)',label+': media cover');
          }
          if('${name}'==='dynamic') {
            assert(get('#editor','backgroundColor')==='rgba(0, 0, 0, 0)',label+': editor rectangle');
            assert(get('#title-input','backgroundColor')==='rgba(0, 0, 0, 0)',label+': title rectangle');
            assert(get('#publish','backgroundColor')==='rgb(0, 174, 236)',label+': publish background');
            assert(get('#publish','color')==='rgb(255, 255, 255)',label+': publish text');
            assert(get('.bili-dyn-item__main','backdropFilter')==='none',label+': nested blur');
            assert(getComputedStyle(document.querySelector('#editor'),'::before').color===
              root.style.getPropertyValue('--bc-placeholder-color'),label+': composer placeholder');
            assert(get('button:disabled','opacity')==='0.4',label+': native disabled state');
          }
          cases++;
        }
      }
      const search=document.querySelector('#search');search.focus();search.value='测试 search';search.dispatchEvent(new InputEvent('input',{bubbles:true,data:'测试'}));
      assert(document.activeElement===search && search.value==='测试 search','search focus and input');
      document.querySelector('#menu-toggle').click();await frame();
      assert(document.querySelector('#menu').getBoundingClientRect().height>0,'menu interaction');
      const shadow=document.querySelector('bili-comments').shadowRoot;
      assert(shadow.querySelectorAll('[data-bc-owned]').length===1,'comment style once');
      assert(getComputedStyle(shadow.querySelector('.native-status')).color==='rgb(230, 30, 50)','comment SVG status');
      const textarea=shadow.querySelector('textarea');textarea.focus();textarea.value='评论';textarea.dispatchEvent(new InputEvent('input',{bubbles:true,data:'评论'}));
      assert(shadow.activeElement===textarea && textarea.value==='评论','comment keyboard focus');
      const extra=document.createElement('bili-comments');document.querySelector('main').append(extra);await frame();
      assert(extra.shadowRoot.querySelectorAll('[data-bc-owned]').length===1,'second comment tree');
      const oldShadow=extra.shadowRoot;extra.remove();await frame();
      assert(oldShadow.querySelectorAll('[data-bc-owned]').length===0,'removed comment cleanup');
      if('${name}'==='dynamic') {
        const editor=document.querySelector('#editor');editor.focus();editor.textContent='动态编辑';
        editor.dispatchEvent(new InputEvent('input',{bubbles:true,data:'动态编辑'}));
        assert(document.activeElement===editor && editor.textContent==='动态编辑','contenteditable focus and input');
        document.querySelector('#emoji').click();document.querySelector('#upload').click();document.querySelector('#publish').click();
        assert(testClicks===4,'composer and menu button actions');
        customElements.define('bili-comment-renderer',class extends HTMLElement {
          connectedCallback(){this.style.display='block';requestAnimationFrame(()=>{this.attachShadow({mode:'open'}).innerHTML='<div id="comment-text" style="height:60px">Delayed shadow</div>'})}
        });
        const delayed=document.createElement('bili-comment-renderer');document.querySelector('main').append(delayed);
        await frame();await frame();
        assert(delayed.shadowRoot?.querySelectorAll('[data-bc-owned]').length===1,'delayed comment shadow');
        delayed.remove();await frame();
      }
      await chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:{enabled:false}});await frame();
      assert(!root.hasAttribute('data-bc-page'),'page marker restored');
      assert(document.querySelectorAll('[data-bc-owned]').length===0,'theme cleanup');
      assert(shadow.querySelectorAll('[data-bc-owned]').length===0,'shadow cleanup');
      await chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:{enabled:true}});await frame();
      return {cases,errors};
    })()`);
    assert.deepEqual(result.errors, [], `${name} matrix`);
    if (name === "dynamic") {
      await page.evaluate('document.querySelector("#editor").focus()');
      await page.type(" 输入验证");
      assert.ok(await page.evaluate('document.querySelector("#editor").textContent.includes("输入验证")'), "native contenteditable keyboard insertion");
    }
    cases += result.cases;
  }

  // Route changes with no DOM mutation must reclassify, including history back.
  await page.navigate(`${base}/matrix/dynamic`);
  await until(page, 'document.documentElement.dataset.bcPage === "dynamic"');
  await page.evaluate("history.pushState({},'', '/video/BV-test')");
  await until(page, 'document.documentElement.dataset.bcPage === "video"');
  await page.evaluate("history.back()");
  await until(page, 'document.documentElement.dataset.bcPage === "dynamic"');
  await page.reload();
  await until(page, 'document.documentElement.dataset.bcPage === "dynamic"');
  await page.navigate(`${base}/matrix/home`);
  await until(page, 'document.documentElement.dataset.bcPage === "home"');
  await page.evaluate('document.querySelector("main").className="search-page"');
  await until(page, 'document.documentElement.dataset.bcPage === "search"');
  await page.evaluate('document.querySelector("main").className="bili-feed4"');
  await until(page, 'document.documentElement.dataset.bcPage === "home"');
  await page.navigate(`${base}/matrix/dynamic`);
  await until(page, 'document.documentElement.dataset.bcPage === "dynamic"');
  if (screenshots) {
    await page.evaluate("chrome.runtime.sendMessage({type:'BC_THEME/BACKGROUND',payload:null})");
    await mkdir(screenshots, { recursive: true });
    for (const textColor of ["#ffffff", "#111111"]) {
      await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:{textColor:'${textColor}',opacity:58,blur:14,material:'glass',coverage:'all'}})`);
      await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
      await writeFile(join(screenshots, `dynamic-${textColor.slice(1)}.png`), await page.screenshot());
    }
  }
  await page.close();
  console.log(`  PASS compatibility: ${cases} page/material/coverage/background combinations, 10 disabled layouts, editor/menu/comment interactions, route-only SPA and cleanup`);
}
