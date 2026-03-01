/**
 * [INPUT]: 依赖 store.ts 状态（角色/数值/关系）
 * [OUTPUT]: 对外提供 TabCharacter 组件
 * [POS]: 人物Tab：立绘Hero + StatMeta驱动数值条 + SVG环形RelationGraph + 角色网格 + CharacterDossier全屏档案
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useGameStore,
  CHARACTERS, STAT_METAS,
  getAvailableCharacters, getAffectionLevel, getRelationLabel,
} from '@/lib/store'

// ── PortraitHero ────────────────────────────────────────

function PortraitHero() {
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const characterStats = useGameStore((s) => s.characterStats)

  const char = currentCharacter ? CHARACTERS[currentCharacter] : null
  if (!char) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      请选择一位嘉宾查看详情
    </div>
  )

  const stats = characterStats[char.id]
  const level = getAffectionLevel(stats?.affection ?? 0)

  return (
    <div className="lz-scene-hero" style={{ marginBottom: 0 }}>
      <img src={char.portrait} alt={char.name} />
      <div className="scene-overlay">
        <div className="scene-name" style={{ color: char.themeColor }}>
          {char.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {char.title} · {char.age}岁 · {level.name}
        </div>
      </div>
    </div>
  )
}

// ── StatBars (StatMeta driven) ──────────────────────────

function StatBars() {
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const characterStats = useGameStore((s) => s.characterStats)

  if (!currentCharacter) return null
  const stats = characterStats[currentCharacter]
  if (!stats) return null

  return (
    <div style={{ padding: '16px 16px 0' }}>
      {STAT_METAS.map((meta, i) => {
        const val = stats[meta.key] ?? 0
        return (
          <div key={meta.key} style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 48, flexShrink: 0 }}>
              {meta.icon} {meta.label}
            </span>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: 'rgba(0,0,0,0.06)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(val, 100)}%`, height: '100%', borderRadius: 3,
                background: meta.color, transition: 'width 0.5s ease',
                animationDelay: `${i * 0.1}s`,
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: meta.color,
              fontVariantNumeric: 'tabular-nums', minWidth: 24, textAlign: 'right',
            }}>{val}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── RelationGraph (SVG ring layout) ─────────────────────

function RelationGraph({ onSelect }: { onSelect: (id: string) => void }) {
  const currentDay = useGameStore((s) => s.currentDay)
  const characterStats = useGameStore((s) => s.characterStats)

  const available = getAvailableCharacters(currentDay)
  const entries = Object.entries(available)
  const cx = 190, cy = 150, r = 110

  return (
    <div className="lz-relation-wrap">
      <div className="lz-relation-svg">
        <svg viewBox="0 0 380 300">
          {/* Center "我" */}
          <text x={cx} y={cy + 5} className="lz-relation-center" textAnchor="middle">我</text>

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
                <line x1={cx} y1={cy} x2={nx} y2={ny} className="lz-relation-line" />
                {/* Relation label */}
                <text x={midX} y={midY - 6} className="lz-relation-label">{label}</text>
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
                <text x={nx} y={ny + 32} className="lz-relation-node-name">{char.name}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── CharacterGrid ───────────────────────────────────────

function CharacterGrid({ onSelect }: { onSelect: (id: string) => void }) {
  const currentDay = useGameStore((s) => s.currentDay)
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const characterStats = useGameStore((s) => s.characterStats)

  const available = getAvailableCharacters(currentDay)

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10, padding: '0 16px 16px',
    }}>
      {Object.entries(available).map(([id, char]) => {
        const active = id === currentCharacter
        const stats = characterStats[id]
        const affection = stats?.affection ?? 0
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '10px 4px', borderRadius: 12,
              background: active ? `${char.themeColor}10` : 'var(--bg-card)',
              border: `1.5px solid ${active ? char.themeColor : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
              border: `2px solid ${char.themeColor}`,
            }}>
              <img src={char.portrait} alt={char.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: active ? char.themeColor : 'var(--text-primary)' }}>
              {char.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              好感 {affection}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── CharacterDossier (full-screen slide-in) ─────────────

function CharacterDossier({
  charId, onClose,
}: {
  charId: string | null
  onClose: () => void
}) {
  const characterStats = useGameStore((s) => s.characterStats)
  const char = charId ? CHARACTERS[charId] : null
  if (!char) return null

  const stats = characterStats[charId!]
  const level = getAffectionLevel(stats?.affection ?? 0)

  return (
    <AnimatePresence>
      <motion.div
        className="lz-dossier-overlay"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      >
        {/* Portrait */}
        <div className="lz-dossier-portrait">
          <img src={char.portrait} alt={char.name} />
          <div className="lz-dossier-gradient" />
          <button className="lz-dossier-close" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="lz-dossier-content">
          <div className="lz-dossier-name">{char.name}</div>
          <div className="lz-dossier-subtitle">{char.title} · {char.age}岁 · {level.name}</div>
          <div className="lz-dossier-desc">{char.shortDesc}</div>

          {/* Stat bars */}
          {stats && (
            <div className="lz-dossier-stats">
              {STAT_METAS.map((meta) => {
                const val = stats[meta.key] ?? 0
                return (
                  <div key={meta.key} className="lz-dossier-stat-row">
                    <span className="lz-dossier-stat-label">{meta.icon} {meta.label}</span>
                    <div className="lz-dossier-stat-track">
                      <div className="lz-dossier-stat-fill"
                        style={{ width: `${Math.min(val, 100)}%`, background: meta.color }} />
                    </div>
                    <span className="lz-dossier-stat-val" style={{ color: meta.color }}>{val}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tags */}
          <div className="lz-dossier-tags">
            <span className="lz-dossier-tag">{char.gender === 'female' ? '♀ 女' : '♂ 男'}</span>
            {char.tags.map((tag) => (
              <span key={tag} className="lz-dossier-tag">{tag}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ══════════════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════════════

export default function TabCharacter() {
  const selectCharacter = useGameStore((s) => s.selectCharacter)
  const [dossierChar, setDossierChar] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    selectCharacter(id)
  }

  return (
    <div className="lz-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      <PortraitHero />
      <StatBars />

      <div style={{ padding: '12px 16px 8px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        关系网络
      </div>
      <RelationGraph onSelect={handleSelect} />

      <div style={{ padding: '4px 16px 8px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        嘉宾列表
      </div>
      <CharacterGrid onSelect={(id) => setDossierChar(id)} />

      {/* Dossier overlay */}
      {dossierChar && (
        <CharacterDossier
          charId={dossierChar}
          onClose={() => setDossierChar(null)}
        />
      )}
    </div>
  )
}
