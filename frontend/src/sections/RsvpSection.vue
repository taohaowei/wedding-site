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
  align-items: center;
  justify-content: center;
  padding: 6dvh 0;
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
  gap: 18px;
  align-items: center;
  text-align: center;
  padding: 0 16px;
}

.hd {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.badge {
  margin: 0;
  font-family: $serif-en;
  font-style: italic;
  color: $accent-deep;
  letter-spacing: .35em;
  font-size: .85rem;
}

.title {
  margin: 0;
  font-family: $serif-zh;
  font-size: clamp(1.6rem, 6vw, 2rem);
  letter-spacing: .15em;
}

.sub {
  margin: 0;
  font-family: $serif-zh;
  color: $text-light;
  font-size: .85rem;
  letter-spacing: .12em;
}

.thanks-block {
  gap: 12px;
  .title { color: $accent-deep; }
  .btn-primary { margin-top: 16px; }
}
</style>
