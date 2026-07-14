/**
 * 响应式截图自动化测试 — 多视口 × 多屏
 *
 * 矩阵: 8 viewport × 12 屏(swiper) + 1 个 admin 路由 = 每 viewport 13 张截图
 * 输出: /tmp/wedding-responsive-report/screenshots/<vp>/<screen>.png
 *
 * 不依赖 npm install — 通过绝对路径加载用户 npx 缓存里的 playwright,
 * 并显式指定本地已下载的 chromium 二进制(避开 1.61 alpha 默认 chromium 版本不存在的问题)。
 *
 * 用法:
 *   node tests/e2e/responsive.spec.mjs
 *   BASE_URL=http://localhost:5173 node tests/e2e/responsive.spec.mjs
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

// ---------------- 配置 ----------------

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const OUT_DIR = process.env.OUT_DIR || '/tmp/wedding-responsive-report'
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots')

// 8 个视口
const VIEWPORTS = [
  { id: '320x568',  width: 320, height: 568,  label: 'iPhone SE 1' },
  { id: '360x780',  width: 360, height: 780,  label: 'Galaxy S8' },
  { id: '375x667',  width: 375, height: 667,  label: 'iPhone SE 2/3' },
  { id: '390x844',  width: 390, height: 844,  label: 'iPhone 14' },
  { id: '414x896',  width: 414, height: 896,  label: 'iPhone 14 Plus' },
  { id: '430x932',  width: 430, height: 932,  label: 'iPhone 14 Pro Max' },
  { id: '768x1024', width: 768, height: 1024, label: 'iPad 竖屏' },
  { id: '844x390',  width: 844, height: 390,  label: 'iPhone 14 横屏' }
]

// 12 屏 swiper + admin
const SCREENS = [
  { id: '01-cover',      label: '屏1 封面',      kind: 'slide', index: 0 },
  { id: '02-story-meet', label: '屏2 相亲',      kind: 'slide', index: 1 },
  { id: '03-story-1km',  label: '屏3 一公里',    kind: 'slide', index: 2 },
  { id: '04-story-sin',  label: '屏4 真心',      kind: 'slide', index: 3 },
  { id: '05-story-eng',  label: '屏5 订婚',      kind: 'slide', index: 4 },
  { id: '06-story-dec',  label: '屏6 决定',      kind: 'slide', index: 5 },
  { id: '07-photo-main', label: '屏7 主纱',      kind: 'slide', index: 6 },
  { id: '08-photo-fr',   label: '屏8 法式',      kind: 'slide', index: 7 },
  { id: '09-photo-bw',   label: '屏9 港式黑白',  kind: 'slide', index: 8 },
  { id: '10-venue',      label: '屏10 婚礼信息', kind: 'slide', index: 9 },
  { id: '11-rsvp',       label: '屏11 RSVP',     kind: 'slide', index: 10 },
  { id: '12-thanks',     label: '屏12 致谢',     kind: 'slide', index: 11 },
  { id: '13-admin',      label: 'Admin 后台',    kind: 'route', route: '#/admin' }
]

// ---------------- 解析 playwright + chromium ----------------

/** 在 ~/.npm/_npx/ 下找带 playwright 的 npx 缓存目录 */
function resolveCachedPlaywright() {
  const npxRoot = path.join(homedir(), '.npm', '_npx')
  if (!existsSync(npxRoot)) return null
  const entries = readdirSync(npxRoot)
  for (const entry of entries) {
    const pwIndex = path.join(npxRoot, entry, 'node_modules', 'playwright', 'index.mjs')
    if (existsSync(pwIndex)) return pwIndex
  }
  return null
}

