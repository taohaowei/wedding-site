# 真机 / 多视口自动化测试方案调研

> 调研日期：2026-05-13  
> 项目背景：婚礼请柬 H5（一次性 / 短生命周期 / 移动端为主 / 部分流量来自微信）  
> 调研者：调研员2（只调研，不改码）

---

## 1. Playwright 多设备模拟

### 1.1 能力与配置
Playwright 自带 `devices` 注册表，预置 100+ 主流机型（iPhone 13/14/15、Pixel 5/7、iPad、Galaxy S 系列等），一行 `...devices['iPhone 13']` 即可注入：

- `userAgent`：UA 字符串（注意：`Desktop Chrome` 默认是 Windows UA，需要时手动 unset）
- `viewport`：视口尺寸（可被 `page.setViewportSize` 覆盖）
- `deviceScaleFactor`：DPR
- `isMobile`：是否触发 viewport meta 解析
- `hasTouch`：是否启用触摸事件
- `screen`：屏幕尺寸（区别于 viewport）

可独立设置 `geolocation` / `locale` / `timezoneId` / `colorScheme` / `permissions` / `offline` / `javaScriptEnabled`。

### 1.2 真实 vs 模拟的差距（关键）
| 维度 | 模拟（Playwright） | 真机 |
|---|---|---|
| 渲染引擎 | Chromium / WebKit / Firefox（自己 patch 的版本） | Mobile Safari (WKWebView)、Chrome on Android、微信 X5、抖音 webview… |
| iOS 真实度 | WebKit 是 Playwright 自构建版本，**不是** iPhone 上的 Mobile Safari，缺少 iOS 输入法、Safari 工具栏、bounce scroll | 真 |
| 触摸/手势 | `hasTouch=true` 仅模拟事件，**没有真实手势惯性** | 真实手势 |
| 键盘 | 桌面键盘 | 弹出软键盘会改变 viewport（导致 `100vh` 跳动） |
| 字体 | 桌面字体回退 | iOS PingFang / Android Noto Sans CJK |
| 视频/音频自动播放 | Chromium 策略 | iOS Safari 严格策略（`playsinline` 必填） |
| 性能 | 桌面 CPU/GPU | 真机羸弱（红米/老 iPhone） |
| 网络 | `route` 拦截可模拟 | 真实弱网 |

**结论**：Playwright 适合**布局回归 / 关键流程冒烟**，不能替代关键页面（请柬首屏、动画、地图）的真机抽测。

---

## 2. 真机云方案对比

| 平台 | 免费额度 | 起步价 | 真机数量 | 易用度 | 推荐场景 |
|---|---|---|---|---|---|
| **BrowserStack** | 30 min Live + 100 min Automate（一次性试用） | Live $39/mo（桌面）、$49/mo（含真机移动）、Automate $99/mo | 3000+ 浏览器、20000+ 真机 | 最成熟，文档/集成丰富 | 团队/企业；需 iOS 真机 |
| **Sauce Labs** | 试用需联系销售 | 不公开（按需报价） | 同量级 | 偏企业，配置复杂 | 大型 CI/CD 长期合同 |
| **LambdaTest** (TestMu AI) | **60 min/月 永久免费**（实时） + 100 min Automate | Live $15/mo、Real Device $39/mo、Automate $79/mo | 3000+ 浏览器、5000+ 真机 | 中等，UI 友好 | **个人/小团队首选**，性价比最高 |

> 数据源：BrowserStack/LambdaTest 官方定价页 + Cekura/Bug0 2026Q1 横评。Sauce Labs 不公开 → 默认排除。

**婚礼请柬场景判断**：付费方案严重浪费，免费额度 60 min（LambdaTest）足够手动跑 3-5 个关键设备 × 2 次（首屏渲染、RSVP 流程、距离动画）。

---

## 3. Chrome DevTools 远程调试 Android（chrome://inspect）

**完全可行，零成本，强烈推荐。**

步骤：
1. Android：设置 → 关于手机 → 连点 7 次"版本号" → 开启开发者选项 → 启用"USB 调试"
2. USB 连电脑，手机弹"允许 USB 调试"点确定
3. 桌面 Chrome 打开 `chrome://inspect/#devices`，勾 "Discover USB devices"
4. 设备出现后，下方列出该设备所有 Chrome / WebView 标签页，点 "Inspect" 即弹完整 DevTools

**杀手锏：Port Forwarding**  
`chrome://inspect` 左侧 Port forwarding → 添加 `8080 → localhost:8080`。手机 Chrome 直接访问 `http://localhost:8080` 即可命中本机的 `vite dev`，**不用同 WiFi、不用打 IP**。

