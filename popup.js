(() => {
  const BC = globalThis.BiliTheme;
  const copy = {
    zh: {
      appTitle: "哔哩哔哩主题", close: "关闭", enabled: "启用主题", language: "语言",
      background: "桌面背景", previewTitle: "内容面板", previewSample: "主题设置预览",
      chooseImage: "浏览...", removeImage: "移除", imageHint: "支持图片、GIF 和 MP4，最大 20 MB；GIF 与视频保持动态，视频静音循环播放，文件只保存在本机。",
      coverage: "应用范围", coverageAll: "全元素", coveragePanels: "内容面板",
      coverageNoteAll: "清除页面底色，导航和内容面板显示毛玻璃。",
      coverageNotePanels: "为导航和内容面板添加玻璃效果。",
      material: "界面效果", glass: "毛玻璃", clear: "透明",
      opacity: "玻璃浓度", blur: "模糊强度", accent: "点缀色",
      textColor: "网页字体颜色", cleanup: "导航与按钮",
      cleanupHint: "勾选要隐藏的按钮；各项可以独立恢复。", hiddenCount: "已隐藏",
      hideAll: "一键隐藏全部", showAll: "一键显示全部",
      hideGroup: "隐藏本组", showGroup: "显示本组",
      reset: "恢复默认",
      defaultGradient: "默认渐变", customImage: "自定义背景", previousImage: "原有背景",
      previewLabel: "效果预览", paused: "主题已暂停",
      loading: "正在读取设置...", processing: "正在处理...", saving: "正在保存...", saved: "已保存到本机",
      INVALID_SETTINGS: "设置格式无效。", INVALID_IMAGE: "背景文件格式无效或超过 20 MB。",
      RELOAD_EXTENSION: "扩展后台仍是旧版本：请在扩展管理页重新加载插件，再刷新哔哩哔哩网页。",
      BROKEN_IMAGE: "背景图片数据不完整。", CONNECTION_ERROR: "无法连接扩展，请重新加载。",
      NEWER_VERSION: "设置来自更新版本，请先更新扩展。", SAVE_ERROR: "保存失败，请重试。",
      READ_IMAGE_ERROR: "无法读取背景文件。", UNSUPPORTED_IMAGE: "请选择 PNG、JPG、WebP、GIF、AVIF 或 MP4 文件。",
      IMAGE_TOO_LARGE: "文件不能超过 20 MB。", BAD_DIMENSIONS: "背景尺寸无效。", UNSUPPORTED_VIDEO: "无法播放这个 MP4 文件。",
      PROCESS_IMAGE_ERROR: "浏览器无法处理这张图片。", CONVERT_IMAGE_ERROR: "图片转换失败。",
      IMAGE_ERROR: "背景文件处理失败，请重试。", LOAD_ERROR: "无法读取扩展设置，请重新加载扩展。"
    },
    en: {
      appTitle: "Bilibili Theme", close: "Close", enabled: "Enable theme", language: "Language",
      background: "Desktop background", previewTitle: "Content panel", previewSample: "Theme preview",
      chooseImage: "Browse...", removeImage: "Remove", imageHint: "Images, GIF and MP4 up to 20 MB. GIFs and videos stay animated; videos loop silently. Files stay on this device.",
      coverage: "Apply to", coverageAll: "All elements", coveragePanels: "Content panels",
      coverageNoteAll: "Clear page backgrounds and add glass to navigation and panels.",
      coverageNotePanels: "Add glass to navigation and content panels.",
      material: "Appearance", glass: "Frosted glass", clear: "Transparent",
      opacity: "Glass opacity", blur: "Blur strength", accent: "Accent color",
      textColor: "Page text color", cleanup: "Navigation and buttons",
      cleanupHint: "Check buttons to hide; restore each one independently.", hiddenCount: "hidden",
      hideAll: "Hide all", showAll: "Show all",
      hideGroup: "Hide group", showGroup: "Show group",
      reset: "Restore Defaults",
      defaultGradient: "Default gradient", customImage: "Custom background", previousImage: "Previous background",
      previewLabel: "Preview", paused: "Theme paused",
      loading: "Loading settings...", processing: "Processing...", saving: "Saving...", saved: "Saved on this device",
      INVALID_SETTINGS: "The settings format is invalid.", INVALID_IMAGE: "The background file is invalid or exceeds 20 MB.",
      RELOAD_EXTENSION: "The extension background is outdated. Reload the extension, then refresh Bilibili.",
      BROKEN_IMAGE: "The background image data is incomplete.", CONNECTION_ERROR: "Cannot connect to the extension. Reload it.",
      NEWER_VERSION: "These settings require a newer extension version.", SAVE_ERROR: "Could not save. Please try again.",
      READ_IMAGE_ERROR: "Could not read the background file.", UNSUPPORTED_IMAGE: "Choose a PNG, JPG, WebP, GIF, AVIF, or MP4 file.",
      IMAGE_TOO_LARGE: "Files cannot exceed 20 MB.", BAD_DIMENSIONS: "The background dimensions are invalid.", UNSUPPORTED_VIDEO: "This MP4 cannot be played.",
      PROCESS_IMAGE_ERROR: "The browser could not process this image.", CONVERT_IMAGE_ERROR: "Could not convert the image.",
      IMAGE_ERROR: "Could not process the background file. Please try again.", LOAD_ERROR: "Could not load settings. Reload the extension."
    }
  };
  const browserLanguage = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  const client = BC.createClient();
  const navigationKeys = new Set(BC.NAV_ITEMS.map((entry) => entry.key));
  const form = document.querySelector("#settings-form");
  const controls = document.querySelector("#controls");
  const preview = document.querySelector("#preview");
  const previewVideo = document.querySelector("#preview-video");
  previewVideo.muted = true;
  const status = document.querySelector("#save-status");
  const fileInput = document.querySelector("#image-file");
  document.querySelector("#version").textContent = chrome.runtime.getManifest().version;
  const navigationGroups = BC.NAV_GROUPS.map((group) => {
    const container = document.createElement("div");
    container.className = "nav-group";
    const heading = document.createElement("div");
    heading.className = "nav-group-heading";
    const toggle = document.createElement("button");
    toggle.className = "nav-group-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    const title = document.createElement("span");
    const count = document.createElement("small");
    count.className = "nav-group-count";
    const bulk = document.createElement("button");
    bulk.className = "nav-group-bulk";
    bulk.type = "button";
    toggle.append(title);
    heading.append(toggle, count, bulk);
    const options = document.createElement("div");
    options.className = "nav-options";
    options.id = `nav-options-${group.key}`;
    options.hidden = true;
    toggle.setAttribute("aria-controls", options.id);
    const labels = group.items.map((entry) => {
      const label = document.createElement("label");
      label.className = "option-row";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = entry.key;
      const text = document.createElement("span");
      label.append(input, text);
      options.append(label);
      return { entry, text };
    });
    toggle.addEventListener("click", () => {
      options.hidden = !options.hidden;
      toggle.setAttribute("aria-expanded", String(!options.hidden));
    });
    bulk.addEventListener("click", () => {
      const allHidden = group.items.every((entry) => form.elements.namedItem(entry.key).checked);
      void saveNavigationItems(group.items, !allHidden);
    });
    container.append(heading, options);
    document.querySelector("#navigation-groups").append(container);
    return { group, title, count, bulk, labels };
  });
  const drafts = new Map();
  let ready = false;
  let busy = false;
  let saving = 0;
  let sequence = 0;
  let error = "";
  let lastBackgroundUrl = null;
  let locale = browserLanguage;

  function t(key) { return copy[locale][key] || copy[locale].SAVE_ERROR; }

  function languageOf(setting) { return setting === "auto" ? browserLanguage : setting === "zh" ? "zh" : "en"; }

  function applyLanguage() {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = t("appTitle");
    for (const element of document.querySelectorAll("[data-i18n]")) element.textContent = t(element.dataset.i18n);
    for (const element of document.querySelectorAll("[data-i18n-aria]")) {
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    }
    for (const view of navigationGroups) {
      view.title.textContent = view.group[locale];
      for (const label of view.labels) label.text.textContent = label.entry[locale];
    }
  }

  function errorKey(failure, fallback) {
    const key = failure?.message;
    return Object.hasOwn(copy.zh, key) ? key : fallback;
  }

  function render() {
    const settings = { ...(client.snapshot.settings || BC.DEFAULT) };
    for (const [name, draft] of drafts) settings[name] = draft.value;
    const background = client.snapshot.background || BC.emptyBackground();
    locale = languageOf(settings.language);
    applyLanguage();
    controls.disabled = !ready || busy;
    form.elements.namedItem("language").value = locale;
    for (const name of ["coverage", "material", "opacity", "blur", "accent", "textColor"]) {
      form.elements.namedItem(name).value = settings[name];
    }
    form.elements.namedItem("enabled").checked = settings.enabled;
    let totalHidden = 0;
    for (const view of navigationGroups) {
      let hidden = 0;
      for (const { entry } of view.labels) {
        form.elements.namedItem(entry.key).checked = settings[entry.key];
        if (settings[entry.key]) hidden += 1;
      }
      view.count.textContent = locale === "zh" ? `${t("hiddenCount")} ${hidden}/${view.labels.length}`
        : `${hidden}/${view.labels.length} ${t("hiddenCount")}`;
      view.bulk.textContent = t(hidden === view.labels.length ? "showGroup" : "hideGroup");
      totalHidden += hidden;
    }
    document.querySelector("#hide-all-nav").disabled = totalHidden === BC.NAV_ITEMS.length;
    document.querySelector("#show-all-nav").disabled = totalHidden === 0;
    const glass = settings.material === "glass";
    for (const name of ["opacity", "blur"]) {
      const control = form.elements.namedItem(name);
      control.disabled = !glass;
      control.closest(".range-row").classList.toggle("muted", !glass);
    }
    document.querySelector("#opacity-value").value = `${settings.opacity}%`;
    document.querySelector("#blur-value").value = `${settings.blur} px`;
    document.querySelector("#remove-image").disabled = !background.dataUrl;
    document.querySelector("#reset").disabled = saving > 0;
    document.querySelector("#coverage-note").textContent = t(settings.coverage === "all"
      ? "coverageNoteAll" : "coverageNotePanels");
    document.querySelector("#image-name").textContent = !background.dataUrl ? t("defaultGradient")
      : background.name === "原有背景" ? t("previousImage")
      : !background.name || background.name === "自定义背景" ? t("customImage") : background.name;
    if (lastBackgroundUrl !== background.dataUrl) {
      const video = background.dataUrl.startsWith("data:video/mp4;base64,");
      preview.style.backgroundImage = background.dataUrl && !video
        ? `url("${background.dataUrl}")` : "linear-gradient(125deg, #c1e4e4, #d1ccf1 55%, #ecdbc8)";
      previewVideo.hidden = !video;
      if (video) {
        previewVideo.src = background.dataUrl;
        void previewVideo.play().catch(() => {});
      } else if (previewVideo.hasAttribute("src")) {
        previewVideo.pause();
        previewVideo.removeAttribute("src");
        previewVideo.load();
      }
      lastBackgroundUrl = background.dataUrl;
    }
    const tokens = BC.tokens(settings);
    preview.style.setProperty("--preview-alpha", settings.enabled
      ? tokens["--bc-surface-alpha"] : "0.92");
    preview.style.setProperty("--preview-blur", settings.enabled ? tokens["--bc-blur"] : "0px");
    preview.style.setProperty("--preview-accent", settings.accent);
    preview.style.setProperty("--preview-text-color", settings.textColor);
    preview.style.setProperty("--preview-text-shadow", tokens["--bc-text-shadow"]);
    document.querySelector("#preview-label").textContent = t(settings.enabled ? "previewLabel" : "paused");
    status.classList.toggle("error", Boolean(error));
    status.textContent = t(error || (!ready ? "loading" : busy
      ? "processing" : saving ? "saving" : "saved"));
  }

  function asDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("READ_IMAGE_ERROR"));
      reader.readAsDataURL(blob);
    });
  }

  async function prepareBackground(file) {
    const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
    const fallbackTypes = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      webp: "image/webp", gif: "image/gif", avif: "image/avif", mp4: "video/mp4" };
    const type = file.type && file.type !== "application/octet-stream"
      ? file.type : fallbackTypes[extension];
    if (!/^(?:image\/(?:png|jpeg|webp|gif|avif)|video\/mp4)$/.test(type || "")) {
      throw new Error("UNSUPPORTED_IMAGE");
    }
    if (file.size > BC.MAX_BACKGROUND_BYTES) throw new Error("IMAGE_TOO_LARGE");
    const media = file.type === type ? file : new Blob([file], { type });
    const source = URL.createObjectURL(media);
    if (type === "video/mp4") {
      const video = document.createElement("video");
      try {
        video.preload = "auto";
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("UNSUPPORTED_VIDEO")), 15000);
          video.onloadeddata = () => { clearTimeout(timeout); resolve(); };
          video.onerror = () => { clearTimeout(timeout); reject(new Error("UNSUPPORTED_VIDEO")); };
          video.src = source;
        });
        if (!video.videoWidth || !video.videoHeight) throw new Error("BAD_DIMENSIONS");
        return BC.background({ dataUrl: await asDataUrl(media), name: file.name,
          width: video.videoWidth, height: video.videoHeight });
      } finally {
        video.removeAttribute("src");
        video.load();
        URL.revokeObjectURL(source);
      }
    }
    const image = new Image();
    const canvas = document.createElement("canvas");
    try {
      image.src = source;
      await image.decode();
      const { naturalWidth: width, naturalHeight: height } = image;
      if (!width || !height) throw new Error("BAD_DIMENSIONS");
      if (type === "image/gif") {
        return BC.background({ dataUrl: await asDataUrl(media), name: file.name, width, height });
      }
      const scale = Math.min(1, 2560 / width, 2560 / height,
        Math.sqrt(4_000_000 / (width * height)));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("PROCESS_IMAGE_ERROR");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error("CONVERT_IMAGE_ERROR")),
        "image/webp", 0.86
      ));
      const output = blob.size <= BC.MAX_BACKGROUND_BYTES ? blob : media;
      return BC.background({ dataUrl: await asDataUrl(output), name: file.name,
        width: output === blob ? canvas.width : width,
        height: output === blob ? canvas.height : height });
    } finally {
      URL.revokeObjectURL(source);
      image.src = "";
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  async function backgroundOperation(work) {
    if (!ready || busy) return;
    busy = true;
    error = "";
    render();
    try { await work(); }
    catch (failure) { error = errorKey(failure, "IMAGE_ERROR"); }
    finally { busy = false; render(); }
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  async function saveFields(changes) {
    if (!ready || busy) return;
    const token = ++sequence;
    for (const [name, value] of Object.entries(changes)) drafts.set(name, { value, token });
    saving += 1;
    error = "";
    render();
    try {
      const updated = await client.patch(changes);
      if (Object.entries(changes).some(([name, value]) =>
        navigationKeys.has(name) && updated.settings?.[name] !== value)) {
        throw new Error("RELOAD_EXTENSION");
      }
    }
    catch (failure) { error = errorKey(failure, "SAVE_ERROR"); }
    finally {
      for (const name of Object.keys(changes)) {
        if (drafts.get(name)?.token === token) drafts.delete(name);
      }
      saving -= 1;
      render();
    }
  }
  function saveField(input) {
    if (!BC.FIELDS.includes(input.name)) return;
    const value = input.type === "checkbox" ? input.checked
      : input.type === "range" ? Number(input.value) : input.value;
    void saveFields({ [input.name]: value });
  }
  function saveNavigationItems(items, hide) {
    return saveFields(Object.fromEntries(items.map((entry) => [entry.key, hide])));
  }
  form.addEventListener("input", (event) => {
    if (event.target.name !== "language") void saveField(event.target);
  });
  form.addEventListener("change", (event) => {
    if (event.target.name === "language") void saveField(event.target);
  });
  document.querySelector("#hide-all-nav").addEventListener("click",
    () => void saveNavigationItems(BC.NAV_ITEMS, true));
  document.querySelector("#show-all-nav").addEventListener("click",
    () => void saveNavigationItems(BC.NAV_ITEMS, false));

  document.querySelector("#choose-image").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (file) void backgroundOperation(async () => client.setBackground(await prepareBackground(file)));
  });
  document.querySelector("#remove-image").addEventListener("click",
    () => void backgroundOperation(() => client.setBackground(null)));
  document.querySelector("#reset").addEventListener("click",
    () => void backgroundOperation(() => client.reset()));
  document.querySelector("#close-popup").addEventListener("click", () => window.close());

  const unsubscribe = client.subscribe(render);
  render();
  client.start().then((snapshot) => {
    ready = true;
    if (BC.NAV_ITEMS.some((entry) => !Object.hasOwn(snapshot.settings || {}, entry.key))) {
      error = "RELOAD_EXTENSION";
    }
    render();
  }).catch((failure) => {
    error = errorKey(failure, "LOAD_ERROR");
    render();
  });
  window.addEventListener("pagehide", () => { unsubscribe(); client.dispose(); }, { once: true });
})();
