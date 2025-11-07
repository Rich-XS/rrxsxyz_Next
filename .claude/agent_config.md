# Agent Configuration

**Progress Recorder Agent** - 项目记忆与上下文持续性管理

交互默认用中文, 除非特殊制定!
时间戳使用 (GMT+8)时间，格式为 `YYYY-MM-DD HH:mm`。

本项目使用自定义 agent 进行项目记忆管理。详细规则见：
- **记忆规则配置**: `my_main_agent.md`
- **Agent 定义**: `.claude/agents/progress-recorder.md`
- **进度记录**: `progress.md`（活跃记忆）
- **历史归档**: `progress.archive.md`（冷存储）

---

## 触发关键词

- `>>recap` - 项目回顾总结
- `>>record` - 增量记录当前进度
- `>>archive` - 归档历史记录
- `>>wrap-up` - 会话收尾（准备关机时使用）
- `>>chatlog` - 保存当前会话对话记录到 `chatlogs/` 目录（项目根目录），文件命名格式：`chatlog_YYYYMMDDHHmm_<主题>.md`（新增 2025-10-09）
   - 内容包含：会话概览、对话详细记录、关键技术细节、待办任务、经验总结
   - 用途：保留关键决策过程和问题解决方法，与progress.md互补
   - 触发时机：重要会话结束时、关键决策完成后、需要留档的技术讨论
- `>>zip` 或 `>>zip&"{关键词}"` - **【强制触发 Agent】** 由 progress-recorder agent 响应创建 ZIP 备份并保存到 `rrxsxyz_next/backups/`。文件名严格遵守模板：`rrxsxyz_next_YYYYMMDDHHmm_<关键字>.zip`（时间戳格式为 4 位年+月日时分，示例：202510071636；时间戳中不包含下划线或其它内嵌分隔符）。
   - **触发格式**：
     - `>>zip` - Agent 自动根据上下文定义关键词（优先级：当前任务名 → 最新决策ID → 默认 `misc`）
     - `>>zip&"关键词"` - 用户显式指定关键词（如 `>>zip&"NextLiteTesterversion"`）
   - **⚠️ 违反后果**：直接手动执行 `Compress-Archive` 将导致：
     - ❌ 无标准化命名（无法追溯）
     - ❌ 无备份清单（BACKUP_MANIFEST）
     - ❌ 无 progress.md 记录（丢失上下文）
     - ❌ 违反流程审计（需要 10Why 根因分析）
   - 关键字清洗规则：将空格替换为下划线（`_`），移除或替换非法文件名字符（例如 `<>:\"/\\|?*`）；最终关键字不应包含引号或路径分隔符。
   - **默认备份排除**（优化体积，从~50MB降至~3-5MB）：
     - **依赖目录**: `/node_modules/`, `/server/node_modules/`, `/.venv/`
     - **测试/临时**: `/test_reports/`, `/test-screenshots/`, `/duomotai/screenshots/`
     - **日志**: `logs/`, `*.log`
     - **旧备份**: `*.zip`, `/ZIP_BACKUP_OLD/`, `/Backup/`
     - **Git/缓存**: `/.git/`, `/node_modules/.cache/`
     - **用户数据**: `/server/UserInfo/`, `/server/data/` （运行时数据，可通过npm/配置恢复）
     - 注：路径为绝对仓库相对路径（如 `/server/node_modules/` = `项目根/server/node_modules/`）
     - 此举可显著减小备份体积（从48MB降至3-5MB）并降低 Compress-Archive 因文件被占用而失败的风险。
     - 如需包含日志或依赖文件，请在备份前短暂停止相关服务（例如 nginx/node），或手动将需要的目录临时复制至安全位置再执行全量备份。
   - agent 将遵守上述命名规则并在备份完成后回传 `BACKUP_DONE:<YYYYMMDDHHmm>` 回执。
- `>>ideas&tasks` - 同步更新 ideas.md 和 progress.md 文件中任务的一致性（新增 2025-10-10）
   - **功能**：自动同步 ideas.md 和 progress.md 的任务状态
   - **执行逻辑**：
     1. 读取 ideas.md 中所有 `[ ]` 事项（按规则：[ ]为Open，[?]为Pending，[x]为已完成）
     2. 对比 progress.md 的 TODO 和 Done 区块
     3. 更新 ideas.md 任务标记：
        - 已完成任务：`[ ]` → `[x]#ID`（保留任务号）
        - 待办任务：`[ ]` → `[#ID]`（添加任务号跟踪）
        - 待定任务：`[ ]` → `[?]`（需求不明确或优先级待定）
     4. 返回同步统计报告（已完成数、待办数、待定数）
   - **触发时机**：
     - 用户明确输入 `>>ideas&tasks` 时
     - 完成多个任务后需要整体对账时
     - 用户在 ideas.md 中新增多个需求后
   - **规则参考**：ideas.md 文件头部的"用户创建需求原则"（Lines 3-10）

