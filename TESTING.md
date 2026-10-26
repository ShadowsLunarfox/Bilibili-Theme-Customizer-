# Verification

Bilibili owns layout. The theme may change colors, backgrounds, borders' colors/radii, shadows and interaction appearance. Native grid/flex rules, dimensions, padding, margins, font metrics, overflow, positioning, transforms and breakpoints must remain untouched. Geometry belongs only to extension-owned, out-of-flow paint layers. Explicit content filters are the only visibility exception.

## Run locally

Requires Node.js and installed Chrome or Edge; no npm packages or build step.

```powershell
node --test tests/settings.test.mjs tests/theme.test.mjs
node tests/browser.mjs
# Optional browser path:
node tests/browser.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'
# Only if the restricted local-fixture environment requires it:
$env:BC_TEST_NO_SANDBOX='1'
$env:BC_TEST_SCREENSHOTS='tests/artifacts/native-fixtures'
node tests/browser.mjs
```

The normal suite uses local representative fixtures and a messaging/storage bridge around the actual settings service worker. Chrome/Edge use isolated temporary profiles, never a personal session. Screenshots are ignored by Git.

- `tests/layout-parity.mjs`: theme off/on/off at 1024, 1280, 1366, 1440, 1600, 1920 and 2560 CSS pixels, DPR 1. Compares component rectangles, container margins/padding, grid tracks/gaps, flex rules, spans, thumbnail/title dimensions, font metrics, header/search/categories, visibility, overflow, stacking/containing-block properties and native body child order. A 97-sample resize sequence traverses 1024-2560-1024 in 32px steps. Test widths are not production breakpoints. Legacy grid/header flags are deliberately enabled during the glass check.
- CSSOM audit rejects native geometry declarations, including future accidental overrides. Physical borders are not added; an inset shadow paints a rim. Native backdrop filters are not changed because they can establish containing blocks. Glass layers measure native rectangles after layout and never reposition native content.
- `tests/minimalist.mjs`: native carousel span and feed geometry, category flow, explicit filters, full registered ad slots (including nested `.bili-feed-card` wrappers), late ad attributes, ordinary content preservation, native gap/placement, original links/search/menus/previews, category priority, media continuity, persistence, restoration and SPA isolation. Hidden banner artwork keeps its native footprint to avoid header/category collisions.
- `tests/reference.mjs`: the appearance preset preserves filters and media, retires structural controls, leaves native geometry unchanged, supports Clear and custom wallpaper, adapts contrast on the generated pastel palette, and survives reloads/routes. Persisted legacy keys are retained but never emit structural CSS.
- `tests/liquid.mjs`: three visible tint/blur strengths, frosted video information/comments/sidebars, sharp media, bright/dark wallpapers with stable white ink, a screenshot-pixel comparison proving category blur is actually painted, reduced motion/transparency, no-backdrop fallback, Clear, restore, and native geometry at seven widths on search/video/profile/dynamic fixtures.
- `tests/compatibility.mjs`: 200 page/material/coverage/background combinations per browser, 10 disabled layouts, editors/menus/comments, route-only SPA changes, cleanup and protected player/media/status styling.
- `tests/browser.mjs`: bilingual popup/group controls, PNG/JPG/WebP conversion, GIF preservation, 20 MiB boundary, real MP4 decoding/playback, tab pause/resume, restart/removal/defaults.
- `tests/header-glass.mjs`: controlled HTTPS fixture reproduces native HTTP image upgrades; extension layout reads do not acquire Mixed Content warning stacks or cause ResizeObserver loops.
- Node tests cover settings validation, contrast/material tokens, migration, damaged media, failed writes, concurrency, revisions, persistence, preset preference preservation and page classification.

## Official reference

Run with normal browser sandboxing and network access:

```powershell
Remove-Item Env:BC_TEST_NO_SANDBOX -ErrorAction SilentlyContinue
$env:BC_TEST_OFFICIAL='1'
$env:BC_TEST_SCREENSHOTS='tests/artifacts/frosted-official'
node tests/browser.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'
```

