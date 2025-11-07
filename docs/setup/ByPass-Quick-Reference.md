# ByPass 模式快速参考

## 📍 核心答案

### 1️⃣ 快捷切换 - ✅ 已实现

类似 `acceptEdits` 的切换机制：

```bash
# 开启完全自动模式
node .claude/toggle-bypass.js ON

# 关闭（需要手动批准）
node .claude/toggle-bypass.js OFF

# 查看当前状态
node .claude/toggle-bypass.js STATUS
```

### 2️⃣ 局部配置 - ✅ 已确认

**当前配置完全是局部的！**

- ✅ 只影响 `D:\_100W\rrxsxyz_next` 项目
- ✅ 不影响 `C:\Users\rrxs` 或其他项目
- ✅ 配置存储在 `.claude.json` 的 `projects` 段

```json
// C:\Users\rrxs\.claude.json
{
  "projects": {
    "D:\\_100W\\rrxsxyz_next": {  // ← 仅此项目
      "allowedTools": { ... }
    },
    "C:\\Users\\rrxs": {           // ← 其他项目不受影响
      "allowedTools": []
    }
  }
}
```

---

## 🚀 快捷使用方法

### 方法 1：直接命令（最简单）

```bash
cd D:\_100W\rrxsxyz_next

# 开启/关闭
node .claude/toggle-bypass.js ON
node .claude/toggle-bypass.js OFF
```

### 方法 2：PowerShell 别名（推荐）

编辑 `$PROFILE`，添加：

```powershell
function bpon { node D:\_100W\rrxsxyz_next\.claude\toggle-bypass.js ON }
function bpoff { node D:\_100W\rrxsxyz_next\.claude\toggle-bypass.js OFF }
function bps { node D:\_100W\rrxsxyz_next\.claude\toggle-bypass.js STATUS }
```

使用：
```bash
bpon    # 开启
bpoff   # 关闭
bps     # 状态
```

### 方法 3：VS Code 快捷键

在 `keybindings.json` 中：

```json
{
  "key": "ctrl+alt+b",
  "command": "workbench.action.terminal.sendSequence",
  "args": {
    "text": "node .claude/toggle-bypass.js ON\u000D"
  }
}
```

---

## 📊 当前状态（2025-10-12 已确认生效）

```
✅ ByPass 模式: ON (底层配置)
✅ Accept Edits: ON (Shift+Tab 切换)
✅ 自动批准工具: 11 个
   - Read, Write, Edit
   - Glob, Grep, Bash
   - Task, WebFetch, WebSearch
   - NotebookEdit, TodoWrite

✅ 影响范围: 仅 D:\_100W\rrxsxyz_next
✅ 配置文件: C:\Users\rrxs\.claude.json (line 645-676)
✅ 模式状态: Night-Auth FULL (完全无间断)
```

---

## ⚠️ 重要提醒

1. **每次切换后需要重启 Claude Code**
   ```bash
   exit
   claude-code
   ```

2. **状态文件位置**
   - `.claude/bypass.status` - 存储当前状态 (ON/OFF)
   - `.claude/toggle-bypass.js` - 切换脚本

3. **日志记录**
   - 所有切换操作记录在 `.claude/sync-guard.log`

---

## 🆚 对比 AcceptEdits

| 特性 | AcceptEdits | ByPass Mode |
|------|-------------|-------------|
| 自动批准编辑 | ✅ | ✅ |
| 自动批准读取 | ❌ | ✅ |
| 自动批准 Bash | ❌ | ✅ |
| 自动批准搜索 | ❌ | ✅ |
| 自动批准网络 | ❌ | ✅ |
| **覆盖范围** | 编辑操作 | **所有工具** |

**结论：ByPass 模式比 AcceptEdits 更强大！**

---

## 📁 相关文件

```
D:\_100W\rrxsxyz_next\
├── .claude/
│   ├── toggle-bypass.js       # 切换脚本
│   ├── bypass.status          # 当前状态 (ON/OFF)
│   ├── toggle-acceptEdits.js  # AcceptEdits 切换脚本
│   └── acceptEdits.status     # AcceptEdits 状态
├── create ByPass Setting.md   # 详细配置说明
└── (此文件)                   # 快速参考

C:\Users\rrxs\
└── .claude.json               # 全局配置文件 (line 637-651)
```

---

## 🚀 Night-Auth FULL 模式（已确认）

### 当前运行状态

**配置层（永久）：**
```
ByPass ON → 所有工具自动批准
```

**UI 层（Shift+Tab 切换）：**
```
Accept Edits ON → 编辑直接应用，不显示 diff
```

**最终效果：**
```
🔥 Night-Auth FULL 模式
   ├─ 所有读取/搜索/Bash → 自动执行，无提示
   ├─ 所有编辑/写入 → 直接应用，无 diff
   └─ 完全无间断工作流 ✅
```

### 验证方式

重启后在 Claude Code 底部应看到：
```
accept edits on (shift+tab to cycle)
```

如果显示其他状态，按 **Shift+Tab** 循环到 "accept edits on"

---

## 🎯 使用建议

### 日常使用（推荐）
- **保持 ByPass ON** - 自动加载，无需操作
- **保持 Accept Edits ON** - 重启后手动 Shift+Tab 切换

### 临时需要审查时
- **关闭 Accept Edits** - Shift+Tab 切换到 Normal
  - 效果：编辑时显示 diff，其他仍自动执行

### 完全关闭自动化
```bash
node .claude/toggle-bypass.js OFF
exit
claude-code
```

---

*最后更新: 2025-10-12 23:40*
*状态确认: Night-Auth FULL 模式已生效 ✅*
