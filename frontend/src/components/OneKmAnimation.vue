<template>
  <!--
    一公里 · 镜头从杭州拉近到萧山, 再切到两个小区相隔 1 km 的近景
    技术: 真实矢量地图 (DataV.GeoAtlas + d3-geo 编译期生成 SVG path) + GSAP 镜头
    视觉: 米白底 + 暖橘高亮 + 暮紫点缀, 圆形舞台 (clip-path), 胶片暖雾质感
  -->
  <div class="one-km-wrap">
    <div class="one-km-anim" ref="rootEl">
      <!-- 暖雾光晕装饰层 (在舞台之外, 不受 zoom 影响) -->
      <div class="warm-fog" aria-hidden="true"></div>

      <!-- 圆形舞台: 用 clip-path 而非 border-radius, 边缘更利 -->
      <div class="stage-clip">
        <!-- 镜头层 (被 GSAP 缩放/平移) -->
        <div class="camera" ref="cameraEl">
          <svg
            class="stage"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <!-- 海/底色暖渐变 -->
              <radialGradient id="ok-bg" cx="50%" cy="45%" r="65%">
                <stop offset="0%" stop-color="#FFF6EA" />
                <stop offset="65%" stop-color="#FBEAD3" />
                <stop offset="100%" stop-color="#F0DABE" />
              </radialGradient>

              <!-- 普通区域填色 -->
              <linearGradient id="ok-land" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FBE4C9" />
                <stop offset="100%" stop-color="#F2CFA6" />
              </linearGradient>

              <!-- 萧山高亮色 -->
              <linearGradient id="ok-xs" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#F8B584" />
                <stop offset="100%" stop-color="#E58955" />
              </linearGradient>

              <!-- 钱塘江/溪流的暮紫暗色 -->
              <linearGradient id="ok-river" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#A99CC0" stop-opacity="0.55" />
                <stop offset="100%" stop-color="#6E5C8E" stop-opacity="0.7" />
              </linearGradient>

              <!-- 脉动点 -->
              <radialGradient id="ok-pulse-orange" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFE7CB" stop-opacity="0.95" />
                <stop offset="55%" stop-color="#F5A572" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#E58955" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="ok-pulse-purple" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#E6DDF2" stop-opacity="0.95" />
                <stop offset="55%" stop-color="#A99CC0" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#6E5C8E" stop-opacity="0" />
              </radialGradient>

              <!-- 老地图发光描边滤镜 -->
              <filter id="ok-soft" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.18" />
              </filter>
            </defs>

            <!-- ========================= 舞台 0: 底色暖光 ========================= -->
            <rect x="0" y="0" width="100" height="100" fill="url(#ok-bg)" />

            <!-- ============= 舞台 A: 杭州市矢量地图 (真实 GeoJSON) ============= -->
            <g ref="hangzhouEl" class="stage-hz">
              <!-- 13 个区/县 -->
              <g class="districts">
                <path
                  v-for="d in hangzhouDistricts"
                  :key="d.adcode"
                  :d="d.d"
                  :class="['district', { 'is-xs': d.adcode === 330109 }]"
                />
              </g>

              <!-- 萧山区高亮 (上层重描) -->
              <path
                ref="xsHighlightEl"
                :d="xiaoshanDistrictPath"
                class="xs-highlight"
              />

              <!-- 萧山中心标 (淡入淡出) -->
              <g
                ref="xsLabelEl"
                class="xs-label"
                :transform="`translate(${xsCenter[0]}, ${xsCenter[1]})`"
              >
                <circle r="0.7" fill="#E58955" />
                <text
                  y="-1.6"
                  text-anchor="middle"
                  font-size="2.0"
                  fill="#3B2818"
                  font-family="serif"
                  font-weight="600"
                  letter-spacing="0.18em"
                >萧山</text>
              </g>

              <!-- 杭州整体标签 (初始浮现) -->
              <g ref="hzLabelEl" class="hz-label">
                <text
                  x="50"
                  y="14"
                  text-anchor="middle"
                  font-size="3.4"
                  fill="#3B2818"
                  font-family="serif"
                  font-weight="600"
                  letter-spacing="0.28em"
                >杭 州</text>
                <text
                  x="50"
                  y="18.4"
                  text-anchor="middle"
                  font-size="1.5"
                  fill="#8B6F4D"
                  font-family="serif"
                  letter-spacing="0.32em"
                >HANGZHOU · 16850 km²</text>
              </g>
            </g>

            <!-- ============= 舞台 B: 小区近景 (艺术化, 不再画真实地图) ============= -->
            <!-- 中心放在 (50, 50), 后续 GSAP 不再缩放, 仅作 cross-fade -->
            <g ref="closeUpEl" class="stage-close" opacity="0">
              <!-- 暖羊皮纸方块底 (舞台内部的近景纸纹) -->
              <rect x="10" y="10" width="80" height="80" rx="2" fill="#FFF6EA" opacity="0.0" />

              <!-- 街道网格 (轻细线) -->
              <g class="streets" stroke="#D9B98C" stroke-width="0.18" fill="none" opacity="0.55">
                <line x1="14" y1="32" x2="86" y2="34" />
                <line x1="12" y1="48" x2="88" y2="50" />
                <line x1="14" y1="64" x2="86" y2="66" />
                <line x1="14" y1="80" x2="86" y2="78" />
                <line x1="28" y1="14" x2="30" y2="86" />
                <line x1="46" y1="12" x2="48" y2="88" />
                <line x1="64" y1="14" x2="66" y2="86" />
                <line x1="80" y1="14" x2="82" y2="86" />
              </g>

              <!-- 主干道 (粗一点的暖橘) -->
              <g class="main-roads" stroke="#E5B47C" stroke-width="0.45" stroke-linecap="round" fill="none" opacity="0.7">
                <path d="M 8 56 Q 35 52, 50 50 Q 70 47, 92 46" />
                <path d="M 38 8 Q 42 30, 50 50 Q 58 70, 62 92" />
              </g>

              <!-- 河流 / 公园弧线 (暮紫渐变) -->
              <path
                d="M 6 70 Q 25 64, 38 62 Q 55 58, 70 60 Q 84 62, 96 66"
                stroke="url(#ok-river)"
                stroke-width="1.4"
                fill="none"
                stroke-linecap="round"
                opacity="0.55"
              />
              <!-- 公园 (淡绿块) -->
              <circle cx="72" cy="34" r="5" fill="#C8D9B0" opacity="0.55" />
              <circle cx="22" cy="74" r="3.6" fill="#C8D9B0" opacity="0.5" />

              <!-- 萧山小角标 -->
              <text
                x="14"
                y="20"
                font-size="1.6"
                fill="#8B6F4D"
                font-family="serif"
                letter-spacing="0.2em"
              >萧山 · XIAOSHAN</text>

              <!-- ========== 两个小区点 + 1 km 连线 ========== -->
              <!-- 男方 春江花月 (左侧) -->
              <g
                ref="dotMeEl"
                class="dot-group dot-me"
                transform="translate(38, 50)"
              >
                <circle class="pulse" r="6" fill="url(#ok-pulse-orange)" />
                <circle class="pulse" r="3.6" fill="url(#ok-pulse-orange)" opacity="0.6" />
                <circle r="0.85" fill="#E58955" />
                <circle r="2.0" fill="none" stroke="#E58955" stroke-width="0.18" />
                <text
                  y="-3.6"
                  text-anchor="middle"
                  font-size="1.65"
                  fill="#3B2818"
                  font-family="serif"
                  font-weight="600"
                  letter-spacing="0.15em"
                >春江花月</text>
                <text
                  y="-1.8"
                  text-anchor="middle"
                  font-size="1.2"
                  fill="#8B6F4D"
                  font-family="serif"
                  letter-spacing="0.2em"
                >他</text>
              </g>

              <!-- 女方 翠苑小区 (右侧, ~1 km) -->
              <g
                ref="dotHerEl"
                class="dot-group dot-her"
                transform="translate(62, 50)"
              >
                <circle class="pulse" r="6" fill="url(#ok-pulse-purple)" />
                <circle class="pulse" r="3.6" fill="url(#ok-pulse-purple)" opacity="0.6" />
                <circle r="0.85" fill="#6E5C8E" />
                <circle r="2.0" fill="none" stroke="#6E5C8E" stroke-width="0.18" />
                <text
                  y="-3.6"
                  text-anchor="middle"
                  font-size="1.65"
                  fill="#3B2818"
                  font-family="serif"
                  font-weight="600"
                  letter-spacing="0.15em"
                >翠苑小区</text>
                <text
                  y="-1.8"
                  text-anchor="middle"
                  font-size="1.2"
                  fill="#8B6F4D"
                  font-family="serif"
                  letter-spacing="0.2em"
                >她</text>
              </g>

              <!-- 1 km 连线 (虚线渐次画出) -->
              <line
                ref="lineEl"
                x1="38"
                y1="50"
                x2="62"
                y2="50"
                stroke="#3B2818"
                stroke-width="0.25"
                stroke-dasharray="1.2 0.8"
                stroke-linecap="round"
                opacity="0"
              />

              <!-- 距离刻度小标 -->
              <g ref="kmTagEl" class="km-tag" transform="translate(50, 50)" opacity="0">
                <rect x="-5.6" y="2.2" width="11.2" height="3.6" rx="1.8" fill="#FAF6F0" stroke="#E58955" stroke-width="0.18" />
                <text
                  y="4.8"
                  text-anchor="middle"
                  font-size="2.1"
                  fill="#E58955"
                  font-family="serif"
                  font-weight="700"
                  letter-spacing="0.1em"
                >1.0 km</text>
              </g>
            </g>
          </svg>
        </div>

        <!-- 圆形舞台边缘内圈晕染 (装饰) -->
        <div class="stage-vignette" aria-hidden="true"></div>
      </div>

      <!-- 舞台外暖橘环 (圆形舞台的描边) -->
      <div class="stage-ring" aria-hidden="true"></div>
    </div>

    <!-- ============ HTML 文字层 (独立于 SVG, 不受 zoom 影响) ============ -->
    <div class="text-layer">
      <p class="date-line" ref="dateEl">2021.10.31</p>
      <p class="lead" ref="leadEl">那一天，我们在一起了</p>

      <div class="stat-grid" ref="statGridEl">
        <div class="stat">
          <span class="stat-k">杭州</span>
          <span class="stat-v">16850 km²</span>
        </div>
        <div class="stat">
          <span class="stat-k">萧山</span>
          <span class="stat-v">1417 km²</span>
        </div>
        <div class="stat stat-hi">
          <span class="stat-k">我们</span>
          <span class="stat-v">1 km</span>
        </div>
      </div>

      <p class="final" ref="finalEl">缘分，刚好</p>
    </div>

    <!-- 重播按钮 -->
    <button v-if="finished" class="replay-btn" @click="replay">↻ 再看一次</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import {
  hangzhouDistricts,
  xiaoshanCenterInHangzhou,
} from './geoPaths.generated'

