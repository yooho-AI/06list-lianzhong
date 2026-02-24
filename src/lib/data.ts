/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供游戏类型定义 + 数据常量 + 工具函数
 * [POS]: lib 的游戏数据层，10嘉宾/8场景/8道具/6章节/强制事件/结局/时段
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
// 类型定义
// ============================================================

export type PlayMode = 'liumei' | 'newcomer'

export interface Character {
  id: string
  name: string
  avatar: string
  fullImage: string
  video: string
  gender: 'female' | 'male'
  age: number
  title: string
  description: string
  personality: string
  speakingStyle: string
  secret: string
  triggerPoints: string[]
  behaviorPatterns: string
  giftPreference: string
  themeColor: string
  joinDay: number
  initialStats: CharacterStats
}

export interface CharacterStats {
  affection: number
  jealousy: number
  disgust: number
  reputation: number
}

export interface Scene {
  id: string
  name: string
  icon: string
  description: string
  background: string
  backgroundVideo?: string
  possibleCharacters: string[]
  atmosphere: string
  tags: string[]
}

export interface GameItem {
  id: string
  name: string
  icon: string
  type: 'daily' | 'gift' | 'special' | 'action' | 'time'
  description: string
  effects?: Record<string, { affection?: number; jealousy?: number; disgust?: number; reputation?: number }>
  dailyLimit?: number
  requiresTarget?: boolean
}

export interface Chapter {
  id: number
  name: string
  dayRange: [number, number]
  description: string
  objectives: string[]
  atmosphere: string
}

export interface ForcedEvent {
  id: string
  name: string
  triggerDay: number
  triggerPeriod?: number
  description: string
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
}

// ============================================================
// 游戏配置
// ============================================================

