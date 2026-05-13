<template>
  <span ref="el" class="type-fade-in" :style="{ '--delay': `${delay}ms` }">
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'

const props = withDefaults(defineProps<{
  text?: string
  delay?: number
  duration?: number
  y?: number
  active?: boolean
}>(), {
  delay: 0,
  duration: 900,
  y: 24,
  active: true
})

const el = ref<HTMLElement | null>(null)
const emit = defineEmits<{ (e: 'done'): void }>()

function play() {
  if (!el.value) return
  gsap.fromTo(el.value,
    { opacity: 0, y: props.y, filter: 'blur(6px)' },
    {
      opacity: 1, y: 0, filter: 'blur(0px)',
      duration: props.duration / 1000,
      delay: props.delay / 1000,
      ease: 'power2.out',
      onComplete: () => emit('done')
    }
  )
}

defineExpose({ play })

onMounted(() => {
  if (props.active) play()
})
</script>

<style scoped>
.type-fade-in {
  display: inline-block;
  opacity: 0;
  will-change: transform, opacity, filter;
}
</style>
