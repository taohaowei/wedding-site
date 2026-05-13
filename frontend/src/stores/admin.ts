import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RsvpRecord } from '@/api/types'
import { adminLogin, adminLogout, getRsvps } from '@/api/admin'

export const useAdminStore = defineStore('admin', () => {
  const loggedIn = ref(false)
  const records = ref<RsvpRecord[]>([])
  const loading = ref(false)
  const errorMsg = ref('')

  async function login(password: string) {
    errorMsg.value = ''
    const r = await adminLogin(password)
    if (r.ok) {
      loggedIn.value = true
      return true
    } else {
      errorMsg.value = r.error
      return false
    }
  }

  async function logout() {
    await adminLogout()
    loggedIn.value = false
    records.value = []
  }

  async function loadRsvps() {
    loading.value = true
    const r = await getRsvps()
    loading.value = false
    if (r.ok && Array.isArray(r.data)) {
      records.value = r.data
      // 拿到数据 = 已登录
      loggedIn.value = true
      errorMsg.value = ''
    } else if (!r.ok && (r as any).code === 'UNAUTHORIZED') {
      // 未登录或登录过期,不算错误,只切回登录页
      loggedIn.value = false
      records.value = []
      // 仅在已经"显式登录过"再过期时显示提示;首次直接静默
      if (loggedIn.value) errorMsg.value = '登录已过期,请重新登录'
    } else if (!r.ok) {
      errorMsg.value = (r as any).error
    }
  }

  return { loggedIn, records, loading, errorMsg, login, logout, loadRsvps }
})
