<div align="center">
  <img src="assets/logo.png" width="210" alt="B哩B哩主题 / Bilibili Theme Customizer Logo">
  <h1>B哩B哩主题 / Bilibili Theme Customizer</h1>
  <p>给哔哩哔哩换上你的壁纸和玻璃质感。<br>Make Bilibili look and feel like yours.</p>
  <p>
    <kbd>🖥️ Chrome / Edge</kbd>
    <kbd>🪟 Windows 98 UI</kbd>
    <kbd>🌐 中文 / English</kbd>
    <kbd>🔒 Local only</kbd>
  </p>
  <p><a href="#zh">中文介绍</a> · <a href="#en">English guide</a></p>
</div>

---

<a id="zh"></a>
## 🇨🇳 中文

这是一个 Chrome / Edge 扩展，可以自定义哔哩哔哩的背景、界面材质和部分导航按钮。控制面板采用 Windows 98 风格，设置保存在浏览器本地。

### ✨ 功能介绍

| 功能 | 说明 |
| --- | --- |
| 🖼️ 自定义背景 | 上传 PNG、JPG、WebP、AVIF、GIF 或 MP4。每个文件最大 **20 MB**。静态图片会缩放并转换为 WebP；GIF 保留动画；MP4 静音循环播放，切走标签页时暂停。 |
| 🧊 毛玻璃与透明 | 在“毛玻璃”和“透明”之间切换，调整玻璃浓度、模糊强度和点缀色。可选择全元素或内容面板范围。 |
| 🎨 字体颜色 | 自定义网页文字颜色；输入框底色会随所选文字颜色调整。 |
| 🧭 导航整理 | 分别隐藏顶部左侧、首页频道图标、分类、快捷入口、更多频道和悬浮工具栏中的项目；支持一键隐藏或显示整组。 |
| 🪟 站内界面 | 搜索建议、悬浮菜单、个人资料卡、视频简介和评论区等区域也会应用主题效果。 |
| 🌐 双语面板 | 默认跟随浏览器语言，也可在弹窗中选择“跟随浏览器”、中文或 English；选择会自动保存。 |

### 🚀 安装教程

1. 下载或克隆本项目，保留整个文件夹，包括 `assets` 目录。
2. Chrome 打开 `chrome://extensions/`；Edge 打开 `edge://extensions/`。
3. 打开右上角的**开发者模式**，点击**加载已解压的扩展程序**。
4. 选择**包含 `manifest.json` 的项目文件夹**，不是 `assets` 子文件夹。
5. 打开或刷新哔哩哔哩网页，点击浏览器工具栏中的扩展图标设置背景和效果。

> [!TIP]
> 修改插件文件后，先在扩展管理页点击**重新加载**，再刷新哔哩哔哩标签页。只关闭并重开设置弹窗不会更新网页脚本。

### 🔐 文件与权限

图片和视频只保存在浏览器本地，不会由本插件上传。`storage` 用于保存设置；`unlimitedStorage` 用于容纳最大 20 MB 的背景文件。无需 Node.js、npm 或构建步骤。

<details>
<summary>🛠️ 点击隐藏按钮没反应，或出现 settings.js 加载错误？</summary>

先检查弹窗底部和扩展管理页的错误信息。确认扩展加载的是当前项目文件夹，在扩展管理页点击**重新加载**，然后刷新已打开的哔哩哔哩页面。如果错误列表里只剩旧记录，可以清除记录后再看错误是否重现。

</details>

### 🧪 开发验证

功能检查结果、自动化测试命令和 Chrome / Edge 手动验收步骤见 [TESTING.md](TESTING.md)。测试工具仅用于开发，扩展仍可直接加载，无需安装依赖或构建。

---

<a id="en"></a>
## 🌍 English

A Chrome / Edge extension for customizing Bilibili backgrounds, glass effects, and selected navigation controls. Its settings panel has a Windows 98 style, and settings stay in your browser.

### ✨ Features

| Feature | Description |
| --- | --- |
| 🖼️ Custom backgrounds | Upload PNG, JPG, WebP, AVIF, GIF, or MP4 files up to **20 MB each**. Static images are resized and converted to WebP. GIFs remain animated. MP4 videos loop silently and pause when the tab is hidden. |
| 🧊 Frosted glass or clear | Choose a frosted or transparent interface, then adjust opacity, blur, accent color, and whether the effect covers all elements or content panels. |
| 🎨 Text color | Pick a page text color. Input backgrounds adapt to keep the text readable. |
| 🧭 Navigation controls | Hide individual items in the top-left navigation, home channels, shortcuts, More menu, and floating toolbar. Hide or show an entire group with one click. |
| 🪟 Site UI | The theme also styles search suggestions, hover menus, profile cards, video descriptions, and comments. |
| 🌐 Two languages | Follow the browser language by default, or choose Auto, 中文, or English in the popup. Your choice is saved. |

### 🚀 Installation

1. Download or clone this project. Keep the whole folder, including `assets`.
2. Open `chrome://extensions/` in Chrome or `edge://extensions/` in Edge.
3. Enable **Developer mode**, then click **Load unpacked**.
4. Select the **project folder containing `manifest.json`**, not the `assets` subfolder.
5. Open or refresh Bilibili and click the extension icon in the browser toolbar.

> [!TIP]
> After changing extension files, click **Reload** on the extensions page, then refresh your Bilibili tabs. Reopening the popup alone does not refresh scripts already running in a tab.

### 🔐 Local files and permissions

Background images and videos stay in local browser storage; this extension does not upload them. `storage` saves your settings, while `unlimitedStorage` allows background files up to 20 MB. No Node.js, npm, or build step is required.

