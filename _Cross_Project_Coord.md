# 跨项目协调文档 (Cross-Project Coordination)

**创建时间**: 2025-10-20
**责任项目**: AnyRouter_Refresh (ABR)
**状态**: ⏳ 待ABR项目统一处理
**关联项目**: rrxsxyz_next, AnyRouter_Refresh, mx_kc_gl

---

## 📋 文档目的

本文档记录了在 rrxsxyz_next 项目会话中发现的跨项目协调问题，包括：
- 多IDE同时运行配置指南
- 端口隔离规则
- **D-68 跨项目端口保护机制（重要）**
- 项目安全隔离审计发现
- viber_start.cmd 自启动问题根因分析

**所有待处理任务已移交给 AnyRouter_Refresh (ABR) 项目统一处理。**

---

## 🔧 多IDE同时运行配置指南

### 问题背景
用户在同一台机器上同时运行2~3个IDE（VSCode/VSCodium），通过CCA (Claude Code AnyRouter)登录，需要明确环境配置隔离策略。

### 核心结论

✅ **ANTHROPIC_BASE_URL / ANTHROPIC_AUTH_TOKEN 可以共享**
- 所有项目使用同一个 Claude API 凭证
- 配置方式：全局环境变量（PowerShell Profile 或系统环境变量）
- **无需为每个项目配置不同的 TOKEN**

✅ **关键隔离点：端口配置**
- 每个项目必须在自己的 `.env` 文件中配置独立的端口
- 端口配置是项目隔离的核心机制

### 推荐配置方式

**Layer 1 - 全局环境变量（一次设置）**
```powershell
# 在 PowerShell Profile 中设置
$env:ANTHROPIC_API_KEY = "sk-xxx"
$env:ANTHROPIC_BASE_URL = "https://api.anthropic.com"
```

**Layer 2 - 项目级 .env（每个项目独立）**
```bash
# rrxsxyz_next/server/.env
PORT=3001

# AnyRouter_Refresh/arb_web_api/.env
PORT=6001

# mx_kc_gl/backend/.env
PORT=7001
```

---

## 🔢 端口分配规则（D-65 决策）

**决策时间**: 2025-10-18
**决策文件**: `CLAUDE.md` D-65 决策

### 端口隔离机制

| 项目 | 端口范围 | 后端端口 | 前端端口 | 状态 |
|------|---------|---------|---------|------|
| **rrxsxyz_next** | 3000~3999, 8000~8999 | 3001 | 8080 | ✅ 已配置 |
| **AnyRouter_Refresh** | 6000~6999 | 6001 (建议) | 6080 (建议) | ⚠️ 需验证 |
| **mx_kc_gl** | 7000~7999 | 7001 (建议) | 7080 (建议) | 🔴 未配置 |

### 规则说明
- 各项目端口彼此错开，避免开发时冲突
- Windows 系统本身保留端口除外
- 禁止跨项目使用其他项目的端口段

### 待ABR处理任务

**Task 1**: 验证 AnyRouter_Refresh 端口配置
```bash
# 检查文件：D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\AnyRouter_Refresh\arb_web_api\.env
# 确认 PORT 值是否在 6000-6999 范围内
```

**Task 2**: 为 mx_kc_gl 创建端口配置
```bash
# 创建文件：D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCodium\mx_kc_gl\backend\.env
PORT=7001
NODE_ENV=development
```

---

## 🛡️ D-68 跨项目端口保护机制（重要）

**决策时间**: 2025-10-20
**决策编号**: D-68
**状态**: ✅ 已实现（脚本已创建，规则已写入 CLAUDE.md）

### 问题背景

**2025-10-20 误杀事件**:
- **场景**: 清理 rrxsxyz_next 项目的僵尸进程时
- **差点执行的命令**: `taskkill /F /IM node.exe`
- **后果**: 会无差别杀死所有 Node.exe 进程，包括：
  - VSCode 上的 RRXS.XYZ 项目 ✅ 目标进程
  - VSCodium 上的 ARR (AnyRouter_Refresh) 项目 ❌ 误杀
  - VSCodium 上的 MXKC (mx_kc_gl) 项目 ❌ 误杀
