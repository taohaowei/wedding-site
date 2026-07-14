import { createRouter, createWebHashHistory } from 'vue-router'

// hash mode + 显式 base 路径，兼容 GitHub Pages 子路径部署
// URL 格式如 /wedding-site/#/、/wedding-site/#/guide
export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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
