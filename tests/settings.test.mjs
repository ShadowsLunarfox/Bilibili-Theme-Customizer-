import test from "node:test";
import assert from "node:assert/strict";
import { createRuntime } from "./runtime.mjs";

const gif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

test("all media formats and exact 20 MiB boundary are validated", () => {
  const { BC } = createRuntime();
  for (const type of ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif", "video/mp4"]) {
    assert.equal(BC.background({ dataUrl: `data:${type};base64,AQ==` }).bytes, 1);
  }
  for (const dataUrl of ["https://example.com/a.png", "data:image/svg+xml;base64,AQ==", "data:image/png;base64,A"]) {
    assert.throws(() => BC.background({ dataUrl }));
  }
  const exact = Buffer.alloc(BC.MAX_BACKGROUND_BYTES).toString("base64");
  assert.equal(BC.background({ dataUrl: `data:video/mp4;base64,${exact}` }).bytes, BC.MAX_BACKGROUND_BYTES);
  assert.throws(() => BC.background({ dataUrl: `data:video/mp4;base64,${Buffer.alloc(BC.MAX_BACKGROUND_BYTES + 1).toString("base64")}` }));
});

test("settings validation and tokens preserve zero values and clear mode", () => {
  const { BC } = createRuntime();
  const settings = BC.settings({ opacity: 0, blur: 0, textColor: "#AABBCC", language: "en" });
  assert.equal(settings.opacity, 0);
  assert.equal(settings.blur, 0);
  assert.equal(settings.textColor, "#aabbcc");
  assert.equal(BC.tokens(settings)["--bc-header-alpha"], "0");
  assert.ok(Number(BC.tokens({ opacity: 37 })["--bc-header-alpha"])>0);
  assert.equal(BC.tokens({ material: "clear" })["--bc-blur"], "0px");
  assert.notEqual(BC.tokens({ textColor: "#000000" })["--bc-input-bg"], BC.tokens({ textColor: "#ffffff" })["--bc-input-bg"]);
  assert.equal(BC.patchSettings(BC.DEFAULT, { revision: 900, schemaVersion: 99 }).revision, 0);
  assert.throws(() => BC.patchSettings(BC.DEFAULT, []));
});

test("restrained material tokens preserve wallpaper and supply local text contrast", () => {
  const { BC } = createRuntime();
  const lum = rgb => { const c=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722; };
  for(let r=0;r<=255;r+=51) for(let g=0;g<=255;g+=51) for(let b=0;b<=255;b+=51) {
    const color='#'+[r,g,b].map(c=>c.toString(16).padStart(2,'0')).join('');
    const tokens=BC.tokens({textColor:color});
    assert.equal(tokens['--bc-text-color'],color);
    assert.equal(tokens['--bc-wallpaper-veil'],'0');
    const edge=tokens['--bc-text-edge'].match(/\d+/g).map(Number);
    assert.ok((Math.max(lum([r,g,b]),lum(edge))+.05)/(Math.min(lum([r,g,b]),lum(edge))+.05)>=4.5);
    assert.notEqual(tokens['--bc-text-shadow'],'none');
    for(const background of [[255,255,255],[0,0,0]]) {
      const adapted=BC.tokens({textColor:color},background);
      const ink=adapted['--bc-foreground'].match(/\d+/g).map(Number);
      assert.equal(adapted['--bc-text-color'],color,'preferred color remains unchanged');
      const rgba=adapted['--bc-glass-bg-content'].match(/[\d.]+/g).map(Number);
      const panel=background.map((v,i)=>v*(1-rgba[3])+rgba[i]*rgba[3]);
      assert.ok((Math.max(lum(ink),lum(panel))+.05)/(Math.min(lum(ink),lum(panel))+.05)>=4.5,'ink contrasts composited frosted panel');
      const metadata=adapted['--bc-secondary-color'].match(/\d+/g).map(Number);
      assert.ok((Math.max(lum(metadata),lum(panel))+.05)/(Math.min(lum(metadata),lum(panel))+.05)>=4.5,'metadata contrasts composited frosted panel');
    }
  }
  assert.ok(Number(BC.tokens()['--bc-glass-opacity'])>0);
  assert.equal(BC.tokens()['--bc-glass-tint'],'20, 24, 32');
  assert.equal(BC.tokens()['--bc-glass-bg'],'var(--bc-glass-bg-light)');
  assert.equal(BC.tokens()['--bc-glass-blur'],'18px');
  assert.equal(BC.tokens({blur:7})['--bc-glass-blur'],'7px');
  assert.equal(BC.tokens({material:'clear'})['--bc-glass-filter'],'none');
  const alpha=t=>Number(t.match(/[\d.]+/g)[3]);
  const normal=BC.tokens(),bright=BC.tokens({},[255,255,255]);
  assert.ok(alpha(normal['--bc-glass-bg-light'])<alpha(normal['--bc-glass-bg-content']));
  assert.ok(alpha(normal['--bc-glass-bg-content'])<alpha(normal['--bc-glass-bg-strong']));
  assert.ok(alpha(bright['--bc-glass-bg-content'])>alpha(normal['--bc-glass-bg-content']));
  assert.equal(bright['--bc-foreground'],normal['--bc-foreground'],'tint adapts before changing white ink');
  assert.equal(normal['--bc-glass-blur-light'],'12px');
  assert.equal(normal['--bc-glass-blur-strong'],'20px');
  const mixed=BC.tokens({},{mean:[120,120,120],dark:[0,0,0],bright:[255,255,255]});
  assert.ok(alpha(mixed['--bc-glass-bg-content'])>=alpha(bright['--bc-glass-bg-content']),'bright wallpaper regions receive protection even with a darker average');
});
test("legacy settings and embedded backgrounds migrate without losing preferences", async () => {
  for (const key of ["settings", "bc.settings"]) {
    const rt = createRuntime({ [key]: { schemaVersion: 1, opacity: 23, language: "en", hideDownloadButton: true, backgroundImage: gif } });
    const result = await rt.send(rt.BC.MESSAGE.GET);
    assert.equal(result.ok, true);
    assert.equal(result.data.settings.opacity, 23);
    assert.equal(result.data.settings.topDownload, true);
    assert.equal(result.data.settings.language, "en");
    assert.equal(result.data.background.dataUrl, gif);
    assert.equal(rt.data[rt.BC.KEYS.settings].schemaVersion, 2);
    assert.equal(Object.hasOwn(rt.data, "settings"), false);
  }
});

