(async () => {
  if (!document.documentElement) {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }
  const BC = globalThis.BiliTheme;
  const root = document.documentElement;
  const client = BC.createClient();
  const fallback = "linear-gradient(135deg, var(--bc-wallpaper-start, #244958), var(--bc-wallpaper-mid, #56416d) 48%, var(--bc-wallpaper-end, #1d5965))";
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
  const surfaceGlasses = new Map();
  let surfaceCandidates = new Map();
  let surfaceVisibility = new WeakMap();
  let surfacesDirty = true;
  const categoryPaintSelectors='.channel-icons,.channel-items__left,.channel-items__right,.header-channel-fixed-left,.header-channel-fixed-list,.header-channel-fixed-bottom-list,.header-channel-fixed-side-list';
  const surfaceIntersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) surfaceVisibility.set(entry.target, entry.isIntersecting);
    scheduleHeaderGlass();
  });
  const surfaceResizeObserver = new ResizeObserver(scheduleHeaderGlass);
  const surfaceStateObserver = new MutationObserver(scheduleHeaderGlass);
  let watchedHeaderBar;
  let watchedChannel;
  let glassFrame = 0;
  let glassPending = false;
  /* ResizeObserver runs after native layout and before paint. Re-arm a one-shot
     root observation when geometry is dirty, rather than flushing Bilibili's
     pending styles (and native image requests) from a mutation callback. */
  const glassLayoutObserver = new ResizeObserver(syncHeaderGlass);
  const headerObserver = new MutationObserver(onHeaderMutation);
  const headerResizeObserver = new ResizeObserver(scheduleHeaderGlass);
  const channelObserver = new MutationObserver(onHeaderMutation);
  const channelResizeObserver = new ResizeObserver(syncHeaderGlass);
  const popoverResizeObserver = new ResizeObserver(syncHeaderGlass);
  let current;
  let savedAttributes;
  let savedProperties;
  let backgroundRecord;
  let wallpaperTone;
  function themeTokens() {
    // The optional pastel palette is generated locally, so its light tone is
    // known even when there is no uploaded media to sample. Keep the preferred
    // text color saved while applying the same contrast adjustment as media.
    const paletteTone = current?.enabled && current.minimalistReferenceLayout &&
      !backgroundRecord?.dataUrl && root.getAttribute("data-bc-page") === "home"
      ? [244, 242, 250] : undefined;
    return BC.tokens(current, wallpaperTone || paletteTone);
  }
  function applyTokens() {
    for (const [name,value] of Object.entries(themeTokens())) {
      if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name,value);
    }
  }
  let wallpaperSampleGeneration = 0;
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
    wallpaperVideo.onloadeddata = null;
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
    const sampleGeneration = ++wallpaperSampleGeneration;
    wallpaperTone = undefined;
    const applyTone = (tone) => {
        if (!tone || sampleGeneration !== wallpaperSampleGeneration || !current?.enabled) return;
        wallpaperTone = tone;
        applyTokens();
    };
    if (image.dataUrl.startsWith("data:image/")) {
      void pageTheme.sampleBackdrop(image.dataUrl).then(applyTone);
    }
    const video = image.dataUrl.startsWith("data:video/mp4;base64,");
    wallpaper.dataset.bcVideo = String(video);
    wallpaper.dataset.bcCustom = String(Boolean(image.dataUrl));
    wallpaperVideo.style.display = video ? "block" : "none";
    backgroundImage = video ? fallback : image.dataUrl
      ? `url("${image.dataUrl}"), ${fallback}` : `var(--bc-min-empty-wallpaper, ${fallback})`;
    wallpaper.style.setProperty("background-image", backgroundImage);
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
    wallpaperVideo.onloadeddata = () => { void pageTheme.sampleBackdrop(wallpaperVideo).then(applyTone); };
    wallpaperVideo.src = wallpaperVideoUrl;
    syncWallpaperPlayback();
  }

  function placeGlass(layer, rect, zIndex, radius = "0px", nativeBackdrop = false, category = false) {
    layer.style.setProperty("display", "block");
    layer.style.setProperty("left", `${rect.left}px`);
    layer.style.setProperty("top", `${rect.top}px`);
    layer.style.setProperty("width", `${rect.width}px`);
    layer.style.setProperty("height", `${rect.height}px`);
    layer.style.setProperty("z-index", `${zIndex}`);
    layer.style.setProperty("border-radius", radius);
    if(category)layer.dataset.bcSurfaceKind="categories";
    else delete layer.dataset.bcSurfaceKind;
    // Some site variants already frost their own surface. Preserve that native
    // containing block and avoid adding a second backdrop filter behind it.
    if(nativeBackdrop)layer.style.setProperty("backdrop-filter","none");
    else layer.style.removeProperty("backdrop-filter");
  }

  function measureGlassTarget(element) {
    if (!element) return null;
    let rect = element.getBoundingClientRect();
    const computed = getComputedStyle(element);
    if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight ||
        computed.visibility !== "visible" || Number(computed.opacity) === 0) return null;
    const category=root.getAttribute('data-bc-page')==='home' && element.matches('.bili-header__channel,.header-channel');
    if(category) {
      const bounds=[];
      for(const group of element.querySelectorAll(categoryPaintSelectors)) {
        const r=group.getBoundingClientRect(),s=getComputedStyle(group);
        if(r.width && r.height && s.visibility==='visible' && Number(s.opacity)!==0)bounds.push(r);
      }
      if(bounds.length) {
        const left=Math.max(rect.left,Math.min(...bounds.map(r=>r.left))),right=Math.min(rect.right,Math.max(...bounds.map(r=>r.right)));
        const top=Math.max(rect.top,Math.min(...bounds.map(r=>r.top))),bottom=Math.min(rect.bottom,Math.max(...bounds.map(r=>r.bottom)));
        rect={left,top,right,bottom,width:Math.max(0,right-left),height:Math.max(0,bottom-top)};
      }
    }
    return { rect,category, zIndex: parseInt(computed.zIndex, 10), radius: category?'12px':computed.borderRadius,
      nativeBackdrop: Boolean(computed.backdropFilter && computed.backdropFilter !== "none") };
  }

  function collectSurfaces() {
    if (!surfacesDirty) return;
    surfacesDirty = false;
    surfaceIntersectionObserver.disconnect();
    surfaceResizeObserver.disconnect();
    surfaceStateObserver.disconnect();
    surfaceVisibility = new WeakMap();
    const candidates = new Map();
    const groups = pageTheme.surfaceGroups(root.getAttribute("data-bc-page"));
    // Overlay priority wins for elements also registered as content/navigation.
    for (const level of ["strong","light","content"]) {
      for (const node of document.querySelectorAll(groups[level])) {
        if (!node.closest('[data-bc-owned],#bilibili-player,.bpx-player-container,.bilibili-player,#live-player') &&
            !candidates.has(node)) candidates.set(node,level);
      }
    }
    surfaceCandidates = new Map([...candidates].filter(([node,level]) => {
      for (let parent=node.parentElement;parent;parent=parent.parentElement) {
        const ancestorLevel=candidates.get(parent);
        if (ancestorLevel && (level!=="strong" || ancestorLevel==="strong")) return false;
      }
      return true;
    }));
    for (const [node] of surfaceCandidates) {
      surfaceIntersectionObserver.observe(node);
      surfaceResizeObserver.observe(node);
      if(node.matches('.bili-header__channel,.header-channel')) {
        for(const group of node.querySelectorAll(categoryPaintSelectors))surfaceResizeObserver.observe(group);
      }
      surfaceStateObserver.observe(node,{attributes:true,attributeFilter:["class","style","hidden","open"]});
      if(node.parentElement) surfaceStateObserver.observe(node.parentElement,{attributes:true,attributeFilter:["class","style","hidden","open"]});
    }
  }

  function measureSurfaces(bar,channel) {
    collectSurfaces();
    const surfaces=[];
    for(const [node,level] of surfaceCandidates) {
      if(node===bar || node===channel || !node.isConnected || surfaceVisibility.get(node)===false)continue;
      if(bar?.contains(node) && node.matches('.v-popover-content,.nav-search-panel'))continue;
      const geometry=measureGlassTarget(node);
      if(!geometry)continue;
      // Content frost sits between wallpaper and native content. Popups follow
      // their native stacking context without changing that context's geometry.
      let zIndex=-1;
      if(level==="strong") {
        for(let parent=node;parent && parent!==root;parent=parent.parentElement) {
          const z=parseInt(getComputedStyle(parent).zIndex,10);
          if(Number.isFinite(z) && z>0) {zIndex=z-1;break;}
        }
      }
      surfaces.push({node,level,geometry,zIndex});
    }
    return surfaces;
  }

  function paintSurfaces(surfaces) {
    const visible=new Set();
    for(const {node,level,geometry,zIndex} of surfaces) {
      visible.add(node);
      let glass=surfaceGlasses.get(node);
      if(!glass) {
        glass=document.createElement('div');
        glass.className='bc-theme-surface-glass';
        glass.dataset.bcOwned='surface-glass';
        glass.setAttribute('aria-hidden','true');
        root.append(glass);
        surfaceGlasses.set(node,glass);
      }
      glass.dataset.bcLevel=level;
      placeGlass(glass,geometry.rect,zIndex,geometry.radius,geometry.nativeBackdrop,geometry.category);
    }
    for(const [node,glass] of surfaceGlasses) if(!visible.has(node)) {
      glass.remove();surfaceGlasses.delete(node);
    }
  }

  function syncHeaderGlass() {
    if (glassFrame) cancelAnimationFrame(glassFrame);
    glassFrame = 0;
    glassLayoutObserver.disconnect();
    glassPending = false;
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
    const bar = document.querySelector(".bili-header__bar");
    if (bar !== watchedHeaderBar) {
      headerObserver.disconnect();
      headerResizeObserver.disconnect();
      watchedHeaderBar = bar;
      if (bar) headerResizeObserver.observe(bar);
      if (bar) headerObserver.observe(bar, {
        attributes: true, attributeFilter: ["class", "style"], childList: true, subtree: true
      });
      if (bar?.parentElement) headerObserver.observe(bar.parentElement, { childList: true });
    }
    // Snapshot every native rectangle/style before changing any glass layers.
    const channelGeometry = measureGlassTarget(channel);
    const headerGeometry = measureGlassTarget(bar);
    const panels = [];
    if (headerGeometry) {
      for (const panel of bar.querySelectorAll(".v-popover-content, .nav-search-panel")) {
        if (panel.parentElement.closest(".v-popover-content, .nav-search-panel")) continue;
        const geometry = measureGlassTarget(panel);
        if (!geometry) continue;
        let ancestor = panel.parentElement;
        while (ancestor && ancestor !== bar && Number(getComputedStyle(ancestor).opacity) !== 0) ancestor = ancestor.parentElement;
        if (ancestor && ancestor !== bar) continue;
        panels.push({ panel, geometry });
      }
    }
    const surfaces=measureSurfaces(bar,channel);

    paintSurfaces(surfaces);
    if (channelGeometry) {
      if (!channelGlass.isConnected) root.append(channelGlass);
      placeGlass(channelGlass, channelGeometry.rect, (channelGeometry.zIndex || 1001) - 1, channelGeometry.radius,channelGeometry.nativeBackdrop,channelGeometry.category);
    } else {
      channelGlass.remove();
    }
    if (!headerGeometry) {
      headerGlass.style.setProperty("display", "none");
      for (const glass of popoverGlasses.values()) glass.remove();
      popoverGlasses.clear();
      popoverResizeObserver.disconnect();
      return;
    }
    const zIndex = (headerGeometry.zIndex || 1002) - 1;
    if (!headerGlass.isConnected) root.append(headerGlass);
    placeGlass(headerGlass, headerGeometry.rect, zIndex, headerGeometry.radius,headerGeometry.nativeBackdrop);

    const visible = new Set();
    for (const { panel, geometry } of panels) {
      visible.add(panel);
      let glass = popoverGlasses.get(panel);
      if (!glass) {
        glass = document.createElement("div");
        glass.className = "bc-theme-popover-glass";
        glass.dataset.bcOwned = "popover-glass";
        glass.setAttribute("aria-hidden", "true");
        root.append(glass);
        popoverGlasses.set(panel, glass);
        popoverResizeObserver.observe(panel);
      }
      placeGlass(glass, geometry.rect, zIndex, geometry.radius,geometry.nativeBackdrop);
    }
    for (const [panel, glass] of popoverGlasses) {
      if (visible.has(panel)) continue;
      glass.remove();
      popoverGlasses.delete(panel);
      popoverResizeObserver.unobserve(panel);
    }
  }

  function scheduleHeaderGlass() {
    if (!current?.enabled || current.material !== "glass" || glassFrame || glassPending) return;
    // Arm before the next layout; never re-observe the root inside a resize
    // delivery loop, where a site mutation could cause an undelivered notification.
    glassFrame = requestAnimationFrame(() => {
      glassFrame = 0;
      glassPending = true;
      glassLayoutObserver.observe(root);
    });
  }

  function onHeaderMutation(records) {
    surfacesDirty = true;
    if (records.some((record) => record.type !== "childList" ||
        [...record.addedNodes, ...record.removedNodes].some((node) =>
          node.nodeType !== Node.ELEMENT_NODE || !node.hasAttribute("data-bc-owned")))) scheduleHeaderGlass();
  }

  function onHeaderPointer(event) {
    if (event.target.closest?.(".bili-header__bar")) {scheduleHeaderGlass();return;}
    // CSS-only hover/focus transitions need no class/style mutation. Watch the
    // registered popup and its trigger wrapper without polling or mousemove.
    for(const [node,level] of surfaceCandidates) {
      if(level!=="strong")continue;
      const parent=node.parentElement;
      if(node===event.target || node.contains(event.target) ||
          (parent && parent!==document.body && parent!==root && parent.contains(event.target))) {
        scheduleHeaderGlass();break;
      }
    }
  }

  function startHeaderGlass() {
    if (current.material !== "glass") { stopHeaderGlass(); return; }
    window.addEventListener("scroll", scheduleHeaderGlass, { passive: true });
    window.addEventListener("resize", scheduleHeaderGlass);
    document.addEventListener("pointerover", onHeaderPointer, true);
    document.addEventListener("pointerout", onHeaderPointer, true);
    document.addEventListener("focusin", onHeaderPointer, true);
    document.addEventListener("transitionstart", onHeaderPointer, true);
    document.addEventListener("transitionend", onHeaderPointer, true);
    document.addEventListener("animationend", onHeaderPointer, true);
    document.addEventListener("scroll", scheduleHeaderGlass, {capture:true,passive:true});
    scheduleHeaderGlass();
  }

  function stopHeaderGlass() {
    if (glassFrame) cancelAnimationFrame(glassFrame);
    glassFrame = 0;
    glassLayoutObserver.disconnect();
    glassPending = false;
    headerObserver.disconnect();
    headerResizeObserver.disconnect();
    channelObserver.disconnect();
    channelResizeObserver.disconnect();
    popoverResizeObserver.disconnect();
    surfaceIntersectionObserver.disconnect();
    surfaceResizeObserver.disconnect();
    surfaceStateObserver.disconnect();
    surfaceCandidates.clear();
    surfacesDirty=true;
    for(const glass of surfaceGlasses.values())glass.remove();
    surfaceGlasses.clear();
    watchedHeaderBar = null;
    watchedChannel = null;
    window.removeEventListener("scroll", scheduleHeaderGlass);
    window.removeEventListener("resize", scheduleHeaderGlass);
    document.removeEventListener("pointerover", onHeaderPointer, true);
    document.removeEventListener("pointerout", onHeaderPointer, true);
    document.removeEventListener("focusin", onHeaderPointer, true);
    document.removeEventListener("transitionstart", onHeaderPointer, true);
    document.removeEventListener("transitionend", onHeaderPointer, true);
    document.removeEventListener("animationend", onHeaderPointer, true);
    document.removeEventListener("scroll", scheduleHeaderGlass, true);
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
      surfacesDirty = true;
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
    if (current.enabled) applyTokens();
    if (surfacesDirty && current.enabled && current.material === "glass") scheduleHeaderGlass();
    syncCommentScope();
  }

  function schedulePageSync(layoutChanged = false) {
    if (layoutChanged === true) pageDirty = true;
    if (active() && !pageFrame) pageFrame = requestAnimationFrame(syncPage);
  }

  const observer = new MutationObserver((records) => {
    if (active() && ((current.enabled && wallpaper.parentElement !== root) ||
        !style.isConnected || observedBody !== document.body)) mount();
    if (!active()) return;
    if (lastURL !== location.href || commentStyles.size || pendingCommentHosts.size) schedulePageSync();
    for (const record of records) {
      for (const node of [...record.addedNodes, ...record.removedNodes]) {
        if (node.nodeType !== Node.ELEMENT_NODE || node.hasAttribute("data-bc-owned")) continue;
        if(current.enabled && current.material === "glass") {surfacesDirty=true;scheduleHeaderGlass();}
        const layoutChanged = node.matches(layoutMarkers) || node.querySelector(layoutMarkers);
        if (layoutChanged) { schedulePageSync(true); if (current.material === "glass") scheduleHeaderGlass(); }
        if (current.enabled && node.isConnected) scanCommentNode(node);
      }
    }
  });

  function mount() {
    if (!style.isConnected) (document.head || root).append(style);
    if (current.enabled && document.body && wallpaper.parentElement !== root) {
      wallpaper.style.setProperty("background-image", backgroundImage);
      // Keep decoration out of body child lists: :first-child/:nth-child on
      // native app roots and feed slots must retain their original meaning.
      root.append(wallpaper);
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
    wallpaperSampleGeneration += 1;
    wallpaperTone = undefined;
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
    surfacesDirty = true;
    if (!active()) { unmount(); return; }
    if (!current.enabled) {
      clearWallpaperVideo();
      backgroundRecord = undefined;
      wallpaper.remove();
      stopHeaderGlass();
      stopCommentWatch();
    }
    if (backgroundRecord !== snapshot.background) wallpaperTone = undefined;
    const tokens = themeTokens();
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
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
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