export const MAX_DAYS = 15
export const MAX_ACTION_POINTS = 6

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
  /* -------- 女嘉宾 -------- */
  liumei: {
    id: 'liumei',
    name: '刘枚',
    avatar: '刘',
    fullImage: '/characters/liumei.jpg',
    video: '/characters/videos/liumei.mp4',
    gender: 'female',
    age: 52,
    title: '退休舞蹈教师',
    description: '优雅知性的退休舞蹈教师，身材保持极好，举手投足间尽是古典舞的韵味。离异多年，独自抚养女儿成人，内心深处渴望被人真心对待。',
    personality: '温婉坚韧 | 骄傲自尊 + 内心柔软 + 完美主义 + 慢热型',
    speakingStyle: '措辞优雅考究，偶尔引用诗词，不急不躁，带着教师的端庄和分寸感',
    secret: '前夫是知名编导，离婚原因是对方出轨学生。至今对亲密关系有防备。',
    triggerPoints: ['被当作花瓶', '言语轻浮不尊重', '提及前夫'],
    behaviorPatterns: '清晨在花园练功，傍晚看洱海日落，对有才华有修养的人会主动靠近',
    giftPreference: '手写卡片、鲜花',
    themeColor: '#ec4899',
    joinDay: 1,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 50 },
  },
  maqing: {
    id: 'maqing',
    name: '马晴',
    avatar: '马',
    fullImage: '/characters/maqing.jpg',
    video: '/characters/videos/maqing.mp4',
    gender: 'female',
    age: 48,
    title: '企业家 / 美食博主',
    description: '爽朗大方的企业家，同时经营美食博主副业。离异后把精力全部投入事业，笑容感染力极强，是合宿中的气氛担当。',
    personality: '热情开朗 | 大姐范 + 好胜心强 + 感情直接 + 缺乏安全感',
    speakingStyle: '直来直去，说话大声，爱开玩笑，带着生意人的爽快和江湖气',
    secret: '事业成功但内心孤独，害怕别人是冲着她的钱来的。',
    triggerPoints: ['被利用的感觉', '背后议论', '虚情假意'],
    behaviorPatterns: '喜欢在厨房展示厨艺，主动组织集体活动，对真诚的人特别大方',
    giftPreference: '巧克力、专属礼物',
    themeColor: '#f97316',
    joinDay: 1,
    initialStats: { affection: 25, jealousy: 0, disgust: 0, reputation: 55 },
  },
  wangxuelei: {
    id: 'wangxuelei',
    name: '王雪蕾',
    avatar: '雪',
    fullImage: '/characters/wangxuelei.jpg',
    video: '/characters/videos/wangxuelei.mp4',
    gender: 'female',
    age: 50,
    title: '瑜伽教练 / 心理咨询师',
    description: '气质清冷的瑜伽教练，同时持有心理咨询师执照。丧偶多年，看透人情世故却仍保持善良。说话直接但总能击中要害。',
    personality: '冷静通透 | 看穿人心 + 面冷心热 + 不轻易动情 + 理想主义',
    speakingStyle: '话不多但字字珠玑，偶尔犀利到让人无法反驳，安静时有一种让人想倾诉的气场',
    secret: '亡夫是她的初恋，至今无法完全放下。来恋综是想证明自己还能爱。',
    triggerPoints: ['不真诚', '油嘴滑舌', '同时撩多个人被抓到'],
    behaviorPatterns: '清晨做瑜伽，喜欢独处但会主动关心他人情绪，最难攻略的女嘉宾',
    giftPreference: '手写卡片、推荐信',
    themeColor: '#8b5cf6',
    joinDay: 1,
    initialStats: { affection: 15, jealousy: 0, disgust: 0, reputation: 60 },
  },
  wangyan: {
    id: 'wangyan',
    name: '王燕',
    avatar: '燕',
    fullImage: '/characters/wangyan.jpg',
    video: '/characters/videos/wangyan.mp4',
    gender: 'female',
    age: 45,
    title: '花艺师 / 民宿老板',
    description: '温柔似水的花艺师，在大理经营一家小民宿。未婚，曾有一段十年的感情最终没能走进婚姻。性格随和但有自己的底线。',
    personality: '温柔恬静 | 岁月静好 + 浪漫主义 + 容易心软 + 有些优柔寡断',
    speakingStyle: '语速缓慢轻柔，喜欢用花来比喻感情，说话总带着治愈的笑容',
    secret: '前男友至今还在追求她，她来恋综就是想彻底放下过去。',
    triggerPoints: ['被催促做决定', '强势控制', '不解风情'],
    behaviorPatterns: '喜欢在花园摆弄花草，会给喜欢的人偷偷送花，容易被浪漫举动打动',
    giftPreference: '鲜花、手写卡片',
    themeColor: '#06b6d4',
    joinDay: 1,
    initialStats: { affection: 22, jealousy: 0, disgust: 0, reputation: 45 },
  },
  zhaolei: {
    id: 'zhaolei',
    name: '赵蕾',
    avatar: '赵',
    fullImage: '/characters/zhaolei.jpg',
    video: '/characters/videos/zhaolei.mp4',
    gender: 'female',
    age: 42,
    title: '电视台主持人',
    description: '鲶鱼嘉宾。光鲜亮丽的电视台主持人，气场强大，谈吐幽默，进场就让所有人感到压力。离异带一子，对感情既渴望又防备。',
    personality: '犀利幽默 | 高情商 + 好胜心 + 表演型人格 + 内心敏感',
    speakingStyle: '妙语连珠，综艺感十足，擅长调动气氛也擅长怼人，但偶尔流露的脆弱让人心疼',
    secret: '前夫是圈内人，离婚后被前夫粉丝网暴过。表面坚强实则伤痕累累。',
    triggerPoints: ['隐私被窥探', '被当作话题人物', '虚伪的同情'],
    behaviorPatterns: '喜欢在露台喝酒聊天，观察力极强，会主动挑起话题制造戏剧冲突',
    giftPreference: '巧克力、专属礼物',
    themeColor: '#f43f5e',
    joinDay: 3,
    initialStats: { affection: 18, jealousy: 0, disgust: 0, reputation: 65 },
  },

  /* -------- 男嘉宾 -------- */
  liuyugang: {
    id: 'liuyugang',
    name: '刘玉刚',
    avatar: '刚',
    fullImage: '/characters/liuyugang.jpg',
    video: '/characters/videos/liuyugang.mp4',
    gender: 'male',
    age: 55,
    title: '退休军人 / 户外教练',
    description: '正直稳重的退休军人，转行做户外探险教练。身材魁梧但说话温柔，是个典型的暖男。丧偶五年，女儿鼓励他来恋综。',
    personality: '稳重可靠 | 行动派 + 不善言辞 + 保护欲强 + 内心浪漫',
    speakingStyle: '言简意赅，不说废话，偶尔冒出的浪漫话让人措手不及',
    secret: '亡妻去世时他在执行任务未能见最后一面，心中一直愧疚。',
    triggerPoints: ['不负责任', '花心脚踏多条船', '看不起军人'],
    behaviorPatterns: '每天清晨跑步锻炼，喜欢帮人修东西做实事，行动多于言语',
    giftPreference: '推荐信、照片',
    themeColor: '#3b82f6',
    joinDay: 1,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 55 },
  },
  luofei: {
    id: 'luofei',
    name: '罗飞',
    avatar: '罗',
    fullImage: '/characters/luofei.jpg',
    video: '/characters/videos/luofei.mp4',
    gender: 'male',
    age: 50,
    title: '大学教授 / 作家',
    description: '儒雅博学的大学中文系教授，出版过几本散文集。离异后沉浸在学术世界里，来恋综是朋友强行报名的。',
    personality: '温文尔雅 | 书生气 + 浪漫但笨拙 + 理想主义 + 有些迂腐',
    speakingStyle: '用词讲究，偶尔掉书袋，说情话像在念诗，紧张时会推眼镜',
    secret: '前妻嫌他只会读书不懂生活。他想证明文人也能浪漫。',
    triggerPoints: ['被说无趣', '看不起文化人', '粗俗行为'],
    behaviorPatterns: '喜欢在露台看书写字，会给心仪的人写诗，约会时容易紧张',
    giftPreference: '手写卡片、推荐信',
    themeColor: '#22c55e',
    joinDay: 1,
    initialStats: { affection: 18, jealousy: 0, disgust: 0, reputation: 50 },
  },
  wangzichun: {
    id: 'wangzichun',
    name: '王子纯',
    avatar: '纯',
    fullImage: '/characters/wangzichun.jpg',
    video: '/characters/videos/wangzichun.mp4',
    gender: 'male',
    age: 48,
    title: '建筑设计师',
    description: '有品味的建筑设计师，穿着考究，审美在线。离异一次，对理想伴侣有明确标准。为人幽默但有距离感。',
    personality: '品味独到 | 完美主义 + 幽默风趣 + 高标准 + 外热内冷',
    speakingStyle: '说话风趣，善用比喻，偶尔毒舌但不伤人，有种成熟男人的从容',
    secret: '前妻是他设计圈的同行，离婚因为两人都太要强。他在反思自己。',
    triggerPoints: ['审美分歧', '邋遢随意', '没有个人空间'],
    behaviorPatterns: '会偷偷观察别人的穿搭，喜欢在古城散步找灵感，对有品味的人特别欣赏',
    giftPreference: '照片、专属礼物',
    themeColor: '#a855f7',
    joinDay: 1,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 50 },
  },
  xudongxin: {
    id: 'xudongxin',
    name: '徐东昕',
    avatar: '徐',
    fullImage: '/characters/xudongxin.jpg',
    video: '/characters/videos/xudongxin.mp4',
    gender: 'male',
    age: 53,
    title: '餐饮连锁老板',
    description: '成功的餐饮连锁企业家，性格豪爽但略显俗气。离异两次，经济条件最好但情感经历最坎坷。来恋综想找"能过日子的人"。',
    personality: '豪爽大方 | 江湖气 + 真诚直接 + 有些大男子主义 + 容易吃醋',
    speakingStyle: '说话大嗓门，爱用东北口音，经常开不太高雅的玩笑，但真心话很动人',
    secret: '两次婚姻都败在自己太忙了。现在已经退居二线，想好好对一个人。',
    triggerPoints: ['被瞧不起', '被说没文化', '嫌他俗'],
    behaviorPatterns: '总想请客做东，喜欢做饭给别人吃，吃醋时特别明显',
    giftPreference: '巧克力、鲜花',
    themeColor: '#eab308',
    joinDay: 1,
    initialStats: { affection: 22, jealousy: 0, disgust: 0, reputation: 45 },
  },
  linjian: {
    id: 'linjian',
    name: '林健',
    avatar: '林',
    fullImage: '/characters/linjian.jpg',
    video: '/characters/videos/linjian.mp4',
    gender: 'male',
    age: 46,
    title: '健身教练 / 摄影师',
    description: '鲶鱼嘉宾。阳光帅气的健身教练兼业余摄影师，比其他男嘉宾年轻几岁，进场后立刻成为焦点。未婚，说"一直在等对的人"。',
    personality: '阳光暖男 | 高情商 + 浪漫攻势 + 有企图心 + 城府不浅',
    speakingStyle: '说话温柔有磁性，善于倾听和共情，总能说出女人想听的话',
    secret: '其实有过一段不为人知的婚姻，离婚原因不明。来恋综有一定的曝光需求。',
    triggerPoints: ['被揭穿过去', '不被信任', '直接竞争'],
    behaviorPatterns: '主动约人拍照，会给每个女嘉宾都展现关心，制造暧昧但不轻易承诺',
    giftPreference: '照片、鲜花',
    themeColor: '#14b8a6',
    joinDay: 4,
    initialStats: { affection: 20, jealousy: 0, disgust: 0, reputation: 60 },
  },
}

