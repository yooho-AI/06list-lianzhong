/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供游戏类型定义 + UI渲染数据常量 + 工具函数
 * [POS]: lib 的 UI 薄层，10嘉宾/8场景/8道具/6章节/强制事件/结局/时段（叙事已移至 script.md）
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// 类型定义
// ============================================================

export type PlayMode = 'liumei' | 'newcomer'

export interface Character {
  id: string
  name: string
  portrait: string
  gender: 'female' | 'male'
  age: number
  title: string
  shortDesc: string
  themeColor: string
  joinDay: number
  initialStats: CharacterStats
  tags: string[]
}

export interface CharacterStats {
  affection: number
  jealousy: number
  disgust: number
  reputation: number
}

export interface StatMeta {
  key: keyof CharacterStats
  label: string
  color: string
  icon: string
  category: 'relation'
}

export const STAT_METAS: StatMeta[] = [
  { key: 'affection', label: '好感', color: '#d946ef', icon: '💗', category: 'relation' },
  { key: 'jealousy', label: '嫉妒', color: '#f97316', icon: '🔥', category: 'relation' },
  { key: 'disgust', label: '厌恶', color: '#ef4444', icon: '💢', category: 'relation' },
  { key: 'reputation', label: '声望', color: '#3b82f6', icon: '⭐', category: 'relation' },
]

export interface Scene {
  id: string
  name: string
  icon: string
  background: string
  atmosphere: string
  tags: string[]
}

export interface GameItem {
  id: string
  name: string
  icon: string
  type: 'daily' | 'gift' | 'special' | 'action' | 'time'
  effects?: Record<string, { affection?: number; jealousy?: number; disgust?: number; reputation?: number }>
  dailyLimit?: number
  requiresTarget?: boolean
}

export interface Chapter {
  id: number
  name: string
  dayRange: [number, number]
  objectives: string[]
}

export interface ForcedEvent {
  id: string
  name: string
  triggerDay: number
  triggerPeriod?: number
}

export interface Ending {
  id: string
  name: string
  type: 'HE' | 'NE' | 'BE'
  route: 'liumei' | 'newcomer'
  description: string
  condition: string
}

export interface TimePeriod {
  index: number
  name: string
  icon: string
  hours: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  character?: string
  timestamp: number
  type?: 'scene-transition' | 'day-change'
  sceneId?: string
  dayInfo?: { day: number; period: string; chapter: string }
}

export interface StoryRecord {
  id: string
  day: number
  period: string
  title: string
  content: string
}

// ============================================================
// 游戏配置
// ============================================================

export const MAX_DAYS = 15
export const MAX_ACTION_POINTS = 6

