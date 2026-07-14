<template>
  <div class="form-stepper" :style="{ '--kb-offset': kbOffsetPx + 'px' }">
    <transition name="step" mode="out-in">
      <div :key="currentKey" class="step">
        <!-- 顶部:Q编号 + 回退 -->
        <div class="step-top">
          <button v-if="canGoBack" type="button" class="back-btn" aria-label="上一题" @click="back()">←</button>
          <div class="q-num">{{ qLabel }}</div>
        </div>

        <!-- Q1 是否到场 -->
        <template v-if="step === 'attending'">
          <h2 class="q-title">你能来吗?</h2>
          <div class="opts">
            <button v-for="o in q1" :key="o.v" type="button" class="opt" :class="{ active: form.attending === o.v }" @click="pickAttend(o.v)">
              <span class="opt-emoji" aria-hidden="true">{{ o.icon }}</span>
              <span class="opt-text">{{ o.label }}</span>
            </button>
          </div>
        </template>

        <!-- Q2 头数(只在 yes) -->
        <template v-else-if="step === 'headcount'">
          <h2 class="q-title">带几位一起?</h2>
          <p class="q-sub">含你本人</p>
          <div class="opts opts-row">
            <button v-for="n in q2" :key="n" type="button" class="opt opt-pill" :class="{ active: form.headcount === Number(n) || (n === '4+' && (form.headcount || 0) >= 4) }" @click="pickHeadcount(n)">
              {{ n }}
            </button>
          </div>
        </template>

        <!-- Q3 住宿(只在 yes) -->
        <template v-else-if="step === 'lodging'">
          <h2 class="q-title">需要安排住宿吗?</h2>
          <div class="opts">
            <button v-for="o in q3" :key="o.v" type="button" class="opt" :class="{ active: form.needLodging === o.v }" @click="pickLodging(o.v)">
              <span class="opt-emoji" aria-hidden="true">{{ o.icon }}</span>
              <span class="opt-text">{{ o.label }}</span>
            </button>
          </div>
        </template>

        <!-- Q4 预计到达日期(只在 yes) -->
        <template v-else-if="step === 'arrival'">
          <h2 class="q-title">你预计什么时候到呢?</h2>
          <p class="q-sub">外地朋友建议 6.12 晚上到,可以参加接亲哦</p>
          <div class="opts">
            <button v-for="o in q4" :key="o.v" type="button" class="opt opt-arrival" :class="{ active: form.arrivalDate === o.v }" @click="pickArrival(o.v)">
              <span class="opt-emoji" aria-hidden="true">{{ o.icon }}</span>
              <span class="opt-text">{{ o.label }}</span>
            </button>
          </div>
        </template>

        <!-- Q5 忌口 -->
        <template v-else-if="step === 'dietary'">
          <h2 class="q-title">有什么忌口吗?</h2>
          <p class="q-sub">选填,例如 不吃辣 / 海鲜过敏</p>
          <div class="text-block">
            <input
              ref="inputRef"
              v-model="form.dietary"
              maxlength="200"
              placeholder="（直接回车跳过）"
              enterkeyhint="next"
              @focus="onInputFocus"
              @keydown.enter.prevent="next()"
            />
          </div>
          <div class="actions">
            <button type="button" class="btn-ghost btn-fluid" @click="next()">跳过</button>
            <button type="button" class="btn-primary btn-fluid" @click="next()">下一题 →</button>
          </div>
        </template>

        <!-- Q6 称呼(必填) -->
        <template v-else-if="step === 'name'">
          <h2 class="q-title">你的称呼?</h2>
          <p class="q-sub">让我们能认出你</p>
          <div class="text-block">
            <input
              ref="inputRef"
              v-model.trim="form.name"
              maxlength="32"
              placeholder="例如:张大哥 / 小美的同事"
              enterkeyhint="next"
              @focus="onInputFocus"
              @keydown.enter.prevent="next()"
            />
          </div>
          <div class="actions">
            <button type="button" class="btn-primary btn-fluid" :disabled="!nameOk" @click="next()">下一题 →</button>
          </div>
          <p v-if="form.name && !nameOk" class="err">请填写一个 1-32 字的称呼</p>
        </template>

        <!-- Q7 留言 -->
        <template v-else-if="step === 'message'">
          <h2 class="q-title">想对我们说点什么吗?</h2>
          <p class="q-sub">选填,我们都会读到</p>
          <div class="text-block">
            <textarea
              ref="inputRef"
              v-model="form.message"
              maxlength="200"
              rows="4"
              placeholder="（直接提交即可）"
              enterkeyhint="send"
              @focus="onInputFocus"
            ></textarea>
            <div class="counter">{{ (form.message || '').length }} / 200</div>
          </div>
          <div class="actions">
            <button type="button" class="btn-ghost btn-fluid" @click="submit()" :disabled="rsvp.submitting">跳过并提交</button>
            <button type="button" class="btn-primary btn-fluid" @click="submit()" :disabled="rsvp.submitting">
              {{ rsvp.submitting ? '提交中…' : '提交 ❤' }}
            </button>
          </div>
          <p v-if="rsvp.errorMsg" class="err">{{ rsvp.errorMsg }}</p>
        </template>
      </div>
    </transition>

    <!-- 进度点 -->
    <div class="dots" aria-hidden="true">
      <span v-for="(_s, i) in totalSteps" :key="i" class="dot" :class="{ active: i <= currentIndex }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRsvpStore } from '@/stores/rsvp'