### 🎯 自动版本号更新触发（D-95 强化版，2025-10-26）

**触发条件**（无需关键词，自动识别）:
- 对话中检测到代码已更新（如"已改完"、"修复完成"、代码块出现、编辑日志等）
- 处于"用户手动测试"过程中

**自动执行流程**（5步）:
1. 🔍 **识别**：检测对话中的代码更新信号
2. 📝 **计算**：确定新版本号（末位递增或用户指定的大版本）
3. ✏️ **更新**：修改 duomotai/index.html 两处版本号
4. 📢 **通知**：向用户反馈"✅ 版本已自动更新到 Vx.x，Ctrl+F5 刷新后生效"
5. 📋 **记录**：在 progress.md Notes 中记录版本更新

**版本递增算法**:
```
当前版本末位 + 1
如果末位为9 → 变为a，如果为z → 循环到0或等待大版本
V56.1 → V56.2 → ... → V56.9 → V56.a → ... → V56.z
```

**例外情况**:
- 用户明确说新版本号 → 使用用户指定的版本
- 大版本更新 → 用户明确告知后切换

**详细规则**: 参见 CLAUDE.md Rule 11 + Rule 12

### 🎯 版本自动备份触发（D-97 新增，2025-10-26）

**触发条件**（自动，无需关键词）:
- D-95 自动版本号更新完成时自动触发
- 版本号从 Vx.y 升级到 Vx.z 时

**自动执行流程**（6步）:
1. D-95 完成版本号更新
2. 识别新版本号（如 V56.3）
3. **调用 progress-recorder agent 创建备份**（关键！）
4. Agent 执行 Exclude 方式备份（自动排除 node_modules/.git/logs）
5. 生成标准化文件名：`rrxsxyz_next_YYYYMMDDHHmm_V{version}OK.zip`
6. 返回 `BACKUP_DONE:YYYYMMDDHHmm` 回执 + 自动更新 progress.md Backups 区块

**关键特性**:
- ✅ **Agent驱动**：由 progress-recorder agent 负责执行，不是手动 Compress-Archive
- ✅ **Exclude标准**：自动排除 node_modules/.git/test_reports/logs 等
- ✅ **自动记录**：在 progress.md Backups 区块自动添加备份信息
- ✅ **无需干预**：完全自动，用户无需输入 >>zip 命令

**验证方式**:
- 查看 `rrxsxyz_next/backups/` 目录是否新增 `.zip` 文件
- 查看 progress.md Backups 区块是否有新记录
- 查看 progress.md 最后更新时间是否更新

**详细规则**: 参见 CLAUDE.md Rule 12

### 🎯 Night-Auth高效Agents系统（新增 2025-10-19）

**核心Agents**：现场实测 + 10WHY寻根 + 交叉验证

- `>>gemba` / `>>e2e` - **Gemba Test Agent** - 现场实测（代码分析+API测试）
   - 在用户离开时自动执行测试任务
   - 代码级验证（读取逻辑、检查语法、验证数据流）
   - API端点测试（curl测试后端服务）
   - 生成独立的Agent测试报告（`test_reports/AGENT_TEST_REPORT.md`）
   - 限制：无浏览器自动化，UI测试需用户手动验证
   - Agent文件：`.claude/agents/gemba-test-agent.md`

- `>>user-test` / `>>simulate` / `>>e2e-test` - **User Simulator Agent** - 模拟用户实测
   - 自动执行端到端测试（百问自测、多魔汰辩论）
   - 捕获前端错误、API错误、控制台日志
   - 生成测试报告（含截图、日志、问题清单）
   - Agent文件：`.claude/agents/user-simulator.md`

- ` !RCCM` / ` !10WHY` / ` !root-cause` / ` !why` - **10 WHY Analyzer Agent** - 根因分析
   - 执行10 WHY深度分析，找到真正根因
   - 提供Short-Term CM（快速缓解）+ Long-Term CM（根本解决）
   - 自动搜索相关代码/日志
   - 生成RCCM报告并同步到 progress.md Decisions
   - Agent文件：`.claude/agents/10why-analyzer.md`