export const ENDING_TYPE_MAP: Record<string, { label: string; gradient: string }> = {
  HE: { label: 'Happy Ending', gradient: 'linear-gradient(135deg, #fef7ff, #fce7f3)' },
  NE: { label: 'Normal Ending', gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)' },
  BE: { label: 'Bad Ending', gradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' },
}

// ============================================================
// 时间系统 — 6 时段
// ============================================================

export const PERIODS: TimePeriod[] = [
  { index: 0, name: '清晨', icon: '🌅', hours: '6:00-8:00' },
  { index: 1, name: '上午', icon: '☀️', hours: '8:00-11:00' },
  { index: 2, name: '中午', icon: '🌞', hours: '11:00-14:00' },
  { index: 3, name: '下午', icon: '⛅', hours: '14:00-17:00' },
  { index: 4, name: '傍晚', icon: '🌇', hours: '17:00-20:00' },
  { index: 5, name: '深夜', icon: '🌙', hours: '20:00-6:00' },
]

// ============================================================
// 角色数据 — 10 位嘉宾（5 女 5 男）
// ============================================================

export const CHARACTERS: Record<string, Character> = {
  liumei: {
    id: 'liumei', name: '刘枚', portrait: '/characters/liumei.jpg',
    gender: 'female', age: 52, title: '退休舞蹈教师',
    shortDesc: '优雅知性，举手投足间尽是古典舞的韵味',
    themeColor: '#ec4899', joinDay: 1,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 50 },
    tags: ['温婉坚韧', '慢热', '完美主义'],
  },
  maqing: {
    id: 'maqing', name: '马晴', portrait: '/characters/maqing.jpg',
    gender: 'female', age: 48, title: '企业家 / 美食博主',
    shortDesc: '爽朗大方的气氛担当，笑容感染力极强',
    themeColor: '#f97316', joinDay: 1,
    initialStats: { affection: 25, jealousy: 0, disgust: 0, reputation: 55 },
    tags: ['热情开朗', '大姐范', '好胜心强'],
  },
  wangxuelei: {
    id: 'wangxuelei', name: '王雪蕾', portrait: '/characters/wangxuelei.jpg',
    gender: 'female', age: 50, title: '瑜伽教练 / 心理咨询师',
    shortDesc: '气质清冷，看透人情世故却仍保持善良',
    themeColor: '#8b5cf6', joinDay: 1,
    initialStats: { affection: 15, jealousy: 0, disgust: 0, reputation: 60 },
    tags: ['冷静通透', '面冷心热', '最难攻略'],
  },
  wangyan: {
    id: 'wangyan', name: '王燕', portrait: '/characters/wangyan.jpg',
    gender: 'female', age: 45, title: '花艺师 / 民宿老板',
    shortDesc: '温柔似水，在大理经营一家小民宿',
    themeColor: '#06b6d4', joinDay: 1,
    initialStats: { affection: 22, jealousy: 0, disgust: 0, reputation: 45 },
    tags: ['温柔恬静', '浪漫主义', '容易心软'],
  },
  zhaolei: {
    id: 'zhaolei', name: '赵蕾', portrait: '/characters/zhaolei.jpg',
    gender: 'female', age: 42, title: '电视台主持人',
    shortDesc: '鲶鱼嘉宾，气场强大，谈吐幽默',
    themeColor: '#f43f5e', joinDay: 3,
    initialStats: { affection: 18, jealousy: 0, disgust: 0, reputation: 65 },
    tags: ['犀利幽默', '高情商', '鲶鱼'],
  },
  liuyugang: {
    id: 'liuyugang', name: '刘玉刚', portrait: '/characters/liuyugang.jpg',
    gender: 'male', age: 55, title: '退休军人 / 户外教练',
    shortDesc: '正直稳重，身材魁梧但说话温柔',
    themeColor: '#3b82f6', joinDay: 1,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 55 },
    tags: ['稳重可靠', '行动派', '保护欲强'],
  },
  luofei: {
    id: 'luofei', name: '罗飞', portrait: '/characters/luofei.jpg',
    gender: 'male', age: 50, title: '大学教授 / 作家',
    shortDesc: '儒雅博学，说情话像在念诗',
    themeColor: '#22c55e', joinDay: 1,
    initialStats: { affection: 18, jealousy: 0, disgust: 0, reputation: 50 },
    tags: ['温文尔雅', '书生气', '理想主义'],
  },
  wangzichun: {
    id: 'wangzichun', name: '王子纯', portrait: '/characters/wangzichun.jpg',
    gender: 'male', age: 48, title: '建筑设计师',
    shortDesc: '品味独到，幽默风趣，成熟从容',
    themeColor: '#a855f7', joinDay: 1,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 50 },
    tags: ['品味独到', '幽默风趣', '高标准'],
  },
  xudongxin: {
    id: 'xudongxin', name: '徐东昕', portrait: '/characters/xudongxin.jpg',
    gender: 'male', age: 53, title: '餐饮连锁老板',
    shortDesc: '豪爽大方，真诚直接，容易吃醋',
    themeColor: '#eab308', joinDay: 1,
    initialStats: { affection: 22, jealousy: 0, disgust: 0, reputation: 45 },
    tags: ['豪爽大方', '江湖气', '真诚直接'],
  },
  linjian: {
    id: 'linjian', name: '林健', portrait: '/characters/linjian.jpg',
    gender: 'male', age: 46, title: '健身教练 / 摄影师',
    shortDesc: '鲶鱼嘉宾，阳光帅气，城府不浅',
    themeColor: '#14b8a6', joinDay: 4,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 60 },
    tags: ['阳光暖男', '高情商', '鲶鱼'],
  },
}

// ============================================================
// 场景数据 — 8 个场景
// ============================================================

