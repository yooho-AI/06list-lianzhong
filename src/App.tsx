/**
 * [INPUT]: 依赖 store.ts 状态，styles/*.css
 * [OUTPUT]: 对外提供 App 根组件
 * [POS]: 根组件: 开场屏(粉紫渐变+角色网格+双模式) + GameScreen + EndingModal + MenuOverlay
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useGameStore,
  CHARACTERS, ENDINGS, ENDING_TYPE_MAP, STORY_INFO,
} from '@/lib/store'
import { trackGameStart, trackGameContinue } from '@/lib/analytics'
import { useBgm } from '@/lib/bgm'
import {
  FloppyDisk, FolderOpen, ArrowCounterClockwise,
  X, MusicNotes,
} from '@phosphor-icons/react'
import AppShell from '@/components/game/app-shell'
import './styles/globals.css'
import './styles/opening.css'
import './styles/rich-cards.css'

// ── Opening Screen ──────────────────────────────────

function StartScreen() {
  const [name, setName] = useState('')
  const hasSave = useGameStore((s) => s.hasSave)
  const loadGame = useGameStore((s) => s.loadGame)
  const selectPlayMode = useGameStore((s) => s.selectPlayMode)
  const setPlayerInfo = useGameStore((s) => s.setPlayerInfo)
  const initGame = useGameStore((s) => s.initGame)
  const { toggle: toggleBgm } = useBgm()

  const charList = Object.values(CHARACTERS)

  const handleContinue = useCallback(() => {
    trackGameContinue()
    loadGame()
  }, [loadGame])

  const handleStart = (mode: 'liumei' | 'newcomer') => {
    trackGameStart()
    setPlayerInfo(name.trim() || '玩家')
    selectPlayMode(mode)
    initGame()
  }

  return (
    <div className="lz-opening">
      <motion.div
        className="lz-opening-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Title */}
        <div className="lz-opening-icon">🌅</div>
        <div className="lz-opening-title">{STORY_INFO.title}</div>
        <div className="lz-opening-subtitle">{STORY_INFO.subtitle}</div>
        <div className="lz-opening-desc">{STORY_INFO.description}</div>

        {/* Character Roster (2x5 grid) */}
        <div className="lz-opening-roster">
          {charList.map((char) => (
            <div key={char.id} className="lz-opening-char">
              <div className="lz-opening-char-avatar">
                <img src={char.portrait} alt={char.name} />
              </div>
              <div className="lz-opening-char-name">{char.name}</div>
              <div className="lz-opening-char-gender">
                {char.gender === 'female' ? '女' : '男'} · {char.age}岁
              </div>
            </div>
          ))}
        </div>

        {/* Name Input */}
        <div style={{ marginBottom: 20, maxWidth: 300, margin: '0 auto 20px' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入你的名字"
            maxLength={8}
            style={{
              width: '100%', padding: '10px 16px',
              border: '1.5px solid rgba(217, 70, 239, 0.2)',
              borderRadius: 100, background: 'rgba(255,255,255,0.8)',
              fontSize: 14, textAlign: 'center', outline: 'none',
              fontFamily: 'var(--font)', color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="lz-opening-actions">
          <button
            className="lz-opening-btn-primary"
            onClick={() => handleStart('liumei')}
          >
            扮演刘枚 · 开始恋旅
          </button>
          <button
            className="lz-opening-btn-secondary"
            onClick={() => handleStart('newcomer')}
          >
            空降入局 · 全新身份
          </button>
          {hasSave() && (
            <button
              className="lz-opening-btn-continue"
              onClick={handleContinue}
            >
              继续游戏
            </button>
          )}
        </div>

        {/* BGM Toggle */}
        <button
          className="lz-opening-music"
          onClick={() => toggleBgm()}
        >
          <MusicNotes size={14} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />
          背景音乐
        </button>
      </motion.div>
    </div>
  )
}

// ── Ending Modal ────────────────────────────────────

function EndingModal() {
  const endingType = useGameStore((s) => s.endingType)
  const resetGame = useGameStore((s) => s.resetGame)
  const clearSave = useGameStore((s) => s.clearSave)

  if (!endingType) return null

  const ending = ENDINGS.find((e) => e.id === endingType)
  if (!ending) return null

  const typeInfo = ENDING_TYPE_MAP[ending.type]

  return (
    <motion.div
      className="lz-ending-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="lz-ending-card"
        style={{ background: typeInfo.gradient }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="lz-ending-type">{typeInfo.label}</div>
        <div className="lz-ending-title">{ending.name}</div>
        <p className="lz-ending-desc">{ending.description}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="lz-ending-btn"
            onClick={() => { clearSave(); resetGame() }}
          >
            返回标题
          </button>
          <button
            className="lz-ending-btn-outline"
            onClick={() => useGameStore.setState({ endingType: null })}
          >
            继续探索
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Menu Overlay ────────────────────────────────────

function MenuOverlay({
  show,
  onClose,
}: {
  show: boolean
  onClose: () => void
}) {
  const saveGame = useGameStore((s) => s.saveGame)
  const loadGame = useGameStore((s) => s.loadGame)
  const resetGame = useGameStore((s) => s.resetGame)
  const clearSave = useGameStore((s) => s.clearSave)
  const [toast, setToast] = useState('')

  if (!show) return null

  const handleSave = () => {
    saveGame()
    setToast('已保存')
    setTimeout(() => setToast(''), 2000)
  }

  const handleLoad = () => {
    if (loadGame()) onClose()
  }

  const handleReset = () => {
    clearSave()
    resetGame()
    onClose()
  }

  return (
    <motion.div
      className="lz-menu-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
          {STORY_INFO.title}
        </h3>
        <button className="lz-menu-btn" onClick={handleSave}>
          <FloppyDisk size={16} weight="fill" style={{ verticalAlign: 'middle', marginRight: 6 }} />
          保存进度
        </button>
        <button className="lz-menu-btn" onClick={handleLoad}>
          <FolderOpen size={16} weight="fill" style={{ verticalAlign: 'middle', marginRight: 6 }} />
          读取存档
        </button>
        <button className="lz-menu-btn" onClick={handleReset} style={{ color: '#ef4444' }}>
          <ArrowCounterClockwise size={16} weight="fill" style={{ verticalAlign: 'middle', marginRight: 6 }} />
          重新开始
        </button>
        <button className="lz-menu-btn" onClick={onClose}>
          <X size={16} weight="bold" style={{ verticalAlign: 'middle', marginRight: 6 }} />
          继续游戏
        </button>

        {toast && <div className="lz-toast">{toast}</div>}
      </motion.div>
    </motion.div>
  )
}

// ── App Root ────────────────────────────────────────

export default function App() {
  const gameStarted = useGameStore((s) => s.gameStarted)
  const [showMenu, setShowMenu] = useState(false)

  if (!gameStarted) {
    return <StartScreen />
  }

  return (
    <>
      <AppShell onMenuOpen={() => setShowMenu(true)} />
      <EndingModal />
      <AnimatePresence>
        {showMenu && (
          <MenuOverlay show={showMenu} onClose={() => setShowMenu(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
