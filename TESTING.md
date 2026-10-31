# Verification

Bilibili owns grid columns, gaps, media ratios, font metrics, overflow, positioning, transforms and breakpoints. Scoped homepage CSS carries grid-item stretching through verified card wrappers, pads glass captions, aligns metadata toward the bottom and lets special covers use their native ratio shim. Legacy positive wrapper margins are cleared so the grid gap controls row spacing; track heights grow naturally with content. There is no fixed card height or JavaScript height adjustment. Glass uses extension-owned, out-of-flow paint layers. Explicit filters may hide confirmed content; disabling both theme and filters restores original layout.

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
- CSSOM audit rejects geometry declarations except the scoped homepage slot-margin correction and a tightly scoped flex/stretch property allowlist for verified card chains. Native/glass comparisons permit only the intended card-height/flex differences and Chromium's automatic flex-item minimums; grid tracks/gaps, carousel dimensions/span, thumbnail rectangles, title dimensions/fonts, widths and surrounding components remain strict. Disabled-state restoration remains exact. Physical borders are not added; an inset shadow paints a rim. Glass layers measure the actual expanded information area and never reposition native content.
- `tests/card-alignment.mjs`: six-width before/after measurements of panel and uploader-metadata bottoms, mixed one-line/two-line/truncated titles, direct and nested slots, special cards and loading skeletons. Asserts <=2px row deltas, unchanged grid tracks/columns/gaps and carousel, exact thumbnail rectangles/ratios, no title/metadata overlap or row collisions, one glass layer covering each visible expanded panel, asynchronous replacement and subsequent resizing. Run with `$env:BC_TEST_CARD_ALIGNMENT='1'; $env:BC_TEST_SCREENSHOTS='tests/artifacts/card-alignment'; node tests/browser.mjs`. It is also included in the full suite. Before screenshots remove only the new structural CSS, retaining the same glass and content; orange horizontal guides mark panel bottoms. Artifacts include `CARD-ALIGNMENT.md`, `card-alignment-metrics.json`, and `cards-<width>-before.png` / `cards-<width>-after.png`.
- `tests/video-material.mjs`: reproduces the old brightness/contrast filter turning captions nearly black over a black/white wallpaper. At 1440/1600/1920px it verifies that the corrected blur/saturation filter preserves visible wallpaper variation through one shared content tint, without changing card/media/text geometry. Also checks hover, late recommendations, scrolling and adaptive light tint for saved dark ink. Run with `$env:BC_TEST_VIDEO_MATERIAL='1'; $env:BC_TEST_SCREENSHOTS='tests/artifacts/video-material'; node tests/browser.mjs`. It also runs in the full suite. The exported JPEG audit helper remains available for historical evidence.
- `tests/filtered-layout.mjs`: domestic div slots and native positional 0/40/24px margins reproduce the reported 40px card displacement. Verifies aligned rows at seven widths, late ad attributes, carousel hiding, Clear/theme-off filtering, complete margin restoration, unchanged native child order and SPA cleanup. Run just this regression with `$env:BC_TEST_FILTER_LAYOUT='1'; node tests/browser.mjs` (unset the variable for the full suite).
- The same module also reproduces `.feed-card > .bili-feed-card.floor-single-card > .bili-video-card` with the native inner `:first-of-type { margin-top:40px }` rule and all filters disabled. It checks actual cover tops, native image dimensions/ratios and carousel spans, theme-only/Clear/filter-only operation, an external blocker hiding slots 5/9, late inner-margin changes, seven widths and complete disabled-state restoration. Local `nested-layout-before.png` / `nested-layout-after.png` screenshots are saved when `BC_TEST_SCREENSHOTS` is set; these are representative fixtures, not the user's live account.

- `tests/home-surfaces.mjs`: native groups with competing backgrounds/pseudo-elements, a stretched grid item with shorter card content, real toolbar wrappers/reserved space, native skeleton-to-content loading, failed images and confirmed ad placeholders. Also covers native live-card shells and the special live/bangumi card's inner surface, decorative layers, title/creator colors and preserved pink live status. Checks no nested slabs, one padded category frost, native icon colors/divider width, content-bounded paint, sharp media, individual toolbar blur/stacking/actions, hidden-ancestor cleanup, preserved pending content, complete confirmed-ad slot removal, adaptive bright/dark/Clear colors, seven-width native/glass/restored geometry and no intersecting card paint shells. Target it with `$env:BC_TEST_HOME_SURFACES='1'; node tests/browser.mjs` (unset afterward).

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

