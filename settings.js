/* Shared by the popup, the page script, and the extension service worker. */
(() => {
  const KEYS = Object.freeze({ settings: "bc.settings", background: "bc.background" });
  const MAX_BACKGROUND_BYTES = 20 * 1024 * 1024;
  const MESSAGE = Object.freeze({
    GET: "BC_THEME/GET", PATCH: "BC_THEME/PATCH",
    BACKGROUND: "BC_THEME/BACKGROUND", RESET: "BC_THEME/RESET"
  });
  const item = (key, zh, en, selector) => Object.freeze({ key, zh, en, selector });
  const topLink = (key, zh, en, href) => item(key, zh, en,
    `.bili-header__bar .left-entry-main > .left-entry__item:has(> a[href*="${href}"])`);
  const channelIcon = (key, zh, en, href) => item(key, zh, en,
    `.bili-header__channel .channel-icons > a.channel-icons__item[href*="${href}"], ` +
    `.header-channel .header-channel-fixed-left > a.left-fixed-channel[href*="${href}"]`);
  const channelCategory = (key, zh, en, href) => item(key, zh, en,
    `.bili-header__channel .channel-items__left > a.channel-link[href*="${href}"], ` +
    `.header-channel a.channel-item[href*="${href}"]`);
  const channelShortcut = (key, zh, en, href) => item(key, zh, en,
    `.bili-header__channel .channel-items__right > a.channel-link__right[href*="${href}"], ` +
    `.header-channel .header-channel-fixed-side-list > a.channel-item[href*="${href}"]`);
  const NAV_GROUPS = Object.freeze([
    { key: "topLeft", zh: "顶部左侧", en: "Top left", items: [
      item("topHome", "首页", "Home", ".bili-header__bar .left-entry-main > .home-page-entry"),
      topLink("topAnime", "番剧", "Anime", "/anime/"),
      topLink("topLive", "直播", "Live", "live.bilibili.com"),
      item("topGames", "游戏中心", "Game Center", ".bili-header__bar .game-download-notify-entry-wrap"),
      topLink("topShop", "会员购", "Shop", "show.bilibili.com"),
      topLink("topManga", "漫画", "Manga", "manga.bilibili.com"),
      topLink("topMatches", "赛事", "Events", "/match/home/"),
      item("topVct", "VCT", "VCT", ".bili-header__bar .left-loc-entry"),
      topLink("topDownload", "下载客户端", "Download app", "app.bilibili.com")
    ] },
    { key: "channelIcons", zh: "首页频道图标", en: "Home icons", items: [
      channelIcon("channelMoments", "动态", "Moments", "t.bilibili.com"),
      channelIcon("channelTrending", "热门", "Trending", "/v/popular/all")
    ] },
    { key: "channelCategories", zh: "首页频道分类", en: "Home categories", items: [
      channelCategory("channelAnime", "番剧", "Anime", "/anime/"),
      channelCategory("channelMovies", "电影", "Movies", "/movie/"),
      channelCategory("channelGuochuang", "国创", "Chinese Anime", "/guochuang/"),
      channelCategory("channelTv", "电视剧", "TV", "/tv/"),
      channelCategory("channelVariety", "综艺", "Variety", "/variety/"),
      channelCategory("channelDocumentary", "纪录片", "Documentaries", "/documentary/"),
      channelCategory("channelAnimation", "动画", "Animation", "/c/douga/"),
      channelCategory("channelGames", "游戏", "Games", "/c/game/"),
      channelCategory("channelKichiku", "鬼畜", "Kichiku", "/c/kichiku/"),
      channelCategory("channelMusic", "音乐", "Music", "/c/music/"),
      channelCategory("channelDance", "舞蹈", "Dance", "/c/dance/"),
      channelCategory("channelFilm", "影视", "Film & TV", "/c/cinephile/"),
      channelCategory("channelEntertainment", "娱乐", "Entertainment", "/c/ent/"),
      channelCategory("channelKnowledge", "知识", "Knowledge", "/c/knowledge/"),
      channelCategory("channelTech", "科技数码", "Tech", "/c/tech/"),
      channelCategory("channelNews", "资讯", "News", "/c/information/"),
      channelCategory("channelFood", "美食", "Food", "/c/food/"),
      channelCategory("channelShortplay", "小剧场", "Short Dramas", "/c/shortplay/"),
      channelCategory("channelCars", "汽车", "Cars", "/c/car"),
      channelCategory("channelFashion", "时尚美妆", "Fashion", "/c/fashion/"),
      channelCategory("channelSports", "体育运动", "Sports", "/c/sports/"),
      channelCategory("channelAnimals", "动物", "Animals", "/c/animal/"),
      channelCategory("channelVlog", "vlog", "Vlog", "/c/vlog/"),
      channelCategory("channelPainting", "绘画", "Art", "/c/painting/"),
      channelCategory("channelAi", "人工智能", "AI", "/c/ai/"),
      channelCategory("channelHome", "家装房产", "Home & Property", "/c/home/"),
      channelCategory("channelOutdoors", "户外", "Outdoors", "/c/outdoors/"),
      item("channelMore", "更多", "More",
        ".bili-header__channel .channel-link__more, .header-channel .header-channel-fixed-arrow")
    ] },
    { key: "channelShortcuts", zh: "首页快捷入口", en: "Home shortcuts", items: [
      channelShortcut("shortcutArticles", "专栏", "Articles", "/read/home/"),
      channelShortcut("shortcutLive", "直播", "Live", "live.bilibili.com"),
      channelShortcut("shortcutEvents", "活动", "Events", "reward-activity-list-page"),
      channelShortcut("shortcutCourses", "课堂", "Courses", "/cheese/"),
      channelShortcut("shortcutCommunity", "社区中心", "Community", "activity-5zJxM3spoS"),
      channelShortcut("shortcutMusic", "新歌热榜", "Music Chart", "music.bilibili.com")
    ] },
    { key: "channelMoreItems", zh: "更多频道", en: "More channels", items: [
      channelCategory("channelFitness", "健身", "Fitness", "/c/gym/"),
      channelCategory("channelCrafts", "手工", "Crafts", "/c/handmake/"),
      channelCategory("channelTravel", "旅游出行", "Travel", "/c/travel/"),
      channelCategory("channelRural", "三农", "Rural", "/c/rural/"),
      channelCategory("channelParenting", "亲子", "Parenting", "/c/parenting/"),
      channelCategory("channelHealth", "健康", "Health", "/c/health/"),
      channelCategory("channelEmotion", "情感", "Relationships", "/c/emotion/"),
      channelCategory("channelHobbies", "生活兴趣", "Hobbies", "/c/life_joy/"),
      channelCategory("channelLife", "生活经验", "Life Tips", "/c/life_experience/"),
      channelCategory("channelCharity", "公益", "Charity", "love.bilibili.com"),
      channelCategory("channelUltraHd", "超高清", "Ultra HD", "Vp41b8bsU9Wkog3X"),
      channelCategory("channelPodcasts", "视频播客", "Video Podcasts", "jpyPhRRrMn3fmZ2B")
    ] },
    { key: "otherControls", zh: "其他页面控件", en: "Other controls", items: [
      item("hideFloatingTools", "悬浮工具栏", "Floating toolbar",
        ".palette-button-wrap, .fixed-sidenav-storage, .space-float")
    ] }
  ].map((group) => Object.freeze({ ...group, items: Object.freeze(group.items) })));
  const NAV_ITEMS = Object.freeze(NAV_GROUPS.flatMap((group) => group.items));
  const FIELDS = Object.freeze([
    "enabled", "coverage", "material", "opacity", "blur", "accent", "textColor", "language",
    ...NAV_ITEMS.map((entry) => entry.key)
  ]);
  const DEFAULT = Object.freeze({
    schemaVersion: 2, revision: 0, enabled: true, coverage: "all",
    material: "glass", opacity: 58, blur: 14, accent: "#63d5ff", textColor: "#ffffff",
    language: "auto", ...Object.fromEntries(NAV_ITEMS.map((entry) => [entry.key, false]))
  });

  function boundedNumber(value, fallback, min, max) {
    if (value == null || value === "" || typeof value === "boolean") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(Math.min(max, Math.max(min, number))) : fallback;
  }

  function revision(value) {
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }

  function settings(input = {}) {
    const source = input && typeof input === "object" ? input : {};
    const result = {
      schemaVersion: 2,
      revision: revision(source.revision),
      enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT.enabled,
      coverage: ["all", "panels"].includes(source.coverage) ? source.coverage : DEFAULT.coverage,
      material: ["glass", "clear"].includes(source.material) ? source.material : DEFAULT.material,
      language: ["auto", "zh", "en"].includes(source.language) ? source.language : DEFAULT.language,
      opacity: boundedNumber(source.opacity, DEFAULT.opacity, 0, 90),
      blur: boundedNumber(source.blur, DEFAULT.blur, 0, 30),
      accent: typeof source.accent === "string" && /^#[\da-f]{6}$/i.test(source.accent)
        ? source.accent.toLowerCase() : DEFAULT.accent,
      textColor: typeof source.textColor === "string" && /^#[\da-f]{6}$/i.test(source.textColor)
        ? source.textColor.toLowerCase() : DEFAULT.textColor
    };
    for (const entry of NAV_ITEMS) {
      const legacy = entry.key === "topDownload" ? source.hideDownloadButton : false;
      result[entry.key] = typeof source[entry.key] === "boolean" ? source[entry.key] : legacy === true;
    }
    return result;
  }

  function patchSettings(current, patch) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new Error("INVALID_SETTINGS");
    const changes = Object.fromEntries(FIELDS.filter((field) => Object.hasOwn(patch, field))
      .map((field) => [field, patch[field]]));
    return settings({ ...current, ...changes });
  }

  function emptyBackground(revisionNumber = 0) {
    return { revision: revisionNumber, dataUrl: "", name: "", width: 0, height: 0, bytes: 0 };
  }

  function background(input, revisionNumber = revision(input?.revision)) {
    if (!input || input.dataUrl === "") return emptyBackground(revisionNumber);
    const dataUrl = input.dataUrl;
    if (typeof dataUrl !== "string" ||
        dataUrl.length > Math.ceil(MAX_BACKGROUND_BYTES / 3) * 4 + 32) {
      throw new Error("INVALID_IMAGE");
    }
    const match = /^data:(?:image\/(?:png|jpeg|webp|gif|avif)|video\/mp4);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
    if (!match) throw new Error("INVALID_IMAGE");
    const encoded = match[1];
    if (encoded.length % 4 !== 0) throw new Error("BROKEN_IMAGE");
    const bytes = encoded.length * 3 / 4 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
    if (bytes > MAX_BACKGROUND_BYTES) throw new Error("INVALID_IMAGE");
    return {
      revision: revisionNumber, dataUrl,
      name: typeof input.name === "string" ? input.name.slice(0, 120) : "自定义背景",
      width: boundedNumber(input.width, 0, 0, 100_000),
      height: boundedNumber(input.height, 0, 0, 100_000),
      bytes
    };
  }

  function luminance(rgb) {
    const [red, green, blue] = rgb.map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  }

  function tokens(input) {
    const current = settings(input);
    const glass = current.material === "glass";
    const fill = glass ? current.opacity / 100 : 0;
    const rgbOf = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
    const text = rgbOf(current.textColor);
    const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) /
      (Math.min(luminance(a), luminance(b)) + 0.05);
    const darkText = contrast(text, [255, 255, 255]) >= contrast(text, [0, 0, 0]);
    // One wallpaper veil protects text even in Clear mode or at zero glass
    // opacity. It replaces opaque black boxes on every individual input.
    const base = darkText ? [255, 255, 255] : [0, 0, 0];
    const worst = darkText ? [0, 0, 0] : [255, 255, 255];
    const mix = (a, b, amount) => a.map((value, index) => Math.round(value * (1 - amount) + b[index] * amount));
    const goal = Math.min(7, Math.max(4.5, contrast(text, base) * 0.98));
    let low = 0;
    let high = 1;
    for (let step = 0; step < 16; step += 1) {
      const middle = (low + high) / 2;
      if (contrast(text, mix(worst, base, middle)) >= goal) high = middle;
      else low = middle;
    }
    // Leave a small margin for fractional CSS alpha compositing and rounding.
    const veil = Math.min(1, Math.ceil((high + 1 / 255) * 10000) / 10000);
    const readableBackdrop = mix(worst, base, veil);
    const readable = (candidate, fallback = text) => {
      for (let step = 0; step <= 100; step += 1) {
        const rgb = mix(candidate, fallback, step / 100);
        if (contrast(rgb, readableBackdrop) >= 4.6) return `rgb(${rgb.join(", ")})`;
      }
      return current.textColor;
    };
    const secondary = readable(mix(text, base, 0.32));
    const surface = base.join(", ");
    const control = `rgba(${surface}, 0.18)`;
    return {
      "--bc-surface-alpha": String(fill),
      "--bc-blur": `${glass ? current.blur : 0}px`,
      "--bc-header-alpha": String(fill),
      "--bc-accent": current.accent,
      "--bc-text-color": current.textColor,
      "--bc-text-shadow": "none",
      "--bc-surface-rgb": surface,
      "--bc-wallpaper-veil": String(veil),
      "--bc-secondary-color": secondary,
      "--bc-placeholder-color": secondary,
      "--bc-disabled-color": `rgb(${mix(text, base, 0.45).join(", ")})`,
      "--bc-link-color": readable(rgbOf(current.accent), darkText ? [0, 0, 0] : [255, 255, 255]),
      "--bc-border": `rgba(${text.join(", ")}, 0.22)`,
      "--bc-control-bg": control,
      "--bc-input-bg": control,
      "--bc-popup-bg": `rgb(${surface})`,
      "--bc-focus": readable(rgbOf(current.accent), darkText ? [0, 0, 0] : [255, 255, 255])
    };
  }

  function createClient(api = chrome) {
    let snapshot = {};
    const listeners = new Set();
    let started = false;
    let starting;

    function accept(incoming) {
      const next = { ...snapshot };
      for (const key of ["settings", "background"]) {
        if (incoming?.[key] && (!next[key] ||
            revision(incoming[key].revision) > revision(next[key].revision))) next[key] = incoming[key];
      }
      const changed = next.settings !== snapshot.settings || next.background !== snapshot.background;
      snapshot = next;
      if (changed && next.settings && next.background) {
        for (const listener of listeners) listener(next);
      }
      return next;
    }

    function onStorageChanged(changes, area) {
      if (area !== "local") return;
      accept({ settings: changes[KEYS.settings]?.newValue,
        background: changes[KEYS.background]?.newValue });
    }

    async function request(type, payload) {
      const response = await api.runtime.sendMessage({ type, payload });
      if (!response?.ok) throw new Error(response?.error || "CONNECTION_ERROR");
      return accept(response.data);
    }

    return {
      get snapshot() { return snapshot; },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      async start() {
        if (starting) return starting;
        if (started) return snapshot;
        started = true;
        api.storage.onChanged.addListener(onStorageChanged);
        starting = request(MESSAGE.GET);
        try { return await starting; }
        catch (error) { this.dispose(); throw error; }
        finally { starting = undefined; }
      },
      patch(changes) { return request(MESSAGE.PATCH, changes); },
      setBackground(input) { return request(MESSAGE.BACKGROUND, input); },
      reset() { return request(MESSAGE.RESET); },
      dispose() { api.storage.onChanged.removeListener(onStorageChanged); started = false; }
    };
  }

  globalThis.BiliTheme = Object.freeze({
    KEYS, MESSAGE, MAX_BACKGROUND_BYTES, FIELDS, DEFAULT, NAV_GROUPS, NAV_ITEMS, settings, patchSettings,
    emptyBackground, background, tokens, createClient
  });
})();

