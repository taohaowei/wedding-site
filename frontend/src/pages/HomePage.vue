<template>
  <div class="home-root">
    <BgmPlayer src="/audio/bgm.mp3" />

    <!-- 顶部进度条 -->
    <div class="progress-bar" :style="{ width: progress + '%' }"></div>

    <swiper
      :direction="'vertical'"
      :slides-per-view="1"
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
        <StorySection :story="s" :active="activeIndex === i + 1" />
      </swiper-slide>

      <!-- 屏 7-9 婚纱照 -->
      <swiper-slide v-for="(p, i) in photoSets" :key="p.id">
        <PhotoSection :set="p" :active="activeIndex === 6 + i" />
      </swiper-slide>

      <!-- 屏 10 婚礼信息 -->
      <swiper-slide><VenueSection /></swiper-slide>

      <!-- 屏 11 RSVP -->
      <swiper-slide><RsvpSection @next="goTo(11)" /></swiper-slide>

      <!-- 屏 12 致谢 -->
      <swiper-slide><ThanksSection @restart="goTo(0)" /></swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Mousewheel, Keyboard } from 'swiper/modules'
import 'swiper/css'

import { stories } from '@/data/stories'
import { photoSets } from '@/data/photos'
import { useViewportHeight } from '@/composables/useViewportHeight'
import { probeBackend } from '@/api/client'

import BgmPlayer from '@/components/BgmPlayer.vue'
import CoverSection from '@/sections/CoverSection.vue'
import StorySection from '@/sections/StorySection.vue'
import PhotoSection from '@/sections/PhotoSection.vue'
import VenueSection from '@/sections/VenueSection.vue'
import RsvpSection from '@/sections/RsvpSection.vue'
import ThanksSection from '@/sections/ThanksSection.vue'

useViewportHeight()
probeBackend() // 探活后端,失败自动 mock

const modules = [Mousewheel, Keyboard]
const TOTAL = 12
let mainSw: any = null

const activeIndex = ref(0)
const progress = computed(() => Math.round(((activeIndex.value + 1) / TOTAL) * 100))

function onMainInit(sw: any) { mainSw = sw }

function onSlideChange(sw: any) {
  activeIndex.value = sw?.activeIndex ?? 0
  // 屏 9(idx 8)是港式黑白,切到时 body 加 .theme-bw
  if (activeIndex.value === 8) {
    document.body.classList.add('theme-bw')
  } else {
    document.body.classList.remove('theme-bw')
  }
}

function goTo(idx: number) {
  if (mainSw) mainSw.slideTo(idx, 700)
}

watch(activeIndex, (v) => {
  // 滚到底自动停留在致谢屏
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
</style>
