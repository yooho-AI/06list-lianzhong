# 06list-lianzhong — 黄昏时分说爱你 · 恋综模拟器

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion + Cloudflare Pages

## 架构

```
06list-lianzhong/
├── worker/index.js              - ☆ CF Worker API 代理（备用，未部署）
├── public/
│   ├── audio/bgm.mp3            - 背景音乐
│   ├── characters/              - 10 角色立绘 (jpg, 1728x2304)
│   └── scenes/                  - 8 场景背景 (jpg, 各种尺寸)
├── src/
│   ├── main.tsx                 - ☆ React 入口
│   ├── vite-env.d.ts            - Vite 类型声明
│   ├── App.tsx                  - 根组件: 粉紫渐变开场(角色网格+双模式按钮) + GameScreen + EndingModal + MenuOverlay
│   ├── lib/
│   │   ├── script.md            - ★ 剧本直通：五模块原文（零转换注入 prompt）
│   │   ├── data.ts              - ★ UI 薄层：类型 + 10角色 + 8场景 + 8道具 + 6章节 + 7事件 + 6结局
│   │   ├── store.ts             - ★ 状态中枢：Zustand + 剧本直通 + 富消息 + 抽屉 + 选项提取 + 双轨解析
│   │   ├── parser.ts            - AI 回复解析（10角色着色 + 数值着色 + 选项提取）
│   │   ├── analytics.ts         - Umami 埋点（lz_ 前缀）
│   │   ├── stream.ts            - ☆ SSE 流式通信
│   │   ├── bgm.ts               - ☆ 背景音乐
│   │   └── hooks.ts             - ☆ useMediaQuery / useIsMobile
│   ├── styles/
│   │   ├── globals.css          - 全局基础样式（lz- 前缀）
│   │   ├── opening.css          - 开场样式：粉紫渐变 + 角色网格 + 双模式按钮
│   │   └── rich-cards.css       - 富UI组件：场景卡 + 日期卡 + NPC气泡 + DashboardDrawer + RecordSheet + SVG关系图 + Toast
│   └── components/game/
│       ├── app-shell.tsx        - 游戏主框架: Header + Tab路由 + TabBar(5键) + 三向手势 + 双抽屉 + RecordSheet + Toast
│       ├── dashboard-drawer.tsx - 恋综手帐(左抽屉)：扉页+角色轮播+场景缩略图+章节目标+道具格+迷你播放器。Reorder拖拽排序
│       ├── tab-dialogue.tsx     - 对话Tab：富消息路由(SceneCard/DayCard/NPC头像气泡) + 可折叠选项 + 背包 + 输入区
│       ├── tab-scene.tsx        - 场景Tab：9:16大图 + 真实头像角色标签 + 地点列表
│       └── tab-character.tsx    - 人物Tab：立绘 + StatMeta驱动数值条 + SVG RelationGraph + 角色网格 + CharacterDossier全屏档案
├── index.html
├── package.json
├── vite.config.ts               - ☆
├── tsconfig*.json               - ☆
└── wrangler.toml                - ☆
```

★ = 种子文件 ☆ = 零修改模板

## 核心设计

- **恋综模拟 + 双模式**：扮演刘枚 / 空降入局，10嘉宾(5女5男)，15天6时段
- **4维数值**：好感(#d946ef) / 嫉妒(#f97316) / 厌恶(#ef4444) / 声望(#3b82f6)，全部 category:'relation'
- **粉紫主题**：亮色系 #fef7ff 底 + #d946ef 主色，lz- CSS 前缀
- **剧本直通**：script.md 存五模块原文，?raw import 注入 prompt
- **6 结局**：HE×2 + NE×2 + BE×2（按 route 分 liumei/newcomer），优先级 BE→HE→NE

## 富UI组件系统

| 组件 | 位置 | 触发 | 视觉风格 |
|------|------|------|----------|
| DashboardDrawer | dashboard-drawer | Header📓+右滑手势 | 毛玻璃+拖拽排序：扉页+角色轮播+场景缩略图+目标+道具+音乐 |
| RecordSheet | app-shell | Header📜+左滑手势 | 右侧滑入事件记录：时间线倒序+粉色圆点 |
| SceneTransitionCard | tab-dialogue | selectScene | 场景背景+Ken Burns(8s)+渐变遮罩+粉色角标 |
| DayCard | tab-dialogue | 跨天 | 撕页效果+弹簧动画+章节名 |
| NpcBubble | tab-dialogue | AI回复 | 28px圆形头像+彩色左边框+Markdown渲染 |
| CollapsibleChoices | tab-dialogue | AI返回选项 | 收起横条/展开A/B/C/D卡片 |
| RelationGraph | tab-character | 始终可见 | SVG环形布局：中心"我"+10NPC头像节点+连线+关系标签 |
| CharacterDossier | tab-character | 点击角色 | 全屏右滑入+50vh立绘呼吸动画+好感阶段+tags |
| Toast | app-shell | saveGame | TabBar上方弹出2s消失 |

## 三向手势导航

- **右滑**（任意主Tab内容区）→ 左侧恋综手帐
- **左滑**（任意主Tab内容区）→ 右侧事件记录
- Header 按钮（📓/📜）同等触发
- 手帐内组件支持拖拽排序（Reorder + localStorage `lz-dash-order` 持久化）

## Store 状态扩展

- `activeTab: 'dialogue' | 'scene' | 'character'` — 三Tab路由
- `showDashboard: boolean` — 左抽屉开关
- `showRecords: boolean` — 右抽屉开关
- `storyRecords: StoryRecord[]` — 事件记录（sendMessage 和 advanceTime 自动追加）
- `choices: string[]` — AI 返回的选项（extractChoices 解析）
- `selectCharacter` 末尾自动跳转 dialogue Tab

## 富消息机制

Message 类型扩展 `type` 字段路由渲染：
- `scene-transition` → SceneTransitionCard（selectScene 触发）
- `day-change` → DayCard（advanceTime 跨天触发）
- NPC 消息带 `character` 字段 → 28px 圆形头像气泡

## Analytics 集成

- `trackGameStart` / `trackModeSelect` → App.tsx 开场
- `trackGameContinue` → App.tsx 继续游戏
- `trackTimeAdvance` / `trackChapterEnter` → store.ts advanceTime
- `trackEndingReached` → store.ts checkEnding
- `trackSceneUnlock` → store.ts selectScene/advanceTime

[PROTOCOL]: 变更时更新此文件，然后检查子目录 CLAUDE.md
