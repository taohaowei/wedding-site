/**
 * useAutoplay - 婚礼请柬自动翻页 composable
 *
 * 设计要点:
 *   1. 链式 setTimeout(不用 setInterval),每屏延迟可定制
 *   2. 横滑屏:子 Swiper 横滑完后再翻下一屏
 *   3. 动画屏:监听 'animation-done' 事件,完成后再翻
 *   4. 手动操作(wheel/touch/keyboard)自动暂停 N 秒后恢复
 *   5. 自动翻页时打 isAutoTransition 标记,避免被 slideChange 当作"手动操作"
 *   6. 页面隐藏暂停 / 可见恢复
 *   7. 用户偏好 localStorage 持久化(开关键)
 *   8. 到最后一屏 / 屏 9 (Venue) / 屏 10 (RSVP) 不自动翻
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'

export const AUTOPLAY_DEFAULTS = {
  defaultDelay: 3000,        // 普通屏停留 3s
  animationTailDelay: 2000,  // 动画完成后停 2s 再翻
  horizontalSubDelay: 2200,  // 横滑屏每张图停留 2.2s
  manualPauseTimeout: 8000,  // 手动操作后暂停 8s 再恢复
  initialDelay: 4500,        // 初次进入第 1 屏停留 4.5s
}

const STORAGE_KEY = 'wedding-autoplay-enabled'
const TOTAL = 12

// 不自动翻页的屏(基于 0-index)
const NO_AUTOPLAY_SLIDES = new Set<number>([
  9,  // 屏 10 婚礼信息(用户可能展开看流程)
  10, // 屏 11 RSVP(用户填表)
  11, // 屏 12 致谢(终点)
])

// 横滑屏(订婚/婚纱照三屏)— 0-index
const HORIZONTAL_SLIDES = new Set<number>([
  4, // 故事④ 订婚
  6, // 婚纱照 1
  7, // 婚纱照 2
  8, // 婚纱照 3
])

// 动画屏 — 故事② 一公里
const ANIMATION_SLIDES = new Set<number>([2])

export interface AutoplayApi {
  enabled: { readonly value: boolean }
  manualPaused: { readonly value: boolean }
  toggle: () => void
  pauseManual: () => void
  resume: () => void
  notifyAnimationDone: (slideIdx: number) => void
  notifyHorizontalReachEnd: (slideIdx: number) => void
  isAutoTransition: () => boolean
  /** 由 HomePage 调用:Swiper 已就绪、并知道当前 slide */
  setSwiper: (sw: any) => void
  /** Venue 屏特殊场景:展开流程后禁用 autoplay */
  setVenueExpanded: (v: boolean) => void
  /** debug 用 */
  state: { readonly value: string }
}

