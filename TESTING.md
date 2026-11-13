# Verification

## Current renderer: native CSS glass globally

Every supported page uses CSS backdrop filters on its existing navigation, content panels, captions and menus. Open comment shadow roots receive CSS on their real block lists. The extension creates no header/channel/surface/popover glass elements, measures no glass rectangles, and has no glass scroll/resize/pointer observers or listeners. The wallpaper host remains the existing background/media container.

`content.js` manages settings, wallpaper playback, page classification, explicit filters and comment styles. `theme.js` generates native glass rules and suppresses nested content frost. The header and native popover containers frost their static CSS background pseudo-element, leaving the container unfiltered so overflowing child menus can sample the page. No DOM glass nodes are created. Homepage captions paint within their padded information boxes; the existing category bar owns its material. Floating comment editors keep an unfiltered outer comment host so native fixed positioning remains intact. Native menus and dialogs continue to function.

Saved wallpaper/media, opacity, blur, accent, text color, navigation choices and filter preferences are preserved. Clear removes the extension frost/tint; disabling restores the site's styles. Reduced-transparency and unsupported-backdrop modes use the shared stronger tint fallback. The independent feed-margin correction and card stretching remain in place.

## Run locally

Requires Node.js and installed Chrome or Edge. There are no npm dependencies or build steps.

```powershell
node --test tests/settings.test.mjs tests/theme.test.mjs
node tests/browser.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node tests/browser.mjs 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

The browser harness creates an isolated temporary profile, runs against local fixtures and the actual extension sources, and closes/removes only that temporary profile. It never connects to the user's logged-in browser or sends real messages. Message fixtures use fictional conversations and local mock handlers. Native source CSS is retained under `tests/fixtures` where available; other fixtures reproduce representative public component structures.

For screenshots, set `BC_TEST_SCREENSHOTS` to a directory under `tests/artifacts`. Those generated artifacts are Git-ignored. Remove mode-specific environment variables before running the full suite.

Targeted checks:

| Environment variable | Coverage |
| --- | --- |
| `BC_TEST_NATIVE_GLASS=1` | Three material levels, native surfaces, menus, wallpaper contrast, media, four page types, fallback and Clear |
| `BC_TEST_HOME_SURFACES=1` | Native category/caption/tool surfaces, sharp covers, loading, hover, ads and geometry |
| `BC_TEST_CARD_ALIGNMENT=1` | Caption insets, row/metadata alignment, grid gaps and loading/resizing |
| `BC_TEST_SCROLLING=after` | No glass rectangle/style reads or writes while scrolling, native caption paint and feed-margin restoration |
| `BC_TEST_NATIVE_WATCH=1` | Native player/dock CSS, floating comment editor, media, controls and restoration |
| `BC_TEST_WATCH_COMMENTS=1` | Rendered comment blur, unchanged replies, scrolling, reduced transparency, Clear and disabled cleanup |
| `BC_TEST_SPACE_PAGE=1` | Profile header, portrait, actions, content insets, contrast and responsive layout |
| `BC_TEST_MESSAGE_CENTER=1` | Inbox/chat/notifications/settings, rich text, editor drafts, native menus and zero overlay elements |
| `BC_TEST_SUBPAGE_MENUS=1` | Profile/services/theme, messages, favorites, history, upload, search, nested/portaled menus and interactions |
| `BC_TEST_GLASS_CONSISTENCY=1` | Rendered checkerboard frost under the header, profile, submenu and manga menu; zero blur, reduced transparency, Clear and restoration |

Example:

```powershell
$env:BC_TEST_NATIVE_GLASS='1'
$env:BC_TEST_SCREENSHOTS='tests/artifacts/global-native-glass'
node tests/browser.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'
Remove-Item Env:BC_TEST_NATIVE_GLASS,Env:BC_TEST_SCREENSHOTS
```

## Acceptance criteria

- No extension-owned glass overlay elements in any page/material/background combination, including SPA page changes, scrolling, resizing and native popup interactions.
- The scrolling regression records zero glass-related card rectangle reads, style reads and style writes; normal feed-margin repair still works when actual margins change.
- Native/themed/restored comparisons retain columns, gaps, thumbnails, responsive breakpoints, typography, scroll areas and event targets. Requested caption/profile/watch insets are checked separately.
- The CSS audit accepts the exact generated native backdrop and static background pseudo-element declarations, documented inset rules and explicit filters. It continues rejecting unrelated layout or media filters.
- Normal/loading/live/special video cards have one material on the native information area, sharp media, readable text and aligned row bottoms.
- Comments use native CSS frost on actual lists. Pixel sampling confirms wallpaper detail is blurred without changing reply geometry. The outer shadow host remains unfiltered; fixed/sticky editors retain their behavior.
- Menus retain size, position, native colored badges and action states. Nested content shares its parent's material; independently positioned submenus keep their own backing. Pixel sampling verifies actual frost on overflowing menus, since computed blur alone can hide a backdrop-root failure.
- Message rich text has no input frames. Draft text and editor nodes survive appearance updates; outgoing blue bubbles, Send, unread counts and media retain native styling.
- Bright/dark custom backgrounds, custom ink, Clear, reduced transparency, failed media, reload, disable, storage migration and restoration remain covered.

The full Chrome suite passes, including 200 compatibility combinations across ten original page types, explicit profile/message checks, seven-width layout comparisons and continuous resizing. Edge's global material and native watch-page checks pass. All 12 Node tests pass. These are local fixture results, not a live-account audit.

Reload the unpacked extension and refresh existing Bilibili tabs after changing content-script files. No settings reset is required.

Earlier measurements and the removed positioned-layer architecture are archived in [Historical glass implementation audits](docs/GLASS_HISTORY.md). They are historical evidence, not the current implementation contract.