// ============================================================
// 场景数据 — 8 个场景
// ============================================================

export const SCENES: Record<string, Scene> = {
  'living-room': {
    id: 'living-room',
    name: '客厅',
    icon: '🛋️',
    description: '宽敞明亮的别墅客厅，摆满了鲜花和水果。落地窗外能看到远处的苍山。嘉宾们日常聚集的主要场所。',
    background: '/scenes/living-room.jpg',
    possibleCharacters: ['liumei', 'maqing', 'wangxuelei', 'wangyan', 'zhaolei', 'liuyugang', 'luofei', 'wangzichun', 'xudongxin', 'linjian'],
    atmosphere: '热闹、欢快、综艺感',
    tags: ['公共区域', '日常', '聚会'],
  },
  kitchen: {
    id: 'kitchen',
    name: '厨房',
    icon: '🍳',
    description: '开放式厨房，厨具齐全。马晴和徐东昕经常在这里大展身手，做饭时的互动往往最自然。',
    background: '/scenes/kitchen.jpg',
    possibleCharacters: ['maqing', 'xudongxin', 'wangyan', 'liuyugang'],
    atmosphere: '烟火气、温馨、自然',
    tags: ['公共区域', '美食', '互动'],
  },
  garden: {
    id: 'garden',
    name: '花园',
    icon: '🌺',
    description: '别墅后面的私家花园，种满了三角梅和绣球花。清晨有雾气缭绕，傍晚可以看到绝美的日落。',
    background: '/scenes/garden.jpg',
    possibleCharacters: ['liumei', 'wangyan', 'wangxuelei', 'luofei'],
    atmosphere: '浪漫、宁静、诗意',
    tags: ['户外', '浪漫', '约会'],
  },
  terrace: {
    id: 'terrace',
    name: '露台',
    icon: '🌅',
    description: '二楼的大露台，正对洱海。白天可以远眺苍山洱海，夜晚灯光下是最佳告白地点。',
    background: '/scenes/terrace.jpg',
    possibleCharacters: ['liumei', 'maqing', 'wangxuelei', 'wangyan', 'zhaolei', 'liuyugang', 'luofei', 'wangzichun', 'xudongxin', 'linjian'],
    atmosphere: '浪漫、深情、仪式感',
    tags: ['半户外', '告白', '夜景'],
  },
  'male-dorm': {
    id: 'male-dorm',
    name: '男宿舍',
    icon: '🛏️',
    description: '男嘉宾们的公共卧室区域，夜聊八卦的主场地。谁喜欢谁、今天的约会细节，都在这里被扒个底朝天。',
    background: '/scenes/male-dorm.jpg',
    possibleCharacters: ['liuyugang', 'luofei', 'wangzichun', 'xudongxin', 'linjian'],
    atmosphere: '轻松、八卦、兄弟情',
    tags: ['私人空间', '夜聊', '男性'],
  },
  'female-dorm': {
    id: 'female-dorm',
    name: '女宿舍',
    icon: '💅',
    description: '女嘉宾们的闺蜜空间，化妆台前的悄悄话，睡前分享心动瞬间。这里的秘密比合宿还多。',
    background: '/scenes/female-dorm.jpg',
    possibleCharacters: ['liumei', 'maqing', 'wangxuelei', 'wangyan', 'zhaolei'],
    atmosphere: '私密、闺蜜、分享',
    tags: ['私人空间', '夜聊', '女性'],
  },
  'old-town': {
    id: 'old-town',
    name: '大理古城',
    icon: '🏯',
    description: '古色古香的大理古城，石板路两旁是各种特色小店。约会胜地，逛街、吃小吃、买纪念品。',
    background: '/scenes/old-town.jpg',
    possibleCharacters: ['liumei', 'maqing', 'wangxuelei', 'wangyan', 'zhaolei', 'liuyugang', 'luofei', 'wangzichun', 'xudongxin', 'linjian'],
    atmosphere: '悠闲、浪漫、文艺',
    tags: ['外出', '约会', '文艺'],
  },
  lakeside: {
    id: 'lakeside',
    name: '洱海边',
    icon: '🌊',
    description: '波光粼粼的洱海边，白桌椅、吉他、阳光。最适合两个人安静地聊天或者一群人开party的地方。',
    background: '/scenes/lakeside.jpg',
    possibleCharacters: ['liumei', 'maqing', 'wangxuelei', 'wangyan', 'zhaolei', 'liuyugang', 'luofei', 'wangzichun', 'xudongxin', 'linjian'],
    atmosphere: '开阔、自由、浪漫',
    tags: ['外出', '浪漫', '派对'],
  },
}

