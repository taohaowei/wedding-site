import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './styles/index.scss'

// iOS 100vh 兜底:在最早期就设置 --vh
function setVh() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
}
setVh()
window.addEventListener('resize', setVh)
window.addEventListener('orientationchange', setVh)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
