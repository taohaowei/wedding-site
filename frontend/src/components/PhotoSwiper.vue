<template>
  <div class="photo-swiper" :class="{ 'theme-bw': theme === 'bw' }">
    <swiper
      :slides-per-view="1.05"
      :space-between="14"
      :centered-slides="true"
      :nested="true"
      :grab-cursor="true"
      :touch-move-stop-propagation="true"
      :pagination="{ clickable: true }"
      :modules="modules"
      class="ps-swiper"
    >
      <swiper-slide v-for="(p, i) in slides" :key="i" class="ps-slide">
        <div class="card">
          <img v-if="p.src" :src="p.src" :alt="`婚纱照 ${i+1}`" loading="lazy" />
          <div v-else class="placeholder">
            <span class="ph-num">{{ i + 1 }} / {{ slides.length }}</span>
            <span class="ph-text">婚纱照占位</span>
          </div>
          <div class="card-tag">{{ String(i + 1).padStart(2, '0') }} / {{ String(slides.length).padStart(2, '0') }}</div>
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Mousewheel } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const props = defineProps<{
  // public 路径下的图片(已被 import.meta.glob 收上来)
  photos: string[]
  theme?: 'light' | 'bw'
  fallbackCount?: number
}>()

const modules = [Pagination, Mousewheel]

const slides = computed(() => {
  // 真实照片
  const real = (props.photos ?? []).map(src => ({ src }))
  // 目标张数:不足则用占位卡补足,让左滑始终能看到"还能放更多照片"的参考
  const target = props.fallbackCount ?? 5
  if (real.length >= target) return real
  const pad = Array.from({ length: target - real.length }, () => ({ src: '' }))
  return [...real, ...pad]
})
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.photo-swiper {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  min-height: 0;
}

.ps-swiper {
  width: 100%;
  height: 100%;
}

.ps-slide {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  width: 100%;
  height: 100%;
  max-height: 70dvh;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255,255,255,.4);
  box-shadow: $shadow-md;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, $soft, $pink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(45, 33, 24, .55);

  .ph-num { font-family: $serif-en; font-size: 2.6rem; font-style: italic; }
  .ph-text { font-family: $serif-zh; letter-spacing: .2em; }
}

.card-tag {
  position: absolute;
  bottom: 16px;
  right: 18px;
  font-family: $serif-en;
  font-style: italic;
  font-size: .85rem;
  color: rgba(255,255,255,.85);
  text-shadow: 0 1px 4px rgba(0,0,0,.4);
  letter-spacing: .1em;
}

.theme-bw {
  .card { background: #2a2a2a; box-shadow: 0 8px 24px rgba(0,0,0,.6); }
  .placeholder {
    background: linear-gradient(135deg, #2a2a2a, #444);
    color: rgba(255,255,255,.6);
  }
  .card-tag { color: rgba(255,255,255,.7); }
  :deep(.swiper-pagination-bullet) { background: $bw-text; opacity: .35; }
  :deep(.swiper-pagination-bullet-active) { background: $bw-text; opacity: 1; }
}
</style>
