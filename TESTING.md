# 功能检查与验证 / Feature audit and testing

针对版本 2.6.3；保留原生 MV3 架构、schemaVersion 2、BC_THEME 协议、所有原默认设置和 Windows 98 面板。没有新增权限或运行时依赖。

## 跨页面问题与架构

根因包括：全页面字体/透明规则破坏了原生组件的前景与底色配对；固定深色表面不适合深色文字；统一纯黑/纯白编辑区造成黑块；动态页的编辑器与侧栏缺少表面规则；评论的全后代/伪元素字体填充覆盖了状态图标；单评论容器与定时扫描无法妥善处理多个及延迟创建的 Shadow DOM。

- `theme.js` 维护 home、dynamic、video、space、search、article、opus、bangumi、live、other 页面档案。先按域名和明确路径识别，再按布局标记识别；结果写入可恢复的 `data-bc-page`。CSS 按共享组件和对应页面分别生成，只注入一个样式节点。未知布局保留原内容样式，并应用共享导航、评论、浮层及壁纸逻辑。
- 移除了 `:where(*)` 背景清空和全后代 `-webkit-text-fill-color`。只对已登记的页面画布、表面和正文/次要文字进行覆盖；保留媒体封面、徽章、进度条、SVG、图标字体、按钮背景及原生状态。嵌套表面不重复叠加毛玻璃。
- `BC.tokens()` 保留用户文字色，生成相配的亮/暗表面、次要文字、链接、占位符、边线和焦点颜色。壁纸上采用单一可读性底幕，避免在每个字段上铺设黑块；Glass 浓度和模糊仍使用原设置，Clear 表面浓度/模糊仍为零。底幕会影响壁纸亮度，尤其在中灰文字和低透明度组合下；它独立于玻璃浓度，用于保障文字可读性。
- 动态编辑器和评论编辑区采用透明字段，搜索框采用轻微表面色，浮层采用独立表面。聚焦样式不修改编辑行为或拦截键盘事件。弹窗仅调整主题预览，与页面使用相同色板；Windows 98 外框、布局与设置控件保持不变。
- SPA 通过 Navigation API、popstate/hashchange 和相关新增节点更新；MutationObserver 只检查变动子树。评论支持多个根及延迟 Shadow DOM，移除了固定全页轮询，使用有限重试、whenDefined 和 ResizeObserver；移除、关闭主题及退出页面时清理注入样式、观察器、帧任务和媒体资源。

对比度计算参考 [WCAG 2.2 最低对比度说明](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)。自动化检查正文、次要文字及占位符的目标为正常文字 4.5:1；保留原生品牌按钮/状态色不代表对 Bilibili 全部组件作出 WCAG 合规保证。

## 检查结果

| 功能 | 修改前状态 | 本次处理 |
| --- | --- | --- |
| 自定义背景 | 六种格式、20 MiB 上限、静态图缩放、GIF 保留和 MP4 播放已实现；相同版本通知会重复处理背景，弹窗预览缺少暂停与清理 | 按 revision 去重；预览随主题启用状态和标签可见性暂停/恢复，关闭时释放媒体；损坏背景回退渐变，不阻塞设置读取和重置 |
| 毛玻璃与透明 | 两种材质、两种范围和调节控件已实现；导航浓度固定，嵌套搜索/资料卡/菜单与外置玻璃可能重复模糊 | 导航使用共享浓度变量；嵌套浮层只保留外层材质；已有外置玻璃的搜索浮层取消内部模糊；隐藏浮层移除对应玻璃 |
| 字体颜色 | 实时持久化已实现；通用规则会覆盖控件、SVG 和图标，统一底色在动态编辑器产生黑块 | 组件色板和单一壁纸可读性底幕；区分正文、次要文字、链接与占位符；编辑字段不再使用纯黑/纯白背景 |
| 导航控件 | 独立开关、分组和全局操作已有完整实现 | 保留共享目录和 CSS 隐藏逻辑；修复并发操作因较新状态而误报旧后台的问题；验证分组、全局、动态节点及刷新 |
| 站内界面 | 搜索、菜单、资料卡、简介和评论已有适配；后插入频道栏可能未发现 | 保留现有适配，修复嵌套材质及浮层清理；按相关节点变化发现 SPA 导航/频道栏，避免对每次 DOM 变化重算布局 |
| 国际化 | 默认语言识别、中文/英文切换和保存已实现；UI 缺少重新选择自动语言的入口 | 加入双语 Auto / 跟随浏览器选项，直接保存现有 language: auto，无需修改数据结构 |