const props = defineProps<{ active?: boolean }>()
const emit = defineEmits<{
  (e: 'animation-done'): void
}>()

// 萧山区在杭州地图中的预计算位置
const xsCenter = xiaoshanCenterInHangzhou
const xiaoshanDistrictPath = hangzhouDistricts.find((d) => d.adcode === 330109)!.d

// === 引用 ===
const rootEl = ref<HTMLElement | null>(null)
const cameraEl = ref<HTMLElement | null>(null)
const hangzhouEl = ref<SVGGElement | null>(null)
const closeUpEl = ref<SVGGElement | null>(null)
const xsHighlightEl = ref<SVGPathElement | null>(null)
const xsLabelEl = ref<SVGGElement | null>(null)
const hzLabelEl = ref<SVGGElement | null>(null)

const dotMeEl = ref<SVGGElement | null>(null)
const dotHerEl = ref<SVGGElement | null>(null)
const lineEl = ref<SVGLineElement | null>(null)
const kmTagEl = ref<SVGGElement | null>(null)

const dateEl = ref<HTMLElement | null>(null)
const leadEl = ref<HTMLElement | null>(null)
const statGridEl = ref<HTMLElement | null>(null)
const finalEl = ref<HTMLElement | null>(null)

const finished = ref(false)
const hasPlayed = ref(false)
let timeline: gsap.core.Timeline | null = null

