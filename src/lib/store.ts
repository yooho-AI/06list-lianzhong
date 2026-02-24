/**
 * [INPUT]: 依赖 zustand, immer, @/lib/stream, @/lib/analytics, @/lib/data
 * [OUTPUT]: 对外提供 useGameStore
 * [POS]: 恋综模拟器状态管理中枢，双模式逻辑，驱动整个游戏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { streamChat, chat } from '@/lib/stream'
import { trackGameStart, trackGameContinue, trackTimeAdvance, trackModeSelect, trackChapterEnter } from '@/lib/analytics'
import {
  type PlayMode, type CharacterStats, type Message,
  CHARACTERS, SCENES, ITEMS, PERIODS, CHAPTERS,
  MAX_DAYS, MAX_ACTION_POINTS,
  getAffectionLevel, getAvailableCharacters, getCurrentChapter, getDayEvents,
  STORY_INFO,
} from '@/lib/data'

// ============================================================
// Store 类型
// ============================================================

interface GameState {
  gameStarted: boolean
  playMode: PlayMode
  currentDay: number
  currentPeriodIndex: number
  actionPoints: number
  currentScene: string
  currentCharacter: string | null
  characterStats: Record<string, CharacterStats>
  currentChapter: number
  triggeredEvents: string[]
  inventory: Record<string, number>
  dailyItemUsage: Record<string, number>
  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string
  endingType: string | null
  activePanel: 'inventory' | 'relations' | null
}

interface GameActions {
  selectPlayMode: (mode: PlayMode) => void
  initGame: () => void
  selectCharacter: (id: string | null) => void
  selectScene: (id: string) => void
  togglePanel: (panel: 'inventory' | 'relations') => void
  closePanel: () => void
  sendMessage: (text: string) => Promise<void>
  advanceTime: () => void
  useItem: (itemId: string) => void
  checkEnding: () => void
  addSystemMessage: (content: string) => void
  resetGame: () => void
  saveGame: () => void
  loadGame: () => boolean
  hasSave: () => boolean
  clearSave: () => void
}

type GameStore = GameState & GameActions

// ============================================================
// 工具
// ============================================================

let messageCounter = 0
function makeId() {
  return `msg-${Date.now()}-${++messageCounter}`
}

const SAVE_KEY = 'lianzhong-save-v1'

function buildInitialStats(): Record<string, CharacterStats> {
  return Object.fromEntries(
    Object.entries(CHARACTERS).map(([id, char]) => [id, { ...char.initialStats }])
  )
}

// ============================================================
// 数值解析器
// ============================================================

function parseStatChanges(content: string): Array<{ charId: string; stat: keyof CharacterStats; delta: number }> {
  const changes: Array<{ charId: string; stat: keyof CharacterStats; delta: number }> = []

  const nameToId: Record<string, string> = {}
  for (const [id, char] of Object.entries(CHARACTERS)) {
    nameToId[char.name] = id
  }

  const statMap: Record<string, keyof CharacterStats> = {
    '好感': 'affection', '好感度': 'affection',
    '嫉妒': 'jealousy', '嫉妒值': 'jealousy',
    '厌恶': 'disgust', '厌恶值': 'disgust',
    '声望': 'reputation', '声望值': 'reputation',
  }

  const regex = /[【\[]([^\]】]+)[】\]]\s*(\S+?)([+-])(\d+)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const charId = nameToId[match[1]]
    const stat = statMap[match[2]]
    if (charId && stat) {
      const delta = parseInt(match[4]) * (match[3] === '+' ? 1 : -1)
      changes.push({ charId, stat, delta })
    }
  }
  return changes
}

// ============================================================
// System Prompt 构建
// ============================================================

function buildSystemPrompt(state: GameState, char: ReturnType<typeof CHARACTERS[string]> | null): string {
  const period = PERIODS[state.currentPeriodIndex]
  const scene = SCENES[state.currentScene]
  const chapter = getCurrentChapter(state.currentDay)
  const availableChars = getAvailableCharacters(state.currentDay)

  /* 所有可见角色数值摘要 */
  const allStats = Object.entries(availableChars)
    .map(([id, c]) => {
      const s = state.characterStats[id]
      const lv = getAffectionLevel(s?.affection ?? 0)
      return `${c.name}(${c.gender === 'female' ? '女' : '男'}): 好感${s?.affection ?? 0} 嫉妒${s?.jealousy ?? 0} 厌恶${s?.disgust ?? 0} 声望${s?.reputation ?? 50}（${lv.name}）`
    })
    .join('\n')

  /* 模式上下文 */
  const modeContext = state.playMode === 'liumei'
    ? `## 玩家身份
玩家扮演刘枚（52岁退休舞蹈教师），以第一人称视角参与恋综。
玩家的目标是在 15 天合宿中找到真爱，与心动的男嘉宾配对成功。
其他女嘉宾是竞争对手也是朋友，需要处理好姐妹关系。
男嘉宾们各有特点，玩家需要通过互动来选择最心仪的对象。`
    : `## 玩家身份
玩家是一位空降嘉宾（性别不限），中途加入恋综合宿。
作为后来者，玩家需要在既有关系格局中找到自己的位置。
所有 10 位嘉宾（5男5女）都可以成为玩家的互动对象。
玩家需要提升声望值来获得其他嘉宾的认可。`

  let prompt = `你是恋爱综艺模拟游戏《黄昏时分说爱你》的 AI 叙述者兼导演。

## 节目背景
大理洱海畔的合宿别墅，十位 50+ 熟龄嘉宾参加为期 15 天的恋爱综艺节目。
这不是年轻人的心动，而是经历过人生风雨的人们，重新鼓起勇气去爱的故事。
每个人都带着过去的伤痕和对未来的期待，在这片苍山洱海间寻找迟来的爱情。

${modeContext}

## 叙述风格
- 综艺恋综风格：轻松幽默有戏剧张力，像在看一档真人秀
- 用第三人称描写场景和旁白，营造"镜头感"和"画面感"
- 角色对话用【角色名】前缀标记，动作用（）包裹
- 对话用中文双引号""
- 偶尔加入"综艺画外音"或"弹幕风格"的旁白增加趣味
- 50+ 的角色说话要符合年龄——成熟、有阅历、不矫情
- 数值变化用【角色名 好感度+5】格式标注
- 每次回复末尾必须输出当前状态，格式：
  第X/${MAX_DAYS}天 ${period?.name || '清晨'} 行动力X/${MAX_ACTION_POINTS}
  角色名 好感X 嫉妒X 厌恶X 声望X | ...（列出所有可见角色）

## 当前章节
第${chapter.id}章「${chapter.name}」(Day ${chapter.dayRange[0]}-${chapter.dayRange[1]})
${chapter.description}
章节目标: ${chapter.objectives.join('、')}
叙事氛围: ${chapter.atmosphere}

## NPC 行为准则
- 好感 0-29: 礼貌但保持距离，不会主动找玩家
- 好感 30-59: 开始关注玩家，偶尔主动搭话，态度友善
- 好感 60-79: 明显的好感信号，会吃醋，约会时更主动
- 好感 80-100: 心意相通，深情流露，可能主动告白
- 嫉妒 > 40: 说话带刺，追问玩家和其他人的关系
- 厌恶 > 40: 冷淡回避，言语中有攻击性
- 声望 > 60: 其他嘉宾在背后夸奖玩家
- 声望 < 30: 被孤立，难以获得约会机会`

  if (char) {
    const stats = state.characterStats[char.id]
    const level = getAffectionLevel(stats?.affection ?? 0)
    prompt += `\n\n## 当前互动角色
- 姓名：${char.name}（${char.title}，${char.age}岁，${char.gender === 'female' ? '女' : '男'}）
- 性格：${char.personality}
- 简介：${char.description}
- 说话风格：${char.speakingStyle}
- 行为模式：${char.behaviorPatterns}
- 雷点：${char.triggerPoints.join('、')}
- 当前关系：${level.name}（好感${stats?.affection} 嫉妒${stats?.jealousy} 厌恶${stats?.disgust} 声望${stats?.reputation}）
- 隐藏秘密：${char.secret}（好感≥60 且时机合适时才可能透露）`
  }

  prompt += `\n\n## 当前状态
- 时间：第 ${state.currentDay}/${MAX_DAYS} 天 · ${period?.name}
- 行动力：${state.actionPoints}/${MAX_ACTION_POINTS}
- 场景：${scene?.icon} ${scene?.name} — ${scene?.description}
- 场景氛围：${scene?.atmosphere}

## 所有嘉宾当前数值（已入住的）
${allStats}`

  return prompt
}

