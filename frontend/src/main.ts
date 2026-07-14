import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './styles/index.scss'

// ───────────────────────────────────────────────────────
// iOS 100vh 终极兜底
//   - 优先使用 Visual Viewport API（更准确,可避开 iOS Safari 工具栏 / 软键盘抖动）
//   - 旧浏览器降级到 window.innerHeight
//   - 同步两个 CSS 变量:
//       --vh   每 1vh 实际像素值（兜底用 calc(var(--vh) * 100) 替代 100vh）
//       --vvh  visual viewport 高度,可用于 banner、modal 等需要排除键盘高度的场景
// ───────────────────────────────────────────────────────
let rafId = 0
function applyVh() {
  const vv = window.visualViewport
  // 视口高度优先取 visualViewport.height（键盘弹出时会缩小,更精确）
  const innerH = window.innerHeight
  const vvH = vv ? vv.height : innerH
  // --vh 用 window.innerHeight,代表布局视口的 1%（用于全屏 section）
  document.documentElement.style.setProperty('--vh', `${innerH * 0.01}px`)
  // --vvh 用 visualViewport.height,代表实际可见视口的 1%（用于避开键盘）
  document.documentElement.style.setProperty('--vvh', `${vvH * 0.01}px`)
}

function setVh() {
  // 用 rAF 节流,避免 resize 风暴
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(applyVh)
}

setVh()
window.addEventListener('resize', setVh, { passive: true })
window.addEventListener('orientationchange', setVh, { passive: true })
// Visual Viewport 监听:键盘弹出 / iOS Safari 工具栏伸缩时同步
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setVh, { passive: true })
  window.visualViewport.addEventListener('scroll', setVh, { passive: true })
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
