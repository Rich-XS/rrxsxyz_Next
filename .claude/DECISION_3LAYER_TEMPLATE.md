# 三层决策落实标准模板

**创建时间**: 2025-10-17
**目标**: 确保所有重要决策在 Layer 1/2/3 全部落实，避免"记录了但没执行"的问题

---

## 📋 适用场景

当用户提出以下类型的需求时，**必须**使用本模板：

1. ✅ 规则变更（` !规则变更` / ` !请长期记忆`）
2. ✅ 工作流优化（` !工作流优化`）
3. ✅ 强制执行要求（"以后每次都..."、"必须..."、"不允许..."）
4. ✅ Agent 行为调整（` !Agent更新`）
5. ✅ 自动化需求（"自动..."、"每次自动..."）

---

## 🎯 三层决策模型

| Layer | 名称 | 文件 | 作用 | 验证方法 |
|-------|------|------|------|---------|
| **Layer 1** | Decision Record | `progress.md` | 记录决策历史 | 搜索决策编号 |
| **Layer 2** | Documentation | `CLAUDE.md` / 模块化文档 | 指导人类/AI理解 | 关键词搜索 |
| **Layer 3** | Agent Execution | Agent 配置 / 自动化脚本 | 强制执行逻辑 | 触发测试 |

**核心原则**: Layer 1 记录"做了什么决策"，Layer 2 记录"为什么这样做"，Layer 3 记录"如何自动执行"

---

## 📝 用户 Prompt 标准范例

### 范例1: 强制执行类决策

**❌ 错误 Prompt（容易被遗忘）**:
```
"以后完成任务后要记得备份文件。"
```

**✅ 正确 Prompt（三层验证）**:
```
!规则变更 请实施以下决策，并确保三层同步：

【决策内容】
- 每次完成 P0/P1 任务后，必须自动执行版本备份
- 备份文件格式：<任务名称>_YYYYMMDD_HHMMSS.zip
- 保存到 backups/ 目录

【三层验证要求】
1. Layer 1（progress.md）：记录决策编号、内容、触发条件
2. Layer 2（CLAUDE.md 或相关模块文档）：记录规则说明、使用场景
3. Layer 3（Agent 配置 或 自动化脚本）：实现自动触发逻辑

【验收标准】
- 提供决策编号（D-XX）
- 列出更新的文件和具体行号
- 提供触发测试方法（如何验证这个规则被执行）
- 回答：下次我说"任务完成"时，你会做什么？（期望回答：先备份，再记录）
```

---

### 范例2: Agent 行为调整

**❌ 错误 Prompt**:
```
"progress-recorder agent 应该在记录任务时检查是否有备份文件。"
```

**✅ 正确 Prompt**:
```
!Agent更新 请调整 progress-recorder agent，并确保三层同步：

【调整内容】
- progress-recorder agent 在记录"任务完成"时，必须先检查是否已创建备份
- 如果没有备份，先调用 Bash 工具执行 autoBackup.js
- 备份成功后再更新 progress.md

【三层验证要求】
1. Layer 1（progress.md）：记录 Agent 行为调整决策
2. Layer 2（.claude/agent_config.md）：更新 Agent 职责说明
3. Layer 3（.claude/agents/progress-recorder.md）：修改 Agent 提示词，添加备份检查逻辑

【验收标准】
- 提供 Agent 配置文件的 diff（修改了哪些行）
- 模拟测试：当用户说"XX任务已完成"时，Agent 的执行步骤是什么？
- 提供失败处理逻辑：如果备份失败怎么办？
```

---

### 范例3: 工作流优化

**❌ 错误 Prompt**:
```
"以后生成截图后要自动生成 Markdown 报告。"
```

**✅ 正确 Prompt**:
```
!工作流优化 请优化截图生成流程，并确保三层同步：

【优化内容】
- 每次执行 npm run screenshot:duomotai 后，自动生成 Markdown 报告
- 报告包含：生成时间、成功/失败统计、所有截图预览
- 报告路径：duomotai/screenshots/SCREENSHOTS_REPORT.md

【三层验证要求】
1. Layer 1（progress.md）：记录工作流优化决策
2. Layer 2（docs/IMAGE_GENERATION_CAPABILITY.md）：更新使用文档，说明自动报告功能
3. Layer 3（scripts/generateDuomotaiScreenshots.js）：修改脚本，添加报告生成逻辑

【验收标准】
- 提供脚本修改的 diff
- 实际执行一次，展示生成的报告文件
- 说明：如果报告生成失败，是否阻塞整个流程？
```

---

## 🔍 Claude Code 执行清单

当收到用户的三层同步 Prompt 时，Claude Code 必须按以下步骤执行：

### Step 1: 确认理解（1分钟内回复）

