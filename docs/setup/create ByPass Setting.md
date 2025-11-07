# Claude Code 完全 ByPass 模式配置指南

## 📍 配置文件位置

**配置文件路径：**
```
C:\Users\rrxs\.claude.json
```

> 注：这是 Claude Code 的全局配置文件，所有项目配置都在此文件中

---

## 📝 配置步骤

### 步骤 1：定位项目配置段

在 `.claude.json` 文件中找到对应项目的配置段：

```json
"D:\\_100W\\rrxsxyz_next": {
  "allowedTools": [],
  ...
}
```

**位置：** 第 629-642 行

---

### 步骤 2：修改前配置（原始）

```json
"D:\\_100W\\rrxsxyz_next": {
  "allowedTools": [],  // ← 空数组，每次操作都需要手动批准
  "history": [...]
}
```

---

### 步骤 3：修改后配置（ByPass 模式）

```json
"D:\\_100W\\rrxsxyz_next": {
  "allowedTools": {
    "Read": ["**"],           // 自动批准所有文件读取
    "Write": ["**"],          // 自动批准所有文件写入
    "Edit": ["**"],           // 自动批准所有文件编辑
    "Glob": ["**"],           // 自动批准所有文件搜索
    "Grep": ["**"],           // 自动批准所有内容搜索
    "Bash": ["**"],           // 自动批准所有命令执行
    "Task": ["**"],           // 自动批准所有 Agent 任务
    "WebFetch": ["**"],       // 自动批准所有网络抓取
    "WebSearch": ["**"],      // 自动批准所有网络搜索
    "NotebookEdit": ["**"],   // 自动批准所有笔记本编辑
    "TodoWrite": ["**"]       // 自动批准所有待办事项操作
  },
  "history": [...]
}
```

---

## 🔧 手动配置方法

### 方法 1：使用文本编辑器

1. 打开文件：`C:\Users\rrxs\.claude.json`
2. 搜索：`"D:\\_100W\\rrxsxyz_next"`
3. 将 `"allowedTools": []` 替换为上述完整配置
4. 保存文件
5. 重启 Claude Code

### 方法 2：使用 Claude Code 命令

```bash
# 1. 读取当前配置
claude-code config show

# 2. 编辑配置文件
code "C:\Users\rrxs\.claude.json"

# 3. 修改后重启
exit
claude-code
```

---

## ✅ 验证配置生效

配置生效后，在 `D:\_100W\rrxsxyz_next` 项目下：

- ✅ 所有工具调用无需确认，立即执行
- ✅ 终端不会弹出 "Allow/Deny" 提示
- ✅ Claude 可以连续执行多个操作
- ✅ 真正实现 "Night-Auth FULL 状态"

---

## 📋 配置说明

### 通配符 `**` 的含义

- `["**"]` = 匹配所有路径和文件
- `["src/**"]` = 只匹配 src 目录下的文件
- `["*.js"]` = 只匹配 .js 文件
- `["!node_modules/**"]` = 排除 node_modules 目录

### 安全建议

如果需要更精细的控制，可以限制特定路径：

```json
"allowedTools": {
  "Read": ["**"],                    // 读取全部允许
  "Edit": ["src/**", "docs/**"],     // 只允许编辑 src 和 docs
  "Write": ["src/**", "!src/config/**"], // 允许写入 src，但排除 config
  "Bash": [                          // 只允许特定命令
    "npm test",
    "npm run dev",
    "git status",
    "git diff"
  ]
}
```

---

## 🔄 恢复默认配置

如需禁用 ByPass 模式，将配置改回：

```json
"D:\\_100W\\rrxsxyz_next": {
  "allowedTools": [],
  ...
}
```

---

## 📅 配置时间

- **配置日期：** 2025-10-12
- **配置文件：** C:\Users\rrxs\.claude.json
- **项目路径：** D:\_100W\rrxsxyz_next
- **生效状态：** ✅ 已启用（需重启 Claude Code）

---

## 🎯 关键要点

