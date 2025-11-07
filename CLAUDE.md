# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📚 Configuration Modules

**此配置已模块化，分为以下专题文件：**

1. **[Agent Configuration](./.claude/agent_config.md)** - Agent 配置、触发关键词、备份规则、Night-Auth 协议、RCCM 框架
2. **[Architecture Guide](./.claude/architecture_guide.md)** - 项目架构、技术栈、核心设计决策、5阶段流程
3. **[Workflow Rules](./.claude/workflow_rules.md)** - 工作流规范、Auto-Compact 最佳实践、Token 使用优化
4. **[Cost Optimization](./.claude/cost_optimization.md)** - 成本优化策略、AI 模型选择、编码效率机制
5. **[Developer Handbook](./.claude/dev_handbook.md)** - 常见开发任务、项目特殊约定、快速参考
6. **[Deployment & Security](./.claude/deployment_security.md)** - 部署架构、安全注意事项、设计规范
7. **[Auto-Chatlog Rules](./.claude/AUTO_CHATLOG_RULES.md)** - 自动对话记录机制、Token阈值触发、防止上下文压缩丢失
8. **[Decision 3-Layer Template](./.claude/DECISION_3LAYER_TEMPLATE.md)** - 三层决策落实标准模板（完整版）
9. **[Decision Quick Reference](./.claude/DECISION_QUICKREF.md)** - 三层决策快速参考卡片（日常使用）

---

## 🎯 核心交互规则

**默认语言**: 中文（除非特别指定）

**时间戳格式**: `YYYY-MM-DD HH:mm` (GMT+8)

**Agent 触发关键词**（详见 [Agent Configuration](./.claude/agent_config.md)）：
- `>>recap` - 项目回顾总结
- `>>record` - 增量记录当前进度
- `>>archive` - 归档历史记录
- `>>wrap-up` - 会话收尾
- `>>chatlog` - 保存对话记录
- `>>zip` - 创建备份
- `>>ideas&tasks` - 同步任务状态
- ` !RCCM` - 根因分析与对策

**最高优先级共识 (Incremental Fusion Principle)**:
CLAUDE.md 与 progress.md 被正式定义为项目核心文件；对核心文件的更新必须遵循"增量融合"原则（原则上不得大幅减少行数，保留历史记录与上下文），agent 在执行更新时必须保证该原则并记录变更原因与时间戳。

---

## 🔴 CCA 工作规则 (Claude Code Agent)

### 【CRITICAL - 端口管理】防止 IDE 崩溃

**启动前 MANDATORY 检查清单**:
```bash
# 1. 检查 3001 端口 (前台)
netstat -ano | findstr "3001"

# 2. 检查 8080 端口 (后台)
netstat -ano | findstr "8080"

# 如果有输出，说明端口被占用，询问用户是否清理旧进程
```

### 【Rule 1】端口冲突检测

**核心原则**: "rrxsxyz_next 专用端口 3001 + 8080"
- 禁止使用 6000-6999 (AnyRouter_Refresh)
- 禁止使用 7000-7999 (mx_kc_gl)
- 仅允许 3001, 8080

**启动时行为**:
```
用户: "启动 rrxsxyz_next"

Claude Code 必须:
1. 检查 3001 和 8080: netstat -ano | findstr "3001\|8080"
2. 如果端口被占用 → 询问用户是否清理
3. 显示占用进程: tasklist /FI "PID eq XXXX"
4. 清理旧进程: taskkill /F /IM node.exe
5. 等待 2 秒后启动新实例
```

### 【Rule 2】进程监控

启动后每 5 秒检查一次：
```
✅ Node.js 进程存活: tasklist | findstr "node"
✅ 端口响应: curl http://localhost:3001
✅ 如果进程死亡 → 报告给用户
✅ 不要盲目重启（会产生僵尸进程）
```

### 【Rule 3】日志输出

必须显示：
```
✅ 服务启动成功 (PID: XXXX, Port: 3001/8080)
📊 监听地址: http://localhost:3001
📝 日志位置: rrxsxyz_next.log

错误时必须显示：
❌ 启动失败
📋 错误信息: [完整错误输出]
🔍 诊断步骤
```

### 【Rule 4】关闭前必须清理（已废弃 - 见Rule 5）

```
⚠️ 废弃警告: 此规则已被 Rule 5 (D-68) 取代
不再使用 `taskkill /F /IM node.exe`，因为会误杀其他项目进程
请使用 Rule 5 的安全清理脚本
```

### 【Rule 5】D-68 跨项目端口保护（2025-10-20）

**核心原则**: 各项目清理端口时，**仅清理本项目进程，严禁清理其他项目进程**

**问题根因**:
- 2025-10-20 发生误杀事件：清理rrxsxyz_next进程时，误杀了VSCode和VSCodium中正在运行的其他项目(ARB/mx_kc_gl)的Claude Code Agent
- 原因：使用 `taskkill /F /IM node.exe` 无差别杀死所有Node进程

**D-68 规则**:
1. ✅ **使用安全清理脚本**: `powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1`
2. ✅ **自动识别项目归属**: 通过工作目录路径或端口段识别进程所属项目
3. ✅ **跨项目保护**: 发现其他项目进程时，警告但不清理
4. ✅ **详细报告**: 显示本项目/其他项目/未知进程的详细信息

### 【Rule 6】浏览器自动化Gemba-Agent（D-77，2025-10-25）

**核心原则**: 使用自动化测试替代低效人工Gemba验证

**背景**:
- 问题：D-76字数减半修复验证失败，多次修改"原地踏步"
- 根因：缺乏自动化测试验证，依赖人工Gemba效率低、易遗漏

**D-77 规则**:
1. ✅ **工作文件**: `scripts/gemba-agent.js` (Puppeteer) 和 `scripts/gemba-playwright/` (Playwright - 推荐)
2. ✅ **核心功能**:
   - 浏览器自动化（登录、输入话题、选角色、启动辩论）
   - Console监控（捕获错误、警告、网络请求失败）
   - 行为验证（字数统计、UI元素检查、流程完整性）
   - 报告生成（HTML格式，包含截图、Console日志、验证结果）
3. ✅ **验证目标**:
   - D-76 字数减半是否生效（专家发言 < 250字）
   - UI混乱问题是否解决（文字流实时显示）
   - 流程完整性（策划→辩论→交付）
4. ✅ **使用方式**:
   ```bash
   # Playwright版本（推荐，性能提升20-30%）
   npm run playwright:install  # 首次运行安装浏览器
   npm run playwright:test     # 运行所有测试
   npm run playwright:ui       # UI模式调试

   # Puppeteer版本（旧版本，向后兼容）
   node scripts/gemba-agent.js
   node scripts/gemba-agent.js --scenario word-count-limit
   ```

