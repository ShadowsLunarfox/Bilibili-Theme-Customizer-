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
  assert.equal(BC.tokens({ opacity: 37 })["--bc-header-alpha"], "0.37");
  assert.equal(BC.tokens({ material: "clear" })["--bc-blur"], "0px");
  assert.notEqual(BC.tokens({ textColor: "#000000" })["--bc-input-bg"], BC.tokens({ textColor: "#ffffff" })["--bc-input-bg"]);
  assert.equal(BC.patchSettings(BC.DEFAULT, { revision: 900, schemaVersion: 99 }).revision, 0);
  assert.throws(() => BC.patchSettings(BC.DEFAULT, []));
});

test("readability veil preserves custom text contrast without solid input boxes", () => {
  const { BC } = createRuntime();
  assert.equal(BC.tokens({ textColor: "#ff0000" })["--bc-input-bg"], "rgba(0, 0, 0, 0.18)");
  for (let red = 0; red <= 255; red += 51) {
    for (let green = 0; green <= 255; green += 51) {
      for (let blue = 0; blue <= 255; blue += 51) {
        const color = `#${[red, green, blue].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
        const channels = [red, green, blue].map((c) => c / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
        const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        const tokens = BC.tokens({ textColor: color });
        assert.equal(tokens["--bc-text-color"], color);
        const white = tokens["--bc-surface-rgb"] === "255, 255, 255";
        const veil = Number(tokens["--bc-wallpaper-veil"]);
        const channel = Math.round(white ? 255 * veil : 255 * (1 - veil)) / 255;
        const background = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        assert.ok((Math.max(luminance, background) + 0.05) / (Math.min(luminance, background) + 0.05) >= 4.5, color);
      }
    }
  }
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
