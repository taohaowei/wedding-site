<template>
  <div class="admin-page">
    <header class="topbar">
      <h1>邀请函 · 后台</h1>
      <div class="actions" v-if="store.loggedIn">
        <a class="btn-primary" :href="exportUrl" download>导出 CSV</a>
        <button class="btn-ghost" @click="logout">登出</button>
      </div>
    </header>

    <!-- 登录 -->
    <section v-if="!store.loggedIn" class="login">
      <h2>请输入管理员密码</h2>
      <input
        v-model="pwd"
        type="password"
        placeholder="密码"
        @keydown.enter.prevent="submit"
      />
      <button class="btn-primary" :disabled="loading || !pwd" @click="submit">
        {{ loading ? '登录中…' : '登录' }}
      </button>
      <p v-if="store.errorMsg" class="err">{{ store.errorMsg }}</p>
      <p v-if="mock" class="hint muted">演示模式密码:<code>123</code></p>
    </section>

    <!-- 列表 -->
    <section v-else class="list">
      <div class="summary">
        <div class="card">
          <p class="num">{{ totalCount }}</p>
          <p class="lab">总回复</p>
        </div>
        <div class="card">
          <p class="num">{{ yesCount }}</p>
          <p class="lab">一定到</p>
        </div>
        <div class="card">
          <p class="num">{{ headcountSum }}</p>
          <p class="lab">出席人数</p>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>姓名</th>
              <th>是否到场</th>
              <th>人数</th>
              <th>住宿</th>
              <th>忌口</th>
              <th>留言</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody v-if="store.records.length > 0">
            <tr v-for="r in store.records" :key="r.id">
              <td>{{ r.id }}</td>
              <td>{{ r.name }}</td>
              <td>
                <span class="tag" :class="`tag-${r.attending}`">{{ attendLabel(r.attending) }}</span>
              </td>
              <td>{{ r.headcount ?? '-' }}</td>
              <td>{{ lodgeLabel(r.need_lodging) }}</td>
              <td>{{ r.dietary || '-' }}</td>
              <td class="msg">{{ r.message || '-' }}</td>
              <td>{{ formatTime(r.created_at) }}</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="8" class="empty">暂无回复(刷新或检查后端连通)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { getExportUrl } from '@/api/admin'
import { probeBackend, isMock } from '@/api/client'

const store = useAdminStore()
const pwd = ref('')
const loading = ref(false)
const mock = ref(false)
const exportUrl = getExportUrl()

onMounted(async () => {
  await probeBackend()
  mock.value = isMock()
  // 用现有 cookie / mock 状态尝试拉一次,200 即视为已登录
  await store.loadRsvps()
})

async function submit() {
  loading.value = true
  const ok = await store.login(pwd.value)
  loading.value = false
  if (ok) {
    pwd.value = ''
    await store.loadRsvps()
  }
}

function logout() { store.logout() }

const totalCount = computed(() => store.records.length)
const yesCount = computed(() => store.records.filter(r => r.attending === 'yes').length)
const headcountSum = computed(() => store.records.reduce((s, r) => s + (r.attending === 'yes' ? (r.headcount || 1) : 0), 0))

function attendLabel(a: string) {
  return a === 'yes' ? '一定到' : a === 'no' ? '去不了' : '未确定'
}
function lodgeLabel(l: string | null) {
  if (!l) return '-'
  return l === 'yes' ? '需要' : l === 'self' ? '自行' : '不需'
}
function formatTime(t: string) {
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return t
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.admin-page {
  width: 100%;
  height: 100%;
  background: $bg;
  color: $text;
  overflow-y: auto;
  font-family: $sans;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, $accent, $accent-deep);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: $shadow-sm;

  h1 {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: .15em;
    font-family: $serif-zh;
  }

  .actions { display: flex; gap: 8px; }
  .actions .btn-primary { background: rgba(255,255,255,.2); color: #fff; padding: 6px 14px; font-size: .85rem; border: 1px solid rgba(255,255,255,.3); }
  .actions .btn-ghost { color: #fff; border-color: rgba(255,255,255,.5); padding: 6px 14px; font-size: .85rem; }
}

.login {
  max-width: 360px;
  margin: 80px auto;
  padding: 32px 28px;
  background: #fff;
  border-radius: 16px;
  box-shadow: $shadow-md;
  text-align: center;

  h2 { font-family: $serif-zh; letter-spacing: .15em; font-size: 1.2rem; margin: 0 0 24px 0; }

  input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #ddd;
    margin-bottom: 14px;
    font-size: 1rem;
    background: #fafafa;
  }

  .btn-primary { width: 100%; }

  .err { color: #c0392b; font-size: .85rem; margin: 12px 0 0 0; }
  .hint { font-size: .75rem; margin-top: 16px; }
  code { background: #f5f0e8; padding: 1px 6px; border-radius: 4px; }
}

.list {
  padding: 24px;
}

.summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .card {
    flex: 1 1 100px;
    background: #fff;
    border-radius: 12px;
    padding: 16px 18px;
    box-shadow: $shadow-sm;
    text-align: center;

    .num {
      margin: 0;
      font-family: $serif-en;
      font-size: 1.8rem;
      color: $accent-deep;
    }
    .lab {
      margin: 4px 0 0 0;
      font-size: .8rem;
      color: $text-light;
      letter-spacing: .15em;
    }
  }
}

.table-wrap {
  background: #fff;
  border-radius: 12px;
  overflow: auto;
  box-shadow: $shadow-sm;
  -webkit-overflow-scrolling: touch;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: .88rem;
    min-width: 720px;
  }

  th, td {
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid #f0eae0;
  }
  th {
    background: #faf6f0;
    font-weight: 500;
    color: $text-light;
    letter-spacing: .1em;
    font-size: .78rem;
  }
  td.msg { max-width: 200px; white-space: pre-wrap; word-break: break-word; }
  td.empty { text-align: center; color: $text-light; padding: 36px; }
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: .72rem;
  letter-spacing: .1em;

  &.tag-yes { background: rgba(245, 165, 114, .15); color: $accent-deep; }
  &.tag-no { background: rgba(192, 57, 43, .12); color: #c0392b; }
  &.tag-maybe { background: rgba(110, 92, 142, .12); color: $muted; }
}
</style>