test("a failed migration retains the original data and can be retried", async () => {
  const rt = createRuntime({ settings: { opacity: 19, backgroundImage: gif } });
  rt.failWrite();
  assert.equal((await rt.send(rt.BC.MESSAGE.GET)).ok, false);
  assert.equal(rt.data.settings.backgroundImage, gif);
  assert.equal((await rt.send(rt.BC.MESSAGE.GET)).data.settings.opacity, 19);
});

test("a damaged background does not block settings, replacement or reset", async () => {
  const rt = createRuntime({ "bc.settings": { schemaVersion: 2, revision: 4, language: "en", opacity: 21 },
    "bc.background": { revision: 9, dataUrl: "broken" } });
  const result = await rt.send(rt.BC.MESSAGE.GET);
  assert.equal(result.data.settings.opacity, 21);
  assert.equal(result.data.background.dataUrl, "");
  const replacement = await rt.send(rt.BC.MESSAGE.BACKGROUND, { dataUrl: gif });
  assert.equal(replacement.ok, true);
  assert.ok(replacement.data.background.revision > result.data.background.revision);
  assert.equal((await rt.send(rt.BC.MESSAGE.RESET)).data.settings.language, "auto");
});

test("newer schemas remain untouched and unrelated messages are rejected", async () => {
  const rt = createRuntime({ "bc.settings": { schemaVersion: 99 } });
  assert.equal((await rt.send(rt.BC.MESSAGE.GET)).error, "NEWER_VERSION");
  assert.equal(rt.writes, 0);
  assert.equal(rt.receive({ type: rt.BC.MESSAGE.RESET }, { id: "another-extension" }), false);
  assert.equal(rt.receive({ type: "other" }, { id: "theme-test" }), false);
});

test("concurrent patches, live clients, restart persistence and reset", async () => {
  const rt = createRuntime();
  const first = rt.BC.createClient(rt.chrome);
  const second = rt.BC.createClient(rt.chrome);
  await Promise.all([first.start(), second.start()]);
  await Promise.all([first.patch({ opacity: 35 }), second.patch({ blur: 8 }), first.patch({ language: "en", topHome: true })]);
  assert.equal(first.snapshot.settings.opacity, 35);
  assert.equal(second.snapshot.settings.blur, 8);
  assert.equal(second.snapshot.settings.topHome, true);
  await first.setBackground({ dataUrl: gif });
  const restarted = createRuntime(rt.data);
  const restored = (await restarted.send(rt.BC.MESSAGE.GET)).data;
  assert.equal(restored.settings.language, "en");
  assert.equal(restored.background.dataUrl, gif);
  const writes = rt.writes;
  await first.patch({ opacity: 35 });
  assert.equal(rt.writes, writes, "no-op patches do not write storage");
  rt.failWrite();
  await assert.rejects(first.patch({ opacity: 36 }), /SAVE_ERROR/);
  await first.patch({ opacity: 37 });
  assert.equal(second.snapshot.settings.opacity, 37);
  await first.reset();
  assert.equal(second.snapshot.background.dataUrl, "");
  for (const field of rt.BC.FIELDS) assert.equal(second.snapshot.settings[field], rt.BC.DEFAULT[field]);
  first.dispose(); second.dispose();
  assert.equal(rt.listeners.size, 0);
});

