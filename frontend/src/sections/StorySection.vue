<template>
  <section class="story-section" :class="[`story-${story.id}`, { 'has-bg-photo': !!story.bgPhoto }]">
    <!-- 全屏背景照片层(订婚屏专用) -->
    <div v-if="story.bgPhoto" class="bg-photo" :style="bgPhotoStyle" aria-hidden="true"></div>
    <div v-if="story.bgPhoto" class="bg-photo-overlay" aria-hidden="true"></div>

    <!-- 普通故事屏的色板背景 -->
    <div v-else class="bg-tint"></div>

    <!-- 时间角标(右上方) -->
    <TimelineBadge v-if="story.date" :date="story.date" :active="active" />

    <!-- 故事② 一公里: 用 SVG 动画替换静态插画 -->
    <div v-if="story.id === 'one-km'" class="illust illust-anim" ref="illustEl">
      <OneKmAnimation :active="active" @animation-done="emit('animation-done')" />
    </div>
    <!-- 订婚屏:横滑 PhotoSwiper(同婚纱照风格) -->
    <div v-else-if="story.id === 'engagement'" class="illust illust-photoset" ref="illustEl">
      <PhotoSwiper v-if="engagementPhotos.length > 0" :photos="engagementPhotos" theme="light" :fallback-count="4" />
      <div v-else class="illust-placeholder" style="height:260px">
        <span class="ph-tag">{{ story.badge }}</span>
        <span class="ph-text">请放入订婚照 📸</span>
      </div>
    </div>
    <!-- 决定屏(故事⑤):左女右男的双图 -->
    <div v-else-if="story.id === 'decision'" class="illust illust-pair" ref="illustEl">
      <div class="pair-card pair-left">
        <img :src="proposalLeftSrc" alt="她,在那一刻接受了" @error="onProposalImgError($event, 'left')" />
        <span v-if="!proposalLeftFailed" class="pair-tag">她,在那一刻</span>
        <span v-else class="pair-tag pair-tag-placeholder">💍 请放入求婚照</span>
      </div>
      <div class="pair-card pair-right">
        <img :src="proposalRightSrc" alt="他,跪下问出口" @error="onProposalImgError($event, 'right')" />
        <span v-if="!proposalRightFailed" class="pair-tag">他,问出了口</span>
        <span v-else class="pair-tag pair-tag-placeholder">💍 请放入求婚照</span>
      </div>
    </div>
    <div v-else class="illust" ref="illustEl">
      <img v-if="!imgFailed" :src="p(story.illustration)" :alt="story.title" @error="imgFailed = true" />
      <div v-else class="illust-placeholder">
        <span class="ph-tag">{{ story.badge }}</span>
        <span class="ph-text">插画占位 · {{ story.title }}</span>
      </div>
    </div>

    <div class="content">
      <p class="badge" ref="badgeEl">{{ story.badge }}</p>
      <h2 class="title" ref="titleEl">{{ story.title }}</h2>
      <p v-if="story.subtitle" class="subtitle" ref="subtitleEl">{{ story.subtitle }}</p>

      <div class="paragraphs">
        <p v-for="(p, i) in story.paragraphs" :key="i" :ref="(el) => (pEls[i] = el as any)">{{ p }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { p } from '../utils/path'
import { gsap } from 'gsap'
import type { StoryItem } from '@/data/stories'
import OneKmAnimation from '@/components/OneKmAnimation.vue'
import TimelineBadge from '@/components/TimelineBadge.vue'
import PhotoSwiper from '@/components/PhotoSwiper.vue'

const props = defineProps<{ story: StoryItem; active?: boolean }>()
const emit = defineEmits<{ 'animation-done': [] }>()

const illustEl = ref<HTMLElement | null>(null)
const badgeEl = ref<HTMLElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)
const subtitleEl = ref<HTMLElement | null>(null)
const pEls = ref<HTMLElement[]>([])
const imgFailed = ref(false)
const engagementPhotos = ref<string[]>([])
const proposalLeftFailed = ref(false)
const proposalRightFailed = ref(false)

