# lib/
> L2 | 父级: /CLAUDE.md

恋综模拟器核心逻辑层 — 数据定义、状态管理、AI 通信、文本解析、高光生成、埋点统计、音频控制。

## 成员清单

```
data.ts       : 类型定义 + 游戏常量(10角色/8场景/8道具/6章节/7强制事件/6结局/6时段) + 工具函数
store.ts      : Zustand 状态管理, 重导出 data.ts 全部符号, buildSystemPrompt/parseStatChanges 核心逻辑
stream.ts     : SSE 流式通信, streamChat(流式) + chat(一次性), 连接 Cloudflare Worker 代理
parser.ts     : AI 回复文本解析器, parseStoryParagraph/parseInlineContent, 角色配色+数值变化高亮
highlight.ts  : 高光时刻 API, analyzeHighlights(AI分析) + generateImage(Seedream) + generateVideo(Seedance)
analytics.ts  : Umami 埋点, lz_ 前缀事件(game_start/time_advance/mode_select/chapter_enter/ending_reached)
bgm.ts        : 背景音乐单例 + useBgm hook
hooks.ts      : useMediaQuery + useIsMobile 响应式 hooks
```

## 依赖关系

```
data.ts  ← parser.ts, highlight.ts, store.ts
store.ts ← App.tsx, 所有组件 (重导出 data.ts, 单一导入源)
stream.ts ← store.ts, highlight.ts
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
