/**
 * [INPUT]: 依赖 @/lib/store, @/lib/parser, @/lib/bgm, framer-motion
 * [OUTPUT]: 对外提供 MobileGameLayout 组件
 * [POS]: 恋综模拟器移动端完整布局，被 App.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGameStore, CHARACTERS, SCENES, PERIODS, ITEMS, STORY_INFO, ENDINGS,
  getAvailableCharacters,
} from '@/lib/store'
import { parseStoryParagraph } from '@/lib/parser'
import { useBgm } from '@/lib/bgm'
import HighlightModal from './highlight-modal'

// ============================================================
// 移动端顶栏
// ============================================================

function MobileHeader({
  onCharClick,
  onMenuClick,
}: {
  onCharClick: () => void
  onMenuClick: () => void
}) {
  const currentDay = useGameStore((s) => s.currentDay)
  const currentPeriodIndex = useGameStore((s) => s.currentPeriodIndex)
  const currentScene = useGameStore((s) => s.currentScene)
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const selectScene = useGameStore((s) => s.selectScene)
  const { isPlaying, toggle } = useBgm()

  const period = PERIODS[currentPeriodIndex]
  const char = currentCharacter ? CHARACTERS[currentCharacter] : null

  return (
    <header className="mobile-header" style={{ flexDirection: 'column', gap: 4, padding: '8px 12px 6px' }}>
      {/* 上排：日期 + 时段 + 音乐 + 菜单 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div className="mobile-header-left">
          <span className="mobile-header-stage">🌅 第{currentDay}天</span>
          <span className="mobile-header-scene">{period?.icon} {period?.name}</span>
          <button
            onClick={(e) => toggle(e)}
            title={isPlaying ? '关闭音乐' : '开启音乐'}
            style={{
              background: 'rgba(217, 70, 239, 0.1)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 10px',
            }}
          >
            {isPlaying ? '🔊' : '🔇'}
          </button>
        </div>
        <div className="mobile-header-right">
          <button className="mobile-header-npc" onClick={onCharClick}>
            {char ? (
              <span style={{ color: char.themeColor }}>{char.name}</span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>选择角色</span>
            )}
            <span className="mobile-header-arrow">▼</span>
          </button>
          <button className="mobile-header-menu" onClick={onMenuClick}>
            ☰
          </button>
        </div>
      </div>

      {/* 下排：场景快速切换 */}
      <div
        className="lz-scrollbar"
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          width: '100%',
          paddingBottom: 2,
        }}
      >
        {Object.values(SCENES).map((s) => (
          <button
            key={s.id}
            onClick={() => selectScene(s.id)}
            style={{
              flexShrink: 0,
              padding: '3px 10px',
              borderRadius: 99,
              border: currentScene === s.id ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: currentScene === s.id ? 'rgba(217, 70, 239, 0.08)' : 'white',
              color: currentScene === s.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: currentScene === s.id ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>
    </header>
  )
}

// ============================================================
// 移动端信笺
// ============================================================

function MobileLetterCard() {
  return (
    <div className="mobile-letter-card">
      <div className="mobile-letter-icon">🌅</div>
      <div className="mobile-letter-genre">{STORY_INFO.genre}</div>
      <h2 className="mobile-letter-title">{STORY_INFO.title}</h2>
      <p className="mobile-letter-body">{STORY_INFO.description}</p>
    </div>
  )
}

// ============================================================
// 移动端对话区
// ============================================================

function MobileDialogue({ onCharClick }: { onCharClick: () => void }) {
  const messages = useGameStore((s) => s.messages)
  const isTyping = useGameStore((s) => s.isTyping)
  const streamingContent = useGameStore((s) => s.streamingContent)
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const char = currentCharacter ? CHARACTERS[currentCharacter] : null
  const hasUserMessage = messages.some((m) => m.role === 'user')

  useEffect(() => {
    const container = scrollRef.current
    if (container && isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isTyping, streamingContent])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={scrollRef} className="mobile-dialogue lz-scrollbar" style={{ position: 'relative' }}>
      {/* 浮动角色视频小窗 */}
      {char && hasUserMessage && (
        <div
          onClick={onCharClick}
          style={{
            position: 'sticky',
            top: 8,
            float: 'right',
            width: 80,
            height: 106,
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            border: '2px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
            marginRight: 4,
          }}
        >
          {char.video ? (
            <video
              key={currentCharacter}
              src={char.video}
              poster={char.fullImage}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={char.fullImage}
              alt={char.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '14px 4px 4px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              fontSize: 10,
              fontWeight: 600,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            {char.name}
          </div>
        </div>
      )}

      {messages.length === 0 && <MobileLetterCard />}

      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="mobile-msg-user">
              <div className="mobile-bubble-user">{msg.content}</div>
            </div>
          )
        }

        if (msg.role === 'system') {
          return (
            <div key={msg.id} className="mobile-msg-system">
              {msg.content}
            </div>
          )
        }

        const { narrative, statHtml } = parseStoryParagraph(msg.content)
        return (
          <div key={msg.id}>
            <div className="mobile-msg-ai">
              <div className="mobile-bubble-ai" dangerouslySetInnerHTML={{ __html: narrative }} />
            </div>
            {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
          </div>
        )
      })}

      {isTyping && streamingContent && (() => {
        const { narrative, statHtml } = parseStoryParagraph(streamingContent)
        return (
          <div>
            <div className="mobile-msg-ai">
              <div className="mobile-bubble-ai" dangerouslySetInnerHTML={{ __html: narrative }} />
            </div>
            {statHtml && <div dangerouslySetInnerHTML={{ __html: statHtml }} />}
          </div>
        )
      })()}

      {isTyping && !streamingContent && (
        <div className="mobile-msg-ai">
          <div className="mobile-bubble-ai mobile-typing">
            <span className="mobile-typing-dot" />
            <span className="mobile-typing-dot" />
            <span className="mobile-typing-dot" />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 移动端输入栏
// ============================================================

function MobileInputBar({ onInventoryClick }: { onInventoryClick: () => void }) {
  const [input, setInput] = useState('')
  const [showHighlight, setShowHighlight] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const messages = useGameStore((s) => s.messages)
  const isTyping = useGameStore((s) => s.isTyping)
  const sendMessage = useGameStore((s) => s.sendMessage)
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const inventory = useGameStore((s) => s.inventory)

  const char = currentCharacter ? CHARACTERS[currentCharacter] : null
  const canHighlight = messages.filter((m) => m.role !== 'system').length >= 5
  const inventoryCount = Object.values(inventory).reduce((sum, n) => sum + (n > 0 ? n : 0), 0)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className="mobile-input-bar" style={{ flexDirection: 'column', gap: 0 }}>
      {/* 快捷操作 */}
      <div
        className="flex gap-2 overflow-x-auto px-3 py-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {canHighlight && (
          <button
            onClick={() => setShowHighlight(true)}
            className="shrink-0 rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: '#f59e0b', color: '#f59e0b', background: 'white' }}
          >
            ✨ 高光
          </button>
        )}
      </div>

      <AnimatePresence>
        {showHighlight && <HighlightModal onClose={() => setShowHighlight(false)} />}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-3 py-2">
        <button className="mobile-inventory-btn" onClick={onInventoryClick}>
          🎒
          {inventoryCount > 0 && <span className="mobile-inventory-badge">{inventoryCount}</span>}
        </button>
        <form onSubmit={handleSubmit} className="mobile-input-form">
          <input
            ref={inputRef}
            type="text"
            className="mobile-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={char ? `对${char.name}说...` : '说点什么...'}
            disabled={isTyping}
          />
          <button type="submit" className="mobile-send-btn" disabled={isTyping || !input.trim()}>
            发送
          </button>
        </form>
      </div>
    </div>
  )
}

// ============================================================
// 角色选择面板 — 10角色4数值
// ============================================================

function CharacterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const currentDay = useGameStore((s) => s.currentDay)
  const characterStats = useGameStore((s) => s.characterStats)
  const selectCharacter = useGameStore((s) => s.selectCharacter)

  const available = getAvailableCharacters(currentDay)

  const handleSelect = (id: string) => {
    selectCharacter(currentCharacter === id ? null : id)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-title">选择角色</div>
            <div className="mobile-char-grid">
              {Object.values(available).map((char) => {
                const isSelected = currentCharacter === char.id
                const stats = characterStats[char.id]
                return (
                  <button
                    key={char.id}
                    className={`mobile-char-card ${isSelected ? 'selected' : ''}`}
                    style={{ borderColor: isSelected ? char.themeColor : 'transparent' }}
                    onClick={() => handleSelect(char.id)}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden' }}>
                      {char.video ? (
                        <video
                          src={char.video}
                          poster={char.fullImage}
                          autoPlay loop muted playsInline
                          style={{ width: 48, height: 48, objectFit: 'cover' }}
                        />
                      ) : (
                        <img
                          src={char.fullImage}
                          alt={char.name}
                          style={{ width: 48, height: 48, objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <span className="mobile-char-name" style={{ color: char.themeColor }}>
                      {char.gender === 'female' ? '🚺' : '🚹'} {char.name}
                    </span>
                    <div className="mobile-char-stats">
                      <span style={{ color: '#d946ef' }}>❤{stats?.affection ?? 0}</span>
                      <span style={{ color: '#f97316' }}>😒{stats?.jealousy ?? 0}</span>
                      <span style={{ color: '#ef4444' }}>😤{stats?.disgust ?? 0}</span>
                      <span style={{ color: '#3b82f6' }}>⭐{stats?.reputation ?? 50}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// 背包面板
// ============================================================

function InventorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inventory = useGameStore((s) => s.inventory)
  const useItem = useGameStore((s) => s.useItem)
  const isTyping = useGameStore((s) => s.isTyping)

  const handleUseItem = (itemId: string) => {
    useItem(itemId)
    onClose()
  }

  const hasItems = Object.entries(inventory).some(([, count]) => count > 0)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-title">🎒 背包</div>
            <div className="lz-scrollbar" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {hasItems ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
                  {Object.entries(inventory).map(([itemId, count]) => {
                    if (count <= 0) return null
                    const item = ITEMS[itemId]
                    if (!item) return null
                    return (
                      <button
                        key={itemId}
                        onClick={() => handleUseItem(itemId)}
                        disabled={isTyping}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'white', cursor: isTyping ? 'default' : 'pointer',
                          opacity: isTyping ? 0.5 : 1, textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{item.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.description}</div>
                        </div>
                        {count > 1 && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>×{count}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="lz-placeholder" style={{ height: 120 }}>
                  <span style={{ fontSize: 32, opacity: 0.5 }}>🎒</span>
                  <span className="lz-placeholder-text">背包空空如也</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// 结局面板
// ============================================================

function EndingSheet() {
  const endingType = useGameStore((s) => s.endingType)
  const resetGame = useGameStore((s) => s.resetGame)

  const ending = endingType ? ENDINGS.find((e) => e.id === endingType) : null
  if (!ending) return null

  const typeLabel = ending.type === 'HE' ? '🎉 Happy Ending' : ending.type === 'NE' ? '🌤️ Normal Ending' : '💔 Bad Ending'

  return (
    <motion.div
      className="lz-ending-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="lz-ending-modal">
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {ending.type === 'HE' ? '🌅' : ending.type === 'NE' ? '🌤️' : '🌧️'}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#d946ef', marginBottom: 6, letterSpacing: 2 }}>
          {typeLabel}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px' }}>
          {ending.name}
        </h2>
        <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {ending.description}
        </p>
        <button
          onClick={() => resetGame()}
          style={{
            padding: '10px 28px',
            borderRadius: 99,
            border: 'none',
            background: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          返回标题
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================
// 移动端菜单
// ============================================================

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resetGame = useGameStore((s) => s.resetGame)
  const saveGame = useGameStore((s) => s.saveGame)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="mobile-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="mobile-menu-title">游戏菜单</div>
            <button className="mobile-menu-btn" onClick={() => { saveGame(); onClose() }}>
              💾 保存游戏
            </button>
            <button className="mobile-menu-btn" onClick={() => resetGame()}>
              🏠 返回标题
            </button>
            <button className="mobile-menu-btn" onClick={onClose}>
              ▶️ 继续游戏
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================
// 移动端游戏主布局
// ============================================================

export default function MobileGameLayout() {
  const [showChar, setShowChar] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const currentScene = useGameStore((s) => s.currentScene)
  const endingType = useGameStore((s) => s.endingType)
  const scene = SCENES[currentScene]

  return (
    <div className="mobile-game" style={{ position: 'relative' }}>
      {/* 场景背景 */}
      {scene?.backgroundVideo ? (
        <video
          key={scene.backgroundVideo}
          src={scene.backgroundVideo}
          poster={scene.background}
          autoPlay loop muted playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            zIndex: 0, pointerEvents: 'none',
          }}
        />
      ) : scene?.background ? (
        <img
          src={scene.background}
          alt={scene.name}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            zIndex: 0, pointerEvents: 'none',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(254,247,255,0.65)',
          zIndex: 0, pointerEvents: 'none',
        }}
      />

      <MobileHeader
        onCharClick={() => setShowChar(true)}
        onMenuClick={() => setShowMenu(true)}
      />
      <MobileDialogue onCharClick={() => setShowChar(true)} />
      <MobileInputBar onInventoryClick={() => setShowInventory(true)} />

      <CharacterSheet open={showChar} onClose={() => setShowChar(false)} />
      <InventorySheet open={showInventory} onClose={() => setShowInventory(false)} />
      <MobileMenu open={showMenu} onClose={() => setShowMenu(false)} />

      {endingType && <EndingSheet />}
    </div>
  )
}