- **用户反馈**: "刚才又两个(VSC_CCA和VSCd_CCA)都被中断跳出到PS界面了?, 是你错杀了了吧"

### IDE-项目映射关系

| IDE | 项目 | 端口段 | 说明 |
|-----|------|--------|------|
| **VSCode (VSC)** | RRXS.XYZ (多魔汰) | 3000-3999, 8000-8999 | 一对一独占 |
| **VSCodium (VSCd)** | AnyRouter_Refresh (ARR) | 6000-6999 | 共享IDE |
| **VSCodium (VSCd)** | mx_kc_gl (MXKC) | 7000-7999 | 共享IDE |

**核心原则**: 各项目清理端口时，**仅清理本项目进程，严禁清理其他项目进程**

### 解决方案：安全清理工具

**脚本位置**: `rrxsxyz_next/scripts/safe_port_cleanup.ps1`

**核心功能**:
1. ✅ **智能识别**: 通过工作目录路径或端口段自动识别进程所属项目
2. ✅ **分类显示**:
   - 本项目进程（将清理）
   - 其他项目进程（保护，仅警告）
   - 无法识别的进程（保护）
3. ✅ **人工确认**: 清理前显示详细报告，需用户按 [Y] 确认
4. ✅ **清理验证**: 清理后再次检查，确认其他项目进程仍在运行

**使用方法**:
```powershell
# 清理 rrxsxyz_next 项目进程
powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1

# 清理其他项目（需在各自项目目录执行）
powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1 -ProjectName "AnyRouter_Refresh"
powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1 -ProjectName "mx_kc_gl"
```

**输出示例**:
```
============================================
  安全端口清理工具 (D-68)
  当前项目: rrxsxyz_next (多魔汰)
============================================

【本项目端口段】
  3000-3999, 8000-8999

【Node.exe进程分析】

【本项目进程 - 将清理】
  ❌ PID 1234 (端口 3001) - 内存 50MB

【其他项目进程 - 仅警告，不清理】
  ⚠️  PID 7572 [AnyRouter_Refresh (ARB)] (端口 6001) - 内存 80MB
  ⚠️  PID 7512 [mx_kc_gl] (端口 7001) - 内存 60MB

【清理计划】
  本项目进程: 1 个 (将清理)
  其他项目进程: 2 个 (保护)
  无法识别进程: 0 个 (保护)

⚠️  即将清理 1 个本项目进程
按 [Y] 确认清理, 按其他键取消...
```

### 禁止使用的危险命令

**❌ 禁止**（会杀死所有Node进程）:
```bash
taskkill /F /IM node.exe
```

