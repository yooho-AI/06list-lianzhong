# components/game/
> L2 | 父级: /CLAUDE.md

恋综模拟器游戏 UI 组件层 — 移动优先唯一布局 + Tab导航 + 三向手势 + 双抽屉。

## 成员清单

```
app-shell.tsx        : 游戏主框架: Header(Day/时段/章节/BGM/菜单/📓/📜) + TabContent(AnimatePresence) + TabBar(5键:手册+3Tab+事件) + 三向手势(右滑左抽屉/左滑右抽屉) + DashboardDrawer + RecordSheet + Toast
dashboard-drawer.tsx : 恋综手帐(左侧滑入): 6段Reorder拖拽排序(扉页+角色轮播+场景缩略图+章节目标+道具格+迷你播放器)，localStorage持久化
tab-dialogue.tsx     : 对话Tab: 富消息路由(LetterCard/SceneTransitionCard/DayCard/NpcBubble+头像/PlayerBubble/SystemBubble/StreamingMessage) + CollapsibleChoices(A/B/C/D) + InventorySheet(背包) + InputArea
tab-scene.tsx        : 场景Tab: SceneHero(9:16大图+渐变遮罩) + RelatedCharacters(头像标签) + LocationList(2列网格,locked/unlocked/current)
tab-character.tsx    : 人物Tab: PortraitHero(9:16立绘) + StatBars(STAT_METAS驱动,4维relation) + RelationGraph(SVG环形,头像节点) + CharacterGrid(3列) + CharacterDossier(全屏右滑入+呼吸动画)
```

## 数据流

```
store.ts (useGameStore)
├── app-shell.tsx ← activeTab, showDashboard, showRecords, storyRecords
├── dashboard-drawer.tsx ← currentDay, currentPeriodIndex, characterStats, unlockedScenes, inventory
├── tab-dialogue.tsx ← messages, isTyping, streamingContent, choices, sendMessage
├── tab-scene.tsx ← currentScene, unlockedScenes, selectScene, selectCharacter
└── tab-character.tsx ← currentCharacter, characterStats, selectCharacter
```

## 关键模式

- **富消息路由**: `msg.type` → SceneTransitionCard / DayCard; `msg.character` → NpcBubble; `msg.role` → PlayerBubble / SystemBubble
- **StatMeta 驱动渲染**: 所有数值条遍历 STAT_METAS[]，零 if/else
- **Phosphor Icons**: 所有 UI 图标用 @phosphor-icons/react，emoji 仅用于内容展示
- **三向手势**: touchStart/touchEnd，dx>60px + dy<1.5x → 判定左/右滑
- **Reorder 拖拽排序**: Framer Motion Reorder.Group + useDragControls，localStorage `lz-dash-order` 持久化

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
