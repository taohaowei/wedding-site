<template>
  <section class="cover">
    <!-- 合照背景层 -->
    <div class="bg-photo" :style="bgStyle" aria-hidden="true"></div>
    <!-- 渐变叠加,让上半透中下不透,文字落在下半部分清晰 -->
    <div class="bg-overlay" aria-hidden="true"></div>

    <!-- 粒子层(降密度,叠在合照之上) -->
    <ParticleBg color="#F5A572" :density="18" mode="glow" />

    <div class="content">
      <transition name="fade">
        <p v-if="guestName" class="greeting">亲爱的 <span class="g-name">{{ guestName }}</span></p>
      </transition>

      <p class="invitation-tag">— Save the Date —</p>

      <!-- 中文大字(主标题) -->
      <h1 class="names-zh">张 三 <span class="cross">✕</span> 小 美</h1>
      <!-- 英文小字(辅助/装饰) -->
      <p class="names-en">ZHANG SAN <span class="amp">&amp;</span> XIAO MEI</p>

      <p class="subline">诚 · 邀 · 您 · 出 · 席 · 我 · 们 · 的 · 婚 · 礼</p>

      <div class="meta">
        <p>2026.06.13 <span class="dot">·</span> 农历五月廿八 <span class="dot">·</span> 周六</p>
        <p class="venue">杭州 · 婚礼酒店 · 宴会厅</p>
      </div>

      <CountdownTimer target="2026-06-13T17:30:00+08:00" />

      <p class="scroll-hint">SCROLL</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { p } from '../utils/path'
import ParticleBg from '@/components/ParticleBg.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'

// 从 URL 取 ?to= 参数
const guestName = computed(() => {
  try {
    const u = new URL(window.location.href)
    // hash 路由场景下也尝试解析 hash 内 query
    const search = u.search || (u.hash.includes('?') ? '?' + u.hash.split('?')[1] : '')
    const params = new URLSearchParams(search)
    return params.get('to') || params.get('name') || ''
  } catch { return '' }
})

// 合照背景(照片不存在时回退到暖色调纯色)
const bgStyle = computed(() => ({
  backgroundImage: `url('${p('/photos/main-gown/合照-展示.jpg')}')`,
  backgroundColor: '#FAF6F0'
}))
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.cover {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg;
}

/* 全屏合照背景 — 柔焦 + 略微放大 */
.bg-photo {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  /* 默认人物上移,避免文字盖在脸上 */
  background-position: center 28%;
  background-repeat: no-repeat;
  /* 晨光暖雾感:轻微模糊 + 略微低饱和 */
  filter: blur(1.5px) saturate(.92) brightness(1.04);
  transform: scale(1.06); // 抵消 blur 边缘
  will-change: transform;
}

/* 渐变叠加层:上半透 + 中下不透 */
.bg-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, .2) 0%,
    rgba(250, 246, 240, .85) 60%,
    #FAF6F0 100%
  );
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 3;
  text-align: center;
  padding: 0 clamp(12px, 4vw, 28px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(6px, 1.6vh, 14px);
  width: 100%;
  max-width: min(92vw, 560px);
  /* 文字落在下半部分,让上半部分照片可见;
     iPad 上不要落到正中央(否则文字浮在合照上,
     窄高屏也压低让排版紧凑) */
  margin-top: clamp(18dvh, 24dvh, 32dvh);
}

.greeting {
  font-family: $serif-zh;
  color: $muted;
  font-size: clamp(.82rem, 2.8vw, .95rem);
  letter-spacing: .2em;
  margin: 0;
  .g-name {
    color: $accent-deep;
    font-weight: 600;
    margin-left: 4px;
  }
}

.invitation-tag {
  font-family: $serif-en;
  color: $accent-deep;
  font-style: italic;
  font-size: clamp(.74rem, 2.6vw, .85rem);
  letter-spacing: clamp(.2em, 1.2vw, .35em);
  margin: 0;
  opacity: .85;
}

/* 中文大字(主标题) */
.names-zh {
  font-family: $serif-zh;
  font-weight: 600;
  /* 7 字 + ✕ 在 320 必须收紧;大屏放大 */
  font-size: clamp(26px, 8.2vw, 64px);
  line-height: 1.15;
  letter-spacing: clamp(.14em, 1vw, .4em);
  /* 抵消最后一个字的右 spacing,保持视觉居中 */
  padding-left: clamp(.14em, 1vw, .4em);
  margin: 4px 0 0 0;
  color: $text;
  text-shadow: 0 2px 12px rgba(255, 255, 255, .6);
  white-space: nowrap;

  .cross {
    color: $accent-deep;
    font-weight: 400;
    margin: 0 .12em;
  }
}

/* 英文小字(辅助装饰) */
.names-en {
  font-family: $serif-en;
  font-weight: 400;
  font-size: clamp(10px, 2.6vw, 18px);
  letter-spacing: clamp(.12em, .8vw, .3em);
  text-transform: uppercase;
  color: $text-light;
  margin: 6px 0 0 0;
  /* 抵消末尾 letter-spacing */
  padding-left: clamp(.12em, .8vw, .3em);
  white-space: nowrap;

  .amp {
    color: $accent;
    font-style: italic;
    margin: 0 .25em;
  }
}

