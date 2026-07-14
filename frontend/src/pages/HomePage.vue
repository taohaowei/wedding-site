<template>
  <div class="home-root">
    <BgmPlayer :src="p('/audio/bgm.mp3')" />

    <!-- 顶部进度条 -->
    <div class="progress-bar" :style="{ width: progress + '%' }"></div>

    <!-- 全局浮动:景德镇攻略入口(右下,任何屏都可见) -->
    <RouterLink
      to="/guide"
      class="guide-fab"
      aria-label="景德镇一日攻略"
      title="景德镇一日攻略"
    >
      <span class="ic">🍵</span>
      <span class="t">景德镇攻略</span>
    </RouterLink>

    <!-- 自动播放开关(右上,BgmPlayer 旁) -->
    <button
      class="autoplay-toggle"
      :class="{ off: !autoplay.enabled.value }"
      :aria-label="autoplay.enabled.value ? '暂停自动滑屏' : '开启自动滑屏'"
      :title="autoplay.enabled.value ? '暂停自动滑屏' : '开启自动滑屏'"
      @click="autoplay.toggle"
    >
      <svg v-if="autoplay.enabled.value" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <rect x="6" y="5" width="4" height="14" fill="currentColor" rx="1"/>
        <rect x="14" y="5" width="4" height="14" fill="currentColor" rx="1"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M7 5l12 7-12 7z" fill="currentColor"/>
      </svg>
    </button>

    <swiper
      :direction="'vertical'"
      :slides-per-view="1"
      :initial-slide="initialSlide"
      :speed="700"
      :mousewheel="{ forceToAxis: true, sensitivity: 1 }"
      :keyboard="{ enabled: true }"
      :modules="modules"
      :touch-release-on-edges="true"
      class="main-swiper"
      @swiper="onMainInit"
      @slide-change="onSlideChange"
    >
      <!-- 屏 1 封面 -->
      <swiper-slide><CoverSection /></swiper-slide>

      <!-- 屏 2-6 故事 -->
      <swiper-slide v-for="(s, i) in stories" :key="s.id">
        <StorySection
          :story="s"
          :active="activeIndex === i + 1"
          @animation-done="onAnimationDone(i + 1)"
        />
      </swiper-slide>

      <!-- 屏 7-9 婚纱照 -->
      <swiper-slide v-for="(p, i) in photoSets" :key="p.id">
        <PhotoSection :set="p" :active="activeIndex === 6 + i" />
      </swiper-slide>

      <!-- 屏 10 婚礼信息 -->
      <swiper-slide><VenueSection @expanded-change="(v) => autoplay.setVenueExpanded(v)" /></swiper-slide>

      <!-- 屏 11 RSVP -->
      <swiper-slide><RsvpSection @next="goTo(11)" /></swiper-slide>

      <!-- 屏 12 致谢 -->
      <swiper-slide><ThanksSection @restart="goTo(0)" /></swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Mousewheel, Keyboard } from 'swiper/modules'
import 'swiper/css'

import { stories } from '@/data/stories'
import { photoSets } from '@/data/photos'
import { useViewportHeight } from '@/composables/useViewportHeight'
import { useAutoplay } from '@/composables/useAutoplay'
import { probeBackend } from '@/api/client'

import BgmPlayer from '@/components/BgmPlayer.vue'
import { p } from '@/utils/path'
import CoverSection from '@/sections/CoverSection.vue'
import StorySection from '@/sections/StorySection.vue'
import PhotoSection from '@/sections/PhotoSection.vue'
import VenueSection from '@/sections/VenueSection.vue'
import RsvpSection from '@/sections/RsvpSection.vue'
import ThanksSection from '@/sections/ThanksSection.vue'

useViewportHeight()
probeBackend() // 探活后端,失败自动 mock

const autoplay = useAutoplay()

const modules = [Mousewheel, Keyboard]
const TOTAL = 12
let mainSw: any = null

const activeIndex = ref(0)
const progress = computed(() => Math.round(((activeIndex.value + 1) / TOTAL) * 100))

// 调试用:从 vue-router query (#/?slide=N) 读 slide 参数,直接定位到指定屏
const route = useRoute()
const initialSlide = (() => {
  try {
    const q = route.query.slide
    const n = parseInt((Array.isArray(q) ? q[0] : q) || '0', 10)
    return isNaN(n) || n < 0 || n >= TOTAL ? 0 : n
  } catch { return 0 }
})()

function onMainInit(sw: any) {
  mainSw = sw
  autoplay.setSwiper(sw)
}

function onSlideChange(sw: any) {
  activeIndex.value = sw?.activeIndex ?? 0
  // 屏 9(idx 8)是港式黑白,切到时 body 加 .theme-bw
  if (activeIndex.value === 8) {
    document.body.classList.add('theme-bw')
  } else {
    document.body.classList.remove('theme-bw')
  }
}

function onAnimationDone(slideIdx: number) {
  autoplay.notifyAnimationDone(slideIdx)
}

function goTo(idx: number) {
  if (mainSw) mainSw.slideTo(idx, 700)
}

watch(activeIndex, (v) => {
  if (v === TOTAL - 1) console.log('to thanks')
})

onBeforeUnmount(() => {
  document.body.classList.remove('theme-bw')
})
</script>

<style lang="scss" scoped>
.home-root {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.main-swiper {
  width: 100%;
  height: 100%;
}

:deep(.swiper-slide) {
  width: 100%;
  height: 100%;
}

/* 自动播放开关 — 右上,在 BgmPlayer 左侧 */
.autoplay-toggle {
  position: fixed;
  top: max(16px, env(safe-area-inset-top, 0));
  right: 70px; // 让位 BgmPlayer(BgmPlayer 在 top:16, right:16, 44x44)
  z-index: 200;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(110, 92, 142, .25);
  background: rgba(255, 255, 255, .7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #6E5C8E;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity .2s, transform .2s;
  padding: 0;

  &:hover { transform: scale(1.06); }
  &.off { opacity: .55; }
  &:active { transform: scale(.92); }
}

/* 景德镇攻略浮动入口 — 右下,胶囊型,所有屏可见 */
.guide-fab {
  position: fixed;
  right: max(14px, env(safe-area-inset-right, 0));
  bottom: max(20px, env(safe-area-inset-bottom, 0));
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(245, 165, 114, .35);
  color: #2D2118;
  text-decoration: none;
  font-size: 13px;
  letter-spacing: .15em;
  font-family: 'PingFang SC', system-ui, sans-serif;
  box-shadow: 0 6px 18px rgba(245, 165, 114, .25);
  transition: transform .15s, box-shadow .15s;

  .ic { font-size: 1.1rem; line-height: 1; }
  .t { white-space: nowrap; }

  &:hover, &:active {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(245, 165, 114, .35);
  }

  /* 窄屏只显示图标 */
  @media (max-width: 360px) {
    padding: 10px;
    .t { display: none; }
  }
}
</style>