```markdown
✅ 已理解您的三层同步决策需求！

【决策内容】
- [复述用户的决策内容]

【三层同步计划】
1. Layer 1（progress.md）：记录 D-XX 决策
2. Layer 2（[文件名]）：更新 [具体区块]
3. Layer 3（[文件名]）：实现 [自动化逻辑]

【预计影响】
- 涉及文件：[列出所有需要修改的文件]
- 预计代码行数：[估算]
- 是否需要新建脚本：[是/否]

【验收方式】
- 触发测试：[如何测试这个规则被执行]

请确认后我开始执行。
```

---

### Step 2: 执行 Layer 1（记录决策）

```bash
# 调用 progress-recorder agent
Task tool: progress-recorder

提示词：
"请记录以下决策到 progress.md Decisions 区块：

[决策内容]

决策编号：D-XX
决策时间：2025-10-17 HH:mm
优先级：P0/P1/P2
影响范围：[说明]
"
```

**验证**：读取 progress.md，确认决策已记录

---

### Step 3: 执行 Layer 2（更新文档）

```bash
# 更新相关文档
Edit/Write tool:

文件：CLAUDE.md 或 .claude/agent_config.md 或其他模块文档
修改内容：[根据决策类型更新相应区块]
```

**验证**：使用 Grep 工具搜索关键词，确认文档已更新

---

### Step 4: 执行 Layer 3（实现自动化）

**4.1 如果需要新建脚本**：
```javascript
// 创建自动化脚本
Write tool: scripts/xxx.js

// 添加 npm 命令
Edit tool: package.json
"scripts": {
    "xxx": "node scripts/xxx.js"
}
```

**4.2 如果需要修改 Agent 配置**：
```markdown
Edit tool: .claude/agents/xxx.md

添加触发逻辑：
"当用户说 [...] 时，必须先执行 [...]，然后 [...]"
```

**验证**：实际触发一次，确认自动化逻辑生效

---

### Step 5: 三层验证总结

```markdown
✅ 三层同步完成！

【Layer 1 - Decision Record】
- 文件：progress.md
- 决策编号：D-XX
- 记录行号：[具体行号]

【Layer 2 - Documentation】
- 文件：[文件名]
- 更新区块：[区块名称]
- 修改行号：[具体行号]

【Layer 3 - Agent Execution】
- 文件：[Agent 配置文件 或 自动化脚本]
- 实现方式：[说明]
- 触发条件：[列出所有触发条件]

【触发测试】
- 测试命令：[提供测试命令]
- 预期结果：[说明预期行为]

【验证问题（请回答）】
Q: 下次我说"[触发关键词]"时，你会做什么？
A: [Claude Code 回答预期执行步骤]
```

---

## 🎯 常见决策类型的三层映射

### 类型1: 强制执行规则

| Layer | 文件 | 更新内容 |
|-------|------|---------|
| Layer 1 | `progress.md` | Decisions 区块，记录决策编号和内容 |
| Layer 2 | `CLAUDE.md` 或 `.claude/workflow_rules.md` | 工作流规范区块，说明规则细节 |
| Layer 3 | Agent 配置 或 自动化脚本 | 添加触发检查逻辑 |

**示例**：D-35 版本备份规则、D-53 决策分类规则

---

### 类型2: Agent 行为调整

| Layer | 文件 | 更新内容 |
|-------|------|---------|
| Layer 1 | `progress.md` | Decisions 区块，记录 Agent 调整内容 |
| Layer 2 | `.claude/agent_config.md` | Agent 职责说明区块 |
| Layer 3 | `.claude/agents/[agent-name].md` | Agent 提示词，修改执行逻辑 |

**示例**：progress-recorder 备份检查、Explore agent 搜索优先级

---

### 类型3: 自动化功能

| Layer | 文件 | 更新内容 |
|-------|------|---------|
| Layer 1 | `progress.md` | Decisions 区块，记录功能需求 |
| Layer 2 | `docs/[功能名称]_GUIDE.md` | 创建使用文档 |
| Layer 3 | `scripts/[功能名称].js` + `package.json` | 实现自动化脚本 + npm 命令 |

**示例**：autoBackup.js、imageGenerator.js

---

## ⚠️ 常见错误与避免方法

### 错误1: 只记录在 Layer 1，没有执行 Layer 3

**症状**：
- progress.md 里记录了决策
- CLAUDE.md 也更新了说明
- 但下次触发时，Claude Code 还是忘记执行

**根因**：Layer 3（Agent 配置/自动化脚本）未实施

**避免方法**：
- 用户 Prompt 必须明确要求"三层同步"
- Claude Code 必须提供 Layer 3 的触发测试方法
- 验收时实际触发一次，确认生效

---

### 错误2: Agent 配置更新了，但没有测试验证

**症状**：
- `.claude/agents/xxx.md` 已修改
- 但实际触发时 Agent 行为未改变

**根因**：Agent 提示词修改不正确，或触发条件写得不够明确

