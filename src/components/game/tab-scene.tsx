/**
 * [INPUT]: 依赖 store.ts 状态（场景/角色/解锁状态）
 * [OUTPUT]: 对外提供 TabScene 组件
 * [POS]: 场景Tab：9:16大图 + 当前场景角色标签 + 地点列表(locked/unlocked/current)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  useGameStore,
  SCENES,
  getAvailableCharacters,
} from '@/lib/store'

// ── SceneHero ───────────────────────────────────────────

function SceneHero() {
  const currentScene = useGameStore((s) => s.currentScene)
  const scene = SCENES[currentScene]
  if (!scene) return null

  return (
    <div className="lz-scene-hero">
      <img src={scene.background} alt={scene.name} />
      <div className="scene-overlay">
        <div className="scene-name">{scene.icon} {scene.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {scene.atmosphere}
        </div>
      </div>
    </div>
  )
}

// ── RelatedCharacters ───────────────────────────────────

function RelatedCharacters() {
  const currentDay = useGameStore((s) => s.currentDay)
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const selectCharacter = useGameStore((s) => s.selectCharacter)
  const setActiveTab = useGameStore((s) => s.setActiveTab)

  const available = getAvailableCharacters(currentDay)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 12px', marginBottom: 16 }}>
      {Object.entries(available).map(([id, char]) => (
        <button
          key={id}
          className="lz-char-tag"
          style={id === currentCharacter ? { borderColor: char.themeColor, background: `${char.themeColor}10` } : undefined}
          onClick={() => {
            selectCharacter(id)
            setActiveTab('character')
          }}
        >
          <img src={char.portrait} alt={char.name} style={{ borderColor: char.themeColor }} />
          <span>{char.name}</span>
        </button>
      ))}
    </div>
  )
}

// ── LocationList ────────────────────────────────────────

function LocationList() {
  const currentScene = useGameStore((s) => s.currentScene)
  const unlockedScenes = useGameStore((s) => s.unlockedScenes)
  const selectScene = useGameStore((s) => s.selectScene)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 12px' }}>
      {Object.entries(SCENES).map(([sid, scene]) => {
        const locked = !unlockedScenes.includes(sid)
        const current = sid === currentScene
        return (
          <button
            key={sid}
            className={`lz-location-tag ${current ? 'lz-location-active' : ''}`}
            disabled={locked}
            onClick={() => { if (!locked && !current) selectScene(sid) }}
            style={locked ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            <span style={{ fontSize: 20 }}>{locked ? '🔒' : scene.icon}</span>
            <div>
              <div className="loc-name">{scene.name}</div>
              <div className="loc-desc">{scene.atmosphere}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════════════

export default function TabScene() {
  return (
    <div className="lz-scrollbar" style={{ height: '100%', overflowY: 'auto', padding: '12px 0' }}>
      <SceneHero />
      <RelatedCharacters />
      <LocationList />
      <div style={{ height: 16 }} />
    </div>
  )
}