**长期目标**: 集成到 CI/CD 流程，每次部署前自动测试

**关联决策**:
- D-GEMBA-2.0 (2025-11-02) - Gemba Agent 2.0 三层架构实现（感知/决策/执行层解耦）
- D-98 (2025-10-31) - Playwright迁移完成（推荐使用Playwright版本）
- D-77 (2025-10-25) - 浏览器自动化Gemba-Agent（Puppeteer版本）

**Gemba Agent 2.0 架构** (D-GEMBA-2.0):
- **三层架构**: Perception（感知层）/ Decision（决策层）/ Execution（执行层）完全解耦
- **代码规模**: 11个文件，~120KB代码，50+条自动修复规则
- **独立版本**: `scripts/gemba-2.0/standalone.js`（简化部署，无需依赖主系统）
- **核心能力**:
  - 感知层: 实时监控Console日志、网络请求、DOM变化
  - 决策层: 智能规则引擎、错误分类（P0/P1/P2）、相似问题聚合
  - 执行层: 文件操作（备份→修改→验证）、Git集成、回滚机制
- **启动方式**:
  ```bash
  # 独立测试（推荐）
  node scripts/gemba-2.0/standalone.js

  # 完整启动（带所有功能）
  scripts/gemba-2.0/start-gemba.bat
  ```
- **参考文档**: `scripts/gemba-2.0/architecture.md`, `scripts/gemba-2.0/GEMINI_BALANCE_ANALYSIS.md`

**工作结束时安全清理流程**:
```bash
# 1. 运行安全清理脚本（自动保护其他项目）
powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1

# 2. 查看清理结果（会显示保护了哪些其他项目）

# 3. 确认本项目进程已清理
# 4. 其他项目进程保持运行（显示为 "已保护"）
```

**禁止使用的危险命令**:
```bash
# ❌ 禁止: 会杀死所有Node进程（包括其他项目）
taskkill /F /IM node.exe

# ❌ 禁止: 会杀死所有Python进程（包括其他项目）
taskkill /F /IM python.exe
```

**项目端口段定义** (D-65):
- rrxsxyz_next: 3000-3999, 8000-8999
- AnyRouter_Refresh: 6000-6999
- mx_kc_gl: 7000-7999

### 【Rule 7】用户手动管理前后端服务（D-79，2025-10-25）

**核心原则**: 用户手动启动/关闭前后端服务，Claude Code **禁止自动启动服务**

**背景**:
- 问题：Claude Code 自动启动的后台服务容易造成多进程阻塞
- 用户决策：2025-10-25 明确要求手动管理服务，避免进程冲突

**D-79 规则**:
1. ❌ **禁止自动启动**: Claude Code 不得使用 `run_in_background: true` 启动前后端服务
2. ✅ **关闭旧进程**: 工作结束前，必须关闭所有 Claude Code 启动的后台进程
3. ✅ **通知用户**: 关闭后台进程后，通知用户可以手动启动服务
4. ✅ **验证端口释放**: 使用 `netstat -ano | findstr "3001\|8080"` 验证端口已释放

**工作流程**:
```bash
# Claude Code 工作结束时
1. 关闭所有后台进程: KillShell (bash_id)
2. 验证端口释放: netstat -ano | findstr "3001\|8080"
3. 通知用户: "✅ 端口已释放，请手动启动服务"
```

**用户手动启动服务**（推荐方式）:
```bash
# 方式1: 使用启动脚本
localhost_start.bat  # 选择 [3] Full Stack

# 方式2: 手动启动
# 前端（Python，端口8080）
python -m http.server 8080

# 后端（Node.js，端口3001）
cd server && npm run dev
```

**例外情况**:
- Gemba-Agent 测试需要服务运行：仅在测试期间临时启动，测试完毕立即关闭
- 其他自动化测试场景：同上，用完即关

### 【Rule 8】D-85 测试版本号管理（2025-10-26）

**核心原则**: 每次进行人工测试前，**必须同时更新版本号**，避免浏览器缓存混淆

**背景**:
- 问题：修改代码后忘记更新版本号，浏览器缓存导致测试无效（以为在测试V55.3，实际仍在用V55.2）
- 根因：缺乏强制性版本号管理流程

**D-85 规则**:
1. ✅ **更新位置**（duomotai/index.html，2处）:
   - 第12行：`<h1>` 标题中的 `<span class="version-tag">V55.X</span>`
   - 第144行：`console.log()` 中的版本号标识
2. ✅ **更新流程**:
   ```
   修改代码 → 更新版本号（V55.2 → V55.3）→ 保存文件 → 强制刷新浏览器（Ctrl+F5）
   ```
3. ✅ **版本号格式**: 参考 `duomotai/VERSION_CONTROL.md`
4. ✅ **验证方式**:
   - 浏览器 Console 检查：确认显示正确的版本号日志
   - 页面标题检查：确认显示正确的版本号
   - 两处版本号必须一致

**关联决策**:
- D-85 (2025-10-26) - 版本号管理规则固化（见 progress.md）
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

### 【Rule 11】D-97 版本自动备份机制（2025-10-26 新增）

**核心原则**: 每次版本号自动更新（D-95规则触发）时，**自动调用progress-recorder进行Exclude方式备份**

**背景**:
- 问题：D-95规则只处理版本号更新，缺少配套的备份机制，导致V56.2缺少备份记录
- 根因：版本升级的三层同步机制不完整（缺少Layer 3自动备份触发）

**D-97 规则**:
1. ✅ **触发条件**（自动，无需关键词）:
   - D-95检测到代码变更，版本号升级时
   - 例如：V56.2 → V56.3，自动备份V56.3

2. ✅ **备份执行方式**:
   - **Agent**: 调用 progress-recorder agent（通过内部 >>zip 机制）
   - **方式**: Exclude方式备份（排除 node_modules/.git/logs 等）
   - **文件名格式**: `rrxsxyz_next_YYYYMMDDHHmm_V{version}OK_{keyword}.zip`
   - **关键词示例**: `V563OK_AllTestsPassed`
   - **存储位置**: `rrxsxyz_next/backups/`（项目目录内的backups子目录）

3. ✅ **自动流程**（6步）:
   ```
   D-95版本号自动更新触发
      ↓
   识别新版本号（如V56.3）
      ↓
   调用progress-recorder agent创建备份
      ↓
   Agent执行Exclude备份
      ↓
   返回BACKUP_DONE回执
      ↓
   在progress.md Backups区块记录备份信息
   ```

