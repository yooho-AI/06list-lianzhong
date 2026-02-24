/**
 * [INPUT]: 依赖 @/lib/store 的 useGameStore, ITEMS, CHARACTERS, getAvailableCharacters, getAffectionLevel, getRelationLabel
 * [OUTPUT]: 对外提供 RightPanel 组件（导航栏 + 背包面板 + 关系总览面板）
 * [POS]: 恋综模拟器 PC 端右侧面板，2个导航图标
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useGameStore, ITEMS, getAvailableCharacters, getAffectionLevel, getRelationLabel } from '@/lib/store'

// ============================================================
// 背包面板
// ============================================================

function InventoryPanel() {
  const inventory = useGameStore((s) => s.inventory)
  const useItem = useGameStore((s) => s.useItem)
  const closePanel = useGameStore((s) => s.closePanel)

  const hasItems = Object.entries(inventory).some(([, count]) => count > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>背包</span>
        <button
          onClick={closePanel}
          style={{
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', borderRadius: 4,
          }}
        >
          ×
        </button>
      </div>
      <div className="lz-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {hasItems ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(inventory).map(([itemId, count]) => {
              if (count <= 0) return null
              const item = ITEMS[itemId]
              if (!item) return null
              return (
                <div key={itemId} className="lz-item-row" onClick={() => useItem(itemId)} style={{ cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {item.name}
                    </span>
                    <span
                      style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.description}
                    </span>
                  </div>
                  {count > 1 && (
                    <span
                      style={{
                        fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                        background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 100,
                      }}
                    >
                      ×{count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="lz-placeholder" style={{ height: 150 }}>
            <span style={{ fontSize: 32, opacity: 0.5 }}>🎒</span>
            <span className="lz-placeholder-text">背包空空如也</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 关系总览面板
// ============================================================

function RelationsPanel() {
  const currentDay = useGameStore((s) => s.currentDay)
  const characterStats = useGameStore((s) => s.characterStats)
  const closePanel = useGameStore((s) => s.closePanel)

  const available = getAvailableCharacters(currentDay)

  /* 按好感度降序排列 */
  const sorted = Object.entries(available).sort(([aId], [bId]) => {
    const aAff = characterStats[aId]?.affection ?? 0
    const bAff = characterStats[bId]?.affection ?? 0
    return bAff - aAff
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>关系总览</span>
        <button
          onClick={closePanel}
          style={{
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', borderRadius: 4,
          }}
        >
          ×
        </button>
      </div>
      <div className="lz-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {sorted.map(([charId, char]) => {
          const stats = characterStats[charId]
          const level = getAffectionLevel(stats?.affection ?? 0)
          const relation = getRelationLabel(stats ?? { affection: 0, jealousy: 0, disgust: 0, reputation: 50 })

          return (
            <div
              key={charId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* 头像圆点 */}
              <div
                style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  border: `2px solid ${char.themeColor}`,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <img
                  src={char.fullImage}
                  alt={char.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
              </div>

              {/* 名称 + 标签 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: char.themeColor }}>
                    {char.gender === 'female' ? '🚺' : '🚹'} {char.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {level.name}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {relation}
                </div>
              </div>

              {/* 数值概览 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: '#d946ef' }}>❤{stats?.affection ?? 0}</span>
                <span style={{ fontSize: 10, color: '#f97316' }}>😒{stats?.jealousy ?? 0}</span>
                <span style={{ fontSize: 10, color: '#ef4444' }}>😤{stats?.disgust ?? 0}</span>
                <span style={{ fontSize: 10, color: '#3b82f6' }}>⭐{stats?.reputation ?? 50}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// 右侧面板主组件
// ============================================================

export default function RightPanel() {
  const activePanel = useGameStore((s) => s.activePanel)
  const togglePanel = useGameStore((s) => s.togglePanel)
  const inventory = useGameStore((s) => s.inventory)

  const inventoryCount = Object.values(inventory).reduce((sum, n) => sum + (n > 0 ? n : 0), 0)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        padding: '12px 0 12px 12px',
        background: 'var(--bg-secondary)',
      }}
    >
      {/* 背包面板 */}
      {activePanel === 'inventory' && (
        <div className="lz-detail-panel">
          <div className="lz-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <InventoryPanel />
          </div>
        </div>
      )}

      {/* 关系面板 */}
      {activePanel === 'relations' && (
        <div className="lz-detail-panel">
          <div className="lz-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <RelationsPanel />
          </div>
        </div>
      )}

      {/* 导航栏 */}
      <div className="lz-nav-bar" style={{ marginLeft: activePanel ? 8 : 0 }}>
        <button
          className={`lz-nav-btn ${activePanel === 'inventory' ? 'active' : ''}`}
          onClick={() => togglePanel('inventory')}
          style={{ position: 'relative' }}
        >
          <span className="lz-nav-icon">🎒</span>
          <span className="lz-nav-label">背包</span>
          {inventoryCount > 0 && <span className="lz-nav-badge">{inventoryCount}</span>}
        </button>

        <button
          className={`lz-nav-btn ${activePanel === 'relations' ? 'active' : ''}`}
          onClick={() => togglePanel('relations')}
          style={{ position: 'relative' }}
        >
          <span className="lz-nav-icon">💕</span>
          <span className="lz-nav-label">关系</span>
        </button>
      </div>
    </div>
  )
}
