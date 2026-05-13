<template>
  <div class="form-stepper">
    <transition name="step" mode="out-in">
      <div :key="currentKey" class="step">
        <!-- Q1 是否到场 -->
        <template v-if="step === 'attending'">
          <div class="q-num">Q1.</div>
          <h2 class="q-title">你能来吗?</h2>
          <div class="opts">
            <button v-for="o in q1" :key="o.v" class="opt" :class="{ active: form.attending === o.v }" @click="pickAttend(o.v)">
              <span class="opt-emoji">{{ o.icon }}</span>
              <span class="opt-text">{{ o.label }}</span>
            </button>
          </div>
        </template>

        <!-- Q2 头数(只在 yes) -->
        <template v-else-if="step === 'headcount'">
          <div class="q-num">Q2.</div>
          <h2 class="q-title">带几位一起?</h2>
          <p class="q-sub">含你本人</p>
          <div class="opts opts-row">
            <button v-for="n in q2" :key="n" class="opt opt-pill" :class="{ active: form.headcount === Number(n) || (n === '4+' && (form.headcount || 0) >= 4) }" @click="pickHeadcount(n)">
              {{ n }}
            </button>
          </div>
        </template>

        <!-- Q3 住宿(只在 yes) -->
        <template v-else-if="step === 'lodging'">
          <div class="q-num">Q3.</div>
          <h2 class="q-title">需要安排住宿吗?</h2>
          <div class="opts">
            <button v-for="o in q3" :key="o.v" class="opt" :class="{ active: form.needLodging === o.v }" @click="pickLodging(o.v)">
              <span class="opt-emoji">{{ o.icon }}</span>
              <span class="opt-text">{{ o.label }}</span>
            </button>
          </div>
        </template>

        <!-- Q4 预计到达日期(只在 yes) -->
        <template v-else-if="step === 'arrival'">
          <div class="q-num">Q4.</div>
          <h2 class="q-title">你预计什么时候到呢?</h2>
          <p class="q-sub">外地朋友建议 6.12 晚上到,可以参加接亲哦</p>
          <div class="opts">
            <button v-for="o in q4" :key="o.v" class="opt" :class="{ active: form.arrivalDate === o.v }" @click="pickArrival(o.v)">
              <span class="opt-emoji">{{ o.icon }}</span>
              <span class="opt-text">{{ o.label }}</span>
            </button>
          </div>
        </template>

        <!-- Q5 忌口 -->
        <template v-else-if="step === 'dietary'">
          <div class="q-num">{{ form.attending === 'yes' ? 'Q5.' : 'Q2.' }}</div>
          <h2 class="q-title">有什么忌口吗?</h2>
          <p class="q-sub">选填,例如 不吃辣 / 海鲜过敏</p>
          <div class="text-block">
            <input v-model="form.dietary" maxlength="200" placeholder="（直接回车跳过）" @keydown.enter.prevent="next()" />
          </div>
          <div class="actions">
            <button class="btn-ghost" @click="next()">跳过</button>
            <button class="btn-primary" @click="next()">下一题 →</button>
          </div>
        </template>

        <!-- Q6 称呼(必填) -->
        <template v-else-if="step === 'name'">
          <div class="q-num">{{ form.attending === 'yes' ? 'Q6.' : 'Q3.' }}</div>
          <h2 class="q-title">你的称呼?</h2>
          <p class="q-sub">让我们能认出你</p>
          <div class="text-block">
            <input v-model.trim="form.name" maxlength="32" placeholder="例如:陶大伯 / 雨晴的同事 小张" @keydown.enter.prevent="next()" autofocus />
          </div>
          <div class="actions">
            <button class="btn-primary" :disabled="!nameOk" @click="next()">下一题 →</button>
          </div>
          <p v-if="!nameOk" class="err">请填写一个 1-32 字的称呼</p>
        </template>

        <!-- Q7 留言 -->
        <template v-else-if="step === 'message'">
          <div class="q-num">{{ form.attending === 'yes' ? 'Q7.' : 'Q4.' }}</div>
          <h2 class="q-title">想对我们说点什么吗?</h2>
          <p class="q-sub">选填,我们都会读到</p>
          <div class="text-block">
            <textarea v-model="form.message" maxlength="200" rows="4" placeholder="（直接提交即可）"></textarea>
            <div class="counter">{{ (form.message || '').length }} / 200</div>
          </div>
          <div class="actions">
            <button class="btn-ghost" @click="submit()" :disabled="rsvp.submitting">跳过并提交</button>
            <button class="btn-primary" @click="submit()" :disabled="rsvp.submitting">
              {{ rsvp.submitting ? '提交中…' : '提交 ❤' }}
            </button>
          </div>
          <p v-if="rsvp.errorMsg" class="err">{{ rsvp.errorMsg }}</p>
        </template>
      </div>
    </transition>

    <!-- 进度点 -->
    <div class="dots">
      <span v-for="(s, i) in totalSteps" :key="i" class="dot" :class="{ active: i <= currentIndex }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRsvpStore } from '@/stores/rsvp'