// ============================================================
// Store
// ============================================================

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    // --- 初始状态 ---
    gameStarted: false,
    playMode: 'liumei' as PlayMode,
    currentDay: 1,
    currentPeriodIndex: 0,
    actionPoints: MAX_ACTION_POINTS,
    currentScene: 'living-room',
    currentCharacter: null,
    characterStats: buildInitialStats(),
    currentChapter: 1,
    triggeredEvents: [],
    inventory: {},
    dailyItemUsage: {},
    messages: [],
    historySummary: '',
    isTyping: false,
    streamingContent: '',
    endingType: null,
    activePanel: null,

    // --- 操作 ---
    selectPlayMode: (mode) => {
      set((s) => { s.playMode = mode })
      trackModeSelect(mode)
    },

    initGame: () => {
      const mode = get().playMode
      set((s) => {
        s.gameStarted = true
        s.currentDay = 1
        s.currentPeriodIndex = 0
        s.actionPoints = MAX_ACTION_POINTS
        s.currentScene = 'living-room'
        s.currentCharacter = null
        s.characterStats = buildInitialStats()
        s.currentChapter = 1
        s.triggeredEvents = []
        s.inventory = {}
        s.dailyItemUsage = {}
        s.messages = []
        s.historySummary = ''
        s.endingType = null
        s.activePanel = null
        s.streamingContent = ''
      })
      trackGameStart()
      trackModeSelect(mode)
    },

    selectCharacter: (id) => {
      set((s) => { s.currentCharacter = id })
    },

    selectScene: (id) => {
      set((s) => {
        s.currentScene = id
        s.currentCharacter = null
      })
      const scene = SCENES[id]
      if (scene) {
        get().addSystemMessage(`你来到了${scene.icon} ${scene.name}。${scene.description}`)
      }
    },

    togglePanel: (panel) => {
      set((s) => {
        s.activePanel = s.activePanel === panel ? null : panel
      })
    },

    closePanel: () => {
      set((s) => { s.activePanel = null })
    },

    sendMessage: async (text: string) => {
      const state = get()
      const char = state.currentCharacter ? CHARACTERS[state.currentCharacter] : null

      set((s) => {
        s.messages.push({ id: makeId(), role: 'user', content: text, timestamp: Date.now() })
        s.isTyping = true
        s.streamingContent = ''
      })

      try {
        // 上下文压缩
        let historySummary = state.historySummary
        let recentMessages = state.messages.slice(-20)

        if (state.messages.length > 15 && !state.historySummary) {
          const oldMessages = state.messages.slice(0, -10)
          const summaryText = oldMessages
            .map((m) => `[${m.role}]: ${m.content.slice(0, 200)}`)
            .join('\n')

          try {
            historySummary = await chat([{
              role: 'user',
              content: `请用200字以内概括以下恋综模拟游戏的对话历史，保留关键剧情、角色互动和数值变化：\n\n${summaryText}`,
            }])
            set((s) => { s.historySummary = historySummary })
            recentMessages = state.messages.slice(-10)
          } catch {
            // 压缩失败，继续
          }
        }

        const systemPrompt = buildSystemPrompt(get(), char)
        const apiMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...(historySummary ? [{ role: 'system' as const, content: `[历史摘要] ${historySummary}` }] : []),
          ...recentMessages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          { role: 'user' as const, content: text },
        ]

        let fullContent = ''

        await streamChat(
          apiMessages,
          (chunk) => {
            fullContent += chunk
            set((s) => { s.streamingContent = fullContent })
          },
          () => {}
        )

        if (!fullContent) {
          const fallbacks = char
            ? [
                `【${char.name}】（看了看你，微笑着）"嗯？你说什么？"`,
                `【${char.name}】（放下手中的茶杯）"今天天气真好呢。"`,
                `【${char.name}】（抬起头望向远处的洱海）"你也觉得这里很美吧？"`,
              ]
            : [
                '洱海边的微风轻轻吹过，带来阵阵花香。',
                '远处传来嘉宾们的笑声，合宿别墅里总是热热闹闹的。',
                '苍山上的云在慢慢变幻形状，阳光洒在露台上。',
              ]
          fullContent = fallbacks[Math.floor(Math.random() * fallbacks.length)]
        }

        // 解析数值变化
        const changes = parseStatChanges(fullContent)
        set((s) => {
          for (const c of changes) {
            const stats = s.characterStats[c.charId]
            if (stats) {
              stats[c.stat] = Math.max(0, Math.min(100, stats[c.stat] + c.delta))
            }
          }
        })

        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'assistant',
            content: fullContent,
            character: state.currentCharacter ?? undefined,
            timestamp: Date.now(),
          })
          s.isTyping = false
          s.streamingContent = ''
        })

        // 自动存档
        get().saveGame()
      } catch {
        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'assistant',
            content: char
              ? `【${char.name}】（似乎在想什么）"抱歉，我刚才走神了。你再说一遍？"`
              : '微风拂过洱海面，一切都很安静。',
            character: state.currentCharacter ?? undefined,
            timestamp: Date.now(),
          })
          s.isTyping = false
          s.streamingContent = ''
        })
      }
    },

    advanceTime: () => {
      set((s) => {
        s.currentPeriodIndex++
        if (s.currentPeriodIndex >= PERIODS.length) {
          s.currentPeriodIndex = 0
          s.currentDay++
          s.actionPoints = MAX_ACTION_POINTS
          s.dailyItemUsage = {}
          // 每日衰减
          for (const stats of Object.values(s.characterStats)) {
            stats.jealousy = Math.max(0, stats.jealousy - 3)
            stats.disgust = Math.max(0, stats.disgust - 5)
          }
        }

        // 章节推进
        const newChapter = getCurrentChapter(s.currentDay)
        if (newChapter.id !== s.currentChapter) {
          s.currentChapter = newChapter.id
        }
      })

      const state = get()
      const period = PERIODS[state.currentPeriodIndex]
      trackTimeAdvance(state.currentDay, period.name)

      // 章节推进消息
      const chapter = getCurrentChapter(state.currentDay)
      if (chapter.id !== get().currentChapter) {
        trackChapterEnter(chapter.id)
      }

      get().addSystemMessage(`时间来到了第 ${state.currentDay} 天 · ${period.name}`)

      // 检查强制事件
      const events = getDayEvents(state.currentDay, state.triggeredEvents)
      for (const event of events) {
        if (event.triggerPeriod === undefined || event.triggerPeriod === state.currentPeriodIndex) {
          set((s) => { s.triggeredEvents.push(event.id) })
          get().addSystemMessage(`🎬 【${event.name}】${event.description}`)
        }
      }

      // 结局检查
      if (state.currentDay >= MAX_DAYS && state.currentPeriodIndex === PERIODS.length - 1) {
        get().checkEnding()
      }
    },

    useItem: (itemId: string) => {
      const state = get()
      const item = ITEMS[itemId]
      if (!item) return

      // 每日限制检查
      if (item.dailyLimit) {
        const used = state.dailyItemUsage[itemId] ?? 0
        if (used >= item.dailyLimit) {
          get().addSystemMessage(`${item.icon} ${item.name} 今日使用次数已用完。`)
          return
        }
      }

      // 需要目标角色
      if (item.requiresTarget && !state.currentCharacter) {
        get().addSystemMessage('请先选择一个嘉宾再使用道具。')
        return
      }

      // 消耗道具（gift 类型需要背包中有）
      if (item.type === 'gift') {
        const count = state.inventory[itemId] ?? 0
        if (count <= 0) {
          get().addSystemMessage(`你没有 ${item.name} 了。`)
          return
        }
        set((s) => { s.inventory[itemId] = Math.max(0, (s.inventory[itemId] ?? 0) - 1) })
      }

      // 记录每日使用次数
      if (item.dailyLimit) {
        set((s) => { s.dailyItemUsage[itemId] = (s.dailyItemUsage[itemId] ?? 0) + 1 })
      }

      // 应用效果
      if (item.effects && state.currentCharacter) {
        const eff = item.effects[state.currentCharacter] ?? item.effects['_default']
        if (eff) {
          set((s) => {
            const stats = s.characterStats[state.currentCharacter!]
            if (stats) {
              if (eff.affection) stats.affection = Math.max(0, Math.min(100, stats.affection + eff.affection))
              if (eff.jealousy) stats.jealousy = Math.max(0, Math.min(100, stats.jealousy + eff.jealousy))
              if (eff.disgust) stats.disgust = Math.max(0, Math.min(100, stats.disgust + eff.disgust))
              if (eff.reputation) stats.reputation = Math.max(0, Math.min(100, stats.reputation + eff.reputation))
            }
          })
        }
        const charName = CHARACTERS[state.currentCharacter!]?.name
        get().addSystemMessage(`你把${item.icon} ${item.name}送给了${charName}。`)
      } else if (item.type === 'special') {
        get().addSystemMessage(`使用了${item.icon} ${item.name}。`)
      }
    },

    checkEnding: () => {
      const state = get()
      const liumeiStats = state.characterStats['liumei']

      if (state.playMode === 'liumei') {
        if (liumeiStats) {
          // 刘枚线用其他角色对玩家的好感来判定
          // 找好感度最高的男嘉宾
          const maleChars = Object.entries(state.characterStats)
            .filter(([id]) => CHARACTERS[id]?.gender === 'male')
          const best = maleChars.reduce((a, b) => a[1].affection > b[1].affection ? a : b)

          if (best[1].affection >= 80 && best[1].disgust < 20) {
            set((s) => { s.endingType = 'liumei-he' })
          } else if (best[1].affection >= 50 && best[1].disgust < 40) {
            set((s) => { s.endingType = 'liumei-ne' })
          } else {
            set((s) => { s.endingType = 'liumei-be' })
          }
        }
      } else {
        // 空降线
        const allStats = Object.entries(state.characterStats)
        const best = allStats.reduce((a, b) => a[1].affection > b[1].affection ? a : b)
        const avgReputation = allStats.reduce((sum, [, s]) => sum + s.reputation, 0) / allStats.length

        if (best[1].affection >= 80 && avgReputation >= 60) {
          set((s) => { s.endingType = 'newcomer-he' })
        } else if (best[1].affection >= 50) {
          set((s) => { s.endingType = 'newcomer-ne' })
        } else {
          set((s) => { s.endingType = 'newcomer-be' })
        }
      }
    },

    addSystemMessage: (content: string) => {
      set((s) => {
        s.messages.push({ id: makeId(), role: 'system', content, timestamp: Date.now() })
      })
    },

    resetGame: () => {
      set((s) => {
        s.gameStarted = false
        s.messages = []
        s.historySummary = ''
        s.streamingContent = ''
        s.endingType = null
      })
      get().clearSave()
    },

    // --- 存档系统 ---
    saveGame: () => {
      const s = get()
      const data = {
        version: 1,
        playMode: s.playMode,
        currentDay: s.currentDay,
        currentPeriodIndex: s.currentPeriodIndex,
        actionPoints: s.actionPoints,
        currentScene: s.currentScene,
        currentCharacter: s.currentCharacter,
        characterStats: s.characterStats,
        currentChapter: s.currentChapter,
        triggeredEvents: s.triggeredEvents,
        inventory: s.inventory,
        dailyItemUsage: s.dailyItemUsage,
        messages: s.messages.slice(-30),
        historySummary: s.historySummary,
        endingType: s.endingType,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    },

    loadGame: () => {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return false
        const data = JSON.parse(raw)
        if (data.version !== 1) return false

        set((s) => {
          s.gameStarted = true
          s.playMode = data.playMode || 'liumei'
          s.currentDay = data.currentDay
          s.currentPeriodIndex = data.currentPeriodIndex
          s.actionPoints = data.actionPoints
          s.currentScene = data.currentScene
          s.currentCharacter = data.currentCharacter
          s.characterStats = data.characterStats
          s.currentChapter = data.currentChapter || 1
          s.triggeredEvents = data.triggeredEvents || []
          s.inventory = data.inventory
          s.dailyItemUsage = data.dailyItemUsage || {}
          s.messages = data.messages
          s.historySummary = data.historySummary || ''
          s.endingType = data.endingType || null
        })
        trackGameContinue()
        return true
      } catch {
        return false
      }
    },

    hasSave: () => {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return false
        return JSON.parse(raw).version === 1
      } catch {
        return false
      }
    },

    clearSave: () => {
      localStorage.removeItem(SAVE_KEY)
    },
  }))
)

// 导出 data.ts 的所有内容，让其他模块可以直接从 store 导入
export {
  CHARACTERS, SCENES, ITEMS, PERIODS, CHAPTERS,
  MAX_DAYS, MAX_ACTION_POINTS, STORY_INFO,
  FORCED_EVENTS, ENDINGS,
  getAffectionLevel, getMood, getRelationLabel,
  getAvailableCharacters, getCurrentChapter,
} from '@/lib/data'

export type { PlayMode, Character, CharacterStats, Scene, GameItem, Chapter, ForcedEvent, Ending, TimePeriod, Message } from '@/lib/data'