**✅ 替代方案**（安全清理）:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/safe_port_cleanup.ps1
```

### CLAUDE.md 规则更新

已更新 `CLAUDE.md` Rule 4 → Rule 5:
- ❌ Rule 4 已废弃（使用 taskkill 无差别清理）
- ✅ Rule 5 新增（D-68 安全清理机制）

**详见**: `CLAUDE.md` 第 101-146 行

### 待ABR移植任务

**Task ID**: T11 (P1)
**任务**: 将 `safe_port_cleanup.ps1` 脚本移植到 AnyRouter_Refresh 和 mx_kc_gl 项目
**步骤**:
1. 复制脚本到各项目 `scripts/` 目录
2. 更新各项目的 CLAUDE.md（如有）
3. 测试脚本在各项目中的正确识别

---

## 🔒 项目隔离审计发现（D-67 审计）

**审计时间**: 2025-10-20
**审计人**: Claude Code
**综合评分**: 34/100（需要改进）

### 关键安全发现

#### 🔴 P0 - 跨项目读取权限配置

**位置**: `rrxsxyz_next/.claude/settings.local.json:44`

```json
"Read(//d/OneDrive_RRXS/OneDrive/_AIGPT/VSCodium/AnyRouter_Refresh/**)"
```

**风险**:
- ✅ 仅为只读权限（无写入风险）
- ❌ 违反项目隔离原则
- ❌ 可能无意中读取敏感配置（.env, API keys）
- ❌ 使用通配符 `**`，可读取整个 AnyRouter_Refresh 项目

**建议**:
- **选项A**: 删除该权限配置（推荐）
- **选项B**: 限制为特定文件，如 `Read(...AnyRouter_Refresh/README.md)`
- **选项C**: 保留但添加审计日志

#### 🔴 P0 - mx_kc_gl 缺少端口配置

**现状**: 未找到 `backend/.env` 文件

**风险**:
- 端口未隔离，可能与其他项目冲突
- 服务启动时使用默认端口（通常为3000），与 rrxsxyz_next 冲突

**建议**: 创建 `.env` 文件并配置 PORT=7001

#### 🟡 P1 - AnyRouter_Refresh, mx_kc_gl 缺少写入保护机制

**现状**:
- ❌ 无 `.githooks/pre-commit` 钩子
- ❌ 无 `atomicWrite.js` 脚本
- ❌ 无 `.claude/settings.local.json` 权限控制

**对比 rrxsxyz_next**:
- ✅ 3层写入保护机制（L1-脚本层、L2-权限层、L3-Git层）
- ✅ 防止文件损坏和跨项目写入

**建议**:
- **方案A - 轻量级保护**（推荐给非核心项目）：仅配置 `.claude/settings.local.json`
- **方案B - 完整保护**（推荐给核心项目）：复制 rrxsxyz_next 的三层机制

### 项目隔离评分

| 检查维度 | rrxsxyz_next | AnyRouter_Refresh | mx_kc_gl |
|---------|-------------|------------------|---------|
| 端口隔离 | ✅ 100% | ⚠️ 60% (需验证) | 🔴 0% |
| 写入保护 | ✅ 100% (3层) | 🔴 0% | 🔴 0% |
| 跨项目访问控制 | 🔴 50% (有漏洞R1) | ✅ 100% | ✅ 100% |
| **综合评分** | **67/100** | **17/100** | **17/100** |

---

## 🔍 viber_start.cmd 自启动问题根因分析

**发现时间**: 2025-10-20
**分析方法**: 10Why 根因分析

### 问题描述
系统重启后，发现启动文件夹中存在 `viber_start.cmd` 自动运行脚本：
- **位置**: `C:\Users\rrxs\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\viber_start.cmd`
- **创建时间**: 2025-10-05 04:40
- **目标脚本**: `D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCode\100W\rrxsxyz_next\Team\Viber\parallel run.ps1`

### 根因分析结果

| 层级 | Why | 根因 |
|-----|-----|------|
| **Why 1** | 为什么有自启动？ | Viber 项目被配置为系统启动项 (2025-10-05) |
| **Why 2** | 为什么要设为启动项？ | Viber 曾是活跃项目，需要后台运行 |
| **Why 3** | 为什么需要后台运行？ | 项目架构设计中Viber被规划为并行执行模块（CPG角色） |
| **Why 4** | 为什么后来改为存档？ | 需求变更：项目Rescope，砍掉50%功能 (2025-10-09) |
| **Why 5** | 为什么没有删除启动脚本？ | 启动脚本与项目Rescope决策未同步 |
| **Why 6-10** | 更深层原因 | 缺乏"架构调整→系统配置同步"的流程机制 |

### 直接原因
- Viber模块在 2025-10-05 被配置为系统启动项
- 2025-10-09 Rescope决策将其存档（移动到 `team/viber_archive/`）
- **启动脚本未被同时删除** → 系统重启时自动触发

### 根本原因
1. **决策执行不完整**：Rescope决策未包含"清理依赖资源"步骤
2. **工作流缺陷**：缺乏"架构调整→系统配置同步"的追踪机制
3. **审计盲点**：无定期检查启动项和后台任务的流程

### 短期对策
```powershell
# 删除启动脚本
Remove-Item "C:\Users\rrxs\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\viber_start.cmd"

