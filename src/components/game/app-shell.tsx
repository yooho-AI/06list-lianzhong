/**
 * [INPUT]: 依赖 store.ts 状态, DashboardDrawer, Tab组件
 * [OUTPUT]: 对外提供 AppShell 组件
 * [POS]: 游戏主框架: Header + Tab路由 + TabBar(5键) + 三向手势 + 双抽屉 + RecordSheet + Toast
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useGameStore,
  PERIODS,
  getCurrentChapter,
} from '@/lib/store'
import { useBgm } from '@/lib/bgm'
import {
  Notebook, Scroll, MusicNotes,
  List, ChatCircleDots, MapTrifold, Users,
} from '@phosphor-icons/react'
import DashboardDrawer from './dashboard-drawer'
import TabDialogue from './tab-dialogue'
import TabScene from './tab-scene'
import TabCharacter from './tab-character'

export default function AppShell({ onMenuOpen }: { onMenuOpen: () => void }) {
  const activeTab = useGameStore((s) => s.activeTab)
  const setActiveTab = useGameStore((s) => s.setActiveTab)
  const toggleDashboard = useGameStore((s) => s.toggleDashboard)
  const toggleRecords = useGameStore((s) => s.toggleRecords)
  const showRecords = useGameStore((s) => s.showRecords)
  const currentDay = useGameStore((s) => s.currentDay)
  const currentPeriodIndex = useGameStore((s) => s.currentPeriodIndex)
  const actionPoints = useGameStore((s) => s.actionPoints)
  const storyRecords = useGameStore((s) => s.storyRecords)
  const { toggle: toggleBgm } = useBgm()

  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const [toastMsg] = useState('')

  // ── Three-way gesture ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y)
    touchRef.current = null

    if (Math.abs(dx) < 60 || dy > Math.abs(dx) * 1.5) return

    if (dx > 0) toggleDashboard()  // right swipe -> left drawer
    else toggleRecords()           // left swipe -> right drawer
  }, [toggleDashboard, toggleRecords])

  const period = PERIODS[currentPeriodIndex] || PERIODS[0]
  const chapter = getCurrentChapter(currentDay)

  const TABS: Array<{ key: 'dialogue' | 'scene' | 'character'; label: string; icon: React.ReactNode }> = [
    { key: 'dialogue', label: '对话', icon: <ChatCircleDots size={20} weight="fill" /> },
    { key: 'scene', label: '场景', icon: <MapTrifold size={20} weight="fill" /> },
    { key: 'character', label: '人物', icon: <Users size={20} weight="fill" /> },
  ]

  return (
    <div className="lz-shell">
      {/* ── Header ── */}
      <header className="lz-header">
        <div className="lz-header-left">
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Day {currentDay}
          </span>
          <span className="lz-header-badge">
            {period.icon} {period.name}
          </span>
        </div>

        <div className="lz-header-center">
          <span>第{chapter.id}章「{chapter.name}」</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            行动力 {actionPoints}
          </span>
        </div>

        <div className="lz-header-right">
          <button
            className="lz-icon-btn"
            onClick={() => toggleBgm()}
            title="音乐"
          >
            <MusicNotes size={18} weight="fill" />
          </button>
          <button className="lz-icon-btn" onClick={onMenuOpen} title="菜单">
            <List size={20} />
          </button>
        </div>
      </header>

      {/* ── Tab Content ── */}
      <div
        className="lz-tab-content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'dialogue' && (
            <motion.div
              key="dialogue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              <TabDialogue />
            </motion.div>
          )}
          {activeTab === 'scene' && (
            <motion.div
              key="scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              <TabScene />
            </motion.div>
          )}
          {activeTab === 'character' && (
            <motion.div
              key="character"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%' }}
            >
              <TabCharacter />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TabBar (5 items: 手册 + 3 tabs + 事件) ── */}
      <nav className="lz-tab-bar">
        <button className="lz-tab-item" onClick={toggleDashboard}>
          <span><Notebook size={20} weight="fill" /></span>
          <span style={{ fontSize: 10, marginTop: 2 }}>手册</span>
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`lz-tab-item ${activeTab === tab.key ? 'lz-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span>
            <span style={{ fontSize: 10, marginTop: 2 }}>{tab.label}</span>
          </button>
        ))}
        <button className="lz-tab-item" onClick={toggleRecords}>
          <span><Scroll size={20} weight="fill" /></span>
          <span style={{ fontSize: 10, marginTop: 2 }}>事件</span>
        </button>
      </nav>

      {/* ── Dashboard Drawer (Left) ── */}
      <DashboardDrawer />

      {/* ── Record Sheet (Right) ── */}
      <AnimatePresence>
        {showRecords && (
          <>
            <motion.div
              className="lz-records-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleRecords}
            />
            <motion.div
              className="lz-records-sheet"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="lz-records-header">
                <span className="lz-records-title">
                  <Scroll size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  恋旅日记
                </span>
                <button className="lz-records-close" onClick={toggleRecords}>✕</button>
              </div>

              <div className="lz-records-timeline">
                {[...storyRecords].reverse().map((record) => (
                  <div key={record.id} className="lz-records-item">
                    <div className="lz-records-dot" />
                    <div className="lz-records-body">
                      <div className="lz-records-meta">
                        Day {record.day} · {record.period}
                      </div>
                      <div className="lz-records-event-title">{record.title}</div>
                      <div className="lz-records-content">{record.content}</div>
                    </div>
                  </div>
                ))}
                {storyRecords.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    恋旅刚刚开始...
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            className="lz-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
