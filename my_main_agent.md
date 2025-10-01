# 项目记忆规则

## 🎯 自动触发记录规则

**必须主动调用** progress-recorder agent 记录到 `progress.md`，触发条件：

### 1. 决策完成时
- 出现：`决定使用` / `最终选择` / `将采用` / `选用` / `确定`
- 示例：*"决定使用暗色模式作为主题色"*
- **立即记录**：设计决策、技术选型、架构方案
- **操作**：更新 progress.md Decisions 区块

### 2. 约束确立时
- 出现：`必须` / `不能` / `禁止` / `要求` / `强制`
- 示例：*"必须使用 iPhone 16 边框"*
- **立即记录**：项目约束、设计规范、技术限制
- **操作**：更新 progress.md Pinned 区块

### 3. 任务完成时
- 出现：`已完成` / `完成了` / `已实现` / `实现了` / `修复了` / `已创建`
- 示例：*"已完成首页界面设计"*
- **立即记录**：完成的功能、修复的问题、创建的文件
- **操作**：更新 progress.md Done 区块

### 4. 新任务产生时
- 出现：`需要` / `应该` / `计划` / `待办` / `TODO`
- 示例：*"需要添加动画效果"*
- **立即记录**：待办任务、优化点、未来计划
- **操作**：更新 progress.md TODO 区块

### 5. 需求变更时（重要：同时更新 CLAUDE.md）
- 出现：`需求更新` / `架构调整` / `变更` / `重构`
- 示例：*"需求更新：改为单页应用架构"*
- **立即记录**：变更内容、影响范围、变更原因
- **操作**：
  1. 更新 progress.md（Decisions + Notes）
  2. 更新 CLAUDE.md（架构设计、核心约束等相关章节）
  3. 在 CLAUDE.md 文件末尾添加/更新时间戳：`**Last Updated**: YYYY-MM-DD HH:MM`

### 6. 会话收尾时（用户准备关机）
- 出现：`>> wrap-up` / `准备关机` / `准备关闭` / `结束会话`
- **立即执行**：
  1. 调用 progress-recorder agent 生成会话总结
  2. 更新 progress.md 会话记录区块
  3. 检查是否需要归档（Done/Notes 超过100条时自动执行 `>> archive`）
  4. 回复：**"✅ 会话已总结完成，progress.md 已更新，可以安全关机"**

---

## 📋 记录指令（通过特定关键词触发）

使用以下**专用关键词**触发 progress-recorder agent，避免误触发：

| 触发词 | 功能 | 说明 |
|------|------|------|
| `>> record` | 增量合并记录 | 将当前对话的重要信息合并到 progress.md |
| `>> archive` | 快照归档 | 当 Notes/Done 超过 100 条时，归档到 progress.archive.md |
| `>> recap` | 项目回顾 | 读取 progress.md，总结项目状态、约束、待办 |
| `>> wrap-up` | 会话收尾 | 总结当前会话，更新 progress.md，确认可安全关机 |

**使用方式**：直接在对话中输入关键词即可，例如：
- 输入 `>> recap` - 执行项目回顾
- 输入 `>> record` - 记录当前进度
- 输入 `>> archive` - 归档历史记录
- 输入 `>> wrap-up` 或说"准备关机" - 会话收尾总结

---

## 📁 文件结构约定

```
project/
├── CLAUDE.md              # 本文件 - 记忆规则
├── progress.md            # 项目进度记录（活跃）
├── progress.archive.md    # 历史归档（冷存储）
└── [项目文件]
```

### progress.md 标准结构

**必须**包含以下区块（由 progress-recorder agent 自动维护）：

- **📌 Pinned** - 核心约束（受保护，不可随意修改）
- **🗒️ Decisions** - 决策记录（时间序列，只追加不修改）
- **📋 TODO** - 待办任务（带 #ID、优先级 P0-P3、状态 OPEN/DOING/DONE）
- **✅ Done** - 已完成任务（从 TODO 移动而来）
- **⚠️ Risks** - 风险记录
- **💭 Assumptions** - 假设条件
- **📝 Notes** - 临时记录、待确认事项
- **📚 Context Index** - 上下文索引（归档信息、关键文件）

> 💡 如果 progress.md 结构不符合标准，progress-recorder 会自动重构

---

## 🔄 工作流示例

### 典型对话流程
```
用户: "开发一个周末活动推荐APP"
  ↓
助手: [分析需求] → **触发记录** → 创建 progress.md
  ↓
用户: "改为暗色模式"
  ↓
助手: [执行修改] → **触发记录** → 更新 progress.md (Done + Notes)
  ↓
用户: 输入 "@recap"
  ↓
助手: [调用 progress-recorder] → 总结项目状态、约束、待办
  ↓
用户关闭会话，稍后重新打开
  ↓
用户: 输入 "@recap"
  ↓
助手: [读取 progress.md] → 无缝继续开发
```

---

## ⚡ 最佳实践

1. **每次重大操作后立即记录**，不要等到对话结束
2. **保持 progress.md 简洁**，超过 100 条 Notes/Done 时输入 `@archive`
3. **新会话开始时输入 `@recap`**，快速了解项目状态
4. **关键约束和决策必须记录**，即使看起来微不足道
5. **使用结构化格式**，便于未来的 AI 快速解析

---

## 🎨 当前项目信息

**项目名称**: RRXS.XYZ 个人品牌自媒体网站
**核心模块**:
- 百问自测系统（`html/projects/media-assessment-v4.html`）
- 多魔汰辩论系统（`duomotai/index.html`）
**技术栈**: React + Vite + Node.js + Express
**最后更新**: 2025-10-01
**当前状态**: 已完成 CLAUDE.md 创建，配置 progress-recorder agent

> 💡 提示：如果这是新会话，请输入 `@recap` 查看完整项目历史