/**
 * 镜头辅助: 让 SVG 内的 (cx, cy) 居中在 100x100 viewBox, 并放大到 scale 倍
 * 公式: xPercent = (50 - cx) * scale, yPercent = (50 - cy) * scale
 */
function camTo(cx: number, cy: number, scale: number, duration: number, ease = 'power3.inOut') {
  return {
    scale,
    xPercent: (50 - cx) * scale,
    yPercent: (50 - cy) * scale,
    duration,
    ease,
    transformOrigin: '50% 50%',
  }
}

function buildTimeline() {
  finished.value = false
  if (timeline) timeline.kill()

  // ===== 初始态 =====
  gsap.set(cameraEl.value, { scale: 1, xPercent: 0, yPercent: 0, transformOrigin: '50% 50%' })
  gsap.set(hangzhouEl.value, { opacity: 1 })
  gsap.set(closeUpEl.value, { opacity: 0 })

  // 文字层
  ;[dateEl.value, leadEl.value, statGridEl.value, finalEl.value].forEach((el) => {
    if (el) gsap.set(el, { opacity: 0, y: 16 })
  })

  // 区淡入用 stagger
  if (hangzhouEl.value) {
    const districts = hangzhouEl.value.querySelectorAll('.district')
    gsap.set(districts, { opacity: 0, scale: 0.95, transformOrigin: '50% 50%' })
  }
  gsap.set(xsHighlightEl.value, { opacity: 0 })
  gsap.set(xsLabelEl.value, { opacity: 0, scale: 0.7, transformOrigin: '50% 50%' })
  gsap.set(hzLabelEl.value, { opacity: 0, y: -6 })

  // 近景元素
  gsap.set(dotMeEl.value, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' })
  gsap.set(dotHerEl.value, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' })
  gsap.set(lineEl.value, { opacity: 0 })
  gsap.set(kmTagEl.value, { opacity: 0, y: 6 })

  const tl = gsap.timeline({
    onComplete: () => {
      finished.value = true
      // 启动两个点的脉动循环 (无限)
      startPulse()
      // 通知外部:动画完成 (HomePage 据此 + 2s 后翻屏)
      emit('animation-done')
    },
  })

  // === 0.0s: 杭州地图 13 区依次淡入 (stagger) ===
  if (hangzhouEl.value) {
    const districts = hangzhouEl.value.querySelectorAll('.district')
    tl.to(
      districts,
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: 'power2.out',
        stagger: { each: 0.04, from: 'random' },
      },
      0.1
    )
  }
  tl.to(hzLabelEl.value, { opacity: 1, y: 0, duration: 0.6 }, 0.5)

  // === 1.4s: 萧山高亮亮起 ===
  tl.to(xsHighlightEl.value, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.4)
  tl.to(xsLabelEl.value, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 1.6)

  // === 2.4s: 镜头平滑拉近到萧山 (放大 2.4 倍) ===
  tl.to(cameraEl.value, camTo(xsCenter[0], xsCenter[1], 2.6, 1.6, 'power3.inOut'), 2.4)
  // 同时杭州整体标签淡出
  tl.to(hzLabelEl.value, { opacity: 0, duration: 0.6 }, 2.4)

  // === 4.0s: cross-fade 到近景层 ===
  tl.to(hangzhouEl.value, { opacity: 0, duration: 0.7 }, 4.0)
  tl.to(closeUpEl.value, { opacity: 1, duration: 0.7 }, 4.0)
  // 镜头复位 (从 2.6x scale 平滑回到 1.0)
  tl.to(cameraEl.value, camTo(50, 50, 1.0, 0.9, 'power2.inOut'), 4.0)

  // === 4.8s: 两个点 pop in ===
  tl.to(dotMeEl.value, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.8)' }, 4.8)
  tl.to(dotHerEl.value, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.8)' }, 4.95)

  // === 5.5s: 1km 连线渐次画出 ===
  tl.to(lineEl.value, { opacity: 1, duration: 0.4 }, 5.5)
  // strokeDashoffset 渐次填充
  tl.fromTo(
    lineEl.value,
    { attr: { 'stroke-dashoffset': 30 } },
    { attr: { 'stroke-dashoffset': 0 }, duration: 0.7, ease: 'power2.inOut' },
    5.55
  )

  // === 6.0s: 1 km 标签 pop ===
  tl.to(kmTagEl.value, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' }, 6.0)

  // === 文字层依次浮现 ===
  tl.to(dateEl.value, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 5.4)
  tl.to(leadEl.value, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 5.7)
  tl.to(statGridEl.value, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 6.2)
  tl.to(finalEl.value, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 7.0)

  timeline = tl
  return tl
}

let pulseTl: gsap.core.Timeline | null = null
function startPulse() {
  if (pulseTl) pulseTl.kill()
  pulseTl = gsap.timeline({ repeat: -1 })
  pulseTl.fromTo(
    [dotMeEl.value, dotHerEl.value].map((el) => el?.querySelectorAll('.pulse')).flat(),
    { scale: 1, opacity: 0.7, transformOrigin: '50% 50%' },
    { scale: 1.5, opacity: 0, duration: 1.6, ease: 'power2.out', stagger: 0.0 },
    0
  )
}

function play() {
  if (hasPlayed.value) return
  hasPlayed.value = true
  buildTimeline()
}

function replay() {
  hasPlayed.value = true
  if (pulseTl) pulseTl.kill()
  buildTimeline()
}

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as any).__oneKm = {
    replay,
    seek: (t: number) => {
      buildTimeline()
      timeline?.pause()
      timeline?.seek(t)
    },
    play,
  }
}