4. ✅ **备份记录位置**:
   - progress.md 的 Backups 区块自动更新
   - 格式：版本号 + 时间戳 + 文件大小 + 关键词

5. ✅ **验证方式**:
   - 浏览器刷新后检查 Console 版本号
   - 检查 `backups/` 目录下是否存在对应的 `.zip` 文件
   - 检查 progress.md Backups 区块是否有记录

**关联决策**:
- D-97 (2025-10-26) - 版本自动备份机制正式确立
- D-95 (2025-10-26) - 版本号自动更新（D-97补充了备份部分）
- D-85 (2025-10-26) - 版本号管理（三层完成）
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

**例外情况**:
- 手动指定版本号 → 同样触发自动备份
- 开发期间频繁更新 → 可在最终稳定版本时集中备份
- 特殊标记版本（如"紧急修复") → Agent自动在备份文件名中标注

### 【Rule 9】D-87 测试用户核心功能锁定（2025-10-26）

**核心原则**: 测试账号 `13917895758` 的核心功能**永久锁定**，任何版本升级都不得修改

**背景**:
- 问题：担心版本升级时，测试用户的特殊功能被意外覆盖
- 根因：缺乏明确的功能保护机制

**D-87 规则**:
1. ✅ **受保护的功能**（测试账号 13917895758 专属）:
   - **字数减半（D-84）**: 专家发言200字，标准用户400字
   - **最少2个专家（D-76）**: 测试用户2个，标准用户8个
   - **默认选中2个角色**: 第一性原理 + 行业专家
2. ✅ **涉及文件与位置**:
   - `duomotai/debateEngine.js` - 字数控制逻辑（带 `// D-84` 注释）
   - `duomotai/init.js` - 角色数量/默认选中逻辑（带 `// D-76` 注释）
   - `duomotai/index.html` - 前端初始化
3. ✅ **保护机制**:
   - 代码中添加 `// PROTECTED: D-87 测试用户核心功能，禁止修改` 注释
   - 修改相关代码时，必须先检查是否影响测试用户
   - PRD 文档中明确列出测试用户功能章节
4. ✅ **验证方式**:
   - 使用 13917895758 登录
   - 验证专家数量为2个（非8个）
   - 验证默认选中"第一性原理 + 行业专家"
   - 验证专家发言字数约200字（非400字）

**关联决策**:
- D-87 (2025-10-26) - 测试用户核心功能锁定（见 progress.md）
- D-84 (2025-10-26) - 字数减半功能
- D-76 - 最少2个专家
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

### 【Rule 10】D-89 已锁定模块禁止擅自修改（2025-10-26）

**核心原则**: 任何标记为"已确认"、"已锁定"、"已验证通过"的代码模块，**修改前必须用户确认**

**背景**:
- 问题：已锁定的稳定模块被无意修改，导致功能退化或测试失败
- 根因：缺乏对已确认模块的变更管理机制

**D-89 规则**:
1. ✅ **受保护的模块识别标志**:
   - 代码注释包含：`// PROTECTED`, `// LOCKED`, `// D-XX 已锁定`, `// 已验证通过`
   - PRD 文档中标记为"已确认"、"已锁定"的功能
   - progress.md Decisions 中标记"功能锁定"的决策
2. ✅ **修改前的强制流程**:
   ```
   步骤1: Claude 检测到需要修改受保护模块
   步骤2: Claude 明确告知用户：
          "⚠️ 检测到将要修改已锁定模块：
          - 文件：<file_path>
          - 模块：<module_name>
          - 关联决策：<D-XX>
          - 变更内容：<description>
          是否确认修改？"
   步骤3: 等待用户明确确认（yes/no）
   步骤4: 仅在用户确认后才执行修改
   步骤5: 修改后在 progress.md Notes 区记录：
          "[YYYY-MM-DD HH:MM] 已锁定模块变更：<module> - 用户已确认"
   ```
3. ✅ **保护范围**:
   - **测试用户功能**（D-87）: 字数减半、最少2个专家、默认选中角色
   - **语音文字同步**（D-63）: Synctxt&voice v1.0 机制
   - **版本号管理**（D-85）: 双位置版本号同步更新
   - **端口保护**（D-68）: 跨项目端口隔离机制
   - **所有标记为 PROTECTED 的代码块**
4. ✅ **例外情况**:
   - 仅修改注释/文档（不涉及逻辑）：无需确认
   - 修复明确的 Bug（不改变功能）：记录但无需确认
   - Night-Auth 期间：仅允许非破坏性操作（添加日志、修复错误）
5. ✅ **违反后果**:
   - 触发 10Why 根因分析（` !RCCM`）
   - 记录到 progress.md Risks 区块
   - 必要时回滚变更，恢复已锁定版本

**涉及文件**:
- `duomotai/debateEngine.js`（字数控制、D-84/D-87）
- `duomotai/init.js`（角色数量、D-76/D-87）
- `duomotai/index.html`（版本号、D-85）
- `scripts/safe_port_cleanup.ps1`（端口保护、D-68）
- 所有包含 `// PROTECTED` 注释的代码块

**关联决策**:
- D-89 (2025-10-26) - 已锁定模块禁止擅自修改（见 progress.md）
- D-87 (2025-10-26) - 测试用户核心功能锁定
- D-85 (2025-10-26) - 版本号管理规则固化
- D-84 (2025-10-26) - 字数减半功能
- D-76 - 最少2个专家
- D-68 (2025-10-20) - 跨项目端口保护
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

### 【Rule 11】D-95 测试版本号自动更新机制（强化版 2025-10-26）

**核心原则**: 用户手动测试过程中，Claude自动识别代码更新并递增版本号

**背景**:
- 问题：用户修改代码后进行测试，版本号未及时更新导致缓存混淆
- 解决：Claude主动检测代码更新，自动递增版本号

**D-95强化规则**:
1. ✅ **适用场景**: 用户手动测试过程中
2. ✅ **自动识别**: Claude在对话中自己识别出代码已更新（无需用户明确要求）
3. ✅ **版本递增规则**:
   - 默认规则：末位递增（V56.1 → V56.2 → ... → V56.9 → V56.a → ... → V56.z）
   - 大版本：用户明确告知（"升级到V57"时切换）
4. ✅ **适用范围**:
   - 用户手动测试期间：自动更新
   - 任务完成/自动备份时：由Claude和Gemba按同样规则更新
   - 一般变更：末位递增
5. ✅ **更新位置**（两处必须同步）:
   - duomotai/index.html L12: `<span class="version-tag">VXX.X</span>`
   - duomotai/index.html L143-147: console.log中的版本号信息
