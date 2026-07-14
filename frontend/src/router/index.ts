import { createRouter, createWebHistory } from 'vue-router'

// history mode:URL 不带 #,避免微信安全访问中间页吞 hash
// 需要 nginx 配 try_files SPA fallback(已配)
export const router = createRouter({
  history: createWebHistory(),
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