defineExpose({ play, replay })

onMounted(() => {
  if (cameraEl.value) gsap.set(cameraEl.value, { scale: 1, xPercent: 0, yPercent: 0 })
  if (closeUpEl.value) gsap.set(closeUpEl.value, { opacity: 0 })
  ;[dateEl.value, leadEl.value, statGridEl.value, finalEl.value].forEach((el) => {
    if (el) gsap.set(el, { opacity: 0 })
  })
  if (props.active) play()
})

watch(
  () => props.active,
  (v) => {
    if (v) play()
  }
)

onBeforeUnmount(() => {
  if (timeline) timeline.kill()
  if (pulseTl) pulseTl.kill()
})
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.one-km-wrap {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  user-select: none;
}

.one-km-anim {
  position: relative;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 1 / 1;
  pointer-events: none;
}

// 暖雾光晕: 在舞台外圈散开, 给"晨光暖雾"质感
.warm-fog {
  position: absolute;
  inset: -22%;
  background:
    radial-gradient(circle at 28% 22%, rgba(255, 220, 180, 0.55), transparent 55%),
    radial-gradient(circle at 78% 78%, rgba(245, 196, 196, 0.4), transparent 60%);
  filter: blur(18px);
  z-index: 0;
  pointer-events: none;
}

// 圆形舞台 (用 clip-path, 边缘比 border-radius 更利)
.stage-clip {
  position: absolute;
  inset: 0;
  clip-path: circle(48% at 50% 50%);
  -webkit-clip-path: circle(48% at 50% 50%);
  background: radial-gradient(circle at 35% 30%, #FFF6EA, #F2DBC0 95%);
  z-index: 1;
}

.camera {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}

.stage {
  width: 100%;
  height: 100%;
  display: block;
}

// 区/县路径基础样式
:deep(.district) {
  fill: url(#ok-land);
  stroke: #C9925E;
  stroke-width: 0.22;
  stroke-linejoin: round;
  transition: fill 0.2s;
}

:deep(.district.is-xs) {
  fill: url(#ok-xs);
}

// 萧山高亮 (上层重描)
:deep(.xs-highlight) {
  fill: url(#ok-xs);
  stroke: #B85C2F;
  stroke-width: 0.5;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 1.2px rgba(229, 137, 85, 0.6));
}

// 舞台内圈晕染 (装饰, 让边缘有"望远镜"渐隐感)
.stage-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 55%, rgba(45, 33, 24, 0.18) 100%);
  pointer-events: none;
  border-radius: 50%;
}

// 舞台外暖橘环 (轻细描边 + 阴影)
.stage-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  box-shadow:
    inset 0 0 0 1px rgba(229, 137, 85, 0.22),
    inset 0 0 0 6px rgba(255, 255, 255, 0.55),
    inset 0 0 0 7px rgba(229, 137, 85, 0.18),
    0 12px 36px rgba(45, 33, 24, 0.14),
    0 4px 14px rgba(229, 137, 85, 0.16);
  // 让边圈不进入 stage-clip 内部
  background: transparent;
  mask: radial-gradient(circle at 50% 50%, transparent 47%, black 47.5%);
  -webkit-mask: radial-gradient(circle at 50% 50%, transparent 47%, black 47.5%);
}

