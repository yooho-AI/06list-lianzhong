/**
 * [INPUT]: 依赖 @/lib/store, @/lib/parser
 * [OUTPUT]: 对外提供 DialoguePanel 组件
 * [POS]: 恋综模拟器 PC 端中间对话面板
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore, CHARACTERS, SCENES, STORY_INFO } from '@/lib/store'
import { parseStoryParagraph } from '@/lib/parser'
import HighlightModal from './highlight-modal'

// ============================================================
// 消息渲染
// ============================================================

function MessageItem({ msg }: { msg: { id: string; role: string; content: string } }) {
  if (msg.role === 'system') {
    return (
      <div className="lz-system-msg">
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    )
  }

  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div className="lz-player-bubble">{msg.content}</div>
      </div>
    )
  }

  /* assistant — 故事段落 */
  const { narrative, statHtml } = parseStoryParagraph(msg.content)
  return (
    <div>
      <div
        className="lz-story-paragraph"
        dangerouslySetInnerHTML={{ __html: narrative }}
      />
      {statHtml && (
        <div
          className="lz-story-paragraph"
          style={{ marginTop: -8, paddingTop: 8, paddingBottom: 8 }}
          dangerouslySetInnerHTML={{ __html: statHtml }}
        />
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div
      className="lz-story-paragraph"
      style={{ background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        <span className="lz-typing-dot" />
        <span className="lz-typing-dot" />
        <span className="lz-typing-dot" />
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>正在回应...</span>
    </div>
  )
}

// ============================================================
// 流式内容显示
// ============================================================

function StreamingMessage({ content }: { content: string }) {
  const { narrative, statHtml } = parseStoryParagraph(content)
  return (
    <div>
      <div
        className="lz-story-paragraph"
        dangerouslySetInnerHTML={{ __html: narrative }}
      />
      {statHtml && (
        <div
          className="lz-story-paragraph"
          style={{ marginTop: -8, paddingTop: 8, paddingBottom: 8 }}
          dangerouslySetInnerHTML={{ __html: statHtml }}
        />
      )}
      <span className="lz-typing-cursor">▍</span>
    </div>
  )
}

// ============================================================
// 输入区
// ============================================================

function InputArea({ onSend, isLoading }: { onSend: (text: string) => void; isLoading: boolean }) {
  const [text, setText] = useState('')
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const char = currentCharacter ? CHARACTERS[currentCharacter] : null

  const placeholder = isLoading
    ? '等待回复中...'
    : char
      ? `对 ${char.name} 说...`
      : '说点什么...'

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
  }

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        gap: 8,
        padding: '14px 16px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '0 0 12px 12px',
      }}
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyUp={(e) => e.key === 'Enter' && handleSend()}
        placeholder={placeholder}
        disabled={isLoading}
        className="lz-input"
      />
      <button onClick={handleSend} disabled={isLoading || !text.trim()} className="lz-send-btn">
        {isLoading ? '...' : '发送'}
      </button>
    </div>
  )
}

// ============================================================
// 开场信笺
// ============================================================

function LetterCard() {
  return (
    <div className="lz-letter-card">
      <div className="lz-letter-seal">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="10" />
          <path
            fill="#fff"
            d="M12 6l1.5 3.5 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5z"
          />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="lz-letter-genre">{STORY_INFO.genre}</div>
        <h2 className="lz-letter-title">{STORY_INFO.title}</h2>
        <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: -12, marginBottom: 16, letterSpacing: 1, opacity: 0.7 }}>
          {STORY_INFO.subtitle}
        </p>
      </div>
      <p className="lz-letter-body">{STORY_INFO.description}</p>
      <div className="lz-letter-goals">
        <div className="lz-letter-goals-label">— 你的使命 —</div>
        {STORY_INFO.goals.map((goal, i) => (
          <div key={i} className="lz-letter-goal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            <span>{goal}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================

export default function DialoguePanel() {
  const messages = useGameStore((s) => s.messages)
  const isTyping = useGameStore((s) => s.isTyping)
  const streamingContent = useGameStore((s) => s.streamingContent)
  const sendMessage = useGameStore((s) => s.sendMessage)
  const currentScene = useGameStore((s) => s.currentScene)
  const [showHighlight, setShowHighlight] = useState(false)

  const scene = SCENES[currentScene]
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  const canHighlight = messages.filter((m) => m.role !== 'system').length >= 5

  /* 智能滚动 */
  useEffect(() => {
    const container = containerRef.current
    if (container && isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages.length, isTyping, streamingContent])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSend = useCallback(
    (text: string) => { sendMessage(text) },
    [sendMessage]
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '12px 0 12px 12px',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        className="lz-card"
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        {/* 背景图层 */}
        <div className="lz-dialogue-bg">
          {scene?.backgroundVideo ? (
            <video
              key={scene.backgroundVideo}
              src={scene.backgroundVideo}
              poster={scene.background}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : scene?.background ? (
            <img src={scene.background} alt={scene.name} />
          ) : null}
          <div className="lz-dialogue-bg-overlay" />
        </div>

        {/* 消息列表 */}
        <div
          ref={containerRef}
          className="lz-scrollbar"
          style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: '20px 24px' }}
        >
          <LetterCard />
          {messages.map((msg) => (
            <MessageItem key={msg.id} msg={msg} />
          ))}
          {isTyping && streamingContent && <StreamingMessage content={streamingContent} />}
          {isTyping && !streamingContent && <TypingIndicator />}

          {/* 高光时刻按钮 */}
          {canHighlight && !isTyping && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                onClick={() => setShowHighlight(true)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 99,
                  border: '1px solid #f59e0b',
                  background: 'white',
                  color: '#f59e0b',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✨ 高光时刻
              </button>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <InputArea onSend={handleSend} isLoading={isTyping} />
      </div>

      {/* 高光弹窗 */}
      <AnimatePresence>
        {showHighlight && <HighlightModal onClose={() => setShowHighlight(false)} />}
      </AnimatePresence>
    </div>
  )
}
