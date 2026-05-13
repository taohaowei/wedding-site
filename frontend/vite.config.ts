import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import photosManifestPlugin from './scripts/photos-manifest-plugin'

export default defineConfig({
  plugins: [vue(), photosManifestPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          swiper: ['swiper'],
          gsap: ['gsap'],
          tsparticles: ['@tsparticles/vue3', '@tsparticles/slim']
        }
      }
    }
  }
})
