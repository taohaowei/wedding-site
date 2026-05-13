<template>
  <button
    class="bgm-btn"
    :class="{ playing }"
    @click.stop="toggle"
    aria-label="背景音乐开关"
  >
    <span class="icon" aria-hidden="true">
      <svg v-if="playing" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 11v2a4 4 0 0 0 4 4h0V7h0a4 4 0 0 0-4 4z"/>
        <path d="M14 5c2 1 3.5 3.5 3.5 7s-1.5 6-3.5 7"/>
        <path d="M11 4v16"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 11v2a4 4 0 0 0 4 4h0V7h0a4 4 0 0 0-4 4z"/>
        <path d="M11 4v16"/>
        <line x1="17" y1="8" x2="22" y2="13"/>
        <line x1="22" y1="8" x2="17" y2="13"/>
      </svg>
    </span>
    <span v-if="playing" class="ring"></span>
  </button>
  <audio
    ref="audioEl"
    :src="src"
    loop
    preload="auto"
    playsinline
    webkit-playsinline
  ></audio>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ src?: string; autoplay?: boolean }>(), {
  src: '/audio/bgm.mp3',
  autoplay: true
})

const audioEl = ref<HTMLAudioElement | null>(null)
const playing = ref(false)

function tryPlay() {
  const a = audioEl.value
  if (!a) return
  a.muted = false
  a.volume = 0.6
  a.play().then(() => {
    playing.value = true
  }).catch(() => {
    // 首次未授权不报错,等手势
  })
}

function toggle() {
  const a = audioEl.value
  if (!a) return
  if (a.paused) {
    a.muted = false
    a.play().then(() => playing.value = true).catch(() => playing.value = false)
  } else {
    a.pause()
    playing.value = false
  }
}

const onFirstTouch = () => {
  if (!playing.value) tryPlay()
  window.removeEventListener('touchstart', onFirstTouch)
  window.removeEventListener('click', onFirstTouch)
}

onMounted(() => {
  if (!props.autoplay) return
  const a = audioEl.value
  if (a) {
    a.muted = true
    a.play().catch(() => {})
  }
  // 浏览器兜底:首次手势
  window.addEventListener('touchstart', onFirstTouch, { once: true })
  window.addEventListener('click', onFirstTouch, { once: true })
  // 微信兜底
  if (typeof (window as any).WeixinJSBridge === 'undefined') {
    document.addEventListener('WeixinJSBridgeReady', tryPlay, false)
  } else {
    tryPlay()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('touchstart', onFirstTouch)
  window.removeEventListener('click', onFirstTouch)
})
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.bgm-btn {
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  right: max(16px, env(safe-area-inset-right));
  z-index: 200;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,.85);
  border: 1px solid rgba(245, 165, 114, .25);
  color: $accent-deep;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: $shadow-sm;
  transition: transform .2s;

  &:active { transform: scale(.92); }

  &.playing .icon { animation: rot 4s linear infinite; }

  body.theme-bw & {
    background: rgba(0,0,0,.45);
    color: $bw-text;
    border-color: rgba(255,255,255,.3);
  }
}

.ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid currentColor;
  opacity: .35;
  animation: ring 2s ease-out infinite;
}

@keyframes rot { to { transform: rotate(360deg); } }
@keyframes ring {
  0% { transform: scale(.85); opacity: .5; }
  100% { transform: scale(1.4); opacity: 0; }
}
</style>