`theme.js` registers direct information children of homepage video/live/skeleton shells, `.video-card > .video-card__info`, and the special live/bangumi card's `.floor-card-inner > .info-container`. Shells, structural title/metadata backgrounds and decorative pseudo backgrounds stay clear. `content.js` measures one existing owned glass layer from the corresponding cover's bottom edge through the information block's bottom, bounded by its shell and cover width. It covers the native 10px margin without modifying layout and uses only bottom corner radii. No tint or blur covers the thumbnail or unused grid-row space. Title text inherits readable ink while status badges retain native colors; other page types retain their content-panel treatment.

The live domestic homepage inspection found `.bili-video-card__image--wrap` / `.bili-video-card__cover` for media, `__info > __info--right` for information, `__info--tit` for the native clamped title, and `__info--bottom` containing `__info--icon-text`, `__info--owner`, `__info--author` and `__info--date`. Information had a 10px top margin, a 4px metadata gap and no native backdrop filter. The old theme targeted the full wrap for frost and then cleared the information block through a more specific home rule. Different shell shapes therefore controlled the visible background boundaries. The fix moves the material registration and paint bounds to the information area instead of adding a second surface.

The video material defaults to a .58 dark tint, 14px blur, .10 inset rim and 10px bottom radii, scaled by saved strength/blur and existing wallpaper/ink contrast adaptation. Reduced-transparency and no-backdrop fallbacks disable its blur. `tests/home-surfaces.mjs` adds competing wrapper, nested, gradient, pseudo, hover and selected backgrounds; checks exactly one thumbnail-width paint region per normal/loading/live/special panel; preserves native title clamping; and verifies loading replacement, media and seven-width geometry. `tests/settings.test.mjs` checks title and metadata contrast over both content and video materials for bright/dark wallpapers and custom ink. These rendering checks use representative local fixtures, not the user's live account. The installed unpacked extension still needs Reload followed by a Bilibili page refresh.

The category wrapper retains native dimensions/padding and paints no full-width slab. `content.js` derives one paint rectangle from the visible icon, category and shortcut groups, adds token-based breathing room within the native wrapper, and follows group resizing. Only the owned glass layer uses that rectangle. Home-scoped appearance rules clear structural group/pseudo backgrounds and shadows, preserving native button sizes and separator width. Floating toolbar wrappers are transparent; individual button shells own the glass and their blur follows the native stacking context. Invisible ancestors cannot leave ghost glass layers.

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

## Live homepage surface audit

The earlier surface audit below did not assert equal information-panel bottoms. Use the structural alignment regression and measurements at the end of this document for that acceptance criterion.

On 2026-10-27 the connected domestic Chrome profile confirmed two externally hidden recommendation slots while homepage filters were off. Earlier measurements found 40px/16px row offsets. The current update was inspected at 1024, 1280, 1440, 1600, 1920 and 2560 CSS pixels, DPR 1.5: each width had one category paint layer, transparent toolbar wrapper, zero measured row offsets, zero intersecting card paint shells and zero generated negative margins. Native grid gaps stayed 20px and the carousel retained `1 / 3` column/row spans. Native 1100px document width at a 1024px viewport is preserved. The viewport override was reset.

Evidence is Git-ignored under `tests/artifacts/home-audit`: `live-before.jpg`, `live-after.jpg`, `live-<width>.jpg`, `live-metrics.json`, plus local fixture `home-surfaces-<width>-native.png` / `home-surfaces-<width>-glass.png` and geometry JSON. Live screenshots span site reloads and may contain different recommendations; they are not a same-content pixel comparison. Local fixtures independently verify bright/dark wallpapers, loading transitions and native handlers without changing the user's saved preferences.

## Structural card bottom alignment

The connected domestic homepage was inspected before this correction at a 1652 CSS-pixel viewport. Its grid uses 20px gaps and the featured carousel spans rows `1 / 3`. A later row's `.feed-card`/`.bili-feed-card` grid item measured 234.2083px high, but the block chain `.bili-feed-card > .bili-video-card > .bili-video-card__wrap` stopped at 218.625px. Normal information panels ended at Y=984.875; the neighboring `.floor-card-inner > .info-container` ended at Y=999.7917, a 14.9167px mismatch. Native normal titles already reserved 44px in this variant; title line count was not the cause of that particular row mismatch. The prior glass layer correctly followed the unequal information rectangles and therefore retained unequal bottoms.