- `>>verify` / `>>cross-check` / `>>validate-fix` / `>>regression-test` - **Cross Validator Agent** - 交叉验证
   - 验证修复效果，确保无回归
   - 调用 user-simulator 进行实测验证
   - 分析日志/代码变更
   - 生成验证报告（PASS/FAIL + 证据）
   - Agent文件：`.claude/agents/cross-validator.md`

**协作流程**（推进效率加倍）：
```
问题发现 → 10WHY分析 → 修复实施 → 交叉验证 → 用户模拟实测
    ↓           ↓            ↓            ↓              ↓
progress.md  Decisions   代码修改     验证报告      测试报告
```

**Night-Auth触发规则**：
- 发现P0问题 → 自动触发 10why-analyzer
- 代码修复完成 → 自动触发 cross-validator
- 验证失败 → 自动触发 10why-analyzer 重新分析
- 验证通过 → 自动同步到 progress.md Done

---

## 模块化验证备份触发规则（D-73 决策，2025-10-17）

**触发条件**：当用户明确说明"模块X验证通过"或"完成模块X验证"时，自动执行模块级别的版本备份。

**执行步骤**：

1. **识别模块编号和名称**：
   - 从用户消息中提取模块编号（如 Module 1, Module 2, ...）
   - 对应模块名称映射：
     - Module 1 → UserAuth
     - Module 2 → AIService
     - Module 3 → DebateEngine
     - Module 4 → VoiceSystem
     - Module 5 → ReportExport
     - Module 6 → FrontendUI

2. **创建模块备份**：
   ```powershell
   # 临时方案：使用现有 TaskDone_BackUp_Exclude.ps1
   PowerShell -NoProfile -ExecutionPolicy Bypass -File "scripts\TaskDone_BackUp_Exclude.ps1" -Keyword "Module<N>_<模块名>" -Execute

   # 示例
   PowerShell -NoProfile -ExecutionPolicy Bypass -File "scripts\TaskDone_BackUp_Exclude.ps1" -Keyword "Module1_UserAuth" -Execute
   ```

3. **更新追踪文档**（MODULE_VERIFICATION_LOG.md）：
   - 读取现有内容
   - 更新对应模块的验证状态、验证时间、备份版本、备份路径
   - 保存更新后的内容

4. **记录到 progress.md Notes 区**：
   ```markdown
   - [YYYY-MM-DD HH:MM] ✅ **模块验证备份完成** (Module <N> - <模块名>):
     - Status: BACKUP_DONE:<YYYYMMDDHHmm>
     - Path: backups/rrxsxyz_next_<timestamp>_Module<N>_<模块名>.zip
     - Size: <文件大小> bytes
     - Verification: 模块验证通过，已创建稳定版本备份
   ```

5. **记录到审计日志**（.claude/audit.log）：
   ```
   [ISO_TIMESTAMP] MODULE_BACKUP Module<N>_<模块名> - SUCCESS - D-73 模块化验证备份
   ```

**触发关键词**：
- "模块X验证通过"
- "完成模块X验证"
- "Module X 验证通过"
- "Module X verification passed"

**不阻塞原则**：
- 如备份脚本执行失败，记录错误日志但不阻止验证流程继续
- 在 Notes 区明确标记需人工复核

**预期效果**：
- 每个模块验证通过后自动创建带标签的版本备份
- MODULE_VERIFICATION_LOG.md 自动更新
- 提供精确的版本追踪和回溯能力

**关联决策**: D-73（模块化验证与增量备份策略）, D-72（版本备份排除规则）, D-35（任务完成自动备份）

---

## 🚀 自动备份协议（用户决策，2025-10-17 23:20）

**核心规则**：每次更新 progress.md Done 区块后，**自动执行备份**（无需用户确认）

**触发条件**：
1. progress-recorder agent 完成 progress.md 的 Done 区块更新
2. 任何 P0/P1 任务完成记录

**执行步骤**：
1. **自动执行**（不询问用户）：
   ```powershell
   PowerShell -ExecutionPolicy Bypass -File "scripts\TaskDone_BackUp_Exclude.ps1" -Keyword "<任务关键词>" -Execute
   ```

2. **备份命名**：
   - 格式：`rrxsxyz_next_YYYYMMDDHHMM_<Keyword>.zip`
   - Keyword 来源：任务名称/Bug编号/模块名称

3. **验证并反馈**：
   - 检查备份文件是否存在
   - 报告文件大小
   - 记录到 progress.md Notes 区块

