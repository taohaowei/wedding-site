import { createRouter, createWebHistory } from 'vue-router'

// 使用 import.meta.env.BASE_URL 确保 GH Pages 子路径下路由正确
// Vite 的 base 配置会传入该值(如 /wedding-site/)
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