export function useAutoplay(): AutoplayApi {
  let mainSw: any = null
  let mainTimer: ReturnType<typeof setTimeout> | null = null
  let manualResumeTimer: ReturnType<typeof setTimeout> | null = null
  // 子 swiper(横滑屏)的子计时器和监听器
  let innerSubTimer: ReturnType<typeof setTimeout> | null = null
  let innerSwOff: (() => void) | null = null

  const enabled = ref<boolean>(loadEnabled())
  const manualPaused = ref(false)
  const venueExpanded = ref(false)
  const state = ref<string>('idle')

  /** 标记当前正在自动翻页(slideChangeTransitionStart 监听器据此过滤) */
  let _isAutoTransition = false

  function loadEnabled(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw === null ? true : raw === '1'
    } catch {
      return true
    }
  }
  function saveEnabled(v: boolean) {
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* ignore */ }
  }

  function clearMainTimer() {
    if (mainTimer) { clearTimeout(mainTimer); mainTimer = null }
  }
  function clearManualResume() {
    if (manualResumeTimer) { clearTimeout(manualResumeTimer); manualResumeTimer = null }
  }
  function clearInnerSub() {
    if (innerSubTimer) { clearTimeout(innerSubTimer); innerSubTimer = null }
    if (innerSwOff) { try { innerSwOff() } catch {} ; innerSwOff = null }
  }

  /**
   * 横滑屏:进入屏后程序化驱动子 swiper 每 horizontalSubDelay 滑一张,
   * 并监听 reachEnd → notifyHorizontalReachEnd
   */
  function startInnerSwiperAutoplay(idx: number, attempt = 0) {
    clearInnerSub()
    if (!shouldAutoplay() || currentIdx() !== idx) return

    const slideEl = mainSw?.slides?.[idx] as HTMLElement | undefined
    const innerEl = slideEl?.querySelector('.swiper') as any
    const innerSw = innerEl?.swiper

    if (!innerSw) {
      // 子 swiper 还没初始化,250ms × 8 重试
      if (attempt < 8) {
        innerSubTimer = setTimeout(() => startInnerSwiperAutoplay(idx, attempt + 1), 250)
      }
      return
    }

    // 监听 reachEnd → 通知主 useAutoplay
    const onReachEnd = () => notifyHorizontalReachEnd(idx)
    innerSw.on('reachEnd', onReachEnd)
    innerSwOff = () => { try { innerSw.off('reachEnd', onReachEnd) } catch {} }

    // 已经在末张?直接通知(reachEnd 不会再 emit)
    if (innerSw.activeIndex >= innerSw.slides.length - 1) {
      notifyHorizontalReachEnd(idx)
      return
    }

    const tick = () => {
      if (!shouldAutoplay() || currentIdx() !== idx) { clearInnerSub(); return }
      if (innerSw.activeIndex >= innerSw.slides.length - 1) return // reachEnd 处理
      innerSw.slideNext()
      innerSubTimer = setTimeout(tick, AUTOPLAY_DEFAULTS.horizontalSubDelay)
    }
    innerSubTimer = setTimeout(tick, AUTOPLAY_DEFAULTS.horizontalSubDelay)
  }

  function currentIdx(): number {
    return mainSw?.activeIndex ?? 0
  }

  /** 触发翻屏到下一屏 */
  function autoNext() {
    if (!mainSw) return
    const idx = currentIdx()
    if (idx >= TOTAL - 1) { state.value = 'reached-end'; return }
    if (!shouldAutoplay()) return
    state.value = `auto-next from ${idx}`
    _isAutoTransition = true
    try {
      mainSw.slideNext(700)
    } catch {
      _isAutoTransition = false
    }
    // 兜底:slideChangeTransitionEnd 时复位,但 800ms 后强制清(防漏)
    setTimeout(() => { _isAutoTransition = false }, 1200)
  }

  function shouldAutoplay(): boolean {
    if (!enabled.value) return false
    if (manualPaused.value) return false
    if (document.hidden) return false
    const idx = currentIdx()
    if (NO_AUTOPLAY_SLIDES.has(idx)) return false
    if (idx === 9 && venueExpanded.value) return false
    return true
  }

  /**
   * 调度当前屏的翻页 timer。
   * - 横滑屏:不在这里启动主 timer,而是等 reachedEnd 事件 + 2s 延时
   * - 动画屏:不启动主 timer,等 animation-done + 2s
   * - 普通屏:defaultDelay 后翻
   * - 屏 0(封面):initialDelay
   */
  function scheduleForCurrent() {
    clearMainTimer()
    clearInnerSub()
    if (!shouldAutoplay()) { state.value = 'paused'; return }

    const idx = currentIdx()

    if (HORIZONTAL_SLIDES.has(idx)) {
      // 横滑屏:启动子 swiper 自动滑 + 监听 reachEnd
      state.value = `waiting-horizontal-end @${idx}`
      startInnerSwiperAutoplay(idx)
      // 兜底:即使子 swiper 找不到/卡住,N 秒后强制翻
      const fallback = AUTOPLAY_DEFAULTS.horizontalSubDelay * 7 + AUTOPLAY_DEFAULTS.animationTailDelay
      mainTimer = setTimeout(() => {
        state.value = `horizontal-fallback @${idx}`
        autoNext()
      }, fallback)
      return
    }
    if (ANIMATION_SLIDES.has(idx)) {
      // 动画屏:等 animation-done 事件
      state.value = `waiting-animation @${idx}`
      // 兜底:OneKm 总时长约 8s,11s 没收到事件就强制翻
      mainTimer = setTimeout(() => {
        state.value = `animation-fallback @${idx}`
        autoNext()
      }, 11000)
      return
    }

    const delay = idx === 0 ? AUTOPLAY_DEFAULTS.initialDelay : AUTOPLAY_DEFAULTS.defaultDelay
    state.value = `wait ${delay}ms @${idx}`
    mainTimer = setTimeout(() => autoNext(), delay)
  }

  /** 手动操作 → 暂停 N 秒后恢复 */
  function pauseManual() {
    clearMainTimer()
    clearManualResume()
    manualPaused.value = true
    state.value = `manual-paused @${currentIdx()}`
    manualResumeTimer = setTimeout(() => {
      manualPaused.value = false
      scheduleForCurrent()
    }, AUTOPLAY_DEFAULTS.manualPauseTimeout)
  }

  function resume() {
    clearManualResume()
    manualPaused.value = false
    scheduleForCurrent()
  }

  function toggle() {
    enabled.value = !enabled.value
    saveEnabled(enabled.value)
    if (enabled.value) {
      manualPaused.value = false
      scheduleForCurrent()
    } else {
      clearMainTimer()
      clearManualResume()
      state.value = 'disabled'
    }
  }

  // ===== 事件回调 =====
  function notifyAnimationDone(slideIdx: number) {
    if (slideIdx !== currentIdx()) return // 已切走
    clearMainTimer()
    if (!shouldAutoplay()) return
    state.value = `animation-done @${slideIdx}, +${AUTOPLAY_DEFAULTS.animationTailDelay}ms`
    mainTimer = setTimeout(() => autoNext(), AUTOPLAY_DEFAULTS.animationTailDelay)
  }

  function notifyHorizontalReachEnd(slideIdx: number) {
    if (slideIdx !== currentIdx()) return
    clearMainTimer()
    if (!shouldAutoplay()) return
    state.value = `horizontal-end @${slideIdx}, +${AUTOPLAY_DEFAULTS.animationTailDelay}ms`
    mainTimer = setTimeout(() => autoNext(), AUTOPLAY_DEFAULTS.animationTailDelay)
  }

  function setVenueExpanded(v: boolean) {
    venueExpanded.value = v
    if (currentIdx() === 9) scheduleForCurrent()
  }

  function isAutoTransition() { return _isAutoTransition }

  // ===== Swiper 事件接入 =====
  function setSwiper(sw: any) {
    mainSw = sw
    if (!sw) return

    // slide 切换:只要切换发生(不论手动/自动),都重新调度
    sw.on('slideChangeTransitionEnd', () => {
      _isAutoTransition = false
      scheduleForCurrent()
    })

    // 用户手动开始翻页(touchEnd 已触发 swipe;wheel 也走这个)
    // 我们只在 swiper 自身判定"用户手动"时清 timer
    sw.on('slideChangeTransitionStart', () => {
      // 自动翻页也会触发,这里靠 isAutoTransition 区分
      if (_isAutoTransition) return
      // 用户操作触发的翻页 → 进入手动暂停
      pauseManual()
    })

    // 进入第一屏后开始调度
    scheduleForCurrent()
  }

  // ===== 全局监听:wheel / touch / key 在 swiper container 上 =====
  function onWheel() { if (!_isAutoTransition) pauseManual() }
  function onTouchStart() { if (!_isAutoTransition) pauseManual() }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' ||
        e.key === 'PageDown' || e.key === 'PageUp' ||
        e.key === 'Home' || e.key === 'End' || e.key === ' ') {
      if (!_isAutoTransition) pauseManual()
    }
  }
  function onVisibilityChange() {
    if (document.hidden) {
      clearMainTimer()
      state.value = 'page-hidden'
    } else {
      scheduleForCurrent()
    }
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('keydown', onKeyDown, { passive: true })
    // wheel/touch 直接挂 window 监听,不依赖 swiper container
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
  })

  onBeforeUnmount(() => {
    clearMainTimer()
    clearManualResume()
    clearInnerSub()
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
  })

  return {
    enabled,
    manualPaused,
    toggle,
    pauseManual,
    resume,
    notifyAnimationDone,
    notifyHorizontalReachEnd,
    isAutoTransition,
    setSwiper,
    setVenueExpanded,
    state,
  }
}