// ===== 文字层 =====
.text-layer {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  margin-top: 4px;
}

.date-line {
  margin: 0;
  font-family: $serif-en;
  font-size: 0.95rem;
  letter-spacing: 0.32em;
  color: $accent-deep;
  font-weight: 600;
  will-change: transform, opacity;
}

.lead {
  margin: 2px 0 6px 0;
  font-family: $serif-zh;
  font-size: 1rem;
  letter-spacing: 0.2em;
  color: $text;
  will-change: transform, opacity;
}

.stat-grid {
  display: flex;
  gap: 18px;
  align-items: baseline;
  margin-top: 2px;
  will-change: transform, opacity;

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-k {
    font-family: $serif-zh;
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    color: $text-light;
  }

  .stat-v {
    font-family: $serif-en;
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    color: $text-light;
    font-weight: 500;
  }

  .stat-hi {
    .stat-k { color: $accent-deep; font-weight: 600; }
    .stat-v {
      color: $accent-deep;
      font-weight: 700;
      font-size: 0.92rem;
    }
  }
}

.final {
  margin: 8px 0 0 0;
  font-family: $serif-zh;
  font-size: clamp(1.45rem, 6vw, 1.85rem);
  font-weight: 600;
  letter-spacing: 0.42em;
  color: $accent-deep;
  text-shadow:
    0 0 14px rgba(245, 165, 114, 0.45),
    0 0 4px rgba(245, 165, 114, 0.3);
  will-change: transform, opacity;
}

.replay-btn {
  position: relative;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(229, 137, 85, 0.4);
  color: $accent-deep;
  font-family: $sans;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  padding: 6px 14px;
  border-radius: 999px;
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);

  &:active {
    transform: scale(0.96);
  }
}
</style>
