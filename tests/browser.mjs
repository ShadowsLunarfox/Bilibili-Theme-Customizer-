import assert from "node:assert/strict";
import { readFile, mkdtemp, rm, access } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime } from "./runtime.mjs";
import { compatibilityFixture } from "./compatibility-fixtures.mjs";
import { runCompatibilityMatrix } from "./compatibility.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const browserExtraArgs = process.env.BC_TEST_NO_SANDBOX === "1" ? ["--no-sandbox"] : [];
const screenshotDirectory = process.env.BC_TEST_SCREENSHOTS;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
const bridge = `
  const listeners = new Set();
  globalThis.chrome = {
    runtime: { getManifest: () => (${JSON.stringify(manifest)}),
      sendMessage: async (message) => (await fetch('/api', { method:'POST', body:JSON.stringify(message) })).json() },
    storage: { onChanged: { addListener: (f) => listeners.add(f), removeListener: (f) => listeners.delete(f) } }
  };
  const events = new EventSource('/events');
  events.onmessage = (event) => { for (const f of listeners) f(JSON.parse(event.data), 'local'); };
  window.addEventListener('pagehide', () => events.close(), {once:true});
  // Observe the real closed wallpaper root without changing its mode or behavior.
  globalThis.testShadows = {};
  const attach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function(options) {
    const shadow = attach.call(this, options);
    if (this.id) testShadows[this.id] = shadow;
    return shadow;
  };
`;