/** 查找本地已安装的 chromium 二进制(优先 chromium-*,其次 chromium_headless_shell-*) */
function resolveChromiumExec() {
  const root = path.join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (!existsSync(root)) return null
  const dirs = readdirSync(root).filter(d => d.startsWith('chromium-') && !d.includes('headless'))
  // 优先版本号大的
  dirs.sort().reverse()
  for (const d of dirs) {
    const candidates = [
      path.join(root, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
      path.join(root, d, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      path.join(root, d, 'chrome-mac-arm64', 'Chromium.app', 'Contents', 'MacOS', 'Chromium')
    ]
    for (const c of candidates) {
      if (existsSync(c)) return c
    }
  }
  // 降级到 headless_shell
  const shellDirs = readdirSync(root).filter(d => d.startsWith('chromium_headless_shell-'))
  shellDirs.sort().reverse()
  for (const d of shellDirs) {
    const c = path.join(root, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell')
    if (existsSync(c)) return c
  }
  return null
}

const pwPath = resolveCachedPlaywright()
const chromiumPath = resolveChromiumExec()

if (!pwPath) {
  console.error('[fatal] 没找到本地 playwright,请运行任意 npx playwright 命令以缓存,或调整脚本')
  process.exit(2)
}
if (!chromiumPath) {
  console.error('[fatal] 没找到本地 chromium 二进制,请先 npx playwright install chromium')
  process.exit(2)
}

console.log('[info] playwright =', pwPath)
console.log('[info] chromium   =', chromiumPath)

// 动态加载 playwright
const { chromium } = await import(pwPath)

// ---------------- 工具 ----------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

mkdirSync(SCREENSHOT_DIR, { recursive: true })
for (const vp of VIEWPORTS) {
  mkdirSync(path.join(SCREENSHOT_DIR, vp.id), { recursive: true })
}

/**
 * 在页面中找 main swiper 实例并 slideTo
 * 必须按 direction === 'vertical' 选(页面有多个 swiper:1 个 main + N 个内嵌横向 PhotoSwiper)
 * slideTo 后轮询 activeIndex,直到等于 target 或超时
 */
async function slideTo(page, idx, { speed = 0, settle = 900, retries = 6, pollMs = 150, pollMax = 4000 } = {}) {
  // speed = 0 表示瞬间到位,避免 mousewheel/animation 叠加导致偏移
  for (let attempt = 0; attempt < retries; attempt++) {
    const ok = await page.evaluate(({ i, sp }) => {
      let target = null
      for (const el of document.querySelectorAll('.swiper')) {
        if (el.swiper?.params?.direction === 'vertical') { target = el; break }
      }
      if (!target) return false
      // 先停掉可能在跑的过渡
      try { target.swiper.stopAutoplay?.() } catch (_) {}
      target.swiper.slideTo(i, sp)
      return true
    }, { i: idx, sp: speed })
    if (!ok) return false

    // 轮询 activeIndex 对齐
    let waited = 0
    let cur = -1
    while (waited <= pollMax) {
      cur = await page.evaluate(() => {
        for (const el of document.querySelectorAll('.swiper')) {
          if (el.swiper?.params?.direction === 'vertical') return el.swiper.activeIndex
        }
        return -1
      })
      if (cur === idx) break
      await sleep(pollMs)
      waited += pollMs
    }
    if (cur === idx) {
      await sleep(settle) // 给 GSAP / 图片懒加载留时间
      return true
    }
    // 没对齐,重试(常见原因:mousewheel/keyboard 事件被叠加)
    await sleep(200)
  }
  return false
}

/**
 * 跑一个 viewport 的全部屏
 * 返回 { vp, results: [{ screen, ok, error?, file }] }
 */
async function runViewport(browser, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.width < 768,
    hasTouch: vp.width < 768,
    // 跳过音频自动播放警告
    bypassCSP: true
  })
  const page = await ctx.newPage()
  page.on('pageerror', (err) => console.warn(`[${vp.id}] page error:`, err.message))

  const results = []
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
    // 等首屏渲染完成
    await page.waitForSelector('.main-swiper, .home-root', { timeout: 15000 }).catch(() => {})
    await sleep(800)

    for (const screen of SCREENS) {
      const file = path.join(SCREENSHOT_DIR, vp.id, `${screen.id}.png`)
      let ok = false
      let error
      try {
        if (screen.kind === 'slide') {
          // 切回 home 路由(如果之前去了 admin)
          if (page.url().includes('#/admin')) {
            await page.goto(BASE_URL, { waitUntil: 'networkidle' })
            await page.waitForSelector('.main-swiper, .home-root', { timeout: 10000 }).catch(() => {})
            await sleep(600)
          }
          const slid = await slideTo(page, screen.index)
          if (!slid) {
            error = `slideTo(${screen.index}) 失败,activeIndex 没对齐`
          }
        } else if (screen.kind === 'route') {
          await page.goto(BASE_URL + screen.route, { waitUntil: 'networkidle', timeout: 15000 })
          await sleep(800)
        }
        await page.screenshot({ path: file, fullPage: false })
        ok = !error
      } catch (e) {
        error = e?.message || String(e)
        // 失败也尝试截图,看现场
        try {
          await page.screenshot({ path: file, fullPage: false })
        } catch (_) {}
      }
      console.log(`[${vp.id}] ${screen.id} ${ok ? 'OK' : 'FAIL: ' + error}`)
      results.push({ screen: screen.id, label: screen.label, ok, error, file })
    }
  } finally {
    await ctx.close()
  }
  return { vp, results }
}

// ---------------- 跑批 + 生成 HTML ----------------

const t0 = Date.now()
const browser = await chromium.launch({
  executablePath: chromiumPath,
  headless: true
})

const allResults = []
for (const vp of VIEWPORTS) {
  console.log(`\n=== viewport ${vp.id} (${vp.label}) ===`)
  const r = await runViewport(browser, vp)
  allResults.push(r)
}
await browser.close()

const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
console.log(`\n[done] ${VIEWPORTS.length} viewports × ${SCREENS.length} screens, ${elapsed}s`)

