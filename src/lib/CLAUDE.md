# lib/
> L2 | 父级: /CLAUDE.md

恋综模拟器核心逻辑层 — 剧本直通 + UI薄层 + 状态管理 + AI通信 + 文本解析 + 埋点 + 音频。

## 成员清单

```
script.md     : 剧本直通：五模块原文（故事线/机制/人物/场景/道具），?raw import 注入 prompt
data.ts       : UI 薄层：类型 + 10角色(portrait单字段) + 8场景 + 8道具 + 6章节 + 7事件 + 6结局 + STAT_METAS(4维relation)
store.ts      : 状态中枢：Zustand + 剧本直通(GAME_SCRIPT) + 富消息注入 + 选项提取 + 抽屉状态 + 双轨解析 + 存档
parser.ts     : AI 回复解析：parseStoryParagraph(Markdown+角色着色+数值着色) + extractChoices(1-4选项提取)
analytics.ts  : Umami 埋点：lz_ 前缀事件
stream.ts     : ☆ SSE 流式通信（零修改模板）
bgm.ts        : ☆ 背景音乐单例 + useBgm hook（零修改模板）
hooks.ts      : ☆ useMediaQuery + useIsMobile（零修改模板）
```

## 依赖关系

```
script.md  ← store.ts (?raw import)
data.ts    ← store.ts (重导出全部), parser.ts 不导入 data.ts (避免循环)
store.ts   ← App.tsx, 所有组件 (单一导入源，重导出 data + parser)
stream.ts  ← store.ts
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