6. ✅ **Console日志增强**（确保明显可见）:
   ```javascript
   console.log('%c🚀 多魔汰系统 VXX.X 已加载！', 'color: #00ff00; font-size: 20px; font-weight: bold; background: #000; padding: 10px;');
   ```
7. ✅ **自动通知用户**:
   - 版本更新完成后立即反馈: "✅ 版本已自动更新到 Vx.x，Ctrl+F5 刷新后生效"

**关联决策**:
- D-95 (2025-10-26) - 测试版本号自动更新机制（强化版）
- D-85 (2025-10-26) - 版本号管理规则
- D-89 (2025-10-26) - 已锁定模块保护
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

### 【Rule 12】D-102 批处理规范 - 禁用 `> nul`（2025-10-29）

**核心原则**: **绝对禁止**在批处理文件中使用 `> nul` 重定向

**背景**（完整事件链）:
- **事件级别**：🔴 P0 - 系统级灾难（66,953个NUL文件）
- **触发时间**：2025-10-20 创建port_check.bat（包含20处 `> nul`）
- **爆发时间**：2025-10-29 05:00 - 系统崩溃
- **影响范围**：
  - OneDrive完全崩溃（9小时卡死）
  - 多魔汰系统宕机（端口3001服务崩溃）
  - D盘文件系统污染风险
  - LTP系统文件损坏（最终导致重装系统）

**根本原因链**（10Why深度分析）:
```
1. 批处理脚本使用 > nul 重定向
   ↓ 在以下触发条件下创建实体文件而非重定向：
2. OneDrive同步监控项目目录（D:\_100W）
3. nodemon/文件监听器实时检测文件变化
4. 频繁执行批处理文件（端口检查脚本）
   ↓
5. 形成恶性循环：批处理创建 nul → nodemon检测 → 触发新执行 → 创建更多 nul
   ↓
6. NTFS MFT Cache + Windows Search索引冲突
   - Phantom文件：存在于OneDrive索引，但文件系统不存在
   - 标准命令（PowerShell）无法删除
   - 需要特殊技术（CMD /F /Q + UNC路径）才能删除
   ↓
7. 指数级增长：从几个文件 → 2,619个 → 66,953个

** 责任追踪**（透明度承诺）:
- Claude (我): 30% - 编写包含 `> nul` 的batch脚本
- Windows系统: 20% - nul设备重定向边缘Bug
- OneDrive: 20% - 文件句柄竞争
- 疏忽处理: 20% - 10-19首次发现时未重视
- 项目流程: 10% - 缺少测试环境隔离
```

**教训**：
- ❌ Windows标准做法（`> nul`）在某些环境下失效
- ❌ 即使看起来是小问题，也要深度诊断
- ✅ 环境复杂度提升时，需要更严格的规范和监控

**D-102强制规则**:
1. ❌ **绝对禁止**:
   ```batch
   # ❌ 危险写法（禁用！）
   command > nul
   command 2> nul
   command > nul 2>&1
   ```

2. ✅ **安全替代方案**:
   ```batch
   # ✅ 方案A: 重定向到CON（控制台）
   command 2>CON
   command >CON
   command 1>CON 2>&1

   # ✅ 方案B: 使用PowerShell
   powershell -Command "command | Out-Null"
   ```

3. ✅ **监控机制**:
   - 定时监控：`scripts/monitor_nul_files.ps1`（每小时运行）
   - 阈值报警：nul文件数 > 10 个时立即报警
   - 日志记录：`nul_monitor.log`

4. ✅ **紧急响应**:
   ```powershell
   # 如发现nul文件异常增长：
   # 1. 停止所有服务
   taskkill /F /IM node.exe

   # 2. 强制清理
   powershell -ExecutionPolicy Bypass -File scripts/force_cleanup_nul.ps1

   # 3. 检查批处理文件
   grep -r "> nul\|>nul" *.bat
   ```

5. ✅ **代码审查**:
   - 所有批处理文件创建/修改前必须检查是否包含 `> nul`
   - Git pre-commit hook 可选：自动检测并阻止提交

**涉及文件**:
- 已修复：`Backup/启动本地服务器-更新版.bat`（L2, L88）
- Python虚拟环境：`.venv/Scripts/activate.bat`（第三方文件，不修改）
- 监控脚本：`scripts/monitor_nul_files.ps1`
- 清理脚本：`scripts/force_cleanup_nul.ps1`

**参考文档**（详细分析）:
所有细节记录在 `INCIDENT/` 目录：
- **INCIDENT_Learning_for_All.md** - 学习总结 + 完整规范（推荐阅读）
- **NUL_DISASTER_REPORT_20251029.md** - 事故初始报告（66,953个文件）
- **OneDrive_NUL_Complete_Analysis.md** - OneDrive Phantom文件分析
- **NUL_COMPLETE_SOLUTION.md** - 完整解决方案步骤

**关联决策**:
- **D-102** (2025-10-29) - NUL文件系统级灾难（完整RCCM，我承担责任）
- **D-106** (2025-10-30) - Phantom NUL Files根因分析（技术深度剖析）
- **D-107** (2025-10-30) - D-102批处理规范全局强制执行（项目范围）
- **D-108** (2025-10-30) - 系统维护脚本创建规范（预防机制）
- **D-113** (2025-10-31) - OneDrive安装失败与LTP系统重装（连锁影响）
- **D-68** (2025-10-20) - 跨项目端口保护（触发点：port_check.bat）
- 符合 **D-53** 三层决策落实机制（Layer 1-2-3 同步完成）

**例外情况**: 无。此规则无例外，所有批处理文件必须遵守。

**案例教学**（如何避免重蹈覆辙）:
```
❌ 错误示范（2025-10-20 我犯的错）：
   port_check.bat 包含 20 处 > nul
   ↓ 加上 OneDrive 监控
   ↓ 加上 nodemon 实时监听
   → 2025-10-29 爆炸为 66,953 个文件

✅ 正确做法：
   在创建任何 batch 脚本时：
   1. 检查是否包含 > nul / 2>nul 等
   2. 如果有，立即替换为 2>CON 或 >CON
   3. 测试脚本在隔离环境运行
   4. 观察 4-8 小时，确认无异常文件产生
   5. 上线运行

代码审查检查表：
   [ ] 是否包含任何 > nul 或 >nul（绝对禁止）？
   [ ] 是否使用 2>CON 或 >CON 重定向？
   [ ] 脚本在 OneDrive 监控的目录下运行吗？
   [ ] 脚本会被频繁执行（定时任务/nodemon）吗？
   [ ] 是否在隔离环境测试过？
```

### 【Rule 13】D-103 Claude CLI安全使用规范（2025-10-29）

