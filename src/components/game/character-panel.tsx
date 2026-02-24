/**
 * [INPUT]: 依赖 @/lib/store 的 useGameStore, CHARACTERS, SCENES, getAvailableCharacters, getAffectionLevel, getMood
 * [OUTPUT]: 对外提供 LeftPanel 组件（场景卡片 + 角色立绘 + 简介 + 角色选择列表）
 * [POS]: 恋综模拟器 PC 端左侧面板，10角色2x5网格，4数值条
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useGameStore, CHARACTERS, SCENES, getAvailableCharacters, getAffectionLevel, getMood } from '@/lib/store'

// ============================================================
// 场景卡片 — 16:9
// ============================================================

function SceneCard() {
  const currentScene = useGameStore((s) => s.currentScene)
  const scene = SCENES[currentScene]

  return (
    <div className="lz-card lz-scene-card">
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
      ) : (
        <div className="lz-placeholder" style={{ background: 'linear-gradient(135deg, #fef7ff 0%, #fce7f3 100%)' }}>
          <span className="lz-placeholder-icon">🏠</span>
        </div>
      )}
      <div className="lz-scene-tag">
        <span style={{ fontSize: 14 }}>{scene?.icon || '📍'}</span>
        {scene?.name || '客厅'}
      </div>
    </div>
  )
}

// ============================================================
// 角色立绘卡片 — 3:4
// ============================================================

function PortraitCard() {
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const char = currentCharacter ? CHARACTERS[currentCharacter] : null

  return (
    <div className="lz-card lz-portrait-card">
      {char?.video ? (
        <video
          key={char.video}
          src={char.video}
          poster={char.fullImage}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      ) : char ? (
        <img src={char.fullImage} alt={char.name} />
      ) : (
        <div className="lz-placeholder" style={{ paddingBottom: 40 }}>
          <span className="lz-placeholder-icon">👤</span>
          <span className="lz-placeholder-text">选择角色开始</span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 角色简介 + 四维数值条
// ============================================================

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 24, textAlign: 'right', flexShrink: 0 }}>
        {value}
      </span>
    </div>
  )
}

function InfoCard() {
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const characterStats = useGameStore((s) => s.characterStats)
  const char = currentCharacter ? CHARACTERS[currentCharacter] : null

  if (!char) return null

  const stats = characterStats[char.id]
  const level = getAffectionLevel(stats?.affection ?? 0)
  const mood = getMood(stats ?? { affection: 0, jealousy: 0, disgust: 0, reputation: 50 })

  return (
    <div className="lz-card lz-info-card">
      <div className="lz-info-title">
        {char.gender === 'female' ? '🚺' : '🚹'} {char.name}
        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
          {mood.emoji} {level.name}
        </span>
      </div>
      <div className="lz-info-meta">
        <span>{char.age}岁</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>{char.title}</span>
      </div>
      <div className="lz-info-desc">{char.description}</div>

      {/* 四维数值条 */}
      {stats && (
        <div style={{ marginTop: 10 }}>
          <StatBar label="好感" value={stats.affection} color="#d946ef" />
          <StatBar label="嫉妒" value={stats.jealousy} color="#f97316" />
          <StatBar label="厌恶" value={stats.disgust} color="#ef4444" />
          <StatBar label="声望" value={stats.reputation} color="#3b82f6" />
        </div>
      )}
    </div>
  )
}

// ============================================================
// 角色选择列表 — 2x5 可滚动
// ============================================================

function CharacterList() {
  const currentCharacter = useGameStore((s) => s.currentCharacter)
  const currentDay = useGameStore((s) => s.currentDay)
  const selectCharacter = useGameStore((s) => s.selectCharacter)

  const available = getAvailableCharacters(currentDay)

  return (
    <div className="lz-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>角色</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {Object.keys(available).length}人已入住
        </span>
      </div>
      <div className="lz-char-list" style={{ flex: 1, alignContent: 'start' }}>
        {Object.entries(available).map(([charId, char]) => (
          <button
            key={charId}
            className={`lz-char-item ${currentCharacter === charId ? 'active' : ''}`}
            onClick={() => selectCharacter(currentCharacter === charId ? null : charId)}
          >
            <span style={{ fontSize: 10, marginRight: -4 }}>
              {char.gender === 'female' ? '🚺' : '🚹'}
            </span>
            {char.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 左侧面板主组件
// ============================================================

export default function LeftPanel() {
  return (
    <div
      className="lz-scrollbar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 0 12px 12px',
        height: '100%',
        background: 'var(--bg-secondary)',
        overflowY: 'auto',
      }}
    >
      <SceneCard />
      <PortraitCard />
      <InfoCard />
      <CharacterList />
    </div>
  )
}
