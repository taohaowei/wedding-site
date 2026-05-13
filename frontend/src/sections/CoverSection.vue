<template>
  <section class="cover">
    <ParticleBg color="#F5A572" :density="32" mode="glow" />

    <div class="content">
      <transition name="fade">
        <p v-if="guestName" class="greeting">亲爱的 <span class="g-name">{{ guestName }}</span></p>
      </transition>

      <p class="invitation-tag">— Save the Date —</p>

      <h1 class="names">
        <span class="name-en">Tao Haowei</span>
        <span class="amp">&amp;</span>
        <span class="name-en">Liu Yuqing</span>
      </h1>
      <h2 class="names-zh">陶 浩 伟 ✕ 刘 雨 晴</h2>

      <p class="subline">诚 · 邀 · 您 · 出 · 席 · 我 · 们 · 的 · 婚 · 礼</p>

      <div class="meta">
        <p>2026.06.13 <span class="dot">·</span> 农历五月廿八 <span class="dot">·</span> 周六</p>
        <p class="venue">江西景德镇 · 乐平市东方国际酒店</p>
      </div>

      <CountdownTimer target="2026-06-13T09:00:00+08:00" />

      <p class="scroll-hint">SCROLL</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
  background: radial-gradient(circle at 50% 30%, #FFE8D2 0%, #FAF6F0 60%, #F8EBDD 100%);
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  max-width: 90vw;
}

.greeting {
  font-family: $serif-zh;
  color: $muted;
  font-size: .95rem;
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
  font-size: .9rem;
  letter-spacing: .35em;
  margin: 0;
  opacity: .8;
}

.names {
  font-family: $serif-en;
  font-style: italic;
  font-weight: 400;
  font-size: clamp(2.2rem, 9vw, 3.6rem);
  margin: 4px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  color: $text;
  line-height: 1.05;

  .amp {
    color: $accent;
    font-size: .8em;
    margin: -.05em 0;
  }
}

.names-zh {
  font-family: $serif-zh;
  font-weight: 500;
  font-size: clamp(1.05rem, 4vw, 1.4rem);
  margin: 0;
  letter-spacing: .15em;
  color: $text;
}

.subline {
  font-family: $serif-zh;
  letter-spacing: .12em;
  color: $text-light;
  margin: 4px 0 0 0;
  font-size: .85rem;
}

.meta {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: $serif-zh;
  color: $text;
  letter-spacing: .08em;
  font-size: .92rem;
  p { margin: 0; }
  .dot { color: $accent; padding: 0 2px; }
  .venue { color: $text-light; font-size: .85rem; }
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
</style>