适用：所有 Android 上基于 Chromium 的浏览器（Chrome / 三星浏览器 / Edge），以及开了调试的 WebView 应用。

---

## 4. Safari Web Inspector 远程调试 iOS

**可行，但需要 Mac**（iOS 调试链路被 Apple 锁死在 macOS）。

步骤：
1. iPhone：设置 → Apps → Safari → 高级 → 开启"网页检查器（Web Inspector）"
2. Mac Safari：偏好设置 → 高级 → 勾"在菜单栏中显示开发菜单"
3. Lightning/USB-C 线连 iPhone 到 Mac，首次需在 iPhone 上信任电脑
4. iPhone Safari 打开目标页，Mac Safari → 开发 → [设备名] → 选页面 → 完整 Web Inspector

**限制**：
- 必须 macOS，Windows/Linux 用户只能走第三方代理（如 `ios-safari-remote-debug-kit` 走 webkit 私有协议）
- 仅能调试 Mobile Safari 和**已开启 inspectable 的 WKWebView**；iOS 微信 webview 默认不可 inspect

---

## 5. PWA 模拟 / Capacitor / Ionic DevApp

| 工具 | 用途 | 是否适合婚礼请柬 |
|---|---|---|
| Capacitor | 把 Web 包成原生壳，调用相机/通知等原生 API | **不需要**——纯 Web H5 |
| Ionic DevApp | 已废弃，被 `ionic capacitor run` 取代 | 不适用 |
| PWA Builder | 帮 Web 加 manifest/SW 装成 PWA | 可选（如果想做"添加到主屏"） |

**手势测试更靠谱的路线**：直接真机 + Chrome inspect，不要为了"测手势"引入 Capacitor，会把项目复杂度抬一档。

---

## 6. 截图自动化对比（视觉回归）

| 工具 | 模型 | 价格 | 集成难度 | 推荐场景 |
|---|---|---|---|---|
| **Percy** (BrowserStack 子品牌) | SaaS 云端比对 | Free 5k 截图/月，付费 $199/月 起（25k） | 中（CI 接 PR） | 团队，跨浏览器跨视口的全流程回归 |
| **Chromatic** | SaaS + 深度集成 Storybook | Free 5k snapshot/月，$149/月 起（35k） | 低（Storybook 项目原生）| 组件驱动开发的项目 |
| **Reg-Suit** | **完全开源**，自己存 S3/GCS | $0 | 高（自己搭基线存储） | 不想付费、愿意运维的极客 |
| **BackstopJS** | 开源、本地、CSS 选择器粒度 | $0 | 中 | 单机回归小项目 |

**婚礼请柬建议**：项目生命周期 < 1 个月、页面 5 个以内 → **截图回归不必上**，本机 `--device` 跑 Playwright `page.screenshot()` 手工 diff 已够。要上就 Percy Free（5k 额度绰绰有余）。

---

## 7. 本地局域网真机访问 vite dev server

**最低成本、最高频使用的方案**，开发期天天用。

```bash
# 方式 A：CLI flag
npm run dev -- --host

# 方式 B：vite.config.ts
export default { server: { host: true } }   // = 0.0.0.0
```

启动后 Vite 终端会同时打印 Local + Network 两个地址（如 `http://192.168.1.42:5173`），手机/iPad 同 WiFi 访问 Network 地址即可。

**进阶**：
- 终端二维码：装 `vite-plugin-qrcode` 或 `vite-qr`，手机扫一下不用手敲 IP
- HTTPS：iOS 某些 API（地理定位、相机）必须 HTTPS → `mkcert` 生成本地证书 + `server.https`
- 手机连不上：检查防火墙允许 5173 端口入站；公司网络隔离 → 用手机开热点反向连电脑
- **替代方案**：`ngrok` / `cloudflared tunnel` 暴露公网 URL，全球可访问，调试微信生态时更方便

---

## 8. 微信开发者工具 / X5 内核调试

### 8.1 微信开发者工具（PC 端）
- **主要面向小程序**，对公众号 H5 提供"公众号网页项目"模式，能模拟登录授权和 JS-SDK
- 内置 Chromium，**不是真实 X5 内核**，调试 H5 渲染兼容性意义有限
- 适合：JS-SDK 调用、`wx.config` 签名调试、`openid` 流程

### 8.2 真机 X5 调试（核心）
微信 Android 内置 X5 内核（基于 blink），调试入口：
1. 微信中访问 `debugx5.qq.com` 或 `debugxweb.qq.com/?inspector=true`
2. 在调试页勾选"打开 TBS 内核 Inspector 调试功能" + "打开 vConsole"
3. 手机 USB 连电脑，电脑桌面 Chrome 访问 `chrome://inspect`
4. 设备列表出现微信 webview，点 Inspect