1. **不需要手动创建 agents** - 这是配置文件设置，不是 agent
2. **比 "AcceptEdits" 更强大** - 覆盖所有工具类型
3. **必须重启 Claude Code** - 配置才能生效
4. **项目级别配置（局部）** - ✅ 只影响 `D:\_100W\rrxsxyz_next`，不影响其他项目

---

## 🔄 快捷切换 ByPass 模式

### 方法 1：使用切换脚本（类似 acceptEdits）

已创建 `toggle-bypass.js` 脚本，位于：
```
D:\_100W\rrxsxyz_next\.claude\toggle-bypass.js
```

**使用方法：**
```bash
# 开启 ByPass 模式
node .claude/toggle-bypass.js ON

# 关闭 ByPass 模式
node .claude/toggle-bypass.js OFF

# 查看当前状态
node .claude/toggle-bypass.js STATUS
```

### 方法 2：创建快捷别名

在 PowerShell 配置文件中添加别名：

**1. 编辑 PowerShell 配置：**
```powershell
notepad $PROFILE
```

**2. 添加别名：**
```powershell
# ByPass mode shortcuts
function bypass-on { node D:\_100W\rrxsxyz_next\.claude\toggle-bypass.js ON }
function bypass-off { node D:\_100W\rrxsxyz_next\.claude\toggle-bypass.js OFF }
function bypass-status { node D:\_100W\rrxsxyz_next\.claude\toggle-bypass.js STATUS }

# Short aliases
Set-Alias bpon bypass-on
Set-Alias bpoff bypass-off
Set-Alias bps bypass-status
```

**3. 重新加载配置：**
```powershell
. $PROFILE
```

**4. 使用快捷命令：**
```bash
bpon      # 开启 ByPass
bpoff     # 关闭 ByPass
bps       # 查看状态
```

### 方法 3：通过 VS Code 快捷键（可选）

如果在 VS Code 中使用 Claude Code，可以绑定快捷键：

**1. 打开 keybindings.json：**
- `Ctrl+Shift+P` → "Preferences: Open Keyboard Shortcuts (JSON)"

**2. 添加快捷键绑定：**
```json
[
  {
    "key": "ctrl+alt+b",
    "command": "workbench.action.terminal.sendSequence",
    "args": {
      "text": "node .claude/toggle-bypass.js ON\u000D"
    },
    "when": "terminalFocus"
  },
  {
    "key": "ctrl+alt+shift+b",
    "command": "workbench.action.terminal.sendSequence",
    "args": {
      "text": "node .claude/toggle-bypass.js OFF\u000D"
    },
    "when": "terminalFocus"
  }
]
```

### 方法 4：通过 Claude Code 自定义命令

创建 slash command：

**创建文件：** `.claude/commands/bypass.md`
```bash
mkdir -p .claude/commands
echo "Execute: node .claude/toggle-bypass.js ${1:-STATUS}" > .claude/commands/bypass.md
```

**使用：**
```
/bypass ON
/bypass OFF
/bypass STATUS
```

---

## ⚠️ 重要说明

### 局部 vs 全局配置

✅ **当前配置是局部的：**
- 只影响 `D:\_100W\rrxsxyz_next` 项目
- 其他项目（如 `C:\Users\rrxs`）仍需手动批准
- 配置存储在 `.claude.json` 的 `projects` 段中

**验证局部配置：**
```bash
# 在其他目录测试
cd C:\Users\rrxs
claude-code
# → 此处仍需手动批准

# 在项目目录测试
cd D:\_100W\rrxsxyz_next
claude-code
# → 此处自动批准（ByPass 生效）
```

### 切换 ByPass 后需要重启

**重要：** 每次切换 ByPass 模式后，必须重启 Claude Code：
```bash
exit           # 退出当前会话
claude-code    # 重新启动
```

---

## 🚀 快速重启命令

```bash
# Windows
exit
claude-code

# 或在新终端中
cd D:\_100W\rrxsxyz_next
claude-code
```

---

*配置完成！现在您可以享受完全无间断的 Claude Code 工作流程。*