type Step = 'attending' | 'headcount' | 'lodging' | 'arrival' | 'dietary' | 'name' | 'message'

const rsvp = useRsvpStore()
const form = rsvp.form
const step = ref<Step>('attending')

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

const totalSteps = computed(() => {
  return form.attending === 'yes' ? 7 : 4 // yes 7 个,否则跳过 Q2/Q3/Q4 共 4 个
})

const currentIndex = computed(() => {
  const order: Step[] = form.attending === 'yes'
    ? ['attending', 'headcount', 'lodging', 'arrival', 'dietary', 'name', 'message']
    : ['attending', 'dietary', 'name', 'message']
  return order.indexOf(step.value)
})

const currentKey = computed(() => `${step.value}-${form.attending}`)
const nameOk = computed(() => form.name.trim().length >= 1 && form.name.trim().length <= 32)

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
  if (step.value === 'attending') {
    step.value = form.attending === 'yes' ? 'headcount' : 'dietary'
  } else if (step.value === 'headcount') {
    step.value = 'lodging'
  } else if (step.value === 'lodging') {
    step.value = 'arrival'
  } else if (step.value === 'arrival') {
    step.value = 'dietary'
  } else if (step.value === 'dietary') {
    step.value = 'name'
  } else if (step.value === 'name') {
    if (!nameOk.value) return
    step.value = 'message'
  }
}

async function submit() {
  if (!nameOk.value) {
    step.value = 'name'
    return
  }
  // 兜底默认值
  if (!form.attending) form.attending = 'maybe'
  const ok = await rsvp.submit()
  if (ok) emit('submitted')
}
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
  gap: 24px;
  padding: 0 24px;
}

.step {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
  min-height: 320px;
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
  font-size: clamp(1.6rem, 5.5vw, 2.2rem);
  margin: 0;
  letter-spacing: .08em;
  color: $text;
}

.q-sub {
  margin: 0;
  font-size: .9rem;
  color: $text-light;
  letter-spacing: .1em;
}

.opts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 12px;

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
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  font-family: $sans;
  font-size: 1.02rem;
  color: $text;
  text-align: left;
  transition: all .2s;
  box-shadow: $shadow-sm;
  -webkit-tap-highlight-color: transparent;

  .opt-emoji { font-size: 1.4rem; }
  .opt-text { flex: 1; }

  &:active { transform: scale(.98); }
  &.active {
    background: linear-gradient(135deg, $accent, $accent-deep);
    color: #fff;
    border-color: $accent-deep;
    box-shadow: $shadow-md;
  }

  &.opt-pill {
    flex: 0 0 auto;
    min-width: 60px;
    justify-content: center;
    padding: 14px 22px;
    font-size: 1.2rem;
    font-family: $serif-en;
  }
}

.text-block {
  width: 100%;
  position: relative;
  margin-top: 8px;

  input, textarea {
    width: 100%;
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(255,255,255,.85);
    border: 1px solid rgba(245, 165, 114, .25);
    font-size: 1rem;
    color: $text;
    box-shadow: $shadow-sm;

    &::placeholder { color: $text-light; opacity: .6; }
    &:focus { border-color: $accent; outline: 2px solid rgba(245, 165, 114, .25); }
  }
  textarea { resize: none; line-height: 1.5; }

  .counter {
    position: absolute;
    bottom: 8px;
    right: 14px;
    font-size: .75rem;
    color: $text-light;
    pointer-events: none;
  }
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.err {
  color: #c0392b;
  font-size: .85rem;
  margin: 0;
}

.dots {
  display: flex;
  gap: 6px;
  margin-top: 8px;
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
</style>