`theme.js` now scopes structural rules to real card slots directly inside `.recommended-container_floor-aside`, `.recommended-container_overseas`, and `.feed2` grids. `.feed-card`/`.bili-feed-card`, `.bili-video-card`/`.bili-live-card` and their wrap/skeleton children form a column-flex stretch chain. Media links keep their intrinsic size with `flex: 0 0 auto`; information uses `flex: 1 0 auto`. The verified `.bili-video-card__info--right:has(> .bili-video-card__info--bottom)` becomes a column with `justify-content: space-between`, retaining the native metadata margin and two-line title clamp. The corresponding live text shell and special floor inner/info shell receive the same treatment. Hidden skeletons and the carousel/sizing shims are excluded. No production JavaScript, fixed heights, offsets, negative margins or overflow hiding were added.

Chrome and Edge local fixtures verify both the inspected nesting/reserved-title variant and variable-height one-line/two-line/truncated titles. Maximum normal-panel differences were:

| Viewport (CSS px) | Before (px) | After (px) |
| --- | --- | --- |
| 1024 | 22.00 | 0.00 |
| 1280 | 22.00 | 0.00 |
| 1440 | 22.00 | 0.00 |
| 1600 | 22.00 | 0.00 |
| 1920 | 22.02 | 0.00 |
| 2560 | 22.00 | 0.00 |

Mixed rows including the special card's preserved 1px physical border measured <=1px after correction, within the 2px criterion. Normal uploader metadata also aligns at 0px. Exact grid tracks, column widths, gaps, carousel dimensions/span and thumbnail rectangles are unchanged; loading replacement and resize sequences pass. The full Chrome suite and 12 Node tests pass. These after measurements and guide screenshots are local browser fixtures, not a patched live-account capture; reload the installed extension and refresh Bilibili to apply the files there.

Evidence: `tests/artifacts/card-alignment/CARD-ALIGNMENT.md`, `card-alignment-metrics.json`, and six pairs of `cards-<width>-before.png` / `cards-<width>-after.png` with horizontal bottom-edge guides. Edge evidence is under `tests/artifacts/card-alignment-edge`. This structural correction changes runtime code only in `theme.js`; it adds `tests/card-alignment.mjs`, integrates it in `tests/browser.mjs`, updates the scoped geometry audit/comparisons in `tests/layout-parity.mjs`, `tests/home-surfaces.mjs`, `tests/liquid.mjs`, `tests/reference.mjs`, and updates `README.md`/`TESTING.md`. Existing glass changes in the working tree are retained.

## Live gray/dark material correction

Historical evidence: the normalization described below was later rejected because it flattened captions toward black. The current implementation and acceptance checks are described under “Glass material and feed spacing correction” below.

The latest connected homepage contained the exact reported Phigros, Zeabur and Penguin recommendations. At 1440, 1600 and 1920 CSS pixels, neighboring ordinary information bottoms differed by **0px**. Every named card had one owned glass layer with `rgba(20, 24, 32, 0.58)`, `blur(14px)`, opacity 1, no background image and `0 0 10px 10px` radii. The card/wrap, information, title/right/metadata/owner containers and their pseudo-elements were transparent, with no additional backdrop/filter or blend mode. Small native status badges retained their intentional colored backgrounds. No category-specific selector, duplicate panel, or injection-order conflict caused the reported gray/dark mismatch.

The responsible rule was `html[data-bc-enabled="true"][data-bc-page="home"] .bc-theme-surface-glass[data-bc-surface-kind="video-info"]`, using `--bc-video-info-bg` and `--bc-video-info-filter`. The source token in `settings.js` supplied blur alone. Blur smooths texture while retaining local brightness; 42% of the very different mountain/tree wallpaper brightness still passed through the identical tint. The earlier fixes incorrectly treated material equality and bounded geometry as sufficient evidence of equal visual surfaces.

The source now generates `blur(14px) contrast(0.15) brightness(0.25)` for the existing information backdrop filter at default settings. Tint, alpha, blur strength, rim, radii and layer count are unchanged. This compresses local backdrop brightness before the translucent tint is composited. Saved dark ink uses the mirrored filter to retain a readable light surface; Clear, zero strength and reduced-transparency/no-backdrop fallback paths disable normalization as appropriate. No geometry or other-page material rule changed in this correction.

After the user reloaded the extension and refreshed Bilibili, the actual running page was verified again:

