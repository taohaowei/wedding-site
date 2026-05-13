<template>
  <div class="countdown" :class="{ done }">
    <template v-if="!done">
      <div class="cell"><span class="num">{{ pad(d) }}</span><span class="label">天</span></div>
      <div class="sep">·</div>
      <div class="cell"><span class="num">{{ pad(h) }}</span><span class="label">时</span></div>
      <div class="sep">·</div>
      <div class="cell"><span class="num">{{ pad(m) }}</span><span class="label">分</span></div>
      <div class="sep">·</div>
      <div class="cell"><span class="num">{{ pad(s) }}</span><span class="label">秒</span></div>
    </template>
    <template v-else>
      <span class="done-tag">今 · 天 · 就 · 是</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ target: string }>()

const targetTs = new Date(props.target).getTime()
const d = ref(0); const h = ref(0); const m = ref(0); const s = ref(0)
const done = ref(false)
let timer: number | null = null

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function tick() {
  const diff = targetTs - Date.now()
  if (diff <= 0) {
    done.value = true
    if (timer) { clearInterval(timer); timer = null }
    return
  }
  const total = Math.floor(diff / 1000)
  d.value = Math.floor(total / 86400)
  h.value = Math.floor((total % 86400) / 3600)
  m.value = Math.floor((total % 3600) / 60)
  s.value = total % 60
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 1000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.countdown {
  display: inline-flex;
  align-items: flex-end;
  gap: 8px;
  padding: 14px 22px;
  border-radius: 18px;
  background: rgba(255,255,255,.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(245, 165, 114, .25);
  box-shadow: 0 4px 24px rgba(245, 165, 114, .12);
  font-family: $serif-en;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 38px;
}

.num {
  font-size: 1.75rem;
  font-weight: 500;
  line-height: 1;
  color: $accent-deep;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.label {
  font-family: $serif-zh;
  font-size: 0.7rem;
  letter-spacing: .15em;
  color: $text-light;
  margin-top: 4px;
}

.sep {
  color: $accent;
  font-size: 1.4rem;
  line-height: 1;
  padding-bottom: 2px;
  opacity: .5;
}

.done-tag {
  font-family: $serif-zh;
  font-size: 1.2rem;
  letter-spacing: .25em;
  color: $accent-deep;
}

body.theme-bw & {
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.2);
  .num, .done-tag { color: $bw-text; }
  .label { color: $bw-muted; }
  .sep { color: $bw-muted; }
}
</style>
