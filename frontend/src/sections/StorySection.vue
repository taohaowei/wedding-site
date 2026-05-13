<template>
  <section class="story-section" :class="`story-${story.id}`">
    <div class="bg-tint"></div>

    <div class="illust" ref="illustEl">
      <img v-if="!imgFailed" :src="story.illustration" :alt="story.title" @error="imgFailed = true" />
      <div v-else class="illust-placeholder">
        <span class="ph-tag">{{ story.badge }}</span>
        <span class="ph-text">插画占位 · {{ story.title }}</span>
      </div>
    </div>

    <div class="content">
      <p class="badge" ref="badgeEl">{{ story.badge }}</p>
      <h2 class="title" ref="titleEl">{{ story.title }}</h2>

      <div class="paragraphs">
        <p v-for="(p, i) in story.paragraphs" :key="i" :ref="(el) => (pEls[i] = el as any)">{{ p }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import type { StoryItem } from '@/data/stories'

const props = defineProps<{ story: StoryItem; active?: boolean }>()

const illustEl = ref<HTMLElement | null>(null)
const badgeEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const pEls = ref<HTMLElement[]>([])
const imgFailed = ref(false)

function play() {
  const tl = gsap.timeline()
  if (illustEl.value) {
    gsap.set(illustEl.value, { opacity: 0, x: 60, y: 30, scale: 0.96 })
    tl.to(illustEl.value, { opacity: 1, x: 0, y: 0, scale: 1, duration: 1.1, ease: 'power3.out' }, 0)
  }
  if (badgeEl.value) {
    gsap.set(badgeEl.value, { opacity: 0, y: 20 })
    tl.to(badgeEl.value, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
  }
  if (titleEl.value) {
    gsap.set(titleEl.value, { opacity: 0, y: 40, filter: 'blur(8px)' })
    tl.to(titleEl.value, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9 }, 0.35)
  }
  pEls.value.forEach((el, i) => {
    if (!el) return
    gsap.set(el, { opacity: 0, y: 30, filter: 'blur(6px)' })
    tl.to(el, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7 }, 0.6 + i * 0.25)
  })
}

defineExpose({ play })

onMounted(() => { if (props.active) play() })

watch(() => props.active, (v) => { if (v) play() })
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.story-section {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 28px 8dvh 28px;
}

.bg-tint {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255, 217, 184, .55) 0%, transparent 55%),
              radial-gradient(circle at 80% 80%, rgba(244, 196, 196, .35) 0%, transparent 55%),
              $bg;
}

// 不同故事配色微调
.story-meet .bg-tint { background: radial-gradient(circle at 30% 20%, rgba(255, 217, 184, .55), transparent 60%), $bg; }
.story-one-km .bg-tint { background: radial-gradient(circle at 70% 30%, rgba(110, 92, 142, .15), transparent 60%), $bg; }
.story-sincere .bg-tint { background: radial-gradient(circle at 50% 30%, rgba(244, 196, 196, .35), transparent 60%), $bg; }
.story-five-years .bg-tint { background: radial-gradient(circle at 30% 80%, rgba(255, 217, 184, .35), transparent 60%), $bg; }
.story-decision .bg-tint { background: radial-gradient(circle at 50% 50%, rgba(245, 165, 114, .25), transparent 70%), $bg; }

.illust {
  position: absolute;
  bottom: 38%;
  right: -8vw;
  width: 78vw;
  max-width: 480px;
  height: auto;
  z-index: 1;
  pointer-events: none;
  will-change: transform, opacity;

  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    filter: drop-shadow(0 12px 24px rgba(245, 165, 114, .25));
  }
}

.illust-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 24px;
  background: linear-gradient(135deg, $soft, $pink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(45, 33, 24, .55);
  font-family: $serif-zh;
  letter-spacing: .15em;

  .ph-tag { font-family: $serif-en; font-style: italic; font-size: 1rem; }
  .ph-text { font-size: .9rem; }
}

.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 560px;
  margin-bottom: 4dvh;
}

.badge {
  font-family: $serif-en;
  font-style: italic;
  letter-spacing: .35em;
  color: $accent-deep;
  font-size: .85rem;
  margin: 0;
}

.title {
  font-family: $serif-zh;
  font-weight: 600;
  font-size: clamp(2rem, 8vw, 3rem);
  letter-spacing: .15em;
  margin: 0;
  color: $text;
  line-height: 1.1;
}

.paragraphs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;

  p {
    margin: 0;
    font-family: $serif-zh;
    letter-spacing: .1em;
    line-height: 1.85;
    font-size: clamp(0.98rem, 4vw, 1.12rem);
    color: $text;
  }
}
</style>
