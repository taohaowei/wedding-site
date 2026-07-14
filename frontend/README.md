# 赴约 · 婚礼请柬 H5（前端）

> 开源婚礼邀请函模板

## 跑起来

```bash
cd frontend
npm install     # 或 pnpm i
npm run dev     # http://localhost:5173
```

构建:

```bash
npm run build           # 严格 TS 检查 + 构建
npm run build:nocheck   # 跳过类型检查直接构建(应急用)
npm run preview         # 本地预览 dist
```

## 项目结构

```
src/
├── pages/
│   ├── HomePage.vue        # 路由 / 主页(垂直 swiper 12 屏)
│   └── AdminPage.vue       # 路由 /admin 后台
├── sections/               # 每屏一个 section
│   ├── CoverSection.vue        屏 1
│   ├── StorySection.vue        屏 2-6
│   ├── PhotoSection.vue        屏 7-9 (内嵌水平 swiper)
│   ├── VenueSection.vue        屏 10
│   ├── RsvpSection.vue         屏 11
│   └── ThanksSection.vue       屏 12
├── components/             # 复用 UI 原子
│   ├── CountdownTimer.vue
│   ├── ParticleBg.vue
│   ├── BgmPlayer.vue
│   ├── TypeFadeIn.vue
│   ├── PhotoSwiper.vue
│   └── FormStepper.vue     # Typeform 风一屏一字段
├── composables/
│   └── useViewportHeight.ts    iOS 100vh 兜底
├── api/
│   ├── client.ts           axios + probeBackend
│   ├── types.ts            前后端共享 TS 契约
│   ├── rsvp.ts             postRsvp()
│   └── admin.ts            login/logout/getRsvps/getExportUrl
├── stores/                 # Pinia
│   ├── rsvp.ts
│   └── admin.ts
├── data/                   # 文案/配置
│   ├── stories.ts          5 屏故事
│   └── photos.ts           3 套婚纱照
├── styles/
│   ├── tokens.scss         颜色 / 字体 / mixin
│   └── index.scss          全局样式
├── router/index.ts
├── App.vue
└── main.ts

public/
├── illustrations/          # 故事插画(1 张已有,其余自动占位)
├── photos/                 # 婚纱照(已从 git 移除,使用前自行放入)
│   ├── main-gown/
│   ├── french/
│   └── outdoor-bw/
└── audio/                  # bgm.mp3 自行放入
```

## 关键路径

- `?to=张三` → 封面顶部出现"亲爱的 张三"
- `/#/` → 主请柬
- `/#/admin` → 后台(默认密码 mock 模式 `demo` 或 `123456`)

## 与后端联调

默认 baseURL `/api`,Vite dev 时已配置 proxy 到 `127.0.0.1:3001`(契约约定的后端端口)。

启动时 `probeBackend()` 会探活 `/api/health`:
- 探活成功 → 真实模式,所有接口走后端
- 探活失败 → mock 模式,RSVP 提交 console.log,后台用三条假数据

如需切换 base:`.env.local` 加 `VITE_API_BASE=http://your-backend/api`。

## 验收

- [x] `npm run dev` 起得来,12 屏可滚
- [x] 屏 7-9 内部水平 swiper 可滑(无图也有占位)
- [x] `?to=xxx` 封面显示称呼
- [x] RSVP Q1 选 "yes" 显示 Q2/Q3,选 "no/maybe" 跳到 Q5
- [x] `/admin` 路由可渲染,登录失败有提示
- [x] `npm run build` 出 dist,无 TS 错误

## 已知问题 / TODO

- 故事插画当前只有 1 张(scene-01-blind-date.png),其余 4 屏走"插画占位",后续补图即可生效
- BGM 文件未提供,放 public/audio/bgm.mp3 即生效
- 港式黑白屏 9 切到时整页 body 加 `.theme-bw` class,主进度条/BgmPlayer 已有 fallback
- iOS Safari 100vh 已用 `100dvh` + `--vh` 双重兜底
- 微信内 BGM 已监听 `WeixinJSBridgeReady`,首次手势解除 muted
- **微信分享卡片**:已加 OG meta + `/share-cover.jpg`(800×420),微信新版本会按 OG 抓取标题/描述/缩略图。但完美的"分享卡片"(自定义标题/描述/图片同时生效)需要 **HTTPS + 公众号 JSSDK 签名**(`wx.config` + `wx.updateAppMessageShareData`),当前部署是 HTTP 裸 IP,**这是已知限制**,等切到 HTTPS 域名后可补 JSSDK

## 部署

`npm run build` → `dist/`,Nginx `try_files $uri /index.html` SPA fallback,API `/api/` 反代到后端 127.0.0.1:3001(详见 `docs/赴约-架构方案.md` 第 8 节)。
