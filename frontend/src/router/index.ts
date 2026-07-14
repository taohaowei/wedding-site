import { createRouter, createWebHashHistory } from 'vue-router'

// hash mode:URL 带 #/，兼容 GitHub Pages 无 SPA fallback 的问题
// 所有资源路径仍由 BASE_URL 处理，确保子路径部署正确
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/pages/AdminPage.vue')
    },
    {
      path: '/guide',
      name: 'guide',
      alias: ['/旅游'],
      component: () => import('@/pages/GuidePage.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