// 使用动态绑定避免 Vite 编译时尝试解析不存在的照片文件
const proposalLeftSrc = p('/photos/_proposal/被求婚.jpg')
const proposalRightSrc = p('/photos/_proposal/单膝跪异地求婚.jpg')

function onProposalImgError(_e: Event, side: 'left' | 'right') {
  if (side === 'left') proposalLeftFailed.value = true
  else proposalRightFailed.value = true
}

// 处理含中文/括号的图片路径,使用 encodeURI 避免空格/括号导致 URL 异常
const bgPhotoStyle = computed(() => {
  if (!props.story.bgPhoto) return {}
  return {
    backgroundImage: `url('${encodeURI(p(props.story.bgPhoto))}')`
  }
})

// 订婚屏:fetch manifest.json 拿照片列表
async function loadEngagementPhotos() {
  try {
    const res = await fetch(p('/photos/engagement/manifest.json'), { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const list = (await res.json()) as string[]
    if (Array.isArray(list)) {
      engagementPhotos.value = list.map(name => p(`/photos/engagement/${encodeURIComponent(name)}`))
    }
  } catch (e) {
    console.warn('[StorySection] engagement manifest 加载失败:', e)
  }
}

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
  if (subtitleEl.value) {
    gsap.set(subtitleEl.value, { opacity: 0, y: 20 })
    tl.to(subtitleEl.value, { opacity: 1, y: 0, duration: 0.7 }, 0.55)
  }
  pEls.value.forEach((el, i) => {
    if (!el) return
    gsap.set(el, { opacity: 0, y: 30, filter: 'blur(6px)' })
    tl.to(el, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7 }, 0.7 + i * 0.25)
  })
}

defineExpose({ play })

onMounted(() => {
  if (props.story.id === 'engagement') loadEngagementPhotos()
  if (props.active) play()
})

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
  /* 窄屏减小左右内边距,避免文字横向溢出 */
  padding: 0 clamp(14px, 5vw, 28px) clamp(5dvh, 8dvh, 8dvh) clamp(14px, 5vw, 28px);
  box-sizing: border-box;
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
.story-engagement .bg-tint { background: radial-gradient(circle at 30% 80%, rgba(255, 217, 184, .35), transparent 60%), $bg; }
.story-decision .bg-tint { background: radial-gradient(circle at 50% 50%, rgba(245, 165, 114, .25), transparent 70%), $bg; }

/* 全屏照片背景模式(订婚屏 / 真诚屏) */
.bg-photo {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center 28%;
  background-repeat: no-repeat;
  filter: saturate(.95) brightness(1.02);
  transform: scale(1.04);
  will-change: transform;
}

/* 真诚屏专属:暖色滤镜 + 焦点偏右(原万圣节照片人物在右半边) */
.story-sincere .bg-photo {
  background-position: 65% 30%;
  filter: saturate(1.05) brightness(1.04) contrast(1.02) sepia(0.06);
}

.bg-photo-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, .15) 0%,
    rgba(250, 246, 240, .55) 45%,
    rgba(250, 246, 240, .92) 78%,
    #FAF6F0 100%
  );
  pointer-events: none;
}

/* 订婚屏文字落在下半部分 */
.story-section.has-bg-photo {
  justify-content: flex-end;
  padding-bottom: 10dvh;
}

.illust {
  position: absolute;
  /* 上半屏居中放置,给底部文字留出 ~42% 空间 */
  top: clamp(4dvh, 6dvh, 8dvh);
  bottom: auto;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: clamp(220px, 70vw, 380px);
  max-width: 380px;
  height: auto;
  z-index: 1;
  pointer-events: none;
  will-change: transform, opacity;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: auto;
    max-height: 42dvh;
    object-fit: contain;
    filter: drop-shadow(0 12px 24px rgba(245, 165, 114, .25));
  }
}

