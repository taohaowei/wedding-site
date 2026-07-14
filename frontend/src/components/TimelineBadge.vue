<template>
  <div class="timeline-badge" ref="rootEl">
    <div class="badge-line"></div>
    <div class="badge-date">{{ date }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'

const props = defineProps<{ date: string; active?: boolean }>()
const rootEl = ref<HTMLElement | null>(null)

function play() {
  if (!rootEl.value) return
  gsap.fromTo(
    rootEl.value,
    { opacity: 0, x: 24, filter: 'blur(6px)' },
    { opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay: 0.1 }
  )
}

defineExpose({ play })

onMounted(() => {
  if (props.active) play()
})

watch(
  () => props.active,
  (v) => {
    if (v) play()
  }
)
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

/* 角标大字日期组件:右上,衬线字体竖排小线 + 大日期数字
   注意:BgmPlayer 在 right:16px, top:16px, 占 44x44 的圆形按钮 (z-index:200)
   角标必须避开它,所以 right 设为 ~70px 以上 */
.timeline-badge {
  position: absolute;
  top: clamp(4dvh, 5dvh, 6dvh);
  right: clamp(70px, 18vw, 84px);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 12px);
  pointer-events: none;
  user-select: none;
  max-width: calc(100vw - 100px);
}

.badge-line {
  width: clamp(14px, 5vw, 28px);
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(229, 137, 85, 0.85));
  flex-shrink: 0;
}

.badge-date {
  font-family: $serif-en;
  font-size: clamp(0.8rem, 3.2vw, 1.25rem);
  letter-spacing: clamp(.08em, 0.6vw, 0.18em);
  color: $accent-deep;
  font-style: italic;
  font-weight: 500;
  text-shadow: 0 1px 8px rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

/* 短屏适配:稍微下移 */
@media (max-height: 700px) {
  .timeline-badge {
    top: 3dvh;
  }
}

/* 极窄屏(<=360):线条太宽会挤,直接隐藏装饰线 */
@media (max-width: 360px) {
  .badge-line {
    display: none;
  }
}
</style>