**核心原则**: **绝对禁止**使用 `--dangerously-skip-permissions` 参数，防止Claude CLI进入无限循环

**背景**:
- 问题：2025-10-29 发生Claude CLI自动启动VSCode循环，3分钟周期不断创建Code.exe进程
- 根因：用户在VSCode Terminal运行 `claude-code --dangerously-skip-permissions`，进程未正确退出，循环执行扩展安装检查
- 影响：大量Code.exe进程消耗系统资源，可能导致系统卡顿
- **D-105补充（空白页面弹出）**：2025-10-29 发现在VSCode/VSCodium终端输入`claude`命令时，自动弹出4个或2-3个空白VSCode窗口。根因相同（扩展检查触发`code`命令），推荐使用VSCode内置Claude扩展避免CLI触发。

**D-103强制规则**:
1. ❌ **绝对禁止**:
   ```bash
   # ❌ 危险写法（禁用！）
   claude-code --dangerously-skip-permissions
   claude-code --continue  # 可能导致后台持续运行
   ```

2. ✅ **安全使用方式**:
   ```bash
   # ✅ 方案A: 使用VSCode内置Claude扩展（推荐，避免空白窗口弹出 - D-105）
   # 直接在VSCode中使用Claude Code扩展，不使用CLI命令`claude`

   # ✅ 方案B: 仅使用基础命令（如必须使用CLI）
   claude-code

   # ✅ 方案C: 使用安全启动脚本（自动清理旧进程）
   powershell -ExecutionPolicy Bypass -File scripts/safe_claude_cli_start.ps1
   ```

3. ✅ **监控机制**:
   - 实时监控：`scripts/monitor_claude_cli.ps1`（检测Claude CLI异常循环）
   - 阈值报警：5分钟内创建 > 10个Code.exe时立即报警
   - 日志记录：`INCIDENT/claude_cli_monitor.log`

4. ✅ **紧急响应**:
   ```powershell
   # 如发现Claude CLI循环：
   # 1. 检查Claude CLI进程
   tasklist | findstr "node.exe"
   wmic process where "commandline like '%claude-code%'" get ProcessId,CommandLine

   # 2. 停止Claude CLI进程（保留其他项目的Node进程）
   # 注意：不要使用 taskkill /F /IM node.exe（会误杀其他项目）
   # 请手动记录PID后单独清理: taskkill /F /PID <PID>

   # 3. 检查code_creation.log
   tail -n 20 INCIDENT/code_creation.log
   ```

5. ✅ **预防机制**:
   - VSCode Terminal关闭前，确认Claude CLI进程已正确退出
   - 使用 `Ctrl+C` 优雅终止Claude CLI，避免后台残留
   - 定期运行监控脚本，检测异常

**工作流程**:
```bash
# 启动前检查
powershell -ExecutionPolicy Bypass -File scripts/monitor_claude_cli.ps1

# 安全启动（推荐）
powershell -ExecutionPolicy Bypass -File scripts/safe_claude_cli_start.ps1

# 或直接启动（确保无旧进程）
claude-code  # 无额外参数

# 工作完成后验证
tasklist | findstr "node.exe"  # 确认Claude CLI已退出
```

**涉及文件**:
- 监控脚本：`scripts/monitor_claude_cli.ps1`（检测异常）
- 安全启动脚本：`scripts/safe_claude_cli_start.ps1`（自动清理）
- 循环日志：`INCIDENT/code_creation.log`（WMI监控）
- 事件报告：`INCIDENT/OPERATION_LOG.md`（完整记录）

**关联决策**:
- D-103 (2025-10-29) - Claude CLI无限循环灾难（完整RCCM）
- D-105 (2025-10-29) - VSCode空白页面自动弹出问题（同根因，扩展检查触发code命令）
- D-102 (2025-10-29) - NUL文件系统级灾难（同期发生）
- D-68 (2025-10-20) - 跨项目端口保护（防止误杀）
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

**例外情况**: 无。此规则无例外，所有Claude CLI使用必须遵守。

**循环模式识别**（3步循环，3分钟周期）:
```
code --list-extensions
   ↓ (1分钟)
code --list-extensions --show-versions
   ↓ (1分钟)
code --force --install-extension anthropic.claude-code
   ↓ (循环回第1步)
```

### 【Rule 14】D-98 Playwright RPA-Agent加速项目开发（2025-10-31）

**核心原则**: 优先使用 Playwright 进行浏览器自动化测试，提升20-30%性能

**背景**:
- 问题：Puppeteer版本存在性能瓶颈（启动慢、API过时）
- 需求：更现代化的浏览器自动化解决方案
- 成果：2025-10-31完成迁移，11个文件，1,960行代码

**D-98 规则**:
1. ✅ **推荐使用Playwright版本**（优先级高于Puppeteer）
   - 位置：`scripts/gemba-playwright/`
   - 性能：比Puppeteer快20-30%
   - 多浏览器支持：Chromium/Firefox/WebKit

2. ✅ **核心测试文件**:
   - `test-full-flow.js` - 完整流程测试（主入口）
   - `test-voice-sync.js` - 语音同步测试（D-63验证）
   - `test-word-count.js` - 字数限制测试（D-76验证）
   - `test-ui-elements.js` - UI元素测试

3. ✅ **新增npm命令**（6个）:
   ```bash
   # 安装Playwright浏览器（首次运行必须）
   npm run playwright:install

   # 运行所有Playwright测试
   npm run playwright:test

   # UI模式运行测试（交互式调试）
   npm run playwright:ui

   # 生成测试报告
   npm run playwright:report

   # 显示测试报告
   npm run playwright:show-report

   # 调试模式运行
   npm run playwright:debug
   ```

4. ✅ **技术优势**:
   - 多浏览器支持（Chromium/Firefox/WebKit）
   - 自动等待机制（减少flaky测试）
   - 内置测试报告生成（HTML格式）
   - UI模式调试（交互式调试工具）
   - 更快的启动速度（比Puppeteer快20-30%）

5. ✅ **向后兼容**:
   - Puppeteer版本保留在 `scripts/gemba-agent.js`
   - 可根据需要在两个版本间切换
   - 测试场景完全一致（字数限制、语音同步、UI元素）

6. ✅ **使用场景**:
   - **日常测试**：使用Playwright版本（`npm run playwright:test`）
   - **调试问题**：使用UI模式（`npm run playwright:ui`）
   - **紧急回退**：使用Puppeteer版本（`node scripts/gemba-agent.js`）

