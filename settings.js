/* Shared by the popup, the page script, and the extension service worker. */
(() => {
  const KEYS = Object.freeze({ settings: "bc.settings", background: "bc.background" });
  const MESSAGE = Object.freeze({
    GET: "BC_THEME/GET", PATCH: "BC_THEME/PATCH",
    BACKGROUND: "BC_THEME/BACKGROUND", RESET: "BC_THEME/RESET"
  });
  const FIELDS = Object.freeze(["enabled", "coverage", "material", "opacity", "blur", "accent", "language"]);
  const DEFAULT = Object.freeze({
    schemaVersion: 2, revision: 0, enabled: true, coverage: "all",
    material: "glass", opacity: 58, blur: 14, accent: "#63d5ff", language: "auto"
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
    return {
      schemaVersion: 2,
      revision: revision(source.revision),
      enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT.enabled,
      coverage: ["all", "panels"].includes(source.coverage) ? source.coverage : DEFAULT.coverage,
      material: ["glass", "clear"].includes(source.material) ? source.material : DEFAULT.material,
      language: ["auto", "zh", "en"].includes(source.language) ? source.language : DEFAULT.language,
      opacity: boundedNumber(source.opacity, DEFAULT.opacity, 0, 90),
      blur: boundedNumber(source.blur, DEFAULT.blur, 0, 30),
      accent: typeof source.accent === "string" && /^#[\da-f]{6}$/i.test(source.accent)
        ? source.accent.toLowerCase() : DEFAULT.accent
    };
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
    if (typeof dataUrl !== "string" || dataUrl.length > 7_000_000 ||
        !/^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)) {
      throw new Error("INVALID_IMAGE");
    }
    const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
    if (encoded.length % 4 !== 0) throw new Error("BROKEN_IMAGE");
    return {
      revision: revisionNumber, dataUrl,
      name: typeof input.name === "string" ? input.name.slice(0, 120) : "自定义背景",
      width: boundedNumber(input.width, 0, 0, 100_000),
      height: boundedNumber(input.height, 0, 0, 100_000),
      bytes: encoded.length * 3 / 4 - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0)
    };
  }

  function tokens(input) {
    const current = settings(input);
    const glass = current.material === "glass";
    const fill = glass ? current.opacity / 100 : 0;
    return {
      "--bc-surface-alpha": String(fill),
      "--bc-blur": `${glass ? current.blur : 0}px`,
      "--bc-header-alpha": String(glass ? 0.72 : 0),
      "--bc-accent": current.accent
    };
  }

  function createClient(api = chrome) {
    let snapshot = {};
    const listeners = new Set();
    let started = false;

    function accept(incoming) {
      const next = { ...snapshot };
      for (const key of ["settings", "background"]) {
        if (incoming?.[key] && (!next[key] ||
            revision(incoming[key].revision) >= revision(next[key].revision))) next[key] = incoming[key];
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
        if (started) return snapshot;
        started = true;
        api.storage.onChanged.addListener(onStorageChanged);
        try { return await request(MESSAGE.GET); }
        catch (error) { this.dispose(); throw error; }
      },
      patch(changes) { return request(MESSAGE.PATCH, changes); },
      setBackground(input) { return request(MESSAGE.BACKGROUND, input); },
      reset() { return request(MESSAGE.RESET); },
      dispose() { api.storage.onChanged.removeListener(onStorageChanged); started = false; }
    };
  }

  globalThis.BiliTheme = Object.freeze({
    KEYS, MESSAGE, FIELDS, DEFAULT, settings, patchSettings,
    emptyBackground, background, tokens, createClient
  });
})();