| Viewport (CSS px) | Live background RGB spread before | After | Maximum panel-bottom difference before / after |
| --- | --- | --- | --- |
| 1440 | 58 | 3 | 0px / 0px |
| 1600 | 57 | 3 | 0px / 0px |
| 1920 | 52 | 6 | 0px / 0px |

RGB spread is the maximum per-channel difference between median background samples in the native blank gap above uploader metadata, across ordinary panels in the first two rows. Samples exclude text, badges and borders. JPEG compression can contribute a few levels. Recommendations changed on refresh, so these are background-material comparisons, not same-content screenshot diffs. All tested live panels shared one computed material before and after; the rendered material now remains dark across the different wallpaper regions. Actual hover checks at all three widths preserved the same material and 0px row deltas. Native scrolling/lazy loading grew the ordinary-card count to 27; visible rows still measured 0px deltas with one normalized paint layer per panel. Temporary viewport overrides were reset and the page returned to the top.

Live evidence is under `tests/artifacts/live-material`: `before-<width>.jpg`, `after-<width>.jpg`, `hover-<width>.jpg`, `before-metrics.json`, `after-metrics.json`, `hover-metrics.json`, `scrolled-metrics.json`, `scrolled-1920.jpg`, `rendered-material-pixels.json`, and `after-default.jpg`. The full Chrome suite, Edge rendered-material regression and all 12 Node tests pass. Custom-ink unit checks now evaluate contrast against the normalized composited backdrop, rather than treating it as unfiltered wallpaper.

Exact files changed for this material correction: `settings.js`, new `tests/video-material.mjs`, `tests/browser.mjs`, `tests/home-surfaces.mjs`, `tests/settings.test.mjs`, `README.md`, and `TESTING.md`. Earlier working-tree changes are retained; runtime `theme.js`/`content.js` were not changed in this correction.

## Featured carousel alignment

The live 1652px homepage grid allocated `.recommended-swipe` Y=265–722.25 across rows `1 / 3`. Its visible `.recommended-swipe-core > .recommended-swipe-body` stopped at Y=647.25. The native hidden `.recommended-swipe-shim` uses two complete skeleton cards in its first row, but only `.shim-card` covers in its second. The core's auto height therefore omits the second row's 10px margin and 65px information area. Its absolutely positioned body fills that shorter core instead of the correctly sized grid item. The native source is `https://s1.hdslb.com/bfs/static/shanks/laputa-home/assets/index-4d416e23.css`; the responsible downloaded rules are preserved with live evidence.

The live enabled baseline was captured at actual verified widths 1024, 1280, 1440, 1600, 1920 and 1652 CSS pixels. Maximum visible-carousel/second-row differences were 73, 73, 75, 75, 75 and 75px respectively. The first attempted capture batch failed to apply viewport overrides and was discarded/replaced. Screenshots and their matching measurements are in `tests/artifacts/carousel-live/before-<width>.jpg` and `before-metrics.json`.

The user then disabled the extension. Existing injected styles persisted until one page refresh; the verified native state has no extension-owned elements or enabled attribute. At the same six widths, the native visible carousel bottoms exactly match the enabled baseline. One second-row card has an additional native 40px top offset, producing maximum native gaps of 113, 113, 115, 115, 115 and 115px. The unshifted second-row bottoms still match the baseline, confirming the incomplete carousel shim exists in native Bilibili; it is not introduced by a theme height/span rule. All second-row cards, including the displaced one, are included in `native-metrics.json` and `native-<width>.jpg`. The earlier card margin correction remains unchanged.

`theme.js` adds `homeCarouselCSS`, scoped to the verified domestic direct grid child `.recommended-swipe:has(> .recommended-swipe-core > .recommended-swipe-body)`. Only that item becomes a column flex container and its core grows into the already allocated area. The native absolute body and VUI frame chain remain intact. `.carousel-area` / `.carousel-area-img` complete the media percentage-height chain; `.carousel-inner__img` becomes block-level to remove the inline baseline gap; its image uses `object-fit: cover` without filtering or changing its intrinsic proportions. The existing blocked-media placeholder fills the same frame. Native footer title, mask, dots, arrows, slide transforms and handlers remain in place. No grid placement/tracks/gaps, ordinary-card selectors, material tokens, fixed carousel heights, offsets or JavaScript sizing were added.