<details>
<summary>🛠️ Hide buttons do nothing, or settings.js fails to load?</summary>

Check the popup status and errors on the extensions page. Make sure Chrome or Edge loaded the current project folder, click **Reload**, and refresh open Bilibili tabs. Clear old errors if needed, then check whether a new error appears.

</details>

### 🧪 Development checks

See [TESTING.md](TESTING.md) for the feature audit, automated commands, and Chrome / Edge acceptance steps. Test tools are optional; loading the extension still requires no dependencies or build step.

---

## 📁 项目文件 / Project files

| 文件 / File | 用途 / Purpose |
| --- | --- |
| `manifest.json` | 扩展入口、权限和图标 / Extension entry, permissions, and icons |
| `popup.html` · `popup.css` · `popup.js` | 双语设置面板 / Bilingual settings popup |
| `content.js` | 网页背景与玻璃效果 / Page backgrounds and glass effects |
| `theme.js` | 页面识别与组件主题样式 / Page classification and component theme styles |
| `settings.js` | 共用设置和扩展后台 / Shared settings and service worker |
| `assets/logo.png` | 完整 Logo / Full logo |
| `assets/icon-16.png` · `icon-32.png` · `icon-48.png` · `icon-128.png` | 浏览器与弹窗图标 / Browser and popup icons |

## 📄 许可 / License

本项目使用 [GNU GPL v3](LICENSE) 许可。 / This project is licensed under the [GNU GPL v3](LICENSE).

## 极简首页 / Minimalist homepage

在扩展弹窗的 **极简模式** 分组中启用。默认关闭，不会改变已有用户的主题或导航偏好；也可在关闭「启用主题」时独立使用。

- 开启后默认隐藏可明确识别的广告和顶部活动横幅，使用紧凑导航与响应式视频网格。轮播默认保留。
- 频道精简、轮播隐藏、推荐区装饰隐藏和悬浮工具栏精简均可独立开关。在「选择精简频道中显示的分类」中选择分类；原有「导航与按钮」隐藏设置优先，原生「更多」菜单不被重建。
- 网格随窗口宽度显示约 5 / 4 / 3 / 2 / 1 列；保留原视频节点、封面预览、视频信息和链接。发布时间等信息仅保留站点实际提供的内容，不伪造缺失数据。
- 广告判据限于推荐卡片内明确的广告类名、广告属性及已知广告位；不读取标题或 UP 主名字判断广告。未知结构保留，避免误删普通视频。动态插入卡片及延迟出现的广告标记由 CSS 自动处理。
- 样式仅作用于首页，切到视频、动态、空间等页面会退出；关闭极简模式可恢复原布局。壁纸、GIF、MP4、玻璃/透明材质和文字颜色继续由原主题设置控制。

更新扩展文件后，在扩展管理页点击 **重新加载**，再刷新 Bilibili。真实站点的不同 DOM/A-B 版本仍需手动验收，参见 [TESTING.md](TESTING.md)。

Enable **Minimalist Mode** in the extension popup. It is off by default, preserves existing theme/navigation preferences, and works independently of **Enable theme**.

- Defaults hide explicitly identifiable ads and the promotional banner, compact the header, and enable a responsive 5/4/3/2/1-column video grid. The featured carousel stays visible.
- Compact categories, carousel hiding, recommendation decorations and the minimal toolbar each have separate switches. Choose visible categories in the category picker. Existing navigation hiding takes priority; the native More menu is preserved.
- Original video nodes, links, preview handlers and available metadata stay intact. Missing publication dates or other information are never invented.
- Ad detection uses explicit card markers/attributes and known ad slots, never video titles or author names. Unknown layouts are preserved. CSS automatically handles new cards and late ad labels.
- Homepage rules disengage on other routes and when the mode is disabled. Existing wallpaper, GIF/MP4, glass/clear, opacity, blur and color controls continue to work.

After updating files, **Reload** the extension and refresh Bilibili. Live-site DOM variants still require the manual checks in [TESTING.md](TESTING.md).

### 参考图布局与液态玻璃 / Reference layout & Liquid Glass

打开弹窗，在「极简模式」中点击 **应用参考图 · 液态玻璃**：启用首页优化，保留原站横幅与轮播，使用浅色底景与深色文字、粉色点缀、胶囊搜索框、玻璃分类条，以及「主轮播 + 三张原生推荐侧栏 + 五列视频」的桌面布局。窄窗口自动恢复普通卡片流。

「参考图首页布局」和「液态玻璃」可分别关闭。液态玻璃使用透明材质、饱和度、柔和边缘高光和轻阴影；仍遵循玻璃浓度、模糊、字体颜色及 Clear 模式。现有壁纸/GIF/MP4 和导航隐藏选择不会被预设清空。未设置壁纸时，该布局使用浅粉蓝底景；关闭极简模式恢复原来的底景。图片、标题、统计数据和轮播仍来自站点，不会植入参考截图里的虚构内容，也不会替换站点事件。

Click **Apply Reference · Liquid Glass** in the popup to enable the reference-inspired homepage: native hero banner/carousel, a compact feature with three native recommendation cards beside it, five-column desktop recommendations, pill search and translucent category strip. Smaller windows return to the regular card flow. Reference Layout and Liquid Glass have independent switches. The preset applies light glass, pink accents, opacity 38 and blur 22, retaining wallpaper/media and navigation choices. Custom colors and Clear mode remain supported. An empty wallpaper uses a pastel backdrop only while Reference Layout is active. Site imagery and content remain native; the supplied screenshot is not embedded into the extension.