.subline {
  font-family: $serif-zh;
  /* 10 个汉字带 · 分隔,在 320 必须收紧字间距 */
  letter-spacing: clamp(.02em, .35vw, .12em);
  color: $text-light;
  margin: 6px 0 0 0;
  font-size: clamp(.68rem, 2.4vw, .9rem);
  white-space: nowrap;
}

.meta {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: $serif-zh;
  color: $text;
  letter-spacing: clamp(.02em, .3vw, .06em);
  font-size: clamp(.74rem, 2.6vw, .95rem);
  p { margin: 0; }
  .dot { color: $accent; padding: 0 2px; }
  .venue {
    color: $text-light;
    font-size: clamp(.7rem, 2.4vw, .88rem);
    letter-spacing: clamp(.02em, .25vw, .05em);
  }
}

/* 倒计时:作用域穿透,小屏紧凑、大屏宽松 */
:deep(.countdown) {
  padding: clamp(8px, 1.6vh, 16px) clamp(12px, 4vw, 28px);
  gap: clamp(4px, 1.2vw, 12px);
  border-radius: clamp(12px, 2vw, 20px);
}
:deep(.countdown .cell) {
  min-width: clamp(28px, 8vw, 50px);
}
:deep(.countdown .num) {
  font-size: clamp(1.2rem, 4.4vw, 2.2rem);
}
:deep(.countdown .label) {
  font-size: clamp(.6rem, 1.8vw, .82rem);
  margin-top: clamp(2px, .5vh, 6px);
}
:deep(.countdown .sep) {
  font-size: clamp(.9rem, 2.8vw, 1.6rem);
}

.scroll-hint {
  margin-top: 12px;
  font-family: $serif-en;
  letter-spacing: .4em;
  font-size: .7rem;
  color: $accent-deep;
  opacity: .6;
  animation: bob 1.8s ease-in-out infinite;
}

@keyframes bob {
  0%, 100% { transform: translateY(0); opacity: .4; }
  50% { transform: translateY(4px); opacity: .8; }
}

.fade-enter-active, .fade-leave-active { transition: opacity .6s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 短屏适配:压低 margin-top,避免内容溢出 */
@media (max-height: 700px) {
  .content { margin-top: 14dvh; gap: 6px; }
  .scroll-hint { display: none; }
}

/* 极窄屏(<=360):极致压缩字号与间距,确保 7 个汉字 + ✕ 一行不换 */
@media (max-width: 360px) {
  .content { gap: 6px; max-width: 96vw; padding: 0 8px; }
  .names-zh { letter-spacing: .1em; padding-left: .1em; }
  .names-en { letter-spacing: .1em; padding-left: .1em; }
  .subline { letter-spacing: .01em; }
  .meta { letter-spacing: .02em; }
  /* 人物焦点上移多一点,防止文字盖头 */
  .bg-photo { background-position: center 22%; }
  /* 倒计时再紧凑些 */
  :deep(.countdown) { padding: 8px 12px; gap: 4px; }
  :deep(.countdown .cell) { min-width: 30px; }
}

/* 超窄(<=320):iPhone SE1 等老机型 */
@media (max-width: 320px) {
  .content { padding: 0 6px; gap: 5px; }
  .names-zh { font-size: 24px; letter-spacing: .08em; padding-left: .08em; }
  .subline { font-size: .64rem; }
  .meta { font-size: .7rem; }
  .meta .venue { font-size: .66rem; }
}

/* iPad 竖屏 (768~):
   - 内容上移到中下部位,不再"漂"在合照中央
   - 加大 gap 与字号上限以匹配大尺寸
   - 倒计时模块更宽更舒展 */
@media (min-width: 600px) and (orientation: portrait) {
  .content {
    margin-top: clamp(34dvh, 42dvh, 48dvh);
    gap: clamp(10px, 1.8vh, 18px);
    max-width: min(78vw, 600px);
  }
  .bg-photo { background-position: center 35%; }
}

/* 大屏(>=1024)桌面:进一步放大文字呼吸感 */
@media (min-width: 1024px) {
  .content {
    margin-top: clamp(30dvh, 38dvh, 44dvh);
    max-width: 720px;
    gap: 16px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .content {
    margin-top: 4dvh;
    gap: 4px;
    max-width: min(80vw, 640px);
  }
  .names-zh { font-size: clamp(20px, 5.2vh, 36px); letter-spacing: .14em; padding-left: .14em; }
  .names-en { font-size: clamp(9px, 2vh, 14px); }
  .subline { font-size: clamp(.65rem, 2vh, .82rem); }
  .meta { font-size: clamp(.7rem, 2vh, .85rem); }
  .meta .venue { font-size: clamp(.66rem, 1.9vh, .8rem); }
  .invitation-tag { display: none; }
  .greeting { display: none; }
  .scroll-hint { display: none; }
  /* 倒计时横屏更紧凑 */
  :deep(.countdown) {
    padding: 6px 14px;
    gap: 6px;
    border-radius: 12px;
  }
  :deep(.countdown .cell) { min-width: 32px; }
  :deep(.countdown .num) { font-size: clamp(1rem, 4vh, 1.6rem); }
  :deep(.countdown .label) { font-size: clamp(.55rem, 1.5vh, .7rem); margin-top: 2px; }
  :deep(.countdown .sep) { font-size: clamp(.8rem, 2.5vh, 1.2rem); }
  /* 横屏背景人物再往上一点 */
  .bg-photo { background-position: center 22%; }
}
</style>
