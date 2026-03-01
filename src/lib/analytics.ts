/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 trackEvent 及预定义事件追踪函数
 * [POS]: lib 的数据统计模块，被 store.ts 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// Umami 全局类型
declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, string | number>) => void
    }
  }
}

/**
 * 追踪自定义事件到 Umami
 */
export function trackEvent(name: string, data?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(name, data)
  }
}

// ============================================================
// 预定义事件
// ============================================================

/** 开始新游戏 */
export function trackGameStart() {
  trackEvent('lz_game_start')
}

/** 继续游戏 */
export function trackGameContinue() {
  trackEvent('lz_game_continue')
}

/** 时间推进 */
export function trackTimeAdvance(day: number, period: string) {
  trackEvent('lz_time_advance', { day, period })
}

/** 模式选择 */
export function trackModeSelect(mode: string) {
  trackEvent('lz_mode_select', { mode })
}

/** 进入新章节 */
export function trackChapterEnter(chapter: number) {
  trackEvent('lz_chapter_enter', { chapter })
}

/** 达成结局 */
export function trackEndingReached(ending: string) {
  trackEvent('lz_ending_reached', { ending })
}

/** 解锁场景 */
export function trackSceneUnlock(scene: string) {
  trackEvent('lz_scene_unlock', { scene })
}
