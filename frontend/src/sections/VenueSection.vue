<template>
  <section
    class="venue"
    ref="venueEl"
    @wheel="onWheel"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
  >
    <div class="bg-tint"></div>

    <div class="container">
      <header class="hd">
        <p class="badge">Wedding Day</p>
        <h2 class="title">当 · 天 · 流 · 程</h2>
      </header>

      <ol class="timeline">
        <li
          v-for="t in displayedSchedule"
          :key="t.time"
          ref="timelineItems"
          :class="{
            highlight: t.highlight,
            extra: t.extra
          }"
        >
          <span class="time">{{ t.time }}</span>
          <span class="dot" :class="{ 'dot-hl': t.highlight }"></span>
          <span class="event">
            <span v-if="t.icon" class="icon">{{ t.icon }}</span>
            {{ t.event }}
          </span>
        </li>
      </ol>

      <div class="expand-wrap">
        <button v-if="!expanded" class="btn-expand" @click="expand">
          展开完整流程 <span class="arr">▾</span>
        </button>
        <button v-else class="btn-expand subtle" @click="collapse">
          收起 <span class="arr up">▴</span>
        </button>
      </div>

      <!-- 次日游玩 -->
      <RouterLink to="/guide" class="next-day-card" aria-label="查看一日攻略">
        <div class="nd-icon">🍵</div>
        <div class="nd-text">
          <p class="nd-title">次日</p>
          <p class="nd-desc">一起在城里逛逛 · 感受慢生活</p>
        </div>
        <div class="nd-cta">查看攻略 <span class="arrow">→</span></div>
      </RouterLink>

      <!-- 交通建议 -->
      <div class="traffic-card">
        <header class="tc-hd">
          <span class="tc-icon">✈️</span>
          <h3 class="tc-title">交通建议</h3>
        </header>
        <p class="tc-tip">
          外地朋友参加接亲的话,建议前一天(<strong>6.12</strong>)晚上到哦~
        </p>
        <div class="tc-row">
          <div class="tc-mode">
            <div class="tc-mode-icon">🚄</div>
            <div class="tc-mode-body">
              <p class="tc-mode-title">高铁</p>
              <p class="tc-mode-desc">可直达市区</p>
            </div>
          </div>
          <div class="tc-mode">
            <div class="tc-mode-icon">✈️</div>
            <div class="tc-mode-body">
              <p class="tc-mode-title">飞机</p>
              <p class="tc-mode-desc">建议飞至最近机场,顺便来场旅行 🍵</p>
            </div>
          </div>
        </div>
      </div>

      <div class="map-block">
        <p class="badge">Location</p>
        <h3 class="venue-title">婚 · 礼 · 酒 · 店</h3>
        <p class="venue-hall">· 宴 会 厅 ·</p>
        <p class="venue-addr">浙江省 · 杭州</p>

        <div class="map-frame">
          <iframe
            v-if="mapVisible"
            :src="mapUrl"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
          <div v-else class="map-placeholder" @click="mapVisible = true">
            <span>📍 点击加载地图</span>
          </div>
        </div>

        <div class="actions">
          <a class="btn-primary" :href="navUrl" target="_blank" rel="noopener">用高德导航</a>
          <a class="btn-ghost" :href="navBaiduUrl" target="_blank" rel="noopener">百度地图</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { gsap } from 'gsap'

interface ScheduleItem {
  time: string
  event: string
  icon?: string
  highlight?: boolean // 强调色 + 加粗
  key: boolean       // 默认显示的 5 段关键流程
}

// 14 段完整流程,key=true 的为默认显示
const fullSchedule: ScheduleItem[] = [
  { time: '07:30-09:30', event: '新娘化妆造型', key: false },
  { time: '09:30-10:00', event: '新郎集合出发', key: true },
  { time: '10:00-10:40', event: '接亲游戏', key: true },
  { time: '10:40-11:00', event: '敬茶改口(女方)', key: false },
  { time: '11:00-11:30', event: '前往男方家', key: false },
  { time: '11:30-12:00', event: '敬茶改口(男方)', key: false },
  { time: '12:00-14:00', event: '中午宴席 + 休息', key: true },
  { time: '14:00-15:00', event: '更换主纱 + 补妆', key: false },
  { time: '15:00-16:00', event: '婚礼现场拍摄', key: false },
  { time: '16:00-16:30', event: '更换迎宾服 + 调整造型', key: false },
  { time: '16:30-18:00', event: '迎宾环节', key: false },
  { time: '18:08-18:38', event: '婚礼仪式', icon: '💍', highlight: true, key: true },
  { time: '18:38-19:30', event: '晚宴 + 敬酒环节', icon: '🥂', highlight: true, key: true },
  { time: '19:30 后',   event: '婚礼结束', key: false }
]

const expanded = ref(false)

// 给模板用:每条记录额外带个 extra 标记(默认折叠时被隐藏的项,展开后才出现)
type DisplayedItem = ScheduleItem & { extra?: boolean }