// 生成 HTML 报告
const reportPath = path.join(OUT_DIR, 'index.html')
const totalShots = VIEWPORTS.length * SCREENS.length
const okCount = allResults.reduce((n, r) => n + r.results.filter(x => x.ok).length, 0)

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Wedding 站点 · 响应式截图报告</title>
<style>
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a1f; color: #eee; }
  header { padding: 16px 24px; background: #0f0f13; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10; }
  h1 { margin: 0; font-size: 18px; }
  .meta { font-size: 12px; color: #999; margin-top: 4px; }
  .legend { padding: 8px 24px; background: #15151a; font-size: 12px; color: #aaa; }
  .grid-wrap { padding: 16px 12px; overflow: auto; }
  table { border-collapse: collapse; min-width: 100%; }
  th, td { border: 1px solid #2a2a30; padding: 6px; vertical-align: top; text-align: center; background: #1f1f25; }
  th { background: #2a2a32; font-size: 12px; position: sticky; top: 0; z-index: 5; }
  th.row-header { position: sticky; left: 0; z-index: 6; min-width: 140px; text-align: left; padding: 8px 10px; }
  td.row-header { position: sticky; left: 0; z-index: 4; background: #2a2a32; font-size: 12px; min-width: 140px; text-align: left; padding: 8px 10px; }
  .vp-label { font-weight: 600; }
  .vp-size { color: #88c; font-family: ui-monospace, monospace; font-size: 11px; }
  .thumb { display: block; max-width: 200px; max-height: 360px; height: auto; cursor: zoom-in; border: 1px solid #444; }
  .fail { color: #ff6b6b; font-size: 11px; padding: 4px; }
  .badge-ok { display: inline-block; width: 8px; height: 8px; background: #4caf50; border-radius: 50%; margin-right: 4px; }
  .badge-fail { display: inline-block; width: 8px; height: 8px; background: #f44336; border-radius: 50%; margin-right: 4px; }

  /* lightbox */
  #lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); display: none; align-items: center; justify-content: center; z-index: 100; cursor: zoom-out; }
  #lightbox img { max-width: 95vw; max-height: 95vh; border: 1px solid #555; }
  #lightbox.open { display: flex; }
  .caption { position: fixed; bottom: 12px; left: 0; right: 0; text-align: center; font-size: 13px; color: #ccc; pointer-events: none; }
</style>
</head>
<body>
<header>
  <h1>Wedding 站点 · 响应式渲染对照表</h1>
  <div class="meta">
    生成时间: ${new Date().toLocaleString('zh-CN')} · BASE_URL: ${BASE_URL} ·
    截图: ${okCount}/${totalShots} 成功 · 耗时: ${elapsed}s ·
    行 = 屏(12 屏 + admin), 列 = viewport
  </div>
</header>
<div class="legend">点击缩略图放大;失败的屏会显示红点 + 错误信息</div>
<div class="grid-wrap">
<table>
  <thead>
    <tr>
      <th class="row-header">屏 ＼ 视口</th>
      ${VIEWPORTS.map(vp => `<th>
        <div class="vp-label">${vp.label}</div>
        <div class="vp-size">${vp.width}×${vp.height}</div>
      </th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${SCREENS.map(screen => {
      return `<tr>
        <td class="row-header">${screen.label}<br><span style="color:#88c;font-size:10px;font-family:ui-monospace,monospace">${screen.id}</span></td>
        ${VIEWPORTS.map(vp => {
          const r = allResults.find(x => x.vp.id === vp.id)
          const item = r?.results.find(x => x.screen === screen.id)
          if (!item) return `<td><span class="fail">no-data</span></td>`
          const rel = path.relative(OUT_DIR, item.file)
          const tag = item.ok
            ? `<span class="badge-ok"></span>OK`
            : `<span class="badge-fail"></span>FAIL`
          const errLine = item.ok
            ? ''
            : `<div class="fail">${(item.error || '').slice(0, 80)}</div>`
          return `<td>
            <div style="font-size:10px;color:#aaa;margin-bottom:2px">${tag}</div>
            <img class="thumb" loading="lazy" src="${rel}" data-full="${rel}" data-cap="${vp.label} ${vp.width}×${vp.height} · ${screen.label}" />
            ${errLine}
          </td>`
        }).join('')}
      </tr>`
    }).join('')}
  </tbody>
</table>
</div>
<div id="lightbox"><img id="lb-img" /></div>
<div class="caption" id="lb-cap"></div>
<script>
  const lb = document.getElementById('lightbox')
  const lbImg = document.getElementById('lb-img')
  const lbCap = document.getElementById('lb-cap')
  document.querySelectorAll('img.thumb').forEach(img => {
    img.addEventListener('click', () => {
      lbImg.src = img.dataset.full
      lbCap.textContent = img.dataset.cap
      lb.classList.add('open')
    })
  })
  lb.addEventListener('click', () => { lb.classList.remove('open'); lbCap.textContent = '' })
</script>
</body>
</html>`

await import('node:fs/promises').then(fs => fs.writeFile(reportPath, html, 'utf8'))
console.log(`\n[report] file://${reportPath}`)
