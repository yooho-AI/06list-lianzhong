/**
 * [INPUT]: 依赖 @/lib/store, @/lib/hooks, @/lib/bgm, framer-motion, 游戏组件
 * [OUTPUT]: 对外提供 App 根组件（独立 SPA，无路由依赖）
 * [POS]: 恋综模拟器项目入口，StartScreen ↔ GameScreen 状态切换
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, CHARACTERS, ENDINGS } from '@/lib/store'
import { useIsMobile } from '@/lib/hooks'
import { useBgm } from '@/lib/bgm'
import DialoguePanel from '@/components/game/dialogue-panel'
import LeftPanel from '@/components/game/character-panel'
import RightPanel from '@/components/game/side-panel'
import MobileGameLayout from '@/components/game/mobile-layout'
import '@/styles/globals.css'

// ============================================================
// 开始界面
// ============================================================

function StartScreen() {
  const selectPlayMode = useGameStore((s) => s.selectPlayMode)
  const initGame = useGameStore((s) => s.initGame)
  const loadGame = useGameStore((s) => s.loadGame)
  const hasSave = useGameStore((s) => s.hasSave)
  const { toggle, isPlaying } = useBgm()

  const handleStart = (mode: 'liumei' | 'newcomer') => {
    selectPlayMode(mode)
    initGame()
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#fef7ff] via-[#fce7f3] to-[#f5f0ff]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg px-6 text-center"
      >
        {/* 标题 */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="mb-6 text-5xl"
        >
          🌅
        </motion.div>
        <h1 className="mb-2 text-2xl font-bold text-[#1a1a2e]">黄昏时分说爱你</h1>
        <p className="mb-1 text-sm text-[#d946ef]/80">Love at Sunset · 恋综模拟器</p>
        <p className="mb-8 text-xs leading-relaxed text-[#6b6b8a]">
          大理洱海畔的合宿别墅，十位 50+ 嘉宾，十五天的朝夕相处。
          在人生的黄昏时分，勇敢地再说一次"我喜欢你"。
        </p>

        {/* 角色预览 — 2行x5列 */}
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {Object.values(CHARACTERS).map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="w-[60px] text-center"
            >
              <div
                className="mx-auto mb-1.5 h-14 w-14 overflow-hidden rounded-full shadow-lg"
                style={{ border: `3px solid ${char.themeColor}` }}
              >
                <img
                  src={char.fullImage}
                  alt={char.name}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="text-xs font-medium text-[#1a1a2e]">{char.name}</div>
              <div className="text-[10px] text-[#9b9ab0]">
                {char.gender === 'female' ? '🚺' : '🚹'}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 模式选择 + 按钮组 */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleStart('liumei')}
            className="w-full rounded-full px-8 py-3 text-sm font-medium text-white shadow-lg transition-shadow"
            style={{
              background: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)',
              boxShadow: '0 4px 16px rgba(217, 70, 239, 0.3)',
            }}
          >
            扮演刘枚
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleStart('newcomer')}
            className="w-full rounded-full border px-8 py-3 text-sm font-medium transition-colors"
            style={{
              borderColor: 'rgba(217, 70, 239, 0.3)',
              color: '#d946ef',
            }}
          >
            空降入局
          </motion.button>

          {hasSave() && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loadGame()}
              className="w-full rounded-full border px-8 py-3 text-sm font-medium transition-colors"
              style={{
                borderColor: 'rgba(217, 70, 239, 0.15)',
                color: '#9b9ab0',
              }}
            >
              继续游戏
            </motion.button>
          )}
        </div>

        {/* 音乐按钮 */}
        <button
          onClick={(e) => toggle(e)}
          className="mt-4 text-xs text-[#9b9ab0] transition-colors hover:text-[#6b6b8a]"
        >
          {isPlaying ? '🔊 音乐开' : '🔇 音乐关'}
        </button>
      </motion.div>
    </div>
  )
}

// ============================================================
// 顶部状态栏
// ============================================================

function HeaderBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { toggle, isPlaying } = useBgm()

  return (
    <header
      className="relative z-10 flex min-h-[44px] items-center justify-end gap-2 px-4 py-2"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <button
        onClick={(e) => toggle(e)}
        className="rounded px-3 py-2 text-sm transition-all"
        style={{ color: '#6b6b8a' }}
        title={isPlaying ? '关闭音乐' : '开启音乐'}
      >
        {isPlaying ? '🔊' : '🔇'}
      </button>
      <button
        onClick={onMenuClick}
        className="rounded px-3 py-2 text-sm transition-all"
        style={{ color: '#6b6b8a' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(217,70,239,0.08)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        title="菜单"
      >
        ☰
      </button>
    </header>
  )
}

// ============================================================
// 菜单弹窗
// ============================================================

function MenuOverlay({ onClose }: { onClose: () => void }) {
  const saveGame = useGameStore((s) => s.saveGame)
  const loadGame = useGameStore((s) => s.loadGame)
  const resetGame = useGameStore((s) => s.resetGame)

  return (
    <div className="lz-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="lz-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, margin: '0 0 16px', textAlign: 'center' }}
        >
          游戏菜单
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="lz-modal-btn" onClick={() => { saveGame(); onClose() }}>💾 保存游戏</button>
          <button className="lz-modal-btn" onClick={() => { loadGame(); onClose() }}>📂 读取存档</button>
          <button className="lz-modal-btn" onClick={() => resetGame()}>🏠 返回标题</button>
          <button className="lz-modal-btn" onClick={onClose}>▶️ 继续游戏</button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================
// 结局弹窗
// ============================================================

function EndingModal() {
  const endingType = useGameStore((s) => s.endingType)
  const resetGame = useGameStore((s) => s.resetGame)

  const ending = ENDINGS.find((e) => e.id === endingType)
  if (!ending) return null

  const typeLabel = ending.type === 'HE' ? '🎉 Happy Ending' : ending.type === 'NE' ? '🌤️ Normal Ending' : '💔 Bad Ending'
  const typeColor = ending.type === 'HE' ? '#d946ef' : ending.type === 'NE' ? '#f59e0b' : '#6b6b8a'

  return (
    <div className="lz-ending-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="lz-ending-modal"
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {ending.type === 'HE' ? '🌅' : ending.type === 'NE' ? '🌤️' : '🌧️'}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: typeColor, marginBottom: 8, letterSpacing: 2 }}>
          {typeLabel}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px', letterSpacing: 1 }}>
          {ending.name}
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24 }}>
          {ending.description}
        </p>
        <button
          onClick={() => resetGame()}
          style={{
            padding: '10px 32px',
            borderRadius: 99,
            border: 'none',
            background: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(217, 70, 239, 0.3)',
          }}
        >
          返回标题
        </button>
      </motion.div>
    </div>
  )
}

// ============================================================
// 通知
// ============================================================

function Notification({ text, type }: { text: string; type: string }) {
  return (
    <div className={`lz-notification ${type}`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      <span>{text}</span>
    </div>
  )
}

// ============================================================
// PC 游戏主屏幕
// ============================================================

function GameScreen() {
  const [showMenu, setShowMenu] = useState(false)
  const [notification, setNotification] = useState<{ text: string; type: string } | null>(null)
  const endingType = useGameStore((s) => s.endingType)

  const showNotif = useCallback((text: string, type = 'info') => {
    setNotification({ text, type })
    setTimeout(() => setNotification(null), 2000)
  }, [])
  void showNotif

  return (
    <div
      className="flex h-screen flex-col"
      style={{ background: 'var(--bg-secondary)', fontFamily: 'var(--font)' }}
    >
      <HeaderBar onMenuClick={() => setShowMenu(true)} />

      <main className="flex flex-1 overflow-hidden">
        <aside className="w-[280px] shrink-0">
          <LeftPanel />
        </aside>
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <DialoguePanel />
        </section>
        <aside className="shrink-0">
          <RightPanel />
        </aside>
      </main>

      <AnimatePresence>
        {showMenu && <MenuOverlay onClose={() => setShowMenu(false)} />}
      </AnimatePresence>

      {endingType && <EndingModal />}

      <AnimatePresence>
        {notification && (
          <motion.div
            key="notif"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Notification text={notification.text} type={notification.type} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================
// App 根组件
// ============================================================

export default function App() {
  const gameStarted = useGameStore((s) => s.gameStarted)
  const isMobile = useIsMobile()

  return (
    <AnimatePresence mode="wait">
      {gameStarted ? (
        <motion.div
          key="game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-screen"
        >
          {isMobile ? <MobileGameLayout /> : <GameScreen />}
        </motion.div>
      ) : (
        <motion.div key="start" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <StartScreen />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
