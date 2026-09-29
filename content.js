(async () => {
  if (!document.documentElement) {
    await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }
  const BC = globalThis.BiliTheme;
  const root = document.documentElement;
  const client = BC.createClient();
  const fallback = "linear-gradient(135deg, #101927, #1c263a 48%, #102c35)";
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
  style.textContent = `
    html[data-bc-enabled="true"] { background-color: #101927 !important; }
    html[data-bc-enabled="true"] body {
      background-color: transparent !important;
      background-image: none !important;
      isolation: isolate !important;
    }
    /* Override Bilibili's separate title, metadata, link and inline text colors. */
    html[data-bc-enabled="true"][data-bc-coverage] body :where(*):not([data-bc-owned]) {
      color: var(--bc-text-color) !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
      text-shadow: var(--bc-text-shadow) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :where(*):not([data-bc-owned])::before,
    html[data-bc-enabled="true"][data-bc-coverage] body :where(*):not([data-bc-owned])::after {
      color: var(--bc-text-color) !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
    }
    html[data-bc-enabled="true"] #bc-theme-wallpaper {
      all: initial !important;
      display: block !important;
      position: fixed !important;
      inset: 0 !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background-color: #101927 !important;
      background-position: center !important;
      background-size: cover !important;
      background-repeat: no-repeat !important;
    }
    /* Clear nested surfaces without stacking white tint or blur over media. */
    html[data-bc-enabled="true"][data-bc-coverage="all"] body :where(*):not([data-bc-owned]) {
      background-color: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    /* White page-wide pseudo layers can hide the wallpaper even when the element is clear. */
    html[data-bc-enabled="true"][data-bc-coverage="all"] body :is(
      #app, #i_cecream, .bili-feed4, .bili-header,
      .home-container, .video-container
    )::before,
    html[data-bc-enabled="true"][data-bc-coverage="all"] body :is(
      #app, #i_cecream, .bili-feed4, .bili-header,
      .home-container, .video-container
    )::after {
      background: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      #app, #i_cecream, .bili-feed4, .bili-feed4-layout, .feed2,
      .container.is-version8, .home-container
    ) {
      background-color: transparent !important;
      background-image: none !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .recommended-container_floor-aside, .feed-card, .bili-video-card,
      .bili-video-card__wrap, .video-card, .left-container,
      .video-info-container
    ) { background-color: transparent !important; }
    /* Glass is applied once per visible UI surface, outside image and video pixels. */
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .bili-header__channel, .bili-video-card__info, .video-card__info,
      .video-page-card-small, .video-page-operator-card, .bili-dyn-item,
      .video-toolbar, .up-info-container, .user-card-m-exp,
      .video-pod, .media-info, .bangumi-info,
      .nav-search-content, .article-container, .opus-module-content,
      .floor-single-card
    ) {
      background-color: rgba(8, 14, 24, var(--bc-surface-alpha)) !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    /* Space pages use their own layout containers. Blur each section once while
       keeping cover art, video thumbnails and text inside the pane sharp. */
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .space-header .upinfo, .space-navbar,
      .space-main .section-wrap, .space-main .home-aside-section,
      .space-main .space-dynamic-inner, .space-main .dynamic-aside-section,
      .space-main .space-dynamic__left .side-nav,
      .space-main .upload-sidenav .side-nav, .space-main .upload-content,
      .space-main .subscribe-sidebar .side-nav, .space-main .subscribe-content,
      .space-main .space-lists, .space-main .relation-aside,
      .space-main .follow-main
    ) {
      background-color: rgba(8, 14, 24, var(--bc-surface-alpha)) !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body .space-main :is(
      .bili-video-card__info, .video-card__info, .bili-dyn-item
    ) {
      background-color: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    /* The space page login prompt paints an opaque blue gradient. */
    html[data-bc-enabled="true"][data-bc-coverage] body:has(.space-navbar) .login-tip {
      background-color: rgba(8, 14, 24, var(--bc-surface-alpha)) !important;
      background-image: none !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    /* The first matching container gets glass; nested description/comment nodes stay clear. */
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .video-desc-container, #v_desc, .video-desc, .video-desc-v1,
      .video-desc-v2, .desc-content, .desc-info, .video-tag-container,
      .comment-container:not(:has(bili-comments)),
      #commentapp:not(:has(bili-comments)),
      #comment:not(:has(bili-comments)),
      .reply-warp:not(:has(bili-comments)),
      .reply-container:not(:has(bili-comments)), bili-comments
    ) {
      background-color: rgba(8, 14, 24, var(--bc-surface-alpha)) !important;
      background-image: none !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .comment-container:has(bili-comments),
      #commentapp:has(bili-comments),
      #comment:has(bili-comments),
      .reply-warp:has(bili-comments),
      .reply-container:has(bili-comments)
    ) {
      background-color: transparent !important;
      background-image: none !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .video-desc-container, #v_desc, .video-desc, .video-desc-v1,
      .video-desc-v2, .desc-content, .desc-info, .video-tag-container,
      .comment-container, #commentapp, #comment, bili-comments,
      .reply-warp, .reply-container
    ) :where(*):not(bili-comments) {
      background-color: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage="panels"]
    :is(.bili-video-card__info, .video-card__info) div {
      background-color: transparent !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      input:not([type]), input[type="text"], input[type="search"],
      input[type="password"], input[type="email"], input[type="number"],
      textarea, select, [contenteditable="true"]
    ) {
      background-color: var(--bc-input-bg) !important;
      caret-color: var(--bc-text-color) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .video-desc-container, #v_desc, .video-desc, .video-desc-v1,
      .video-desc-v2, .desc-content, .desc-info, .video-tag-container,
      .comment-container, #commentapp, #comment, bili-comments,
      .reply-warp, .reply-container
    ) :is(input, textarea, select, [contenteditable="true"]) {
      background-color: var(--bc-input-bg) !important;
      caret-color: var(--bc-text-color) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(input, textarea)::placeholder {
      color: var(--bc-text-color) !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
      opacity: .75 !important;
    }
    /* Keep the bar's blur on a sibling layer so its descendant hover panels
       can sample the page behind the header instead of stopping at the bar. */
    html[data-bc-enabled="true"][data-bc-coverage] body .bili-header__bar {
      background-color: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      isolation: isolate !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body .bili-header__bar::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      z-index: -1 !important;
      pointer-events: none !important;
      border-radius: inherit !important;
      background-color: rgba(20, 29, 43, var(--bc-header-alpha)) !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    /* Fixed navigation and its popovers need body-level glass layers to sample
       the feed behind them, including the separate channel row on scroll. */
    html[data-bc-enabled="true"][data-bc-material="glass"] body .bili-header__bar::before {
      display: none !important;
    }
    html[data-bc-enabled="true"] body :is(
      #bc-theme-header-glass, #bc-theme-channel-glass, .bc-theme-popover-glass
    ) {
      all: initial !important;
      display: none !important;
      position: fixed !important;
      box-sizing: border-box !important;
      pointer-events: none !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    html[data-bc-enabled="true"] body :is(#bc-theme-header-glass, #bc-theme-channel-glass) {
      background-color: rgba(20, 29, 43, var(--bc-header-alpha)) !important;
    }
    html[data-bc-enabled="true"] body .bc-theme-popover-glass {
      background-color: transparent !important;
    }
    /* Bilibili fades hover popovers from opacity 0. That temporary backdrop
       root blocks their glass until the fade ends, so show them at full opacity. */
    html[data-bc-enabled="true"][data-bc-material="glass"] body :is(
      .bili-header__bar .v-popover,
      .v-popover:has(.more-channel-popover)
    ) {
      opacity: 1 !important;
      transition: none !important;
      animation: none !important;
    }
    /* Dim modal backdrops without placing a blurred white sheet over the page. */
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .bili-modal-mask, .bili-dialog-mask, .bili-popup-mask, .bili-mask,
      .v-modal, .ant-modal-mask, .el-overlay, .van-overlay,
      .van-dialog__wrapper,
      .login-mask, .bili-mini-mask
    ),
    html[data-bc-enabled="true"][data-bc-coverage] body dialog::backdrop {
      background: rgba(4, 9, 18, .35) !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    /* Clear the inner paint before putting a single glass layer on each popup. */
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      dialog, [role="dialog"], [role="alertdialog"], [role="menu"],
      [role="listbox"], [role="tooltip"], [popover]:popover-open,
      .bili-dialog, .bili-popup, .bili-popover, .bili-tooltip,
      .bili-header__popover, .v-popover-content, .van-dialog,
      .van-popover, .van-popup, .bui-dropdown-items,
      .bili-mini-content-wp,
      .ant-modal-content, .ant-popover-inner, .ant-dropdown-menu,
      .el-dialog, .el-popover, .el-dropdown-menu,
      .bpx-player-contextmenu, .bpx-player-ctrl-setting-menu,
      .bpx-player-ctrl-quality-menu, .bpx-player-ctrl-playbackrate-menu
    ) :where(*:not(img):not(video):not(canvas)) {
      background-color: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      dialog, [role="dialog"], [role="alertdialog"], [role="menu"],
      [role="listbox"], [role="tooltip"], [popover]:popover-open,
      .bili-dialog:not(:has(.bili-dialog__content)), .bili-dialog__content,
      .bili-popup:not(:has(.bili-popup__content)), .bili-popup__content,
      .bili-popover:not(:has(.bili-popover__content)), .bili-popover__content,
      .bili-tooltip, .bili-toast,
      .bili-header__popover:not(:has(.bili-header__popover-content)),
      .bili-header__popover-content,
      .nav-search-content, .search-panel, .search-suggest,
      .search-result, .search-popover, .v-popover-content,
      .van-dialog, .van-popover, .van-popup, .bui-dropdown-items,
      .bili-mini-content-wp,
      .ant-modal-content, .ant-popover-inner, .ant-dropdown-menu,
      .el-dialog, .el-popover, .el-dropdown-menu,
      .bpx-player-contextmenu, .bpx-player-ctrl-setting-menu,
      .bpx-player-ctrl-quality-menu, .bpx-player-ctrl-playbackrate-menu,
      .bpx-player-ctrl-subtitle, .bpx-player-ctrl-volume-box,
      .video-note-sidebar-tooltip
    ) {
      background-color: rgba(8, 14, 24, var(--bc-surface-alpha)) !important;
      background-image: none !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      dialog, [role="dialog"], [role="alertdialog"], [role="menu"],
      [role="listbox"], [role="tooltip"], [popover]:popover-open,
      .bili-mini-content-wp, .v-popover-content, .van-dialog,
      .bili-dialog__content, .bili-popup__content,
      .ant-modal-content, .el-dialog
    ) :is(input, textarea, select, [contenteditable="true"]) {
      background-color: var(--bc-input-bg) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      input:-webkit-autofill, input:-webkit-autofill:hover,
      input:-webkit-autofill:focus
    ) {
      -webkit-box-shadow: 0 0 0 1000px var(--bc-input-bg) inset !important;
      box-shadow: 0 0 0 1000px var(--bc-input-bg) inset !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body .bili-mini-content-wp input {
      -webkit-box-shadow: 0 0 0 1000px var(--bc-input-bg) inset !important;
      box-shadow: 0 0 0 1000px var(--bc-input-bg) inset !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body bili-comments {
      display: block !important;
    }
    html[data-bc-enabled="true"] .bili-header__bar :is(.left-entry, .right-entry) > li > a,
    html[data-bc-enabled="true"] .bili-header__bar :is(.left-entry, .right-entry) > li > a > span {
      color: var(--bc-text-color) !important;
    }
    html[data-bc-enabled="true"][data-bc-coverage] body :is(
      .bili-header__channel a:hover, .bili-video-card__info--tit a:hover
    ) {
      color: var(--bc-accent) !important;
      -webkit-text-fill-color: var(--bc-accent) !important;
    }
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
  const shadowStyleText = `
    :host {
      color: var(--bc-text-color) !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
      background-color: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    :host(bili-comments) {
      background-color: rgba(8, 14, 24, var(--bc-surface-alpha)) !important;
      -webkit-backdrop-filter: blur(var(--bc-blur)) !important;
      backdrop-filter: blur(var(--bc-blur)) !important;
    }
    :is(*, #bc-theme-shadow-content) {
      background-color: transparent !important;
      color: var(--bc-text-color) !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
      text-shadow: var(--bc-text-shadow) !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }
    :is(*, #bc-theme-shadow-content)::before,
    :is(*, #bc-theme-shadow-content)::after {
      color: var(--bc-text-color) !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
    }
    /* The limited-comment mask paints a full-width white gradient in pseudo elements. */
    #limit-mask-wall::before {
      background: linear-gradient(to bottom, transparent, rgba(8, 14, 24, .68)) !important;
    }
    #limit-mask-wall::after {
      background: rgba(8, 14, 24, .68) !important;
    }
    :is(#contents, #feed, #commentbox, #editor, #input) {
      background-image: none !important;
    }
    :is(input, textarea, [contenteditable], #bc-theme-shadow-input) {
      background-color: var(--bc-input-bg) !important;
      caret-color: var(--bc-text-color) !important;
    }
    :is(input, textarea)::placeholder {
      color: var(--bc-text-color) !important;
      -webkit-text-fill-color: var(--bc-text-color) !important;
      opacity: .75 !important;
    }
  `;
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
  let discoveryBody;
  let glassFrame = 0;
  /* Popovers are toggled by Bilibili after a hover delay. Place their blur
     in the same microtask as the style change so no clear frame is painted. */
  const headerObserver = new MutationObserver(syncHeaderGlass);
  const channelObserver = new MutationObserver(syncHeaderGlass);
  const channelResizeObserver = new ResizeObserver(syncHeaderGlass);
  const popoverResizeObserver = new ResizeObserver(scheduleHeaderGlass);
  const headerDiscoveryObserver = new MutationObserver(scheduleHeaderGlass);
  let current;
  let savedAttributes;
  let savedProperties;
  let backgroundRecord;
  let backgroundImage = fallback;
  let wallpaperVideoUrl;
  let observedBody;
  let commentScope;
  let commentTimer;
  const commentStyles = new Map();
  const pendingCommentHosts = new Set();
  const attributes = [
    "data-bc-enabled", "data-bc-coverage", "data-bc-material",
    "data-bc-hidden", "data-bc-channel-layout"
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
    wallpaperVideo.style.display = video ? "block" : "none";
    backgroundImage = video ? fallback : image.dataUrl
      ? `url("${image.dataUrl}"), ${fallback}` : fallback;
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
    if (channelRect?.width && channelRect.height && channelRect.bottom > 0 &&
        channelRect.top < innerHeight && getComputedStyle(channel).visibility !== "hidden") {
      const channelStyle = getComputedStyle(channel);
      const channelZ = (parseInt(channelStyle.zIndex, 10) || 1001) - 1;
      if (!channelGlass.isConnected) document.body.append(channelGlass);
      placeGlass(channelGlass, channelRect, channelZ, channelStyle.borderRadius);
    } else {
      channelGlass.remove();
    }
    const bar = document.querySelector(".bili-header__bar");
    if (bar) {
      headerDiscoveryObserver.disconnect();
      discoveryBody = null;
    } else if (document.body !== discoveryBody) {
      headerDiscoveryObserver.disconnect();
      headerDiscoveryObserver.observe(document.body, { childList: true, subtree: true });
      discoveryBody = document.body;
    }
    if (bar !== watchedHeaderBar) {
      headerObserver.disconnect();
      watchedHeaderBar = bar;
      if (bar) headerObserver.observe(bar, {
        attributes: true, attributeFilter: ["class", "style"], childList: true, subtree: true
      });
      if (bar?.parentElement) headerObserver.observe(bar.parentElement, { childList: true });
    }
    const rect = bar?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight ||
        getComputedStyle(bar).visibility === "hidden") {
      headerGlass.style.setProperty("display", "none", "important");
      for (const glass of popoverGlasses.values()) glass.remove();
      popoverGlasses.clear();
      popoverResizeObserver.disconnect();
      return;
    }
    const barStyle = getComputedStyle(bar);
    const zIndex = (parseInt(barStyle.zIndex, 10) || 1002) - 1;
    if (!headerGlass.isConnected) document.body.append(headerGlass);
    placeGlass(headerGlass, rect, zIndex, barStyle.borderRadius);

    const visible = new Set();
    for (const panel of bar.querySelectorAll(".v-popover-content, .nav-search-panel")) {
      const panelRect = panel.getBoundingClientRect();
      if (!panelRect.width || !panelRect.height || panelRect.bottom <= 0 ||
          panelRect.top >= innerHeight) continue;
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
      placeGlass(glass, panelRect, zIndex, getComputedStyle(panel).borderRadius);
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
    headerDiscoveryObserver.disconnect();
    watchedHeaderBar = null;
    watchedChannel = null;
    discoveryBody = null;
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
  });

  function inspectCommentHost(host) {
    if (!host.localName?.startsWith("bili-")) return;
    const shadow = host.shadowRoot;
    if (!shadow) {
      if (/^bili-comments?|^bili-text-button$|^bili-rich-text$/.test(host.localName)) {
        pendingCommentHosts.add(host);
      }
      return;
    }
    pendingCommentHosts.delete(host);
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
    if (node.nodeType === Node.ELEMENT_NODE) inspectCommentHost(node);
    if (!node.querySelectorAll) return;
    for (const element of node.querySelectorAll("*")) {
      if (element.localName.startsWith("bili-")) inspectCommentHost(element);
    }
  }

  function clearCommentStyles() {
    commentObserver.disconnect();
    for (const shadowStyle of commentStyles.values()) shadowStyle.remove();
    commentStyles.clear();
    pendingCommentHosts.clear();
    commentScope = null;
  }

  function syncCommentScope() {
    if (!current?.enabled) return;
    const scope = document.querySelector("#commentapp") || document.querySelector("#comment") ||
      document.querySelector(".comment-container") || document.querySelector("bili-comments") ||
      document.querySelector(".reply-warp") || document.querySelector(".reply-container");
    if (scope !== commentScope) {
      clearCommentStyles();
      commentScope = scope;
      if (scope) {
        commentObserver.observe(scope, { childList: true, subtree: true });
        scanCommentNode(scope);
      }
    }
    for (const host of pendingCommentHosts) {
      if (!host.isConnected) pendingCommentHosts.delete(host);
      else if (host.shadowRoot) inspectCommentHost(host);
    }
    let removedRoot = false;
    for (const [shadow, shadowStyle] of commentStyles) {
      if (shadow.host.isConnected) continue;
      shadowStyle.remove();
      commentStyles.delete(shadow);
      removedRoot = true;
    }
    if (removedRoot && commentScope) {
      commentObserver.disconnect();
      commentObserver.observe(commentScope, { childList: true, subtree: true });
      for (const shadow of commentStyles.keys()) {
        commentObserver.observe(shadow, { childList: true, subtree: true });
      }
    }
  }

  function startCommentWatch() {
    syncCommentScope();
    if (!commentTimer) commentTimer = setInterval(syncCommentScope, 1500);
  }

  function stopCommentWatch() {
    if (commentTimer) clearInterval(commentTimer);
    commentTimer = null;
    clearCommentStyles();
  }

  const observer = new MutationObserver(() => {
    if (current?.enabled && (wallpaper.parentElement !== document.body ||
        !style.isConnected || observedBody !== document.body)) mount();
  });

  function mount() {
    if (!style.isConnected) (document.head || root).append(style);
    if (document.body && wallpaper.parentElement !== document.body) {
      wallpaper.style.setProperty("background-image", backgroundImage, "important");
      document.body.prepend(wallpaper);
    }
    observer.disconnect();
    for (const container of new Set([root, document.head, document.body].filter(Boolean))) {
      observer.observe(container, { childList: true });
    }
    observedBody = document.body;
    syncWallpaperPlayback();
    if (current?.material === "glass") scheduleHeaderGlass();
  }

  function unmount() {
    observer.disconnect();
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
    if (!current.enabled) { unmount(); return; }
    const tokens = BC.tokens(current);
    if (!savedAttributes) {
      savedAttributes = new Map(attributes.map((name) => [name, root.getAttribute(name)]));
      savedProperties = new Map(Object.keys(tokens).map((name) => [name, {
        value: root.style.getPropertyValue(name),
        priority: root.style.getPropertyPriority(name)
      }]));
    }
    if (backgroundRecord !== snapshot.background) {
      const image = BC.background(snapshot.background);
      backgroundRecord = snapshot.background;
      setWallpaperMedia(image);
    }
    root.setAttribute("data-bc-enabled", "true");
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
    startHeaderGlass();
    startCommentWatch();
  }

  const unsubscribe = client.subscribe((snapshot) => {
    try { apply(snapshot); }
    catch (error) { unmount(); console.error("[B哩B哩主题 / Bilibili Theme Customizer] 无法应用主题", error); }
  });
  client.start().catch((error) => console.error("[B哩B哩主题 / Bilibili Theme Customizer] 无法读取设置", error));
  document.addEventListener("visibilitychange", syncWallpaperPlayback);
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) return;
    unsubscribe();
    client.dispose();
    unmount();
  });
})();