# 验证删除
Get-ChildItem "C:\Users\rrxs\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup" | Where-Object {$_.Name -like "*viber*"}
```

### 长期对策
1. **工作流改进**（P1）：Rescope/架构调整决策必须包含系统启动项审计
2. **Agent配置增强**（P1）：新增触发词 ` !项目存档` → 自动检查启动项状态
3. **定期审计**（P2）：每月第一个周一运行系统审计脚本

---

## 📝 待ABR项目处理的任务清单

### 🔴 P0 任务（立即处理）

| 任务ID | 任务描述 | 负责项目 | 预计工时 | 优先级 |
|--------|---------|---------|---------|--------|
| **T1** | 删除 viber_start.cmd 启动脚本 | rrxsxyz_next | 5分钟 | 🔴 P0 |
| **T2** | 删除/限制跨项目读取权限（settings.local.json:44） | rrxsxyz_next | 10分钟 | 🔴 P0 |
| **T3** | 为 mx_kc_gl 创建 `.env` 端口配置 | mx_kc_gl | 10分钟 | 🔴 P0 |

### 🟡 P1 任务（本周完成）

| 任务ID | 任务描述 | 负责项目 | 预计工时 | 优先级 |
|--------|---------|---------|---------|--------|
| **T4** | 验证 AnyRouter_Refresh 端口配置 | AnyRouter_Refresh | 15分钟 | 🟡 P1 |
| **T5** | 为 AnyRouter_Refresh 部署基础隔离机制 | AnyRouter_Refresh | 1小时 | 🟡 P1 |
| **T6** | 为 mx_kc_gl 部署基础隔离机制 | mx_kc_gl | 1小时 | 🟡 P1 |
| **T7** | 建立跨项目访问审计机制 | ABR | 30分钟 | 🟡 P1 |

### 🟢 P2 任务（长期优化）

| 任务ID | 任务描述 | 负责项目 | 预计工时 | 优先级 |
|--------|---------|---------|---------|--------|
| **T8** | 定期审计系统启动项（每月） | ABR | 10分钟/月 | 🟢 P2 |
| **T9** | 完善 CLAUDE.md 项目隔离规则（D-67决策） | 所有项目 | 30分钟 | 🟢 P2 |
| **T10** | 为非核心项目部署完整写入保护机制（可选） | AnyRouter_Refresh, mx_kc_gl | 2-3小时 | 🟢 P2 |

---

## 📚 参考文档

### rrxsxyz_next 项目文档
- `CLAUDE.md` - 项目配置主文档
- `CLAUDE.md` D-65 决策 - 端口分配规则（2025-10-18）
- `.claude/settings.local.json` - 权限配置
- `.githooks/pre-commit` - Git 钩子（L3 Git层保护）
- `scripts/atomicWrite.js` - 原子写入脚本（L1 脚本层保护）
- `scripts/atomicWriteSafe.js` - 安全写入包装器

### AnyRouter_Refresh 项目
- （待补充）端口配置位置
- （待补充）项目架构文档

### mx_kc_gl 项目
- （待补充）项目架构文档

---

## 🎯 推荐决策（供ABR项目参考）

### 决策A：跨项目读取权限

**选项1**: 删除权限（推荐）
- ✅ 符合项目隔离原则
- ✅ 消除敏感信息泄漏风险
- ❌ 失去跨项目配置联调能力

**选项2**: 限制权限范围
- ⚠️ 保留但限制为特定文件（如 README.md）
- ⚠️ 需要明确业务需求

**选项3**: 保留但加强审计
- ❌ 不推荐（风险仍存在）

### 决策B：其他项目隔离机制

**选项1**: 轻量级保护（推荐给非核心项目）
- 仅配置 `.claude/settings.local.json` 限制写入范围
- 工作量：每个项目 10-15 分钟

**选项2**: 完整保护（推荐给核心项目）
- 复制 rrxsxyz_next 的三层保护机制
- 工作量：每个项目 2-3 小时

**选项3**: 暂不处理
- ⚠️ 仅当项目不活跃或即将下线时考虑

---

## 📞 联系方式

**文档维护**: rrxsxyz_next 项目
**执行责任**: AnyRouter_Refresh (ABR) 项目
**审计周期**: 每月第一个周一
**下次审计**: 2025-11-04

---

**最后更新**: 2025-10-20
**文档版本**: v1.0
**状态**: ⏳ 待ABR处理