**注意（重要）**：
- 较新版本微信（v8.0.x 之后）逐步切到系统 webview，X5 调试入口可能失效，需要用 `debugxweb.qq.com/?inspector=true`
- iOS 微信 webview **没有官方 inspect 通道**——只能用 vConsole 看 console，或在 Mac Safari 里碰运气（默认 inspectable=false）
- 内嵌打开 H5 时如能强制走系统浏览器（"在浏览器中打开"），优先走系统浏览器调试

---

## 工具能力总览

| 工具 | 真实度 | 价格 | 易用 | 适用阶段 |
|---|---|---|---|---|
| Playwright `devices` 模拟 | ★★ | 免费 | ★★★★★ | 开发期 / CI |
| `vite --host` + 局域网真机 | ★★★★★ | 免费 | ★★★★★ | 开发期日常 |
| `chrome://inspect` (Android) | ★★★★★ | 免费 | ★★★★ | 开发期排查 |
| Safari Web Inspector (iOS) | ★★★★★ | 免费（需 Mac） | ★★★★ | 开发期排查 |
| 微信 X5 inspect | ★★★★ | 免费 | ★★ | 微信内排查 |
| LambdaTest 免费层 | ★★★★ | 60min/月免费 | ★★★★ | 没真机时备用 |
| BrowserStack | ★★★★★ | $39+/月 | ★★★★ | 团队 / 长期项目 |
| Percy / Chromatic | ★★★★ | Free 5k+ | ★★★ | 持续维护项目 |
| Reg-Suit | ★★★ | 免费自托管 | ★★ | 极客 / 私有部署 |

---

## 婚礼请柬项目推荐路径

### MVP（强烈推荐，零成本，半天搞定）
1. **`vite --host`** 起 dev server，自己手机 + 家人手机（iOS + Android 各一台）扫局域网 IP 实测
2. **`chrome://inspect` + Port forwarding** 调 Android 上的 Chrome / 微信 X5 内嵌页
3. **Mac Safari 调 iPhone Safari**（家里有 Mac 就用，没有就跳过 iOS 深度调试）
4. **Playwright 写 3-5 个核心冒烟用例**：iPhone 13 / Pixel 7 / iPad 三视口，覆盖：
   - 首屏 hero 渲染不裂
   - RSVP 表单提交成功
   - 距离动画在 mobile viewport 不溢出
5. 每次发布前手动跑一次 `npm run test:e2e`

### 进阶（如果想稳一点 / 担心微信 X5 兼容）
6. **LambdaTest 免费层** 60min/月：抽测 1-2 台真 iOS 真机（家里只有 Android 时尤其有用）
7. **Percy Free 层**：CI 集成截图回归，每次 PR 自动 diff，5k 截图/月对一次性项目绰绰有余
8. 在生产页面注入 **vConsole**（线上挂个 query string 才打开），婚礼当天朋友反馈崩了能立刻看 console

### 不推荐
- 不要上 BrowserStack/Sauce Labs 付费——一次性项目 ROI 极低
- 不要上 Capacitor/Ionic——不打包 App 就不需要
- 不要做 Reg-Suit 自建基线——运维成本超过收益
- 不要依赖微信开发者工具的"模拟器"调真实 X5——它根本不是 X5

### 一句话总结
**`vite --host` + Chrome Inspect (Android) + Mac Safari (iOS) + Playwright 三机型冒烟**，覆盖 95% 场景，零成本。剩下 5% 的微信 X5 兼容性，靠生产环境 vConsole 兜底。

---

## 参考来源
- [Playwright Emulation 官方文档](https://playwright.dev/docs/emulation)
- [Chrome DevTools Remote Debugging Android](https://developer.chrome.com/docs/devtools/remote-debugging)
- [Apple - Inspecting iOS and iPadOS](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios)
- [BrowserStack 定价](https://www.browserstack.com/pricing)
- [LambdaTest 定价 2026 实测](https://www.cekura.ai/blogs/lambdatest-pricing)
- [reg-suit 项目主页](https://github.com/reg-viz/reg-suit)
- [Percy / Chromatic 横评 2026](https://delta-qa.com/en/blog/chromatic-vs-percy-comparison-2026)
- [Vite Server Options](https://vite.dev/config/server-options)
- [微信 X5 调试方法](https://github.com/zqjflash/webview-debug/blob/master/X5%E8%B0%83%E8%AF%95%E4%B8%8E%E5%BE%AE%E4%BF%A1%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7.md)