type Step = 'attending' | 'headcount' | 'lodging' | 'arrival' | 'dietary' | 'name' | 'message'

const rsvp = useRsvpStore()
const form = rsvp.form
const step = ref<Step>('attending')
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

const emit = defineEmits<{ (e: 'submitted'): void }>()

const q1 = [
  { v: 'yes', label: '一定到', icon: '🥂' },
  { v: 'no', label: '想来,但去不了', icon: '😢' },
  { v: 'maybe', label: '暂未确定', icon: '🤔' }
] as const

const q2 = ['1', '2', '3', '4+']

const q3 = [
  { v: 'yes', label: '需要(我们帮你订)', icon: '🛏' },
  { v: 'self', label: '自行安排', icon: '🧳' },
  { v: 'no', label: '不需要', icon: '🚗' }
] as const

const q4 = [
  { v: '0612', label: '6.12 晚到(参加接亲)', icon: '🚄' },
  { v: '0613', label: '6.13 当天到', icon: '🌞' }
] as const

// 步骤顺序
const orderedSteps = computed<Step[]>(() => {
  return form.attending === 'yes'
    ? ['attending', 'headcount', 'lodging', 'arrival', 'dietary', 'name', 'message']
    : ['attending', 'dietary', 'name', 'message']
})

const totalSteps = computed(() => orderedSteps.value.length)
const currentIndex = computed(() => orderedSteps.value.indexOf(step.value))
const canGoBack = computed(() => currentIndex.value > 0 && !rsvp.submitting)

const currentKey = computed(() => `${step.value}-${form.attending}`)
const nameOk = computed(() => form.name.trim().length >= 1 && form.name.trim().length <= 32)

// Q 编号:统一显示 Q{index+1}
const qLabel = computed(() => `Q${currentIndex.value + 1}.`)

function autoNext(delay = 1200) {
  window.setTimeout(() => next(), delay)
}

function pickAttend(v: 'yes' | 'no' | 'maybe') {
  form.attending = v
  if (v !== 'yes') {
    form.headcount = undefined
    form.needLodging = undefined
    form.arrivalDate = undefined
  } else if (form.headcount === undefined) {
    form.headcount = 1
  }
  autoNext()
}

function pickHeadcount(n: string) {
  form.headcount = n === '4+' ? 4 : Number(n)
  autoNext()
}

function pickLodging(v: 'yes' | 'no' | 'self') {
  form.needLodging = v
  autoNext()
}

function pickArrival(v: '0612' | '0613') {
  form.arrivalDate = v
  autoNext()
}

function next() {
  const order = orderedSteps.value
  const idx = order.indexOf(step.value)
  if (step.value === 'name' && !nameOk.value) return
  const nextStep = order[idx + 1]
  if (nextStep) step.value = nextStep
}

function back() {
  const order = orderedSteps.value
  const idx = order.indexOf(step.value)
  const prev = order[idx - 1]
  if (prev) step.value = prev
}