export const SCENES: Record<string, Scene> = {
  'living-room': {
    id: 'living-room', name: '客厅', icon: '🛋️',
    background: '/scenes/living-room.jpg',
    atmosphere: '热闹、欢快、综艺感',
    tags: ['公共区域', '日常', '聚会'],
  },
  kitchen: {
    id: 'kitchen', name: '厨房', icon: '🍳',
    background: '/scenes/kitchen.jpg',
    atmosphere: '烟火气、温馨、自然',
    tags: ['公共区域', '美食', '互动'],
  },
  garden: {
    id: 'garden', name: '花园', icon: '🌺',
    background: '/scenes/garden.jpg',
    atmosphere: '浪漫、宁静、诗意',
    tags: ['户外', '浪漫', '约会'],
  },
  terrace: {
    id: 'terrace', name: '露台', icon: '🌅',
    background: '/scenes/terrace.jpg',
    atmosphere: '浪漫、深情、仪式感',
    tags: ['半户外', '告白', '夜景'],
  },
  'male-dorm': {
    id: 'male-dorm', name: '男宿舍', icon: '🛏️',
    background: '/scenes/male-dorm.jpg',
    atmosphere: '轻松、八卦、兄弟情',
    tags: ['私人空间', '夜聊', '男性'],
  },
  'female-dorm': {
    id: 'female-dorm', name: '女宿舍', icon: '💅',
    background: '/scenes/female-dorm.jpg',
    atmosphere: '私密、闺蜜、分享',
    tags: ['私人空间', '夜聊', '女性'],
  },
  'old-town': {
    id: 'old-town', name: '大理古城', icon: '🏯',
    background: '/scenes/old-town.jpg',
    atmosphere: '悠闲、浪漫、文艺',
    tags: ['外出', '约会', '文艺'],
  },
  lakeside: {
    id: 'lakeside', name: '洱海边', icon: '🌊',
    background: '/scenes/lakeside.jpg',
    atmosphere: '开阔、自由、浪漫',
    tags: ['外出', '浪漫', '派对'],
  },
}

// ============================================================
// 道具数据 — 8 种道具
// ============================================================

export const ITEMS: GameItem[] = [
  {
    id: 'drift-bottle', name: '漂流瓶', icon: '🍾', type: 'daily',
    dailyLimit: 1, requiresTarget: true,
    effects: { _default: { affection: 3 } },
  },
  {
    id: 'flower', name: '鲜花', icon: '💐', type: 'gift',
    requiresTarget: true,
    effects: {
      liumei: { affection: 8, reputation: 3 },
      wangyan: { affection: 10, reputation: 2 },
      linjian: { affection: 6 },
      xudongxin: { affection: 5 },
      _default: { affection: 5 },
    },
  },
  {
    id: 'chocolate', name: '巧克力', icon: '🍫', type: 'gift',
    requiresTarget: true,
    effects: {
      maqing: { affection: 8, reputation: 3 },
      zhaolei: { affection: 8 },
      _default: { affection: 5 },
    },
  },
  {
    id: 'handwritten-card', name: '手写卡片', icon: '✉️', type: 'gift',
    requiresTarget: true,
    effects: {
      liumei: { affection: 10, jealousy: -5, reputation: 5 },
      wangxuelei: { affection: 10, reputation: 5 },
      luofei: { affection: 8, reputation: 3 },
      wangyan: { affection: 8, reputation: 3 },
      _default: { affection: 6 },
    },
  },
  {
    id: 'clue-note', name: '线索便签', icon: '📝', type: 'special',
    requiresTarget: false,
  },
  {
    id: 'recommendation', name: '推荐信', icon: '📄', type: 'special',
    requiresTarget: true,
    effects: { _default: { affection: 5, reputation: 10 } },
  },
  {
    id: 'photo', name: '合照', icon: '📸', type: 'gift',
    requiresTarget: true,
    effects: {
      liuyugang: { affection: 8, reputation: 3 },
      wangzichun: { affection: 8, reputation: 5 },
      linjian: { affection: 8, reputation: 5 },
      _default: { affection: 5, reputation: 3 },
    },
  },
  {
    id: 'exclusive-gift', name: '专属礼物', icon: '🎁', type: 'gift',
    requiresTarget: true,
    effects: {
      maqing: { affection: 15, jealousy: -10, reputation: 5 },
      zhaolei: { affection: 12, jealousy: -8, reputation: 5 },
      wangzichun: { affection: 12, reputation: 8 },
      _default: { affection: 10, reputation: 5 },
    },
  },
]

// ============================================================
// 章节数据 — 6 章
// ============================================================

export const CHAPTERS: Chapter[] = [
  { id: 1, name: '初见印象', dayRange: [1, 2], objectives: ['认识所有嘉宾', '建立初步好感', '选择首次约会对象'] },
  { id: 2, name: '心动锁定', dayRange: [3, 4], objectives: ['应对鲶鱼嘉宾冲击', '确定心动方向', '争取约会机会'] },
  { id: 3, name: '约会争夺', dayRange: [5, 7], objectives: ['赢得约会', '处理嫉妒冲突', '深入了解心动对象'] },
  { id: 4, name: '情敌危机', dayRange: [8, 10], objectives: ['化解情敌竞争', '获取关键秘密', '维护核心关系'] },
  { id: 5, name: '关系深化', dayRange: [11, 13], objectives: ['通过亲友日考验', '解开心结', '确认彼此心意'] },
  { id: 6, name: '最终抉择', dayRange: [14, 15], objectives: ['做出最终选择', '爆灯告白', '迎接结局'] },
]