旧数据处理还包括：优先迁移已有 bc.settings，兼容旧 settings.backgroundImage / hideDownloadButton，迁移写入失败时保留原记录，拒绝覆盖更新版本的设置，共享并发启动请求。

## 自动化验证

仅开发测试使用 Node.js（本次为 24.18.0）和本机 Chrome / Edge。只使用 Node 内置模块，无需 npm install。

```powershell
node --test tests/settings.test.mjs tests/theme.test.mjs
node tests/browser.mjs
# 可选：保存动态页亮/暗文字的人工检查截图（此目录已被 Git 忽略）：
$env:BC_TEST_SCREENSHOTS = 'tests/artifacts'
# 浏览器位于其他位置时，也可显式传入一个或多个可执行文件路径：
node tests/browser.mjs 'C:/Program Files/Google/Chrome/Application/chrome.exe'
```

浏览器脚本创建独立的临时配置和仅绑定 127.0.0.1 的测试服务器，结束时关闭测试浏览器并删除该临时配置。不会使用个人浏览器配置。受限执行环境若无法启动 Chromium 渲染进程，可以仅为本地受控测试设置 `$env:BC_TEST_NO_SANDBOX = '1'`；正常本机测试保持默认沙箱。

- 设置与分类测试：10 项通过。包含六种 MIME 校验、精确 20 MiB 边界、216 种文字颜色及最不利壁纸组合的对比度、两种旧存储布局迁移、失败重试、损坏背景、高版本保护、并发写入、多客户端同步、重启、恢复默认、通知去重，以及实际域名/路径和布局回退分类。
- 浏览器测试：Chrome 156.0.8078.47、Edge 156.0.4314.42。覆盖真实 DOM/CSS、播放器颜色/媒体背景保护、输入底色、嵌套材质、浮层隐藏、SPA 导航与频道后插入、评论 Shadow DOM、关闭主题恢复页面原属性/变量、刷新、双语切换、分组/全局隐藏、PNG/JPG/WebP 实际转换缩放、GIF 原始数据保留、超限文件拒绝、真实生成的 MP4 解码和静音循环、切换真实测试标签暂停/恢复、视频刷新恢复、移除背景与恢复默认。
- 页面矩阵：每个浏览器 200 组组合（10 类布局 × 2 种材质 × 2 种范围 × 5 种背景：渐变/白图/黑图/GIF/真实 MP4），另检查 10 类布局的主题关闭恢复。交替使用白、黑、灰、红文字，覆盖零浓度/零模糊；验证正文/次要文字对比度、动态编辑区透明、占位符、发布按钮及禁用状态、媒体封面、徽章、进度条、SVG 和图标字体。包含搜索输入、原生 contenteditable 插入文字、菜单点击、多个及延迟评论根、纯 pushState/back 导航与刷新。
- 视觉检查：已生成并检查 Chrome / Edge 的动态页白色与深色文字截图，位于 `tests/artifacts/Chrome`、`tests/artifacts/Edg`。这些是本地代表性布局，不是用户参考图或 Bilibili 登录页面截图。
- 静态检查：四个生产 JS 文件的语法检查、manifest JSON/入口资源检查、git diff --check。

测试边界：设置测试运行真实 settings.js 后台代码，模拟 Chrome 的消息与存储接口。浏览器测试加载真实 popup / content / settings / theme 源码，但消息与存储通过本地测试桥连接该后台代码；它不是在扩展商店安装或真实 Bilibili 会话中运行。在线检查中动态页返回 HTTP 412，搜索入口重定向到浏览器兼容提示，未把在线失败页面计为通过。

## 手动验收

