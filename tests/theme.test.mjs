import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const context = vm.createContext({ URL });
vm.runInContext(readFileSync(new URL("../theme.js", import.meta.url), "utf8"), context);
const theme = context.BiliThemePage;

test("page classification respects host, route, and embedded layouts", () => {
  for (const [url, expected] of [
    ["https://www.bilibili.com/", "home"], ["https://t.bilibili.com/", "dynamic"],
    ["https://www.bilibili.com/video/BV1xx", "video"], ["https://space.bilibili.com/123/dynamic", "space"],
    ["https://search.bilibili.com/all?keyword=test", "search"], ["https://www.bilibili.com/read/cv123", "article"],
    ["https://www.bilibili.com/opus/123", "opus"], ["https://t.bilibili.com/opus/123", "opus"],
    ["https://www.bilibili.com/bangumi/play/ep123", "bangumi"], ["https://live.bilibili.com/123", "live"],
    ["https://manga.bilibili.com/", "other"], ["https://member.bilibili.com/", "other"]
  ]) assert.equal(theme.classify(url), expected, url);
  assert.equal(theme.classify("https://www.bilibili.com/", (s) => s === theme.profiles.dynamic.layout), "dynamic");
  assert.equal(theme.classify("https://www.bilibili.com/video/BV1", () => true), "video", "routes win over obsolete DOM");
  assert.equal(theme.classify("https://space.bilibili.com/123", () => true), "space", "dynamic cards do not reclassify a space page");
  for (const [name, profile] of Object.entries(theme.profiles)) {
    if (profile.layout) assert.equal(theme.classify("https://example.test/", (selector) => selector === profile.layout), name);
  }
});