// 故事② 动画版: 圆形舞台 + 文字垂直居中, 在屏幕上半部分
.illust-anim {
  position: absolute;
  top: clamp(4dvh, 6dvh, 8dvh);
  bottom: auto;
  right: 0;
  left: 0;
  margin: 0 auto;
  /* 窄屏~260, iPad/PC 上限 340, 不至于在大屏被拉太大 */
  width: clamp(220px, 68vw, 340px);
  max-width: 340px;
  height: auto;
  pointer-events: auto; // 允许重播按钮可点
  display: flex;
  justify-content: center;
}

/* iPad/中等屏幕,OneKm 不要拉太大 */
@media (min-width: 600px) {
  .illust-anim {
    width: clamp(260px, 42vw, 320px);
    max-width: 320px;
  }
}

// 订婚屏: 横滑 PhotoSwiper, 在屏幕上半部分,占满宽度
.illust-photoset {
  position: absolute;
  top: 6dvh;
  bottom: 30%;
  left: 0;
  right: 0;
  width: 100%;
  height: auto;
  pointer-events: auto; // 允许 swiper 触摸
  display: flex;
  justify-content: center;
  padding: 0;
  box-sizing: border-box;
}

// 决定屏: 左右并排双图(左女接受 / 右男求婚)
// 关键:
//   1. 必须完全覆盖 .illust 默认的 width: clamp(220px, 70vw, 380px),否则两图被挤到中间
//   2. 占满 viewport 横宽(只留 6-8px 边距),高度占 50-58dvh
//   3. 与底部文字之间留 12px+ 间距,与顶部 TimelineBadge 也错开
//   4. 角标 2026.06.13 在右上方,必须给 BgmPlayer(右上 56px 圆形) 让位
.illust-pair {
  /* 完全覆盖 .illust 的 width / max-width / margin / inset */
  position: absolute;
  /* 顶部留 9dvh 给 TimelineBadge(约 30px+) */
  top: clamp(7dvh, 9dvh, 11dvh);
  /* 高度占 50dvh,底部留 41dvh 给文字 + padding-bottom */
  bottom: 41dvh;
  left: 6px;
  right: 6px;
  /* 强制铺满,覆盖 .illust 的 clamp(220px, 70vw, 380px)
     用 calc 显式给定宽度,确保在窄屏铺满。
     注意:不能用 !important,否则 768+ / 横屏的 media query 无法接管 */
  width: calc(100% - 12px);
  max-width: none;
  margin: 0;
  display: flex;
  gap: 6px;
  pointer-events: none;
  z-index: 1;
}

.pair-card {
  flex: 1 1 0;
  min-width: 0; // flex 子项默认 min-width:auto 会撑爆容器
  position: relative;
  border-radius: clamp(10px, 3.5vw, 16px);
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(45, 33, 24, .18);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    /* 覆盖 .illust img 默认的 max-height: 42dvh,让卡片自由撑满 */
    max-height: none;
    filter: none;
  }

  /* 左图:女生在原图横向 ~50%,头部在 22% 位置 */
  &.pair-left img {
    object-position: 50% 22%;
  }

  /* 右图:男生在原图右侧 60-95%,焦点往右拉到 78% */
  &.pair-right img {
    object-position: 78% 25%;
  }
}

.pair-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-family: $serif-zh;
  letter-spacing: .15em;
  font-size: clamp(.72rem, 2.6vw, .85rem);
  color: #fff;
  text-shadow: 0 2px 6px rgba(0, 0, 0, .85), 0 0 4px rgba(0, 0, 0, .6);
  padding: clamp(14px, 4vw, 22px) 6px clamp(6px, 2vw, 10px);
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, .45));
  pointer-events: none;
}

/* 决定屏专属:
   - content 区往上挤一些,留出更多照片空间
   - title / subtitle 收紧间距,paragraphs 字号略小,避免溢出
   - 防止文字与照片底部重叠 → padding-bottom 增大,把整体往上挤 */
.story-decision {
  /* 整屏底部 padding 增大,把文字区抬高,与照片留出间距 */
  padding-bottom: clamp(7dvh, 9dvh, 11dvh);

  .content {
    /* 文字区缩小 margin-bottom 让其更紧凑 */
    margin-bottom: 2dvh;
    gap: clamp(6px, 1.6vw, 12px);
  }

  /* 决定屏标题不要太大,避免 320 单字撑满 */
  .title {
    font-size: clamp(1.5rem, 6.4vw, 2.6rem);
  }
  .subtitle {
    font-size: clamp(.78rem, 2.6vw, .9rem);
  }
  .paragraphs p {
    font-size: clamp(.82rem, 3.2vw, 1.02rem);
    line-height: 1.6;
  }
}

