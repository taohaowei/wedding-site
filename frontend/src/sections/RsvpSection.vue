<template>
  <section class="rsvp">
    <div class="bg-tint"></div>

    <div v-if="!rsvp.submitted" class="container">
      <header class="hd">
        <p class="badge">R · S · V · P</p>
        <h2 class="title">回 · 复 · 我 · 们</h2>
        <p class="sub">不到 1 分钟,几个小问题就好</p>
      </header>

      <FormStepper @submitted="onSubmitted" />
    </div>

    <div v-else class="container thanks-block">
      <p class="badge">Got it</p>
      <h2 class="title">谢谢你的回复 ❤</h2>
      <p class="sub">我们已经收到啦</p>
      <button class="btn-primary" @click="goNext">看看致谢 →</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRsvpStore } from '@/stores/rsvp'
import FormStepper from '@/components/FormStepper.vue'

const rsvp = useRsvpStore()
const emit = defineEmits<{ (e: 'next'): void }>()

function onSubmitted() {
  // 等 800ms 让用户感受到提交成功,然后切到致谢屏
  window.setTimeout(() => emit('next'), 800)
}
function goNext() { emit('next') }
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.rsvp {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  /* 顶部预留 BgmPlayer (top: 16px + 44px height) 占用空间 + 安全区 */
  padding-top: max(76px, calc(env(safe-area-inset-top) + 76px));
  padding-bottom: max(24px, env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: $bg;
}

.bg-tint {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 50% 30%, rgba(255, 217, 184, .35), transparent 60%);
  pointer-events: none;
}

.container {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 3vh, 18px);
  align-items: center;
  text-align: center;
  padding: 0 clamp(12px, 4vw, 16px);
  margin: auto 0; /* 内容垂直居中 (弹性父容器为 align-items:flex-start 时仍可居中) */
}

.hd {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  /* BgmPlayer 在顶部固定,这里通过 .rsvp 的 padding-top 让位,不再强制右侧让位 */
  padding-left: 8px;
  padding-right: 8px;
  width: 100%;
  max-width: 540px;
}

.badge {
  margin: 0;
  font-family: $serif-en;
  font-style: italic;
  color: $accent-deep;
  letter-spacing: clamp(.18em, .9vw, .35em);
  font-size: clamp(.78rem, 2.6vw, .85rem);
}

.title {
  margin: 0;
  font-family: $serif-zh;
  font-size: clamp(1.4rem, 5.6vw, 2rem);
  letter-spacing: clamp(.08em, .8vw, .15em);
  line-height: 1.3;
}

.sub {
  margin: 0;
  font-family: $serif-zh;
  color: $text-light;
  font-size: clamp(.78rem, 2.6vw, .85rem);
  letter-spacing: .1em;
}

.thanks-block {
  gap: 12px;
  .title { color: $accent-deep; }
  .btn-primary { margin-top: 16px; }
}

/* 极窄屏(320 / 360):减少上方留白,确保关键内容露出 */
@media (max-width: 360px) {
  .rsvp {
    padding-top: max(68px, calc(env(safe-area-inset-top) + 68px));
  }
  .badge { font-size: .78rem; }
  .sub { font-size: .78rem; }
}
</style>
