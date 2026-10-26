(async () => {
  if (!document.documentElement) {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }
  const BC = globalThis.BiliTheme;
  const root = document.documentElement;
  const client = BC.createClient();
  const fallback = "linear-gradient(135deg, #101927, #1c263a 48%, #102c35)";
  const pageTheme = globalThis.BiliThemePage;
  const minimalist = globalThis.BiliThemeMinimalist;
  const active = () => current?.enabled || current?.minimalistEnabled;
  const layoutMarkers = `${pageTheme.layoutSelector}, .bili-header__bar, .header-channel`;
  const navigationHideRules = BC.NAV_ITEMS.map((entry) =>
    `html[data-bc-enabled="true"][data-bc-hidden~="${entry.key}"] body :is(${entry.selector}) { display: none !important; }`
  ).join("\n");
  const channelGroups = [
    { token: "icons", key: "channelIcons" },
    { token: "categories", key: "channelCategories" },
    { token: "shortcuts", key: "channelShortcuts" }
  ].map(({ token, key }) => ({ token, items: BC.NAV_GROUPS.find((group) => group.key === key).items }));
  const style = document.createElement("style");
  style.dataset.bcOwned = "style";
  style.textContent = pageTheme.css + minimalist.css + `
    /* The shared navigation catalog gives every visible entry its own switch. */
    ${navigationHideRules}
    /* Remove each empty group and the entire channel row when nothing is left. */
    html[data-bc-enabled="true"][data-bc-channel-layout~="icons"] body :is(
      .bili-header__channel .channel-icons, .header-channel .header-channel-fixed-left
    ),
    html[data-bc-enabled="true"][data-bc-channel-layout~="categories"] body :is(
      .bili-header__channel .channel-items__left,
      .header-channel .header-channel-fixed-list,
      .header-channel .header-channel-fixed-bottom-list,
      .header-channel .header-channel-fixed-arrow
    ),
    html[data-bc-enabled="true"][data-bc-channel-layout~="shortcuts"] body :is(
      .bili-header__channel .channel-items__right,
      .header-channel .header-channel-fixed-side-list
    ),
    html[data-bc-enabled="true"][data-bc-channel-layout~="all"] body :is(
      .bili-header__channel, .header-channel
    ) { display: none !important; }
    html[data-bc-enabled="true"][data-bc-channel-layout~="shortcuts"] body
    .bili-header__channel .channel-items__left { margin-right: 0 !important; }
    html[data-bc-enabled="true"][data-bc-channel-layout~="shortcuts"] body
    .header-channel .header-channel-fixed-list { grid-column: 1 / -1 !important; }
    html[data-bc-enabled="true"][data-bc-channel-layout~="categories"] body
    .header-channel .header-channel-fixed-side-list { grid-column: 1 / -1 !important; }
  `;
  const shadowStyleText = pageTheme.shadowCSS;
  const wallpaper = document.createElement("div");
  wallpaper.id = "bc-theme-wallpaper";
  wallpaper.dataset.bcOwned = "wallpaper";
  wallpaper.setAttribute("aria-hidden", "true");
  const wallpaperVideo = document.createElement("video");
  wallpaperVideo.id = "bc-theme-video";
  wallpaperVideo.dataset.bcOwned = "video";
  wallpaperVideo.setAttribute("aria-hidden", "true");
  wallpaperVideo.autoplay = true;
  wallpaperVideo.loop = true;
  wallpaperVideo.muted = true;
  wallpaperVideo.playsInline = true;
  wallpaperVideo.style.cssText = "display:none;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none";
  wallpaper.attachShadow({ mode: "closed" }).append(wallpaperVideo);
  const headerGlass = document.createElement("div");
  headerGlass.id = "bc-theme-header-glass";
  headerGlass.dataset.bcOwned = "header-glass";
  headerGlass.setAttribute("aria-hidden", "true");
  const channelGlass = document.createElement("div");
  channelGlass.id = "bc-theme-channel-glass";
  channelGlass.dataset.bcOwned = "channel-glass";
  channelGlass.setAttribute("aria-hidden", "true");
  const popoverGlasses = new Map();
  let watchedHeaderBar;
  let watchedChannel;
  let glassFrame = 0;
  /* Popovers are toggled by Bilibili after a hover delay. Place their blur
     in the same microtask as the style change so no clear frame is painted. */
  const headerObserver = new MutationObserver(syncHeaderGlass);
  const channelObserver = new MutationObserver(syncHeaderGlass);
  const channelResizeObserver = new ResizeObserver(syncHeaderGlass);
  const popoverResizeObserver = new ResizeObserver(scheduleHeaderGlass);
  let current;
  let savedAttributes;
  let savedProperties;
  let backgroundRecord;
  let backgroundImage = fallback;
  let wallpaperVideoUrl;
  let observedBody;
  let commentsStarted = false;
  let commentTimer;
  let commentRetries = 0;
  let pageFrame = 0;
  let pageDirty = true;
  let lastURL = "";
  const layoutObserver = new MutationObserver(() => schedulePageSync(true));
  const commentStyles = new Map();
  const pendingCommentHosts = new Set();
  const pendingCommentResize = new ResizeObserver((entries) => {
    for (const { target } of entries) {
      if (!target.isConnected) { pendingCommentHosts.delete(target); pendingCommentResize.unobserve(target); }
      else if (current?.enabled && target.shadowRoot) inspectCommentHost(target);
    }
  });
  const commentHosts = `bili-comments, bili-comment-thread-renderer, bili-comment-renderer,
    bili-comment-reply-renderer, bili-comment-textarea, bili-textarea, bili-rich-text,
    bili-text-button, bili-comment-user-info, bili-comment-action-buttons-renderer,
    bili-comment-list-renderer`;
  const attributes = [
    "data-bc-enabled", "data-bc-coverage", "data-bc-material",
    "data-bc-hidden", "data-bc-channel-layout", "data-bc-page",
    "data-bc-minimalist", "data-bc-min-options", "data-bc-min-categories"
  ];

  function syncWallpaperPlayback() {
    if (current?.enabled && wallpaper.isConnected && !document.hidden &&
        wallpaper.dataset.bcVideo === "true") {
      wallpaperVideo.muted = true;
      void wallpaperVideo.play().catch(() => {});
    } else {
      wallpaperVideo.pause();
    }
  }

  function clearWallpaperVideo() {
    wallpaperVideo.pause();
    if (wallpaperVideo.hasAttribute("src")) {
      wallpaperVideo.removeAttribute("src");
      wallpaperVideo.load();
    }
    if (wallpaperVideoUrl) URL.revokeObjectURL(wallpaperVideoUrl);
    wallpaperVideoUrl = undefined;
  }

  function setWallpaperMedia(image) {
    clearWallpaperVideo();
    const video = image.dataUrl.startsWith("data:video/mp4;base64,");
    wallpaper.dataset.bcVideo = String(video);
    wallpaper.dataset.bcCustom = String(Boolean(image.dataUrl));
    wallpaperVideo.style.display = video ? "block" : "none";
    backgroundImage = video ? fallback : image.dataUrl
      ? `url("${image.dataUrl}"), ${fallback}` : `var(--bc-min-empty-wallpaper, ${fallback})`;
    wallpaper.style.setProperty("background-image", backgroundImage, "important");
    if (!video) return;
    const encoded = image.dataUrl.slice(image.dataUrl.indexOf(",") + 1);
    const chunks = [];
    for (let offset = 0; offset < encoded.length; offset += 262_144) {
      const decoded = atob(encoded.slice(offset, offset + 262_144));
      const bytes = new Uint8Array(decoded.length);
      for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
      chunks.push(bytes);
    }
    wallpaperVideoUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
    wallpaperVideo.src = wallpaperVideoUrl;
    syncWallpaperPlayback();
  }

  function placeGlass(layer, rect, zIndex, radius = "0px") {
    layer.style.setProperty("display", "block", "important");
    layer.style.setProperty("left", `${rect.left}px`, "important");
    layer.style.setProperty("top", `${rect.top}px`, "important");
    layer.style.setProperty("width", `${rect.width}px`, "important");
    layer.style.setProperty("height", `${rect.height}px`, "important");
    layer.style.setProperty("z-index", `${zIndex}`, "important");
    layer.style.setProperty("border-radius", radius, "important");
  }

  function syncHeaderGlass() {
    if (glassFrame) cancelAnimationFrame(glassFrame);
    glassFrame = 0;
    if (!current?.enabled || current.material !== "glass" || !document.body) return;
    const channel = document.querySelector(".header-channel");
    if (channel !== watchedChannel) {
      channelObserver.disconnect();
      channelResizeObserver.disconnect();
      watchedChannel = channel;
      if (channel) channelObserver.observe(channel, {
        attributes: true, attributeFilter: ["class", "style"], childList: true, subtree: true
      });
      if (channel) channelResizeObserver.observe(channel);
      if (channel?.parentElement) channelObserver.observe(channel.parentElement, { childList: true });
    }
    const channelRect = channel?.getBoundingClientRect();
    const channelStyle = channel ? getComputedStyle(channel) : null;
    if (channelRect?.width && channelRect.height && channelRect.bottom > 0 &&
        channelRect.top < innerHeight && channelStyle.visibility === "visible" && Number(channelStyle.opacity) !== 0) {
      const channelZ = (parseInt(channelStyle.zIndex, 10) || 1001) - 1;
      if (!channelGlass.isConnected) document.body.append(channelGlass);
      placeGlass(channelGlass, channelRect, channelZ, channelStyle.borderRadius);
    } else {
      channelGlass.remove();
    }
    const bar = document.querySelector(".bili-header__bar");
    if (bar !== watchedHeaderBar) {
      headerObserver.disconnect();
      watchedHeaderBar = bar;
      if (bar) headerObserver.observe(bar, {
        attributes: true, attributeFilter: ["class", "style"], childList: true, subtree: true
      });
      if (bar?.parentElement) headerObserver.observe(bar.parentElement, { childList: true });
    }
    const rect = bar?.getBoundingClientRect();
    const barStyle = bar ? getComputedStyle(bar) : null;
    if (!rect || !rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight ||
        barStyle.visibility !== "visible" || Number(barStyle.opacity) === 0) {
      headerGlass.style.setProperty("display", "none", "important");
      for (const glass of popoverGlasses.values()) glass.remove();
      popoverGlasses.clear();
      popoverResizeObserver.disconnect();
      return;
    }
    const zIndex = (parseInt(barStyle.zIndex, 10) || 1002) - 1;
    if (!headerGlass.isConnected) document.body.append(headerGlass);
    placeGlass(headerGlass, rect, zIndex, barStyle.borderRadius);

    const visible = new Set();
    for (const panel of bar.querySelectorAll(".v-popover-content, .nav-search-panel")) {
      if (panel.parentElement.closest(".v-popover-content, .nav-search-panel")) continue;
      const panelRect = panel.getBoundingClientRect();
      const panelStyle = getComputedStyle(panel);
      if (!panelRect.width || !panelRect.height || panelRect.bottom <= 0 ||
          panelRect.top >= innerHeight || panelStyle.visibility !== "visible" ||
          Number(panelStyle.opacity) === 0) continue;
      let ancestor = panel.parentElement;
      while (ancestor && ancestor !== bar && Number(getComputedStyle(ancestor).opacity) !== 0) ancestor = ancestor.parentElement;
      if (ancestor && ancestor !== bar) continue;
      visible.add(panel);
      let glass = popoverGlasses.get(panel);
      if (!glass) {
        glass = document.createElement("div");
        glass.className = "bc-theme-popover-glass";
        glass.dataset.bcOwned = "popover-glass";
        glass.setAttribute("aria-hidden", "true");
        document.body.append(glass);
        popoverGlasses.set(panel, glass);
        popoverResizeObserver.observe(panel);
      }
      placeGlass(glass, panelRect, zIndex, panelStyle.borderRadius);
    }
    for (const [panel, glass] of popoverGlasses) {
      if (visible.has(panel)) continue;
      glass.remove();
      popoverGlasses.delete(panel);
      popoverResizeObserver.unobserve(panel);
    }
  }

  function scheduleHeaderGlass() {
    if (!glassFrame) glassFrame = requestAnimationFrame(syncHeaderGlass);
  }

  function onHeaderPointer(event) {
    if (event.target.closest?.(".bili-header__bar")) scheduleHeaderGlass();
  }

  function startHeaderGlass() {
    if (current.material !== "glass") { stopHeaderGlass(); return; }
    window.addEventListener("scroll", scheduleHeaderGlass, { passive: true });
    window.addEventListener("resize", scheduleHeaderGlass);
    document.addEventListener("pointerover", onHeaderPointer, true);
    document.addEventListener("pointerout", onHeaderPointer, true);
    scheduleHeaderGlass();
  }

  function stopHeaderGlass() {
    if (glassFrame) cancelAnimationFrame(glassFrame);
    glassFrame = 0;
    headerObserver.disconnect();
    channelObserver.disconnect();
    channelResizeObserver.disconnect();
    popoverResizeObserver.disconnect();
    watchedHeaderBar = null;
    watchedChannel = null;
    window.removeEventListener("scroll", scheduleHeaderGlass);
    window.removeEventListener("resize", scheduleHeaderGlass);
    document.removeEventListener("pointerover", onHeaderPointer, true);
    document.removeEventListener("pointerout", onHeaderPointer, true);
    headerGlass.remove();
    channelGlass.remove();
    for (const glass of popoverGlasses.values()) glass.remove();
    popoverGlasses.clear();
  }

  const commentObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) scanCommentNode(node);
    }
    schedulePageSync();
  });

  function inspectCommentHost(host) {
    if (!host.localName?.startsWith("bili-")) return;
    const shadow = host.shadowRoot;
    if (!shadow) {
      if (/^bili-comments?|^bili-text-button$|^bili-rich-text$/.test(host.localName)) {
        if (!pendingCommentHosts.has(host)) {
          pendingCommentHosts.add(host);
          pendingCommentResize.observe(host);
          commentRetries = 0;
          customElements.whenDefined(host.localName).then(() => {
            if (current?.enabled && host.isConnected) inspectCommentHost(host);
          });
        }
        scheduleCommentRetry();
      }
      return;
    }
    pendingCommentHosts.delete(host);
    pendingCommentResize.unobserve(host);
    if (commentStyles.has(shadow)) return;
    const shadowStyle = document.createElement("style");
    shadowStyle.dataset.bcOwned = "comment-style";
    shadowStyle.textContent = shadowStyleText;
    shadow.append(shadowStyle);
    commentStyles.set(shadow, shadowStyle);
    commentObserver.observe(shadow, { childList: true, subtree: true });
    scanCommentNode(shadow);
  }

  function scanCommentNode(node) {
    if (!node) return;
    if (node.nodeType === Node.ELEMENT_NODE) inspectCommentHost(node);
    if (!node.querySelectorAll) return;
    for (const element of node.querySelectorAll(commentHosts)) inspectCommentHost(element);
  }

  function clearCommentStyles() {
    commentObserver.disconnect();
    for (const shadowStyle of commentStyles.values()) shadowStyle.remove();
    commentStyles.clear();
    pendingCommentHosts.clear();
    pendingCommentResize.disconnect();
  }

  function syncCommentScope() {
    if (!current?.enabled) return;
    for (const host of pendingCommentHosts) {
      if (!host.isConnected) { pendingCommentHosts.delete(host); pendingCommentResize.unobserve(host); }
      else if (host.shadowRoot) inspectCommentHost(host);
    }
    let removedRoot = false;
    for (const [shadow, shadowStyle] of commentStyles) {
      if (shadow.host.isConnected) continue;
      shadowStyle.remove();
      commentStyles.delete(shadow);
      removedRoot = true;
    }
    if (removedRoot) {
      commentObserver.disconnect();
      for (const shadow of commentStyles.keys()) {
        commentObserver.observe(shadow, { childList: true, subtree: true });
      }
    }
  }

  function scheduleCommentRetry() {
    if (commentTimer || !pendingCommentHosts.size || commentRetries >= 8) return;
    commentTimer = setTimeout(() => {
      commentTimer = null;
      commentRetries += 1;
      syncCommentScope();
      scheduleCommentRetry();
    }, Math.min(2000, 100 * 2 ** commentRetries));
  }

  function startCommentWatch() {
    if (!commentsStarted) { commentsStarted = true; scanCommentNode(document.body); }
    syncCommentScope();
  }

  function stopCommentWatch() {
    if (commentTimer) clearTimeout(commentTimer);
    commentTimer = null;
    commentRetries = 0;
    commentsStarted = false;
    clearCommentStyles();
  }

  function syncPage() {
    pageFrame = 0;
    if (!active()) return;
    if (pageDirty || lastURL !== location.href || !root.hasAttribute("data-bc-page")) {
      lastURL = location.href;
      const name = pageTheme.classify(lastURL, (selector) => Boolean(document.querySelector(selector)));
      if (root.getAttribute("data-bc-page") !== name) root.setAttribute("data-bc-page", name);
      layoutObserver.disconnect();
      const layout = pageTheme.profiles[name].layout;
      for (const node of new Set([document.querySelector("#app, #i_cecream"),
        layout ? document.querySelector(layout) : null].filter(Boolean))) {
        layoutObserver.observe(node, { attributes: true, attributeFilter: ["class"] });
      }
      pageDirty = false;
    }
    if (current.minimalistEnabled && minimalist.isHome(location.href, root.getAttribute("data-bc-page"))) {
      if (root.getAttribute("data-bc-minimalist") !== "true") root.setAttribute("data-bc-minimalist", "true");
    } else if (root.hasAttribute("data-bc-minimalist")) root.removeAttribute("data-bc-minimalist");
    syncCommentScope();
  }

  function schedulePageSync(layoutChanged = false) {
    if (layoutChanged === true) pageDirty = true;
    if (active() && !pageFrame) pageFrame = requestAnimationFrame(syncPage);
  }

  const observer = new MutationObserver((records) => {
    if (active() && ((current.enabled && wallpaper.parentElement !== document.body) ||
        !style.isConnected || observedBody !== document.body)) mount();
    if (!active()) return;
    if (lastURL !== location.href || commentStyles.size || pendingCommentHosts.size) schedulePageSync();
    for (const record of records) {
      for (const node of [...record.addedNodes, ...record.removedNodes]) {
        if (node.nodeType !== Node.ELEMENT_NODE || node.hasAttribute("data-bc-owned")) continue;
        const layoutChanged = node.matches(layoutMarkers) || node.querySelector(layoutMarkers);
        if (layoutChanged) { schedulePageSync(true); if (current.material === "glass") scheduleHeaderGlass(); }
        if (current.enabled && node.isConnected) scanCommentNode(node);
      }
    }
  });

  function mount() {
    if (!style.isConnected) (document.head || root).append(style);
    if (current.enabled && document.body && wallpaper.parentElement !== document.body) {
      wallpaper.style.setProperty("background-image", backgroundImage, "important");
      document.body.prepend(wallpaper);
    }
    observer.disconnect();
    for (const container of new Set([root, document.head, document.body].filter(Boolean))) {
      observer.observe(container, { childList: true, subtree: container === document.body });
    }
    if (observedBody !== document.body) pageDirty = true;
    observedBody = document.body;
    syncWallpaperPlayback();
    syncPage();
    if (current?.material === "glass") scheduleHeaderGlass();
  }

  function unmount() {
    observer.disconnect();
    layoutObserver.disconnect();
    pageDirty = true;
    if (pageFrame) cancelAnimationFrame(pageFrame);
    pageFrame = 0;
    clearWallpaperVideo();
    backgroundRecord = undefined;
    stopHeaderGlass();
    stopCommentWatch();
    wallpaper.remove();
    style.remove();
    if (savedAttributes) {
      for (const [name, value] of savedAttributes) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
      for (const [name, { value, priority }] of savedProperties) {
        if (value) root.style.setProperty(name, value, priority);
        else root.style.removeProperty(name);
      }
    }
    savedAttributes = null;
    savedProperties = null;
  }

  function apply(snapshot) {
    current = BC.settings(snapshot.settings);
    if (!active()) { unmount(); return; }
    if (!current.enabled) {
      clearWallpaperVideo();
      backgroundRecord = undefined;
      wallpaper.remove();
      stopHeaderGlass();
      stopCommentWatch();
    }
    const tokens = BC.tokens(current);
    if (!savedAttributes) {
      savedAttributes = new Map(attributes.map((name) => [name, root.getAttribute(name)]));
      savedProperties = new Map(Object.keys(tokens).map((name) => [name, {
        value: root.style.getPropertyValue(name),
        priority: root.style.getPropertyPriority(name)
      }]));
    }
    if (current.enabled && backgroundRecord !== snapshot.background) {
      const image = BC.background(snapshot.background);
      backgroundRecord = snapshot.background;
      setWallpaperMedia(image);
    }
    if (current.enabled) root.setAttribute("data-bc-enabled", "true");
    else root.removeAttribute("data-bc-enabled");
    root.setAttribute("data-bc-min-options", minimalist.flags(current));
    root.setAttribute("data-bc-min-categories", BC.MINIMALIST_CATEGORIES
      .filter(entry => current[entry.field]).map(entry => entry.key).join(" "));
    root.setAttribute("data-bc-coverage", current.coverage);
    root.setAttribute("data-bc-material", current.material);
    root.setAttribute("data-bc-hidden", BC.NAV_ITEMS.filter((entry) => current[entry.key])
      .map((entry) => entry.key).join(" "));
    const collapsedChannelGroups = channelGroups.filter((group) =>
      group.items.every((entry) => current[entry.key])).map((group) => group.token);
    if (collapsedChannelGroups.length === channelGroups.length) collapsedChannelGroups.push("all");
    root.setAttribute("data-bc-channel-layout", collapsedChannelGroups.join(" "));
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value, "important");
    mount();
    if (current.enabled) { startHeaderGlass(); startCommentWatch(); }
  }

  const unsubscribe = client.subscribe((snapshot) => {
    try { apply(snapshot); }
    catch (error) { unmount(); console.error("[B哩B哩主题 / Bilibili Theme Customizer] 无法应用主题", error); }
  });
  client.start().catch((error) => console.error("[B哩B哩主题 / Bilibili Theme Customizer] 无法读取设置", error));
  document.addEventListener("visibilitychange", syncWallpaperPlayback);
  window.addEventListener("popstate", schedulePageSync);
  window.addEventListener("hashchange", schedulePageSync);
  window.navigation?.addEventListener("currententrychange", schedulePageSync);
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) return;
    unsubscribe();
    client.dispose();
    document.removeEventListener("visibilitychange", syncWallpaperPlayback);
    window.removeEventListener("popstate", schedulePageSync);
    window.removeEventListener("hashchange", schedulePageSync);
    window.navigation?.removeEventListener("currententrychange", schedulePageSync);
    unmount();
  });
})();