// ============================================================
// 道具数据 — 8 种道具
// ============================================================

export const ITEMS: Record<string, GameItem> = {
  'drift-bottle': {
    id: 'drift-bottle',
    name: '漂流瓶',
    icon: '🍾',
    type: 'daily',
    description: '每日一次，匿名向某位嘉宾传递心意。对方不知道是谁送的。',
    dailyLimit: 1,
    requiresTarget: true,
    effects: {
      _default: { affection: 3 },
    },
  },
  flower: {
    id: 'flower',
    name: '鲜花',
    icon: '💐',
    type: 'gift',
    description: '一束精心挑选的鲜花，浪漫经典的示好方式。',
    requiresTarget: true,
    effects: {
      liumei: { affection: 8, reputation: 3 },
      wangyan: { affection: 10, reputation: 2 },
      linjian: { affection: 6 },
      xudongxin: { affection: 5 },
      _default: { affection: 5 },
    },
  },
  chocolate: {
    id: 'chocolate',
    name: '巧克力',
    icon: '🍫',
    type: 'gift',
    description: '进口手工巧克力，甜蜜的小心意。',
    requiresTarget: true,
    effects: {
      maqing: { affection: 8, reputation: 3 },
      zhaolei: { affection: 8 },
      _default: { affection: 5 },
    },
  },
  'handwritten-card': {
    id: 'handwritten-card',
    name: '手写卡片',
    icon: '✉️',
    type: 'gift',
    description: '一张写满真心话的手写卡片，最朴素也最打动人的礼物。',
    requiresTarget: true,
    effects: {
      liumei: { affection: 10, jealousy: -5, reputation: 5 },
      wangxuelei: { affection: 10, reputation: 5 },
      luofei: { affection: 8, reputation: 3 },
      wangyan: { affection: 8, reputation: 3 },
      _default: { affection: 6 },
    },
  },
  'clue-note': {
    id: 'clue-note',
    name: '线索便签',
    icon: '📝',
    type: 'special',
    description: '其他嘉宾给你透露的八卦信息，可能揭示某人的秘密。',
    requiresTarget: false,
  },
  recommendation: {
    id: 'recommendation',
    name: '推荐信',
    icon: '📄',
    type: 'special',
    description: '其他嘉宾写给你的推荐信，能大幅提升你在某人心中的印象。',
    requiresTarget: true,
    effects: {
      _default: { affection: 5, reputation: 10 },
    },
  },
  photo: {
    id: 'photo',
    name: '合照',
    icon: '📸',
    type: 'gift',
    description: '和嘉宾的合影，记录美好瞬间。',
    requiresTarget: true,
    effects: {
      liuyugang: { affection: 8, reputation: 3 },
      wangzichun: { affection: 8, reputation: 5 },
      linjian: { affection: 8, reputation: 5 },
      _default: { affection: 5, reputation: 3 },
    },
  },
  'exclusive-gift': {
    id: 'exclusive-gift',
    name: '专属礼物',
    icon: '🎁',
    type: 'gift',
    description: '根据对方喜好精心准备的专属礼物，诚意满满。',
    requiresTarget: true,
    effects: {
      maqing: { affection: 15, jealousy: -10, reputation: 5 },
      zhaolei: { affection: 12, jealousy: -8, reputation: 5 },
      wangzichun: { affection: 12, reputation: 8 },
      _default: { affection: 10, reputation: 5 },
    },
  },
}