function fixture(BC) {
  const links = (key, className) => BC.NAV_GROUPS.find((g) => g.key === key).items.map((entry) => {
    const href = /href\*="([^"]+)"/.exec(entry.selector)?.[1];
    return href ? `<a class="${className}" href="${href}">${entry.en}</a>` : "";
  }).join("");
  return `<!doctype html><html data-bc-material="site-original" style="--bc-accent:#123abc!important"><meta charset="utf-8"><style>
    body { margin:0; background:white; color:#181818 }
    .bili-header__bar {height:65px; position:fixed; width:100%; z-index:1002}
    .nav-search-panel {position:absolute; top:65px; left:200px; width:260px; height:100px}
    .header-channel {position:fixed; top:200px; width:400px; height:60px;z-index:1001}
    .v-popover-content {height:40px; width:120px;position:absolute;top:175px}
    .video-desc-container {margin-top:300px}
    .bpx-player-container {color:rgb(255,128,0);-webkit-text-fill-color:rgb(255,128,0)}
    #control-icon {background:rgb(1,2,3)}
    #art {background-color:rgb(20,30,40)}
    #sample-text {color:#333} .user-card-m-exp {padding:10px}
  </style><script src="/bridge.js"></script>
  <script src="/settings.js" defer></script><script src="/theme.js" defer></script><script src="/content.js" defer></script>
  <body><header class="bili-header__bar"><ul class="left-entry-main">
    <li class="home-page-entry"><a href="/">Home</a></li>
    <li class="left-entry__item"><a href="https://app.bilibili.com">Download</a></li>
    </ul><div class="nav-search-panel"><div class="nav-search-content"><input id="search-input"></div></div>
    <div class="v-popover-content"><div class="user-card-m-exp">Profile</div></div>
  </header><section class="bili-header__channel"><div class="channel-icons">${links("channelIcons", "channel-icons__item")}</div>
    <div class="channel-items__left">${links("channelCategories", "channel-link")}${links("channelMoreItems", "channel-link")}
    <span class="channel-link__more">More</span></div><div class="channel-items__right">${links("channelShortcuts", "channel-link__right")}</div></section>
    <main><div class="video-info-container"><p id="sample-text">Sample text</p></div><div class="video-desc-container"><div class="desc-content">Description <a href="#description">link</a></div></div>
    <div class="bpx-player-container"><span id="control-icon">▶</span><video></video></div>
    <svg id="art" width="10" height="10"><path fill="#123456" d="M0 0H10V10Z"></path></svg>
    <div id="commentapp"><bili-comments></bili-comments></div><div class="palette-button-wrap">Toolbar</div></main>
    <script>customElements.define('bili-comments', class extends HTMLElement {
      connectedCallback() { if (!this.shadowRoot) this.attachShadow({mode:'open'}).innerHTML =
        '<div id="contents"><span id="comment-text">Comment</span><textarea></textarea></div>'; }
    });</script></body>`;
}

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.id = 0;
    this.pending = new Map();
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      const pending = this.pending.get(message.id);
      if (pending) {
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
        else pending.resolve(message.result);
      }
    });
  }
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new CDP(socket);
  }
  send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timed out: ${method}`)); }, 15000);
      this.pending.set(id, { resolve(value) { clearTimeout(timer); resolve(value); }, reject(error) { clearTimeout(timer); reject(error); } });
      this.socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  async page(url) {
    const { targetId } = await this.send("Target.createTarget", { url: "about:blank" });
    console.log("  Created test tab");
    const { sessionId } = await this.send("Target.attachToTarget", { targetId, flatten: true });
    console.log("  Attached test tab");
    await this.send("Runtime.enable", {}, sessionId);
    await this.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.sessionId === sessionId && message.method === "Runtime.exceptionThrown") {
        console.error(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      }
    });
    const evaluate = async (expression) => {
      const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    await this.send("Page.navigate", { url }, sessionId);
    return { targetId, evaluate,
      navigate: (nextURL) => this.send("Page.navigate", { url: nextURL }, sessionId),
      close: () => this.send("Target.closeTarget", { targetId }),
      type: (text) => this.send("Input.insertText", { text }, sessionId),
      screenshot: async () => Buffer.from((await this.send("Page.captureScreenshot", { format: "png" }, sessionId)).data, "base64"),
      reload: () => this.send("Page.reload", {}, sessionId),
      activate: () => this.send("Target.activateTarget", { targetId }) };
  }
}

async function until(page, expression) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await page.evaluate(expression).catch(() => false)) return;
    await sleep(40);
  }
  console.error(await page.evaluate('({url:location.href,page:document.documentElement.dataset.bcPage,status:document.querySelector("#save-status")?.textContent,disabled:document.querySelector("#controls")?.disabled})'));
  throw new Error(`Timed out: ${expression}`);
}

async function runBrowser(executable) {
  const rt = createRuntime();
  const streams = new Set();
  rt.listeners.add((changes) => { for (const stream of streams) stream.write(`data: ${JSON.stringify(changes)}\n\n`); });
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, "http://localhost").pathname;
      if (path === "/events") {
        response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
        response.write(": connected\n\n"); streams.add(response);
        request.on("close", () => streams.delete(response));
      } else if (path === "/api") {
        let body = "";
        for await (const chunk of request) body += chunk;
        const { type, payload } = JSON.parse(body);
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(await rt.send(type, payload)));
      } else if (path === "/fixture.html") {
        response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(fixture(rt.BC));
      } else if (path.startsWith("/matrix/")) {
        response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(compatibilityFixture(path.slice(8)));
      } else if (path === "/bridge.js") {
        response.setHeader("Content-Type", "text/javascript; charset=utf-8"); response.end(bridge);
      } else {
        const allowed = ["/popup.html", "/popup.js", "/popup.css", "/settings.js", "/theme.js", "/content.js"];
        if (!allowed.includes(path) && !/^\/assets\/[a-z0-9-]+\.png$/.test(path)) { response.writeHead(404).end(); return; }
        let file = await readFile(join(root, path.slice(1)));
        if (path === "/popup.html") file = file.toString().replace("<head>", '<head><script src="/bridge.js"></script>');
        response.setHeader("Content-Type", { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".png": "image/png" }[extname(path)]);
        response.end(file);
      }
    } catch (error) { response.writeHead(500).end(error.message); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const profile = await mkdtemp(join(tmpdir(), "bc-theme-browser-"));
  const process = spawn(executable, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-gpu",
    ...browserExtraArgs, "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  let cdp;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Browser startup timed out")), 20000);
      process.on("error", (error) => { clearTimeout(timer); reject(error); });
      process.stderr.on("data", (chunk) => {
        const match = /DevTools listening on (ws:\/\/\S+)/.exec(String(chunk));
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    cdp = await CDP.connect(endpoint);
    const browserVersion = (await cdp.send("Browser.getVersion")).product;
    console.log(`  ${browserVersion}`);
    const page = await cdp.page(`${base}/fixture.html`);
    await until(page, 'document.documentElement.dataset.bcEnabled === "true"');
    console.log("  Fixture loaded");
    const patch = async (changes) => {
      const response = await page.evaluate(`chrome.runtime.sendMessage({type:'BC_THEME/PATCH',payload:${JSON.stringify(changes)}})`);
      assert.equal(response.ok, true);
      const settings = rt.data[rt.BC.KEYS.settings];
      await until(page, settings.enabled
        ? `document.documentElement.style.getPropertyValue('--bc-text-color') === '${settings.textColor}'`
        : '!document.documentElement.hasAttribute("data-bc-enabled")');
      await sleep(80);
    };
    const style = (selector, property) => page.evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)}))[${JSON.stringify(property)}]`);
    assert.equal(await style(".desc-content", "backdropFilter"), "none");
    assert.equal(await style(".nav-search-content", "backdropFilter"), "none");
    assert.equal(await style(".user-card-m-exp", "backgroundColor"), "rgba(0, 0, 0, 0)");
    await page.evaluate('document.querySelector(".v-popover-content").style.visibility="hidden"');
    await until(page, 'document.querySelectorAll(".bc-theme-popover-glass").length === 1');
    await page.evaluate('document.querySelector(".v-popover-content").style.visibility="visible"');
    await until(page, 'document.querySelectorAll(".bc-theme-popover-glass").length === 2');
    await patch({ textColor: "#111111", opacity: 37, blur: 8 });
    assert.equal(await style("#sample-text", "color"), "rgb(17, 17, 17)");
    assert.equal(await style(".desc-content", "color"), "rgb(17, 17, 17)");
    assert.equal(await style("#control-icon", "color"), "rgb(255, 128, 0)");
    assert.equal(await style("#control-icon", "webkitTextFillColor"), "rgb(255, 128, 0)");
    assert.equal(await style("#control-icon", "backgroundColor"), "rgb(1, 2, 3)");
    assert.equal(await style("#art", "backgroundColor"), "rgb(20, 30, 40)");
    assert.equal(await style("#search-input", "backgroundColor"), "rgba(255, 255, 255, 0.18)");
    assert.match(await style("#bc-theme-header-glass", "backgroundColor"), /0\.37/);
    await patch({ material: "clear", coverage: "panels" });
    assert.equal(await style(".video-desc-container", "backdropFilter"), "blur(0px)");
    assert.equal(await style(".video-desc-container", "backgroundColor"), "rgba(255, 255, 255, 0)");
    await patch({ material: "glass", coverage: "all", topDownload: true, channelFitness: true });
    assert.equal(await style(".left-entry__item", "display"), "none");
    assert.equal(await style('a[href="/c/gym/"]', "display"), "none");
    await page.evaluate(`document.querySelector('.bili-header__bar').outerHTML = document.querySelector('.bili-header__bar').outerHTML;
      const channel = document.createElement('div');channel.className='header-channel';document.querySelector('main').append(channel);`);
    await until(page, 'document.querySelector("#bc-theme-channel-glass")?.style.display === "block"');
    assert.equal(await style(".left-entry__item", "display"), "none");
    await until(page, 'document.querySelector("bili-comments").shadowRoot.querySelector("[data-bc-owned]") !== null');
    assert.equal(await page.evaluate('getComputedStyle(document.querySelector("bili-comments").shadowRoot.querySelector("#comment-text")).color'), "rgb(17, 17, 17)");
    await patch({ enabled: false });
    assert.equal(await page.evaluate('document.querySelectorAll("[data-bc-owned]").length'), 0);
    assert.equal(await style("#sample-text", "color"), "rgb(51, 51, 51)");
    assert.equal(await page.evaluate('document.documentElement.dataset.bcMaterial'), "site-original");
    assert.equal(await page.evaluate('document.documentElement.style.getPropertyValue("--bc-accent")'), "#123abc");
    assert.equal(await page.evaluate('document.documentElement.style.getPropertyPriority("--bc-accent")'), "important");
    await patch({ enabled: true });
    await page.reload();
    await until(page, 'document.documentElement.dataset.bcEnabled === "true"');
    assert.equal(await style(".left-entry__item", "display"), "none");
    assert.equal(await page.evaluate('document.querySelectorAll("#bc-theme-wallpaper").length'), 1);
    console.log("  PASS page styles, media protection, nested glass, SPA replacement, disable and reload");

    const popup = await cdp.page(`${base}/popup.html`);
    await until(popup, '!document.querySelector("#controls").disabled');
    const input = (name, value) => popup.evaluate(`(() => {const input=document.forms[0].elements.namedItem(${JSON.stringify(name)});
      ${typeof value === "boolean" ? `input.checked=${value}` : `input.value=${JSON.stringify(value)}`};
      input.dispatchEvent(new Event(${name === "language" ? '"change"' : '"input"'}, {bubbles:true}));})()`);
    await input("language", "en");
    await until(popup, 'document.querySelector("#save-status").textContent === "Saved on this device"');
    assert.equal(await popup.evaluate('document.documentElement.lang'), "en");
    await input("language", "zh");
    await until(popup, 'document.querySelector("#save-status").textContent === "已保存到本机"');
    await input("language", "auto");
    await until(popup, 'document.forms[0].elements.language.value === "auto" && !document.querySelector("#reset").disabled');
    assert.equal(rt.data[rt.BC.KEYS.settings].language, "auto");
    await popup.evaluate('document.querySelector("#hide-all-nav").click()');
    await until(popup, 'document.querySelector("#hide-all-nav").disabled');
    assert.ok(rt.BC.NAV_ITEMS.every(({ key }) => rt.data[rt.BC.KEYS.settings][key]));
    await until(page, 'document.documentElement.dataset.bcChannelLayout.includes("all")');
    await popup.evaluate('document.querySelector("#show-all-nav").click()');
    await until(popup, 'document.querySelector("#show-all-nav").disabled');
    await popup.evaluate('document.querySelector(".nav-group-bulk").click()');
    await until(popup, 'document.forms[0].elements.topHome.checked');
    await popup.evaluate('document.querySelector(".nav-group-bulk").click()');
    await until(popup, '!document.forms[0].elements.topHome.checked');

    const upload = (expression) => popup.evaluate(`(async()=>{const file=await (${expression});const transfer=new DataTransfer();
      transfer.items.add(file);const input=document.querySelector('#image-file');input.files=transfer.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    const saved = () => until(popup, '!document.querySelector("#controls").disabled && !document.querySelector("#remove-image").disabled');
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      await upload(`(async()=>{const canvas=document.createElement('canvas');canvas.width=3000;canvas.height=2000;
        canvas.getContext('2d').fillRect(0,0,3000,2000);const blob=await new Promise(r=>canvas.toBlob(r,'${type}'));
        return new File([blob],'sample.${type.split('/')[1]}',{type:'${type}'});})()`);
      await saved();
      const background = rt.data[rt.BC.KEYS.background];
      assert.match(background.dataUrl, /^data:image\/webp;base64,/);
      assert.ok(background.width <= 2560 && background.width * background.height <= 4000000);
    }
    const gif = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    await upload(`new File([Uint8Array.from(atob('${gif}'),c=>c.charCodeAt(0))],'sample.gif',{type:'image/gif'})`);
    await saved();
    assert.equal(rt.data[rt.BC.KEYS.background].dataUrl, `data:image/gif;base64,${gif}`);
    await upload(`new File([new Uint8Array(${20 * 1024 * 1024 + 1})],'too-big.mp4',{type:'video/mp4'})`);
    await until(popup, 'document.querySelector("#save-status").classList.contains("error")');
    assert.equal(rt.data[rt.BC.KEYS.background].dataUrl, `data:image/gif;base64,${gif}`);
    console.log("  PASS popup localization, navigation groups, PNG/JPG/WebP conversion, GIF preservation and 20 MiB rejection");

    await upload(`(async()=>{const canvas=document.createElement('canvas');canvas.width=160;canvas.height=90;
      const stream=canvas.captureStream(10);const recorder=new MediaRecorder(stream,{mimeType:'video/mp4'});
      const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);
      const stopped=new Promise(r=>recorder.onstop=r);recorder.start();
      for(let i=0;i<4;i++){canvas.getContext('2d').fillRect(i*10,0,10,20);await new Promise(r=>setTimeout(r,80));}
      recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
      return new File(chunks,'sample.mp4',{type:'video/mp4'});})()`);
    await saved();
    await until(page, 'document.querySelector("#bc-theme-wallpaper")?.dataset.bcVideo === "true"');
    await page.activate();
    const video = 'testShadows["bc-theme-wallpaper"].querySelector("video")';
    await until(page, `${video}.readyState >= 2`);
    assert.equal(await page.evaluate(`${video}.muted && ${video}.loop`), true);
    await until(page, `!${video}.paused`);
    await popup.activate();
    await until(page, `document.hidden && ${video}.paused`);
    await page.activate();
    await until(page, `!document.hidden && !${video}.paused`);
    const videoSource = await page.evaluate(`${video}.src`);
    const recordedMP4 = rt.data[rt.BC.KEYS.background].dataUrl;
    await patch({ accent: "#ff8800" });
    assert.equal(await page.evaluate(`${video}.src`), videoSource);
    await page.reload();
    await until(page, 'document.querySelector("#bc-theme-wallpaper")?.dataset.bcVideo === "true"');
    await popup.evaluate('document.querySelector("#remove-image").click()');
    await until(page, 'document.querySelector("#bc-theme-wallpaper")?.dataset.bcVideo === "false"');
    assert.match(await style("#bc-theme-wallpaper", "backgroundImage"), /linear-gradient/);
    await until(popup, '!document.querySelector("#controls").disabled && !document.querySelector("#reset").disabled');
    await popup.evaluate('document.querySelector("#reset").click()');
    await until(popup, '!document.querySelector("#controls").disabled && document.forms[0].elements.opacity.value === "58"');
    for (const field of rt.BC.FIELDS) assert.equal(rt.data[rt.BC.KEYS.settings][field], rt.BC.DEFAULT[field]);
    console.log("  PASS real MP4 decoding/playback, tab pause/resume, persistence, removal and defaults");
    await runCompatibilityMatrix({ cdp, base, until, mp4: recordedMP4,
      screenshots: screenshotDirectory && join(screenshotDirectory, browserVersion.split("/")[0]) });
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    console.log("  Closing test browser");
    if (cdp) { await cdp.send("Browser.close").catch(() => {}); cdp.socket.close(); }
    if (process.exitCode === null) { process.kill(); await Promise.race([new Promise((resolve) => process.once("exit", resolve)), sleep(3000)]); }
    for (const stream of streams) stream.end();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    // Only remove the exact temporary profile created above, never a user profile.
    assert.equal(resolve(dirname(profile)), resolve(tmpdir()));
    assert.ok(profile.startsWith(join(tmpdir(), "bc-theme-browser-")));
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

const executables = process.argv.slice(2);
if (!executables.length) executables.push("C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe");
let ran = 0;
for (const executable of executables) {
  if (!await access(executable).then(() => true, () => false)) { console.log(`SKIP missing browser: ${executable}`); continue; }
  console.log(`Browser: ${executable}`);
  await runBrowser(executable); ran += 1;
}
assert.ok(ran > 0, "Pass a Chrome/Edge executable path to run browser checks");