`tests/official-parity.mjs` visits `https://www.bilibili.com/` with Chinese locale headers, saves the delivered URL/status, actual downloaded CSS and media queries, and injects production sources into a separate JavaScript world. Site scripts, responsive rules and native children stay intact. It runs the same seven widths, native/glass/restored comparisons and 97-sample resize sequence. No login, account writes or persistent browser profile are used. It dismisses only the native first-visit translation notice for readable screenshots.

Current frosted-glass evidence is written to `tests/artifacts/frosted-official/REPORT.md`, `official-metrics.json`, `official-media-queries.json` and paired `official-<width>-native.png` / `official-<width>-glass.png`. Local evidence is saved separately under `tests/artifacts/frosted`: homepage/category/carousel, search, video, profile and dynamic pages have their own seven-width pairs, plus `frosted-home-bright.png`, `frosted-home-dark.png`, `frosted-home-menus.png` and page screenshots. Fixtures are not official-site measurements.

The live reference delivered the official `/zh-Hans` overseas homepage in this environment. Measured native/themed geometry matched at all seven widths and all 97 resize samples. That variant has no category strip or featured carousel, so their live behavior is not claimed as verified. The actual official stylesheet has a native minimum width: at a 1024px viewport, document scroll width is 1100px in both states. This existing overflow is deliberately preserved to satisfy native layout parity; no theme-induced overflow is added. The generated report records exact current measurements rather than assuming a column count or breakpoint.

## Installed-extension acceptance

Reload the unpacked extension, then refresh Bilibili tabs so old injected styles are removed. Compare native/themed pages at identical zoom. Check domestic/account/A-B homepage variants, categories and carousel, real search/video pages, logged-in hover menus, notification/profile interactions, infinite loading, fullscreen playback and display scaling. Exercise existing media, navigation and filters, Clear, reduced preferences and older saved settings. AVIF, multi-frame GIF codecs, older Chromium and extended performance checks remain environment-dependent. The automated fixtures verify preserved handlers and rendering, not the entire live account workflow.

No reset is needed after upgrade. Existing media, navigation preferences and stored legacy options remain saved. Compact-header/custom-grid controls are retired; the color preset changes appearance only.

## Changed files and removed conflicts

| File | Change |
| --- | --- |
| `theme.js` | Visual-only navigation/categories/cards. Removed native dimensions, positioning, padding, physical border widths, font metrics, box sizing, overflow/stacking overrides and custom responsive grid rules. Native backdrop filters are preserved; owned paint layers provide theme blur. |
| `minimalist.js` | Removed compact-header geometry, forced columns/breakpoints, featured-card rail, carousel spans and card/title sizing. Keeps explicit filters and an optional wallpaper palette. Banner hiding preserves native space; ad hiding removes complete slots. |
| `content.js` | Removed channel margin/grid-span patches. Places owned decorations outside native body child lists, batches post-layout measurements, follows native rectangles, and preserves media/contrast/cleanup behavior. |
| `settings.js` | Keeps legacy stored keys, retires structural controls, provides shared glass/contrast tokens, and makes the color preset preserve filter choices. |
| `popup.html`, `popup.js`, `popup.css` | Appearance controls and preview, bilingual Homepage Filters, visual preset placement/copy and retired geometry controls. |
| `tests/layout-parity.mjs`, `tests/official-parity.mjs` | Shared geometry/CSS audit, live stylesheet inspection, seven-width/restoration/resize comparisons, original banner artwork checks, screenshots and measurement report. |
| `tests/browser.mjs`, `tests/minimalist.mjs`, `tests/reference.mjs` | Browser integration, native-layout/filter/preset acceptance replaces forced-layout assertions. |
| `tests/liquid.mjs`, `tests/header-glass.mjs`, `tests/compatibility.mjs` | Glass, native dropdown/search/video geometry, media/contrast, mixed-content scheduling and cross-page regressions. |
| `tests/settings.test.mjs`, `tests/theme.test.mjs` | Preference-preserving preset and official regional homepage classification coverage. |
| `README.md`, `TESTING.md` | Current behavior, audit, reproducible verification and live-reference limitations. |

## Frosted surface system

Native surfaces now paint a semi-opaque tint, inset border and soft shadow. Extension-owned, pointer-transparent layers blur behind those surfaces; native elements never gain a backdrop filter or containing block. The wallpaper is behind these layers. Visible surface candidates are cached, intersection/resize observers update them, and nested content shares its outer surface. Offscreen/hidden/detached blur layers are removed, and all observers/layers stop when disabled or switched to Clear.