test("duplicate and stale replies do not notify or replace media twice", async () => {
  const rt = createRuntime();
  const client = rt.BC.createClient(rt.chrome);
  let notifications = 0;
  client.subscribe(() => notifications += 1);
  const starts = await Promise.all([client.start(), client.start()]);
  assert.ok(starts.every((snapshot) => snapshot.settings && snapshot.background));
  assert.equal(rt.listeners.size, 1);
  const count = notifications;
  await client.setBackground({ dataUrl: gif });
  assert.equal(notifications, count + 1);
  const background = client.snapshot.background;
  await rt.chrome.storage.local.set({ [rt.BC.KEYS.background]: { ...background, dataUrl: "stale", revision: 0 } });
  assert.equal(client.snapshot.background, background);
  client.dispose();
});

test("minimalist defaults extend existing schema-2 profiles without changing theme or media", async () => {
  const rt = createRuntime({
    "bc.settings": { schemaVersion: 2, revision: 7, opacity: 23, blur: 5, material: "clear",
      textColor: "#112233", accent: "#336699", topDownload: true, language: "zh" },
    "bc.background": { revision: 7, dataUrl: gif, name: "Keep this wallpaper" }
  });
  const client = rt.BC.createClient(rt.chrome);
  await client.start();
  assert.equal(client.snapshot.settings.minimalistEnabled, false);
  for (const field of ["minimalistHideAds", "minimalistHideBanner", "minimalistCompactNav", "minimalistGrid"]) {
    assert.equal(client.snapshot.settings[field], true);
  }
  assert.equal(client.snapshot.settings.minimalistHideCarousel, false);
  assert.equal(rt.writes, 0, "reading an existing profile doesn't overwrite storage");
  await client.patch({ minimalistEnabled: true, minimalistHideAds: false,
    minimalistCategory_channelFood: true, minimalistCategory_channelGames: false });
  await client.patch({ minimalistEnabled: false });
  const restored = (await createRuntime(rt.data).send(rt.BC.MESSAGE.GET)).data;
  for (const field of ["opacity", "blur", "material", "textColor", "accent", "topDownload", "language"]) {
    assert.equal(restored.settings[field], client.snapshot.settings[field]);
  }
  assert.equal(restored.background.dataUrl, gif);
  assert.equal(restored.background.name, "Keep this wallpaper");
  assert.equal(restored.settings.minimalistHideAds, false);
  assert.equal(restored.settings.minimalistCategory_channelFood, true);
  assert.equal(restored.settings.minimalistCategory_channelGames, false);
  const writes = rt.writes;
  await client.patch({ minimalistEnabled: false });
  assert.equal(rt.writes, writes);
  const normalized = rt.BC.settings({ minimalistEnabled: "true", minimalistHideAds: 0,
    minimalistCategory_channelFood: "false", minimalistCategory_channelGames: null });
  assert.equal(normalized.minimalistEnabled, false);
  assert.equal(normalized.minimalistHideAds, true);
  assert.equal(normalized.minimalistCategory_channelFood, false);
  assert.equal(normalized.minimalistCategory_channelGames, true);
  client.dispose();
});

test("reference liquid-glass preset persists without replacing media or navigation preferences", async () => {
  const rt = createRuntime({ "bc.settings": { schemaVersion: 2, revision: 5, topDownload: true,
    channelGames: true, minimalistCategory_channelMusic: false },
    "bc.background": { revision: 5, dataUrl: gif, name: "My animation" } });
  const client = rt.BC.createClient(rt.chrome);
  await client.start();
  assert.equal(client.snapshot.settings.minimalistReferenceLayout, false);
  assert.equal(client.snapshot.settings.minimalistLiquidGlass, false);
  await client.patch(rt.BC.REFERENCE_PRESET);
  assert.equal(client.snapshot.settings.minimalistReferenceLayout, true);
  assert.equal(client.snapshot.settings.minimalistLiquidGlass, true);
  assert.equal(client.snapshot.settings.minimalistHideBanner, true);
  assert.equal(client.snapshot.settings.minimalistHideCarousel, false);
  assert.equal(client.snapshot.settings.topDownload, true);
  assert.equal(client.snapshot.settings.channelGames, true);
  assert.equal(client.snapshot.settings.minimalistCategory_channelMusic, false);
  assert.equal(client.snapshot.background.dataUrl, gif);
  assert.equal(client.snapshot.background.name, "My animation");
  const restarted = (await createRuntime(rt.data).send(rt.BC.MESSAGE.GET)).data.settings;
  for (const [key, value] of Object.entries(rt.BC.REFERENCE_PRESET)) assert.equal(restarted[key], value, key);
  await client.patch({ minimalistReferenceLayout: false, minimalistLiquidGlass: false });
  assert.equal(client.snapshot.settings.minimalistEnabled, false, "appearance preset never enables content filtering");
  client.dispose();
});