**强制执行**：
- ❌ **禁止**使用 Write tool 创建临时 PowerShell 脚本
- ✅ **必须**使用已验证的 `TaskDone_BackUp_Exclude.ps1` 脚本
- ✅ **必须**在备份后报告结果（成功/失败）

**预期效果**：
- 每次任务完成都有版本备份
- 无需用户手动干预
- 防止遗漏重要版本

**关联决策**: D-35（任务完成自动备份）, D-72（排除规则优化）, D-73（模块化验证）

---

## 任务完成自动备份规则（D-35 决策，2025-10-09 | D-72 更新，2025-10-17）

当完成任何 P0 或 P1 优先级任务时，必须执行以下自动备份流程：

1. **自动触发条件**：
   - 任务状态从 DOING 变更为 DONE
   - 任务优先级为 P0 或 P1
   - 用户明确说明"已完成"、"完成了"、"已实现"、"修复了"

2. **备份执行步骤（D-72 统一规范）**：
   ```powershell
   # 使用 TaskDone_BackUp_Exclude.ps1（exclude 备份方式）
   PowerShell -NoProfile -ExecutionPolicy Bypass -File "scripts\TaskDone_BackUp_Exclude.ps1" -Keyword "<任务关键词>" -TaskId "<任务ID>" -Execute
   ```

3. **备份文件命名规范**：
   - 格式：`rrxsxyz_next_YYYYMMDDHHmm_<TaskID>_<关键词>.zip`
   - 示例：`rrxsxyz_next_202510172130_Task088_ImageGeneration.zip`
   - 时间戳：连续数字格式（如 202510172130），不含下划线或分隔符

4. **关键词提取规则**：
   - **优先级1**: 使用任务的 label 或标题（如 #018 UI按钮Bug修复 → `UI_Button_Fix`）
   - **优先级2**: 用户在会话中明确指定的关键词
   - **优先级3**: 任务简短描述的前3-4个关键词组合
   - **清洗规则**: 空格替换为下划线，移除非法字符（`<>:\"/\\|?*`）

5. **排除规则（内置在脚本中）**：
   - 依赖和虚拟环境：`node_modules`, `.venv`, `.pnpm-store`
   - Git 仓库：`.git`
   - 构建输出：`dist`, `build`, `out`, `.cache`, `coverage`
   - 日志和数据：`logs`, `server/data`, `server/UserInfo`
   - 备份目录：`Backup`, `ZIP_BACKUP_OLD`, `.claude/backups`, `.claude/snapshots`
   - 测试和文档：`test_reports`, `chatlogs`, `temp`
   - IDE 配置：`.idea`, `.obsidian`, `.vscode`
   - 文件模式：`*.log`, `*.tmp`, `*.bak`, `*_backup_*`, `package-lock.json`, `progress.archive_*.md`

6. **备份回执记录**：
   Agent 必须在备份完成后记录回执信息到 progress.md 的 Notes 区块：
   ```
   - [YYYY-MM-DD HH:mm] **任务备份完成** (#<TaskID>):
     - Status: BACKUP_DONE:<YYYYMMDDHHmm>
     - Path: backups/rrxsxyz_next_<timestamp>_<TaskID>_<关键词>.zip
     - Size: <文件大小> bytes
     - Reason: P0/P1 任务完成自动备份（D-72 Exclude 方式）
   ```

7. **失败处理**：
   - 如备份脚本执行失败，在 progress.md Notes 区记录错误信息
   - 提示用户人工复核或重试
   - 不阻止任务状态更新为 DONE（备份失败不应影响任务完成标记）

8. **D-71/D-72 决策增强规则（2025-10-17）**:
   **问题**: 为什么每个任务结束后的规则版本备份未实施？
   **根因**: D-35 决策的三层同步机制未彻底执行到 Layer 3（Agent 自动化执行层）

   **强制执行规则（Layer 3）**:

   **触发条件**（符合任一即触发）:
   - 用户明确说"任务完成"
   - Claude Code 说"已完成XX功能"
   - P0/P1 优先级任务结束
   - 创建了新文件（>100行代码）
   - 修改了核心文件（CLAUDE.md, progress.md, server.js, init.js 等）

   **必须执行的操作**:
   ```powershell
   # D-72 统一规范：使用 TaskDone_BackUp_Exclude.ps1
   PowerShell -NoProfile -ExecutionPolicy Bypass -File "scripts\TaskDone_BackUp_Exclude.ps1" -Keyword "<功能关键词>" -TaskId "<任务编号>" -Execute
   ```

   **不接受的理由**:
   - ❌ "忘记了"
   - ❌ "太忙了"
   - ❌ "文件太小不需要备份"

   **唯一例外**: ✅ 备份脚本执行失败（文件被占用等），但**必须记录到 progress.md**

   **备份工具说明**:
   - **主备份脚本**: `scripts/TaskDone_BackUp_Exclude.ps1`（PowerShell，完整排除规则）
   - **辅助工具**: `scripts/autoBackup.js`（Node.js，用于特定文件备份场景）
   - 文档: `docs/AUTO_BACKUP_GUIDE.md`