/* In the extension service worker this file also owns persistence. Keeping the
   worker in one script avoids an extra script request on startup. */
if (typeof document === "undefined" &&
    typeof chrome !== "undefined" && chrome.runtime?.onMessage?.addListener) {
  (() => {
    const BC = globalThis.BiliTheme;
    let state;
    let queue = Promise.resolve();

    async function initialize() {
      if (state) return;
      const saved = await chrome.storage.local.get([BC.KEYS.settings, BC.KEYS.background, "settings"]);
      const record = saved[BC.KEYS.settings];
      if (record?.schemaVersion > BC.DEFAULT.schemaVersion) {
        throw new Error("NEWER_VERSION");
      }
      const legacy = record && typeof record === "object" ? record : saved.settings;
      const migrated = record?.schemaVersion !== BC.DEFAULT.schemaVersion;
      const settings = BC.settings(legacy);
      if (migrated) settings.revision += 1;
      let background;
      let repaired = false;
      try {
        background = BC.background(saved[BC.KEYS.background] ?? (legacy?.backgroundImage
          ? { dataUrl: legacy.backgroundImage, name: "原有背景", revision: settings.revision }
          : null));
      } catch {
        // A damaged background must not prevent reading settings or resetting them.
        background = BC.emptyBackground(Math.max(settings.revision,
          Number.isSafeInteger(saved[BC.KEYS.background]?.revision) ? saved[BC.KEYS.background].revision : 0));
        repaired = true;
      }
      settings.revision = Math.max(settings.revision, background.revision);
      if (migrated || repaired) {
        await chrome.storage.local.set({ [BC.KEYS.settings]: settings, [BC.KEYS.background]: background });
      }
      state = { settings, background };
      if (Object.hasOwn(saved, "settings")) {
        await chrome.storage.local.remove("settings").catch(() => {});
      }
    }

    function transaction(work) {
      const operation = queue.then(async () => {
        await initialize();
        return work();
      });
      queue = operation.catch(() => {});
      return operation;
    }

    async function commit(settings, background) {
      const updates = { [BC.KEYS.settings]: settings };
      if (background) updates[BC.KEYS.background] = background;
      await chrome.storage.local.set(updates);
      state = { settings, background: background || state.background };
      return background ? { settings, background } : { settings };
    }

    const handlers = {
      [BC.MESSAGE.GET]: () => transaction(() => structuredClone(state)),
      [BC.MESSAGE.PATCH]: (patch) => transaction(() => {
        const next = BC.patchSettings(state.settings, patch);
        if (BC.FIELDS.every((field) => next[field] === state.settings[field])) {
          return { settings: state.settings };
        }
        next.revision = state.settings.revision + 1;
        return commit(next);
      }),
      [BC.MESSAGE.BACKGROUND]: (input) => transaction(() => {
        const revision = state.settings.revision + 1;
        const background = BC.background(input, revision);
        return commit({ ...state.settings, revision }, background);
      }),
      [BC.MESSAGE.RESET]: () => transaction(() => {
        const revision = state.settings.revision + 1;
        return commit({ ...BC.DEFAULT, revision }, BC.emptyBackground(revision));
      })
    };

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (sender.id !== chrome.runtime.id || !Object.hasOwn(handlers, message?.type)) return false;
      Promise.resolve().then(() => handlers[message.type](message.payload))
        .then((data) => sendResponse({ ok: true, data }))
        .catch((error) => sendResponse({ ok: false, error: error.message || "SAVE_ERROR" }));
      return true;
    });
  })();
}