// ============================================================
// 章节数据 — 6 章
// ============================================================

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: '初见印象',
    dayRange: [1, 2],
    description: '嘉宾们第一次相见，自我介绍、初步了解。第一印象至关重要。',
    objectives: ['认识所有嘉宾', '建立初步好感', '选择首次约会对象'],
    atmosphere: '好奇、兴奋、拘谨',
  },
  {
    id: 2,
    name: '心动锁定',
    dayRange: [3, 4],
    description: '鲶鱼嘉宾入局，原有的关系格局被打破。心动对象逐渐清晰。',
    objectives: ['应对鲶鱼嘉宾冲击', '确定心动方向', '争取约会机会'],
    atmosphere: '紧张、竞争、心动',
  },
  {
    id: 3,
    name: '约会争夺',
    dayRange: [5, 7],
    description: '约会成为稀缺资源，嘉宾们开始主动出击。嫉妒和误会开始出现。',
    objectives: ['赢得约会', '处理嫉妒冲突', '深入了解心动对象'],
    atmosphere: '热烈、纠结、戏剧化',
  },
  {
    id: 4,
    name: '情敌危机',
    dayRange: [8, 10],
    description: '关系进入深水区，情敌之间的对决白热化。秘密可能被揭露。',
    objectives: ['化解情敌竞争', '获取关键秘密', '维护核心关系'],
    atmosphere: '紧张、冲突、考验',
  },
  {
    id: 5,
    name: '关系深化',
    dayRange: [11, 13],
    description: '经历考验的关系更加坚固。亲友日让感情面对现实检验。',
    objectives: ['通过亲友日考验', '解开心结', '确认彼此心意'],
    atmosphere: '感动、深情、坦诚',
  },
  {
    id: 6,
    name: '最终抉择',
    dayRange: [14, 15],
    description: '最后的告白时间。爆灯仪式决定最终配对。所有的纠结在此刻揭晓。',
    objectives: ['做出最终选择', '爆灯告白', '迎接结局'],
    atmosphere: '紧张、浪漫、仪式感',
  },
]