1. 在 chrome://extensions/ 或 edge://extensions/ 重新加载扩展，刷新 Bilibili；检查扩展、后台、弹窗和页面控制台没有新错误。
2. 分别上传 PNG、JPG、WebP、AVIF、动态 GIF 和 MP4。静态图应自动缩放，GIF 应持续动画，MP4 应静音循环；超过 20 MiB 应拒绝且保留原背景。切走/返回标签页检查视频暂停/恢复；刷新和重启浏览器后检查设置保留。
3. 组合切换 Glass / Clear、All Elements / Content Panels，测试浓度 0 与 90、模糊 0 与 30、点缀色和黑/白/红/灰文字。查看搜索建议、悬浮菜单、资料卡、视频简介和评论；检查只有一层玻璃、输入可读、图片/视频清晰、播放器图标和点击操作正常。
4. 逐项、按组、全局隐藏/显示导航。在首页、视频、个人空间等页面之间导航，并滚动到固定频道栏出现后检查；刷新后开关应保留。特别检查 Bilibili 不同页面版本的“更多”菜单和悬浮工具栏。
5. 在中文、English 和跟随浏览器之间切换，重开面板确认保存；在不同浏览器语言的配置中检查首次默认语言，以及上传失败、超限、断开扩展等错误提示。
6. 关闭主题检查站点恢复、视频暂停且注入层被清除；重新启用检查效果恢复；点击恢复默认，确认所有选项、语言和渐变背景恢复。使用旧版本配置更新后，检查背景、隐藏下载按钮和其他偏好仍在。
7. 重点在 t.bilibili.com 检查编辑器标题、内容、占位符、表情/上传/发布按钮、关注直播和热门话题侧栏；分别在默认/亮/暗壁纸上使用白/黑/灰/红文字，以及 Glass/Clear 和两种范围。之后检查搜索、专栏/Opus、番剧、直播及未知子域；原生交互、媒体覆盖层和状态色应保留。

## 已知限制

- 自动化使用模拟站点结构；Bilibili 的实际 DOM/A-B 版本、登录菜单、播放器全屏、不同缩放比例与真实账号交互仍需上述手动验收。
- 自动化验证 AVIF 的存储格式校验，尚未使用真实 AVIF 文件验证解码与转换；GIF 验证数据保留，实际多帧播放需手动检查。
- MP4 的解码能力取决于浏览器支持的编码格式，不是所有 MP4 容器内的编码均能播放；不支持时显示现有双语错误，不替换原背景。
- 本次没有在最低支持版本 Chrome 114 上运行，也没有完成长时间性能/内存测量。扩展继续使用原有 minimum_chrome_version 和权限。
- 附件没有实际参考截图，因此未做与用户 Screenshot 1/2 的像素对照。中间亮度的自定义文字可能需要很强的背景底幕，壁纸会相应变暗或变亮；不会修改保存的文字色、透明度或默认设置。

## English

Version 2.6.3 preserves the native MV3 architecture, schema version 2, BC_THEME protocol, original defaults, Windows 98 popup, permissions, and dependency-free installation.

All six feature groups already existed. Fixes cover duplicate media loads, legacy migration and damaged backgrounds, popup video lifecycle, header opacity, nested glass, hidden popover cleanup, player/media protection, contrasting input backgrounds, late SPA headers/channels, and false outdated-worker errors during concurrent edits. The missing Auto language choice now uses the existing language setting.

Page-aware profiles replace global transparency/text-fill overrides. Component palettes retain the configured text color, distinguish secondary text/links/placeholders, and preserve native media/status/control styling. A single wallpaper readability veil replaces solid input rectangles; it can substantially shade wallpaper for midtone text, independently of glass opacity. Composer/comment fields remain transparent. Observers handle route changes, multiple/delayed comment roots and cleanup without a full-page polling interval.

Run the commands above with Node.js and installed Chrome/Edge; no npm packages are needed. Ten settings/classification tests pass. Each browser also runs 200 page/material/coverage/background combinations plus 10 disabled layouts, interaction and SPA checks. Dynamic-page screenshots are generated in the ignored artifact directory. These use real rendering and MP4 playback in isolated temporary profiles, with a local bridge simulating Chrome messaging/storage around the actual service worker source. They do not replace testing an installed extension on Bilibili; live-page access was intercepted, and the attachment contained no reference screenshots.

For acceptance, reload the extension and Bilibili; upload all six formats, test oversized files and animated playback; switch tabs and restart; exercise both materials and coverage modes, extreme opacity/blur and varied text colors; inspect search, menus, profile cards, descriptions and comments; test individual/group/global navigation controls across SPA routes; switch Chinese/English/Auto; disable/re-enable and restore defaults; upgrade existing saved settings.

Remaining manual checks include real AVIF decoding and animated GIF playback, Bilibili DOM variants and account interactions, full-screen controls, display scaling, Chrome 114 and extended performance/memory profiling. MP4 playback remains subject to the browser's supported codecs.
