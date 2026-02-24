# components/game/
> L2 | 父级: /CLAUDE.md

恋综模拟器游戏 UI 组件层 — PC 三栏布局 + 移动端自适应 + 高光弹窗。

## 成员清单

```
dialogue-panel.tsx   : 中间面板，场景背景 + 60%遮罩 + Chat Fiction 段落 + 流式显示 + 输入框 + 信笺(含subtitle)
character-panel.tsx  : 左侧面板 280px，场景卡片 + 角色立绘 + 简介 + 4数值条(好感/嫉妒/厌恶/声望) + 2x5角色选择(按joinDay过滤)
side-panel.tsx       : 右侧面板，图标导航栏 52px(🎒背包+💕关系) + 背包滑入面板 260px + 关系总览面板 260px
mobile-layout.tsx    : 移动端全屏布局，场景快速切换 + 底部输入 + Sheet抽屉(角色/背包/菜单) + 结局面板
highlight-modal.tsx  : 高光时刻弹窗，AI分析 + 生图 + 生视频，主色#d946ef
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
