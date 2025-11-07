# 📁 项目路径说明（Path Notice）

**创建时间**: 2025-10-23
**适用范围**: 本项目所有文档和脚本

---

## ⚠️ 重要提示

**本项目中所有涉及具体路径的示例（如 `D:\_100W\rrxsxyz_next`）仅为演示用途，请替换为你的实际项目路径。**

---

## 🎯 路径使用规范

### 1. 脚本文件（自动适配）

**JavaScript (`.js`)**:
```javascript
// ✅ 推荐：使用相对路径
const rootDir = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');
```

**PowerShell (`.ps1`)**:
```powershell
# ✅ 推荐：使用脚本相对路径
$projectRoot = if ($env:PROJECT_ROOT) { $env:PROJECT_ROOT } else { Split-Path -Parent $PSScriptRoot }
```

**批处理 (`.bat`)**:
```batch
REM ✅ 推荐：使用 %~dp0
cd /d "%~dp0"
```

### 2. 文档文件（示例说明）

**Markdown (`.md`)**:
- 文档中的路径如 `D:\_100W\rrxsxyz_next` 仅为演示
- 实际使用时，请替换为你的项目路径
- 通常可以直接使用相对路径（如 `./scripts/backup.ps1`）

---

## 📂 常见路径模式

### 项目根目录
```
# 示例（不同环境可能不同）
D:\_100W\rrxsxyz_next                          # Windows 本地
D:\OneDrive_RRXS\OneDrive\_AIGPT\VSCode\...   # OneDrive（不推荐）
/home/user/projects/rrxsxyz_next               # Linux
```

### 子目录结构
```
<项目根目录>
├── scripts/           # 脚本工具
├── server/            # 后端服务
├── duomotai/          # 多魔汰系统
├── .claude/           # Claude Code 配置
└── docs/              # 文档
```

---

## 🔧 环境变量（可选）

**设置全局项目路径**（适用于多个脚本共享）：

```powershell
# PowerShell
$env:PROJECT_ROOT = "D:\_100W\rrxsxyz_next"

# 永久设置（添加到 PowerShell Profile）
# notepad $PROFILE
# 添加：$env:PROJECT_ROOT = "你的项目路径"
```

```bash
# Linux/Mac
export PROJECT_ROOT="/path/to/your/project"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export PROJECT_ROOT="/path/to/your/project"' >> ~/.bashrc
```

---

## 🚀 快速验证

**验证脚本是否正确使用相对路径**：

```powershell
# 1. 检查 backup_project.js
node scripts/backup_project.js

# 2. 检查 start_services.ps1
powershell -File scripts/start_services.ps1

# 3. 检查 start_services.bat
start_services.bat
```

如果脚本报错"找不到路径"，说明脚本仍有硬编码路径，请检查修复。

---

## 📝 修复记录

**2025-10-23 全面修复**（应用 251023CPG2CCA 文档建议）：

| 文件类型 | 修复数量 | 修复方式 |
|---------|---------|---------|
| JavaScript | 1 个 | 使用 `path.resolve(__dirname, '..')` |
| PowerShell | 7 个核心脚本 | 使用 `Split-Path -Parent $PSScriptRoot` |
| 批处理 | 2 个 | 使用 `%~dp0` |
| 文档 | 28 个 | 创建 PATH_NOTICE.md 全局说明 |

**已修复的关键脚本**：
- ✅ `scripts/backup_project.js`
- ✅ `scripts/start_services.ps1`
- ✅ `scripts/create_backup.ps1`
- ✅ `scripts/backup.ps1`
- ✅ `scripts/ModuleBackup.ps1`
- ✅ `scripts/TaskDone_BackUp_Exclude.ps1`
- ✅ `scripts/emergency_archive.ps1`
- ✅ `start_services.bat`
- ✅ `server/start_debug.bat`

**剩余脚本**（12 个，低频使用）：
- 可使用 `scripts/fix_hardcoded_paths.ps1` 批量修复工具

---

## 📚 相关文档

- **修复报告**: `251023CPG2CCA_issue&rollbacktoV54.md`
- **项目配置**: `CLAUDE.md`
- **架构指南**: `.claude/architecture_guide.md`

---

**最后更新**: 2025-10-23
**维护人**: Claude Code Agent