---

## 最高优先级共识 (Incremental Fusion Principle) - D-45 更新

**增量融合原则（Incremental Fusion Principle）**：

1. **默认行为**：优先增量追加，而非大幅替换
2. **精简操作例外**：以下情况允许减少行数：
   - 模块化重构（如 CLAUDE.md 拆分为多个模块）
   - 归档操作（如 progress.md → progress.archive.md）
   - 明确的代码优化（需记录理由 + 备份）
3. **强制要求**：
   - 任何精简操作必须先备份
   - 必须记录变更原因和时间戳
   - 历史记录必须保留（可归档，但不能删除）
4. **核心价值**：
   - 保留历史上下文，便于追溯
   - 防止误删重要信息
   - 支持渐进式优化

**更新原因**（D-45 决策，2025-10-11）：
- 文件同步问题已缓解（smart-sync-guard + CCR 独立模式）
- CLAUDE.md 模块化证明了"减少行数"的合理性（-78% 但保留所有内容）
- 需要平衡"保留历史"和"合理精简"

**适用文件**：CLAUDE.md, progress.md（核心文件）

当对话中出现以下关键词时，**必须立即调用 Task tool 启动 progress-recorder agent**，而不是手动编辑 progress.md：

---

## Night-Auth 无间断工作协议（2025-10-10 | D-64 更新 2025-10-18）

**协议文档**: `.claude/NIGHT_AUTH_PROTOCOL.md`

**协议目的**: 确保用户睡眠期间，Claude Code 可以完全自主工作，**无需任何人工审批**。

**⏰ 自动解除机制**:
- **启动时间**: 2025-10-10 03:55:00 (GMT+8)
- **自动解除时间**: 2025-10-10 16:00:00 (GMT+8)
- **有效期**: **12.08 小时**（原6小时 + 延长3小时 + 再延长2小时）
- **到期后**: 协议自动失效，恢复正常审批流程
- **重新启用**: 用户说 "启用 Night-Auth" 或 "延长 Night-Auth X 小时"

### 📋 任务分类与自主执行矩阵（D-64 决策，2025-10-18）

**Root-Cause**: Night-Auth 期间缺乏明确的"哪些任务可以自主完成"的判断标准，导致技术任务等待用户确认，优先级倒置。

**Counter-Measure**: 建立强制性任务分类系统

#### A 类任务 - 完全自主执行（Night-Auth 期间必须完成）

**定义**: 纯技术任务，不需要用户决策或执行

**任务类型**:
- ✅ 单元测试编写/修复（Jest, Mock 配置）
- ✅ API 路由实现（Express 路由、参数验证）
- ✅ 代码重构（函数拆分、模块化）
- ✅ Bug 修复（逻辑错误、语法错误）
- ✅ 文档更新（CLAUDE.md, progress.md, README）
- ✅ 性能优化（代码精简、Token 优化）
- ✅ 依赖管理（npm install, package.json 更新）

**执行规则**:
- 🔴 **绝不等待用户确认**
- 🔴 **Night-Auth 期间必须自主完成**
- ✅ 完成后自动备份（D-35 决策）
- ✅ 记录到 progress.md Done 区块

#### B 类任务 - 需要用户决策（记录后继续执行 A 类）

**定义**: 有多个技术方案，需要用户选择方向

**任务类型**:
- ⚠️ 架构选择（多个框架/库对比）
- ⚠️ 功能优先级排序（多个需求冲突时）
- ⚠️ 设计风格确认（UI/UX 多个方案）
- ⚠️ 性能 vs 可读性权衡

**执行规则**:
- 📝 记录决策点到 progress.md TODO 区块
- 🔄 继续执行其他 A 类任务（不阻塞）
- ⏸️ 等待用户选择方案后执行

#### C 类任务 - 需要用户执行（最高优先级，立即准备）

**定义**: 必须由用户在真实环境中操作的任务