async function submit() {
  if (!nameOk.value) {
    step.value = 'name'
    return
  }
  if (!form.attending) form.attending = 'maybe'
  const ok = await rsvp.submit()
  if (ok) emit('submitted')
}

// ========= 键盘弹出处理 (Visual Viewport API) =========
const kbOffsetPx = ref(0)

function updateKbOffset() {
  const vv = window.visualViewport
  if (!vv) return
  // 键盘高度 = 布局视口 - 视觉视口可见高度 - 顶部偏移
  const diff = window.innerHeight - vv.height - vv.offsetTop
  kbOffsetPx.value = diff > 80 ? diff : 0
}

function onInputFocus() {
  // 延迟一帧让 visualViewport 更新
  nextTick(() => {
    updateKbOffset()
    // 滚动到当前输入框,确保不被键盘遮
    const el = inputRef.value
    if (el && typeof el.scrollIntoView === 'function') {
      // iOS 上 scrollIntoView 行为更稳定
      window.setTimeout(() => {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 200)
    }
  })
}

onMounted(() => {
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateKbOffset)
    window.visualViewport.addEventListener('scroll', updateKbOffset)
  }
})

onBeforeUnmount(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateKbOffset)
    window.visualViewport.removeEventListener('scroll', updateKbOffset)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.form-stepper {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(16px, 3vh, 24px);
  padding: 0 clamp(14px, 5vw, 24px);
  /* 给底部按钮留出键盘高度的空间(只在键盘弹出时生效) */
  padding-bottom: var(--kb-offset, 0);
  transition: padding-bottom .2s;
}

.step {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: clamp(12px, 2.2vh, 18px);
  min-height: 280px;
}

.step-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 28px;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .7);
  border: 1px solid rgba(245, 165, 114, .25);
  color: $accent-deep;
  font-size: 1.1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: $shadow-sm;
  -webkit-tap-highlight-color: transparent;
  &:active { transform: translateY(-50%) scale(.92); }
}

.q-num {
  font-family: $serif-en;
  font-style: italic;
  font-size: 1rem;
  color: $accent-deep;
  letter-spacing: .15em;
}

.q-title {
  font-family: $serif-zh;
  font-size: clamp(1.3rem, 5.4vw, 2.2rem);
  margin: 0;
  letter-spacing: .06em;
  color: $text;
  line-height: 1.35;
  word-break: break-word;
}

.q-sub {
  margin: 0;
  font-size: clamp(.82rem, 2.8vw, .9rem);
  color: $text-light;
  letter-spacing: .08em;
  line-height: 1.5;
  word-break: break-word;
}

.opts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 8px;

  &.opts-row {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
  }
}

.opt {
  background: rgba(255,255,255,.7);
  border: 1px solid rgba(245, 165, 114, .25);
  border-radius: 14px;
  padding: clamp(12px, 3.5vw, 16px) clamp(12px, 4vw, 18px);
  display: flex;
  align-items: center;
  gap: clamp(10px, 3vw, 14px);
  cursor: pointer;
  font-family: $sans;
  /* 关键:最小 14px,iOS 下选项卡片可读 */
  font-size: clamp(.94rem, 3.6vw, 1.02rem);
  color: $text;
  text-align: left;
  transition: background .2s, color .2s, border-color .2s, box-shadow .2s, transform .12s;
  box-shadow: $shadow-sm;
  -webkit-tap-highlight-color: transparent;
  min-height: 48px; // 触屏可点性
  width: 100%;
  min-width: 0; // 允许内部 flex 收缩

  .opt-emoji {
    font-size: clamp(1.2rem, 4vw, 1.4rem);
    flex: 0 0 auto;
  }
  .opt-text {
    flex: 1 1 auto;
    min-width: 0;
    word-break: break-word;
    line-height: 1.4;
  }

  &:active { transform: scale(.98); }
  &.active {
    background: linear-gradient(135deg, $accent, $accent-deep);
    color: #fff;
    border-color: $accent-deep;
    box-shadow: $shadow-md;
  }

  &.opt-pill {
    flex: 0 0 auto;
    width: auto;
    min-width: 56px;
    justify-content: center;
    padding: clamp(12px, 3.4vw, 14px) clamp(16px, 5vw, 22px);
    font-size: clamp(1rem, 3.8vw, 1.2rem);
    font-family: $serif-en;
  }

  /* Q4 到达日期:emoji + 长中文文案在 320 不溢出 */
  &.opt-arrival {
    padding: clamp(12px, 3.5vw, 14px) clamp(12px, 3.5vw, 16px);
    gap: 10px;
    .opt-text { font-weight: 500; }
  }
}