const displayedSchedule = computed<DisplayedItem[]>(() => {
  if (expanded.value) {
    // 展开时全部显示,non-key 标 extra 用于动画
    return fullSchedule.map((s) => ({ ...s, extra: !s.key }))
  }
  return fullSchedule.filter((s) => s.key).map((s) => ({ ...s }))
})

const timelineItems = ref<HTMLElement[]>([])

async function expand() {
  expanded.value = true
  await nextTick()
  // 找到所有刚加进来的 extra 项,GSAP 平滑展开
  const els = timelineItems.value.filter((el) => el?.classList?.contains('extra'))
  if (els.length === 0) return
  gsap.from(els, {
    opacity: 0,
    y: -8,
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    duration: 0.45,
    ease: 'power2.out',
    stagger: 0.05
  })
}

function collapse() {
  expanded.value = false
}

// 高德的 marker 链接(若被墙就走 placeholder)
// 示例场地坐标(使用前请替换为你的真实坐标)
const venueName = encodeURIComponent('婚礼酒店·宴会厅')
const mapUrl = `https://uri.amap.com/marker?position=120.15,30.28&name=${venueName}&src=mywedding&coordinate=gaode&callnative=0`
const navUrl = `https://uri.amap.com/navigation?to=120.15,30.28,${venueName}&mode=car&policy=0&src=mywedding&coordinate=gaode&callnative=1`
const navBaiduUrl = `https://api.map.baidu.com/marker?location=30.28,120.15&title=${venueName}&content=示例地址&output=html&coord_type=wgs84`

const mapVisible = ref(false)

// ====== 滚动拦截:让 venue 内部滚动优先,touch 边缘时再让 Swiper 翻屏 ======
const venueEl = ref<HTMLElement | null>(null)
let touchStartY = 0

function isAtTop(el: HTMLElement) {
  return el.scrollTop <= 0
}
function isAtBottom(el: HTMLElement) {
  return Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 1
}

function onWheel(e: WheelEvent) {
  const el = venueEl.value
  if (!el) return
  const canScroll = el.scrollHeight > el.clientHeight + 1
  if (!canScroll) return  // 不需要滚动 → 让事件冒泡,Swiper 翻屏
  // 鼠标滚轮:venue 自己消费,不让 Swiper 接管翻屏
  // PC 用户翻到下一屏可用键盘 ↓
  e.stopPropagation()
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]?.clientY ?? 0
}

function onTouchMove(e: TouchEvent) {
  const el = venueEl.value
  if (!el) return
  const currentY = e.touches[0]?.clientY ?? 0
  const deltaY = touchStartY - currentY  // > 0 = 上滑(看下面),< 0 = 下滑(看上面)
  const goingDown = deltaY > 0
  const goingUp = deltaY < 0
  // 内部还能滚 → 拦截,Swiper 不翻屏
  if ((goingDown && !isAtBottom(el)) || (goingUp && !isAtTop(el))) {
    e.stopPropagation()
  }
  // 边界时让 Swiper 处理(touchReleaseOnEdges 已开,会翻屏)
}
</script>

<style lang="scss" scoped>
@use '@/styles/tokens.scss' as *;

.venue {
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: clamp(5dvh, 6dvh, 7dvh) clamp(14px, 5vw, 24px) clamp(3dvh, 4dvh, 4dvh);
  background: $bg;
}

.bg-tint {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 20% 0%, rgba(255, 217, 184, .4), transparent 60%),
              radial-gradient(circle at 90% 100%, rgba(244, 196, 196, .25), transparent 60%);
  pointer-events: none;
}

.container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 560px;
  margin: 0 auto;
}

.hd {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 给 BgmPlayer 留位 — 仅右侧 */
  padding-right: 50px;
  padding-left: 8px;
}

.badge {
  margin: 0;
  font-family: $serif-en;
  font-style: italic;
  color: $accent-deep;
  letter-spacing: clamp(.18em, .9vw, .35em);
  font-size: clamp(.72rem, 2.4vw, .8rem);
  text-transform: uppercase;
}

.title {
  margin: 0;
  font-family: $serif-zh;
  font-size: clamp(1.3rem, 5.2vw, 2rem);
  letter-spacing: clamp(.08em, .8vw, .15em);
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0 0 0 8px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 12px;
    top: 8px;
    bottom: 8px;
    width: 1px;
    background: linear-gradient(to bottom, $accent, $pink);
  }

  li {
    position: relative;
    padding: 10px 0 10px clamp(28px, 9vw, 36px);
    display: flex;
    align-items: center;
    gap: clamp(8px, 3vw, 14px);
    font-family: $serif-zh;
    overflow: hidden;

    .time {
      font-family: $serif-en;
      color: $accent-deep;
      font-size: clamp(.78rem, 3vw, .95rem);
      font-style: italic;
      min-width: clamp(74px, 22vw, 96px);
      letter-spacing: .03em;
      flex-shrink: 0;
    }

    .dot {
      position: absolute;
      left: 7px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $accent;
      box-shadow: 0 0 0 4px rgba(245, 165, 114, .15);
    }

    .event {
      color: $text;
      font-size: clamp(.88rem, 3.4vw, 1rem);
      letter-spacing: .06em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    /* 强调:仪式 / 晚宴 */
    &.highlight {
      .time {
        color: $accent-deep;
        font-weight: 600;
        font-size: clamp(.82rem, 3.2vw, 1.02rem);
      }
      .event {
        color: $accent-deep;
        font-weight: 700;
        letter-spacing: .1em;
      }
      .dot.dot-hl {
        background: $accent-deep;
        box-shadow: 0 0 0 5px rgba(229, 137, 85, .25);
        width: 12px;
        height: 12px;
        left: 6px;
      }
      .icon {
        font-size: 1.05rem;
      }
    }
  }
}