// ============================================================
// 强制事件
// ============================================================

export const FORCED_EVENTS: ForcedEvent[] = [
  {
    id: 'first-meeting',
    name: '初次见面',
    triggerDay: 1,
    triggerPeriod: 0,
    description: '所有初始嘉宾在客厅集合，进行自我介绍环节。每人有30秒时间展示自己。',
  },
  {
    id: 'blind-date',
    name: '盲选约会',
    triggerDay: 2,
    triggerPeriod: 1,
    description: '节目组安排盲选约会——每位嘉宾写下最想约会的人，配对成功的可以外出约会。',
  },
  {
    id: 'catfish-female',
    name: '鲶鱼入局·赵蕾',
    triggerDay: 3,
    triggerPeriod: 2,
    description: '新嘉宾赵蕾（电视台主持人）空降入局！她的到来打破了原有的关系平衡。所有男嘉宾的目光都被吸引。',
  },
  {
    id: 'catfish-male',
    name: '鲶鱼入局·林健',
    triggerDay: 4,
    triggerPeriod: 2,
    description: '新嘉宾林健（健身教练/摄影师）空降入局！比其他男嘉宾年轻的他，让女嘉宾们心动不已。',
  },
  {
    id: 'family-day',
    name: '亲友日',
    triggerDay: 11,
    triggerPeriod: 1,
    description: '嘉宾们的好友/子女通过视频连线加入。亲友的态度可能会影响感情走向。',
  },
  {
    id: 'truth-or-dare',
    name: '真心话大冒险',
    triggerDay: 8,
    triggerPeriod: 4,
    description: '傍晚的派对游戏——真心话大冒险。酒精和真心话的组合，可能让隐藏的秘密和情感浮出水面。',
  },
  {
    id: 'final-light',
    name: '爆灯告白',
    triggerDay: 15,
    triggerPeriod: 4,
    description: '最终告白仪式。在洱海边的灯光舞台上，每位嘉宾选择为心动对象"爆灯"。双向爆灯即为配对成功。',
  },
]