/* 360 及以下窄屏:gap 收紧 + 字号再小一点,确保人物不被挤压 */
@media (max-width: 360px) {
  .illust-pair {
    left: 6px;
    right: 6px;
    gap: 5px;
    bottom: 42dvh;
  }
  .pair-tag {
    letter-spacing: .1em;
    font-size: .68rem;
    padding: 10px 4px 5px;
  }
}

/* 768+ 平板:文字区会变宽,但双图保持视觉重心,不撑到全宽显得太散
   - 双图限制最大宽度 720,居中
   - 高度占 56dvh,文字与照片有充足留白 */
@media (min-width: 768px) {
  .illust-pair {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(92vw, 720px);
    max-width: 720px;
    top: clamp(8dvh, 10dvh, 12dvh);
    bottom: 38dvh;
    gap: 14px;
  }
  .pair-card {
    border-radius: 18px;
  }
  .pair-tag {
    font-size: 1rem;
    letter-spacing: .2em;
  }
}

/* 横屏(如 iPhone landscape):空间高度小,改成左右挤 + 高度占 70dvh */
@media (orientation: landscape) and (max-height: 500px) {
  .illust-pair {
    /* 横屏:双图占左侧 60% 宽度,文字占右侧 40% */
    top: 6dvh;
    bottom: 6dvh;
    left: 8px;
    right: auto;
    width: 58vw;
    max-width: 58vw;
    gap: 8px;
    transform: none;
  }
  .story-decision .content {
    /* 文字区收到右侧 38% 宽 */
    position: absolute;
    right: clamp(12px, 2vw, 24px);
    bottom: 6dvh;
    width: 38vw;
    max-width: 38vw;
    margin-bottom: 0;
    z-index: 2;
  }
  .pair-tag {
    font-size: .72rem;
    letter-spacing: .12em;
    padding: 10px 4px 5px;
  }
}

.illust-placeholder {
  width: 100%;
  /* 不再强制 1:1, 改成更修长的 4:5,在窄屏不会顶到文字 */
  aspect-ratio: 4 / 5;
  max-height: 40dvh;
  border-radius: clamp(16px, 5vw, 24px);
  background: linear-gradient(135deg, $soft, $pink);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 2vw, 10px);
  padding: clamp(12px, 4vw, 20px);
  box-sizing: border-box;
  color: rgba(45, 33, 24, .6);
  font-family: $serif-zh;
  letter-spacing: .15em;
  text-align: center;
  box-shadow: 0 12px 28px rgba(245, 165, 114, .18);

  .ph-tag {
    font-family: $serif-en;
    font-style: italic;
    font-size: clamp(.85rem, 3.4vw, 1rem);
    letter-spacing: .25em;
  }
  .ph-text {
    font-size: clamp(.78rem, 3vw, .9rem);
    line-height: 1.4;
    word-break: keep-all;
  }
}

.content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 2vw, 14px);
  width: 100%;
  max-width: 560px;
  margin-bottom: 4dvh;
  /* 防止子元素(中文长串)撑爆容器 */
  min-width: 0;
}

.badge {
  font-family: $serif-en;
  font-style: italic;
  letter-spacing: clamp(.2em, 1vw, .35em);
  color: $accent-deep;
  font-size: clamp(.72rem, 2.6vw, .85rem);
  margin: 0;
}