`tests/carousel-alignment.mjs` reproduces the inspected nested structure, including the incomplete hidden shim. Removing only the correction reproduces a 75px gap. Chrome and Edge then measure 0px at all six requested widths, asserting exact equality of every ordinary card's slot/cover/info/title/metadata rectangles, grid tracks, column widths, gaps, carousel allocation and span before/after. It also checks full-frame sharp images, controls inside the frame, next-row clearance, manual and automatic slides, loading/blocked states, asynchronous title replacement and resizing. The full Chrome suite and all 12 unit tests pass. Existing parity fixtures retain strict external carousel geometry checks; the stylesheet audit allows the new fill declarations only under the precise carousel scope.

```powershell
$env:BC_TEST_NO_SANDBOX='1' # Restricted local fixture environment only.
$env:BC_TEST_CAROUSEL_ALIGNMENT='1'
$env:BC_TEST_SCREENSHOTS='tests/artifacts/carousel-fixture'
node tests/browser.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'
Remove-Item Env:BC_TEST_CAROUSEL_ALIGNMENT
```

`node tests/carousel-live-evidence.mjs` wraps authentic saved JPEG screenshots in self-contained SVGs with cyan carousel-bottom and orange second-row-bottom guides, without injecting an overlay into the live account page. It checks matching grid allocations and the <=2px criterion once live after measurements exist, and generates a measurement report. Runtime changes for this correction are confined to `theme.js`. Test/documentation files are `tests/carousel-alignment.mjs`, `tests/carousel-live-evidence.mjs`, `tests/browser.mjs`, `tests/layout-parity.mjs`, `README.md` and `TESTING.md`; earlier working-tree changes remain intact.

After the user re-enabled/reloaded the extension and refreshed Bilibili, the actual running page passed all six requested widths. Each second-row information bottom equals the visible carousel bottom:

| Width (CSS px) | Carousel before | Ordinary row 2 before / after | Carousel after | Maximum after difference |
| --- | --- | --- | --- | --- |
| 1024 | 618.00 | 691.00 (2 cards) | 691.00 | 0.00 |
| 1280 | 653.06 | 726.06 (2 cards) | 726.06 | 0.00 |
| 1440 | 635.54 | 710.54 (3 cards) | 710.54 | 0.00 |
| 1600 | 635.54 | 710.54 (3 cards) | 710.54 | 0.00 |
| 1920 | 742.54 | 817.54 (3 cards) | 817.54 | 0.00 |
| 1652 (original width) | 647.25 | 722.25 (3 cards) | 722.25 | 0.00 |

The first two grid tracks, columns, gaps, carousel grid allocation/span and every measured ordinary cover/info/title/metadata rectangle in those rows exactly match the enabled before baseline. Recommendations changed on refresh and later-row counts differ; screenshots are not same-content pixel comparisons. The same-content local regression separately asserts exact parity across all ordinary cards and grid tracks.

Live next and previous clicks changed the active slide 6→7→6 while retaining a 457.25px frame and 0px alignment difference. Actual autoplay changed slides at each of the six widths with unchanged height and 0px differences. A tab replacement interrupted the first 1920px autoplay attempt; that sample was discarded and repeated on the fresh tab. Scrolling triggered asynchronous recommendations (8 ordinary cards initially, 18 after scrolling, up to 28 after loading/resizing). A second six-width resize pass retained 0px differences, controls fully inside the frame, and 44px/60px clearance before the next row's visible cards. The loaded active image measured 976×549 intrinsic pixels, filled the complete frame using `object-fit: cover`, and had `filter: none`; inspected native carousel ancestors also had no filter/backdrop filter. The ordinary video-information normalization token remains `blur(14px) contrast(0.15) brightness(0.25)`. Temporary viewport overrides were reset and the live page returned to the top.

Live evidence: `tests/artifacts/carousel-live/LIVE-CAROUSEL.md`, `before-metrics.json`, `native-metrics.json`, `after-metrics.json`, `interactions.json`, six sets of `before/native/after-<width>.jpg` with corresponding `*-guides.svg` annotations, and `after-default.jpg`. The exact native responsible stylesheet rules are in `native-responsible-rules.css`.

## Glass caption spacing

Glass captions now use 10px top and 12px side/bottom padding. The native thumbnail-to-caption margin moves inside that padded area; special-card cover margins are cleared to avoid doubling the gap. Category paint padding is 12px, clipped to the native navigation wrapper. These rules apply to actual homepage feed slots in Glass mode; carousel sizing shims, Clear mode and the disabled theme retain their original spacing. Grid columns/gaps, thumbnail ratios and title clamping stay native; row heights can grow with the padded content.

