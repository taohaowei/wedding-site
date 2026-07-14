<template>
  <section class="thanks">
    <ParticleBg color="#F5A572" :density="50" mode="glow" />

    <div class="content">
      <p class="badge">— With Love —</p>
      <h2 class="lines">
        <span>谢谢你 ——</span>
        <span>读完了这个故事,</span>
        <span>也走完了这段路。</span>
      </h2>
      <p class="wish">愿你也能,赴一场不期而遇的约。</p>

      <p class="sign serif-en">— Zhang San &amp; Xiao Mei —</p>
      <p class="signature-zh">张 三 &amp; 小 美</p>
      <p class="date">6 . 13 · 等 你 ❤</p>

      <button class="restart" @click="$emit('restart')">↻ 再 · 来 · 一 · 遍</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import ParticleBg from '@/components/ParticleBg.vue'
defineEmits<{ (e: 'restart'): void }>()
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.thanks {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 50%, #FFE8D2 0%, #FAF6F0 70%, #F8EBDD 100%);
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(10px, 2vh, 14px);
  padding: 0 clamp(14px, 5vw, 24px);
  max-width: 92vw;
}

.badge {
  margin: 0;
  font-family: $serif-en;
  font-style: italic;
  color: $accent-deep;
  letter-spacing: clamp(.2em, 1vw, .35em);
  font-size: clamp(.74rem, 2.6vw, .85rem);
}

.lines {
  margin: 8px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: $serif-zh;
  font-weight: 500;
  font-size: clamp(1.2rem, 5vw, 1.85rem);
  letter-spacing: clamp(.06em, .8vw, .12em);
  color: $text;
}

.wish {
  margin: 8px 0;
  font-family: $serif-zh;
  letter-spacing: clamp(.08em, .8vw, .15em);
  color: $accent-deep;
  font-size: clamp(.92rem, 3.4vw, 1.05rem);
}

.sign {
  margin: 16px 0 0 0;
  font-style: italic;
  color: $text-light;
  letter-spacing: .15em;
  font-size: clamp(.88rem, 3.2vw, 1rem);
}

.signature-zh {
  margin: 0;
  font-family: $serif-zh;
  letter-spacing: clamp(.15em, .8vw, .25em);
  color: $text;
  font-size: clamp(.92rem, 3.4vw, 1.05rem);
}

.date {
  margin: 6px 0 0 0;
  font-family: $serif-en;
  letter-spacing: clamp(.15em, .8vw, .25em);
  color: $accent-deep;
  font-size: clamp(.9rem, 3.2vw, 1rem);
}

.restart {
  margin-top: clamp(18px, 3vh, 28px);
  background: transparent;
  border: 1px dashed rgba(110, 92, 142, .35);
  color: $muted;
  padding: 10px 22px;
  border-radius: 999px;
  font-family: $serif-zh;
  letter-spacing: .25em;
  font-size: .8rem;
  cursor: pointer;
  opacity: .55;
  transition: opacity .25s;
  &:hover { opacity: 1; }
}

/* 短屏适配 */
@media (max-height: 700px) {
  .content { gap: 8px; }
  .lines { gap: 4px; }
  .restart { margin-top: 14px; }
}
</style>