| Level | Native components | Shared variables | Default blur / tint alpha |
| --- | --- | --- | --- |
| 1 | Header, categories, search navigation, profile/feed tabs | `--bc-glass-bg-light`, `--bc-glass-blur-light` | 12px / .24 |
| 2 | Video information/right sidebar, comments, dynamic cards/composer/sidebar, profile sections/sidebar, floating tool panels | `--bc-glass-bg-content`, `--bc-glass-blur-content`, `--bc-glass-shadow-content` | 18px / .46 |
| 3 | Menus, popovers, suggestions, dialogs/tooltips | `--bc-glass-bg-strong`, `--bc-glass-blur-strong`, `--bc-glass-shadow-strong` | 20px / .66 |

Tint, border, shadow, saturation and all three blur strengths are tokens. Defaults scale with existing saved opacity/blur controls. A 24x24 local wallpaper sample retains its mean and bright/dark percentiles; sampled bright regions strengthen a dark panel before altering white text. Dark custom ink uses a light tint with the corresponding dark-region protection. Unusable midtone ink is adjusted minimally for contrast without overwriting its saved color. Metadata/placeholders/links are checked against the composited panel with a rounding margin. No global wallpaper veil is used. Inputs use a clearer inset rim and tinted field; hover/focus changes paint only, without moving elements.

The no-backdrop and reduced-transparency paths use a .94 fallback tint and disable owned blur. Clear and explicitly zero strength remain intentional transparency options. Thumbnails, covers, previews and player controls are protected; neither native media nor native text receives blur. Native card/container/font/border-width/position/overflow metrics remain in the parity check.

This refinement modifies `settings.js`, `theme.js`, `content.js`, `popup.html`, `popup.js`, `popup.css`, `README.md`, `TESTING.md`, `tests/settings.test.mjs`, `tests/browser.mjs`, `tests/liquid.mjs`, `tests/layout-parity.mjs`, `tests/compatibility-fixtures.mjs`, `tests/compatibility.mjs`, and `tests/reference.mjs`. Earlier layout-fix files remain in the working tree; no user settings or media were reset.

## Homescreen correction

`theme.js` now gives each homepage video card one continuous frosted background; its information block no longer paints a separate rounded pill. Thumbnails and previews remain above this background and receive no filter. Other page types retain their content-panel treatment.

The category wrapper retains its native dimensions/padding and paints no full-width slab. `content.js` derives a paint rectangle from the actual visible icon, category and shortcut groups, clips it to the native wrapper, and follows group resizing. Only the owned glass layer uses that rectangle. Stronger, home-scoped appearance selectors suppress native category border/shadow rules without changing their border widths or layout. Hover/selected states remain subtle.

Home search accounts for the native `#nav-searchform` structure: the form is the single tinted shell, with clear wrapper/content/input backgrounds and one keyboard focus ring. The carousel footer uses the shared content tint in place of a solid sampled purple color, leaving the image and controls intact. Clear, reduced-transparency, wallpaper and saved filtering choices remain supported.

`tests/homescreen.mjs` reproduces the domestic homepage's nested search form, flex information wrapper, competing native category selectors and carousel footer. It verifies those visual corrections, original search/menu interactions, unchanged sharp media, pre-fix geometry where a saved baseline exists, all seven requested viewport widths and the 97-sample resize sequence. The normal Chrome/Edge suite runs it automatically. For targeted review:

```powershell
$env:BC_TEST_NO_SANDBOX='1' # Only for the restricted local fixture environment.
$env:BC_TEST_HOME_CAPTURE='after'
$env:BC_TEST_SCREENSHOTS='tests/artifacts/homescreen-fix'
node tests/browser.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'
Remove-Item Env:BC_TEST_HOME_CAPTURE
```

Local before/after evidence is `tests/artifacts/homescreen-fix/homescreen-before.png` and `homescreen-after.png`, with matching metrics JSON and seven-width native/glass pairs. These are representative fixtures, not screenshots of a logged-in Bilibili account. This correction modifies `theme.js`, `content.js`, `tests/homescreen.mjs`, `tests/browser.mjs`, `tests/liquid.mjs`, `README.md`, and `TESTING.md`.