// ============================================================
// 强制事件
// ============================================================

export const FORCED_EVENTS: ForcedEvent[] = [
  { id: 'first-meeting', name: '初次见面', triggerDay: 1, triggerPeriod: 0 },
  { id: 'blind-date', name: '盲选约会', triggerDay: 2, triggerPeriod: 1 },
  { id: 'catfish-female', name: '鲶鱼入局·赵蕾', triggerDay: 3, triggerPeriod: 2 },
  { id: 'catfish-male', name: '鲶鱼入局·林健', triggerDay: 4, triggerPeriod: 2 },
  { id: 'truth-or-dare', name: '真心话大冒险', triggerDay: 8, triggerPeriod: 4 },
  { id: 'family-day', name: '亲友日', triggerDay: 11, triggerPeriod: 1 },
  { id: 'final-light', name: '爆灯告白', triggerDay: 15, triggerPeriod: 4 },
]

// ============================================================
// 结局定义
// ============================================================

export const ENDINGS: Ending[] = [
  { id: 'liumei-he', name: '迟来的春天', type: 'HE', route: 'liumei', description: '你和心仪男嘉宾双向爆灯，在洱海边的日落下牵手。', condition: '最佳男嘉宾好感≥80 且 厌恶<20' },
  { id: 'liumei-ne', name: '来日方长', type: 'NE', route: 'liumei', description: '互有好感但还不够深，互换了联系方式。', condition: '最佳男嘉宾好感50-79 且 厌恶<40' },
  { id: 'liumei-be', name: '错过的人', type: 'BE', route: 'liumei', description: '你的行为触碰了底线，他微笑着说"祝你幸福"。', condition: '最佳男嘉宾好感<50 或 厌恶≥40' },
  { id: 'newcomer-he', name: '意外的心动', type: 'HE', route: 'newcomer', description: '你成功融入并找到了真爱，双向爆灯。', condition: '任一角色好感≥80 且 声望≥60' },
  { id: 'newcomer-ne', name: '短暂的邂逅', type: 'NE', route: 'newcomer', description: '没能配对成功，但收获了珍贵的友谊和成长。', condition: '最高好感50-79' },
  { id: 'newcomer-be', name: '格格不入', type: 'BE', route: 'newcomer', description: '你始终无法融入这个群体，独自离开。', condition: '所有角色好感<50 或 声望<30' },
]

// ============================================================
// 快捷操作
// ============================================================

export const QUICK_ACTIONS: string[] = [
  '搭讪聊天',
  '约会邀请',
  '送礼物',
  '打听八卦',
]

// ============================================================
// 开场信笺
// ============================================================

export const STORY_INFO = {
  genre: '恋综模拟',
  title: '黄昏时分说爱你',
  subtitle: 'Love at Sunset · 恋综模拟器',
  description:
    '大理洱海畔的合宿别墅，十位 50+ 嘉宾，十五天的朝夕相处。' +
    '这一次，不需要年轻的冲动，只需要成熟的真心。' +
    '在人生的黄昏时分，勇敢地再说一次"我喜欢你"。',
  goals: [
    '与心动嘉宾建立深度连接，提升好感度',
    '在 15 天内赢得爆灯告白的机会',
    '巧妙应对鲶鱼嘉宾带来的竞争压力',
    '管理声望值，赢得其他嘉宾的认可',
  ],
}

// ============================================================
// 工具函数
// ============================================================

export function getAffectionLevel(affection: number) {
  if (affection >= 80) return { level: 4, name: '心意相通' }
  if (affection >= 60) return { level: 3, name: '暧昧升温' }
  if (affection >= 30) return { level: 2, name: '好感萌芽' }
  return { level: 1, name: '初步认识' }
}

export function getRelationLabel(stats: CharacterStats) {
  if (stats.disgust > 60) return '关系恶化'
  if (stats.jealousy > 60) return '吃醋中'
  if (stats.affection >= 80) return '心意相通'
  if (stats.affection >= 60) return '暧昧升温'
  if (stats.affection >= 30) return '好感萌芽'
  return '初步认识'
}

export function getAvailableCharacters(day: number): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(CHARACTERS).filter(([, char]) => char.joinDay <= day)
  )
}

export function getCurrentChapter(day: number): Chapter {
  return CHAPTERS.find((ch) => day >= ch.dayRange[0] && day <= ch.dayRange[1]) ?? CHAPTERS[0]
}

export function getDayEvents(day: number, triggeredEvents: string[]): ForcedEvent[] {
  return FORCED_EVENTS.filter(
    (e) => e.triggerDay === day && !triggeredEvents.includes(e.id)
  )
}