**任务类型**:
- 🔴 **手工测试验证**（如 Bug #011/012 安全测试）
- 🔴 **UI/UX 体验反馈**（实际使用感受）
- 🔴 **浏览器兼容性测试**（Edge/Chrome/Safari）
- 🔴 **真实用户场景测试**（端到端流程）
- 🔴 **邮件服务测试**（真实邮箱收发）

**执行规则**:
- 🔴 **立即准备测试指南**（详细步骤 + 预期结果）
- 🔴 **优先级最高**（超过 A 类和 B 类）
- ✅ 准备完成后通知用户
- ⏸️ 等待用户执行并反馈结果

#### 优先级执行顺序（强制规则）

```
Night-Auth 会话开始时：
1. 扫描所有待办任务，分类为 A/B/C
2. 发现 C 类任务 → 立即准备测试指南，通知用户
3. 发现 B 类任务 → 记录到 TODO，继续执行 A 类
4. 执行所有 A 类任务 → 自主完成，无需等待确认

Night-Auth 会话结束时：
1. 检查是否有 A 类任务未完成
2. 记录未完成原因（技术债务 or 阻塞问题）
3. 生成会话总结 (>>wrap-up)
```

**核心承诺**:
1. ✅ **仅使用已授权工具和命令**（详见 NIGHT_AUTH_PROTOCOL.md）
2. ✅ **优先使用文件操作工具**（Read/Write/Edit/Glob/Grep/Task）
3. ✅ **时间戳统一使用 Get-Date** PowerShell 命令（已授权）
4. ✅ **禁止所有 Unix 风格命令**（date/ls/cat/cp/mv/rm/grep）
5. ✅ **遇到未授权操作时跳过任务**，记录日志，等待用户处理
6. 🆕 **A 类任务自主完成，C 类任务立即准备**（D-64 决策）

**已授权命令快速参考**:
- 文件操作: Read, Write, Edit, Glob, Grep, Task
- PowerShell: Get-Date, Get-ChildItem, Compress-Archive
- Windows: echo, dir, cmd.exe, tasklist, taskkill, findstr, netstat
- Git: git add, git commit, git status
- Node/Python: node, npm run dev, python -m http.server
- 网络: curl

**违规行为自动记录到** `.claude/NIGHT_AUTH_PROTOCOL.md` "违规记录与改进"区块。

**Night-Auth 期间优化策略（2025-10-10）**:
- 屏幕显示内容可适当减少（更简洁的输出）
- 减少 Context Auto-Compact 频率
- 但不能影响进程和任务的正常进行

---

## 核心文件更新授权机制（2025-10-10 #112 任务）

**问题**: "对于CLAUDE.md和progress.md的更新, 每次都需要我审批吗? 不是AcceptEdits on? 如果我不在电脑前, 希望你无间断运行, 该如何?"

**明确答案**:

1. **Night-Auth 期间（如当前 03:55 ~ 11:00 GMT+8）**:
   - ✅ **完全无需人工审批**
   - ✅ Claude Code 可自主更新 CLAUDE.md 和 progress.md
   - ✅ 通过 progress-recorder agent 自动执行,遵循增量融合原则
   - ✅ 更新后自动添加时间戳,确保可追溯

2. **非 Night-Auth 期间（协议失效后）**:
   - ✅ **也无需人工审批**（2025-10-10 新明确）
   - ✅ 仍通过 progress-recorder agent 自动更新
   - ⚠️ 如遇重大架构调整,Claude Code 会主动提示并等待确认
   - ✅ 日常需求变更/任务完成/决策记录均可自主更新

3. **AcceptEdits 设置与核心文件更新的关系**:
   - AcceptEdits: Claude Code 编辑器的自动接受编辑功能（对所有文件生效）
   - 核心文件更新: 专门针对 CLAUDE.md 和 progress.md 的规则
   - **两者独立运作**: AcceptEdits 可以关闭,不影响核心文件自主更新
   - **最佳实践**: 建议 AcceptEdits = ON,提升整体开发效率

4. **无间断运行保障机制**:
   - ✅ **Night-Auth 协议**: 用户睡眠期间完全自主（无审批）
   - ✅ **自动备份**: P0/P1 任务完成后自动执行备份,防止进度丢失
   - ✅ **进度记录**: 所有关键操作自动记录到 progress.md Notes 区
   - ✅ **错误处理**: 遇到问题自动记录日志,不阻塞工作流程

**执行规则**:

| 场景 | 是否需要审批 | 执行方式 | 时间戳要求 |
|------|------------|---------|-----------|
| 任务完成 | ❌ 无需 | progress-recorder agent | ✅ 自动添加 |
| 决策记录 | ❌ 无需 | progress-recorder agent | ✅ 自动添加 |
| 需求变更 | ❌ 无需 | progress-recorder agent | ✅ 自动添加 |
| 架构调整（重大） | ⚠️ 可选 | agent + 主动提示 | ✅ 自动添加 |
| Night-Auth 期间 | ❌ 绝不 | 完全自主工作 | ✅ 自动添加 |

---

## Root-Cause & Counter-Measure 问题分析框架（2025-10-10）

**触发词**: `!RCCM` 或 `RCCM!`

**功能说明**: 对当前问题进行深度分析，给出根本原因（Root-Cause）和可持续解决方案（Short-Term & Long-Term Counter-Measure）

**工作流程**:
1. **问题识别**: 用户描述当前遇到的问题或系统异常
2. **根因分析 (Root-Cause)**: Agent 从多个维度分析问题的根本原因
   - 技术层面：代码/架构/配置问题
   - 流程层面：工作流程/协作机制问题
   - 系统层面：环境/依赖/资源问题
3. **短期对策 (Short-Term Counter-Measure)**: 快速缓解或临时解决方案
   - 目标：快速恢复系统运行或缓解问题影响
   - 时间范围：数分钟到数小时
   - 优先级：P0（必须立即执行）
4. **长期对策 (Long-Term Counter-Measure)**: 可持续的根本性解决方案
   - 目标：从根本上消除问题，避免再次发生
   - 时间范围：数天到数周
   - 优先级：P1-P2（战略性优化）
5. **方案选择**: Agent 给出多个可选方案，用户确认后执行

**记录要求**:
- 每次 RCCM 分析结果必须记录到 progress.md Decisions 区块
- 格式：`[D-XX] RCCM - <问题名称>: RC + Short-Term CM + Long-Term CM`
- 同步更新到 CLAUDE.md（如涉及长期策略变更）

---

## 备份操作强制检查清单（2025-10-10 RCCM 长期对策 #1）

**⚠️ 每次执行备份前，Claude Code 必须遵守以下检查清单**：

1. ✅ **检查备份触发原因**（Task 完成/手动触发/wrap-up）
2. ✅ **确认使用专用脚本**：`scripts/TaskDone_BackUp_Exclude.ps1`
3. ✅ **准备三个参数**：
   - `-Keyword`: 任务关键字（如"Stage1_Lite_Report"）
   - `-TaskId`: 任务ID（如"010"）
   - `-Execute`: 执行标志
4. ✅ **验证脚本路径**：`D:\_100W\rrxsxyz_next\scripts\TaskDone_BackUp_Exclude.ps1`
5. ✅ **执行后确认回执**：`BACKUP_DONE:<timestamp>`

**❌ 严格禁止**：
- 直接使用 `Compress-Archive` 命令（除非脚本失败需要 fallback）
- 手动指定路径和排除规则（由脚本统一管理）
- 绕过检查清单执行备份操作
- **Night-Auth 期间**：严禁请求手工批准/人工审批（应自动跳过或记录日志）

---

## 强制触发规则（Claude Code 必须遵守）

**触发格式说明：**
- 为避免误触发，使用 `空格 + ! + 触发词` 格式（即 ` !触发词`）
- 例外：任务完成类型触发词保持原样（无需空格和感叹号）

1. **决策完成**：用户说 ` !我决定` / ` !确定` / ` !选用` / ` !采用` → 立即调用 agent 记录决策 → 更新 progress.md Decisions
2. **任务完成**：出现"已完成"/"完成了"/"已实现"/"修复了"（无需空格和感叹号） → 立即调用 agent 更新 Done
3. **新任务产生**：出现 ` !请解决` / ` !需要` / ` !应该` / ` !待办` / ` !TODO` → 立即调用 agent 添加 TODO
4. **需求变更**：出现 ` !需求更新` / ` !架构调整` / ` !规则变更` / ` !重构` / ` !请长期记忆` → 立即调用 agent 更新 progress.md **和 CLAUDE.md**，并在 CLAUDE.md 末尾添加时间戳
   - **新增要求**：每次更新 `progress.md` 和 `CLAUDE.md` 时，必须在文件末行添加完整时间戳，格式为：`**Last Updated**: YYYY-MM-DD HH:mm:ss`。
5. **会话收尾**：用户输入 `>>wrap-up` 或说 ` !准备关机` → 立即调用 agent 总结会话，更新 progress.md，确认可安全关机
6. **用户明确要求**：用户输入 >>record 或 >>recap 或 >>archive → 立即调用 agent