`tests/card-alignment.mjs` measures the full active CSS at six widths (1024–2560px), including title/metadata clearance, consistent padding, aligned panel bottoms, long titles, skeleton replacement, subsequent resizing, all three feed selectors and restoration in Clear/disabled states. `tests/home-surfaces.mjs` checks the category paint inset against the group and wrapper bounds. Local visual evidence is in `tests/artifacts/glass-spacing/spacing-1440-before.png` and `spacing-1440-after.png`, with six-width card measurements and screenshots in the same directory.

The older geometry audits use `measureNativeLayout` to temporarily remove `homeCardSpacingCSS` and suspend feed-margin markers during synchronous measurement, restoring both before paint. This keeps their strict native grid/media/navigation comparisons useful while the card alignment regression independently verifies the requested spacing with all styles active. The stylesheet audit permits only the exact scoped caption rules alongside the existing structural exceptions.

## Glass material and feed spacing correction

The follow-up screenshot exposed three gaps in the earlier acceptance checks: brightness normalization made captions nearly black; equal top margins on an entire row were ignored; and the native special-card cover's `height:100%` consumed its stretched shell and displaced the caption. The saved official stylesheet confirms `.single-card.floor-card .cover-container { height:100% }` and homepage `nth-of-type` margins of 40px/24px. The live browser connection was unavailable for this correction; validation uses the screenshot and these saved native styles in local Chrome/Edge fixtures.

`settings.js` now gives captions the adaptive content tint with `blur(14px) saturate(1.4)` at defaults. There is no brightness/contrast compression or inversion, and contrast unit checks use the unmodified backdrop. `theme.js` lets the special cover's existing ratio shim determine its height. `minimalist.js` clears positive top margins along visible cover wrapper chains, including margins shared by every card in a row, so the site's own row gap supplies the separation. Hidden skeleton covers are skipped. Disabling both the theme and filters restores the saved margins.

The card regression now includes the native percentage-height cover, the 40px-plus-20px row-gap reproduction, hidden skeleton siblings, late loading and six-width resizing. It asserts actual row gaps, caption/metadata bounds and aligned bottoms with the full CSS active. The material regression recreates the old blackening filter, then verifies visible wallpaper variation after removing it, shared tint, unchanged geometry, hover/scroll/loading and dark ink. Evidence is under `tests/artifacts/glass-correction`, including `rows-1440-after.png` and `material/material-<width>-before.png` / `material-<width>-after.png`.

## Scroll rendering and native live captions

The saved native live-card CSS uses a visibility-hidden sizing skeleton, an absolutely positioned loaded wrap, and a caption height of one title line plus one subtitle line and a 4px gap. The former fixture omitted that height and positioning. With glass padding, the real uploader overflowed the information region. In Glass mode the loaded wrap now participates in flow, its inactive skeleton leaves flow, the caption grows naturally, and the uploader keeps its intrinsic height. Loading and Clear/disabled states retain their native behavior.

Document content glass now uses absolute document coordinates, so the browser scrolls it with its native card without JavaScript repositioning. Fixed/sticky/nested-scroll surfaces retain viewport positioning. A 400px intersection margin prepares nearby content; resize, document-height changes and DOM updates refresh cached geometry. Ordinary window scrolls measure only viewport-attached surfaces. Card state changes mark just their own surfaces dirty. Paint changes only differing CSS properties. Feed-margin observation compares layout-related inline properties and ignores preview/stat opacity mutations, while retaining late wrapper-margin repairs. An already-active page sync no longer schedules a redundant feed pass.

`tests/scrolling.mjs` adds 120 recommendations and native live-card CSS. A 48-frame scroll plus preview-opacity workload measured the following in local Chrome (not an FPS or live-account benchmark):

| Work during sample | Before | After |
| --- | --- | --- |
| Card rectangle reads | 6,997 | 29 |
| Computed-style reads | 18,778 | 1,920 |
| Glass style mutations | 399 | 41 |
| Maximum scroll-event glass drift | 2px | 0px |

The regression also verifies uploader/panel bounds at six widths, loading transitions, newly visible rows after large scrolls, bounded layer count and refresh after a layout shift above the feed. Edge runs the same checks. The live browser connection remains unavailable; the evidence is from isolated local browser profiles. Run with `$env:BC_TEST_SCROLLING='1'; $env:BC_TEST_SCREENSHOTS='tests/artifacts/scroll-rendering'; node tests/browser.mjs`. Set the mode to `before` only to record a diagnostic baseline without enforcing the new bounds/performance assertions. The full suite includes this regression. JSON counts and screenshots are saved in `tests/artifacts/scroll-rendering`.