// ============================================================
// 结局定义
// ============================================================

export const ENDINGS: Ending[] = [
  /* 刘枚线 */
  {
    id: 'liumei-he',
    name: '迟来的春天',
    type: 'HE',
    route: 'liumei',
    description: '你和刘枚双向爆灯，在洱海边的日落下牵手。她终于放下了过去的伤痛，选择重新相信爱情。',
    condition: '刘枚好感≥80 且 嫉妒<30 且 厌恶<20',
  },
  {
    id: 'liumei-ne',
    name: '来日方长',
    type: 'NE',
    route: 'liumei',
    description: '你和刘枚有好感但还不够深。她在最后一天说"如果在节目外相遇就好了"，互换了联系方式。',
    condition: '刘枚好感50-79 且 厌恶<40',
  },
  {
    id: 'liumei-be',
    name: '错过的人',
    type: 'BE',
    route: 'liumei',
    description: '你的行为触碰了刘枚的底线，或者花心被发现。她微笑着说"祝你幸福"，转身离开。',
    condition: '刘枚好感<50 或 厌恶≥40',
  },
  /* 空降线 */
  {
    id: 'newcomer-he',
    name: '意外的心动',
    type: 'HE',
    route: 'newcomer',
    description: '作为空降嘉宾，你成功融入并找到了真爱。在爆灯仪式上，你和心动对象双向选择。',
    condition: '任一角色好感≥80 且 声望≥60',
  },
  {
    id: 'newcomer-ne',
    name: '短暂的邂逅',
    type: 'NE',
    route: 'newcomer',
    description: '你在合宿中留下了美好的回忆，虽然没能配对成功，但收获了珍贵的友谊和成长。',
    condition: '最高好感50-79',
  },
  {
    id: 'newcomer-be',
    name: '格格不入',
    type: 'BE',
    route: 'newcomer',
    description: '你始终无法融入这个群体，或者因为某些行为被嘉宾们排斥。节目结束时，你独自离开。',
    condition: '所有角色好感<50 或 声望<30',
  },
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

/* 好感等级 */
export function getAffectionLevel(affection: number) {
  if (affection >= 80) return { level: 4, name: '心意相通' }
  if (affection >= 60) return { level: 3, name: '暧昧升温' }
  if (affection >= 30) return { level: 2, name: '好感萌芽' }
  return { level: 1, name: '初步认识' }
}

/* 当前情绪 */
export function getMood(stats: CharacterStats) {
  if (stats.disgust > 60) return { emoji: '😤', label: '反感' }
  if (stats.jealousy > 60) return { emoji: '😒', label: '吃醋' }
  if (stats.affection > 70) return { emoji: '🥰', label: '心动' }
  if (stats.affection > 40) return { emoji: '😊', label: '好感' }
  return { emoji: '😐', label: '平淡' }
}

/* 关系标签 */
export function getRelationLabel(stats: CharacterStats) {
  if (stats.disgust > 60) return '关系恶化'
  if (stats.jealousy > 60) return '吃醋中'
  if (stats.affection >= 80) return '心意相通'
  if (stats.affection >= 60) return '暧昧升温'
  if (stats.affection >= 30) return '好感萌芽'
  return '初步认识'
}

/* 获取当天可见角色（根据 joinDay 过滤） */
export function getAvailableCharacters(day: number): Record<string, Character> {
  return Object.fromEntries(
    Object.entries(CHARACTERS).filter(([, char]) => char.joinDay <= day)
  )
}

/* 获取当前章节 */
export function getCurrentChapter(day: number): Chapter {
  return CHAPTERS.find((ch) => day >= ch.dayRange[0] && day <= ch.dayRange[1]) ?? CHAPTERS[0]
}

/* 获取当天需要触发的强制事件 */
export function getDayEvents(day: number, triggeredEvents: string[]): ForcedEvent[] {
  return FORCED_EVENTS.filter(
    (e) => e.triggerDay === day && !triggeredEvents.includes(e.id)
  )
}