.title {
  font-family: $serif-zh;
  font-weight: 600;
  /* 窄屏起点降到 1.5rem,避免 320 屏 "相 · 亲" 单字 + 间隔超出 */
  font-size: clamp(1.5rem, 7vw, 3rem);
  letter-spacing: clamp(.06em, 1.6vw, .15em);
  margin: 0;
  color: $text;
  line-height: 1.15;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

/* 副标题:小一号的衬线英文/数字日期 */
.subtitle {
  font-family: $serif-en;
  font-style: italic;
  letter-spacing: clamp(.18em, 1vw, .25em);
  color: $accent-deep;
  font-size: clamp(.82rem, 3vw, .95rem);
  margin: 2px 0 0 0;
  opacity: .85;
}

.paragraphs {
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 1.2vw, 8px);
  margin-top: clamp(4px, 1.5vw, 8px);

  p {
    margin: 0;
    font-family: $serif-zh;
    letter-spacing: clamp(.04em, 1vw, .08em);
    line-height: 1.7;
    /* 窄屏起点稍降 + 用 vw 做平滑过渡 */
    font-size: clamp(.86rem, 3.6vw, 1.12rem);
    color: $text;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
}

/* 订婚屏文字加 text-shadow 提升可读性 */
.story-section.has-bg-photo {
  .title,
  .paragraphs p {
    text-shadow: 0 2px 12px rgba(255, 255, 255, .55);
  }
}

/* ==== 兼容性微调 ==== */

/* 360 窄屏 */
@media (max-width: 380px) {
  .illust {
    width: 65vw;
    top: 5dvh;
  }
  .illust img { max-height: 36dvh; }
  .illust-anim {
    width: 64vw;
    top: 5dvh;
  }
  .illust-placeholder {
    max-height: 34dvh;
    aspect-ratio: 5 / 6;
  }
  .content {
    margin-bottom: 3dvh;
  }
}

/* 320 极窄屏:进一步收紧 */
@media (max-width: 340px) {
  .story-section {
    padding-left: 12px;
    padding-right: 12px;
  }
  .illust {
    width: 62vw;
    top: 4dvh;
  }
  .illust img { max-height: 32dvh; }
  .illust-anim {
    width: 62vw;
    top: 4dvh;
  }
  .title {
    font-size: 1.45rem;
    letter-spacing: .05em;
  }
  .paragraphs p {
    font-size: .82rem;
    letter-spacing: .03em;
    line-height: 1.65;
  }
  .badge { font-size: .68rem; letter-spacing: .2em; }
  .subtitle { font-size: .78rem; letter-spacing: .15em; }
}

/* iPad/平板:文字不要太散,插画不要太大 */
@media (min-width: 600px) and (max-width: 1024px) {
  .story-section {
    padding-left: clamp(40px, 8vw, 80px);
    padding-right: clamp(40px, 8vw, 80px);
  }
  .illust {
    width: clamp(280px, 38vw, 360px);
    max-width: 360px;
  }
  .illust img { max-height: 44dvh; }
  .illust-placeholder {
    max-width: 360px;
    margin: 0 auto;
    max-height: 42dvh;
  }
  .content {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  .title {
    /* iPad 上字太大会显得文字散,锁在合适区间 */
    font-size: clamp(2rem, 4.5vw, 2.6rem);
    letter-spacing: .12em;
  }
  .paragraphs p {
    font-size: clamp(1rem, 2.2vw, 1.1rem);
    letter-spacing: .08em;
  }
}

/* 横屏(如 iPhone landscape):整屏高度太低,缩小字号 + 上下边距 */
@media (orientation: landscape) and (max-height: 500px) {
  .story-section {
    padding-bottom: 4dvh;
  }
  .title {
    font-size: clamp(1.4rem, 5vh, 2rem);
  }
  .paragraphs p {
    font-size: clamp(.85rem, 2.4vh, 1rem);
    line-height: 1.5;
  }
  .badge {
    font-size: .75rem;
  }
  .illust {
    top: 2dvh;
    width: clamp(180px, 30vh, 240px);
  }
  .illust img { max-height: 50dvh; }
  .illust-placeholder { max-height: 50dvh; aspect-ratio: 4 / 3; }
  .illust-anim { top: 2dvh; max-width: 200px; width: clamp(180px, 32vh, 200px); }
  .illust-photoset { top: 3dvh; bottom: 38%; }
  .illust-pair { top: 3dvh; bottom: 38%; }
}
</style>
