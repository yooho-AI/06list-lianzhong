# 06list-lianzhong — 黄昏时分说爱你 · 恋综模拟器

React 19 + Zustand 5 + Immer + Vite 7 + Tailwind CSS v4 + Framer Motion + Cloudflare Worker

## 目录结构

```
worker/            - Cloudflare Worker API 代理 (1文件: index.js)
public/            - 静态资源 (audio/ + characters/ + scenes/ 占位)
src/
  main.tsx         - React 挂载入口
  App.tsx          - 根组件: StartScreen(双模式选择+10角色预览) + GameScreen(三栏) + EndingModal
  lib/             - 核心逻辑层 (8文件: data/store/stream/parser/highlight/analytics/bgm/hooks)
  components/game/ - 游戏 UI 组件 (5文件: dialogue/character/side/mobile/highlight)
  styles/          - 全局样式 (1文件: globals.css, lz-前缀, 粉紫综艺风)
```

## 架构决策

- **data/store 分离**: data.ts 定义类型+常量+工具函数, store.ts 管理状态+动作, store 重导出 data 全部符号
- **双模式单 store**: `playMode: 'liumei' | 'newcomer'` 标志位, 90% 逻辑共用, 仅 systemPrompt 和结局判定分支
- **动态角色名单**: 10 角色全部在 initGame 初始化, 通过 `joinDay <= currentDay` 过滤 UI 和 prompt 可见性
- **4 维数值**: affection / jealousy / disgust / reputation, 较模板新增 reputation(声望)
- **SSE 流式**: 通过 Cloudflare Worker 代理 → api.yooho.ai, 前端 stream.ts 处理
- **CSS 前缀**: `lz-` (恋综), 粉紫色调 #d946ef 主色

## 开发

```bash
npm run dev          # Vite 开发服务器
npm run build        # 生产构建
npx wrangler dev     # Worker 本地调试
```

[PROTOCOL]: 变更时更新此文件，然后检查子目录 CLAUDE.md