**工作流程**:
```bash
# 首次使用（仅一次）
npm run playwright:install  # 安装浏览器

# 日常测试
npm run playwright:test     # 运行所有测试

# 交互式调试
npm run playwright:ui       # UI模式，逐步调试

# 查看报告
npm run playwright:show-report  # 查看测试结果HTML报告
```

**涉及文件**:
- 主目录：`scripts/gemba-playwright/`
- 配置文件：`playwright.config.js`
- 依赖：`package.json`（新增6个npm命令）
- 文档：`scripts/gemba-playwright/README.md`

**关联决策**:
- D-98 (2025-10-31) - Playwright迁移完成
- D-77 (2025-10-25) - 浏览器自动化Gemba-Agent（Puppeteer版本）
- D-76 - 字数减半功能
- D-63 - 语音与文字流同步机制
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

**预期成果**:
- ✅ 测试执行速度提升20-30%
- ✅ 测试稳定性提高（自动等待机制）
- ✅ 调试效率提升（UI模式）
- ✅ 多浏览器兼容性验证

### 【Rule 15】统一启动脚本强制规则（2025-11-04）

**核心原则**: **强制使用统一启动脚本，从项目根目录运行，禁止使用旧启动方式**

**D-118 规则**:
1. ✅ **强制启动方式**（唯一标准）:
   ```powershell
   # 主启动脚本（推荐，交互式菜单）
   powershell -ExecutionPolicy Bypass -File start.ps1

   # 分别启动（可选）
   powershell -ExecutionPolicy Bypass -File start_frontend.ps1  # 前端（8080）
   powershell -ExecutionPolicy Bypass -File start_backend.ps1   # 后端（3001）
   ```

2. ❌ **禁止使用**（已废弃）:
   - `localhost_start.bat`（旧启动脚本）
   - `python -m http.server 8080`（直接命令）
   - `cd server && npm run dev`（直接命令）
   - 任何非项目根目录的启动方式

3. ✅ **强制要求**:
   - **位置**: 必须从项目根目录（`D:\OneDrive_New\_AIGPT\_100W_New\rrxsxyz_next\`）运行
   - **脚本**: 仅使用 `start.ps1`, `start_frontend.ps1`, `start_backend.ps1`
   - **权限**: 使用 `-ExecutionPolicy Bypass` 避免PowerShell策略阻塞
   - **验证**: 启动前自动检查端口占用、依赖安装、关键文件存在

4. ✅ **统一启动流程**:
   ```
   步骤1: cd 到项目根目录
   步骤2: 运行 start.ps1
   步骤3: 选择启动模式：[1] 前端 / [2] 后端 / [3] 全栈（推荐）
   步骤4: 脚本自动检查并启动服务
   步骤5: 确认服务运行（端口监听、日志输出）
   ```

**关联规则**:
- **D-79规则**: 用户手动启动服务（Claude Code不自动启动）
- **D-68规则**: 安全端口清理（仅清理本项目进程）
- **Rule 1**: 端口冲突检测（3001/8080专用）

**关联决策**:
- D-118 (2025-11-04) - 统一启动脚本强制规则
- 符合 D-53 三层决策落实机制（Layer 1-2-3 同步完成）

**详细文档**: 参见 `docs/STARTUP_GUIDE.md`


### 快速命令参考

```bash
# 查看 Node 进程
tasklist | findstr "node"

# 查看端口占用
netstat -ano | findstr "3001\|8080"

# ✅ 安全清理（D-68规则）
powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1

# ❌ 危险: 不要使用（会误杀其他项目）
# taskkill /F /IM node.exe

# 查看特定 PID 进程
tasklist /FI "PID eq 1234"

# 查看 npm 版本
npm --version

# 启动命令
npm start