**避免方法**：
- 修改 Agent 配置后，必须模拟测试（在对话中实际触发）
- 提供"验证问题"：下次我说 X 时，你会做 Y 吗？
- 如果 Agent 行为未改变，检查提示词是否使用了明确的"必须"、"禁止"等强制词汇

---

### 错误3: 忘记更新 package.json

**症状**：
- 创建了自动化脚本 `scripts/xxx.js`
- 但用户无法通过 `npm run xxx` 调用

**根因**：忘记在 `package.json` 的 `scripts` 区块添加命令

**避免方法**：
- 每次创建新脚本，必须同时更新 `package.json`
- 在 Layer 3 验证中，提供 npm 命令示例
- 实际执行一次 `npm run xxx`，确认命令可用

---

## 📚 参考案例

### 案例1: D-35 版本备份规则（完整三层同步）

**用户 Prompt（2025-10-10）**:
```
!规则变更 以后完成 P0/P1 任务后，必须自动执行版本备份，确保三层同步。
```

**Layer 1（progress.md）**:
```markdown
## Decisions

### D-35 任务完成自动备份规则 (2025-10-10)
- P0/P1 任务完成后，自动执行版本备份
- 备份文件格式：<任务名称>_YYYYMMDD_HHMMSS.zip
- 保存到 backups/ 目录
```

**Layer 2（CLAUDE.md）**:
```markdown
## 备份策略

- 修改HTML前自动备份
- **P0/P1 任务完成后自动执行版本备份（D-35 决策）**
```

**Layer 3（2025-10-17 补充实施）**:
```javascript
// scripts/autoBackup.js
class AutoBackup {
    createBackup(options) { /* ... */ }
}

// package.json
"scripts": {
    "backup:auto": "node scripts/autoBackup.js"
}
```

**缺陷**：初始实施时缺少 Layer 3，导致规则未自动执行

**补救**：2025-10-17 RCCM 分析 + D-71 决策，创建 autoBackup.js 脚本

---

### 案例2: D-53 决策分类与层级映射（完整三层同步）

**用户 Prompt（2025-10-12）**:
```
!规则变更 建立决策分类系统，确保一次决策，三层同步。
```

**Layer 1（progress.md）**:
```markdown
### D-53 决策分类与层级映射 (2025-10-12)
- 规则变更 → CLAUDE.md + agent 配置
- 架构调整 → architecture_guide.md
- 工作流优化 → workflow_rules.md + agent 配置
- ...
```

**Layer 2（CLAUDE.md）**:
```markdown
## 📋 决策分类与层级映射

| 决策类型 | 触发关键词 | Layer 1 | Layer 2 | Layer 3 |
|---------|----------|---------|---------|---------|
| 规则变更 | !规则变更 | progress.md | CLAUDE.md | agent 配置 |
| ...
```

**Layer 3（.claude/agent_config.md）**:
```markdown
## progress-recorder Agent 配置

当用户说"!规则变更"时：
1. 记录到 progress.md Decisions 区块
2. 提示用户更新 CLAUDE.md
3. 检查是否需要更新 Agent 配置
```

**成功点**：D-53 决策完整实施了三层同步，成为后续决策的标准模板

---

## ✅ 验收清单（用户检查）

当 Claude Code 完成三层同步后，用户应检查：

### 基础验收

- [ ] Layer 1（progress.md）：搜索决策编号，确认已记录
- [ ] Layer 2（相关文档）：搜索关键词，确认已更新
- [ ] Layer 3（Agent 配置/脚本）：实际触发一次，确认自动执行

### 深度验收

- [ ] 提问：下次我说"[触发关键词]"时，你会做什么？
- [ ] 提问：如果 Layer 3 执行失败（如脚本报错），你会怎么办？
- [ ] 提问：这个决策的触发条件是什么？（应列出所有条件）
- [ ] 提问：这个决策涉及哪些文件？（应列出完整路径和行号）

### 可持续性验收

- [ ] 文档是否包含触发测试方法？
- [ ] npm 命令是否已添加（如适用）？
- [ ] 是否有故障排除指南（如适用）？
- [ ] 下次会话重新启动后，规则是否仍然生效？

---

## 🎯 最佳实践总结

1. **用户侧**：
   - 使用明确的触发关键词（!规则变更、!Agent更新、!工作流优化）
   - 明确要求"三层同步"
   - 提供具体的验收标准

2. **Claude Code 侧**：
   - 收到决策需求后，先回复"三层同步计划"
   - 按 Layer 1 → 2 → 3 顺序执行
   - 每层完成后验证，最后提供触发测试方法
   - 在总结中回答"验证问题"（下次我说X时，你会做Y）

3. **持续改进**：
   - 每次发现"记录了但没执行"的问题，立即 RCCM 分析
   - 补充 Layer 3 实施（脚本/Agent 配置）
   - 更新本模板，增加新的案例

---

**创建时间**: 2025-10-17 12:00
**文档版本**: v1.0
**维护者**: Claude Code (Night-Auth Mode)
**参考决策**: D-35, D-53, D-71