.text-block {
  width: 100%;
  position: relative;
  margin-top: 4px;

  input, textarea {
    width: 100%;
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(255,255,255,.85);
    border: 1px solid rgba(245, 165, 114, .25);
    /* 关键:固定 16px,iOS 聚焦不会自动缩放 */
    font-size: 16px;
    line-height: 1.5;
    color: $text;
    box-shadow: $shadow-sm;
    transition: border-color .2s, outline-color .2s;

    &::placeholder { color: $text-light; opacity: .6; }
    &:focus { border-color: $accent; outline: 2px solid rgba(245, 165, 114, .25); outline-offset: 0; }
  }
  textarea {
    resize: none;
    line-height: 1.5;
    min-height: 96px;
    padding-bottom: 26px; /* 给计数器留位 */
  }

  .counter {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: .72rem;
    color: $text-light;
    pointer-events: none;
    background: rgba(255,255,255,.6);
    padding: 0 4px;
    border-radius: 4px;
  }
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

/* 让按钮在窄屏自适应:小屏占满,>=480 自然宽度 */
.btn-fluid {
  flex: 1 1 140px;
  min-width: 0;
  max-width: 100%;
  /* 增大点击区域,确保 ≥ 44px */
  min-height: 48px;
  font-size: 1rem;
  padding: 0.85em 1.4em;
}

.err {
  color: #c0392b;
  font-size: .85rem;
  margin: 0;
}

.dots {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 100%;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(245, 165, 114, .25);
  transition: background .3s;
  &.active { background: $accent-deep; }
}

.step-enter-active, .step-leave-active {
  transition: opacity .3s, transform .3s;
}
.step-enter-from { opacity: 0; transform: translateY(20px); }
.step-leave-to { opacity: 0; transform: translateY(-20px); }

/* ========= 极窄屏 320 / 360 微调 ========= */
@media (max-width: 360px) {
  .form-stepper {
    padding: 0 12px;
    gap: 14px;
  }
  .step { gap: 12px; min-height: 240px; }
  .q-title {
    font-size: 1.3rem;
    letter-spacing: .04em;
  }
  .q-sub { font-size: .82rem; }
  .opt {
    border-radius: 12px;
    padding: 12px 12px;
    gap: 10px;
    font-size: .95rem; // 约 15.2px,> 14px 阈值
    .opt-emoji { font-size: 1.2rem; }
  }
  .opt.opt-pill {
    min-width: 50px;
    padding: 12px 16px;
    font-size: 1.05rem;
  }
  .opt.opt-arrival {
    padding: 12px 10px;
    .opt-text { font-size: .92rem; line-height: 1.35; }
  }
  .actions { gap: 8px; }
  .btn-fluid {
    flex: 1 1 100%; /* 极窄屏按钮强制独占一行 */
    font-size: .95rem;
    padding: 0.8em 1em;
  }
  .back-btn { width: 32px; height: 32px; font-size: 1rem; }
  .text-block .counter { font-size: .68rem; right: 10px; }
}

/* 320 进一步收紧 */
@media (max-width: 320px) {
  .form-stepper { padding: 0 10px; }
  .q-title { font-size: 1.2rem; }
  .opt { padding: 10px 10px; font-size: .94rem; gap: 8px; }
  .opt.opt-arrival .opt-text { font-size: .9rem; }
  .opt.opt-pill { min-width: 46px; padding: 10px 14px; font-size: 1rem; }
}

/* ========= 极矮屏(键盘弹起场景) ========= */
@media (max-height: 560px) {
  .step { min-height: auto; gap: 10px; }
  .q-title { font-size: 1.25rem; }
  .opts { margin-top: 4px; gap: 10px; }
}
</style>
