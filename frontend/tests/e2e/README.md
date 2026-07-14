# E2E 响应式截图测试

跑一遍 8 个视口 × (12 屏 swiper + 1 个 admin 路由) = **104 张截图**,生成可视化 HTML 报告。

## 文件

- `responsive.spec.mjs` — 主脚本(原生 ESM,免 npm install)
- `run-and-report.sh`   — 探活 + 跑脚本 + 自动打开报告

## 跑

确认 dev server 起着:

```bash
cd frontend
npm run dev   # 默认 http://localhost:5173
```

另开一个终端跑测试:

```bash
cd frontend
./tests/e2e/run-and-report.sh
```

或自定义 URL / 输出目录:

```bash
BASE_URL=http://192.168.1.10:5173 OUT_DIR=/tmp/wd-report ./tests/e2e/run-and-report.sh
./tests/e2e/run-and-report.sh --no-open    # 跑完不弹浏览器
```

## 输出

- 截图: `/tmp/wedding-responsive-report/screenshots/<vp>/<screen>.png`
- 报告: `/tmp/wedding-responsive-report/index.html`(行 = 屏, 列 = viewport,点击放大)

## 视口矩阵

| ID | 尺寸 | 说明 |
| --- | --- | --- |
| 320×568  | 320 × 568  | iPhone SE 1 |
| 360×780  | 360 × 780  | Galaxy S8 |
| 375×667  | 375 × 667  | iPhone SE 2/3 |
| 390×844  | 390 × 844  | iPhone 14 |
| 414×896  | 414 × 896  | iPhone 14 Plus |
| 430×932  | 430 × 932  | iPhone 14 Pro Max |
| 768×1024 | 768 × 1024 | iPad 竖屏 |
| 844×390  | 844 × 390  | iPhone 14 横屏 |

## 屏列表

1. 封面 / 2-6 故事 5 屏 / 7-9 婚纱照 3 屏 / 10 婚礼信息 / 11 RSVP / 12 致谢 / 13 admin

切屏方式: `document.querySelector('.main-swiper').swiper.slideTo(idx, 700)`,
失败时降级用键盘 `PageDown`。

## 依赖

不装新包。直接复用:

- 用户 npx 缓存里的 `playwright`(`~/.npm/_npx/<hash>/node_modules/playwright`)
- 系统已下载的 chromium(`~/Library/Caches/ms-playwright/chromium-*`)

如果系统没装过 playwright,执行一次 `npx playwright install chromium` 即可。

## 已知 TODO

- swiper 在 `844×390` 横屏下,垂直方向 height 较小,部分屏(尤其 venue / rsvp 表单)可能上下被截。截图本身能反映这个问题(就是测试目标),不是 bug。
- admin 路由 `#/admin` 走 hash 路由,刷新没问题;如果 admin 需要登录态,目前脚本不带 cookie,会落到登录/空态页(由报告反映)。
- 某些 viewport 切到「屏 9 港式黑白」时,会在 body 加 `.theme-bw`;切走后会清掉,这个状态污染目前已用 `slideTo` + 等动画规避。
- 不重启 dev server,假设 `localhost:5173` 已在跑;脚本会先 curl 探活,失败直接退出。