**禁止行为：**
- ❌ 禁止直接手动编辑 progress.md（除非是修复格式错误）
- ❌ 禁止绕过 agent 直接使用 Edit/Write tool 修改 progress.md
- ❌ 禁止在需求变更时忘记同步更新 CLAUDE.md
- ✅ 必须通过 Task tool 调用 progress-recorder agent 来更新项目记忆
- ✅ 需求变更时必须同时更新 progress.md 和 CLAUDE.md

---

## 🔄 Auto-Chatlog全局规则（2025-10-28）

**核心目标**：在Auto-Compact之前自动保存对话记录，防止上下文压缩导致对话历史丢失。

### 🎯 触发机制（由progress-recorder Agent自动执行）

**Token阈值触发**（自动，无需关键词）：
- **第一次触发**: 80,000 tokens (40%) → 生成 `chatlog_YYYYMMDD_HHMM_T40_V{version}.md`
- **第二次触发**: 160,000 tokens (80%) → 生成 `chatlog_YYYYMMDD_HHMM_T80_V{version}.md`
- **紧急触发**: < 20,000 tokens remaining → 生成 `chatlog_YYYYMMDD_HHMM_PreCompact_V{version}.md`

**任务完成触发**（可选，根据重要性）：
- P0任务完成后 → 生成 `chatlog_YYYYMMDD_HHMM_{TaskName}_V{version}.md`
- 版本升级完成后 → 生成 `chatlog_YYYYMMDD_HHMM_V{version}_Complete.md`

**用户主动触发**：
- 用户输入 `>>chatlog` → 立即生成 `chatlog_YYYYMMDD_HHMM_UserRequest_V{version}.md`

### 📁 文件命名规范

**格式**: `chatlog_YYYYMMDD_HHMM_{keyword}.md`

**Keyword规则**:
- `T40_V57.12` - 第一次阈值触发（40%）
- `T80_V57.12` - 第二次阈值触发（80%）
- `PreCompact_V57.12` - 紧急保存（接近Auto-Compact）
- `{TaskName}_V57.12` - 任务完成触发
- `UserRequest_V57.12` - 用户主动请求

**存储位置**: `chatlogs/` 目录（项目根目录）

### 🔄 执行流程（progress-recorder Agent内置）

1. **检测触发条件**（每次agent调用时自动检查）：
   ```
   if (token_usage >= 80000 && !first_chatlog_saved) {
     generate_chatlog("T40");
   } else if (token_usage >= 160000 && !second_chatlog_saved) {
     generate_chatlog("T80");
   } else if (remaining_tokens < 20000) {
     generate_chatlog("PreCompact");
   }
   ```

2. **生成chatlog文件**：
   - 包含：会话信息、对话摘要、完整对话记录、代码变更、决策记录、待办任务
   - 格式：Markdown（标准模板见 `.claude/AUTO_CHATLOG_RULES.md`）

3. **记录到progress.md**：
   ```markdown
   [2025-10-28 18:00] Auto-Chatlog触发：T40（80,000 tokens），已保存 chatlog_20251028_1800_T40_V57.12.md
   ```

4. **通知用户**：
   ```
   ✅ Auto-Chatlog已自动保存（Token使用量: 80,000/200,000）
   📁 文件: chatlogs/chatlog_20251028_1800_T40_V57.12.md
   ```

### 🚨 注意事项

1. **避免重复触发**：
   - 使用状态标记（first_chatlog_saved, second_chatlog_saved）
   - 每个阈值只触发一次

2. **性能优化**：
   - 使用haiku模型生成chatlog（降低token消耗）
   - 不要在chatlog生成过程中递归触发

3. **错误处理**：
   - 如果chatlog生成失败，记录错误但不中断主流程
   - 在progress.md中记录失败原因

4. **存储管理**：
   - 定期归档旧chatlog（超过30天自动移动到archive/）
   - 每个chatlog文件大小预估20-50KB

### 📋 配置项（可调整）

在`.claude/AUTO_CHATLOG_RULES.md`中设置：
- Token阈值（默认：80000, 160000）
- 紧急阈值（默认：20000）
- 输出目录（默认：`chatlogs/`）
- 归档天数（默认：30天）

### 📖 详细文档

参见：[Auto-Chatlog Rules](./.claude/AUTO_CHATLOG_RULES.md)

---

**Last Updated**: 2025-10-28 18:30 (GMT+8) - Auto-Chatlog全局规则（集成到progress-recorder Agent）