.expand-wrap {
  display: flex;
  justify-content: center;
  margin-top: -6px;
}

.btn-expand {
  background: rgba(255, 255, 255, .7);
  border: 1px solid rgba(245, 165, 114, .35);
  border-radius: 999px;
  padding: 8px 18px;
  font-family: $serif-zh;
  font-size: .9rem;
  letter-spacing: .12em;
  color: $accent-deep;
  cursor: pointer;
  box-shadow: $shadow-sm;
  transition: transform .18s, box-shadow .18s, background .18s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  -webkit-tap-highlight-color: transparent;

  &:active { transform: scale(.96); }
  &:hover {
    background: rgba(255, 255, 255, .92);
    box-shadow: $shadow-md;
  }
  &.subtle {
    background: rgba(255, 255, 255, .5);
    color: $text-light;
    border-color: rgba(110, 92, 92, .15);
  }
  .arr {
    font-size: .8rem;
    transition: transform .2s;
    &.up { transform: translateY(-1px); }
  }
}

/* 次日景德镇卡片 */
.next-day-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(255, 217, 184, .65), rgba(244, 196, 196, .45));
  border: 1px solid rgba(245, 165, 114, .25);
  border-radius: 16px;
  box-shadow: $shadow-sm;
  text-decoration: none;
  color: $text;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;

  &:hover, &:active {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(245, 165, 114, .3);
  }

  .nd-icon {
    font-size: 1.8rem;
    flex: 0 0 auto;
  }
  .nd-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .nd-title {
    margin: 0;
    font-family: $serif-zh;
    color: $accent-deep;
    letter-spacing: .15em;
    font-size: .85rem;
    font-weight: 600;
  }
  .nd-desc {
    margin: 0;
    font-family: $serif-zh;
    color: $text;
    font-size: .98rem;
    letter-spacing: .06em;
  }
  .nd-cta {
    flex-shrink: 0;
    font-family: $serif-zh;
    font-size: .82rem;
    color: $accent-deep;
    letter-spacing: .1em;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, .65);
    white-space: nowrap;

    .arrow {
      font-family: $serif-en;
      font-style: italic;
      margin-left: 2px;
    }
  }
}

/* 交通建议卡片 */
.traffic-card {
  background: linear-gradient(135deg, rgba(255, 233, 211, .85), rgba(255, 217, 184, .6));
  border: 1px solid rgba(245, 165, 114, .3);
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  gap: 14px;

  .tc-hd {
    display: flex;
    align-items: center;
    gap: 8px;

    .tc-icon { font-size: 1.4rem; }
    .tc-title {
      margin: 0;
      font-family: $serif-zh;
      font-size: 1.15rem;
      letter-spacing: .15em;
      color: $accent-deep;
      font-weight: 700;
    }
  }

  .tc-tip {
    margin: 0;
    font-family: $serif-zh;
    color: $text;
    font-size: .95rem;
    line-height: 1.7;
    letter-spacing: .05em;
    strong {
      color: $accent-deep;
      font-weight: 700;
    }
  }

  .tc-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tc-mode {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 10px 12px;
    background: rgba(255, 255, 255, .55);
    border-radius: 12px;

    .tc-mode-icon {
      font-size: 1.5rem;
      flex: 0 0 auto;
      line-height: 1;
      padding-top: 2px;
    }
    .tc-mode-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .tc-mode-title {
      margin: 0;
      font-family: $serif-zh;
      color: $accent-deep;
      font-weight: 600;
      letter-spacing: .12em;
      font-size: .98rem;
    }
    .tc-mode-desc {
      margin: 0;
      color: $text;
      font-size: .9rem;
      line-height: 1.55;
      letter-spacing: .04em;
    }
  }
}

.map-block {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .venue-title {
    margin: 4px 0 0 0;
    font-family: $serif-zh;
    font-size: 1.3rem;
    letter-spacing: .15em;
  }
  .venue-hall {
    margin: 2px 0 0 0;
    font-family: $serif-zh;
    color: $accent-deep;
    font-size: 1rem;
    letter-spacing: .25em;
    font-weight: 600;
  }
  .venue-addr {
    margin: 0;
    color: $text-light;
    font-size: .85rem;
    letter-spacing: .08em;
  }
}

.map-frame {
  width: 100%;
  height: 220px;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, $soft, $pink);
  box-shadow: $shadow-md;
  position: relative;
  margin-top: 8px;

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }

  .map-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $accent-deep;
    font-family: $serif-zh;
    letter-spacing: .15em;
  }
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}
</style>
