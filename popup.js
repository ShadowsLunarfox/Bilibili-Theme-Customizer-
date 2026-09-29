(() => {
  const BC = globalThis.BiliTheme;
  const copy = {
    zh: {
      appTitle: "哔哩哔哩主题", close: "关闭", enabled: "启用主题", language: "语言",
      background: "桌面背景", previewTitle: "内容面板", previewSample: "主题设置预览",
      chooseImage: "浏览...", removeImage: "移除", imageHint: "图片只保存在本机；动图会转为静态背景。",
      coverage: "应用范围", coverageAll: "全元素", coveragePanels: "内容面板",
      coverageNoteAll: "清除页面底色，导航和内容面板显示毛玻璃。",
      coverageNotePanels: "为导航和内容面板添加玻璃效果。",
      material: "界面效果", glass: "毛玻璃", clear: "透明",
      opacity: "玻璃浓度", blur: "模糊强度", accent: "点缀色", reset: "恢复默认",
      defaultGradient: "默认渐变", customImage: "自定义背景", previousImage: "原有背景",
      previewLabel: "效果预览", paused: "主题已暂停",
      loading: "正在读取设置...", processing: "正在处理...", saving: "正在保存...", saved: "已保存到本机",
      INVALID_SETTINGS: "设置格式无效。", INVALID_IMAGE: "背景图片格式无效或过大。",
      BROKEN_IMAGE: "背景图片数据不完整。", CONNECTION_ERROR: "无法连接扩展，请重新加载。",
      NEWER_VERSION: "设置来自更新版本，请先更新扩展。", SAVE_ERROR: "保存失败，请重试。",
      READ_IMAGE_ERROR: "无法读取图片数据。", UNSUPPORTED_IMAGE: "请选择 PNG、JPG、WebP、GIF 或 AVIF 图片。",
      IMAGE_TOO_LARGE: "请选择 25 MB 以内的图片。", BAD_DIMENSIONS: "图片尺寸无效。",
      PROCESS_IMAGE_ERROR: "浏览器无法处理这张图片。", CONVERT_IMAGE_ERROR: "图片转换失败。",
      IMAGE_ERROR: "图片处理失败，请重试。", LOAD_ERROR: "无法读取扩展设置，请重新加载扩展。"
    },
    en: {
      appTitle: "Bilibili Theme", close: "Close", enabled: "Enable theme", language: "Language",
      background: "Desktop background", previewTitle: "Content panel", previewSample: "Theme preview",
      chooseImage: "Browse...", removeImage: "Remove", imageHint: "Images stay on this device; animations become still images.",
      coverage: "Apply to", coverageAll: "All elements", coveragePanels: "Content panels",
      coverageNoteAll: "Clear page backgrounds and add glass to navigation and panels.",
      coverageNotePanels: "Add glass to navigation and content panels.",
      material: "Appearance", glass: "Frosted glass", clear: "Transparent",
      opacity: "Glass opacity", blur: "Blur strength", accent: "Accent color", reset: "Restore Defaults",
      defaultGradient: "Default gradient", customImage: "Custom background", previousImage: "Previous background",
      previewLabel: "Preview", paused: "Theme paused",
      loading: "Loading settings...", processing: "Processing...", saving: "Saving...", saved: "Saved on this device",
      INVALID_SETTINGS: "The settings format is invalid.", INVALID_IMAGE: "The background image is invalid or too large.",
      BROKEN_IMAGE: "The background image data is incomplete.", CONNECTION_ERROR: "Cannot connect to the extension. Reload it.",
      NEWER_VERSION: "These settings require a newer extension version.", SAVE_ERROR: "Could not save. Please try again.",
      READ_IMAGE_ERROR: "Could not read the image.", UNSUPPORTED_IMAGE: "Choose a PNG, JPG, WebP, GIF, or AVIF image.",
      IMAGE_TOO_LARGE: "Choose an image under 25 MB.", BAD_DIMENSIONS: "The image dimensions are invalid.",
      PROCESS_IMAGE_ERROR: "The browser could not process this image.", CONVERT_IMAGE_ERROR: "Could not convert the image.",
      IMAGE_ERROR: "Could not process the image. Please try again.", LOAD_ERROR: "Could not load settings. Reload the extension."
    }
  };
  const browserLanguage = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  const client = BC.createClient();
  const form = document.querySelector("#settings-form");
  const controls = document.querySelector("#controls");
  const preview = document.querySelector("#preview");
  const status = document.querySelector("#save-status");
  const fileInput = document.querySelector("#image-file");
  const drafts = new Map();
  let ready = false;
  let busy = false;
  let saving = 0;
  let sequence = 0;
  let error = "";
  let lastImage = null;
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
    for (const name of ["coverage", "material", "opacity", "blur", "accent"]) {
      form.elements.namedItem(name).value = settings[name];
    }
    form.elements.namedItem("enabled").checked = settings.enabled;
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
    if (lastImage !== background.dataUrl) {
      preview.style.backgroundImage = background.dataUrl
        ? `url("${background.dataUrl}")` : "linear-gradient(125deg, #c1e4e4, #d1ccf1 55%, #ecdbc8)";
      lastImage = background.dataUrl;
    }
    const tokens = BC.tokens(settings);
    preview.style.setProperty("--preview-alpha", settings.enabled
      ? tokens["--bc-surface-alpha"] : "0.92");
    preview.style.setProperty("--preview-blur", settings.enabled ? tokens["--bc-blur"] : "0px");
    preview.style.setProperty("--preview-accent", settings.accent);
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
    if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) {
      throw new Error("UNSUPPORTED_IMAGE");
    }
    if (file.size > 25 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");
    const source = URL.createObjectURL(file);
    const image = new Image();
    const canvas = document.createElement("canvas");
    try {
      image.src = source;
      await image.decode();
      const { naturalWidth: width, naturalHeight: height } = image;
      if (!width || !height) throw new Error("BAD_DIMENSIONS");
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
      return BC.background({ dataUrl: await asDataUrl(blob), name: file.name,
        width: canvas.width, height: canvas.height });
    } finally {
      URL.revokeObjectURL(source);
      image.src = "";
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  async function imageOperation(work) {
    if (!ready || busy) return;
    busy = true;
    error = "";
    render();
    try { await work(); }
    catch (failure) { error = errorKey(failure, "IMAGE_ERROR"); }
    finally { busy = false; render(); }
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  async function saveField(input) {
    if (!ready || !BC.FIELDS.includes(input.name)) return;
    const value = input.type === "checkbox" ? input.checked
      : input.type === "range" ? Number(input.value) : input.value;
    const token = ++sequence;
    drafts.set(input.name, { value, token });
    saving += 1;
    error = "";
    render();
    try { await client.patch({ [input.name]: value }); }
    catch (failure) { error = errorKey(failure, "SAVE_ERROR"); }
    finally {
      if (drafts.get(input.name)?.token === token) drafts.delete(input.name);
      saving -= 1;
      render();
    }
  }
  form.addEventListener("input", (event) => {
    if (event.target.name !== "language") void saveField(event.target);
  });
  form.addEventListener("change", (event) => {
    if (event.target.name === "language") void saveField(event.target);
  });

  document.querySelector("#choose-image").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (file) void imageOperation(async () => client.setBackground(await prepareBackground(file)));
  });
  document.querySelector("#remove-image").addEventListener("click",
    () => void imageOperation(() => client.setBackground(null)));
  document.querySelector("#reset").addEventListener("click",
    () => void imageOperation(() => client.reset()));
  document.querySelector("#close-popup").addEventListener("click", () => window.close());

  const unsubscribe = client.subscribe(render);
  render();
  client.start().then(() => { ready = true; render(); }).catch((failure) => {
    error = errorKey(failure, "LOAD_ERROR");
    render();
  });
  window.addEventListener("pagehide", () => { unsubscribe(); client.dispose(); }, { once: true });
})();