# 查看项目依赖
npm list --depth=0
```

---

**强制触发规则**（❌ **违反流程将触发 10Why 根因分析**）：
当对话中出现以下关键词时，**必须立即调用 Task tool 启动 progress-recorder agent**，而不是手动操作：
1. **决策完成**：` !我决定` / ` !确定` / ` !选用` / ` !采用` → 记录决策到 progress.md Decisions
2. **任务完成**："已完成"/"完成了"/"已实现"/"修复了" → 更新 progress.md Done 区块
3. **新任务产生**：` !请解决` / ` !需要` / ` !应该` / ` !待办` / ` !TODO` → 添加到 progress.md TODO
4. **需求变更**：` !需求更新` / ` !架构调整` / ` !规则变更` / ` !重构` / ` !请长期记忆` → 同时更新 progress.md 和 CLAUDE.md
5. **会话收尾**：`>>wrap-up` 或 ` !准备关机` → 总结会话，更新 progress.md，确认可安全关机
6. **创建备份**：`>>zip` 或 `>>zip&"关键词"` → **【硬约束】** 必须通过 agent 创建标准化备份（参见 [Agent Configuration](./.claude/agent_config.md) 违反后果说明）
7. **用户明确要求**：>>record / >>recap / >>archive → 立即调用 agent

**⚠️ 违反后果**：直接手动操作将导致流程审计失败，需要执行 10Why 根因分析（` !RCCM`）并记录到 progress.md Decisions。

---

## ⚡ 文件读取与 Token 优化策略

**核心原则**：减少不必要的文件读取，避免触发上下文压缩（Compacting）

### 必读文件（每次任务）
- `progress.md`（仅前 100 行，使用 `Read --limit 100`）
- 当需求变更时，读取完整 `CLAUDE.md`

### 按需读取文件（特定任务）
- `ideas.md`（仅 `>>ideas&tasks` 时）
- `scripts/*.js`, `scripts/*.ps1`（仅调用脚本时）
- `duomotai/index.html`, `index.html`（仅修改页面时）

### 禁止默认读取
- `test_reports/`, `docs/`, `server/UserInfo/`（历史数据）
- `*.archive.md`（仅归档任务时）

### 工具优先级（Token 成本从低到高）
1. ✅ **Grep**（精确查找，< 10 tokens）
2. ✅ **Glob**（查找文件路径，< 5 tokens）
3. ⚠️ **Read**（完整内容，500-5000 tokens）- 同一文件只读一次
4. ❌ **Task (agent)**（2000-10000 tokens）- 仅复杂任务

**详细策略**：参见 [Agent Configuration](./.claude/agent_config.md) progress-recorder 文件读取策略区块

**优化成果**（2025-10-12）：
- progress.md 归档阈值：100 → 80 条（减少 20%）
- progress.md 保留记录：50 → 30 条（减少 40% token）
- 预期 Token 节省：60-80%

---

## 🚀 Quick Start

### 项目概述

**RRXS.XYZ** - 个人品牌自媒体网站，包含两大核心模块：
- **百问自测系统**：100题自媒体商业化能力评估工具
- **多魔汰辩论系统**：多角色AI辩论决策支持系统

### 启动开发环境

**统一启动方式（从项目根目录）：**

```powershell
# 主启动脚本（推荐）
powershell -ExecutionPolicy Bypass -File start.ps1

# 或分别启动
powershell -ExecutionPolicy Bypass -File start_backend.ps1  # 后端（3001）
powershell -ExecutionPolicy Bypass -File start_frontend.ps1  # 前端（8080）
```

**详细说明**：参见 [启动指南](./docs/STARTUP_GUIDE.md)

### 访问地址
- 首页：http://localhost:8080/
- 百问自测：http://localhost:8080/baiwen.html
- 多魔汰：http://localhost:8080/duomotai/
- 后端API：http://localhost:3001/

### 测试
```bash
# 测试邮件服务
cd server
node test-email.js

# 健康检查
curl http://localhost:3001/health
```

---

## 📖 详细文档索引

### 架构与设计
- **系统架构**：参见 [Architecture Guide](./.claude/architecture_guide.md) - 前后端架构、技术栈、模块化设计
- **设计规范**：参见 [Deployment & Security](./.claude/deployment_security.md) - 苹果风格设计规范、颜色方案
- **环境配置**：参见 [Architecture Guide](./.claude/architecture_guide.md) 第4节 - `.env` 配置要求

### 核心功能
- **多魔汰 5阶段流程**：参见 [Architecture Guide](./.claude/architecture_guide.md) 第5节 - 准备→策划→确认→辩论→交付
- **语音与文字流同步（Synctxt&voice v1.0）**：2025-10-14 实现，支持语音关闭（固定延迟）和语音打开（完全同步）两种模式
- **提示词优化（D-63 决策）**：2025-10-14 完成，Token 节省 62%，AI 输出空间增加 300%
- **百问自测系统**：参见 [Architecture Guide](./.claude/architecture_guide.md) 第2节 - V1/V2/V4 版本演进
- **AI 服务容错机制**：参见 [Architecture Guide](./.claude/architecture_guide.md) 第3节 - DeepSeek → Qwen → GLM → Gemini-Balance 降级链

### 开发指南
- **常见任务**：参见 [Developer Handbook](./.claude/dev_handbook.md) - 修改题目、角色配置、添加API、调试服务
- **项目约定**：参见 [Developer Handbook](./.claude/dev_handbook.md) - 测试账号、数据存储、备份策略、版本管理
- **工作流规范**：参见 [Workflow Rules](./.claude/workflow_rules.md) - 任务显示规则、Auto-Compact 最佳实践
- **深度分析方法论（D-115）**：`docs/Universal_DeepDive_Methodology_Framework_v1.0.md` - 8大标准步骤、4大分析维度、5个标准模板、质量评估清单

### 成本与优化
- **预算目标**：$20/天，峰值 $50/天（详见 [Cost Optimization](./.claude/cost_optimization.md)）
- **AI 模型选择**：参见 [Cost Optimization](./.claude/cost_optimization.md) 第1节 - DeepSeek → Qwen → GLM → Gemini-Balance
- **Token 使用优化**：参见 [Workflow Rules](./.claude/workflow_rules.md) Auto-Compact 区块

### Agent 配置
- **触发关键词详解**：参见 [Agent Configuration](./.claude/agent_config.md)
- **任务完成自动备份**：参见 [Agent Configuration](./.claude/agent_config.md) D-35 决策
- **Night-Auth 协议**：参见 [Agent Configuration](./.claude/agent_config.md) - 无间断工作模式
- **RCCM 框架**：参见 [Agent Configuration](./.claude/agent_config.md) - 根因分析与对策方法论

### 安全与部署
- **安全注意事项**：参见 [Deployment & Security](./.claude/deployment_security.md) - 环境变量、速率限制、Helmet
- **部署架构**：参见 [Deployment & Security](./.claude/deployment_security.md) - 本地开发 vs 生产环境建议
- **性能优化目标**：参见 [Deployment & Security](./.claude/deployment_security.md) - 首屏 < 2秒、Lighthouse > 90

---

## 🔧 核心技术栈

**前端：**
- React 18 + Vite（百问V1/V2项目）
- TailwindCSS + Shadcn/UI（组件库）
- 单文件HTML（V4和多魔汰 - 简化部署）

**后端：**
- Node.js 18+ + Express
- AI服务：Qwen API（主）→ DeepSeek → OpenAI（降级）
- 邮件：Nodemailer（QQ邮箱免费方案）
- 数据：JSON文件存储 + LocalStorage

**详细架构说明**: 参见 [Architecture Guide](./.claude/architecture_guide.md)

---

## 📦 项目特殊约定

### 测试账号
**手机号 `13917895758` 标记为测试账号**
- 百问自测：标记为老用户
- 多魔汰：固定验证码 `888888`

### 端口分配规则（D-65 决策，2025-10-18）
**多项目端口隔离机制**：
- **RRXS.XYZ 项目**: 3000~3999, 8000~8999（除 Windows 系统本身设定外）
  - 后端 API: 3000（默认）
  - 前端服务器: 8080
- **AnyRouter_Refresh 项目**: 6000~6999
- **mx_kc_gl 项目**: 7000~7999
- 各项目端口彼此错开，避免开发时冲突

### 数据存储
- **前端数据：** LocalStorage（键格式：`user_{phone}`, `answers_{phone}`, `analysis_{phone}`）
- **后端数据：** `server/data/` 目录（JSON文件）

### 备份策略
- 修改HTML前自动备份（格式：`filename_YYYYMMDD_HHMMSS.html`）
- P0/P1 任务完成后自动执行版本备份（详见 [Agent Configuration](./.claude/agent_config.md) D-35 决策）

**详细约定**: 参见 [Developer Handbook](./.claude/dev_handbook.md)

---

## 🌙 Night-Auth 无间断工作协议

**协议文档**: `.claude/NIGHT_AUTH_PROTOCOL.md`

**核心承诺**:
1. ✅ 仅使用已授权工具和命令
2. ✅ 优先使用文件操作工具（Read/Write/Edit/Glob/Grep/Task）
3. ✅ 时间戳统一使用 `Get-Date` PowerShell 命令
4. ✅ 禁止所有 Unix 风格命令（date/ls/cat/cp/mv/rm/grep）
5. ✅ 遇到未授权操作时跳过任务，记录日志，等待用户处理

**已授权命令快速参考**:
- 文件操作: Read, Write, Edit, Glob, Grep, Task
- PowerShell: Get-Date, Get-ChildItem, Compress-Archive
- Windows: echo, dir, cmd.exe, tasklist, taskkill, findstr, netstat
- Git: git add, git commit, git status
- Node/Python: node, npm run dev, python -m http.server
- 网络: curl

**详细协议**: 参见 [Agent Configuration](./.claude/agent_config.md) Night-Auth 区块

---

## 📝 核心文件更新授权机制

**问题**: "对于CLAUDE.md和progress.md的更新, 每次都需要我审批吗?"

**明确答案**:

1. **Night-Auth 期间**: ✅ 完全无需人工审批
2. **非 Night-Auth 期间**: ✅ 也无需人工审批（日常需求变更/任务完成/决策记录均可自主更新）
3. **重大架构调整**: ⚠️ Claude Code 会主动提示并等待确认（可选，不强制阻塞）

**执行规则**:

| 场景 | 是否需要审批 | 执行方式 | 时间戳要求 |
|------|------------|---------|-----------|
| 任务完成 | ❌ 无需 | progress-recorder agent | ✅ 自动添加 |
| 决策记录 | ❌ 无需 | progress-recorder agent | ✅ 自动添加 |
| 需求变更 | ❌ 无需 | progress-recorder agent | ✅ 自动添加 |
| 架构调整（重大） | ⚠️ 可选 | agent + 主动提示 | ✅ 自动添加 |
| Night-Auth 期间 | ❌ 绝不 | 完全自主工作 | ✅ 自动添加 |

**详细说明**: 参见 [Agent Configuration](./.claude/agent_config.md) 核心文件更新授权机制区块

---

## 🧠 Root-Cause & Counter-Measure 框架

**触发词**: ` !RCCM` 或 `RCCM!`

**功能**: 对当前问题进行深度分析，给出根本原因（Root-Cause）和可持续解决方案（Short-Term & Long-Term Counter-Measure）

**工作流程**:
1. 问题识别：用户描述问题
2. 根因分析（Root-Cause）：技术/流程/系统层面分析
3. 短期对策（Short-Term CM）：快速缓解方案（P0，数分钟~数小时）
4. 长期对策（Long-Term CM）：根本性解决方案（P1-P2，数天~数周）
5. 方案选择：Agent 给出多个可选方案，用户确认后执行

**记录要求**:
- 每次 RCCM 分析结果必须记录到 progress.md Decisions 区块
- 格式：`[D-XX] RCCM - <问题名称>: RC + Short-Term CM + Long-Term CM`

**详细框架**: 参见 [Agent Configuration](./.claude/agent_config.md) RCCM 区块

---

## 📋 决策分类与层级映射（D-53 决策，2025-10-12）

**核心原则**：一次决策，三层同步（Layer 1-决策记录层、Layer 2-文档指导层、Layer 3-Agent 配置执行层）

**快速参考表 - 关键词→文件映射**：

| 决策类型 | 触发关键词 | Layer 1 | Layer 2 | Layer 3 | 优先级 |
|---------|----------|---------|---------|---------|--------|
| **规则变更** | ` !规则变更` / ` !请长期记忆` | progress.md | CLAUDE.md | agent 配置 | P0 |
| **架构调整** | ` !架构调整` / ` !重构` | progress.md | architecture_guide.md | - | P0 |
| **工作流优化** | ` !工作流优化` | progress.md | workflow_rules.md | agent 配置 | P1 |
| **成本策略** | ` !成本优化` | progress.md | cost_optimization.md | agent 配置 | P1 |
| **Agent 行为** | ` !Agent更新` | progress.md | agent_config.md | `.claude/agents/*.md` | P0 |

**标准执行流程**：
1. **决策确认**：Claude 说明决策内容、影响范围、需要更新的层级（1/2/3），等待用户确认
2. **Layer 1 - 决策记录**：立即调用 progress-recorder agent，记录到 progress.md Decisions
3. **Layer 2 - 文档指导**：更新相关文档（CLAUDE.md 等）
4. **Layer 3 - Agent 配置**：更新 agent 配置（如适用，仅 P0 决策）
5. **验证**：在 progress.md 中标记"✅ 3层同步完成"，列出更新的文件和行号

**验证方式**：
- 下次相关操作时，Claude 会检查 Layer 3（agent 配置）是否包含新规则
- 用户可通过关键词搜索验证 3 个层级是否同步

**详细决策内容**: 参见 `progress.md` D-53 决策

---

## 📚 历史更新记录

**详细更新记录**: [`docs/CHANGELOG.md`](./docs/CHANGELOG.md)

**最近重要更新**（快速参考）：
- **2025-10-20**: D-68 决策 - 跨项目端口保护机制（严禁误杀其他项目进程，使用安全清理脚本）
- **2025-10-14**: D-63 决策完成 - 语音与文字流同步机制（Synctxt&voice v1.0）+ 提示词优化（Token 节省 62%）
- **2025-10-11**: CLAUDE.md 模块化完成（精简至 ~270 行，拆分为 6 个专题模块）
- **2025-10-10**: 精简 CLAUDE.md（移除重复内容和历史记录），优化文件结构
- **2025-10-10**: progress.md 归档完成（移除 2025-10-09 之前的历史记录）
- **2025-10-10**: Night-Auth 协议确立，确保无间断工作
- **2025-10-09**: 三阶段交付计划确立，简化协同机制
- **2025-10-03**: v8 深度优化版发布，16角色提示词全面打磨

**查看完整历史**: 请阅读 `docs/CHANGELOG.md` 文件

---

## 🎨 设计规范（全局要求）

### 苹果风格设计规范

**核心原则：所有界面遵循苹果/Apple公司风格，优美！**

**适用范围**：
- 多魔汰系统（duomotai/）
- 百问自测系统（html/projects/media-assessment-*.html）
- 所有前端界面（index.html、baiwen.html、Projects.html）

**8大设计要点**：
1. 简洁性：简洁明了，去除冗余元素
2. 圆角：12px-16px
3. 柔和阴影：避免生硬边框
4. 高品质字体：SF Pro Display / SF Pro Text / -apple-system
5. 渐变色：增强视觉层次
6. 响应式：移动端自适应
7. 动画：流畅的过渡动画（transition/transform）
8. 留白：充分利用空白区域

**颜色方案（多魔汰系统）**：
- 核心蓝：#007AFF（iOS 系统蓝）
- 外部红：#FF3B30（iOS 警告红）
- 价值绿：#34C759（iOS 成功绿）
- 背景暖米白：#FFFAF0（模态框背景）

**详细设计规范**: 参见 [Deployment & Security](./.claude/deployment_security.md)

---

**Last Updated**: 2025-11-04 05:35 (GMT+8) - 统一启动脚本：start.ps1, start_frontend.ps1, start_backend.ps1
