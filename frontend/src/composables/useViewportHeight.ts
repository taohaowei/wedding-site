import { onMounted, onUnmounted } from 'vue'

// iOS Safari 100vh 闪烁兜底:实时把 window.innerHeight*0.01 写到 --vh
export function useViewportHeight() {
  const setVh = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
  }
  onMounted(() => {
    setVh()
    window.addEventListener('resize', setVh)
    window.addEventListener('orientationchange', setVh)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', setVh)
    window.removeEventListener('orientationchange', setVh)
  })
}
