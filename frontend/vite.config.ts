import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import photosManifestPlugin from './scripts/photos-manifest-plugin'

export default defineConfig({
  // GitHub Pages 部署时通过环境变量设置 base，本地开发用 /
  base: process.env.BASE_URL || '/',
  plugins: [
    vue(),
    photosManifestPlugin(),
    // GitHub Pages SPA fallback: 复制 index.html 为 404.html
    {
      name: 'gh-pages-spa',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist')
        const html = path.join(outDir, 'index.html')
        if (fs.existsSync(html)) {
          fs.copyFileSync(html, path.join(outDir, '404.html'))
          console.log('[gh-pages-spa] 404.html generated from index.html')
        }
      }
    }
  ],
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
