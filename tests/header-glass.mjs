import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Fulfill every request in CDP: the HTTPS page and CDN image never leave the
// isolated test browser, while Chromium still performs real mixed-content checks.
export async function runHeaderGlassChecks({ cdp, until, html, snapshot }) {
  const page = await cdp.page("about:blank");
  const warnings = [];
  const requests = [];
  const failures = [];
  const files = new Map(await Promise.all(["settings.js", "theme.js", "minimalist.js", "content.js"]
    .map(async (name) => [`/${name}`, await readFile(new URL(`../${name}`, import.meta.url), "utf8")])));
  files.set("/", html);
  files.set("/bridge.js", `
    const listeners = new Set();
    globalThis.testErrors = [];
    window.addEventListener('error', event => testErrors.push(event.message));
    globalThis.chrome = {
      runtime: { sendMessage: async () => ({ok:true, data:${JSON.stringify(snapshot)}}) },
      storage: { onChanged: {addListener:f=>listeners.add(f), removeListener:f=>listeners.delete(f)} }
    };
  `);
  const image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
  const onMessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.sessionId !== page.sessionId) return;
    if (message.method === "Log.entryAdded" && message.params.entry.text.includes("Mixed Content")) {
      warnings.push(message.params.entry);
    }
    if (message.method !== "Fetch.requestPaused") return;
    const { requestId, request } = message.params;
    requests.push(request.url);
    const url = new URL(request.url);
    const source = url.hostname === "www.bilibili.com" && files.get(url.pathname);
    const isImage = url.hostname === "i0.hdslb.com";
    void cdp.send("Fetch.fulfillRequest", { requestId, responseCode: source || isImage ? 200 : 404,
      responseHeaders: [{ name: "Content-Type", value: isImage ? "image/png" :
        url.pathname.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8" }],
      body: isImage ? image : Buffer.from(source || "").toString("base64")
    }, page.sessionId).catch((error) => failures.push(error));
  };
  cdp.socket.addEventListener("message", onMessage);
  try {
    await cdp.send("Log.enable", {}, page.sessionId);
    await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, page.sessionId);
    await page.navigate("https://www.bilibili.com/");
    await until(page, 'document.querySelector("#bc-theme-header-glass")?.style.display === "block"');
    await page.evaluate(`(() => {
      const channel = document.createElement('div');
      channel.className = 'header-channel';
      document.body.append(channel);
    })()`);
    await until(page, 'document.querySelector("#bc-theme-channel-glass")?.style.display === "block"');
    await page.evaluate(`(() => {
      const image = document.createElement('div');
      image.id = 'native-mixed-image';
      image.style.cssText = 'width:10px;height:10px;background-image:url(http://i0.hdslb.com/bfs/manga-static/header-warning.png)';
      document.querySelector('.v-popover-content').append(image);
    })()`);
    await until(page, 'document.querySelector("#native-mixed-image") !== null && document.querySelectorAll(".bc-theme-popover-glass").length === 2');
    await page.evaluate(`(() => {
      const panel = document.querySelector('.nav-search-panel');
      const siteResizeObserver = new ResizeObserver(() => {
        siteResizeObserver.disconnect();
        panel.style.left = '215px';
        panel.style.backgroundImage = 'url(http://i0.hdslb.com/bfs/manga-static/resize-warning.png)';
      });
      siteResizeObserver.observe(panel);
    })()`);
    await until(page, '[...document.querySelectorAll(".bc-theme-popover-glass")].some(glass => Math.abs(parseFloat(glass.style.left) - document.querySelector(".nav-search-panel").getBoundingClientRect().left) < 1)');
    // Give Log.entryAdded time to arrive after the image was requested.
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(failures.length, 0);
    assert.deepEqual(await page.evaluate('testErrors'), [], "layout scheduling must not create ResizeObserver loop errors");
    assert.ok(requests.some((url) => url.startsWith("https://i0.hdslb.com/")), "browser upgrades the native image to HTTPS");
    assert.ok(warnings.length, "fixture reproduces the site's mixed-content warning");
    assert.ok(warnings.every((warning) => !warning.stackTrace?.callFrames.some((frame) =>
      frame.url.endsWith("/content.js"))), "native mixed-content warnings must not be attributed to extension layout reads");
    console.log("  PASS native mixed-content upgrade without extension layout attribution");
  } finally {
    await page.close();
    cdp.socket.removeEventListener("message", onMessage);
  }
}
