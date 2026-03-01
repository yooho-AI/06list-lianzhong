/**
 * [INPUT]: 依赖 store.ts 状态（角色/场景/道具/章节）
 * [OUTPUT]: 对外提供 DashboardDrawer 组件
 * [POS]: 恋综手帐(左抽屉)：扉页+角色轮播+场景缩略图+章节目标+道具格+迷你播放器。Reorder拖拽排序
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef } from 'react'
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion'
import {
  useGameStore,
  SCENES, ITEMS, PERIODS,
  getAvailableCharacters, getCurrentChapter,
  getAffectionLevel,
} from '@/lib/store'
import { useBgm } from '@/lib/bgm'

const DASH_ORDER_KEY = 'lz-dash-order'
const DEFAULT_ORDER = ['front', 'cast', 'scenes', 'goals', 'items', 'music']
const SECTION_TITLES: Record<string, string> = {
  front: '恋旅概览', cast: '嘉宾一览',
  scenes: '场景地图', goals: '当前目标', items: '背包', music: '音乐',
}

// ── DragHandle ──────────────────────────────────────────

function DragHandle({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <div
      className="lz-dash-grip"
      onPointerDown={(e) => controls.start(e)}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <rect y="3" width="16" height="2" rx="1" />
        <rect y="7" width="16" height="2" rx="1" />
        <rect y="11" width="16" height="2" rx="1" />
      </svg>
    </div>
  )
}

// ── Section wrapper ─────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls}>
      <div className="lz-dash-section">
        <div className="lz-dash-section-header">
          <span className="lz-dash-section-title">{title}</span>
          <DragHandle controls={controls} />
        </div>
        {children}
      </div>
    </Reorder.Item>
  )
}

// ── FrontPage ───────────────────────────────────────────

function FrontPage() {
  const currentDay = useGameStore((s) => s.currentDay)
  const currentPeriodIndex = useGameStore((s) => s.currentPeriodIndex)
  const actionPoints = useGameStore((s) => s.actionPoints)

  const period = PERIODS[currentPeriodIndex] || PERIODS[0]
  const chapter = getCurrentChapter(currentDay)

  return (
    <div className="lz-dash-front">
      <div className="lz-dash-front-left">
        <div className="lz-dash-front-badge">{currentDay}</div>
        <div className="lz-dash-front-meta">
          <div className="lz-dash-front-period">{period.icon} {period.name}</div>
          <div className="lz-dash-front-chapter">{chapter.name}</div>
        </div>
      </div>
      <div className="lz-dash-front-right">
        <div className="lz-dash-front-ap">
          {'★'.repeat(actionPoints)}{'☆'.repeat(Math.max(0, 6 - actionPoints))}
        </div>
        <div className="lz-dash-front-ap-label">行动力</div>
      </div>
    </div>
  )
}

// ── CastGallery ─────────────────────────────────────────

function CastGallery() {
  const currentDay = useGameStore((s) => s.currentDay)
  const characterStats = useGameStore((s) => s.characterStats)
  const selectCharacter = useGameStore((s) => s.selectCharacter)
  const toggleDashboard = useGameStore((s) => s.toggleDashboard)

  const available = getAvailableCharacters(currentDay)
  const charEntries = Object.entries(available)
  const [idx, setIdx] = useState(0)
  const touchX = useRef(0)

  if (charEntries.length === 0) return null
  const [charId, char] = charEntries[Math.min(idx, charEntries.length - 1)]
  const stats = characterStats[charId]
  const affection = stats?.affection ?? 0
  const level = getAffectionLevel(affection)

  return (
    <div>
      <div
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchX.current
          if (dx < -50 && idx < charEntries.length - 1) setIdx(idx + 1)
          else if (dx > 50 && idx > 0) setIdx(idx - 1)
        }}
        style={{ overflow: 'hidden' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            onClick={() => { selectCharacter(charId); toggleDashboard() }}
            style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: '4px 0' }}
          >
            <div style={{
              width: 80, height: 120, borderRadius: 8, overflow: 'hidden',
              flexShrink: 0, border: `2px solid ${char.themeColor}`,
            }}>
              <img src={char.portrait} alt={char.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: char.themeColor }}>{char.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{char.title} · {char.age}岁</div>
              <div style={{ fontSize: 10, color: char.themeColor, fontWeight: 500 }}>{level.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>好感</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${affection}%`, height: '100%', borderRadius: 3,
                    background: char.themeColor, transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: char.themeColor,
                  fontVariantNumeric: 'tabular-nums', minWidth: 22, textAlign: 'right',
                }}>{affection}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 6 }}>
        {charEntries.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 16 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0,
            background: i === idx ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
            transition: 'all 0.2s', cursor: 'pointer',
          }} />
        ))}
      </div>
    </div>
  )
}

// ── SceneMap ─────────────────────────────────────────────

function SceneMap() {
  const currentScene = useGameStore((s) => s.currentScene)
  const unlockedScenes = useGameStore((s) => s.unlockedScenes)
  const selectScene = useGameStore((s) => s.selectScene)
  const toggleDashboard = useGameStore((s) => s.toggleDashboard)

  return (
    <div className="lz-dash-scene-scroll">
      {Object.entries(SCENES).map(([sid, scene]) => {
        const locked = !unlockedScenes.includes(sid)
        const current = sid === currentScene
        return (
          <button
            key={sid}
            className={`lz-dash-scene-thumb ${current ? 'lz-dash-scene-active' : ''} ${locked ? 'lz-dash-scene-locked' : ''}`}
            disabled={locked}
            onClick={() => { if (!locked && !current) { selectScene(sid); toggleDashboard() } }}
          >
            <img src={scene.background} alt={scene.name} />
            <div className="lz-dash-scene-label">{scene.icon} {scene.name}</div>
            {locked && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', fontSize: 18, borderRadius: 8,
              }}>🔒</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Goals ─────────────────────────────────────────────

function Goals() {
  const currentDay = useGameStore((s) => s.currentDay)
  const chapter = getCurrentChapter(currentDay)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {chapter.objectives.map((obj) => (
        <div key={obj} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--text-muted)', fontSize: 11,
          }} />
          <span>{obj}</span>
        </div>
      ))}
    </div>
  )
}

// ── ItemGrid ────────────────────────────────────────────

function ItemGrid() {
  const inventory = useGameStore((s) => s.inventory)

  return (
    <div className="lz-dash-item-grid">
      {ITEMS.map((item) => {
        const qty = inventory[item.id] ?? 0
        return (
          <div key={item.id} className="lz-dash-item-cell" style={{ opacity: qty <= 0 ? 0.35 : 1 }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>{item.name}</span>
            {qty > 0 && <span className="lz-dash-item-count">x{qty}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ── MiniPlayer ──────────────────────────────────────────

function MiniPlayer() {
  const { isPlaying, toggle } = useBgm()
  return (
    <div className="lz-dash-mini-player">
      <span className="lz-dash-mini-note">{isPlaying ? '♪' : '♫'}</span>
      <span className="lz-dash-mini-title">{isPlaying ? '播放中' : '已暂停'}</span>
      <button className="lz-dash-mini-btn" onClick={(e) => toggle(e)}>
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  )
}

// ── DashboardDrawer ─────────────────────────────────────

export default function DashboardDrawer() {
  const showDashboard = useGameStore((s) => s.showDashboard)
  const toggleDashboard = useGameStore((s) => s.toggleDashboard)

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(DASH_ORDER_KEY)
      if (s) {
        const a = JSON.parse(s)
        if (DEFAULT_ORDER.every((k) => a.includes(k))) return a
      }
    } catch { /* use default */ }
    return [...DEFAULT_ORDER]
  })

  const handleReorder = (v: string[]) => {
    setOrder(v)
    localStorage.setItem(DASH_ORDER_KEY, JSON.stringify(v))
  }

  const renderSection = (id: string) => {
    switch (id) {
      case 'front': return <FrontPage />
      case 'cast': return <CastGallery />
      case 'scenes': return <SceneMap />
      case 'goals': return <Goals />
      case 'items': return <ItemGrid />
      case 'music': return <MiniPlayer />
      default: return null
    }
  }

  return (
    <AnimatePresence>
      {showDashboard && (
        <>
          <motion.div
            className="lz-dash-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDashboard}
          />
          <motion.div
            className="lz-dash-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="lz-dash-header">
              <span className="lz-dash-title">💌 恋综手帐</span>
              <button className="lz-dash-close" onClick={toggleDashboard}>✕</button>
            </div>

            {/* Scrollable sections */}
            <div className="lz-dash-scroll">
              <Reorder.Group
                axis="y"
                values={order}
                onReorder={handleReorder}
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {order.map((id) => (
                  <Section key={id} id={id} title={SECTION_TITLES[id] || id}>
                    {renderSection(id)}
                  </Section>
                ))}
              </Reorder.Group>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
