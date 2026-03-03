/**
 * [INPUT]: 依赖 zustand, immer, @/lib/stream, @/lib/analytics, @/lib/data, @/lib/parser, script.md
 * [OUTPUT]: 对外提供 useGameStore + 重导出 data/parser
 * [POS]: 恋综模拟器状态管理中枢，双模式逻辑，富消息插入，选项提取，剧本直通
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { streamChat, chat } from '@/lib/stream'
import {
  trackGameStart, trackGameContinue, trackTimeAdvance,
  trackModeSelect, trackChapterEnter, trackEndingReached,
  trackSceneUnlock,
} from '@/lib/analytics'
import { extractChoices } from '@/lib/parser'
import {
  type PlayMode, type Character, type CharacterStats, type Message, type StoryRecord,
  CHARACTERS, SCENES, ITEMS, PERIODS, QUICK_ACTIONS, STORY_INFO,
  MAX_DAYS, MAX_ACTION_POINTS,
  getAffectionLevel, getAvailableCharacters, getCurrentChapter, getDayEvents,
} from '@/lib/data'
import GAME_SCRIPT from './script.md?raw'

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
  unlockedScenes: string[]
  inventory: Record<string, number>
  dailyItemUsage: Record<string, number>
  messages: Message[]
  historySummary: string
  isTyping: boolean
  streamingContent: string
  endingType: string | null
  activeTab: 'dialogue' | 'scene' | 'character'
  showDashboard: boolean
  showRecords: boolean
  storyRecords: StoryRecord[]
  choices: string[]
  playerName: string
}

interface GameActions {
  setPlayerInfo: (name: string) => void
  selectPlayMode: (mode: PlayMode) => void
  initGame: () => void
  selectCharacter: (id: string | null) => void
  selectScene: (id: string) => void
  setActiveTab: (tab: 'dialogue' | 'scene' | 'character') => void
  toggleDashboard: () => void
  toggleRecords: () => void
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

const SAVE_KEY = 'lianzhong-save-v2'

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

function buildSystemPrompt(state: GameState, char: Character | null): string {
  const period = PERIODS[state.currentPeriodIndex]
  const scene = SCENES[state.currentScene]
  const chapter = getCurrentChapter(state.currentDay)
  const availableChars = getAvailableCharacters(state.currentDay)

  const allStats = Object.entries(availableChars)
    .map(([id, c]) => {
      const s = state.characterStats[id]
      const lv = getAffectionLevel(s?.affection ?? 0)
      return `${c.name}(${c.gender === 'female' ? '女' : '男'}): 好感${s?.affection ?? 0} 嫉妒${s?.jealousy ?? 0} 厌恶${s?.disgust ?? 0} 声望${s?.reputation ?? 50}（${lv.name}）`
    })
    .join('\n')

  const modeLabel = state.playMode === 'liumei' ? '扮演刘枚' : '空降入局'
  const playerLabel = state.playerName ? `\n玩家名：${state.playerName}` : ''
  const charInfo = char
    ? `\n当前互动角色：${char.name}（${char.title}，${char.age}岁）\n当前关系：${getAffectionLevel(state.characterStats[char.id]?.affection ?? 0).name}（好感${state.characterStats[char.id]?.affection} 嫉妒${state.characterStats[char.id]?.jealousy} 厌恶${state.characterStats[char.id]?.disgust} 声望${state.characterStats[char.id]?.reputation}）`
    : ''

  return `你是《${STORY_INFO.title}》的AI叙述者兼导演。

## 游戏剧本
${GAME_SCRIPT}

## 当前状态
玩家模式：${modeLabel}${playerLabel}
第${state.currentDay}/${MAX_DAYS}天 · ${period.name}
行动力：${state.actionPoints}/${MAX_ACTION_POINTS}
场景：${scene?.name || '客厅'}
第${chapter.id}章「${chapter.name}」
${charInfo}

## 嘉宾数值
${allStats}

## 数值变化标注（必须严格遵守！）
每次回复末尾（选项之前）必须标注本次互动产生的所有数值变化，缺一不可：
- 角色数值变化：【角色名 好感+N】或【角色名 嫉妒+N】或【角色名 厌恶+N】或【角色名 声望+N】（N通常为3-10）
示例：
（叙述内容）
【刘枚 好感+5】【马晴 嫉妒+3】【罗飞 声望+2】
1. 选项一
2. 选项二
规则：
- 每次回复至少产生1个数值变化
- 数值变化必须与当前互动的嘉宾相关
- 好感、嫉妒、厌恶、声望四个维度都可能变化

## 选项要求
每次回复末尾必须给出恰好4个选项，格式：
1. 选项一
2. 选项二
3. 选项三
4. 选项四`
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
    unlockedScenes: ['living-room', 'garden', 'terrace'],
    inventory: {},
    dailyItemUsage: {},
    messages: [],
    historySummary: '',
    isTyping: false,
    streamingContent: '',
    endingType: null,
    activeTab: 'dialogue' as const,
    showDashboard: false,
    showRecords: false,
    storyRecords: [],
    choices: [...QUICK_ACTIONS],
    playerName: '',

    // --- 操作 ---
    setPlayerInfo: (name) => {
      set((s) => { s.playerName = name })
    },

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
        s.unlockedScenes = ['living-room', 'garden', 'terrace']
        s.inventory = {}
        s.dailyItemUsage = {}
        s.messages = []
        s.historySummary = ''
        s.endingType = null
        s.activeTab = 'dialogue'
        s.showDashboard = false
        s.showRecords = false
        s.storyRecords = []
        s.streamingContent = ''
        s.choices = [...QUICK_ACTIONS]
      })
      trackGameStart()
      trackModeSelect(mode)
    },

    selectCharacter: (id) => {
      set((s) => {
        s.currentCharacter = id
        s.activeTab = 'dialogue'
      })
    },

    selectScene: (id) => {
      const prev = get().currentScene
      set((s) => {
        s.currentScene = id
        s.currentCharacter = null
        if (!s.unlockedScenes.includes(id)) {
          s.unlockedScenes.push(id)
          trackSceneUnlock(id)
        }
      })
      const scene = SCENES[id]
      if (scene && id !== prev) {
        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'system',
            content: `来到了${scene.name}`,
            timestamp: Date.now(),
            type: 'scene-transition',
            sceneId: id,
          })
        })
      }
    },

    setActiveTab: (tab) => {
      set((s) => { s.activeTab = tab })
    },

    toggleDashboard: () => {
      set((s) => {
        s.showDashboard = !s.showDashboard
        if (s.showDashboard) s.showRecords = false
      })
    },

    toggleRecords: () => {
      set((s) => {
        s.showRecords = !s.showRecords
        if (s.showRecords) s.showDashboard = false
      })
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
            .filter((m) => !m.type)
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
          ...recentMessages
            .filter((m) => !m.type)
            .map((m) => ({
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

        // 提取选项
        const { cleanContent, choices } = extractChoices(fullContent)

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

        const period = PERIODS[get().currentPeriodIndex]

        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'assistant',
            content: cleanContent || fullContent,
            character: state.currentCharacter ?? undefined,
            timestamp: Date.now(),
          })
          s.isTyping = false
          s.streamingContent = ''
          s.choices = choices.length > 0 ? choices : [...QUICK_ACTIONS]

          // 追加事件记录
          s.storyRecords.push({
            id: makeId(),
            day: s.currentDay,
            period: period.name,
            title: char ? `与${char.name}互动` : '自由探索',
            content: text.slice(0, 50),
          })
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
      const prevDay = get().currentDay

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

      // 跨天时注入日期变更富消息
      if (state.currentDay !== prevDay) {
        const chapter = getCurrentChapter(state.currentDay)
        trackChapterEnter(chapter.id)

        set((s) => {
          s.messages.push({
            id: makeId(),
            role: 'system',
            content: `第${state.currentDay}天 · ${period.name}`,
            timestamp: Date.now(),
            type: 'day-change',
            dayInfo: {
              day: state.currentDay,
              period: period.name,
              chapter: chapter.name,
            },
          })

          s.storyRecords.push({
            id: makeId(),
            day: state.currentDay,
            period: period.name,
            title: `进入第${state.currentDay}天`,
            content: `${chapter.name} · ${period.name}`,
          })

          // 解锁更多场景
          if (state.currentDay >= 3 && !s.unlockedScenes.includes('kitchen')) {
            s.unlockedScenes.push('kitchen')
            trackSceneUnlock('kitchen')
          }
          if (state.currentDay >= 5 && !s.unlockedScenes.includes('old-town')) {
            s.unlockedScenes.push('old-town')
            trackSceneUnlock('old-town')
          }
          if (state.currentDay >= 7 && !s.unlockedScenes.includes('lakeside')) {
            s.unlockedScenes.push('lakeside')
            trackSceneUnlock('lakeside')
          }
          if (state.currentDay >= 2 && !s.unlockedScenes.includes('female-dorm')) {
            s.unlockedScenes.push('female-dorm', 'male-dorm')
          }
        })
      } else {
        get().addSystemMessage(`时间来到了第 ${state.currentDay} 天 · ${period.name}`)
      }

      // 检查强制事件
      const events = getDayEvents(state.currentDay, state.triggeredEvents)
      for (const event of events) {
        if (event.triggerPeriod === undefined || event.triggerPeriod === state.currentPeriodIndex) {
          set((s) => {
            s.triggeredEvents.push(event.id)
            s.storyRecords.push({
              id: makeId(),
              day: state.currentDay,
              period: period.name,
              title: event.name,
              content: `触发事件：${event.name}`,
            })
          })
          get().addSystemMessage(`【${event.name}】`)
        }
      }

      // 结局检查
      if (state.currentDay >= MAX_DAYS && state.currentPeriodIndex === PERIODS.length - 1) {
        get().checkEnding()
      }
    },

    useItem: (itemId: string) => {
      const state = get()
      const item = ITEMS.find((i) => i.id === itemId)
      if (!item) return

      if (item.dailyLimit) {
        const used = state.dailyItemUsage[itemId] ?? 0
        if (used >= item.dailyLimit) {
          get().addSystemMessage(`${item.icon} ${item.name} 今日使用次数已用完。`)
          return
        }
      }

      if (item.requiresTarget && !state.currentCharacter) {
        get().addSystemMessage('请先选择一个嘉宾再使用道具。')
        return
      }

      if (item.type === 'gift') {
        const count = state.inventory[itemId] ?? 0
        if (count <= 0) {
          get().addSystemMessage(`你没有 ${item.name} 了。`)
          return
        }
        set((s) => { s.inventory[itemId] = Math.max(0, (s.inventory[itemId] ?? 0) - 1) })
      }

      if (item.dailyLimit) {
        set((s) => { s.dailyItemUsage[itemId] = (s.dailyItemUsage[itemId] ?? 0) + 1 })
      }

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

      if (state.playMode === 'liumei') {
        const maleChars = Object.entries(state.characterStats)
          .filter(([id]) => CHARACTERS[id]?.gender === 'male')
        const best = maleChars.reduce((a, b) => a[1].affection > b[1].affection ? a : b)

        let endingId: string
        if (best[1].affection >= 80 && best[1].disgust < 20) {
          endingId = 'liumei-he'
        } else if (best[1].affection >= 50 && best[1].disgust < 40) {
          endingId = 'liumei-ne'
        } else {
          endingId = 'liumei-be'
        }
        set((s) => { s.endingType = endingId })
        trackEndingReached(endingId)
      } else {
        const allStats = Object.entries(state.characterStats)
        const best = allStats.reduce((a, b) => a[1].affection > b[1].affection ? a : b)
        const avgReputation = allStats.reduce((sum, [, s]) => sum + s.reputation, 0) / allStats.length

        let endingId: string
        if (best[1].affection >= 80 && avgReputation >= 60) {
          endingId = 'newcomer-he'
        } else if (best[1].affection >= 50) {
          endingId = 'newcomer-ne'
        } else {
          endingId = 'newcomer-be'
        }
        set((s) => { s.endingType = endingId })
        trackEndingReached(endingId)
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
        s.storyRecords = []
        s.choices = [...QUICK_ACTIONS]
        s.playerName = ''
      })
      get().clearSave()
    },

    // --- 存档系统 ---
    saveGame: () => {
      const s = get()
      const data = {
        version: 2,
        playMode: s.playMode,
        currentDay: s.currentDay,
        currentPeriodIndex: s.currentPeriodIndex,
        actionPoints: s.actionPoints,
        currentScene: s.currentScene,
        currentCharacter: s.currentCharacter,
        characterStats: s.characterStats,
        currentChapter: s.currentChapter,
        triggeredEvents: s.triggeredEvents,
        unlockedScenes: s.unlockedScenes,
        inventory: s.inventory,
        dailyItemUsage: s.dailyItemUsage,
        messages: s.messages.slice(-30),
        historySummary: s.historySummary,
        endingType: s.endingType,
        storyRecords: s.storyRecords.slice(-50),
        choices: s.choices,
        playerName: s.playerName,
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    },

    loadGame: () => {
      try {
        const raw = localStorage.getItem(SAVE_KEY)
        if (!raw) return false
        const data = JSON.parse(raw)
        if (data.version !== 2) return false

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
          s.unlockedScenes = data.unlockedScenes || ['living-room', 'garden', 'terrace']
          s.inventory = data.inventory
          s.dailyItemUsage = data.dailyItemUsage || {}
          s.messages = data.messages
          s.historySummary = data.historySummary || ''
          s.endingType = data.endingType || null
          s.storyRecords = data.storyRecords || []
          s.choices = data.choices || [...QUICK_ACTIONS]
          s.playerName = data.playerName || ''
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
        return JSON.parse(raw).version === 2
      } catch {
        return false
      }
    },

    clearSave: () => {
      localStorage.removeItem(SAVE_KEY)
    },
  }))
)

// 导出 data.ts + parser.ts 的所有内容
export {
  CHARACTERS, SCENES, ITEMS, PERIODS, CHAPTERS, QUICK_ACTIONS,
  MAX_DAYS, MAX_ACTION_POINTS, STORY_INFO,
  FORCED_EVENTS, ENDINGS, ENDING_TYPE_MAP, STAT_METAS,
  getAffectionLevel, getRelationLabel,
  getAvailableCharacters, getCurrentChapter,
} from '@/lib/data'

export type {
  PlayMode, Character, CharacterStats, Scene, GameItem,
  Chapter, ForcedEvent, Ending, TimePeriod, Message, StoryRecord, StatMeta,
} from '@/lib/data'

export { parseStoryParagraph, extractChoices } from '@/lib/parser'
