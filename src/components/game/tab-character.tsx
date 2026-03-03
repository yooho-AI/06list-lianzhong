/**
 * [INPUT]: 依赖 store.ts 状态（角色/数值/关系）
 * [OUTPUT]: 对外提供 TabCharacter 组件
 * [POS]: 人物Tab：2x2角色网格(聊天按钮+mini好感条) + SVG环形RelationGraph + CharacterDossier(overlay+sheet) + CharacterChat
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChatCircleDots } from '@phosphor-icons/react'
import {
  useGameStore,
  CHARACTERS, STAT_METAS,
  getAvailableCharacters, getAffectionLevel, getRelationLabel,
} from '@/lib/store'
import CharacterChat from './character-chat'

const P = 'lz'

// ── RelationGraph (SVG ring layout) ─────────────────────
function RelationGraph({ onSelect }: { onSelect: (id: string) => void }) {
  const currentDay = useGameStore((s) => s.currentDay)
  const characterStats = useGameStore((s) => s.characterStats)

  const available = getAvailableCharacters(currentDay)
  const entries = Object.entries(available)
  const cx = 190, cy = 150, r = 110

  return (
    <div className={`${P}-relation-wrap`}>
      <div className={`${P}-relation-svg`}>
        <svg viewBox="0 0 380 300">
          {/* Center "我" */}
          <text x={cx} y={cy + 5} className={`${P}-relation-center`} textAnchor="middle">我</text>

          {entries.map(([id, char], i) => {
            const angle = (2 * Math.PI * i) / entries.length - Math.PI / 2
            const nx = cx + r * Math.cos(angle)
            const ny = cy + r * Math.sin(angle)
            const stats = characterStats[id]
            const label = stats ? getRelationLabel(stats) : '未知'
            const midX = (cx + nx) / 2
            const midY = (cy + ny) / 2

            return (
              <g key={id} onClick={() => onSelect(id)} style={{ cursor: 'pointer' }}>
                {/* Connection line */}
                <line x1={cx} y1={cy} x2={nx} y2={ny} className={`${P}-relation-line`} />
                {/* Relation label */}
                <text x={midX} y={midY - 6} className={`${P}-relation-label`}>{label}</text>
                {/* Node circle with portrait */}
                <defs>
                  <clipPath id={`clip-${id}`}>
                    <circle cx={nx} cy={ny} r={18} />
                  </clipPath>
                </defs>
                <circle cx={nx} cy={ny} r={19} fill="none" stroke={char.themeColor} strokeWidth={2} />
                <image
                  href={char.portrait}
                  x={nx - 18} y={ny - 18}
                  width={36} height={36}
                  clipPath={`url(#clip-${id})`}
                  preserveAspectRatio="xMidYMin slice"
                />
                {/* Name */}
                <text x={nx} y={ny + 32} className={`${P}-relation-node-name`}>{char.name}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── CharacterDossier (overlay + sheet) ─────────────
function CharacterDossier({
  charId, onClose,
}: {
  charId: string
  onClose: () => void
}) {
  const characterStats = useGameStore((s) => s.characterStats)
  const char = CHARACTERS[charId]
  if (!char) return null

  const stats = characterStats[charId]
  const level = getAffectionLevel(stats?.affection ?? 0)

  return (
    <>
      <motion.div
        className={`${P}-dossier-overlay`}
        style={{ background: 'rgba(0,0,0,0.5)', overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={`${P}-records-sheet`}
        style={{ zIndex: 52, overflowY: 'auto' }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      >
        {/* Portrait */}
        <div className={`${P}-dossier-portrait`}>
          <img src={char.portrait} alt={char.name} />
          <div className={`${P}-dossier-gradient`} />
          <button className={`${P}-dossier-close`} onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className={`${P}-dossier-content`}>
          <div className={`${P}-dossier-name`}>{char.name}</div>
          <div className={`${P}-dossier-subtitle`}>{char.title} · {char.age}岁 · {level.name}</div>
          <div className={`${P}-dossier-desc`}>{char.shortDesc}</div>

          {/* Stat bars */}
          {stats && (
            <div className={`${P}-dossier-stats`}>
              {STAT_METAS.map((meta) => {
                const val = stats[meta.key] ?? 0
                return (
                  <div key={meta.key} className={`${P}-dossier-stat-row`}>
                    <span className={`${P}-dossier-stat-label`}>{meta.icon} {meta.label}</span>
                    <div className={`${P}-dossier-stat-track`}>
                      <div className={`${P}-dossier-stat-fill`}
                        style={{ width: `${Math.min(val, 100)}%`, background: meta.color }} />
                    </div>
                    <span className={`${P}-dossier-stat-val`} style={{ color: meta.color }}>{val}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tags */}
          <div className={`${P}-dossier-tags`}>
            <span className={`${P}-dossier-tag`}>{char.gender === 'female' ? '♀ 女' : '♂ 男'}</span>
            {char.tags.map((tag) => (
              <span key={tag} className={`${P}-dossier-tag`}>{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ══════════════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════════════

export default function TabCharacter() {
  const currentDay = useGameStore((s) => s.currentDay)
  const characterStats = useGameStore((s) => s.characterStats)

  const [dossierChar, setDossierChar] = useState<string | null>(null)
  const [chatChar, setChatChar] = useState<string | null>(null)

  const available = getAvailableCharacters(currentDay)

  return (
    <div className={`${P}-scrollbar`} style={{ height: '100%', overflowY: 'auto', padding: 12 }}>
      {/* ── 嘉宾网格 (2x2) ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        💕 嘉宾列表
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(available).map(([id, char]) => {
          const stats = characterStats[id]
          const affection = stats?.affection ?? 0
          const level = getAffectionLevel(affection)
          return (
            <button
              key={id}
              onClick={() => setDossierChar(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: 10, borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid rgba(0,0,0,0.06)',
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* 聊天按钮 */}
              <div
                onClick={(e) => { e.stopPropagation(); setChatChar(id) }}
                style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${char.themeColor}18`,
                  border: `1px solid ${char.themeColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 1,
                }}
              >
                <ChatCircleDots size={16} weight="fill" color={char.themeColor} />
              </div>
              <img
                src={char.portrait}
                alt={char.name}
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  objectFit: 'cover', objectPosition: 'center top',
                  border: `2px solid ${char.themeColor}44`,
                  marginBottom: 6,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: char.themeColor }}>
                {char.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {char.title}
              </span>
              {/* Mini affection bar */}
              <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: char.themeColor,
                  width: `${affection}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                {level.name} {affection}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── 关系图 ── */}
      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 4 }}>
        🕸️ 关系网络
      </h4>
      <RelationGraph onSelect={(id) => setDossierChar(id)} />

      <div style={{ height: 16 }} />

      {/* ── Dossier overlay ── */}
      <AnimatePresence>
        {dossierChar && (
          <CharacterDossier
            charId={dossierChar}
            onClose={() => setDossierChar(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Character Chat ── */}
      <AnimatePresence>
        {chatChar && (
          <CharacterChat charId={chatChar} onClose={() => setChatChar(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
