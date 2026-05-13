<template>
  <div :id="id" class="particle-wrap" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { loadSlim } from '@tsparticles/slim'
import { tsParticles } from '@tsparticles/engine'

const props = withDefaults(defineProps<{
  id?: string
  color?: string
  density?: number
  mode?: 'glow' | 'snow' | 'petal'
}>(), {
  id: 'particles-' + Math.random().toString(36).slice(2, 8),
  color: '#F5A572',
  density: 30,
  mode: 'glow'
})

let inited = false
let container: any = null

async function ensure() {
  if (!inited) {
    await loadSlim(tsParticles)
    inited = true
  }
}

function buildOptions() {
  const base: any = {
    fullScreen: { enable: false },
    fpsLimit: 60,
    background: { color: 'transparent' },
    detectRetina: true,
    particles: {
      number: { value: props.density, density: { enable: true, area: 800 } },
      color: { value: props.color },
      opacity: {
        value: { min: 0.15, max: 0.6 },
        animation: { enable: true, speed: 0.6, sync: false }
      },
      size: {
        value: { min: 1, max: 4 },
        animation: { enable: true, speed: 1.5, sync: false }
      },
      move: {
        enable: true,
        speed: 0.6,
        direction: 'top',
        random: true,
        straight: false,
        outModes: { default: 'out' }
      },
      shape: { type: 'circle' }
    }
  }
  if (props.mode === 'glow') {
    base.particles.shadow = { enable: true, color: props.color, blur: 12 }
  }
  if (props.mode === 'snow') {
    base.particles.move.direction = 'bottom'
    base.particles.color.value = '#FFFFFF'
  }
  return base
}

async function start() {
  await ensure()
  if (container) {
    container.destroy()
    container = null
  }
  container = await tsParticles.load({ id: props.id, options: buildOptions() })
}

onMounted(start)

watch(() => [props.color, props.density, props.mode], start)

onBeforeUnmount(() => {
  if (container) {
    container.destroy()
    container = null
  }
})
</script>

<style scoped>
.particle-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.particle-wrap canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
